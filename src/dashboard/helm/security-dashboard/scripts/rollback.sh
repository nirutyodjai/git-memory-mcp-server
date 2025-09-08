#!/bin/bash

# NEXUS IDE Security Dashboard - Rollback Script
# This script helps rollback the Helm chart to a previous version

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
NAMESPACE="nexus-ide"
RELEASE_NAME="nexus-ide-dashboard"
REVISION=""
DRY_RUN="false"
WAIT="true"
TIMEOUT="10m"
FORCE="false"
VERBOSE="false"
BACKUP_BEFORE_ROLLBACK="true"
VERIFY_AFTER_ROLLBACK="true"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${MAGENTA}[DEBUG]${NC} $1"
    fi
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Rollback NEXUS IDE Security Dashboard to a previous version"
    echo ""
    echo "Options:"
    echo "  -n, --namespace NAMESPACE   Kubernetes namespace [default: nexus-ide]"
    echo "  -r, --release RELEASE       Helm release name [default: nexus-ide-dashboard]"
    echo "  -v, --revision REVISION     Revision number to rollback to (required)"
    echo "  -d, --dry-run               Perform a dry run without making changes"
    echo "  -w, --no-wait               Don't wait for rollback to complete"
    echo "  -t, --timeout DURATION      Timeout for rollback [default: 10m]"
    echo "      --force                 Force rollback even if validation fails"
    echo "      --no-backup             Skip backup creation before rollback"
    echo "      --no-verify             Skip verification after rollback"
    echo "      --verbose               Enable verbose output"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --revision 2                       # Rollback to revision 2"
    echo "  $0 -v 1 --dry-run                     # Dry run rollback to revision 1"
    echo "  $0 -r my-release -n my-namespace -v 3  # Rollback specific release"
    echo "  $0 --revision 2 --force --no-backup   # Force rollback without backup"
    echo ""
    echo "To see available revisions:"
    echo "  helm history RELEASE_NAME -n NAMESPACE"
}

# Function to validate prerequisites
validate_prerequisites() {
    print_step "Validating prerequisites..."
    
    # Check if required tools are installed
    local missing_tools=()
    
    if ! command -v helm &> /dev/null; then
        missing_tools+=("helm")
    fi
    
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_info "Please install the missing tools and try again."
        exit 1
    fi
    
    # Check Kubernetes connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        print_info "Please check your kubeconfig and cluster connection."
        exit 1
    fi
    
    # Check if release exists
    if ! helm status "$RELEASE_NAME" --namespace "$NAMESPACE" &> /dev/null; then
        print_error "Release $RELEASE_NAME not found in namespace $NAMESPACE"
        print_info "Available releases:"
        helm list --namespace "$NAMESPACE" || true
        exit 1
    fi
    
    print_success "Prerequisites validated"
}

# Function to show release history
show_release_history() {
    print_step "Showing release history..."
    
    echo ""
    echo -e "${CYAN}📋 Release History for $RELEASE_NAME${NC}"
    echo -e "${CYAN}================================${NC}"
    
    if ! helm history "$RELEASE_NAME" --namespace "$NAMESPACE"; then
        print_error "Failed to get release history"
        exit 1
    fi
    
    echo ""
}

# Function to validate revision
validate_revision() {
    print_step "Validating revision..."
    
    if [[ -z "$REVISION" ]]; then
        print_error "Revision number is required"
        print_info "Use --revision or -v to specify the revision number"
        print_info "Run 'helm history $RELEASE_NAME -n $NAMESPACE' to see available revisions"
        exit 1
    fi
    
    # Check if revision exists
    if ! helm history "$RELEASE_NAME" --namespace "$NAMESPACE" | grep -q "^$REVISION\s"; then
        print_error "Revision $REVISION not found"
        print_info "Available revisions:"
        helm history "$RELEASE_NAME" --namespace "$NAMESPACE" || true
        exit 1
    fi
    
    # Get current revision
    local current_revision
    current_revision=$(helm list --namespace "$NAMESPACE" --filter "$RELEASE_NAME" -o json | jq -r '.[0].revision')
    
    if [[ "$current_revision" == "$REVISION" ]]; then
        print_warning "Already at revision $REVISION"
        if [[ "$FORCE" != "true" ]]; then
            print_info "Use --force to proceed anyway"
            exit 0
        fi
    fi
    
    # Get revision details
    local revision_info
    revision_info=$(helm history "$RELEASE_NAME" --namespace "$NAMESPACE" | grep "^$REVISION\s")
    
    print_info "Current revision: $current_revision"
    print_info "Target revision: $REVISION"
    print_info "Revision details: $revision_info"
    
    print_success "Revision validated"
}

