#!/bin/bash

# NEXUS IDE Security Dashboard - Test Script
# This script runs comprehensive tests for the Helm chart and deployment

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
NAMESPACE="nexus-ide-test"
RELEASE_NAME="nexus-ide-dashboard-test"
CHART_PATH="."
TEST_TIMEOUT="15m"
CLEANUP_AFTER_TEST="true"
VERBOSE="false"
TEST_SUITE="all"
PARALLEL_TESTS="true"
GENERATE_REPORT="true"
REPORT_FORMAT="html"

# Test configuration
TEST_RESULTS_DIR="test-results"
TEST_REPORT_FILE="test-report"
TEST_NAMESPACE_PREFIX="nexus-test"
TEST_RELEASE_PREFIX="nexus-test"

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

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Run comprehensive tests for NEXUS IDE Security Dashboard Helm chart"
    echo ""
    echo "Options:"
    echo "  -n, --namespace NAMESPACE   Test namespace [default: nexus-ide-test]"
    echo "  -r, --release RELEASE       Test release name [default: nexus-ide-dashboard-test]"
    echo "  -c, --chart PATH            Path to Helm chart [default: .]"
    echo "  -t, --timeout DURATION      Test timeout [default: 15m]"
    echo "  -s, --suite SUITE           Test suite to run (all|lint|template|install|upgrade|security|performance) [default: all]"
    echo "      --no-cleanup            Don't cleanup test resources after completion"
    echo "      --no-parallel           Run tests sequentially instead of parallel"
    echo "      --no-report             Don't generate test report"
    echo "      --report-format FORMAT  Report format (html|json|junit) [default: html]"
    echo "  -v, --verbose               Enable verbose output"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Test Suites:"
    echo "  all:         Run all test suites"
    echo "  lint:        Helm chart linting and validation"
    echo "  template:    Template rendering and validation"
    echo "  install:     Installation and deployment tests"
    echo "  upgrade:     Upgrade and rollback tests"
    echo "  security:    Security and compliance tests"
    echo "  performance: Performance and load tests"
    echo ""
    echo "Examples:"
    echo "  $0                          # Run all tests"
    echo "  $0 --suite lint             # Run only linting tests"
    echo "  $0 --suite install --verbose # Run installation tests with verbose output"
    echo "  $0 --no-cleanup --no-parallel # Run tests without cleanup and parallel execution"
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
    
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
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
    
    # Create test results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    print_success "Prerequisites validated"
}

# Function to setup test environment
setup_test_environment() {
    print_step "Setting up test environment..."
    
    # Generate unique test identifiers
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local random_suffix=$(openssl rand -hex 4 2>/dev/null || echo "$(date +%s)")
    
    NAMESPACE="${TEST_NAMESPACE_PREFIX}-${timestamp}-${random_suffix}"
    RELEASE_NAME="${TEST_RELEASE_PREFIX}-${timestamp}-${random_suffix}"
    
    print_info "Test namespace: $NAMESPACE"
    print_info "Test release: $RELEASE_NAME"
    
    # Create test namespace
    if ! kubectl create namespace "$NAMESPACE" &> /dev/null; then
        print_warning "Namespace $NAMESPACE already exists or creation failed"
    fi
    
    # Label namespace for easy cleanup
    kubectl label namespace "$NAMESPACE" \
        test-suite=nexus-ide \
        test-timestamp="$timestamp" \
        test-session="$random_suffix" \
        --overwrite
    
    print_success "Test environment setup completed"
}

