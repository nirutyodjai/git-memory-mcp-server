# 📚 NEXUS IDE Helm Chart Examples

This directory contains various deployment examples for the NEXUS IDE Security Dashboard Helm chart. Each example is tailored for specific use cases and environments.

## 📋 Available Examples

### 🚀 [basic-install.yaml](./basic-install.yaml)
**Perfect for: Getting started, local testing, proof of concept**

- Minimal configuration with sensible defaults
- Single replica deployment
- Basic PostgreSQL and Redis setup
- No advanced security or monitoring
- Ideal for development and testing

```bash
helm install nexus-ide . -f examples/basic-install.yaml
```

### 🛠️ [development-install.yaml](./development-install.yaml)
**Perfect for: Local development, debugging, feature development**

- Hot reload enabled for faster development
- Debug ports exposed
- Development utilities included (pgAdmin, Redis Commander)
- Verbose logging and relaxed security
- Mock AI services to avoid API costs
- Source code mounting for live editing

```bash
helm install nexus-ide-dev . -f examples/development-install.yaml -n nexus-ide-dev
```

### 🏢 [production-install.yaml](./production-install.yaml)
**Perfect for: Production deployments, enterprise environments**

- High availability with multiple replicas
- Auto-scaling configuration
- Enterprise-grade security settings
- Comprehensive monitoring and alerting
- TLS/SSL termination
- Resource optimization
- Backup and disaster recovery

```bash
helm install nexus-ide-prod . -f examples/production-install.yaml -n nexus-ide-prod
```

### 🌍 [multi-region-install.yaml](./multi-region-install.yaml)
**Perfect for: Global deployments, disaster recovery, high availability**

- Multi-region deployment strategy
- Cross-region database replication
- Global load balancing
- Regional compliance settings (GDPR, CCPA)
- Advanced monitoring federation
- Disaster recovery automation

```bash
# Deploy to primary region
helm install nexus-ide-us-west . -f examples/multi-region-install.yaml \
  --set global.region=us-west-2 -n nexus-ide-prod

# Deploy to secondary regions
helm install nexus-ide-us-east . -f examples/multi-region-install.yaml \
  --set global.region=us-east-1 -n nexus-ide-prod
```

## 🎯 Choosing the Right Example

| Use Case | Example | Complexity | Resources | Features |
|----------|---------|------------|-----------|----------|
| **Quick Demo** | basic-install | ⭐ | Low | Core features only |
| **Development** | development-install | ⭐⭐ | Medium | Dev tools + debugging |
| **Production** | production-install | ⭐⭐⭐ | High | Full enterprise features |
| **Global Scale** | multi-region-install | ⭐⭐⭐⭐ | Very High | Multi-region + compliance |

## 🔧 Customization Guide

### 1. **Environment-Specific Overrides**

You can combine examples with custom overrides:

```bash
# Start with production example and customize
helm install nexus-ide . \
  -f examples/production-install.yaml \
  --set replicaCount=5 \
  --set resources.limits.memory=8Gi \
  --set ingress.hosts[0].host=my-nexus-ide.company.com
```

### 2. **Creating Custom Examples**

To create your own example:

1. Copy the closest existing example
2. Modify values according to your needs
3. Test thoroughly in a non-production environment
4. Document any special requirements

### 3. **Values Override Priority**

Helm applies values in this order (last wins):
1. Chart default values (`values.yaml`)
2. Example file (`-f examples/xxx.yaml`)
3. Command line overrides (`--set key=value`)
4. Additional values files (multiple `-f` flags)

## 🚀 Quick Start Workflows

### For Developers
```bash
# 1. Start local cluster
minikube start --memory=8192 --cpus=4

# 2. Enable ingress
minikube addons enable ingress

# 3. Deploy for development
helm install nexus-ide-dev . -f examples/development-install.yaml

# 4. Access application
kubectl port-forward svc/nexus-ide-dev 8080:80
```

### For Production
```bash
# 1. Create namespace
kubectl create namespace nexus-ide-prod

# 2. Create secrets (see production example for details)
kubectl create secret generic nexus-ide-db-secret \
  --from-literal=postgres-password=<strong-password> \
  -n nexus-ide-prod

# 3. Deploy to production
helm install nexus-ide-prod . -f examples/production-install.yaml -n nexus-ide-prod

# 4. Verify deployment
kubectl get pods -n nexus-ide-prod
```

