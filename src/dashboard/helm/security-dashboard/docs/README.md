# 📊 NEXUS IDE Security Dashboard - Helm Chart Documentation

## 🚀 Overview

The NEXUS IDE Security Dashboard Helm Chart provides a comprehensive, production-ready deployment solution for the NEXUS IDE Security Dashboard. This chart includes all necessary components for monitoring, security, collaboration, and AI-powered development features.

## 🎯 Features

### Core Components
- **Security Dashboard**: Main application with AI-powered security monitoring
- **Database Layer**: PostgreSQL, Redis, and MongoDB with high availability
- **Monitoring Stack**: Prometheus, Grafana, Jaeger, and AlertManager
- **Logging System**: Elasticsearch, Fluentd, and Kibana (EFK Stack)
- **AI/ML Services**: Multi-model AI integration with local and cloud providers
- **Real-time Collaboration**: WebSocket-based live sharing and communication
- **Backup & Recovery**: Automated backup with verification and restoration

### Enterprise Features
- **High Availability**: Multi-replica deployment with auto-scaling
- **Security**: Network policies, RBAC, Pod Security Policies
- **Compliance**: SOX, PCI-DSS, GDPR compliance features
- **Multi-tenancy**: Isolated environments for different teams
- **Performance Optimization**: Resource management and caching
- **Disaster Recovery**: Cross-region backup and failover

## 📋 Prerequisites

### Kubernetes Cluster Requirements
- **Kubernetes Version**: 1.24+
- **Helm Version**: 3.8+
- **Node Resources**: Minimum 4 CPU cores, 8GB RAM per node
- **Storage**: Dynamic provisioning with encryption support
- **Networking**: CNI with NetworkPolicy support

### Required Kubernetes Features
- **RBAC**: Role-Based Access Control
- **Network Policies**: For security isolation
- **Persistent Volumes**: For data persistence
- **Ingress Controller**: NGINX or similar
- **Cert-Manager**: For TLS certificate management
- **Metrics Server**: For HPA functionality

### Optional Components
- **External Secrets Operator**: For secret management
- **Prometheus Operator**: For advanced monitoring
- **Istio/Linkerd**: For service mesh (optional)
- **GPU Nodes**: For local AI model inference

## 🛠️ Installation

### Quick Start

```bash
# Add the Helm repository
helm repo add nexus-ide https://charts.nexus-ide.dev
helm repo update

# Install with default values (development)
helm install nexus-ide-dashboard nexus-ide/security-dashboard

# Install for staging environment
helm install nexus-ide-dashboard nexus-ide/security-dashboard \
  -f values-staging.yaml \
  --namespace nexus-ide-staging \
  --create-namespace

# Install for production environment
helm install nexus-ide-dashboard nexus-ide/security-dashboard \
  -f values-production.yaml \
  --namespace nexus-ide-production \
  --create-namespace
```

### Custom Installation

```bash
# Create custom values file
cp values.yaml my-values.yaml

# Edit configuration
vim my-values.yaml

# Install with custom values
helm install my-nexus-ide nexus-ide/security-dashboard \
  -f my-values.yaml \
  --namespace my-namespace \
  --create-namespace
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/nexus-ide/security-dashboard-helm.git
cd security-dashboard-helm

# Install dependencies
helm dependency update

# Install from local chart
helm install nexus-ide-dev . \
  --namespace nexus-ide-dev \
  --create-namespace \
  --set global.environment=development
```

## ⚙️ Configuration

### Environment-Specific Configurations

| Environment | Values File | Description |
|-------------|-------------|-------------|
| Development | `values.yaml` | Default development settings |
| Staging | `values-staging.yaml` | Staging environment with limited resources |
| Production | `values-production.yaml` | Production-ready with HA and security |

### Key Configuration Sections

#### Global Settings
```yaml
global:
  environment: production
  domain: nexus-ide.dev
  debug: false
  logLevel: info
```

