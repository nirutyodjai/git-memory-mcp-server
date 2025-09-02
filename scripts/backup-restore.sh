#!/bin/bash

# Git Memory MCP Server - Backup and Restore Script
# This script provides comprehensive backup and restore functionality
# for database, Redis, application data, and configuration files

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/backup-restore-$(date +%Y%m%d-%H%M%S).log"
BACKUP_ID="backup-$(date +%Y%m%d-%H%M%S)"

# Backup configuration
BACKUP_BASE_DIR="$PROJECT_ROOT/backups"
BACKUP_DIR="$BACKUP_BASE_DIR/$BACKUP_ID"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
MONITORING_COMPOSE_FILE="docker-compose.monitoring.yml"
RETENTION_DAYS=30
COMPRESSION_LEVEL=6
ENCRYPTION_ENABLED=true
REMOTE_BACKUP_ENABLED=false

# Database configuration
DB_CONTAINER="postgres"
DB_NAME="git_memory_prod"
DB_USER="git_memory_user"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"

# Redis configuration
REDIS_CONTAINER="redis"

# Remote backup configuration (if enabled)
REMOTE_BACKUP_HOST="${BACKUP_HOST:-}"
REMOTE_BACKUP_USER="${BACKUP_USER:-}"
REMOTE_BACKUP_PATH="${BACKUP_PATH:-}"
REMOTE_BACKUP_KEY="${BACKUP_SSH_KEY:-}"

# S3 backup configuration (if enabled)
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
S3_REGION="${S3_BACKUP_REGION:-ap-southeast-1}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"

# Encryption configuration
ENCRYPTION_KEY_FILE="$PROJECT_ROOT/.backup_key"
ENCRYPTION_PASSPHRASE="${BACKUP_ENCRYPTION_PASSPHRASE:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
    log "INFO" "$*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
    log "SUCCESS" "$*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
    log "WARNING" "$*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
    log "ERROR" "$*"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $*"
    log "STEP" "$*"
}

# Utility functions
get_timestamp() {
    date -Iseconds
}

get_file_size() {
    local file="$1"
    if [ -f "$file" ]; then
        du -h "$file" | cut -f1
    else
        echo "0B"
    fi
}

check_disk_space() {
    local required_space_gb="$1"
    local available_space=$(df "$BACKUP_BASE_DIR" | awk 'NR==2 {print int($4/1024/1024)}')
    
    if [ "$available_space" -lt "$required_space_gb" ]; then
        log_error "Insufficient disk space. Required: ${required_space_gb}GB, Available: ${available_space}GB"
        return 1
    fi
    
    log_info "Disk space check passed. Available: ${available_space}GB"
    return 0
}

generate_encryption_key() {
    if [ ! -f "$ENCRYPTION_KEY_FILE" ]; then
        log_info "Generating new encryption key..."
        openssl rand -base64 32 > "$ENCRYPTION_KEY_FILE"
        chmod 600 "$ENCRYPTION_KEY_FILE"
        log_success "Encryption key generated: $ENCRYPTION_KEY_FILE"
    fi
}

encrypt_file() {
    local input_file="$1"
    local output_file="$2"
    
    if [ "$ENCRYPTION_ENABLED" = true ]; then
        log_info "Encrypting file: $(basename "$input_file")"
        
        if [ -n "$ENCRYPTION_PASSPHRASE" ]; then
            # Use passphrase-based encryption
            openssl enc -aes-256-cbc -salt -in "$input_file" -out "$output_file" -k "$ENCRYPTION_PASSPHRASE"
        elif [ -f "$ENCRYPTION_KEY_FILE" ]; then
            # Use key file-based encryption
            openssl enc -aes-256-cbc -salt -in "$input_file" -out "$output_file" -kfile "$ENCRYPTION_KEY_FILE"
        else
            log_error "No encryption key or passphrase available"
            return 1
        fi
        
        log_success "File encrypted successfully"
    else
        # No encryption, just copy
        cp "$input_file" "$output_file"
    fi
}

decrypt_file() {
    local input_file="$1"
    local output_file="$2"
    
    if [ "$ENCRYPTION_ENABLED" = true ]; then
        log_info "Decrypting file: $(basename "$input_file")"
        
        if [ -n "$ENCRYPTION_PASSPHRASE" ]; then
            # Use passphrase-based decryption
            openssl enc -aes-256-cbc -d -in "$input_file" -out "$output_file" -k "$ENCRYPTION_PASSPHRASE"
        elif [ -f "$ENCRYPTION_KEY_FILE" ]; then
            # Use key file-based decryption
            openssl enc -aes-256-cbc -d -in "$input_file" -out "$output_file" -kfile "$ENCRYPTION_KEY_FILE"
        else
            log_error "No encryption key or passphrase available"
            return 1
        fi
        
        log_success "File decrypted successfully"
    else
        # No encryption, just copy
        cp "$input_file" "$output_file"
    fi
}

# =============================================================================
# BACKUP FUNCTIONS
# =============================================================================

