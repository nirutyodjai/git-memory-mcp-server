#!/bin/bash

# NEXUS IDE Security Dashboard - Version Bump Script
# This script helps bump the version numbers in Chart.yaml

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [patch|minor|major] [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -d, --dry-run       Show what would be changed without making changes"
    echo "  -c, --commit        Create a git commit with the version bump"
    echo "  -t, --tag           Create a git tag with the new version"
    echo "  -p, --push          Push changes and tags to remote repository"
    echo "  --app-version       Also bump the appVersion to match chart version"
    echo ""
    echo "Examples:"
    echo "  $0 patch                    # Bump patch version (1.0.0 -> 1.0.1)"
    echo "  $0 minor --commit --tag     # Bump minor version and create git commit/tag"
    echo "  $0 major --dry-run          # Show what major version bump would do"
    echo "  $0 patch --app-version      # Bump both chart and app version"
}

# Function to validate semantic version
validate_version() {
    local version=$1
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format: $version. Expected format: X.Y.Z"
        exit 1
    fi
}

# Function to increment version
increment_version() {
    local version=$1
    local type=$2
    
    IFS='.' read -ra VERSION_PARTS <<< "$version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $type in
        "patch")
            patch=$((patch + 1))
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        *)
            print_error "Invalid version type: $type. Use patch, minor, or major."
            exit 1
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Function to update Chart.yaml
update_chart_yaml() {
    local new_version=$1
    local update_app_version=$2
    local dry_run=$3
    
    if [[ "$dry_run" == "true" ]]; then
        print_info "[DRY RUN] Would update Chart.yaml:"
        print_info "[DRY RUN]   version: $CURRENT_VERSION -> $new_version"
        if [[ "$update_app_version" == "true" ]]; then
            print_info "[DRY RUN]   appVersion: $CURRENT_APP_VERSION -> $new_version"
        fi
        return
    fi
    
    # Create backup
    cp Chart.yaml Chart.yaml.backup
    
    # Update version
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/^version: .*/version: $new_version/" Chart.yaml
        if [[ "$update_app_version" == "true" ]]; then
            sed -i '' "s/^appVersion: .*/appVersion: \"$new_version\"/" Chart.yaml
        fi
    else
        # Linux
        sed -i "s/^version: .*/version: $new_version/" Chart.yaml
        if [[ "$update_app_version" == "true" ]]; then
            sed -i "s/^appVersion: .*/appVersion: \"$new_version\"/" Chart.yaml
        fi
    fi
    
    print_success "Updated Chart.yaml:"
    print_success "  version: $CURRENT_VERSION -> $new_version"
    if [[ "$update_app_version" == "true" ]]; then
        print_success "  appVersion: $CURRENT_APP_VERSION -> $new_version"
    fi
}

# Function to create git commit
create_git_commit() {
    local new_version=$1
    local dry_run=$2
    
    if [[ "$dry_run" == "true" ]]; then
        print_info "[DRY RUN] Would create git commit: 'chore: bump version to $new_version'"
        return
    fi
    
    if ! git diff --quiet Chart.yaml; then
        git add Chart.yaml
        git commit -m "chore: bump version to $new_version"
        print_success "Created git commit for version $new_version"
    else
        print_warning "No changes to commit"
    fi
}

# Function to create git tag
create_git_tag() {
    local new_version=$1
    local dry_run=$2
    
    if [[ "$dry_run" == "true" ]]; then
        print_info "[DRY RUN] Would create git tag: 'v$new_version'"
        return
    fi
    
    if git tag -l "v$new_version" | grep -q "v$new_version"; then
        print_warning "Tag v$new_version already exists"
    else
        git tag -a "v$new_version" -m "Release version $new_version"
        print_success "Created git tag v$new_version"
    fi
}

# Function to push changes
push_changes() {
    local dry_run=$1
    
    if [[ "$dry_run" == "true" ]]; then
        print_info "[DRY RUN] Would push changes and tags to remote repository"
        return
    fi
    
    git push origin HEAD
    git push origin --tags
    print_success "Pushed changes and tags to remote repository"
}