# Function to run lint tests
run_lint_tests() {
    print_test "Running Helm chart linting tests..."
    
    local test_results=()
    
    # Test 1: Helm lint
    print_info "Test 1: Helm chart linting"
    if helm lint "$CHART_PATH" > "$TEST_RESULTS_DIR/helm-lint.log" 2>&1; then
        print_success "✓ Helm chart linting passed"
        test_results+=("helm-lint:PASS")
    else
        print_error "✗ Helm chart linting failed"
        test_results+=("helm-lint:FAIL")
        cat "$TEST_RESULTS_DIR/helm-lint.log"
    fi
    
    # Test 2: Chart.yaml validation
    print_info "Test 2: Chart.yaml validation"
    if helm show chart "$CHART_PATH" > "$TEST_RESULTS_DIR/chart-info.yaml" 2>&1; then
        print_success "✓ Chart.yaml validation passed"
        test_results+=("chart-yaml:PASS")
    else
        print_error "✗ Chart.yaml validation failed"
        test_results+=("chart-yaml:FAIL")
    fi
    
    # Test 3: Values schema validation
    print_info "Test 3: Values schema validation"
    if [[ -f "$CHART_PATH/values.schema.json" ]]; then
        if helm lint "$CHART_PATH" --strict > "$TEST_RESULTS_DIR/values-schema.log" 2>&1; then
            print_success "✓ Values schema validation passed"
            test_results+=("values-schema:PASS")
        else
            print_error "✗ Values schema validation failed"
            test_results+=("values-schema:FAIL")
        fi
    else
        print_warning "⚠ Values schema not found, skipping validation"
        test_results+=("values-schema:SKIP")
    fi
    
    # Test 4: Dependencies check
    print_info "Test 4: Dependencies check"
    if helm dependency list "$CHART_PATH" > "$TEST_RESULTS_DIR/dependencies.log" 2>&1; then
        print_success "✓ Dependencies check passed"
        test_results+=("dependencies:PASS")
    else
        print_warning "⚠ Dependencies check completed with warnings"
        test_results+=("dependencies:WARN")
    fi
    
    echo "${test_results[@]}" > "$TEST_RESULTS_DIR/lint-results.txt"
    print_success "Lint tests completed"
}

# Function to run template tests
run_template_tests() {
    print_test "Running template rendering tests..."
    
    local test_results=()
    local test_scenarios=(
        "default::"
        "development:--set global.environment=development --set replicaCount=1"
        "staging:--set global.environment=staging --set replicaCount=2 --set auth.enabled=true"
        "production:--set global.environment=production --set replicaCount=3 --set autoscaling.enabled=true"
        "minimal:--set replicaCount=1 --set auth.enabled=false --set tls.enabled=false"
        "secure:--set auth.enabled=true --set tls.enabled=true --set security.networkPolicy.enabled=true"
    )
    
    for scenario in "${test_scenarios[@]}"; do
        local scenario_name=$(echo "$scenario" | cut -d: -f1)
        local scenario_args=$(echo "$scenario" | cut -d: -f3-)
        
        print_info "Test: Template rendering - $scenario_name"
        
        local template_args=("template" "$RELEASE_NAME" "$CHART_PATH" --validate --debug)
        if [[ -n "$scenario_args" ]]; then
            # Split scenario_args into array
            IFS=' ' read -ra args_array <<< "$scenario_args"
            template_args+=("${args_array[@]}")
        fi
        
        if helm "${template_args[@]}" > "$TEST_RESULTS_DIR/template-${scenario_name}.yaml" 2>&1; then
            print_success "✓ Template rendering ($scenario_name) passed"
            test_results+=("template-${scenario_name}:PASS")
            
            # Validate generated YAML
            if kubectl apply --dry-run=client -f "$TEST_RESULTS_DIR/template-${scenario_name}.yaml" > /dev/null 2>&1; then
                print_success "✓ Generated YAML ($scenario_name) is valid"
                test_results+=("yaml-${scenario_name}:PASS")
            else
                print_error "✗ Generated YAML ($scenario_name) is invalid"
                test_results+=("yaml-${scenario_name}:FAIL")
            fi
        else
            print_error "✗ Template rendering ($scenario_name) failed"
            test_results+=("template-${scenario_name}:FAIL")
        fi
    done
    
    echo "${test_results[@]}" > "$TEST_RESULTS_DIR/template-results.txt"
    print_success "Template tests completed"
}