#### Application Configuration
```yaml
replicaCount: 3
image:
  repository: ghcr.io/nexus-ide/security-dashboard
  tag: "v1.0.0"
  pullPolicy: IfNotPresent
```

#### Database Configuration
```yaml
postgresql:
  enabled: true
  architecture: replication
  auth:
    database: nexus_ide_production
    username: nexus_prod
```

#### AI/ML Configuration
```yaml
ai:
  enabled: true
  models:
    gpt4:
      enabled: true
      model: "gpt-4-turbo"
    claude:
      enabled: true
      model: "claude-3-opus"
```

#### Security Configuration
```yaml
security:
  networkPolicy:
    enabled: true
  podSecurityPolicy:
    enabled: true
  rbac:
    create: true
```

## 🔧 Management Commands

### Using Makefile

```bash
# Validate configuration
make validate

# Install development environment
make install-dev

# Install staging environment
make install-staging

# Install production environment
make install-prod

# Upgrade deployment
make upgrade ENV=production

# Rollback deployment
make rollback ENV=production REVISION=1

# Run tests
make test

# Clean up
make clean ENV=development
```

### Manual Helm Commands

```bash
# Check deployment status
helm status nexus-ide-dashboard -n nexus-ide-production

# Get deployment values
helm get values nexus-ide-dashboard -n nexus-ide-production

# Upgrade deployment
helm upgrade nexus-ide-dashboard nexus-ide/security-dashboard \
  -f values-production.yaml \
  -n nexus-ide-production

# Rollback deployment
helm rollback nexus-ide-dashboard 1 -n nexus-ide-production

# Uninstall deployment
helm uninstall nexus-ide-dashboard -n nexus-ide-production
```

## 🔍 Monitoring & Observability

### Accessing Monitoring Dashboards

```bash
# Port-forward to Grafana
kubectl port-forward svc/nexus-ide-grafana 3000:80 -n nexus-ide-production
# Access: http://localhost:3000

# Port-forward to Prometheus
kubectl port-forward svc/nexus-ide-prometheus 9090:9090 -n nexus-ide-production
# Access: http://localhost:9090

# Port-forward to Jaeger
kubectl port-forward svc/nexus-ide-jaeger-query 16686:16686 -n nexus-ide-production
# Access: http://localhost:16686
```

### Key Metrics to Monitor

- **Application Metrics**:
  - Request rate and latency
  - Error rates and status codes
  - Active user sessions
  - AI model usage and performance

- **Infrastructure Metrics**:
  - CPU and memory utilization
  - Disk I/O and network traffic
  - Database connection pools
  - Cache hit rates

- **Business Metrics**:
  - User engagement and retention
  - Feature adoption rates
  - Collaboration session metrics
  - Security incident detection

### Alerting Rules

The chart includes pre-configured alerting rules for:
- High CPU/Memory usage
- Database connection issues
- Application errors and timeouts
- Security policy violations
- Backup failures

## 🔒 Security

### Security Features

1. **Network Security**:
   - Network policies for traffic isolation
   - TLS encryption for all communications
   - Ingress security with rate limiting

2. **Pod Security**:
   - Pod Security Policies/Standards
   - Non-root container execution
   - Read-only root filesystems
   - Capability dropping

3. **Access Control**:
   - RBAC for service accounts
   - OAuth2/OIDC integration
   - Multi-factor authentication
   - Session management

4. **Data Security**:
   - Encryption at rest and in transit
   - Secret management with external providers
   - Database access controls
   - Audit logging

### Security Best Practices

```bash
# Scan for security vulnerabilities
make security-scan

# Check RBAC permissions
kubectl auth can-i --list --as=system:serviceaccount:nexus-ide-production:nexus-ide-dashboard

# Verify network policies
kubectl get networkpolicy -n nexus-ide-production

# Check pod security context
kubectl get pods -o jsonpath='{.items[*].spec.securityContext}' -n nexus-ide-production
```

## 💾 Backup & Recovery

### Automated Backups

