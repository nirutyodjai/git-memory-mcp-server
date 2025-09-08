#!/bin/bash

# NEXUS IDE Security Dashboard - Deployment Script
# This script helps deploy the Helm chart to different environments

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
ENVIRONMENT="development"
NAMESPACE="nexus-ide"
RELEASE_NAME="nexus-ide-dashboard"
CHART_PATH="."
VALUES_FILE=""
DRY_RUN="false"
WAIT="true"
TIMEOUT="10m"
FORCE="false"
CREATE_NAMESPACE="true"
VERBOSE="false"
SKIP_TESTS="false"
SKIP_BACKUP="false"

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
    echo "Deploy NEXUS IDE Security Dashboard to Kubernetes"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV       Target environment (development|staging|production) [default: development]"
    echo "  -n, --namespace NAMESPACE   Kubernetes namespace [default: nexus-ide]"
    echo "  -r, --release RELEASE       Helm release name [default: nexus-ide-dashboard]"
    echo "  -c, --chart PATH            Path to Helm chart [default: .]"
    echo "  -f, --values FILE           Values file to use"
    echo "  -d, --dry-run               Perform a dry run without making changes"
    echo "  -w, --no-wait               Don't wait for deployment to complete"
    echo "  -t, --timeout DURATION      Timeout for deployment [default: 10m]"
    echo "      --force                 Force deployment even if validation fails"
    echo "      --no-create-namespace   Don't create namespace if it doesn't exist"
    echo "  -v, --verbose               Enable verbose output"
    echo "      --skip-tests            Skip pre-deployment tests"
    echo "      --skip-backup           Skip backup creation"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Environment Presets:"
    echo "  development:  Single replica, no TLS, basic auth disabled"
    echo "  staging:      2 replicas, TLS enabled, auth enabled"
    echo "  production:   3+ replicas, full security, monitoring enabled"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Deploy to development"
    echo "  $0 -e staging -n nexus-staging        # Deploy to staging environment"
    echo "  $0 -e production --dry-run            # Dry run production deployment"
    echo "  $0 -f custom-values.yaml              # Deploy with custom values"
    echo "  $0 --force --skip-tests               # Force deploy without tests"
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
    
    # Check Helm chart
    if [[ ! -f "$CHART_PATH/Chart.yaml" ]]; then
        print_error "Chart.yaml not found at $CHART_PATH"
        exit 1
    fi
    
    print_success "Prerequisites validated"
}

# Function to run pre-deployment tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        print_warning "Skipping pre-deployment tests"
        return
    fi
    
    print_step "Running pre-deployment tests..."
    
    # Lint the chart
    print_info "Linting Helm chart..."
    if ! helm lint "$CHART_PATH"; then
        if [[ "$FORCE" != "true" ]]; then
            print_error "Helm chart linting failed"
            exit 1
        else
            print_warning "Helm chart linting failed, but continuing due to --force flag"
        fi
    fi
    
    # Validate templates
    print_info "Validating Helm templates..."
    local template_args=("$RELEASE_NAME" "$CHART_PATH" --validate)
    
    if [[ -n "$VALUES_FILE" ]]; then
        template_args+=(--values "$VALUES_FILE")
    fi
    
    # Add environment-specific values
    case $ENVIRONMENT in
        "development")
            template_args+=(--set replicaCount=1 --set auth.enabled=false --set tls.enabled=false)
            ;;
        "staging")
            template_args+=(--set replicaCount=2 --set auth.enabled=true --set tls.enabled=true)
            ;;
        "production")
            template_args+=(--set replicaCount=3 --set auth.enabled=true --set tls.enabled=true --set autoscaling.enabled=true)
            ;;
    esac
    
    if ! helm template "${template_args[@]}" > /dev/null; then
        if [[ "$FORCE" != "true" ]]; then
            print_error "Helm template validation failed"
            exit 1
        else
            print_warning "Helm template validation failed, but continuing due to --force flag"
        fi
    fi
    
    print_success "Pre-deployment tests passed"
}