# Function to run installation tests
run_install_tests() {
    print_test "Running installation tests..."
    
    local test_results=()
    
    # Test 1: Basic installation
    print_info "Test 1: Basic installation"
    if helm install "$RELEASE_NAME" "$CHART_PATH" \
        --namespace "$NAMESPACE" \
        --wait --timeout="$TEST_TIMEOUT" \
        --set replicaCount=1 \
        --set auth.enabled=false \
        --set tls.enabled=false > "$TEST_RESULTS_DIR/install.log" 2>&1; then
        print_success "✓ Basic installation passed"
        test_results+=("install:PASS")
        
        # Wait for pods to be ready
        if kubectl wait --for=condition=ready pod \
            --selector=app.kubernetes.io/name=security-dashboard \
            --namespace="$NAMESPACE" \
            --timeout=300s > "$TEST_RESULTS_DIR/pod-ready.log" 2>&1; then
            print_success "✓ Pods are ready"
            test_results+=("pod-ready:PASS")
        else
            print_error "✗ Pods failed to become ready"
            test_results+=("pod-ready:FAIL")
        fi
        
        # Test service accessibility
        local service_name=$(kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
        if [[ -n "$service_name" ]]; then
            print_success "✓ Service created: $service_name"
            test_results+=("service:PASS")
        else
            print_error "✗ Service not found"
            test_results+=("service:FAIL")
        fi
        
    else
        print_error "✗ Basic installation failed"
        test_results+=("install:FAIL")
        cat "$TEST_RESULTS_DIR/install.log"
    fi
    
    echo "${test_results[@]}" > "$TEST_RESULTS_DIR/install-results.txt"
    print_success "Installation tests completed"
}

# Function to run upgrade tests
run_upgrade_tests() {
    print_test "Running upgrade tests..."
    
    local test_results=()
    
    # Test 1: Upgrade with new values
    print_info "Test 1: Upgrade with new values"
    if helm upgrade "$RELEASE_NAME" "$CHART_PATH" \
        --namespace "$NAMESPACE" \
        --wait --timeout="$TEST_TIMEOUT" \
        --set replicaCount=2 \
        --set auth.enabled=true > "$TEST_RESULTS_DIR/upgrade.log" 2>&1; then
        print_success "✓ Upgrade passed"
        test_results+=("upgrade:PASS")
        
        # Verify upgrade
        local current_replicas=$(kubectl get deployment -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].spec.replicas}' 2>/dev/null || echo "0")
        if [[ "$current_replicas" == "2" ]]; then
            print_success "✓ Replica count updated correctly"
            test_results+=("upgrade-verify:PASS")
        else
            print_error "✗ Replica count not updated (expected: 2, actual: $current_replicas)"
            test_results+=("upgrade-verify:FAIL")
        fi
    else
        print_error "✗ Upgrade failed"
        test_results+=("upgrade:FAIL")
        cat "$TEST_RESULTS_DIR/upgrade.log"
    fi
    
    # Test 2: Rollback
    print_info "Test 2: Rollback test"
    if helm rollback "$RELEASE_NAME" 1 \
        --namespace "$NAMESPACE" \
        --wait --timeout="$TEST_TIMEOUT" > "$TEST_RESULTS_DIR/rollback.log" 2>&1; then
        print_success "✓ Rollback passed"
        test_results+=("rollback:PASS")
        
        # Verify rollback
        local current_replicas=$(kubectl get deployment -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].spec.replicas}' 2>/dev/null || echo "0")
        if [[ "$current_replicas" == "1" ]]; then
            print_success "✓ Rollback verified correctly"
            test_results+=("rollback-verify:PASS")
        else
            print_error "✗ Rollback not verified (expected: 1, actual: $current_replicas)"
            test_results+=("rollback-verify:FAIL")
        fi
    else
        print_error "✗ Rollback failed"
        test_results+=("rollback:FAIL")
        cat "$TEST_RESULTS_DIR/rollback.log"
    fi
    
    echo "${test_results[@]}" > "$TEST_RESULTS_DIR/upgrade-results.txt"
    print_success "Upgrade tests completed"
}

