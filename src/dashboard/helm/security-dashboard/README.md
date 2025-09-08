# 🚀 NEXUS IDE Security Dashboard - Helm Chart

[![Helm Version](https://img.shields.io/badge/Helm-v3.0+-blue.svg)](https://helm.sh/)
[![Kubernetes Version](https://img.shields.io/badge/Kubernetes-v1.20+-green.svg)](https://kubernetes.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-red.svg)](Chart.yaml)

Enterprise-grade Helm chart for deploying NEXUS IDE Security Dashboard on Kubernetes with advanced security, monitoring, and collaboration features.

## 📋 Table of Contents

- [Overview](#-overview)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Features](#-features)
- [Security](#-security)
- [Monitoring](#-monitoring)
- [Backup & Recovery](#-backup--recovery)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

NEXUS IDE Security Dashboard is a next-generation integrated development environment that combines the power of AI, real-time collaboration, and enterprise-grade security. This Helm chart provides a production-ready deployment with:

- **AI-Native Development**: Advanced AI assistance for coding, debugging, and optimization
- **Real-time Collaboration**: WebSocket-based live sharing and collaborative editing
- **Enterprise Security**: Multi-factor authentication, RBAC, and security scanning
- **High Availability**: Auto-scaling, load balancing, and fault tolerance
- **Comprehensive Monitoring**: Prometheus metrics, Grafana dashboards, and distributed tracing
- **Automated Operations**: Backup, cleanup, and optimization jobs

## 🔧 Prerequisites

### Kubernetes Cluster
- Kubernetes 1.20+ with RBAC enabled
- Helm 3.0+
- Ingress Controller (nginx, traefik, etc.)
- StorageClass for persistent volumes
- LoadBalancer or NodePort support

### Resource Requirements

#### Minimum (Development)
- **CPU**: 2 cores
- **Memory**: 4 GB RAM
- **Storage**: 20 GB
- **Nodes**: 1

#### Recommended (Production)
- **CPU**: 8 cores
- **Memory**: 16 GB RAM
- **Storage**: 100 GB SSD
- **Nodes**: 3+

#### High Availability (Enterprise)
- **CPU**: 16+ cores
- **Memory**: 32+ GB RAM
- **Storage**: 500+ GB SSD
- **Nodes**: 5+

### Optional Dependencies
- **PostgreSQL**: For persistent data storage
- **Redis**: For caching and session management
- **MongoDB**: For document storage
- **Prometheus**: For monitoring and alerting
- **Grafana**: For visualization dashboards
- **Jaeger**: For distributed tracing
- **ElasticSearch**: For centralized logging

## 🚀 Quick Start

### 1. Add Helm Repository

```bash
# Add the NEXUS IDE Helm repository
helm repo add nexus-ide https://charts.nexus-ide.dev
helm repo update
```

### 2. Install with Default Configuration

```bash
# Install in default namespace
helm install security-dashboard nexus-ide/security-dashboard

# Install in custom namespace
kubectl create namespace nexus-ide
helm install security-dashboard nexus-ide/security-dashboard -n nexus-ide
```

### 3. Access the Application

```bash
# Get the application URL
kubectl get ingress -n nexus-ide

# Or use port-forward for testing
kubectl port-forward svc/security-dashboard 8080:80 -n nexus-ide
```

## 📦 Installation

### Development Installation

```bash
# Install with development settings
helm install security-dashboard nexus-ide/security-dashboard \
  --set development.enabled=true \
  --set auth.enabled=false \
  --set tls.enabled=false \
  --set replicaCount=1
```

### Production Installation

```bash
# Create production values file
cat > production-values.yaml << EOF
# Production Configuration
replicaCount: 3

# Enable authentication
auth:
  enabled: true
  defaultAdmin:
    enabled: true
    username: admin
    password: "your-secure-password"

# Enable TLS
tls:
  enabled: true
  secretName: nexus-ide-tls

# Database configuration
postgresql:
  enabled: true
  auth:
    postgresPassword: "your-db-password"
    database: nexus_ide

# Redis configuration
redis:
  enabled: true
  auth:
    enabled: true
    password: "your-redis-password"

# Monitoring
monitoring:
  prometheus:
    enabled: true
  grafana:
    enabled: true

# Auto-scaling
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

# Backup
jobs:
  backup:
    enabled: true
    schedule: "0 2 * * *"
EOF

# Install with production configuration
helm install security-dashboard nexus-ide/security-dashboard \
  -f production-values.yaml \
  -n nexus-ide
```

### High Availability Installation

```bash
# Create HA values file
cat > ha-values.yaml << EOF
# High Availability Configuration
replicaCount: 5

# Multi-zone deployment
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchExpressions:
        - key: app.kubernetes.io/name
          operator: In
          values:
          - security-dashboard
      topologyKey: kubernetes.io/hostname

# Resource limits
resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi

# External databases for HA
postgresql:
  enabled: false
externalDatabase:
  host: postgres-ha.database.svc.cluster.local
  port: 5432
  database: nexus_ide
  username: nexus_user

redis:
  enabled: false
externalRedis:
  enabled: true
  host: redis-ha.cache.svc.cluster.local
  port: 6379

# Advanced monitoring
monitoring:
  prometheus:
    enabled: true
    serviceMonitor:
      enabled: true
  grafana:
    enabled: true
    dashboard:
      enabled: true
  jaeger:
    enabled: true

# Security hardening
security:
  networkPolicy:
    enabled: true
  podSecurityPolicy:
    enabled: true
  rateLimiting:
    enabled: true
    requestsPerMinute: 1000

# Automated jobs
jobs:
  backup:
    enabled: true
    schedule: "0 2 * * *"
  cleanup:
    enabled: true
    schedule: "0 3 * * 0"
  securityScan:
    enabled: true
    schedule: "0 1 * * *"
EOF

# Install HA configuration
helm install security-dashboard nexus-ide/security-dashboard \
  -f ha-values.yaml \
  -n nexus-ide
```

## ⚙️ Configuration

### Core Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Container image repository | `nexus-ide/security-dashboard` |
| `image.tag` | Container image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `nameOverride` | Override chart name | `""` |
| `fullnameOverride` | Override full name | `""` |

### Service Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `80` |
| `service.targetPort` | Target port | `3000` |
| `service.annotations` | Service annotations | `{}` |

### Ingress Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `false` |
| `ingress.className` | Ingress class name | `nginx` |
| `ingress.annotations` | Ingress annotations | `{}` |
| `ingress.hosts` | Ingress hosts | `[]` |
| `ingress.tls` | TLS configuration | `[]` |

### Authentication Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `auth.enabled` | Enable authentication | `true` |
| `auth.defaultAdmin.enabled` | Create default admin | `true` |
| `auth.defaultAdmin.username` | Default admin username | `admin` |
| `auth.oauth.enabled` | Enable OAuth | `false` |
| `auth.ldap.enabled` | Enable LDAP | `false` |
| `auth.saml.enabled` | Enable SAML | `false` |

### Database Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Enable PostgreSQL | `true` |
| `postgresql.auth.database` | Database name | `nexus_ide` |
| `postgresql.auth.username` | Database username | `nexus_user` |
| `redis.enabled` | Enable Redis | `true` |
| `mongodb.enabled` | Enable MongoDB | `false` |

### Monitoring Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `monitoring.prometheus.enabled` | Enable Prometheus | `false` |
| `monitoring.grafana.enabled` | Enable Grafana | `false` |
| `monitoring.jaeger.enabled` | Enable Jaeger | `false` |
| `logging.enabled` | Enable logging | `true` |
| `logging.level` | Log level | `info` |

### Auto-scaling Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `autoscaling.enabled` | Enable HPA | `false` |
| `autoscaling.minReplicas` | Minimum replicas | `1` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | CPU target | `80` |

### Job Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `jobs.migration.enabled` | Enable migration job | `true` |
| `jobs.backup.enabled` | Enable backup job | `false` |
| `jobs.cleanup.enabled` | Enable cleanup job | `false` |
| `jobs.securityScan.enabled` | Enable security scan | `false` |

## 🎨 Features

### 🤖 AI-Powered Development

- **Multi-Model AI Integration**: Support for GPT-4, Claude, Llama, and local models
- **Intelligent Code Completion**: Context-aware suggestions beyond traditional autocomplete
- **AI Code Review**: Automated code quality analysis and security vulnerability detection
- **Natural Language Programming**: Write code using natural language descriptions
- **Performance Optimization**: AI-driven performance analysis and optimization suggestions

### 🤝 Real-time Collaboration

- **Live Code Sharing**: Real-time collaborative editing with conflict resolution
- **WebSocket Integration**: Low-latency communication for instant updates
- **Voice/Video Chat**: Integrated communication tools
- **Presence Awareness**: See who's working on what in real-time
- **Collaborative Debugging**: Debug sessions with multiple developers

### 🛡️ Enterprise Security

- **Multi-Factor Authentication**: Support for TOTP, SMS, and hardware tokens
- **Single Sign-On**: OAuth, LDAP, and SAML integration
- **Role-Based Access Control**: Granular permissions and access control
- **Security Scanning**: Automated vulnerability scanning and compliance checks
- **Audit Logging**: Comprehensive audit trails for compliance

### 📊 Monitoring & Observability

- **Prometheus Metrics**: Comprehensive application and infrastructure metrics
- **Grafana Dashboards**: Pre-built dashboards for monitoring and alerting
- **Distributed Tracing**: Jaeger integration for request tracing
- **Centralized Logging**: ELK stack integration for log aggregation
- **Health Checks**: Kubernetes-native health and readiness probes

### 🔄 Automated Operations

- **Database Migration**: Automated schema migrations with rollback support
- **Backup & Recovery**: Scheduled backups with cloud storage integration
- **Data Cleanup**: Automated cleanup of old data and temporary files
- **Security Scanning**: Regular security scans and vulnerability assessments
- **Performance Optimization**: Automated database and cache optimization

## 🛡️ Security

### Network Security

```yaml
# Enable network policies
security:
  networkPolicy:
    enabled: true
    ingress:
      - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
    egress:
      - to:
        - namespaceSelector:
            matchLabels:
              name: database
```

### Pod Security

```yaml
# Enable pod security policies
security:
  podSecurityPolicy:
    enabled: true
    allowPrivilegeEscalation: false
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
```

### TLS Configuration

```yaml
# Enable TLS encryption
tls:
  enabled: true
  secretName: nexus-ide-tls
  issuer: letsencrypt-prod
  dnsNames:
    - nexus-ide.example.com
    - api.nexus-ide.example.com
```

### Rate Limiting

```yaml
# Configure rate limiting
security:
  rateLimiting:
    enabled: true
    requestsPerMinute: 1000
    burstSize: 100
    whitelist:
      - 10.0.0.0/8
      - 192.168.0.0/16
```

## 📈 Monitoring

### Prometheus Configuration

```yaml
monitoring:
  prometheus:
    enabled: true
    serviceMonitor:
      enabled: true
      interval: 30s
      scrapeTimeout: 10s
    rules:
      enabled: true
      groups:
        - name: nexus-ide
          rules:
            - alert: HighCPUUsage
              expr: cpu_usage > 80
              for: 5m
```

### Grafana Dashboards

```yaml
monitoring:
  grafana:
    enabled: true
    dashboard:
      enabled: true
      datasource: prometheus
    alerts:
      enabled: true
      channels:
        - name: slack
          type: slack
          settings:
            url: https://hooks.slack.com/...
```

### Distributed Tracing

```yaml
monitoring:
  jaeger:
    enabled: true
    endpoint: http://jaeger-collector:14268/api/traces
    sampler:
      type: probabilistic
      param: 0.1
```

## 💾 Backup & Recovery

### Automated Backup

```yaml
jobs:
  backup:
    enabled: true
    schedule: "0 2 * * *"  # Daily at 2 AM
    retentionDays: 30
    database: true
    redis: true
    files: true
    cloudStorage:
      enabled: true
      provider: s3
      bucket: nexus-ide-backups
      region: us-west-2
```

### Disaster Recovery

```bash
# Restore from backup
kubectl create job --from=cronjob/security-dashboard-backup restore-$(date +%s)

# Monitor restore progress
kubectl logs -f job/restore-1234567890

# Verify data integrity
kubectl exec -it deployment/security-dashboard -- npm run verify-data
```

## 🔧 Troubleshooting

### Common Issues

#### Pod Startup Issues

```bash
# Check pod status
kubectl get pods -n nexus-ide

# Describe problematic pod
kubectl describe pod <pod-name> -n nexus-ide

# Check logs
kubectl logs <pod-name> -n nexus-ide
```

#### Database Connection Issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h security-dashboard-postgresql -U nexus_user -d nexus_ide

# Check database logs
kubectl logs -f deployment/security-dashboard-postgresql -n nexus-ide
```

#### Ingress Issues

```bash
# Check ingress status
kubectl get ingress -n nexus-ide

# Describe ingress
kubectl describe ingress security-dashboard -n nexus-ide

# Check ingress controller logs
kubectl logs -f deployment/nginx-ingress-controller -n ingress-nginx
```

### Performance Tuning

#### Resource Optimization

```yaml
# Optimize resource allocation
resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 4Gi

# Enable resource quotas
resourceQuota:
  enabled: true
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
```

#### Database Tuning

```yaml
# PostgreSQL optimization
postgresql:
  primary:
    configuration: |
      max_connections = 200
      shared_buffers = 256MB
      effective_cache_size = 1GB
      work_mem = 4MB
      maintenance_work_mem = 64MB
```

### Debugging Commands

```bash
# Get all resources
kubectl get all -n nexus-ide

# Check events
kubectl get events -n nexus-ide --sort-by='.lastTimestamp'

# Port forward for debugging
kubectl port-forward svc/security-dashboard 8080:80 -n nexus-ide

# Execute commands in pod
kubectl exec -it deployment/security-dashboard -n nexus-ide -- /bin/bash

# Check resource usage
kubectl top pods -n nexus-ide
kubectl top nodes
```

## 🔄 Upgrade Guide

### Minor Version Upgrade

```bash
# Update Helm repository
helm repo update

# Upgrade to latest version
helm upgrade security-dashboard nexus-ide/security-dashboard -n nexus-ide
```

### Major Version Upgrade

```bash
# Backup current configuration
helm get values security-dashboard -n nexus-ide > current-values.yaml

# Review breaking changes
helm diff upgrade security-dashboard nexus-ide/security-dashboard -f current-values.yaml

# Perform upgrade with backup
kubectl create job --from=cronjob/security-dashboard-backup pre-upgrade-backup
helm upgrade security-dashboard nexus-ide/security-dashboard -f current-values.yaml -n nexus-ide
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/nexus-ide/security-dashboard-helm.git
cd security-dashboard-helm

# Install dependencies
helm dependency update

# Lint chart
helm lint .

# Test installation
helm install test-release . --dry-run --debug
```

### Testing

```bash
# Run chart tests
helm test security-dashboard -n nexus-ide

# Run integration tests
kubectl apply -f tests/
kubectl wait --for=condition=complete job/integration-test --timeout=300s
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: [https://nexus-ide.dev/docs](https://nexus-ide.dev/docs)
- 🐛 **Issues**: [GitHub Issues](https://github.com/nexus-ide/security-dashboard/issues)
- 💬 **Community**: [Discord](https://discord.gg/nexus-ide)
- 📧 **Email**: support@nexus-ide.dev

---

**Made with ❤️ by the NEXUS IDE Team**