# Function to create backup before rollback
create_backup() {
    if [[ "$BACKUP_BEFORE_ROLLBACK" != "true" ]]; then
        print_warning "Skipping backup creation"
        return
    fi
    
    print_step "Creating backup before rollback..."
    
    local backup_dir="backups/rollback-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    print_info "Creating backup in $backup_dir"
    
    # Backup current values
    helm get values "$RELEASE_NAME" --namespace "$NAMESPACE" > "$backup_dir/current-values.yaml"
    
    # Backup current manifest
    helm get manifest "$RELEASE_NAME" --namespace "$NAMESPACE" > "$backup_dir/current-manifest.yaml"
    
    # Backup current status
    helm status "$RELEASE_NAME" --namespace "$NAMESPACE" > "$backup_dir/current-status.txt"
    
    # Backup target revision info
    helm get values "$RELEASE_NAME" --namespace "$NAMESPACE" --revision "$REVISION" > "$backup_dir/target-values.yaml" 2>/dev/null || true
    helm get manifest "$RELEASE_NAME" --namespace "$NAMESPACE" --revision "$REVISION" > "$backup_dir/target-manifest.yaml" 2>/dev/null || true
    
    # Create backup metadata
    local current_revision
    current_revision=$(helm list --namespace "$NAMESPACE" --filter "$RELEASE_NAME" -o json | jq -r '.[0].revision')
    
    cat > "$backup_dir/rollback-metadata.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "operation": "rollback",
  "release_name": "$RELEASE_NAME",
  "namespace": "$NAMESPACE",
  "current_revision": "$current_revision",
  "target_revision": "$REVISION",
  "dry_run": "$DRY_RUN",
  "force": "$FORCE"
}
EOF
    
    print_success "Backup created: $backup_dir"
}

# Function to perform rollback
perform_rollback() {
    print_step "Performing rollback..."
    
    local helm_args=("rollback" "$RELEASE_NAME" "$REVISION")
    helm_args+=(--namespace "$NAMESPACE")
    
    if [[ "$WAIT" == "true" ]]; then
        helm_args+=(--wait --timeout="$TIMEOUT")
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        helm_args+=(--dry-run)
    fi
    
    if [[ "$FORCE" == "true" ]]; then
        helm_args+=(--force)
    fi
    
    print_debug "Helm command: helm ${helm_args[*]}"
    
    # Show what will be rolled back
    print_info "Rolling back $RELEASE_NAME to revision $REVISION..."
    
    # Execute rollback
    if helm "${helm_args[@]}"; then
        if [[ "$DRY_RUN" == "true" ]]; then
            print_success "Dry run rollback completed successfully"
        else
            print_success "Rollback completed successfully"
        fi
    else
        print_error "Rollback failed"
        exit 1
    fi
}

# Function to verify rollback
verify_rollback() {
    if [[ "$DRY_RUN" == "true" || "$VERIFY_AFTER_ROLLBACK" != "true" ]]; then
        return
    fi
    
    print_step "Verifying rollback..."
    
    # Wait for pods to be ready
    print_info "Waiting for pods to be ready..."
    if ! kubectl wait --for=condition=ready pod \
        --selector=app.kubernetes.io/name=security-dashboard \
        --namespace="$NAMESPACE" \
        --timeout=300s; then
        print_warning "Some pods may not be ready yet"
    fi
    
    # Check if we're at the target revision
    local current_revision
    current_revision=$(helm list --namespace "$NAMESPACE" --filter "$RELEASE_NAME" -o json | jq -r '.[0].revision')
    
    if [[ "$current_revision" == "$REVISION" ]]; then
        print_success "Successfully rolled back to revision $REVISION"
    else
        print_error "Rollback verification failed. Current revision: $current_revision, Expected: $REVISION"
        exit 1
    fi
    
    # Check deployment status
    print_info "Checking deployment status..."
    kubectl get pods,svc,ingress -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard
    
    # Check Helm release status
    print_info "Checking Helm release status..."
    helm status "$RELEASE_NAME" --namespace "$NAMESPACE"
    
    print_success "Rollback verification completed"
}