backup_database() {
    log_step "Starting database backup..."
    
    local db_backup_dir="$BACKUP_DIR/database"
    mkdir -p "$db_backup_dir"
    
    # Check if database container is running
    if ! docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" ps "$DB_CONTAINER" | grep -q "Up"; then
        log_error "Database container is not running"
        return 1
    fi
    
    # Create database dump
    local dump_file="$db_backup_dir/database_dump.sql"
    log_info "Creating database dump..."
    
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" exec -T "$DB_CONTAINER" \
        pg_dump -U "$DB_USER" -d "$DB_NAME" --verbose --clean --if-exists --create > "$dump_file"
    
    if [ $? -eq 0 ]; then
        local dump_size=$(get_file_size "$dump_file")
        log_success "Database dump created successfully ($dump_size)"
        
        # Compress and encrypt the dump
        local compressed_file="$db_backup_dir/database_dump.sql.gz"
        gzip -"$COMPRESSION_LEVEL" "$dump_file"
        mv "${dump_file}.gz" "$compressed_file"
        
        if [ "$ENCRYPTION_ENABLED" = true ]; then
            local encrypted_file="$db_backup_dir/database_dump.sql.gz.enc"
            encrypt_file "$compressed_file" "$encrypted_file"
            rm "$compressed_file"
            log_success "Database backup encrypted and stored: $(get_file_size "$encrypted_file")"
        else
            log_success "Database backup compressed and stored: $(get_file_size "$compressed_file")"
        fi
        
        # Backup database schema separately
        local schema_file="$db_backup_dir/schema.sql"
        docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" exec -T "$DB_CONTAINER" \
            pg_dump -U "$DB_USER" -d "$DB_NAME" --schema-only > "$schema_file"
        
        log_success "Database schema backup created: $(get_file_size "$schema_file")"
        
        return 0
    else
        log_error "Database dump failed"
        return 1
    fi
}