# Function to update CHANGELOG.md
update_changelog() {
    local new_version=$1
    local dry_run=$2
    
    if [[ ! -f "CHANGELOG.md" ]]; then
        print_warning "CHANGELOG.md not found, skipping changelog update"
        return
    fi
    
    if [[ "$dry_run" == "true" ]]; then
        print_info "[DRY RUN] Would update CHANGELOG.md with version $new_version"
        return
    fi
    
    local date=$(date +"%Y-%m-%d")
    local temp_file=$(mktemp)
    
    # Create new changelog entry
    {
        head -n 3 CHANGELOG.md
        echo ""
        echo "## [$new_version] - $date"
        echo ""
        echo "### Added"
        echo "- "
        echo ""
        echo "### Changed"
        echo "- "
        echo ""
        echo "### Fixed"
        echo "- "
        echo ""
        tail -n +4 CHANGELOG.md
    } > "$temp_file"
    
    mv "$temp_file" CHANGELOG.md
    print_success "Updated CHANGELOG.md with version $new_version"
}

# Main script
main() {
    # Check if we're in the right directory
    if [[ ! -f "Chart.yaml" ]]; then
        print_error "Chart.yaml not found. Please run this script from the Helm chart directory."
        exit 1
    fi
    
    # Parse command line arguments
    VERSION_TYPE=""
    DRY_RUN="false"
    CREATE_COMMIT="false"
    CREATE_TAG="false"
    PUSH_CHANGES="false"
    UPDATE_APP_VERSION="false"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            patch|minor|major)
                VERSION_TYPE="$1"
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -d|--dry-run)
                DRY_RUN="true"
                shift
                ;;
            -c|--commit)
                CREATE_COMMIT="true"
                shift
                ;;
            -t|--tag)
                CREATE_TAG="true"
                shift
                ;;
            -p|--push)
                PUSH_CHANGES="true"
                shift
                ;;
            --app-version)
                UPDATE_APP_VERSION="true"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate version type
    if [[ -z "$VERSION_TYPE" ]]; then
        print_error "Version type is required (patch, minor, or major)"
        show_usage
        exit 1
    fi
    
    # Get current versions
    CURRENT_VERSION=$(grep '^version:' Chart.yaml | cut -d' ' -f2)
    CURRENT_APP_VERSION=$(grep '^appVersion:' Chart.yaml | cut -d' ' -f2 | tr -d '"')
    
    if [[ -z "$CURRENT_VERSION" ]]; then
        print_error "Could not find version in Chart.yaml"
        exit 1
    fi
    
    validate_version "$CURRENT_VERSION"
    
    # Calculate new version
    NEW_VERSION=$(increment_version "$CURRENT_VERSION" "$VERSION_TYPE")
    
    print_info "Current version: $CURRENT_VERSION"
    print_info "New version: $NEW_VERSION"
    print_info "Version type: $VERSION_TYPE"
    
    if [[ "$UPDATE_APP_VERSION" == "true" ]]; then
        print_info "Current appVersion: $CURRENT_APP_VERSION"
        print_info "New appVersion: $NEW_VERSION"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "DRY RUN MODE - No changes will be made"
    fi
    
    # Confirm changes (unless dry run)
    if [[ "$DRY_RUN" != "true" ]]; then
        echo ""
        read -p "Do you want to proceed with the version bump? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Version bump cancelled"
            exit 0
        fi
    fi
    
    # Update Chart.yaml
    update_chart_yaml "$NEW_VERSION" "$UPDATE_APP_VERSION" "$DRY_RUN"
    
    # Update CHANGELOG.md
    update_changelog "$NEW_VERSION" "$DRY_RUN"
    
    # Git operations
    if [[ "$CREATE_COMMIT" == "true" ]]; then
        create_git_commit "$NEW_VERSION" "$DRY_RUN"
    fi
    
    if [[ "$CREATE_TAG" == "true" ]]; then
        create_git_tag "$NEW_VERSION" "$DRY_RUN"
    fi
    
    if [[ "$PUSH_CHANGES" == "true" ]]; then
        push_changes "$DRY_RUN"
    fi
    
    # Final message
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "Dry run completed. No changes were made."
    else
        print_success "Version bump completed successfully!"
        print_info "Next steps:"
        if [[ "$CREATE_COMMIT" != "true" ]]; then
            print_info "  - Review changes: git diff Chart.yaml"
            print_info "  - Commit changes: git add Chart.yaml && git commit -m 'chore: bump version to $NEW_VERSION'"
        fi
        if [[ "$CREATE_TAG" != "true" ]]; then
            print_info "  - Create tag: git tag -a v$NEW_VERSION -m 'Release version $NEW_VERSION'"
        fi
        if [[ "$PUSH_CHANGES" != "true" ]]; then
            print_info "  - Push changes: git push origin HEAD && git push origin --tags"
        fi
        print_info "  - Update CHANGELOG.md with release notes"
        print_info "  - Test the new version: make test"
        print_info "  - Package the chart: make package"
    fi
}

# Run main function
main "$@"