# 🚀 NEXUS IDE Security Dashboard - Deployment Guide

Complete deployment guide for the NEXUS IDE Security Dashboard using Helm.

## 📋 Prerequisites

### System Requirements
- **Kubernetes**: v1.24+ (recommended v1.28+)
- **Helm**: v3.8+ (recommended v3.12+)
- **kubectl**: Compatible with your Kubernetes version
- **Resources**: Minimum 4 CPU cores, 8GB RAM per node

### Required Tools
```bash
# Install Helm (if not already installed)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify installations
kubectl version --client
helm version
```

## 🎯 Quick Start

### 1. Basic Installation
```bash
# Add the repository (if using a Helm repository)
helm repo add nexus-ide https://your-helm-repo.com
helm repo update

# Install with default values
helm install nexus-ide nexus-ide/security-dashboard

# Or install from local chart
helm install nexus-ide ./security-dashboard
```

### 2. Development Installation
```bash
# Install for development environment
helm install nexus-ide ./security-dashboard \
  -f examples/development-install.yaml \
  --namespace nexus-dev \
  --create-namespace
```

### 3. Production Installation
```bash
# Install for production environment
helm install nexus-ide ./security-dashboard \
  -f examples/production-install.yaml \
  --namespace nexus-prod \
  --create-namespace
```

## 🔧 Configuration

### Environment-Specific Configurations

#### Development Environment
```yaml
# values-dev.yaml
global:
  environment: development
  debug: true

replicaCount: 1

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

ai:
  enabled: true
  openai:
    enabled: false  # Disable for development
  localModels:
    enabled: true   # Use local models for development

security:
  rateLimiting:
    enabled: false  # Disable for development
```

#### Staging Environment
```yaml
# values-staging.yaml
global:
  environment: staging
  debug: false

replicaCount: 2

resources:
  requests:
    cpu: 200m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi

ai:
  enabled: true
  openai:
    enabled: true
  anthropic:
    enabled: true

security:
  rateLimiting:
    enabled: true
    requests: 100
    window: "1m"
```

#### Production Environment
```yaml
# values-prod.yaml
global:
  environment: production
  debug: false

replicaCount: 3

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

ai:
  enabled: true
  openai:
    enabled: true
  anthropic:
    enabled: true
  google:
    enabled: true

security:
  rateLimiting:
    enabled: true
    requests: 1000
    window: "1m"
  cors:
    enabled: true
    allowedOrigins:
      - "https://your-domain.com"
```

### Database Configuration

#### PostgreSQL
```yaml
postgresql:
  enabled: true
  auth:
    postgresPassword: "your-secure-password"
    database: "nexus_ide"
  primary:
    persistence:
      enabled: true
      size: 20Gi
      storageClass: "fast-ssd"
```

#### Redis
```yaml
redis:
  enabled: true
  auth:
    enabled: true
    password: "your-redis-password"
  master:
    persistence:
      enabled: true
      size: 8Gi
```

#### MongoDB
```yaml
mongodb:
  enabled: true
  auth:
    enabled: true
    rootPassword: "your-mongo-password"
  persistence:
    enabled: true
    size: 20Gi
```

### AI Services Configuration

#### API Keys Setup
```bash
# Create AI secrets
kubectl create secret generic nexus-ide-ai-secret \
  --from-literal=openai-api-key="your-openai-key" \
  --from-literal=anthropic-api-key="your-anthropic-key" \
  --from-literal=google-api-key="your-google-key" \
  --namespace nexus-prod
```

#### AI Configuration
```yaml
ai:
  enabled: true
  openai:
    enabled: true
    model: "gpt-4"
    existingSecret: "nexus-ide-ai-secret"
    secretKey: "openai-api-key"
  anthropic:
    enabled: true
    model: "claude-3-sonnet"
    existingSecret: "nexus-ide-ai-secret"
    secretKey: "anthropic-api-key"
  google:
    enabled: true
    model: "gemini-pro"
    existingSecret: "nexus-ide-ai-secret"
    secretKey: "google-api-key"
```

## 🚀 Deployment Steps

### Step 1: Prepare Environment
```bash
# Create namespace
kubectl create namespace nexus-ide

# Set default namespace
kubectl config set-context --current --namespace=nexus-ide
```

### Step 2: Configure Secrets
```bash
# Database secrets
kubectl create secret generic nexus-ide-db-secret \
  --from-literal=postgres-password="your-postgres-password" \
  --from-literal=redis-password="your-redis-password" \
  --from-literal=mongodb-password="your-mongodb-password"

# AI API keys
kubectl create secret generic nexus-ide-ai-secret \
  --from-literal=openai-api-key="your-openai-key" \
  --from-literal=anthropic-api-key="your-anthropic-key"

# TLS certificates (if using HTTPS)
kubectl create secret tls nexus-ide-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key
```