# Function to run security tests
run_security_tests() {
    print_test "Running security tests..."
    
    local test_results=()
    
    # Test 1: Pod Security Context
    print_info "Test 1: Pod Security Context"
    local security_context=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].spec.securityContext}' 2>/dev/null || echo "{}")
    if [[ "$security_context" != "{}" && "$security_context" != "null" ]]; then
        print_success "✓ Pod Security Context configured"
        test_results+=("pod-security:PASS")
    else
        print_warning "⚠ Pod Security Context not configured"
        test_results+=("pod-security:WARN")
    fi
    
    # Test 2: Container Security Context
    print_info "Test 2: Container Security Context"
    local container_security=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].spec.containers[0].securityContext}' 2>/dev/null || echo "{}")
    if [[ "$container_security" != "{}" && "$container_security" != "null" ]]; then
        print_success "✓ Container Security Context configured"
        test_results+=("container-security:PASS")
    else
        print_warning "⚠ Container Security Context not configured"
        test_results+=("container-security:WARN")
    fi
    
    # Test 3: Service Account
    print_info "Test 3: Service Account"
    local service_account=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].spec.serviceAccountName}' 2>/dev/null || echo "default")
    if [[ "$service_account" != "default" ]]; then
        print_success "✓ Custom Service Account configured: $service_account"
        test_results+=("service-account:PASS")
    else
        print_warning "⚠ Using default Service Account"
        test_results+=("service-account:WARN")
    fi
    
    # Test 4: Network Policy (if enabled)
    print_info "Test 4: Network Policy"
    if kubectl get networkpolicy -n "$NAMESPACE" > /dev/null 2>&1; then
        print_success "✓ Network Policy configured"
        test_results+=("network-policy:PASS")
    else
        print_info "ℹ Network Policy not configured (may be intentional)"
        test_results+=("network-policy:SKIP")
    fi
    
    # Test 5: Resource Limits
    print_info "Test 5: Resource Limits"
    local resource_limits=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].spec.containers[0].resources.limits}' 2>/dev/null || echo "{}")
    if [[ "$resource_limits" != "{}" && "$resource_limits" != "null" ]]; then
        print_success "✓ Resource Limits configured"
        test_results+=("resource-limits:PASS")
    else
        print_warning "⚠ Resource Limits not configured"
        test_results+=("resource-limits:WARN")
    fi
    
    echo "${test_results[@]}" > "$TEST_RESULTS_DIR/security-results.txt"
    print_success "Security tests completed"
}

