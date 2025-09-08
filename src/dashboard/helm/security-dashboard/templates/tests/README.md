# NEXUS IDE Security Dashboard - Helm Tests

This directory contains comprehensive test suites for validating the NEXUS IDE Security Dashboard deployment using Helm test hooks.

## 📋 Test Overview

Our test suite includes multiple test categories to ensure your deployment is working correctly:

### 🔗 Connection Tests (`test-connection.yaml`)
- **Purpose**: Validates basic application connectivity and health
- **Weight**: 1 (runs first)
- **Tests**:
  - Application health endpoint
  - Basic HTTP connectivity
  - Service discovery

### 🗄️ Database Tests (`test-database.yaml`)
- **Purpose**: Validates database connectivity and operations
- **Weight**: 2
- **Tests**:
  - PostgreSQL connection and basic operations
  - Redis connection and cache operations
  - MongoDB connection and document operations

### 🤖 AI Services Tests (`test-ai-services.yaml`)
- **Purpose**: Validates AI integration and services
- **Weight**: 3
- **Tests**:
  - AI Gateway health
  - OpenAI integration (if enabled)
  - Anthropic integration (if enabled)
  - Google AI integration (if enabled)
  - Local AI models (if enabled)
  - AI code completion endpoints
  - AI chat endpoints
  - Collaboration services (if enabled)

### ⚡ Performance Tests (`test-performance.yaml`)
- **Purpose**: Validates performance metrics and security
- **Weight**: 4
- **Tests**:
  - Metrics endpoint availability
  - Response time validation
  - Memory and CPU usage endpoints
  - Simple load testing
  - Security headers validation
  - Authentication endpoints
  - Rate limiting (if enabled)
  - CORS headers (if enabled)
  - Input validation
  - SQL injection protection

### 🔄 Integration Tests (`test-integration.yaml`)
- **Purpose**: End-to-end integration testing
- **Weight**: 5 (runs last)
- **Tests**:
  - Full application stack validation
  - API integration flow
  - Database integration testing
  - AI services integration
  - Collaboration services integration
  - Monitoring integration
  - Security integration
  - Complete end-to-end workflow

## 🚀 Running Tests

### Run All Tests
```bash
# Run all Helm tests
helm test <release-name>

# Run tests with verbose output
helm test <release-name> --logs
```

### Run Specific Test Categories
```bash
# Run only connection tests
kubectl get pods -l "app.kubernetes.io/name=nexus-ide,helm.sh/hook=test" | grep connection

# Run only database tests
kubectl get pods -l "app.kubernetes.io/name=nexus-ide,helm.sh/hook=test" | grep database

# Run only AI services tests
kubectl get pods -l "app.kubernetes.io/name=nexus-ide,helm.sh/hook=test" | grep ai-services
```

### Manual Test Execution
```bash
# Apply test manually
kubectl apply -f templates/tests/test-connection.yaml

# Check test results
kubectl logs <test-pod-name>

# Clean up test pods
kubectl delete pod <test-pod-name>
```

## 📊 Test Results Interpretation

### Success Indicators
- ✅ `✓` - Test passed successfully
- ⚠️ `⚠` - Test completed with warnings (may be expected)
- ❌ `✗` - Test failed (requires attention)

### Common Test Scenarios

#### Development Environment
```bash
# Expected results in development
✓ Basic connectivity tests should pass
⚠ Some AI services may show warnings (API keys not configured)
⚠ Security tests may show warnings (development settings)
✓ Database tests should pass if databases are enabled
```

#### Production Environment
```bash
# Expected results in production
✓ All connectivity tests should pass
✓ Database tests should pass
✓ AI services tests should pass (with proper API keys)
✓ Security tests should pass
✓ Performance tests should meet thresholds
✓ Integration tests should complete successfully
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Test Pod Fails to Start
```bash
# Check pod status
kubectl describe pod <test-pod-name>

# Check resource constraints
kubectl get nodes
kubectl describe node <node-name>
```

#### Connection Test Failures
```bash
# Check service status
kubectl get svc
kubectl describe svc <service-name>

# Check endpoint availability
kubectl get endpoints
```

#### Database Test Failures
```bash
# Check database pod status
kubectl get pods | grep -E "(postgres|redis|mongo)"