### Step 3: Customize Values
```bash
# Copy and customize values file
cp values.yaml my-values.yaml

# Edit configuration
vim my-values.yaml
```

### Step 4: Deploy
```bash
# Dry run to validate
helm install nexus-ide ./security-dashboard \
  -f my-values.yaml \
  --dry-run --debug

# Deploy
helm install nexus-ide ./security-dashboard \
  -f my-values.yaml \
  --timeout 10m
```

### Step 5: Verify Deployment
```bash
# Check deployment status
helm status nexus-ide

# Check pods
kubectl get pods

# Check services
kubectl get svc

# Run tests
helm test nexus-ide
```

## 🔍 Monitoring and Troubleshooting

### Health Checks
```bash
# Check application health
kubectl port-forward svc/nexus-ide 8080:80
curl http://localhost:8080/health

# Check metrics
curl http://localhost:8080/metrics
```

### Log Analysis
```bash
# Application logs
kubectl logs -l app.kubernetes.io/name=nexus-ide -f

# Database logs
kubectl logs -l app.kubernetes.io/name=postgresql -f

# Previous container logs (if crashed)
kubectl logs -l app.kubernetes.io/name=nexus-ide --previous
```

### Common Issues

#### Pod Startup Issues
```bash
# Check pod events
kubectl describe pod <pod-name>

# Check resource constraints
kubectl top nodes
kubectl describe node <node-name>
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h nexus-ide-postgresql -U postgres -d nexus_ide
```

#### AI Services Issues
```bash
# Check AI secrets
kubectl get secrets nexus-ide-ai-secret -o yaml

# Test AI endpoints
kubectl port-forward svc/nexus-ide 8080:80
curl -X POST http://localhost:8080/api/ai/health
```

## 🔄 Updates and Maintenance

### Upgrading
```bash
# Update Helm repository
helm repo update

# Check for updates
helm search repo nexus-ide/security-dashboard --versions

# Upgrade
helm upgrade nexus-ide nexus-ide/security-dashboard \
  -f my-values.yaml \
  --timeout 10m
```

### Backup
```bash
# Backup Helm values
helm get values nexus-ide > nexus-ide-values-backup.yaml

# Backup database (PostgreSQL example)
kubectl exec -it nexus-ide-postgresql-0 -- \
  pg_dump -U postgres nexus_ide > backup.sql
```

### Rollback
```bash
# List releases
helm history nexus-ide

# Rollback to previous version
helm rollback nexus-ide 1
```

## 🔒 Security Best Practices

### 1. Secrets Management
- Use external secret management (e.g., HashiCorp Vault)
- Rotate secrets regularly
- Never commit secrets to version control

### 2. Network Security
```yaml
networkPolicy:
  enabled: true
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
  egress:
    - to: []
      ports:
        - protocol: TCP
          port: 443  # HTTPS only
```

### 3. RBAC Configuration
```yaml
rbac:
  create: true
  rules:
    - apiGroups: [""]
      resources: ["configmaps", "secrets"]
      verbs: ["get", "list"]
```

### 4. Pod Security
```yaml
podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 2000

securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

## 📊 Performance Optimization

### Resource Tuning
```yaml
resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Database Optimization
```yaml
postgresql:
  primary:
    resources:
      requests:
        cpu: 500m
        memory: 1Gi
      limits:
        cpu: 1000m
        memory: 2Gi
    configuration: |
      max_connections = 200
      shared_buffers = 256MB
      effective_cache_size = 1GB
```

## 🌐 Multi-Environment Setup

### GitOps Approach
```bash
# Directory structure
environments/
├── dev/
│   ├── values.yaml
│   └── secrets.yaml
├── staging/
│   ├── values.yaml
│   └── secrets.yaml
└── prod/
    ├── values.yaml
    └── secrets.yaml
```

### CI/CD Integration
```yaml
# .github/workflows/deploy.yml
name: Deploy NEXUS IDE
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging
        run: |
          helm upgrade --install nexus-ide ./security-dashboard \
            -f environments/staging/values.yaml \
            --namespace nexus-staging
```

## 📞 Support and Documentation

### Getting Help
- **Documentation**: Check the `docs/` directory
- **Examples**: Review `examples/` for common configurations
- **Tests**: Run `helm test` to validate deployment
- **Logs**: Check application and infrastructure logs

### Useful Commands
```bash
# Quick status check
make status

# Run all tests
make test

# Generate documentation
make docs

# Clean up resources
make clean
```

---

**🎉 Congratulations!** You now have a complete guide for deploying the NEXUS IDE Security Dashboard. For additional help, refer to the documentation in the `docs/` directory or check the examples in `examples/`.

**Happy Deploying! 🚀**