# Function to run performance tests
run_performance_tests() {
    print_test "Running performance tests..."
    
    local test_results=()
    
    # Test 1: Pod startup time
    print_info "Test 1: Pod startup time"
    local pod_name=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [[ -n "$pod_name" ]]; then
        local created_time=$(kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.metadata.creationTimestamp}')
        local ready_time=$(kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.status.conditions[?(@.type=="Ready")].lastTransitionTime}')
        
        if [[ -n "$created_time" && -n "$ready_time" ]]; then
            print_success "✓ Pod startup time measured"
            test_results+=("startup-time:PASS")
            echo "Created: $created_time" > "$TEST_RESULTS_DIR/performance-startup.log"
            echo "Ready: $ready_time" >> "$TEST_RESULTS_DIR/performance-startup.log"
        else
            print_warning "⚠ Could not measure startup time"
            test_results+=("startup-time:WARN")
        fi
    else
        print_error "✗ No pods found for performance testing"
        test_results+=("startup-time:FAIL")
    fi
    
    # Test 2: Resource usage
    print_info "Test 2: Resource usage"
    if kubectl top pods -n "$NAMESPACE" --no-headers > "$TEST_RESULTS_DIR/resource-usage.log" 2>&1; then
        print_success "✓ Resource usage collected"
        test_results+=("resource-usage:PASS")
    else
        print_warning "⚠ Could not collect resource usage (metrics-server may not be available)"
        test_results+=("resource-usage:WARN")
    fi
    
    # Test 3: Service response
    print_info "Test 3: Service response test"
    local service_name=$(kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/name=security-dashboard -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [[ -n "$service_name" ]]; then
        # Port forward and test (basic connectivity)
        kubectl port-forward -n "$NAMESPACE" "svc/$service_name" 8080:80 > /dev/null 2>&1 &
        local port_forward_pid=$!
        sleep 5
        
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 > "$TEST_RESULTS_DIR/service-response.log" 2>&1; then
            print_success "✓ Service response test completed"
            test_results+=("service-response:PASS")
        else
            print_warning "⚠ Service response test failed (may be expected for some configurations)"
            test_results+=("service-response:WARN")
        fi
        
        # Cleanup port forward
        kill $port_forward_pid 2>/dev/null || true
    else
        print_warning "⚠ No service found for response testing"
        test_results+=("service-response:SKIP")
    fi
    
    echo "${test_results[@]}" > "$TEST_RESULTS_DIR/performance-results.txt"
    print_success "Performance tests completed"
}

# Function to cleanup test resources
cleanup_test_resources() {
    if [[ "$CLEANUP_AFTER_TEST" != "true" ]]; then
        print_warning "Skipping cleanup (--no-cleanup specified)"
        print_info "Test resources left in namespace: $NAMESPACE"
        return
    fi
    
    print_step "Cleaning up test resources..."
    
    # Uninstall Helm release
    if helm status "$RELEASE_NAME" --namespace "$NAMESPACE" &> /dev/null; then
        print_info "Uninstalling Helm release: $RELEASE_NAME"
        helm uninstall "$RELEASE_NAME" --namespace "$NAMESPACE" > /dev/null 2>&1 || true
    fi
    
    # Delete namespace
    print_info "Deleting test namespace: $NAMESPACE"
    kubectl delete namespace "$NAMESPACE" --ignore-not-found=true > /dev/null 2>&1 || true
    
    print_success "Test resources cleaned up"
}

# Function to generate test report
generate_test_report() {
    if [[ "$GENERATE_REPORT" != "true" ]]; then
        return
    fi
    
    print_step "Generating test report..."
    
    local report_file="$TEST_RESULTS_DIR/$TEST_REPORT_FILE"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    case $REPORT_FORMAT in
        "html")
            generate_html_report "$report_file.html" "$timestamp"
            ;;
        "json")
            generate_json_report "$report_file.json" "$timestamp"
            ;;
        "junit")
            generate_junit_report "$report_file.xml" "$timestamp"
            ;;
        *)
            print_warning "Unknown report format: $REPORT_FORMAT, generating HTML report"
            generate_html_report "$report_file.html" "$timestamp"
            ;;
    esac
    
    print_success "Test report generated: $report_file.$REPORT_FORMAT"
}