# Function to show post-rollback information
show_post_rollback_info() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    print_step "Post-rollback information"
    
    echo ""
    echo -e "${CYAN}🔄 NEXUS IDE Security Dashboard Rollback Completed!${NC}"
    echo ""
    
    # Get current revision info
    local current_revision
    current_revision=$(helm list --namespace "$NAMESPACE" --filter "$RELEASE_NAME" -o json | jq -r '.[0].revision')
    
    echo -e "${YELLOW}📋 Rollback Summary:${NC}"
    echo "  Release: $RELEASE_NAME"
    echo "  Namespace: $NAMESPACE"
    echo "  Current Revision: $current_revision"
    echo "  Rollback Target: $REVISION"
    echo "  Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo ""
    
    # Show revision history
    echo -e "${YELLOW}📚 Recent History:${NC}"
    helm history "$RELEASE_NAME" --namespace "$NAMESPACE" --max 5
    echo ""
    
    # Get service information
    local service_info
    service_info=$(kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$service_info" ]]; then
        echo -e "${YELLOW}🔗 Access Information:${NC}"
        echo "  Port Forward: kubectl port-forward -n $NAMESPACE svc/$service_info 8080:80"
        echo "  Then visit: http://localhost:8080"
        echo ""
        
        # Ingress information
        local ingress_host
        ingress_host=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || echo "")
        if [[ -n "$ingress_host" ]]; then
            echo "  Ingress URL: https://$ingress_host"
            echo ""
        fi
    fi
    
    # Useful commands
    echo -e "${YELLOW}🛠️  Useful Commands:${NC}"
    echo "  View pods:        kubectl get pods -n $NAMESPACE"
    echo "  View logs:        kubectl logs -n $NAMESPACE -l app.kubernetes.io/name=security-dashboard"
    echo "  Helm status:      helm status $RELEASE_NAME -n $NAMESPACE"
    echo "  Helm history:     helm history $RELEASE_NAME -n $NAMESPACE"
    echo "  Rollback again:   $0 --revision <REVISION>"
    echo ""
    
    # Warnings and recommendations
    echo -e "${YELLOW}⚠️  Important Notes:${NC}"
    echo "  - Verify that the application is working correctly"
    echo "  - Check logs for any errors or warnings"
    echo "  - Consider running tests to ensure functionality"
    echo "  - Document the reason for rollback for future reference"
    echo ""
    
    echo -e "${GREEN}✅ Rollback completed successfully!${NC}"
}

# Function to handle cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        print_error "Rollback failed with exit code $exit_code"
        
        if [[ "$DRY_RUN" != "true" ]]; then
            print_info "You may want to check the following:"
            print_info "  - kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp'"
            print_info "  - kubectl describe pods -n $NAMESPACE"
            print_info "  - helm status $RELEASE_NAME -n $NAMESPACE"
            print_info "  - helm history $RELEASE_NAME -n $NAMESPACE"
        fi
    fi
}

# Set up cleanup trap
trap cleanup EXIT

# Main function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -r|--release)
                RELEASE_NAME="$2"
                shift 2
                ;;
            -v|--revision)
                REVISION="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN="true"
                shift
                ;;
            -w|--no-wait)
                WAIT="false"
                shift
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --force)
                FORCE="true"
                shift
                ;;
            --no-backup)
                BACKUP_BEFORE_ROLLBACK="false"
                shift
                ;;
            --no-verify)
                VERIFY_AFTER_ROLLBACK="false"
                shift
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Show rollback information
    echo -e "${CYAN}🔄 NEXUS IDE Security Dashboard Rollback${NC}"
    echo -e "${CYAN}=======================================${NC}"
    echo ""
    print_info "Namespace: $NAMESPACE"
    print_info "Release: $RELEASE_NAME"
    if [[ -n "$REVISION" ]]; then
        print_info "Target Revision: $REVISION"
    fi
    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "DRY RUN MODE - No changes will be made"
    fi
    echo ""
    
    # Execute rollback steps
    validate_prerequisites
    show_release_history
    validate_revision
    
    # Confirm rollback (unless dry run or force)
    if [[ "$DRY_RUN" != "true" && "$FORCE" != "true" ]]; then
        echo ""
        print_warning "This will rollback $RELEASE_NAME to revision $REVISION"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Rollback cancelled"
            exit 0
        fi
    fi
    
    create_backup
    perform_rollback
    verify_rollback
    show_post_rollback_info
}

# Run main function with all arguments
main "$@"