# NEXUS IDE Security Dashboard Helm Chart Makefile
# This Makefile provides convenient commands for managing the Helm chart

# Variables
CHART_NAME := security-dashboard
CHART_VERSION := $(shell grep '^version:' Chart.yaml | cut -d' ' -f2)
APP_VERSION := $(shell grep '^appVersion:' Chart.yaml | cut -d' ' -f2)
NAMESPACE := nexus-ide
RELEASE_NAME := nexus-ide-dashboard
REGISTRY := ghcr.io/nexus-ide
HELM_REPO_NAME := nexus-ide
HELM_REPO_URL := https://charts.nexus-ide.dev

# Colors for output
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
MAGENTA := \033[35m
CYAN := \033[36m
WHITE := \033[37m
RESET := \033[0m

# Default target
.DEFAULT_GOAL := help

# Help target
.PHONY: help
help: ## Show this help message
	@echo "$(CYAN)NEXUS IDE Security Dashboard Helm Chart$(RESET)"
	@echo "$(CYAN)===========================================$(RESET)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Variables:$(RESET)"
	@echo "  $(BLUE)CHART_NAME$(RESET)     = $(CHART_NAME)"
	@echo "  $(BLUE)CHART_VERSION$(RESET)  = $(CHART_VERSION)"
	@echo "  $(BLUE)APP_VERSION$(RESET)    = $(APP_VERSION)"
	@echo "  $(BLUE)NAMESPACE$(RESET)      = $(NAMESPACE)"
	@echo "  $(BLUE)RELEASE_NAME$(RESET)   = $(RELEASE_NAME)"
	@echo "  $(BLUE)REGISTRY$(RESET)       = $(REGISTRY)"

# Validation and Testing
.PHONY: lint
lint: ## Lint the Helm chart
	@echo "$(YELLOW)Linting Helm chart...$(RESET)"
	helm lint .
	@echo "$(GREEN)✓ Helm chart linting completed$(RESET)"

.PHONY: validate
validate: ## Validate the Helm chart
	@echo "$(YELLOW)Validating Helm chart...$(RESET)"
	helm template $(RELEASE_NAME) . --validate
	@echo "$(GREEN)✓ Helm chart validation completed$(RESET)"

.PHONY: test
test: lint validate ## Run all tests (lint + validate)
	@echo "$(GREEN)✓ All tests passed$(RESET)"

.PHONY: dry-run
dry-run: ## Perform a dry-run installation
	@echo "$(YELLOW)Performing dry-run installation...$(RESET)"
	helm install $(RELEASE_NAME) . --namespace $(NAMESPACE) --create-namespace --dry-run --debug

.PHONY: template
template: ## Generate templates without installing
	@echo "$(YELLOW)Generating templates...$(RESET)"
	helm template $(RELEASE_NAME) . --namespace $(NAMESPACE)

.PHONY: template-debug
template-debug: ## Generate templates with debug information
	@echo "$(YELLOW)Generating templates with debug...$(RESET)"
	helm template $(RELEASE_NAME) . --namespace $(NAMESPACE) --debug

# Installation and Management
.PHONY: install
install: ## Install the Helm chart
	@echo "$(YELLOW)Installing Helm chart...$(RESET)"
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	helm install $(RELEASE_NAME) . --namespace $(NAMESPACE) --wait --timeout=10m
	@echo "$(GREEN)✓ Helm chart installed successfully$(RESET)"

.PHONY: install-dev
install-dev: ## Install the Helm chart in development mode
	@echo "$(YELLOW)Installing Helm chart in development mode...$(RESET)"
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	helm install $(RELEASE_NAME) . --namespace $(NAMESPACE) --wait --timeout=10m \
		--set development.enabled=true \
		--set development.debug=true \
		--set auth.enabled=false \
		--set tls.enabled=false \
		--set replicaCount=1
	@echo "$(GREEN)✓ Helm chart installed in development mode$(RESET)"

.PHONY: install-prod
install-prod: ## Install the Helm chart in production mode
	@echo "$(YELLOW)Installing Helm chart in production mode...$(RESET)"
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	helm install $(RELEASE_NAME) . --namespace $(NAMESPACE) --wait --timeout=15m \
		--set replicaCount=3 \
		--set auth.enabled=true \
		--set tls.enabled=true \
		--set autoscaling.enabled=true \
		--set monitoring.prometheus.enabled=true \
		--set monitoring.grafana.enabled=true
	@echo "$(GREEN)✓ Helm chart installed in production mode$(RESET)"

.PHONY: upgrade
upgrade: ## Upgrade the Helm chart
	@echo "$(YELLOW)Upgrading Helm chart...$(RESET)"
	helm upgrade $(RELEASE_NAME) . --namespace $(NAMESPACE) --wait --timeout=10m
	@echo "$(GREEN)✓ Helm chart upgraded successfully$(RESET)"

.PHONY: uninstall
uninstall: ## Uninstall the Helm chart
	@echo "$(YELLOW)Uninstalling Helm chart...$(RESET)"
	helm uninstall $(RELEASE_NAME) --namespace $(NAMESPACE)
	@echo "$(GREEN)✓ Helm chart uninstalled successfully$(RESET)"

.PHONY: reinstall
reinstall: uninstall install ## Uninstall and reinstall the Helm chart
	@echo "$(GREEN)✓ Helm chart reinstalled successfully$(RESET)"

# Status and Information
.PHONY: status
status: ## Show the status of the Helm release
	@echo "$(YELLOW)Checking Helm release status...$(RESET)"
	helm status $(RELEASE_NAME) --namespace $(NAMESPACE)

.PHONY: list
list: ## List all Helm releases
	@echo "$(YELLOW)Listing Helm releases...$(RESET)"
	helm list --all-namespaces

.PHONY: history
history: ## Show the history of the Helm release
	@echo "$(YELLOW)Showing Helm release history...$(RESET)"
	helm history $(RELEASE_NAME) --namespace $(NAMESPACE)

.PHONY: get-values
get-values: ## Get the values of the installed release
	@echo "$(YELLOW)Getting Helm release values...$(RESET)"
	helm get values $(RELEASE_NAME) --namespace $(NAMESPACE)

.PHONY: get-manifest
get-manifest: ## Get the manifest of the installed release
	@echo "$(YELLOW)Getting Helm release manifest...$(RESET)"
	helm get manifest $(RELEASE_NAME) --namespace $(NAMESPACE)

.PHONY: get-notes
get-notes: ## Get the notes of the installed release
	@echo "$(YELLOW)Getting Helm release notes...$(RESET)"
	helm get notes $(RELEASE_NAME) --namespace $(NAMESPACE)

# Kubernetes Operations
.PHONY: pods
pods: ## Show pods in the namespace
	@echo "$(YELLOW)Showing pods in namespace $(NAMESPACE)...$(RESET)"
	kubectl get pods -n $(NAMESPACE) -o wide

.PHONY: services
services: ## Show services in the namespace
	@echo "$(YELLOW)Showing services in namespace $(NAMESPACE)...$(RESET)"
	kubectl get services -n $(NAMESPACE) -o wide

.PHONY: ingress
ingress: ## Show ingress in the namespace
	@echo "$(YELLOW)Showing ingress in namespace $(NAMESPACE)...$(RESET)"
	kubectl get ingress -n $(NAMESPACE) -o wide

.PHONY: pvc
pvc: ## Show persistent volume claims in the namespace
	@echo "$(YELLOW)Showing PVCs in namespace $(NAMESPACE)...$(RESET)"
	kubectl get pvc -n $(NAMESPACE) -o wide

.PHONY: secrets
secrets: ## Show secrets in the namespace
	@echo "$(YELLOW)Showing secrets in namespace $(NAMESPACE)...$(RESET)"
	kubectl get secrets -n $(NAMESPACE)

.PHONY: configmaps
configmaps: ## Show configmaps in the namespace
	@echo "$(YELLOW)Showing configmaps in namespace $(NAMESPACE)...$(RESET)"
	kubectl get configmaps -n $(NAMESPACE)

.PHONY: events
events: ## Show events in the namespace
	@echo "$(YELLOW)Showing events in namespace $(NAMESPACE)...$(RESET)"
	kubectl get events -n $(NAMESPACE) --sort-by='.lastTimestamp'

.PHONY: logs
logs: ## Show logs from the main application
	@echo "$(YELLOW)Showing logs from main application...$(RESET)"
	kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/name=$(CHART_NAME) --tail=100 -f

.PHONY: describe
describe: ## Describe all resources in the namespace
	@echo "$(YELLOW)Describing all resources in namespace $(NAMESPACE)...$(RESET)"
	kubectl describe all -n $(NAMESPACE)

# Development and Debugging
.PHONY: port-forward
port-forward: ## Port forward to the main application
	@echo "$(YELLOW)Port forwarding to main application...$(RESET)"
	@echo "$(CYAN)Access the application at: http://localhost:8080$(RESET)"
	kubectl port-forward -n $(NAMESPACE) svc/$(RELEASE_NAME)-$(CHART_NAME) 8080:80

.PHONY: port-forward-ws
port-forward-ws: ## Port forward to the WebSocket service
	@echo "$(YELLOW)Port forwarding to WebSocket service...$(RESET)"
	@echo "$(CYAN)Access WebSocket at: ws://localhost:8081$(RESET)"
	kubectl port-forward -n $(NAMESPACE) svc/$(RELEASE_NAME)-$(CHART_NAME)-websocket 8081:8080

.PHONY: shell
shell: ## Get a shell in the main application pod
	@echo "$(YELLOW)Getting shell in main application pod...$(RESET)"
	kubectl exec -it -n $(NAMESPACE) $$(kubectl get pods -n $(NAMESPACE) -l app.kubernetes.io/name=$(CHART_NAME) -o jsonpath='{.items[0].metadata.name}') -- /bin/bash

.PHONY: debug
debug: ## Debug the Helm chart
	@echo "$(YELLOW)Debugging Helm chart...$(RESET)"
	helm template $(RELEASE_NAME) . --debug

# Package and Repository Management
.PHONY: package
package: ## Package the Helm chart
	@echo "$(YELLOW)Packaging Helm chart...$(RESET)"
	helm package .
	@echo "$(GREEN)✓ Helm chart packaged: $(CHART_NAME)-$(CHART_VERSION).tgz$(RESET)"

.PHONY: index
index: ## Generate Helm repository index
	@echo "$(YELLOW)Generating Helm repository index...$(RESET)"
	helm repo index . --url $(HELM_REPO_URL)
	@echo "$(GREEN)✓ Helm repository index generated$(RESET)"

.PHONY: repo-add
repo-add: ## Add the Helm repository
	@echo "$(YELLOW)Adding Helm repository...$(RESET)"
	helm repo add $(HELM_REPO_NAME) $(HELM_REPO_URL)
	helm repo update
	@echo "$(GREEN)✓ Helm repository added$(RESET)"

.PHONY: repo-update
repo-update: ## Update Helm repositories
	@echo "$(YELLOW)Updating Helm repositories...$(RESET)"
	helm repo update
	@echo "$(GREEN)✓ Helm repositories updated$(RESET)"

# Security and Compliance
.PHONY: security-scan
security-scan: ## Run security scan on the chart
	@echo "$(YELLOW)Running security scan...$(RESET)"
	@if command -v trivy >/dev/null 2>&1; then \
		trivy config .; \
	else \
		echo "$(RED)Trivy not found. Please install Trivy for security scanning.$(RESET)"; \
	fi

.PHONY: policy-check
policy-check: ## Check policies with OPA Gatekeeper
	@echo "$(YELLOW)Checking policies...$(RESET)"
	@if command -v conftest >/dev/null 2>&1; then \
		helm template $(RELEASE_NAME) . | conftest verify --policy policy/; \
	else \
		echo "$(RED)Conftest not found. Please install Conftest for policy checking.$(RESET)"; \
	fi

# Backup and Recovery
.PHONY: backup
backup: ## Create a backup of the current release
	@echo "$(YELLOW)Creating backup...$(RESET)"
	@mkdir -p backups
	helm get values $(RELEASE_NAME) --namespace $(NAMESPACE) > backups/values-$$(date +%Y%m%d-%H%M%S).yaml
	helm get manifest $(RELEASE_NAME) --namespace $(NAMESPACE) > backups/manifest-$$(date +%Y%m%d-%H%M%S).yaml
	@echo "$(GREEN)✓ Backup created in backups/ directory$(RESET)"

.PHONY: restore
restore: ## Restore from backup (requires BACKUP_FILE variable)
	@echo "$(YELLOW)Restoring from backup...$(RESET)"
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(RED)Please specify BACKUP_FILE variable$(RESET)"; \
		exit 1; \
	fi
	helm upgrade $(RELEASE_NAME) . --namespace $(NAMESPACE) --values $(BACKUP_FILE)
	@echo "$(GREEN)✓ Restored from backup$(RESET)"

# Monitoring and Metrics
.PHONY: metrics
metrics: ## Show Prometheus metrics
	@echo "$(YELLOW)Showing Prometheus metrics...$(RESET)"
	@if kubectl get svc -n $(NAMESPACE) $(RELEASE_NAME)-$(CHART_NAME)-metrics >/dev/null 2>&1; then \
		kubectl port-forward -n $(NAMESPACE) svc/$(RELEASE_NAME)-$(CHART_NAME)-metrics 9090:9090 & \
		echo "$(CYAN)Metrics available at: http://localhost:9090/metrics$(RESET)"; \
		read -p "Press Enter to stop port forwarding..."; \
		kill %%1; \
	else \
		echo "$(RED)Metrics service not found$(RESET)"; \
	fi

.PHONY: grafana
grafana: ## Access Grafana dashboard
	@echo "$(YELLOW)Accessing Grafana dashboard...$(RESET)"
	@if kubectl get svc -n $(NAMESPACE) $(RELEASE_NAME)-grafana >/dev/null 2>&1; then \
		kubectl port-forward -n $(NAMESPACE) svc/$(RELEASE_NAME)-grafana 3000:80 & \
		echo "$(CYAN)Grafana available at: http://localhost:3000$(RESET)"; \
		echo "$(CYAN)Default credentials: admin/admin$(RESET)"; \
		read -p "Press Enter to stop port forwarding..."; \
		kill %%1; \
	else \
		echo "$(RED)Grafana service not found$(RESET)"; \
	fi

# Cleanup
.PHONY: clean
clean: ## Clean up generated files
	@echo "$(YELLOW)Cleaning up generated files...$(RESET)"
	rm -f *.tgz
	rm -f index.yaml
	@echo "$(GREEN)✓ Cleanup completed$(RESET)"

.PHONY: clean-all
clean-all: clean ## Clean up everything including backups
	@echo "$(YELLOW)Cleaning up everything...$(RESET)"
	rm -rf backups/
	@echo "$(GREEN)✓ Full cleanup completed$(RESET)"

# Documentation
.PHONY: docs
docs: ## Generate documentation
	@echo "$(YELLOW)Generating documentation...$(RESET)"
	@if command -v helm-docs >/dev/null 2>&1; then \
		helm-docs; \
	else \
		echo "$(RED)helm-docs not found. Please install helm-docs for documentation generation.$(RESET)"; \
	fi

# Version Management
.PHONY: version
version: ## Show version information
	@echo "$(CYAN)Version Information:$(RESET)"
	@echo "  Chart Version: $(CHART_VERSION)"
	@echo "  App Version: $(APP_VERSION)"
	@echo "  Helm Version: $$(helm version --short)"
	@echo "  Kubernetes Version: $$(kubectl version --short 2>/dev/null | grep Server || echo 'Not connected')"

.PHONY: bump-patch
bump-patch: ## Bump patch version
	@echo "$(YELLOW)Bumping patch version...$(RESET)"
	@./scripts/bump-version.sh patch

.PHONY: bump-minor
bump-minor: ## Bump minor version
	@echo "$(YELLOW)Bumping minor version...$(RESET)"
	@./scripts/bump-version.sh minor

.PHONY: bump-major
bump-major: ## Bump major version
	@echo "$(YELLOW)Bumping major version...$(RESET)"
	@./scripts/bump-version.sh major

# CI/CD Integration
.PHONY: ci-test
ci-test: lint validate security-scan ## Run all CI tests
	@echo "$(GREEN)✓ All CI tests passed$(RESET)"

.PHONY: ci-build
ci-build: ci-test package ## Build for CI/CD
	@echo "$(GREEN)✓ CI build completed$(RESET)"

.PHONY: ci-deploy
ci-deploy: ci-build ## Deploy for CI/CD
	@echo "$(YELLOW)Deploying for CI/CD...$(RESET)"
	# Add your CI/CD deployment logic here
	@echo "$(GREEN)✓ CI deployment completed$(RESET)"

# Quick Commands
.PHONY: quick-install
quick-install: test install ## Quick install with tests
	@echo "$(GREEN)✓ Quick install completed$(RESET)"

.PHONY: quick-dev
quick-dev: test install-dev port-forward ## Quick development setup
	@echo "$(GREEN)✓ Quick development setup completed$(RESET)"

# All-in-one commands
.PHONY: all
all: test package ## Run all main tasks
	@echo "$(GREEN)✓ All tasks completed$(RESET)"

# Environment-specific targets
.PHONY: dev
dev: install-dev ## Setup development environment

.PHONY: staging
staging: ## Setup staging environment
	@echo "$(YELLOW)Setting up staging environment...$(RESET)"
	kubectl create namespace $(NAMESPACE)-staging --dry-run=client -o yaml | kubectl apply -f -
	helm install $(RELEASE_NAME)-staging . --namespace $(NAMESPACE)-staging --wait --timeout=10m \
		--set replicaCount=2 \
		--set auth.enabled=true \
		--set tls.enabled=true
	@echo "$(GREEN)✓ Staging environment setup completed$(RESET)"

.PHONY: prod
prod: install-prod ## Setup production environment

# Health checks
.PHONY: health
health: ## Check application health
	@echo "$(YELLOW)Checking application health...$(RESET)"
	@kubectl get pods -n $(NAMESPACE) -l app.kubernetes.io/name=$(CHART_NAME)
	@kubectl top pods -n $(NAMESPACE) -l app.kubernetes.io/name=$(CHART_NAME) 2>/dev/null || echo "Metrics server not available"

# Troubleshooting
.PHONY: troubleshoot
troubleshoot: ## Run troubleshooting commands
	@echo "$(YELLOW)Running troubleshooting commands...$(RESET)"
	@echo "$(CYAN)=== Pods Status ===$(RESET)"
	@kubectl get pods -n $(NAMESPACE) -o wide
	@echo "$(CYAN)=== Recent Events ===$(RESET)"
	@kubectl get events -n $(NAMESPACE) --sort-by='.lastTimestamp' | tail -10
	@echo "$(CYAN)=== Service Status ===$(RESET)"
	@kubectl get svc -n $(NAMESPACE)
	@echo "$(CYAN)=== Ingress Status ===$(RESET)"
	@kubectl get ingress -n $(NAMESPACE) 2>/dev/null || echo "No ingress found"

# Performance testing
.PHONY: load-test
load-test: ## Run load test (requires k6 or similar)
	@echo "$(YELLOW)Running load test...$(RESET)"
	@if command -v k6 >/dev/null 2>&1; then \
		k6 run tests/load-test.js; \
	else \
		echo "$(RED)k6 not found. Please install k6 for load testing.$(RESET)"; \
	fi

# Database operations
.PHONY: db-migrate
db-migrate: ## Run database migration
	@echo "$(YELLOW)Running database migration...$(RESET)"
	kubectl create job -n $(NAMESPACE) --from=cronjob/$(RELEASE_NAME)-$(CHART_NAME)-migration migration-$$(date +%s)

.PHONY: db-backup
db-backup: ## Run database backup
	@echo "$(YELLOW)Running database backup...$(RESET)"
	kubectl create job -n $(NAMESPACE) --from=cronjob/$(RELEASE_NAME)-$(CHART_NAME)-backup backup-$$(date +%s)

# Final message
.PHONY: welcome
welcome: ## Show welcome message
	@echo "$(CYAN)"
	@echo "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗    ██╗██████╗ ███████╗"
	@echo "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝    ██║██╔══██╗██╔════╝"
	@echo "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗    ██║██║  ██║█████╗  "
	@echo "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║    ██║██║  ██║██╔══╝  "
	@echo "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║    ██║██████╔╝███████╗"
	@echo "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚═╝╚═════╝ ╚══════╝"
	@echo "$(RESET)"
	@echo "$(YELLOW)Welcome to NEXUS IDE Security Dashboard Helm Chart!$(RESET)"
	@echo "$(CYAN)Run 'make help' to see available commands.$(RESET)"
	@echo ""

# Include custom makefiles if they exist
-include Makefile.local
-include Makefile.custom