# Function to generate HTML report
generate_html_report() {
    local report_file="$1"
    local timestamp="$2"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE Security Dashboard - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { padding: 20px; border-radius: 8px; text-align: center; }
        .pass { background-color: #d4edda; border-left: 4px solid #28a745; }
        .fail { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        .warn { background-color: #fff3cd; border-left: 4px solid #ffc107; }
        .skip { background-color: #e2e3e5; border-left: 4px solid #6c757d; }
        .test-suite { margin-bottom: 30px; }
        .test-suite h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .test-result { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 NEXUS IDE Security Dashboard</h1>
            <h2>Test Report</h2>
            <p class="timestamp">Generated: $timestamp</p>
        </div>
        
        <div class="summary">
EOF
    
    # Count test results
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local warned_tests=0
    local skipped_tests=0
    
    for result_file in "$TEST_RESULTS_DIR"/*-results.txt; do
        if [[ -f "$result_file" ]]; then
            while read -r result; do
                total_tests=$((total_tests + 1))
                if [[ "$result" == *":PASS" ]]; then
                    passed_tests=$((passed_tests + 1))
                elif [[ "$result" == *":FAIL" ]]; then
                    failed_tests=$((failed_tests + 1))
                elif [[ "$result" == *":WARN" ]]; then
                    warned_tests=$((warned_tests + 1))
                elif [[ "$result" == *":SKIP" ]]; then
                    skipped_tests=$((skipped_tests + 1))
                fi
            done < "$result_file"
        fi
    done
    
    # Add summary cards
    cat >> "$report_file" << EOF
            <div class="summary-card pass">
                <h3>$passed_tests</h3>
                <p>Passed</p>
            </div>
            <div class="summary-card fail">
                <h3>$failed_tests</h3>
                <p>Failed</p>
            </div>
            <div class="summary-card warn">
                <h3>$warned_tests</h3>
                <p>Warnings</p>
            </div>
            <div class="summary-card skip">
                <h3>$skipped_tests</h3>
                <p>Skipped</p>
            </div>
        </div>
EOF
    
    # Add test suite details
    for result_file in "$TEST_RESULTS_DIR"/*-results.txt; do
        if [[ -f "$result_file" ]]; then
            local suite_name=$(basename "$result_file" -results.txt)
            echo "        <div class=\"test-suite\">" >> "$report_file"
            echo "            <h3>$(echo "$suite_name" | tr '[:lower:]' '[:upper:]') Tests</h3>" >> "$report_file"
            
            while read -r result; do
                local test_name=$(echo "$result" | cut -d: -f1)
                local test_status=$(echo "$result" | cut -d: -f2)
                local css_class=""
                local icon=""
                
                case $test_status in
                    "PASS") css_class="pass"; icon="✓" ;;
                    "FAIL") css_class="fail"; icon="✗" ;;
                    "WARN") css_class="warn"; icon="⚠" ;;
                    "SKIP") css_class="skip"; icon="⊘" ;;
                esac
                
                echo "            <div class=\"test-result $css_class\">" >> "$report_file"
                echo "                $icon $test_name: $test_status" >> "$report_file"
                echo "            </div>" >> "$report_file"
            done < "$result_file"
            
            echo "        </div>" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF
    </div>
</body>
</html>
EOF
}

# Function to generate JSON report
generate_json_report() {
    local report_file="$1"
    local timestamp="$2"
    
    cat > "$report_file" << EOF
{
  "report": {
    "title": "NEXUS IDE Security Dashboard Test Report",
    "timestamp": "$timestamp",
    "namespace": "$NAMESPACE",
    "release": "$RELEASE_NAME",
    "chart_path": "$CHART_PATH",
    "test_suite": "$TEST_SUITE"
  },
  "summary": {
EOF
    
    # Count and add summary
    local total=0 passed=0 failed=0 warned=0 skipped=0
    
    for result_file in "$TEST_RESULTS_DIR"/*-results.txt; do
        if [[ -f "$result_file" ]]; then
            while read -r result; do
                total=$((total + 1))
                case "$result" in
                    *":PASS") passed=$((passed + 1)) ;;
                    *":FAIL") failed=$((failed + 1)) ;;
                    *":WARN") warned=$((warned + 1)) ;;
                    *":SKIP") skipped=$((skipped + 1)) ;;
                esac
            done < "$result_file"
        fi
    done
    
    cat >> "$report_file" << EOF
    "total": $total,
    "passed": $passed,
    "failed": $failed,
    "warned": $warned,
    "skipped": $skipped
  },
  "test_suites": [
EOF
    
    # Add test suite results
    local first_suite=true
    for result_file in "$TEST_RESULTS_DIR"/*-results.txt; do
        if [[ -f "$result_file" ]]; then
            if [[ "$first_suite" != "true" ]]; then
                echo "," >> "$report_file"
            fi
            first_suite=false
            
            local suite_name=$(basename "$result_file" -results.txt)
            echo "    {" >> "$report_file"
            echo "      \"name\": \"$suite_name\"," >> "$report_file"
            echo "      \"tests\": [" >> "$report_file"
            
            local first_test=true
            while read -r result; do
                if [[ "$first_test" != "true" ]]; then
                    echo "," >> "$report_file"
                fi
                first_test=false
                
                local test_name=$(echo "$result" | cut -d: -f1)
                local test_status=$(echo "$result" | cut -d: -f2)
                
                echo "        {" >> "$report_file"
                echo "          \"name\": \"$test_name\"," >> "$report_file"
                echo "          \"status\": \"$test_status\"" >> "$report_file"
                echo "        }" >> "$report_file"
            done < "$result_file"
            
            echo "      ]" >> "$report_file"
            echo "    }" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF
  ]
}
EOF
}

# Function to generate JUnit report
generate_junit_report() {
    local report_file="$1"
    local timestamp="$2"
    
    # Count tests
    local total=0 failures=0 errors=0 skipped=0
    
    for result_file in "$TEST_RESULTS_DIR"/*-results.txt; do
        if [[ -f "$result_file" ]]; then
            while read -r result; do
                total=$((total + 1))
                case "$result" in
                    *":FAIL") failures=$((failures + 1)) ;;
                    *":WARN") errors=$((errors + 1)) ;;
                    *":SKIP") skipped=$((skipped + 1)) ;;
                esac
            done < "$result_file"
        fi
    done
    
    cat > "$report_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="NEXUS IDE Security Dashboard Tests" tests="$total" failures="$failures" errors="$errors" skipped="$skipped" time="0" timestamp="$timestamp">
EOF
    
    # Add test suites
    for result_file in "$TEST_RESULTS_DIR"/*-results.txt; do
        if [[ -f "$result_file" ]]; then
            local suite_name=$(basename "$result_file" -results.txt)
            local suite_tests=0 suite_failures=0 suite_errors=0 suite_skipped=0
            
            # Count suite tests
            while read -r result; do
                suite_tests=$((suite_tests + 1))
                case "$result" in
                    *":FAIL") suite_failures=$((suite_failures + 1)) ;;
                    *":WARN") suite_errors=$((suite_errors + 1)) ;;
                    *":SKIP") suite_skipped=$((suite_skipped + 1)) ;;
                esac
            done < "$result_file"
            
            echo "  <testsuite name=\"$suite_name\" tests=\"$suite_tests\" failures=\"$suite_failures\" errors=\"$suite_errors\" skipped=\"$suite_skipped\" time=\"0\">" >> "$report_file"
            
            # Add test cases
            while read -r result; do
                local test_name=$(echo "$result" | cut -d: -f1)
                local test_status=$(echo "$result" | cut -d: -f2)
                
                echo "    <testcase name=\"$test_name\" classname=\"$suite_name\" time=\"0\">" >> "$report_file"
                
                case "$test_status" in
                    "FAIL")
                        echo "      <failure message=\"Test failed\">Test $test_name failed</failure>" >> "$report_file"
                        ;;
                    "WARN")
                        echo "      <error message=\"Test warning\">Test $test_name completed with warnings</error>" >> "$report_file"
                        ;;
                    "SKIP")
                        echo "      <skipped message=\"Test skipped\">Test $test_name was skipped</skipped>" >> "$report_file"
                        ;;
                esac
                
                echo "    </testcase>" >> "$report_file"
            done < "$result_file"
            
            echo "  </testsuite>" >> "$report_file"
        fi
    done
    
    echo "</testsuites>" >> "$report_file"
}

# Function to show test summary
show_test_summary() {
    print_step "Test Summary"
    
    echo ""
    echo -e "${CYAN}🧪 NEXUS IDE Security Dashboard Test Results${NC}"
    echo -e "${CYAN}=============================================${NC}"
    echo ""
    
    # Count total results
    local total=0 passed=0 failed=0 warned=0 skipped=0
    
    for result_file in "$TEST_RESULTS_DIR"/*-results.txt; do
        if [[ -f "$result_file" ]]; then
            local suite_name=$(basename "$result_file" -results.txt)
            echo -e "${YELLOW}📋 $(echo "$suite_name" | tr '[:lower:]' '[:upper:]') Tests:${NC}"
            
            while read -r result; do
                total=$((total + 1))
                local test_name=$(echo "$result" | cut -d: -f1)
                local test_status=$(echo "$result" | cut -d: -f2)
                
                case "$test_status" in
                    "PASS")
                        echo -e "  ${GREEN}✓${NC} $test_name"
                        passed=$((passed + 1))
                        ;;
                    "FAIL")
                        echo -e "  ${RED}✗${NC} $test_name"
                        failed=$((failed + 1))
                        ;;
                    "WARN")
                        echo -e "  ${YELLOW}⚠${NC} $test_name"
                        warned=$((warned + 1))
                        ;;
                    "SKIP")
                        echo -e "  ${BLUE}⊘${NC} $test_name"
                        skipped=$((skipped + 1))
                        ;;
                esac
            done < "$result_file"
            echo ""
        fi
    done
    
    # Overall summary
    echo -e "${CYAN}📊 Overall Summary:${NC}"
    echo "  Total Tests: $total"
    echo -e "  ${GREEN}Passed: $passed${NC}"
    echo -e "  ${RED}Failed: $failed${NC}"
    echo -e "  ${YELLOW}Warnings: $warned${NC}"
    echo -e "  ${BLUE}Skipped: $skipped${NC}"
    echo ""
    
    # Success rate
    if [[ $total -gt 0 ]]; then
        local success_rate=$(( (passed * 100) / total ))
        echo -e "  Success Rate: ${success_rate}%"
        echo ""
    fi
    
    # Final result
    if [[ $failed -eq 0 ]]; then
        echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
    else
        echo -e "${RED}❌ Some tests failed. Please review the results.${NC}"
    fi
    
    # Report information
    if [[ "$GENERATE_REPORT" == "true" ]]; then
        echo ""
        echo -e "${YELLOW}📄 Test Report:${NC}"
        echo "  Format: $REPORT_FORMAT"
        echo "  Location: $TEST_RESULTS_DIR/$TEST_REPORT_FILE.$REPORT_FORMAT"
    fi
    
    echo ""
}

# Function to handle cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        print_error "Tests failed with exit code $exit_code"
        
        print_info "Test artifacts available in: $TEST_RESULTS_DIR"
        print_info "Test namespace: $NAMESPACE (may contain debugging information)"
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
            -c|--chart)
                CHART_PATH="$2"
                shift 2
                ;;
            -t|--timeout)
                TEST_TIMEOUT="$2"
                shift 2
                ;;
            -s|--suite)
                TEST_SUITE="$2"
                shift 2
                ;;
            --no-cleanup)
                CLEANUP_AFTER_TEST="false"
                shift
                ;;
            --no-parallel)
                PARALLEL_TESTS="false"
                shift
                ;;
            --no-report)
                GENERATE_REPORT="false"
                shift
                ;;
            --report-format)
                REPORT_FORMAT="$2"
                shift 2
                ;;
            -v|--verbose)
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
    
    # Validate test suite
    case $TEST_SUITE in
        "all"|"lint"|"template"|"install"|"upgrade"|"security"|"performance")
            ;;
        *)
            print_error "Invalid test suite: $TEST_SUITE"
            print_info "Valid suites: all, lint, template, install, upgrade, security, performance"
            exit 1
            ;;
    esac
    
    # Show test information
    echo -e "${CYAN}🧪 NEXUS IDE Security Dashboard Test Suite${NC}"
    echo -e "${CYAN}===========================================${NC}"
    echo ""
    print_info "Chart Path: $CHART_PATH"
    print_info "Test Suite: $TEST_SUITE"
    print_info "Test Timeout: $TEST_TIMEOUT"
    print_info "Parallel Tests: $PARALLEL_TESTS"
    print_info "Generate Report: $GENERATE_REPORT"
    if [[ "$GENERATE_REPORT" == "true" ]]; then
        print_info "Report Format: $REPORT_FORMAT"
    fi
    print_info "Cleanup After Test: $CLEANUP_AFTER_TEST"
    echo ""
    
    # Execute test steps
    validate_prerequisites
    setup_test_environment
    
    # Run test suites
    case $TEST_SUITE in
        "all")
            run_lint_tests
            run_template_tests
            run_install_tests
            run_upgrade_tests
            run_security_tests
            run_performance_tests
            ;;
        "lint")
            run_lint_tests
            ;;
        "template")
            run_template_tests
            ;;
        "install")
            run_install_tests
            ;;
        "upgrade")
            run_install_tests  # Need to install first
            run_upgrade_tests
            ;;
        "security")
            run_install_tests  # Need to install first
            run_security_tests
            ;;
        "performance")
            run_install_tests  # Need to install first
            run_performance_tests
            ;;
    esac
    
    # Generate report and show summary
    generate_test_report
    show_test_summary
    
    # Cleanup
    cleanup_test_resources
}

# Run main function with all arguments
main "$@"