backup_redis() {
    log_step "Starting Redis backup..."
    
    local redis_backup_dir="$BACKUP_DIR/redis"
    mkdir -p "$redis_backup_dir"
    
    # Check if Redis container is running
    if ! docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" ps "$REDIS_CONTAINER" | grep -q "Up"; then
        log_error "Redis container is not running"
        return 1
    fi
    
    # Force Redis to save current state
    log_info "Forcing Redis save..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" exec -T "$REDIS_CONTAINER" redis-cli BGSAVE
    
    # Wait for background save to complete
    local save_complete=false
    local max_wait=60
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        local last_save=$(docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" exec -T "$REDIS_CONTAINER" \
            redis-cli LASTSAVE | tr -d '\r')
        sleep 2
        local current_save=$(docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" exec -T "$REDIS_CONTAINER" \
            redis-cli LASTSAVE | tr -d '\r')
        
        if [ "$current_save" != "$last_save" ]; then
            save_complete=true
            break
        fi
        
        wait_time=$((wait_time + 2))
    done
    
    if [ "$save_complete" = false ]; then
        log_warning "Redis background save may not have completed"
    fi
    
    # Copy Redis dump file
    local redis_dump="$redis_backup_dir/dump.rdb"
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" exec -T "$REDIS_CONTAINER" \
        cat /data/dump.rdb > "$redis_dump"
    
    if [ -f "$redis_dump" ] && [ -s "$redis_dump" ]; then
        local dump_size=$(get_file_size "$redis_dump")
        log_success "Redis dump created successfully ($dump_size)"
        
        # Compress and encrypt the dump
        local compressed_file="$redis_backup_dir/dump.rdb.gz"
        gzip -"$COMPRESSION_LEVEL" "$redis_dump"
        mv "${redis_dump}.gz" "$compressed_file"
        
        if [ "$ENCRYPTION_ENABLED" = true ]; then
            local encrypted_file="$redis_backup_dir/dump.rdb.gz.enc"
            encrypt_file "$compressed_file" "$encrypted_file"
            rm "$compressed_file"
            log_success "Redis backup encrypted and stored: $(get_file_size "$encrypted_file")"
        else
            log_success "Redis backup compressed and stored: $(get_file_size "$compressed_file")"
        fi
        
        return 0
    else
        log_error "Redis dump failed or is empty"
        return 1
    fi
}

backup_application_data() {
    log_step "Starting application data backup..."
    
    local app_backup_dir="$BACKUP_DIR/application"
    mkdir -p "$app_backup_dir"
    
    # Backup uploaded files and user data
    local data_dirs=(
        "$PROJECT_ROOT/data/uploads"
        "$PROJECT_ROOT/data/user_files"
        "$PROJECT_ROOT/data/cache"
        "$PROJECT_ROOT/logs"
    )
    
    for data_dir in "${data_dirs[@]}"; do
        if [ -d "$data_dir" ]; then
            local dir_name=$(basename "$data_dir")
            local backup_archive="$app_backup_dir/${dir_name}.tar.gz"
            
            log_info "Backing up directory: $data_dir"
            tar -czf "$backup_archive" -C "$(dirname "$data_dir")" "$(basename "$data_dir")"
            
            if [ $? -eq 0 ]; then
                local archive_size=$(get_file_size "$backup_archive")
                log_success "Directory backup created: $dir_name ($archive_size)"
                
                if [ "$ENCRYPTION_ENABLED" = true ]; then
                    local encrypted_file="${backup_archive}.enc"
                    encrypt_file "$backup_archive" "$encrypted_file"
                    rm "$backup_archive"
                    log_success "Directory backup encrypted: $dir_name"
                fi
            else
                log_warning "Failed to backup directory: $data_dir"
            fi
        else
            log_info "Directory does not exist, skipping: $data_dir"
        fi
    done
    
    return 0
}

backup_configuration() {
    log_step "Starting configuration backup..."
    
    local config_backup_dir="$BACKUP_DIR/configuration"
    mkdir -p "$config_backup_dir"
    
    # Backup configuration files
    local config_files=(
        "$PROJECT_ROOT/.env.production"
        "$PROJECT_ROOT/docker-compose.production.yml"
        "$PROJECT_ROOT/docker-compose.monitoring.yml"
        "$PROJECT_ROOT/config"
        "$PROJECT_ROOT/prisma/schema.prisma"
        "$PROJECT_ROOT/package.json"
        "$PROJECT_ROOT/package-lock.json"
    )
    
    for config_item in "${config_files[@]}"; do
        if [ -e "$config_item" ]; then
            local item_name=$(basename "$config_item")
            
            if [ -d "$config_item" ]; then
                # It's a directory
                local backup_archive="$config_backup_dir/${item_name}.tar.gz"
                log_info "Backing up configuration directory: $config_item"
                tar -czf "$backup_archive" -C "$(dirname "$config_item")" "$(basename "$config_item")"
                
                if [ $? -eq 0 ]; then
                    local archive_size=$(get_file_size "$backup_archive")
                    log_success "Configuration directory backup created: $item_name ($archive_size)"
                fi
            else
                # It's a file
                local backup_file="$config_backup_dir/$item_name"
                log_info "Backing up configuration file: $config_item"
                cp "$config_item" "$backup_file"
                
                if [ $? -eq 0 ]; then
                    local file_size=$(get_file_size "$backup_file")
                    log_success "Configuration file backup created: $item_name ($file_size)"
                fi
            fi
        else
            log_info "Configuration item does not exist, skipping: $config_item"
        fi
    done
    
    # Create a comprehensive configuration archive
    local config_archive="$config_backup_dir/all_config.tar.gz"
    tar -czf "$config_archive" -C "$config_backup_dir" .
    
    if [ "$ENCRYPTION_ENABLED" = true ]; then
        local encrypted_file="${config_archive}.enc"
        encrypt_file "$config_archive" "$encrypted_file"
        rm "$config_archive"
        log_success "Configuration backup encrypted and stored"
    else
        log_success "Configuration backup created: $(get_file_size "$config_archive")"
    fi
    
    return 0
}

backup_docker_volumes() {
    log_step "Starting Docker volumes backup..."
    
    local volumes_backup_dir="$BACKUP_DIR/volumes"
    mkdir -p "$volumes_backup_dir"
    
    # Get list of Docker volumes used by the application
    local volumes=$(docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" config --volumes 2>/dev/null || echo "")
    
    if [ -n "$volumes" ]; then
        for volume in $volumes; do
            log_info "Backing up Docker volume: $volume"
            
            local volume_backup="$volumes_backup_dir/${volume}.tar.gz"
            
            # Create a temporary container to access the volume
            docker run --rm -v "${volume}:/volume" -v "$volumes_backup_dir:/backup" \
                alpine:latest tar -czf "/backup/${volume}.tar.gz" -C /volume .
            
            if [ $? -eq 0 ]; then
                local volume_size=$(get_file_size "$volume_backup")
                log_success "Docker volume backup created: $volume ($volume_size)"
                
                if [ "$ENCRYPTION_ENABLED" = true ]; then
                    local encrypted_file="${volume_backup}.enc"
                    encrypt_file "$volume_backup" "$encrypted_file"
                    rm "$volume_backup"
                    log_success "Docker volume backup encrypted: $volume"
                fi
            else
                log_warning "Failed to backup Docker volume: $volume"
            fi
        done
    else
        log_info "No Docker volumes found to backup"
    fi
    
    return 0
}

create_backup_manifest() {
    log_step "Creating backup manifest..."
    
    local manifest_file="$BACKUP_DIR/manifest.json"
    
    # Calculate total backup size
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    
    # Get system information
    local hostname=$(hostname)
    local os_info=$(uname -a)
    local docker_version=$(docker --version 2>/dev/null || echo "unknown")
    
    # Create manifest
    cat > "$manifest_file" << EOF
{
    "backup_id": "$BACKUP_ID",
    "timestamp": "$(get_timestamp)",
    "hostname": "$hostname",
    "os_info": "$os_info",
    "docker_version": "$docker_version",
    "total_size": "$total_size",
    "encryption_enabled": $ENCRYPTION_ENABLED,
    "compression_level": $COMPRESSION_LEVEL,
    "components": {
        "database": {
            "included": true,
            "files": [
EOF
    
    # Add database files to manifest
    if [ -d "$BACKUP_DIR/database" ]; then
        local first=true
        for file in "$BACKUP_DIR/database"/*; do
            if [ -f "$file" ]; then
                if [ "$first" = true ]; then
                    first=false
                else
                    echo "," >> "$manifest_file"
                fi
                local filename=$(basename "$file")
                local filesize=$(get_file_size "$file")
                echo "                {\"name\": \"$filename\", \"size\": \"$filesize\"}" >> "$manifest_file"
            fi
        done
    fi
    
    cat >> "$manifest_file" << EOF
            ]
        },
        "redis": {
            "included": true,
            "files": [
EOF
    
    # Add Redis files to manifest
    if [ -d "$BACKUP_DIR/redis" ]; then
        local first=true
        for file in "$BACKUP_DIR/redis"/*; do
            if [ -f "$file" ]; then
                if [ "$first" = true ]; then
                    first=false
                else
                    echo "," >> "$manifest_file"
                fi
                local filename=$(basename "$file")
                local filesize=$(get_file_size "$file")
                echo "                {\"name\": \"$filename\", \"size\": \"$filesize\"}" >> "$manifest_file"
            fi
        done
    fi
    
    cat >> "$manifest_file" << EOF
            ]
        },
        "application": {
            "included": true,
            "directories_backed_up": [
                "uploads", "user_files", "cache", "logs"
            ]
        },
        "configuration": {
            "included": true,
            "files_backed_up": [
                ".env.production", "docker-compose files", "config directory", "prisma schema"
            ]
        }
    },
    "verification": {
        "checksum_algorithm": "sha256",
        "checksums": {
EOF
    
    # Calculate checksums for verification
    local first=true
    find "$BACKUP_DIR" -type f -name "*.gz" -o -name "*.enc" -o -name "*.sql" | while read -r file; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$manifest_file"
        fi
        local filename=$(basename "$file")
        local checksum=$(sha256sum "$file" | cut -d' ' -f1)
        echo "            \"$filename\": \"$checksum\"" >> "$manifest_file"
    done
    
    cat >> "$manifest_file" << EOF
        }
    }
}
EOF
    
    log_success "Backup manifest created: $manifest_file"
    return 0
}

# =============================================================================
# RESTORE FUNCTIONS
# =============================================================================

list_available_backups() {
    log_info "Available backups:"
    
    if [ ! -d "$BACKUP_BASE_DIR" ]; then
        log_warning "No backup directory found: $BACKUP_BASE_DIR"
        return 1
    fi
    
    local backup_count=0
    for backup_dir in "$BACKUP_BASE_DIR"/backup-*; do
        if [ -d "$backup_dir" ]; then
            local backup_id=$(basename "$backup_dir")
            local manifest_file="$backup_dir/manifest.json"
            
            if [ -f "$manifest_file" ]; then
                local timestamp=$(jq -r '.timestamp' "$manifest_file" 2>/dev/null || echo "unknown")
                local total_size=$(jq -r '.total_size' "$manifest_file" 2>/dev/null || echo "unknown")
                echo "  - $backup_id (Created: $timestamp, Size: $total_size)"
                ((backup_count++))
            else
                echo "  - $backup_id (No manifest found)"
                ((backup_count++))
            fi
        fi
    done
    
    if [ $backup_count -eq 0 ]; then
        log_warning "No backups found"
        return 1
    fi
    
    log_info "Total backups found: $backup_count"
    return 0
}

validate_backup() {
    local backup_id="$1"
    local backup_dir="$BACKUP_BASE_DIR/$backup_id"
    
    log_step "Validating backup: $backup_id"
    
    if [ ! -d "$backup_dir" ]; then
        log_error "Backup directory not found: $backup_dir"
        return 1
    fi
    
    local manifest_file="$backup_dir/manifest.json"
    if [ ! -f "$manifest_file" ]; then
        log_error "Backup manifest not found: $manifest_file"
        return 1
    fi
    
    # Validate manifest JSON
    if ! jq . "$manifest_file" >/dev/null 2>&1; then
        log_error "Invalid backup manifest JSON"
        return 1
    fi
    
    # Verify checksums
    log_info "Verifying backup checksums..."
    local checksum_errors=0
    
    # Get checksums from manifest
    local checksums=$(jq -r '.verification.checksums | to_entries[] | "\(.key) \(.value)"' "$manifest_file" 2>/dev/null || echo "")
    
    if [ -n "$checksums" ]; then
        while IFS=' ' read -r filename expected_checksum; do
            local file_path="$backup_dir/$filename"
            
            # Find the file in subdirectories
            local found_file=$(find "$backup_dir" -name "$filename" -type f | head -1)
            
            if [ -n "$found_file" ]; then
                local actual_checksum=$(sha256sum "$found_file" | cut -d' ' -f1)
                
                if [ "$actual_checksum" = "$expected_checksum" ]; then
                    log_info "Checksum verified: $filename"
                else
                    log_error "Checksum mismatch: $filename"
                    ((checksum_errors++))
                fi
            else
                log_error "File not found: $filename"
                ((checksum_errors++))
            fi
        done <<< "$checksums"
    else
        log_warning "No checksums found in manifest"
    fi
    
    if [ $checksum_errors -eq 0 ]; then
        log_success "Backup validation passed"
        return 0
    else
        log_error "Backup validation failed with $checksum_errors errors"
        return 1
    fi
}

restore_database() {
    local backup_id="$1"
    local backup_dir="$BACKUP_BASE_DIR/$backup_id"
    
    log_step "Restoring database from backup: $backup_id"
    
    local db_backup_dir="$backup_dir/database"
    if [ ! -d "$db_backup_dir" ]; then
        log_error "Database backup directory not found: $db_backup_dir"
        return 1
    fi
    
    # Find the database dump file
    local dump_file=""
    if [ -f "$db_backup_dir/database_dump.sql.gz.enc" ]; then
        dump_file="$db_backup_dir/database_dump.sql.gz.enc"
    elif [ -f "$db_backup_dir/database_dump.sql.gz" ]; then
        dump_file="$db_backup_dir/database_dump.sql.gz"
    elif [ -f "$db_backup_dir/database_dump.sql" ]; then
        dump_file="$db_backup_dir/database_dump.sql"
    else
        log_error "No database dump file found in backup"
        return 1
    fi
    
    # Prepare the dump file for restoration
    local temp_dir="/tmp/restore_$$"
    mkdir -p "$temp_dir"
    local restore_file="$temp_dir/database_dump.sql"
    
    if [[ "$dump_file" == *.enc ]]; then
        # Decrypt the file
        local decrypted_file="${dump_file%.enc}"
        decrypt_file "$dump_file" "$decrypted_file"
        dump_file="$decrypted_file"
    fi
    
    if [[ "$dump_file" == *.gz ]]; then
        # Decompress the file
        gunzip -c "$dump_file" > "$restore_file"
    else
        # Copy the file
        cp "$dump_file" "$restore_file"
    fi
    
    # Check if database container is running
    if ! docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" ps "$DB_CONTAINER" | grep -q "Up"; then
        log_error "Database container is not running"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Stop application to prevent database access during restore
    log_info "Stopping application services..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" stop app
    
    # Restore the database
    log_info "Restoring database from dump..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" exec -T "$DB_CONTAINER" \
        psql -U "$DB_USER" -d postgres < "$restore_file"
    
    if [ $? -eq 0 ]; then
        log_success "Database restored successfully"
        
        # Restart application services
        log_info "Restarting application services..."
        docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" start app
        
        # Cleanup
        rm -rf "$temp_dir"
        return 0
    else
        log_error "Database restore failed"
        
        # Restart application services anyway
        docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" start app
        
        # Cleanup
        rm -rf "$temp_dir"
        return 1
    fi
}

restore_redis() {
    local backup_id="$1"
    local backup_dir="$BACKUP_BASE_DIR/$backup_id"
    
    log_step "Restoring Redis from backup: $backup_id"
    
    local redis_backup_dir="$backup_dir/redis"
    if [ ! -d "$redis_backup_dir" ]; then
        log_error "Redis backup directory not found: $redis_backup_dir"
        return 1
    fi
    
    # Find the Redis dump file
    local dump_file=""
    if [ -f "$redis_backup_dir/dump.rdb.gz.enc" ]; then
        dump_file="$redis_backup_dir/dump.rdb.gz.enc"
    elif [ -f "$redis_backup_dir/dump.rdb.gz" ]; then
        dump_file="$redis_backup_dir/dump.rdb.gz"
    elif [ -f "$redis_backup_dir/dump.rdb" ]; then
        dump_file="$redis_backup_dir/dump.rdb"
    else
        log_error "No Redis dump file found in backup"
        return 1
    fi
    
    # Prepare the dump file for restoration
    local temp_dir="/tmp/restore_redis_$$"
    mkdir -p "$temp_dir"
    local restore_file="$temp_dir/dump.rdb"
    
    if [[ "$dump_file" == *.enc ]]; then
        # Decrypt the file
        local decrypted_file="${dump_file%.enc}"
        decrypt_file "$dump_file" "$decrypted_file"
        dump_file="$decrypted_file"
    fi
    
    if [[ "$dump_file" == *.gz ]]; then
        # Decompress the file
        gunzip -c "$dump_file" > "$restore_file"
    else
        # Copy the file
        cp "$dump_file" "$restore_file"
    fi
    
    # Check if Redis container is running
    if ! docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" ps "$REDIS_CONTAINER" | grep -q "Up"; then
        log_error "Redis container is not running"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Stop Redis to replace the dump file
    log_info "Stopping Redis service..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" stop "$REDIS_CONTAINER"
    
    # Copy the dump file to Redis data directory
    log_info "Restoring Redis dump file..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" run --rm -v "$temp_dir:/restore" "$REDIS_CONTAINER" \
        sh -c "cp /restore/dump.rdb /data/dump.rdb && chown redis:redis /data/dump.rdb"
    
    if [ $? -eq 0 ]; then
        log_success "Redis dump file restored successfully"
        
        # Start Redis service
        log_info "Starting Redis service..."
        docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" start "$REDIS_CONTAINER"
        
        # Wait for Redis to start
        sleep 5
        
        # Verify Redis is working
        if docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" exec -T "$REDIS_CONTAINER" redis-cli ping | grep -q "PONG"; then
            log_success "Redis restored and verified successfully"
        else
            log_warning "Redis restored but verification failed"
        fi
        
        # Cleanup
        rm -rf "$temp_dir"
        return 0
    else
        log_error "Redis restore failed"
        
        # Start Redis service anyway
        docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" start "$REDIS_CONTAINER"
        
        # Cleanup
        rm -rf "$temp_dir"
        return 1
    fi
}

restore_application_data() {
    local backup_id="$1"
    local backup_dir="$BACKUP_BASE_DIR/$backup_id"
    
    log_step "Restoring application data from backup: $backup_id"
    
    local app_backup_dir="$backup_dir/application"
    if [ ! -d "$app_backup_dir" ]; then
        log_error "Application backup directory not found: $app_backup_dir"
        return 1
    fi
    
    # Restore each data directory
    local data_dirs=("uploads" "user_files" "cache" "logs")
    
    for dir_name in "${data_dirs[@]}"; do
        local archive_file=""
        
        if [ -f "$app_backup_dir/${dir_name}.tar.gz.enc" ]; then
            archive_file="$app_backup_dir/${dir_name}.tar.gz.enc"
        elif [ -f "$app_backup_dir/${dir_name}.tar.gz" ]; then
            archive_file="$app_backup_dir/${dir_name}.tar.gz"
        else
            log_info "No backup found for directory: $dir_name"
            continue
        fi
        
        log_info "Restoring directory: $dir_name"
        
        # Prepare the archive for extraction
        local temp_dir="/tmp/restore_app_$$"
        mkdir -p "$temp_dir"
        local extract_file="$temp_dir/${dir_name}.tar.gz"
        
        if [[ "$archive_file" == *.enc ]]; then
            # Decrypt the file
            decrypt_file "$archive_file" "$extract_file"
        else
            # Copy the file
            cp "$archive_file" "$extract_file"
        fi
        
        # Create target directory
        local target_dir="$PROJECT_ROOT/data/$dir_name"
        mkdir -p "$(dirname "$target_dir")"
        
        # Extract the archive
        tar -xzf "$extract_file" -C "$(dirname "$target_dir")"
        
        if [ $? -eq 0 ]; then
            log_success "Directory restored successfully: $dir_name"
        else
            log_error "Failed to restore directory: $dir_name"
        fi
        
        # Cleanup
        rm -rf "$temp_dir"
    done
    
    return 0
}

restore_configuration() {
    local backup_id="$1"
    local backup_dir="$BACKUP_BASE_DIR/$backup_id"
    
    log_step "Restoring configuration from backup: $backup_id"
    
    local config_backup_dir="$backup_dir/configuration"
    if [ ! -d "$config_backup_dir" ]; then
        log_error "Configuration backup directory not found: $config_backup_dir"
        return 1
    fi
    
    # Ask for confirmation before restoring configuration
    echo -n "Restoring configuration will overwrite current settings. Continue? (y/N): "
    read -r confirmation
    
    if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
        log_info "Configuration restore cancelled by user"
        return 0
    fi
    
    # Restore individual configuration files
    local config_files=(
        ".env.production"
        "docker-compose.production.yml"
        "docker-compose.monitoring.yml"
    )
    
    for config_file in "${config_files[@]}"; do
        if [ -f "$config_backup_dir/$config_file" ]; then
            log_info "Restoring configuration file: $config_file"
            cp "$config_backup_dir/$config_file" "$PROJECT_ROOT/$config_file"
            
            if [ $? -eq 0 ]; then
                log_success "Configuration file restored: $config_file"
            else
                log_error "Failed to restore configuration file: $config_file"
            fi
        fi
    done
    
    # Restore config directory
    if [ -f "$config_backup_dir/config.tar.gz" ]; then
        log_info "Restoring config directory..."
        
        # Backup current config directory
        if [ -d "$PROJECT_ROOT/config" ]; then
            mv "$PROJECT_ROOT/config" "$PROJECT_ROOT/config.backup.$(date +%s)"
        fi
        
        # Extract config directory
        tar -xzf "$config_backup_dir/config.tar.gz" -C "$PROJECT_ROOT"
        
        if [ $? -eq 0 ]; then
            log_success "Config directory restored successfully"
        else
            log_error "Failed to restore config directory"
        fi
    fi
    
    return 0
}

# =============================================================================
# REMOTE BACKUP FUNCTIONS
# =============================================================================

upload_to_remote() {
    local backup_id="$1"
    local backup_dir="$BACKUP_BASE_DIR/$backup_id"
    
    if [ "$REMOTE_BACKUP_ENABLED" != true ]; then
        log_info "Remote backup is disabled"
        return 0
    fi
    
    log_step "Uploading backup to remote storage: $backup_id"
    
    # Create backup archive
    local backup_archive="$BACKUP_BASE_DIR/${backup_id}.tar.gz"
    log_info "Creating backup archive..."
    tar -czf "$backup_archive" -C "$BACKUP_BASE_DIR" "$backup_id"
    
    if [ $? -ne 0 ]; then
        log_error "Failed to create backup archive"
        return 1
    fi
    
    local archive_size=$(get_file_size "$backup_archive")
    log_success "Backup archive created: $archive_size"
    
    # Upload to remote server via SCP
    if [ -n "$REMOTE_BACKUP_HOST" ] && [ -n "$REMOTE_BACKUP_USER" ]; then
        log_info "Uploading to remote server: $REMOTE_BACKUP_HOST"
        
        local scp_options=""
        if [ -n "$REMOTE_BACKUP_KEY" ]; then
            scp_options="-i $REMOTE_BACKUP_KEY"
        fi
        
        scp $scp_options "$backup_archive" "$REMOTE_BACKUP_USER@$REMOTE_BACKUP_HOST:$REMOTE_BACKUP_PATH/"
        
        if [ $? -eq 0 ]; then
            log_success "Backup uploaded to remote server successfully"
        else
            log_error "Failed to upload backup to remote server"
        fi
    fi
    
    # Upload to S3
    if [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
        log_info "Uploading to S3 bucket: $S3_BUCKET"
        
        aws s3 cp "$backup_archive" "s3://$S3_BUCKET/backups/" --region "$S3_REGION"
        
        if [ $? -eq 0 ]; then
            log_success "Backup uploaded to S3 successfully"
        else
            log_error "Failed to upload backup to S3"
        fi
    fi
    
    # Cleanup local archive
    rm -f "$backup_archive"
    
    return 0
}

# =============================================================================
# CLEANUP FUNCTIONS
# =============================================================================

cleanup_old_backups() {
    log_step "Cleaning up old backups..."
    
    if [ ! -d "$BACKUP_BASE_DIR" ]; then
        log_info "No backup directory found, nothing to cleanup"
        return 0
    fi
    
    local deleted_count=0
    local total_size_freed=0
    
    # Find backups older than retention period
    find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "backup-*" -mtime +"$RETENTION_DAYS" | while read -r old_backup; do
        if [ -d "$old_backup" ]; then
            local backup_id=$(basename "$old_backup")
            local backup_size=$(du -sb "$old_backup" | cut -f1)
            
            log_info "Deleting old backup: $backup_id"
            rm -rf "$old_backup"
            
            if [ $? -eq 0 ]; then
                log_success "Deleted old backup: $backup_id"
                ((deleted_count++))
                total_size_freed=$((total_size_freed + backup_size))
            else
                log_error "Failed to delete old backup: $backup_id"
            fi
        fi
    done
    
    if [ $deleted_count -gt 0 ]; then
        local size_freed_mb=$((total_size_freed / 1024 / 1024))
        log_success "Cleanup completed: $deleted_count backups deleted, ${size_freed_mb}MB freed"
    else
        log_info "No old backups found to cleanup"
    fi
    
    return 0
}

# =============================================================================
# MAIN FUNCTIONS
# =============================================================================

perform_full_backup() {
    local start_time=$(date +%s)
    
    echo "=============================================================================="
    echo "                Git Memory MCP Server - Full Backup"
    echo "=============================================================================="
    echo "Backup ID: $BACKUP_ID"
    echo "Timestamp: $(get_timestamp)"
    echo "=============================================================================="
    echo
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Check disk space (estimate 5GB needed)
    if ! check_disk_space 5; then
        log_error "Insufficient disk space for backup"
        return 1
    fi
    
    # Generate encryption key if needed
    if [ "$ENCRYPTION_ENABLED" = true ]; then
        generate_encryption_key
    fi
    
    # Perform backup components
    local backup_success=true
    
    backup_database || backup_success=false
    backup_redis || backup_success=false
    backup_application_data || backup_success=false
    backup_configuration || backup_success=false
    backup_docker_volumes || backup_success=false
    
    # Create backup manifest
    create_backup_manifest
    
    # Upload to remote storage
    upload_to_remote "$BACKUP_ID"
    
    # Cleanup old backups
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local backup_duration=$((end_time - start_time))
    local backup_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    
    echo
    echo "=============================================================================="
    if [ "$backup_success" = true ]; then
        log_success "Full backup completed successfully in ${backup_duration} seconds"
        log_success "Backup size: $backup_size"
        log_success "Backup location: $BACKUP_DIR"
    else
        log_error "Backup completed with errors in ${backup_duration} seconds"
        log_warning "Some components may not have been backed up successfully"
    fi
    echo "Log file: $LOG_FILE"
    echo "=============================================================================="
    
    return $([ "$backup_success" = true ] && echo 0 || echo 1)
}

perform_restore() {
    local backup_id="$1"
    local components="${2:-all}"
    
    echo "=============================================================================="
    echo "                Git Memory MCP Server - Restore"
    echo "=============================================================================="
    echo "Backup ID: $backup_id"
    echo "Components: $components"
    echo "Timestamp: $(get_timestamp)"
    echo "=============================================================================="
    echo
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Validate backup
    if ! validate_backup "$backup_id"; then
        log_error "Backup validation failed, aborting restore"
        return 1
    fi
    
    # Confirm restore operation
    echo -n "This will restore data from backup $backup_id. This operation cannot be undone. Continue? (y/N): "
    read -r confirmation
    
    if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
        log_info "Restore operation cancelled by user"
        return 0
    fi
    
    local restore_success=true
    local start_time=$(date +%s)
    
    # Perform restore based on components
    case "$components" in
        "all")
            restore_database "$backup_id" || restore_success=false
            restore_redis "$backup_id" || restore_success=false
            restore_application_data "$backup_id" || restore_success=false
            restore_configuration "$backup_id" || restore_success=false
            ;;
        "database")
            restore_database "$backup_id" || restore_success=false
            ;;
        "redis")
            restore_redis "$backup_id" || restore_success=false
            ;;
        "application")
            restore_application_data "$backup_id" || restore_success=false
            ;;
        "configuration")
            restore_configuration "$backup_id" || restore_success=false
            ;;
        *)
            log_error "Unknown component: $components"
            return 1
            ;;
    esac
    
    local end_time=$(date +%s)
    local restore_duration=$((end_time - start_time))
    
    echo
    echo "=============================================================================="
    if [ "$restore_success" = true ]; then
        log_success "Restore completed successfully in ${restore_duration} seconds"
    else
        log_error "Restore completed with errors in ${restore_duration} seconds"
    fi
    echo "Log file: $LOG_FILE"
    echo "=============================================================================="
    
    return $([ "$restore_success" = true ] && echo 0 || echo 1)
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Parse command line arguments
COMMAND=""
BACKUP_ID_ARG=""
COMPONENTS_ARG="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        backup)
            COMMAND="backup"
            shift
            ;;
        restore)
            COMMAND="restore"
            BACKUP_ID_ARG="$2"
            shift 2
            ;;
        list)
            COMMAND="list"
            shift
            ;;
        validate)
            COMMAND="validate"
            BACKUP_ID_ARG="$2"
            shift 2
            ;;
        cleanup)
            COMMAND="cleanup"
            shift
            ;;
        --components)
            COMPONENTS_ARG="$2"
            shift 2
            ;;
        --retention-days)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --no-encryption)
            ENCRYPTION_ENABLED=false
            shift
            ;;
        --compression-level)
            COMPRESSION_LEVEL="$2"
            shift 2
            ;;
        --remote)
            REMOTE_BACKUP_ENABLED=true
            shift
            ;;
        --help|-h)
            echo "Git Memory MCP Server - Backup and Restore Script"
            echo
            echo "Usage: $0 <command> [options]"
            echo
            echo "Commands:"
            echo "  backup                    Perform full backup"
            echo "  restore <backup-id>       Restore from backup"
            echo "  list                      List available backups"
            echo "  validate <backup-id>      Validate backup integrity"
            echo "  cleanup                   Remove old backups"
            echo
            echo "Options:"
            echo "  --components <list>       Components to restore (all,database,redis,application,configuration)"
            echo "  --retention-days <days>   Backup retention period (default: 30)"
            echo "  --no-encryption          Disable backup encryption"
            echo "  --compression-level <1-9> Compression level (default: 6)"
            echo "  --remote                  Enable remote backup upload"
            echo "  --help, -h               Show this help message"
            echo
            echo "Examples:"
            echo "  $0 backup"
            echo "  $0 restore backup-20240115-143022"
            echo "  $0 restore backup-20240115-143022 --components database,redis"
            echo "  $0 list"
            echo "  $0 validate backup-20240115-143022"
            echo "  $0 cleanup"
            echo
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Execute command
case "$COMMAND" in
    "backup")
        perform_full_backup
        ;;
    "restore")
        if [ -z "$BACKUP_ID_ARG" ]; then
            echo "Error: Backup ID is required for restore command"
            echo "Use '$0 list' to see available backups"
            exit 1
        fi
        perform_restore "$BACKUP_ID_ARG" "$COMPONENTS_ARG"
        ;;
    "list")
        list_available_backups
        ;;
    "validate")
        if [ -z "$BACKUP_ID_ARG" ]; then
            echo "Error: Backup ID is required for validate command"
            exit 1
        fi
        validate_backup "$BACKUP_ID_ARG"
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "")
        echo "Error: No command specified"
        echo "Use --help for usage information"
        exit 1
        ;;
    *)
        echo "Error: Unknown command: $COMMAND"
        echo "Use --help for usage information"
        exit 1
        ;;
esac