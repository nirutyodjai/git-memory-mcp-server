# 🤝 Contributing to NEXUS IDE Security Dashboard Helm Chart

We love your input! We want to make contributing to NEXUS IDE Security Dashboard as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Process](#-development-process)
- [Pull Request Process](#-pull-request-process)
- [Issue Guidelines](#-issue-guidelines)
- [Coding Standards](#-coding-standards)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [Community](#-community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@nexus-ide.dev](mailto:conduct@nexus-ide.dev).

## 🚀 Getting Started

### Prerequisites

- **Kubernetes Cluster**: v1.20+ (kind, minikube, or cloud provider)
- **Helm**: v3.0+
- **kubectl**: Compatible with your cluster version
- **Git**: For version control
- **Docker**: For building and testing images
- **Node.js**: v18+ (for development tools)

### Development Environment Setup

1. **Fork and Clone the Repository**

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/security-dashboard-helm.git
cd security-dashboard-helm

# Add upstream remote
git remote add upstream https://github.com/nexus-ide/security-dashboard-helm.git
```

2. **Install Development Dependencies**

```bash
# Install Helm plugins
helm plugin install https://github.com/chartmuseum/helm-push
helm plugin install https://github.com/databus23/helm-diff
helm plugin install https://github.com/helm-unittest/helm-unittest

# Install chart dependencies
helm dependency update

# Install development tools
npm install -g @helm/chart-testing
npm install -g yamllint
```

3. **Set Up Local Kubernetes Cluster**

```bash
# Using kind (recommended for development)
kind create cluster --name nexus-ide-dev

# Or using minikube
minikube start --profile nexus-ide-dev

# Verify cluster is running
kubectl cluster-info
```

4. **Install Required Operators (Optional)**

```bash
# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# Install Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx
```

## 🔄 Development Process

### Branching Strategy

We use [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/) branching model:

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: New features (`feature/add-monitoring`)
- **bugfix/**: Bug fixes (`bugfix/fix-ingress-config`)
- **hotfix/**: Critical fixes for production (`hotfix/security-patch`)
- **release/**: Release preparation (`release/v1.2.0`)

### Making Changes

1. **Create a Feature Branch**

```bash
# Update your fork
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name
```

2. **Make Your Changes**

```bash
# Edit files
vim values.yaml
vim templates/deployment.yaml

# Test your changes
helm lint .
helm template . --debug
```

3. **Test Locally**

```bash
# Install chart locally
helm install test-release . --dry-run --debug

# Install for real testing
helm install test-release . -n test-namespace --create-namespace

# Run tests
helm test test-release -n test-namespace

# Clean up
helm uninstall test-release -n test-namespace
kubectl delete namespace test-namespace
```

4. **Commit Your Changes**

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add monitoring configuration for Prometheus"

# Push to your fork
git push origin feature/your-feature-name
```

## 🔀 Pull Request Process

### Before Submitting

1. **Ensure your code follows our standards**
   - Helm chart lints without errors
   - All tests pass
   - Documentation is updated
   - CHANGELOG.md is updated

2. **Run the full test suite**

```bash
# Lint chart
helm lint .

# Run unit tests
helm unittest .

# Run integration tests
ct install --config .github/ct.yaml

# Security scan
helm template . | kubesec scan -
```

3. **Update documentation**
   - Update README.md if needed
   - Update values.yaml comments
   - Add/update examples

### Submitting Pull Request

1. **Create Pull Request**
   - Use our [PR template](.github/pull_request_template.md)
   - Link related issues
   - Provide clear description of changes
   - Add screenshots for UI changes

2. **PR Title Format**
   Use [Conventional Commits](https://www.conventionalcommits.org/) format:
   ```
   type(scope): description
   
   Examples:
   feat(monitoring): add Grafana dashboard configuration
   fix(ingress): resolve TLS certificate issue
   docs(readme): update installation instructions
   ```

3. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix (non-breaking change which fixes an issue)
   - [ ] New feature (non-breaking change which adds functionality)
   - [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
   - [ ] Documentation update
   
   ## Testing
   - [ ] I have tested this change locally
   - [ ] I have added tests that prove my fix is effective or that my feature works
   - [ ] New and existing unit tests pass locally with my changes
   
   ## Checklist
   - [ ] My code follows the style guidelines of this project
   - [ ] I have performed a self-review of my own code
   - [ ] I have commented my code, particularly in hard-to-understand areas
   - [ ] I have made corresponding changes to the documentation
   - [ ] My changes generate no new warnings
   ```

### Review Process

1. **Automated Checks**
   - GitHub Actions will run automated tests
   - All checks must pass before review

2. **Code Review**
   - At least one maintainer must approve
   - Address all review comments
   - Keep discussions constructive

3. **Merge**
   - Maintainer will merge after approval
   - Use "Squash and merge" for feature branches
   - Use "Merge commit" for release branches

## 🐛 Issue Guidelines

### Bug Reports

Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md):

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Install chart with '...'
2. Configure '...'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment:**
 - Kubernetes version: [e.g. 1.25.0]
 - Helm version: [e.g. 3.10.0]
 - Chart version: [e.g. 1.0.0]
 - Cloud provider: [e.g. AWS, GCP, Azure, on-premises]

**Additional context**
Add any other context about the problem here.
```

### Feature Requests

Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md):

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## 📏 Coding Standards

### Helm Chart Standards

1. **Chart Structure**
   ```
   security-dashboard/
   ├── Chart.yaml
   ├── values.yaml
   ├── templates/
   │   ├── NOTES.txt
   │   ├── _helpers.tpl
   │   ├── deployment.yaml
   │   ├── service.yaml
   │   └── ...
   ├── charts/
   ├── tests/
   └── README.md
   ```

2. **YAML Formatting**
   - Use 2 spaces for indentation
   - No trailing whitespace
   - End files with newline
   - Use `---` to separate documents

3. **Template Guidelines**
   ```yaml
   # Good: Use helpers for common labels
   metadata:
     labels:
       {{- include "security-dashboard.labels" . | nindent 4 }}
   
   # Good: Proper indentation with nindent
   spec:
     template:
       metadata:
         labels:
           {{- include "security-dashboard.selectorLabels" . | nindent 8 }}
   
   # Good: Conditional blocks
   {{- if .Values.ingress.enabled }}
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   {{- end }}
   ```

4. **Values.yaml Structure**
   ```yaml
   # Group related settings
   image:
     repository: nexus-ide/security-dashboard
     tag: "1.0.0"
     pullPolicy: IfNotPresent
   
   # Use descriptive comments
   # -- Number of replicas for the deployment
   replicaCount: 1
   
   # Use consistent naming
   serviceAccount:
     # -- Specifies whether a service account should be created
     create: true
     # -- The name of the service account to use
     name: ""
   ```

### Documentation Standards

1. **README.md**
   - Keep table of contents updated
   - Include practical examples
   - Document all configuration options
   - Add troubleshooting section

2. **Code Comments**
   ```yaml
   # Template comments explain the purpose
   {{/*
   Expand the name of the chart.
   */}}
   {{- define "security-dashboard.name" -}}
   {{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
   {{- end }}
   
   # Inline comments explain complex logic
   {{- if and .Values.persistence.enabled (not .Values.persistence.existingClaim) }}
   # Create PVC only if persistence is enabled and no existing claim is specified
   {{- end }}
   ```

3. **Values Documentation**
   Use [helm-docs](https://github.com/norwoodj/helm-docs) format:
   ```yaml
   # -- Enable ingress controller resource
   enabled: false
   
   # -- Ingress class name
   # @default -- nginx
   className: ""
   ```

## 🧪 Testing

### Unit Tests

```bash
# Install helm-unittest plugin
helm plugin install https://github.com/helm-unittest/helm-unittest

# Run unit tests
helm unittest .

# Run with coverage
helm unittest . --with-subchart
```

### Integration Tests

```bash
# Install chart-testing
pip install chart-testing

# Run integration tests
ct install --config .github/ct.yaml

# Test specific scenarios
ct install --charts security-dashboard --helm-extra-args "--timeout 600s"
```

### Security Tests

```bash
# Install kubesec
wget https://github.com/controlplaneio/kubesec/releases/latest/download/kubesec_linux_amd64.tar.gz
tar -xvf kubesec_linux_amd64.tar.gz

# Scan templates
helm template . | ./kubesec scan -

# Install polaris
kubectl apply -f https://github.com/FairwindsOps/polaris/releases/latest/download/dashboard.yaml

# Scan with polaris
helm template . | polaris audit --format=json
```

### Performance Tests

```bash
# Load testing with k6
k6 run tests/performance/load-test.js

# Resource usage monitoring
kubectl top pods -n nexus-ide
kubectl top nodes
```

## 📚 Documentation

### Updating Documentation

1. **README.md**: Update for new features or configuration changes
2. **values.yaml**: Add comments for new values
3. **CHANGELOG.md**: Document all changes
4. **Examples**: Add practical examples in `examples/` directory

### Documentation Tools

```bash
# Generate values documentation
helm-docs --chart-search-root=.

# Validate links
markdown-link-check README.md

# Spell check
aspell check README.md
```

## 🌟 Recognition

We recognize contributors in several ways:

- **Contributors list**: Added to README.md
- **Release notes**: Mentioned in CHANGELOG.md
- **GitHub**: Contributor badge on profile
- **Special recognition**: For significant contributions

## 💬 Community

### Communication Channels

- **GitHub Discussions**: For general questions and ideas
- **Discord**: Real-time chat and support
- **Email**: For private or security-related matters

### Getting Help

1. **Check existing issues**: Search for similar problems
2. **Read documentation**: README.md and Helm chart docs
3. **Ask in discussions**: GitHub Discussions for questions
4. **Join Discord**: Real-time help from community

### Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and experiences
- Provide constructive feedback
- Follow our Code of Conduct

## 🎯 Contribution Ideas

Looking for ways to contribute? Here are some ideas:

### For Beginners
- Fix typos in documentation
- Improve error messages
- Add examples and tutorials
- Update outdated dependencies

### For Intermediate Contributors
- Add new configuration options
- Improve test coverage
- Optimize resource usage
- Add monitoring dashboards

### For Advanced Contributors
- Implement new features
- Performance optimizations
- Security enhancements
- Architecture improvements

## 📞 Contact

- **Maintainers**: [@nexus-ide/maintainers](https://github.com/orgs/nexus-ide/teams/maintainers)
- **Email**: [contribute@nexus-ide.dev](mailto:contribute@nexus-ide.dev)
- **Discord**: [https://discord.gg/nexus-ide](https://discord.gg/nexus-ide)
- **GitHub Discussions**: [https://github.com/nexus-ide/security-dashboard-helm/discussions](https://github.com/nexus-ide/security-dashboard-helm/discussions)

---

**Thank you for contributing to NEXUS IDE! 🚀**

Your contributions make this project better for everyone. We appreciate your time and effort in helping us build the ultimate IDE experience.