## 🔍 Validation and Testing

### Pre-deployment Validation
```bash
# Validate Helm chart
helm lint .

# Dry run to check generated manifests
helm install nexus-ide . -f examples/production-install.yaml --dry-run

# Template and validate with kubeval
helm template nexus-ide . -f examples/production-install.yaml | kubeval
```

### Post-deployment Testing
```bash
# Run built-in tests
helm test nexus-ide

# Check all resources are ready
kubectl wait --for=condition=available --timeout=300s deployment/nexus-ide

# Verify ingress is working
curl -H "Host: nexus-ide.local" http://$(minikube ip)/health
```

## 🛡️ Security Considerations

### Development Environment
- ✅ Relaxed security for ease of development
- ✅ No TLS required
- ✅ Simple passwords acceptable
- ❌ **Never use in production**

### Production Environment
- ✅ Strong passwords and secrets management
- ✅ TLS/SSL encryption
- ✅ Network policies enabled
- ✅ RBAC configured
- ✅ Regular security updates

### Multi-Region Environment
- ✅ Regional compliance (GDPR, CCPA)
- ✅ Data residency controls
- ✅ Cross-region encryption
- ✅ Audit logging

## 📊 Monitoring and Observability

### Metrics Available
- **Application Metrics**: Request rate, response time, error rate
- **Infrastructure Metrics**: CPU, memory, disk, network
- **Business Metrics**: Active users, feature usage, collaboration sessions
- **AI Metrics**: Model performance, inference time, accuracy

### Dashboards Included
- **Overview Dashboard**: High-level system health
- **Performance Dashboard**: Detailed performance metrics
- **AI Dashboard**: AI model performance and usage
- **Collaboration Dashboard**: Real-time collaboration metrics
- **Security Dashboard**: Security events and compliance

### Alerting Rules
- **Critical**: Service down, high error rate, security breaches
- **Warning**: High resource usage, slow response times
- **Info**: Deployment events, scaling events

## 🔄 Upgrade Strategies

### Rolling Updates (Recommended)
```bash
# Upgrade with zero downtime
helm upgrade nexus-ide . -f examples/production-install.yaml
```

### Blue-Green Deployment
```bash
# Deploy new version alongside current
helm install nexus-ide-green . -f examples/production-install.yaml \
  --set nameOverride=nexus-ide-green

# Switch traffic after validation
# Update ingress or load balancer configuration

# Remove old version
helm uninstall nexus-ide
```

### Canary Deployment
```bash
# Deploy canary with limited traffic
helm install nexus-ide-canary . -f examples/production-install.yaml \
  --set replicaCount=1 \
  --set nameOverride=nexus-ide-canary

# Gradually increase canary traffic
# Monitor metrics and rollback if needed
```

## 🆘 Troubleshooting

### Common Issues

#### Pods Not Starting
```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=nexus-ide

# Check pod logs
kubectl logs -l app.kubernetes.io/name=nexus-ide

# Describe pod for events
kubectl describe pod <pod-name>
```

#### Database Connection Issues
```bash
# Check database pod status
kubectl get pods -l app.kubernetes.io/name=postgresql

# Test database connectivity
kubectl exec -it deployment/nexus-ide -- nc -zv postgresql 5432

# Check database logs
kubectl logs -l app.kubernetes.io/name=postgresql
```

#### Ingress Not Working
```bash
# Check ingress status
kubectl get ingress

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Test internal service
kubectl port-forward svc/nexus-ide 8080:80
```

### Getting Help

- 📖 **Documentation**: Check the [main README](../README.md) and [VALUES.md](../docs/VALUES.md)
- 🐛 **Issues**: Report bugs on GitHub Issues
- 💬 **Community**: Join our Discord/Slack community
- 📧 **Support**: Contact enterprise support for production issues

## 📝 Contributing

We welcome contributions to improve these examples:

1. **New Examples**: Add examples for specific use cases
2. **Improvements**: Enhance existing examples with better practices
3. **Documentation**: Improve this README and inline comments
4. **Testing**: Add validation scripts and tests

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

These examples are part of the NEXUS IDE project and are licensed under the MIT License. See [LICENSE](../LICENSE) for details.

---

**Happy Deploying! 🚀**

For more information, visit our [documentation](https://docs.nexus-ide.dev) or join our [community](https://community.nexus-ide.dev).