# Check database service
kubectl get svc | grep -E "(postgres|redis|mongo)"

# Check database logs
kubectl logs <database-pod-name>
```

#### AI Services Test Failures
```bash
# Check AI configuration
kubectl get secrets | grep ai

# Verify API keys are set
kubectl describe secret <ai-secret-name>

# Check AI service logs
kubectl logs <app-pod-name> | grep -i ai
```

#### Performance Test Issues
```bash
# Check resource usage
kubectl top pods
kubectl top nodes

# Check metrics endpoint
kubectl port-forward svc/<service-name> 8080:80
curl http://localhost:8080/metrics
```

## 📈 Test Configuration

### Customizing Test Behavior

You can customize test behavior through values.yaml:

```yaml
# Enable/disable specific test categories
testing:
  connection:
    enabled: true
    timeout: 30
  database:
    enabled: true
    testOperations: true
  ai:
    enabled: true
    mockMode: false  # Set to true for testing without real API keys
  performance:
    enabled: true
    responseTimeThreshold: 2000  # milliseconds
    loadTestRequests: 10
  security:
    enabled: true
    strictMode: false  # Set to true for production
  integration:
    enabled: true
    fullWorkflow: true
```

### Test Resource Limits

All tests are configured with appropriate resource limits:

```yaml
resources:
  limits:
    cpu: 100m-200m
    memory: 128Mi-256Mi
  requests:
    cpu: 50m-100m
    memory: 64Mi-128Mi
```

## 🔄 Continuous Integration

### Automated Testing in CI/CD

```yaml
# Example GitHub Actions workflow
- name: Run Helm Tests
  run: |
    helm test ${{ env.RELEASE_NAME }} --timeout 10m
    
- name: Collect Test Results
  if: always()
  run: |
    kubectl get pods -l "helm.sh/hook=test" -o wide
    for pod in $(kubectl get pods -l "helm.sh/hook=test" -o name); do
      echo "=== Logs for $pod ==="
      kubectl logs $pod
    done
```

### Test Reporting

```bash
# Generate test report
./scripts/generate-test-report.sh

# Export test results
kubectl get pods -l "helm.sh/hook=test" -o json > test-results.json
```

## 📚 Best Practices

### Test Development
1. **Idempotent Tests**: Tests should be repeatable and not affect system state
2. **Resource Cleanup**: Use hook deletion policies to clean up test resources
3. **Timeout Handling**: Set appropriate timeouts for different test types
4. **Error Handling**: Provide clear error messages and exit codes
5. **Documentation**: Document expected behavior and failure scenarios

### Test Execution
1. **Sequential Execution**: Tests run in weight order for dependencies
2. **Resource Monitoring**: Monitor cluster resources during test execution
3. **Log Collection**: Always collect logs for failed tests
4. **Environment Validation**: Validate environment before running tests
5. **Regular Testing**: Run tests regularly, not just during deployment

## 🤝 Contributing

When adding new tests:

1. **Follow Naming Convention**: `test-<category>.yaml`
2. **Set Appropriate Weight**: Ensure proper execution order
3. **Add Resource Limits**: Prevent resource exhaustion
4. **Include Documentation**: Update this README
5. **Test Thoroughly**: Validate in multiple environments

### Test Template

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "nexus-ide.fullname" . }}-test-<category>"
  labels:
    {{- include "nexus-ide.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-weight": "<weight>"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: <category>-test
      image: curlimages/curl:8.5.0
      command:
        - /bin/sh
        - -c
        - |
          echo "Testing <category>..."
          # Add your test logic here
          echo "<category> tests completed"
      resources:
        limits:
          cpu: 100m
          memory: 128Mi
        requests:
          cpu: 50m
          memory: 64Mi
```

---

## 📞 Support

For test-related issues:

1. **Check Logs**: Always start with test pod logs
2. **Validate Configuration**: Ensure values.yaml is correct
3. **Check Dependencies**: Verify all required services are running
4. **Resource Availability**: Ensure cluster has sufficient resources
5. **Documentation**: Refer to main project documentation

**Happy Testing! 🚀**