The chart includes automated backup for:
- PostgreSQL databases
- Redis data
- MongoDB collections
- Application configuration
- User data and preferences

### Backup Configuration

```yaml
backup:
  enabled: true
  schedule: "0 1 * * *"  # Daily at 1 AM
  retention: "30d"
  storage:
    type: "s3"
    s3:
      bucket: "nexus-ide-production-backups"
      region: "us-west-2"
```

### Manual Backup/Restore

```bash
# Create manual backup
make backup ENV=production

# List available backups
make list-backups ENV=production

# Restore from backup
make restore ENV=production BACKUP_ID=20240115-010000

# Verify backup integrity
make verify-backup ENV=production BACKUP_ID=20240115-010000
```

## 🚀 Scaling

### Horizontal Pod Autoscaling

The chart includes HPA configuration:

```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 60
  targetMemoryUtilizationPercentage: 70
```

### Manual Scaling

```bash
# Scale application pods
kubectl scale deployment nexus-ide-dashboard --replicas=5 -n nexus-ide-production

# Scale database replicas
helm upgrade nexus-ide-dashboard nexus-ide/security-dashboard \
  --set postgresql.readReplicas.replicaCount=3 \
  -n nexus-ide-production
```

### Cluster Autoscaling

For cloud environments, configure cluster autoscaling:

```yaml
nodeSelector:
  node-type: compute-optimized
  instance-type: c5.2xlarge

tolerations:
  - key: "high-performance"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Pod Startup Issues

```bash
# Check pod status
kubectl get pods -n nexus-ide-production

# Describe problematic pod
kubectl describe pod <pod-name> -n nexus-ide-production

# Check pod logs
kubectl logs <pod-name> -n nexus-ide-production

# Check init container logs
kubectl logs <pod-name> -c wait-for-db -n nexus-ide-production
```

#### 2. Database Connection Issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -- \
  psql -h nexus-ide-postgresql -U nexus_prod -d nexus_ide_production

# Check database pod status
kubectl get pods -l app.kubernetes.io/name=postgresql -n nexus-ide-production

# Check database logs
kubectl logs -l app.kubernetes.io/name=postgresql -n nexus-ide-production
```

#### 3. Ingress/TLS Issues

```bash
# Check ingress status
kubectl get ingress -n nexus-ide-production

# Describe ingress
kubectl describe ingress nexus-ide-dashboard -n nexus-ide-production

# Check certificate status
kubectl get certificate -n nexus-ide-production

# Check cert-manager logs
kubectl logs -l app=cert-manager -n cert-manager
```

#### 4. Performance Issues

```bash
# Check resource usage
kubectl top pods -n nexus-ide-production
kubectl top nodes

# Check HPA status
kubectl get hpa -n nexus-ide-production

# Check metrics server
kubectl get apiservice v1beta1.metrics.k8s.io -o yaml
```

### Debug Mode

Enable debug mode for troubleshooting:

```yaml
global:
  debug: true
  logLevel: debug

development:
  debugMode: true
  profiling:
    enabled: true
```

### Support Resources

- **Documentation**: https://docs.nexus-ide.dev
- **GitHub Issues**: https://github.com/nexus-ide/security-dashboard-helm/issues
- **Community Forum**: https://community.nexus-ide.dev
- **Slack Channel**: #nexus-ide-support
- **Email Support**: support@nexus-ide.dev

## 🔄 CI/CD Integration

### GitHub Actions

The chart includes GitHub Actions workflows:

- **Lint and Test**: Validates chart syntax and runs tests
- **Security Scan**: Scans for security vulnerabilities
- **Package and Release**: Creates and publishes chart packages
- **Deploy to Staging**: Automated staging deployments
- **Deploy to Production**: Manual production deployments

### GitOps Integration