# Function to create backup
create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        print_warning "Skipping backup creation"
        return
    fi
    
    print_step "Creating backup..."
    
    # Check if release exists
    if helm status "$RELEASE_NAME" --namespace "$NAMESPACE" &> /dev/null; then
        local backup_dir="backups/$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        
        print_info "Creating backup in $backup_dir"
        
        # Backup current values
        helm get values "$RELEASE_NAME" --namespace "$NAMESPACE" > "$backup_dir/values.yaml"
        
        # Backup current manifest
        helm get manifest "$RELEASE_NAME" --namespace "$NAMESPACE" > "$backup_dir/manifest.yaml"
        
        # Backup release info
        helm status "$RELEASE_NAME" --namespace "$NAMESPACE" > "$backup_dir/status.txt"
        
        # Create backup metadata
        cat > "$backup_dir/metadata.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "release_name": "$RELEASE_NAME",
  "namespace": "$NAMESPACE",
  "environment": "$ENVIRONMENT",
  "chart_version": "$(helm list --namespace $NAMESPACE --filter $RELEASE_NAME -o json | jq -r '.[0].chart')",
  "app_version": "$(helm list --namespace $NAMESPACE --filter $RELEASE_NAME -o json | jq -r '.[0].app_version')",
  "revision": "$(helm list --namespace $NAMESPACE --filter $RELEASE_NAME -o json | jq -r '.[0].revision')"
}
EOF
        
        print_success "Backup created: $backup_dir"
    else
        print_info "No existing release found, skipping backup"
    fi
}

# Function to prepare namespace
prepare_namespace() {
    print_step "Preparing namespace..."
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_info "Namespace $NAMESPACE already exists"
    else
        if [[ "$CREATE_NAMESPACE" == "true" ]]; then
            print_info "Creating namespace $NAMESPACE"
            if [[ "$DRY_RUN" != "true" ]]; then
                kubectl create namespace "$NAMESPACE"
            fi
        else
            print_error "Namespace $NAMESPACE does not exist and --no-create-namespace is set"
            exit 1
        fi
    fi
    
    # Label namespace for monitoring and security
    if [[ "$DRY_RUN" != "true" ]]; then
        kubectl label namespace "$NAMESPACE" \
            app.kubernetes.io/name=nexus-ide \
            app.kubernetes.io/component=security-dashboard \
            environment="$ENVIRONMENT" \
            --overwrite
    fi
    
    print_success "Namespace prepared"
}

# Function to deploy the chart
deploy_chart() {
    print_step "Deploying Helm chart..."
    
    local helm_args=()
    local action="install"
    
    # Check if release already exists
    if helm status "$RELEASE_NAME" --namespace "$NAMESPACE" &> /dev/null; then
        action="upgrade"
        print_info "Existing release found, performing upgrade"
    else
        print_info "No existing release found, performing install"
    fi
    
    # Build helm command arguments
    helm_args+=("$action" "$RELEASE_NAME" "$CHART_PATH")
    helm_args+=(--namespace "$NAMESPACE")
    
    if [[ "$action" == "install" && "$CREATE_NAMESPACE" == "true" ]]; then
        helm_args+=(--create-namespace)
    fi
    
    if [[ "$WAIT" == "true" ]]; then
        helm_args+=(--wait --timeout="$TIMEOUT")
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        helm_args+=(--dry-run --debug)
    fi
    
    # Add values file if specified
    if [[ -n "$VALUES_FILE" ]]; then
        if [[ ! -f "$VALUES_FILE" ]]; then
            print_error "Values file not found: $VALUES_FILE"
            exit 1
        fi
        helm_args+=(--values "$VALUES_FILE")
    fi
    
    # Add environment-specific values
    case $ENVIRONMENT in
        "development")
            helm_args+=(
                --set global.environment=development
                --set replicaCount=1
                --set auth.enabled=false
                --set tls.enabled=false
                --set development.enabled=true
                --set development.debug=true
                --set monitoring.prometheus.enabled=false
                --set monitoring.grafana.enabled=false
            )
            ;;
        "staging")
            helm_args+=(
                --set global.environment=staging
                --set replicaCount=2
                --set auth.enabled=true
                --set tls.enabled=true
                --set monitoring.prometheus.enabled=true
                --set monitoring.grafana.enabled=true
                --set backup.enabled=true
            )
            ;;
        "production")
            helm_args+=(
                --set global.environment=production
                --set replicaCount=3
                --set auth.enabled=true
                --set tls.enabled=true
                --set autoscaling.enabled=true
                --set monitoring.prometheus.enabled=true
                --set monitoring.grafana.enabled=true
                --set monitoring.jaeger.enabled=true
                --set backup.enabled=true
                --set security.networkPolicy.enabled=true
                --set security.podSecurityPolicy.enabled=true
            )
            ;;
    esac
    
    # Add additional labels
    helm_args+=(
        --set global.labels.environment="$ENVIRONMENT"
        --set global.labels.deployment-time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    )
    
    print_debug "Helm command: helm ${helm_args[*]}"
    
    # Execute helm command
    if helm "${helm_args[@]}"; then
        if [[ "$DRY_RUN" == "true" ]]; then
            print_success "Dry run completed successfully"
        else
            print_success "Deployment completed successfully"
        fi
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    print_step "Verifying deployment..."
    
    # Wait for pods to be ready
    print_info "Waiting for pods to be ready..."
    if ! kubectl wait --for=condition=ready pod \
        --selector=app.kubernetes.io/name=security-dashboard \
        --namespace="$NAMESPACE" \
        --timeout=300s; then
        print_warning "Some pods may not be ready yet"
    fi
    
    # Check deployment status
    print_info "Checking deployment status..."
    kubectl get pods,svc,ingress -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard
    
    # Check Helm release status
    print_info "Checking Helm release status..."
    helm status "$RELEASE_NAME" --namespace "$NAMESPACE"
    
    print_success "Deployment verification completed"
}

# Function to show post-deployment information
show_post_deployment_info() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    print_step "Post-deployment information"
    
    echo ""
    echo -e "${CYAN}🎉 NEXUS IDE Security Dashboard Deployed Successfully!${NC}"
    echo ""
    
    # Get service information
    local service_info
    service_info=$(kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$service_info" ]]; then
        echo -e "${YELLOW}📋 Access Information:${NC}"
        echo "  Environment: $ENVIRONMENT"
        echo "  Namespace: $NAMESPACE"
        echo "  Release: $RELEASE_NAME"
        echo ""
        
        # Port forwarding instructions
        echo -e "${YELLOW}🔗 Access Methods:${NC}"
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
    echo "  Helm values:      helm get values $RELEASE_NAME -n $NAMESPACE"
    echo "  Port forward:     make port-forward"
    echo ""
    
    # Environment-specific information
    case $ENVIRONMENT in
        "development")
            echo -e "${YELLOW}🔧 Development Environment Notes:${NC}"
            echo "  - Authentication is disabled for easier development"
            echo "  - TLS is disabled"
            echo "  - Debug mode is enabled"
            echo "  - Single replica for resource efficiency"
            ;;
        "staging")
            echo -e "${YELLOW}🧪 Staging Environment Notes:${NC}"
            echo "  - Authentication is enabled"
            echo "  - TLS is enabled"
            echo "  - Monitoring is enabled"
            echo "  - Backup is enabled"
            ;;
        "production")
            echo -e "${YELLOW}🚀 Production Environment Notes:${NC}"
            echo "  - Full security features enabled"
            echo "  - Auto-scaling is enabled"
            echo "  - Comprehensive monitoring enabled"
            echo "  - Backup and disaster recovery enabled"
            echo "  - Network policies enforced"
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
}

# Function to handle cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        print_error "Deployment failed with exit code $exit_code"
        
        if [[ "$DRY_RUN" != "true" ]]; then
            print_info "You may want to check the following:"
            print_info "  - kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp'"
            print_info "  - kubectl describe pods -n $NAMESPACE"
            print_info "  - helm status $RELEASE_NAME -n $NAMESPACE"
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
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -r|--release)
                RELEASE_NAME="$2"
                shift 2
                ;;
            -c|--chart)
                CHART_PATH="$2"
                shift 2
                ;;
            -f|--values)
                VALUES_FILE="$2"
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
            --no-create-namespace)
                CREATE_NAMESPACE="false"
                shift
                ;;
            -v|--verbose)
                VERBOSE="true"
                shift
                ;;
            --skip-tests)
                SKIP_TESTS="true"
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP="true"
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
    
    # Validate environment
    case $ENVIRONMENT in
        "development"|"staging"|"production")
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
            exit 1
            ;;
    esac
    
    # Adjust namespace based on environment
    if [[ "$NAMESPACE" == "nexus-ide" && "$ENVIRONMENT" != "development" ]]; then
        NAMESPACE="nexus-ide-$ENVIRONMENT"
    fi
    
    # Show deployment information
    echo -e "${CYAN}🚀 NEXUS IDE Security Dashboard Deployment${NC}"
    echo -e "${CYAN}===========================================${NC}"
    echo ""
    print_info "Environment: $ENVIRONMENT"
    print_info "Namespace: $NAMESPACE"
    print_info "Release: $RELEASE_NAME"
    print_info "Chart: $CHART_PATH"
    if [[ -n "$VALUES_FILE" ]]; then
        print_info "Values file: $VALUES_FILE"
    fi
    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "DRY RUN MODE - No changes will be made"
    fi
    echo ""
    
    # Execute deployment steps
    validate_prerequisites
    run_tests
    create_backup
    prepare_namespace
    deploy_chart
    verify_deployment
    show_post_deployment_info
}

# Run main function with all arguments
main "$@"