```yaml
# ArgoCD Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nexus-ide-dashboard
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://charts.nexus-ide.dev
    chart: security-dashboard
    targetRevision: 1.0.0
    helm:
      valueFiles:
        - values-production.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: nexus-ide-production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## 📊 Performance Tuning

### Resource Optimization

```yaml
# Production resource configuration
resources:
  limits:
    cpu: 2000m
    memory: 4Gi
    ephemeral-storage: 10Gi
  requests:
    cpu: 1000m
    memory: 2Gi
    ephemeral-storage: 5Gi
```

### Database Tuning

```yaml
postgresql:
  primary:
    configuration: |
      max_connections = 200
      shared_buffers = 1GB
      effective_cache_size = 3GB
      work_mem = 10MB
      maintenance_work_mem = 256MB
```

### Caching Configuration

```yaml
redis:
  master:
    configuration: |
      maxmemory-policy allkeys-lru
      timeout 300
      tcp-keepalive 60
      maxclients 10000
```

## 🌐 Multi-Region Deployment

### Cross-Region Setup

```bash
# Deploy to primary region
helm install nexus-ide-primary nexus-ide/security-dashboard \
  -f values-production.yaml \
  --set global.region=us-west-2 \
  --namespace nexus-ide-production

# Deploy to secondary region
helm install nexus-ide-secondary nexus-ide/security-dashboard \
  -f values-production.yaml \
  --set global.region=us-east-1 \
  --set global.mode=secondary \
  --namespace nexus-ide-production
```

### Disaster Recovery

```yaml
backup:
  crossRegion:
    enabled: true
    regions:
      - us-west-2
      - us-east-1
      - eu-west-1
  replication:
    enabled: true
    schedule: "*/15 * * * *"  # Every 15 minutes
```

## 📈 Monitoring Dashboards

### Pre-built Dashboards

1. **Application Overview**:
   - Request rates and response times
   - Error rates and status codes
   - Active users and sessions

2. **Infrastructure Metrics**:
   - CPU, memory, and disk usage
   - Network traffic and latency
   - Kubernetes cluster health

3. **Database Performance**:
   - Connection pools and query performance
   - Replication lag and backup status
   - Cache hit rates and memory usage

4. **Security Monitoring**:
   - Authentication attempts and failures
   - Network policy violations
   - Security scan results

5. **Business Intelligence**:
   - User engagement metrics
   - Feature adoption rates
   - Collaboration statistics

### Custom Dashboards

```yaml
grafana:
  dashboards:
    enabled: true
    configMaps:
      - nexus-ide-custom-dashboards
    providers:
      dashboardproviders.yaml:
        apiVersion: 1
        providers:
          - name: 'nexus-ide'
            orgId: 1
            folder: 'NEXUS IDE'
            type: file
            options:
              path: /var/lib/grafana/dashboards/nexus-ide
```

## 🔐 Compliance & Governance

### Compliance Features

- **SOX Compliance**: Financial data protection and audit trails
- **PCI-DSS**: Payment card industry security standards
- **GDPR**: European data protection regulations
- **HIPAA**: Healthcare information privacy (optional)
- **SOC 2**: Security and availability controls

### Audit Logging

```yaml
logging:
  audit:
    enabled: true
    level: "metadata"
    retention: "7y"  # 7 years for compliance
    encryption: true
    immutable: true
```

### Policy Enforcement

```yaml
security:
  policies:
    - name: "data-residency"
      enabled: true
      rules:
        - "data must remain in specified regions"
    - name: "encryption-at-rest"
      enabled: true
      rules:
        - "all data must be encrypted at rest"
    - name: "access-control"
      enabled: true
      rules:
        - "multi-factor authentication required"
```

---

## 📚 Additional Resources

- [Helm Chart Values Reference](./VALUES.md)
- [Security Configuration Guide](./SECURITY.md)
- [Performance Tuning Guide](./PERFORMANCE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [API Documentation](./API.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Changelog](../CHANGELOG.md)

---

**© 2024 NEXUS IDE. All rights reserved.**

*This documentation is part of the NEXUS IDE Security Dashboard Helm Chart. For the latest updates and detailed information, please visit our [official documentation](https://docs.nexus-ide.dev).*