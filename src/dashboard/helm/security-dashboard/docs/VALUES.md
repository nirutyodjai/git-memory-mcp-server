# 📋 NEXUS IDE Security Dashboard - Values Reference

## 🎯 Overview

This document provides a comprehensive reference for all configuration values available in the NEXUS IDE Security Dashboard Helm Chart. Each section includes detailed descriptions, default values, and usage examples.

## 📚 Table of Contents

- [Global Configuration](#global-configuration)
- [Application Settings](#application-settings)
- [Database Configuration](#database-configuration)
- [Security Settings](#security-settings)
- [Monitoring & Observability](#monitoring--observability)
- [AI/ML Configuration](#aiml-configuration)
- [Collaboration Features](#collaboration-features)
- [Development Tools](#development-tools)
- [Infrastructure Settings](#infrastructure-settings)
- [Advanced Configuration](#advanced-configuration)

---

## 🌐 Global Configuration

### `global`

Global settings that affect the entire deployment.

```yaml
global:
  # Environment type (development, staging, production)
  environment: "development"
  
  # Primary domain for the application
  domain: "nexus-ide.local"
  
  # Enable debug mode
  debug: false
  
  # Logging level (trace, debug, info, warn, error, fatal)
  logLevel: "info"
  
  # Deployment region
  region: "us-west-2"
  
  # Deployment mode (primary, secondary, standalone)
  mode: "standalone"
  
  # Image registry settings
  imageRegistry: "ghcr.io"
  
  # Image pull secrets
  imagePullSecrets:
    - name: "ghcr-secret"
  
  # Timezone for the deployment
  timezone: "UTC"
  
  # Cluster name
  clusterName: "nexus-ide-cluster"
  
  # Organization settings
  organization:
    name: "NEXUS IDE"
    domain: "nexus-ide.dev"
    contact: "admin@nexus-ide.dev"
```

#### Environment-Specific Defaults

| Environment | Debug | Log Level | Replicas | Resources |
|-------------|-------|-----------|----------|----------|
| development | true | debug | 1 | minimal |
| staging | false | info | 2 | moderate |
| production | false | warn | 3+ | optimized |

---

## 🚀 Application Settings

### `replicaCount`

Number of application replicas to run.

```yaml
# Default: 1 (development), 2 (staging), 3 (production)
replicaCount: 3
```

### `image`

Container image configuration.

```yaml
image:
  # Image repository
  repository: "ghcr.io/nexus-ide/security-dashboard"
  
  # Image tag (use specific version in production)
  tag: "v1.0.0"
  
  # Pull policy (Always, IfNotPresent, Never)
  pullPolicy: "IfNotPresent"
  
  # Image digest (overrides tag if specified)
  digest: ""
```

### `nameOverride` & `fullnameOverride`

```yaml
# Override the chart name
nameOverride: ""

# Override the full resource names
fullnameOverride: ""
```

### `serviceAccount`

Service account configuration.

```yaml
serviceAccount:
  # Create a service account
  create: true
  
  # Annotations for the service account
  annotations: {}
  
  # Name of the service account (auto-generated if empty)
  name: ""
  
  # Automount service account token
  automount: true
```

### `podAnnotations` & `podLabels`

```yaml
# Additional annotations for pods
podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"

# Additional labels for pods
podLabels:
  app.kubernetes.io/component: "dashboard"
  version: "v1.0.0"
```

### `podSecurityContext`

Security context for pods.

```yaml
podSecurityContext:
  # Run as non-root user
  runAsNonRoot: true
  
  # User ID to run containers
  runAsUser: 1001
  
  # Group ID for containers
  runAsGroup: 1001
  
  # Filesystem group ID
  fsGroup: 1001
  
  # Supplemental groups
  supplementalGroups: []
  
  # SELinux options
  seLinuxOptions: {}
  
  # Seccomp profile
  seccompProfile:
    type: RuntimeDefault
```

### `securityContext`

Security context for containers.

```yaml
securityContext:
  # Allow privilege escalation
  allowPrivilegeEscalation: false
  
  # Run as non-root
  runAsNonRoot: true
  
  # User ID
  runAsUser: 1001
  
  # Read-only root filesystem
  readOnlyRootFilesystem: true
  
  # Linux capabilities
  capabilities:
    drop:
      - ALL
    add: []
```

---

## 🌐 Service Configuration

### `service`

Kubernetes service configuration.

```yaml
service:
  # Service type (ClusterIP, NodePort, LoadBalancer)
  type: ClusterIP
  
  # Service port
  port: 80
  
  # Target port on containers
  targetPort: 8080
  
  # Node port (for NodePort type)
  nodePort: ""
  
  # Additional ports
  additionalPorts:
    - name: metrics
      port: 9090
      targetPort: 9090
      protocol: TCP
  
  # Service annotations
  annotations: {}
  
  # Load balancer IP (for LoadBalancer type)
  loadBalancerIP: ""
  
  # Load balancer source ranges
  loadBalancerSourceRanges: []
  
  # External traffic policy (Cluster, Local)
  externalTrafficPolicy: Cluster
```

---

## 🌍 Ingress Configuration

### `ingress`

Ingress controller configuration.

```yaml
ingress:
  # Enable ingress
  enabled: true
  
  # Ingress class name
  className: "nginx"
  
  # Ingress annotations
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
  
  # Ingress hosts
  hosts:
    - host: nexus-ide.local
      paths:
        - path: /
          pathType: Prefix
  
  # TLS configuration
  tls:
    - secretName: nexus-ide-tls
      hosts:
        - nexus-ide.local
  
  # Additional ingress rules
  additionalRules: []
```

---

## 💾 Resource Management

### `resources`

Resource requests and limits.

```yaml
resources:
  # Resource limits
  limits:
    cpu: 2000m
    memory: 4Gi
    ephemeral-storage: 10Gi
  
  # Resource requests
  requests:
    cpu: 1000m
    memory: 2Gi
    ephemeral-storage: 5Gi
```

#### Environment-Specific Resource Recommendations

| Environment | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-------------|-------------|----------------|-----------|-------------|
| Development | 100m | 256Mi | 500m | 1Gi |
| Staging | 500m | 1Gi | 1000m | 2Gi |
| Production | 1000m | 2Gi | 2000m | 4Gi |

### `autoscaling`

Horizontal Pod Autoscaler configuration.

```yaml
autoscaling:
  # Enable HPA
  enabled: true
  
  # Minimum replicas
  minReplicas: 3
  
  # Maximum replicas
  maxReplicas: 20
  
  # CPU utilization target
  targetCPUUtilizationPercentage: 60
  
  # Memory utilization target
  targetMemoryUtilizationPercentage: 70
  
  # Custom metrics
  customMetrics: []
  
  # Behavior configuration
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
```

---

## 🗄️ Database Configuration

### `postgresql`

PostgreSQL database configuration.

```yaml
postgresql:
  # Enable PostgreSQL
  enabled: true
  
  # Database architecture (standalone, replication)
  architecture: replication
  
  # Authentication settings
  auth:
    # Root password (auto-generated if empty)
    postgresPassword: ""
    
    # Application database
    database: "nexus_ide"
    
    # Application username
    username: "nexus_user"
    
    # Application password (auto-generated if empty)
    password: ""
    
    # Existing secret for credentials
    existingSecret: ""
  
  # Primary database configuration
  primary:
    # Persistence settings
    persistence:
      enabled: true
      size: 100Gi
      storageClass: "fast-ssd"
    
    # Resource configuration
    resources:
      limits:
        cpu: 2000m
        memory: 4Gi
      requests:
        cpu: 1000m
        memory: 2Gi
    
    # PostgreSQL configuration
    configuration: |
      max_connections = 200
      shared_buffers = 1GB
      effective_cache_size = 3GB
      work_mem = 10MB
      maintenance_work_mem = 256MB
      checkpoint_completion_target = 0.9
      wal_buffers = 16MB
      default_statistics_target = 100
      random_page_cost = 1.1
      effective_io_concurrency = 200
  
  # Read replicas configuration
  readReplicas:
    # Number of read replicas
    replicaCount: 2
    
    # Resource configuration
    resources:
      limits:
        cpu: 1000m
        memory: 2Gi
      requests:
        cpu: 500m
        memory: 1Gi
  
  # Backup configuration
  backup:
    enabled: true
    schedule: "0 2 * * *"
    retention: "30d"
```

### `redis`

Redis cache configuration.

```yaml
redis:
  # Enable Redis
  enabled: true
  
  # Redis architecture (standalone, replication, sentinel)
  architecture: replication
  
  # Authentication
  auth:
    enabled: true
    password: ""
    existingSecret: ""
  
  # Master configuration
  master:
    # Persistence
    persistence:
      enabled: true
      size: 50Gi
      storageClass: "fast-ssd"
    
    # Resources
    resources:
      limits:
        cpu: 1000m
        memory: 2Gi
      requests:
        cpu: 500m
        memory: 1Gi
    
    # Redis configuration
    configuration: |
      maxmemory-policy allkeys-lru
      timeout 300
      tcp-keepalive 60
      maxclients 10000
      save 900 1
      save 300 10
      save 60 10000
  
  # Replica configuration
  replica:
    replicaCount: 2
    resources:
      limits:
        cpu: 500m
        memory: 1Gi
      requests:
        cpu: 250m
        memory: 512Mi
```

### `mongodb`

MongoDB database configuration.

```yaml
mongodb:
  # Enable MongoDB
  enabled: true
  
  # MongoDB architecture (standalone, replicaset)
  architecture: replicaset
  
  # Authentication
  auth:
    enabled: true
    rootPassword: ""
    username: "nexus_user"
    password: ""
    database: "nexus_ide"
    existingSecret: ""
  
  # Replica set configuration
  replicaSet:
    # Number of replicas
    replicas: 3
    
    # Persistence
    persistence:
      enabled: true
      size: 100Gi
      storageClass: "fast-ssd"
    
    # Resources
    resources:
      limits:
        cpu: 1000m
        memory: 2Gi
      requests:
        cpu: 500m
        memory: 1Gi
  
  # Backup configuration
  backup:
    enabled: true
    schedule: "0 3 * * *"
    retention: "30d"
```

---

## 🔐 Security Configuration

### `security`

Security-related settings.

```yaml
security:
  # Network policies
  networkPolicy:
    enabled: true
    
    # Ingress rules
    ingress:
      - from:
          - namespaceSelector:
              matchLabels:
                name: ingress-nginx
        ports:
          - protocol: TCP
            port: 8080
    
    # Egress rules
    egress:
      - to: []
        ports:
          - protocol: TCP
            port: 53
          - protocol: UDP
            port: 53
  
  # Pod Security Policy
  podSecurityPolicy:
    enabled: true
    
    # Policy settings
    allowPrivilegeEscalation: false
    allowedCapabilities: []
    requiredDropCapabilities:
      - ALL
    runAsUser:
      rule: MustRunAsNonRoot
    fsGroup:
      rule: RunAsAny
    volumes:
      - configMap
      - emptyDir
      - projected
      - secret
      - downwardAPI
      - persistentVolumeClaim
  
  # RBAC configuration
  rbac:
    create: true
    
    # Additional rules
    rules:
      - apiGroups: [""]
        resources: ["configmaps"]
        verbs: ["get", "list", "watch"]
  
  # Security scanning
  scanning:
    enabled: true
    
    # Vulnerability scanning
    vulnerabilities:
      enabled: true
      schedule: "0 4 * * *"
    
    # Compliance scanning
    compliance:
      enabled: true
      standards:
        - cis
        - nist
        - pci-dss
```

### `authentication`

Authentication configuration.

```yaml
authentication:
  # Authentication method (local, oauth2, saml, ldap)
  method: "oauth2"
  
  # OAuth2 configuration
  oauth2:
    # Provider (google, github, azure, custom)
    provider: "google"
    
    # Client credentials
    clientId: ""
    clientSecret: ""
    
    # Redirect URL
    redirectUrl: "https://nexus-ide.local/auth/callback"
    
    # Scopes
    scopes:
      - openid
      - profile
      - email
  
  # SAML configuration
  saml:
    enabled: false
    
    # Identity provider settings
    idp:
      entityId: ""
      ssoUrl: ""
      certificate: ""
  
  # LDAP configuration
  ldap:
    enabled: false
    
    # Server settings
    server:
      url: "ldap://ldap.example.com:389"
      bindDn: "cn=admin,dc=example,dc=com"
      bindPassword: ""
    
    # User search
    userSearch:
      baseDn: "ou=users,dc=example,dc=com"
      filter: "(uid={0})"
  
  # Session configuration
  session:
    # Session timeout (in minutes)
    timeout: 480
    
    # Remember me duration (in days)
    rememberMe: 30
    
    # Secure cookies
    secure: true
    
    # Same-site policy
    sameSite: "Strict"
```

### `tls`

TLS/SSL configuration.

```yaml
tls:
  # Enable TLS
  enabled: true
  
  # Certificate source (cert-manager, manual, external)
  source: "cert-manager"
  
  # Cert-manager configuration
  certManager:
    # Cluster issuer
    clusterIssuer: "letsencrypt-prod"
    
    # DNS names
    dnsNames:
      - nexus-ide.local
      - "*.nexus-ide.local"
  
  # Manual certificate configuration
  manual:
    # Secret name containing certificate
    secretName: "nexus-ide-tls"
    
    # Certificate data (base64 encoded)
    certificate: ""
    
    # Private key data (base64 encoded)
    privateKey: ""
  
  # TLS settings
  settings:
    # Minimum TLS version
    minVersion: "1.2"
    
    # Cipher suites
    cipherSuites:
      - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
      - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
    
    # HSTS settings
    hsts:
      enabled: true
      maxAge: 31536000
      includeSubdomains: true
      preload: true
```

---

## 📊 Monitoring & Observability

### `monitoring`

Monitoring stack configuration.

```yaml
monitoring:
  # Enable monitoring
  enabled: true
  
  # Prometheus configuration
  prometheus:
    enabled: true
    
    # Service monitor
    serviceMonitor:
      enabled: true
      interval: 30s
      scrapeTimeout: 10s
      
      # Additional labels
      labels:
        release: prometheus
    
    # Prometheus rules
    rules:
      enabled: true
      
      # Custom rules
      custom: |
        groups:
          - name: nexus-ide.rules
            rules:
              - alert: HighErrorRate
                expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
                for: 5m
                labels:
                  severity: warning
                annotations:
                  summary: High error rate detected
  
  # Grafana configuration
  grafana:
    enabled: true
    
    # Dashboards
    dashboards:
      enabled: true
      
      # Dashboard configuration
      configMaps:
        - nexus-ide-dashboards
    
    # Data sources
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus:9090
        access: proxy
        isDefault: true
  
  # Jaeger tracing
  jaeger:
    enabled: true
    
    # Sampling configuration
    sampling:
      type: probabilistic
      param: 0.1
    
    # Storage configuration
    storage:
      type: elasticsearch
      elasticsearch:
        serverUrls: http://elasticsearch:9200
  
  # AlertManager
  alertmanager:
    enabled: true
    
    # Configuration
    config:
      global:
        smtp_smarthost: 'localhost:587'
        smtp_from: 'alerts@nexus-ide.dev'
      
      route:
        group_by: ['alertname']
        group_wait: 10s
        group_interval: 10s
        repeat_interval: 1h
        receiver: 'web.hook'
      
      receivers:
        - name: 'web.hook'
          webhook_configs:
            - url: 'http://webhook:5001/'
```

### `logging`

Logging configuration.

```yaml
logging:
  # Enable centralized logging
  enabled: true
  
  # Log level (trace, debug, info, warn, error, fatal)
  level: "info"
  
  # Log format (json, text)
  format: "json"
  
  # Elasticsearch configuration
  elasticsearch:
    enabled: true
    
    # Cluster configuration
    cluster:
      name: "nexus-ide-logs"
      
      # Master nodes
      master:
        replicas: 3
        resources:
          limits:
            cpu: 1000m
            memory: 2Gi
          requests:
            cpu: 500m
            memory: 1Gi
      
      # Data nodes
      data:
        replicas: 3
        resources:
          limits:
            cpu: 2000m
            memory: 4Gi
          requests:
            cpu: 1000m
            memory: 2Gi
        
        # Persistence
        persistence:
          enabled: true
          size: 500Gi
          storageClass: "fast-ssd"
  
  # Fluentd configuration
  fluentd:
    enabled: true
    
    # Resource configuration
    resources:
      limits:
        cpu: 500m
        memory: 1Gi
      requests:
        cpu: 250m
        memory: 512Mi
    
    # Configuration
    config: |
      <source>
        @type tail
        path /var/log/containers/*.log
        pos_file /var/log/fluentd-containers.log.pos
        tag kubernetes.*
        format json
        time_format %Y-%m-%dT%H:%M:%S.%NZ
      </source>
      
      <match kubernetes.**>
        @type elasticsearch
        host elasticsearch
        port 9200
        index_name nexus-ide
        type_name _doc
      </match>
  
  # Kibana configuration
  kibana:
    enabled: true
    
    # Resource configuration
    resources:
      limits:
        cpu: 1000m
        memory: 2Gi
      requests:
        cpu: 500m
        memory: 1Gi
  
  # Log retention
  retention:
    # Application logs
    application: "30d"
    
    # Audit logs
    audit: "7y"
    
    # Access logs
    access: "90d"
    
    # Error logs
    error: "1y"
```

---

## 🤖 AI/ML Configuration

### `ai`

AI and machine learning configuration.

```yaml
ai:
  # Enable AI features
  enabled: true
  
  # AI models configuration
  models:
    # GPT-4 configuration
    gpt4:
      enabled: true
      
      # Model settings
      model: "gpt-4-turbo"
      
      # API configuration
      apiKey: ""
      apiUrl: "https://api.openai.com/v1"
      
      # Rate limiting
      rateLimit:
        requests: 1000
        tokens: 100000
        window: "1h"
      
      # Context settings
      context:
        maxTokens: 8192
        temperature: 0.7
        topP: 0.9
    
    # Claude configuration
    claude:
      enabled: true
      
      # Model settings
      model: "claude-3-opus"
      
      # API configuration
      apiKey: ""
      apiUrl: "https://api.anthropic.com/v1"
      
      # Rate limiting
      rateLimit:
        requests: 500
        tokens: 50000
        window: "1h"
    
    # Llama configuration
    llama:
      enabled: true
      
      # Local deployment
      local:
        enabled: true
        
        # Model path
        modelPath: "/models/llama-2-70b"
        
        # GPU configuration
        gpu:
          enabled: true
          count: 4
          memory: "40Gi"
        
        # Resource requirements
        resources:
          limits:
            nvidia.com/gpu: 4
            cpu: 8000m
            memory: 64Gi
          requests:
            nvidia.com/gpu: 4
            cpu: 4000m
            memory: 32Gi
    
    # Gemini configuration
    gemini:
      enabled: false
      
      # Model settings
      model: "gemini-pro"
      
      # API configuration
      apiKey: ""
      apiUrl: "https://generativelanguage.googleapis.com/v1"
  
  # AI services configuration
  services:
    # Code completion
    codeCompletion:
      enabled: true
      
      # Model priority
      models:
        - gpt4
        - claude
        - llama
      
      # Cache settings
      cache:
        enabled: true
        ttl: "1h"
        size: "1Gi"
    
    # Code generation
    codeGeneration:
      enabled: true
      
      # Model settings
      primaryModel: "gpt4"
      fallbackModel: "claude"
      
      # Quality settings
      quality:
        minConfidence: 0.8
        maxRetries: 3
    
    # Code explanation
    codeExplanation:
      enabled: true
      
      # Model settings
      model: "claude"
      
      # Output format
      format: "markdown"
      
      # Language support
      languages:
        - javascript
        - typescript
        - python
        - java
        - go
        - rust
    
    # Bug detection
    bugDetection:
      enabled: true
      
      # Scanning settings
      realTime: true
      
      # Severity levels
      severityLevels:
        - critical
        - high
        - medium
        - low
      
      # Integration
      integration:
        sonarqube: true
        eslint: true
        pylint: true
    
    # Performance optimization
    performanceOptimization:
      enabled: true
      
      # Analysis settings
      analysis:
        cpu: true
        memory: true
        network: true
        database: true
      
      # Recommendations
      recommendations:
        automatic: false
        manual: true
        confidence: 0.9
  
  # Vector database for embeddings
  vectorDatabase:
    # Database type (pinecone, weaviate, qdrant, chroma)
    type: "qdrant"
    
    # Qdrant configuration
    qdrant:
      enabled: true
      
      # Deployment settings
      replicas: 3
      
      # Resource configuration
      resources:
        limits:
          cpu: 2000m
          memory: 4Gi
        requests:
          cpu: 1000m
          memory: 2Gi
      
      # Persistence
      persistence:
        enabled: true
        size: 100Gi
        storageClass: "fast-ssd"
      
      # Configuration
      config:
        collections:
          - name: "code-embeddings"
            vectorSize: 1536
            distance: "Cosine"
          - name: "documentation"
            vectorSize: 1536
            distance: "Cosine"
```

---

## 🤝 Collaboration Configuration

### `collaboration`

Real-time collaboration features.

```yaml
collaboration:
  # Enable collaboration features
  enabled: true
  
  # WebSocket configuration
  websocket:
    enabled: true
    
    # Connection settings
    maxConnections: 10000
    
    # Message settings
    maxMessageSize: "1MB"
    
    # Heartbeat settings
    heartbeat:
      interval: 30
      timeout: 90
    
    # Resource configuration
    resources:
      limits:
        cpu: 1000m
        memory: 2Gi
      requests:
        cpu: 500m
        memory: 1Gi
  
  # Live sharing
  liveSharing:
    enabled: true
    
    # Session settings
    maxParticipants: 50
    sessionTimeout: "8h"
    
    # Permissions
    permissions:
      read: true
      write: true
      execute: false
      admin: false
    
    # Recording
    recording:
      enabled: true
      retention: "30d"
      format: "mp4"
  
  # Voice/Video chat
  voiceVideo:
    enabled: true
    
    # WebRTC configuration
    webrtc:
      stunServers:
        - "stun:stun.l.google.com:19302"
      
      turnServers:
        - url: "turn:turn.example.com:3478"
          username: "user"
          credential: "pass"
    
    # Quality settings
    quality:
      video:
        resolution: "720p"
        framerate: 30
        bitrate: "1Mbps"
      
      audio:
        sampleRate: 48000
        bitrate: "128kbps"
  
  # Screen sharing
  screenSharing:
    enabled: true
    
    # Quality settings
    quality:
      resolution: "1080p"
      framerate: 15
      bitrate: "2Mbps"
    
    # Permissions
    permissions:
      view: true
      control: false
  
  # Comment system
  comments:
    enabled: true
    
    # Threading
    threading: true
    
    # Notifications
    notifications:
      email: true
      push: true
      inApp: true
    
    # Moderation
    moderation:
      enabled: true
      autoModeration: true
      reportSystem: true
  
  # Presence awareness
  presence:
    enabled: true
    
    # Update interval
    updateInterval: 5
    
    # Timeout settings
    timeout:
      idle: 300
      away: 900
      offline: 1800
    
    # Status options
    statuses:
      - available
      - busy
      - away
      - do-not-disturb
```

---

## 🛠️ Development Tools

### `development`

Development and debugging tools.

```yaml
development:
  # Enable development mode
  enabled: false
  
  # Debug configuration
  debug:
    enabled: false
    
    # Debug level (1-5)
    level: 3
    
    # Debug output
    output:
      console: true
      file: true
      remote: false
  
  # Hot reload
  hotReload:
    enabled: false
    
    # Watch patterns
    watchPatterns:
      - "**/*.js"
      - "**/*.ts"
      - "**/*.jsx"
      - "**/*.tsx"
    
    # Ignore patterns
    ignorePatterns:
      - "node_modules/**"
      - "dist/**"
      - "build/**"
  
  # Profiling
  profiling:
    enabled: false
    
    # CPU profiling
    cpu:
      enabled: false
      interval: 100
      duration: "5m"
    
    # Memory profiling
    memory:
      enabled: false
      interval: 1000
      heapDump: true
    
    # Performance profiling
    performance:
      enabled: false
      metrics:
        - response_time
        - throughput
        - error_rate
  
  # Testing
  testing:
    # Unit tests
    unit:
      enabled: false
      framework: "jest"
      coverage: true
      threshold: 80
    
    # Integration tests
    integration:
      enabled: false
      framework: "cypress"
      headless: true
    
    # E2E tests
    e2e:
      enabled: false
      framework: "playwright"
      browsers:
        - chromium
        - firefox
        - webkit
  
  # Code quality
  codeQuality:
    # Linting
    linting:
      enabled: true
      
      # ESLint configuration
      eslint:
        enabled: true
        config: ".eslintrc.js"
        fix: true
      
      # Prettier configuration
      prettier:
        enabled: true
        config: ".prettierrc"
        format: true
    
    # Static analysis
    staticAnalysis:
      enabled: true
      
      # SonarQube integration
      sonarqube:
        enabled: false
        serverUrl: "https://sonarqube.example.com"
        projectKey: "nexus-ide-dashboard"
      
      # CodeClimate integration
      codeclimate:
        enabled: false
        token: ""
```

---

## 🏗️ Infrastructure Settings

### `nodeSelector`

Node selection constraints.

```yaml
nodeSelector:
  # Node type
  node-type: "compute-optimized"
  
  # Instance type
  instance-type: "c5.2xlarge"
  
  # Availability zone
  zone: "us-west-2a"
  
  # Environment
  environment: "production"
```

### `tolerations`

Pod tolerations for node taints.

```yaml
tolerations:
  - key: "high-performance"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"
  
  - key: "gpu-node"
    operator: "Exists"
    effect: "NoSchedule"
  
  - key: "dedicated"
    operator: "Equal"
    value: "nexus-ide"
    effect: "NoExecute"
    tolerationSeconds: 3600
```

### `affinity`

Pod affinity and anti-affinity rules.

```yaml
affinity:
  # Node affinity
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: "kubernetes.io/arch"
              operator: In
              values:
                - amd64
    
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
            - key: "node-type"
              operator: In
              values:
                - "compute-optimized"
  
  # Pod affinity
  podAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: "app.kubernetes.io/name"
                operator: In
                values:
                  - postgresql
          topologyKey: "kubernetes.io/hostname"
  
  # Pod anti-affinity
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: "app.kubernetes.io/name"
                operator: In
                values:
                  - security-dashboard
          topologyKey: "kubernetes.io/hostname"
```

### `topologySpreadConstraints`

Topology spread constraints for better distribution.

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: "kubernetes.io/hostname"
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app.kubernetes.io/name: security-dashboard
  
  - maxSkew: 1
    topologyKey: "topology.kubernetes.io/zone"
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app.kubernetes.io/name: security-dashboard
```

---

## 🔧 Advanced Configuration

### `persistence`

Persistent volume configuration.

```yaml
persistence:
  # Enable persistence
  enabled: true
  
  # Storage class
  storageClass: "fast-ssd"
  
  # Access mode
  accessMode: ReadWriteOnce
  
  # Volume size
  size: 100Gi
  
  # Annotations
  annotations: {}
  
  # Selector
  selector: {}
  
  # Existing claim
  existingClaim: ""
  
  # Mount path
  mountPath: "/data"
  
  # Sub path
  subPath: ""
```

### `configMap`

Configuration map settings.

```yaml
configMap:
  # Create config map
  create: true
  
  # Config map name
  name: ""
  
  # Configuration data
  data:
    app.yaml: |
      server:
        port: 8080
        host: 0.0.0.0
      
      database:
        host: postgresql
        port: 5432
        name: nexus_ide
      
      redis:
        host: redis-master
        port: 6379
      
      logging:
        level: info
        format: json
```

### `secrets`

Secret management configuration.

```yaml
secrets:
  # Create secrets
  create: true
  
  # External secrets
  external:
    enabled: false
    
    # External Secrets Operator
    eso:
      enabled: false
      
      # Secret store
      secretStore:
        name: "vault-backend"
        kind: "SecretStore"
      
      # Refresh interval
      refreshInterval: "1h"
      
      # Secrets
      secrets:
        - name: "database-credentials"
          key: "database/nexus-ide/credentials"
          property: "username"
        
        - name: "api-keys"
          key: "api/nexus-ide/keys"
          property: "openai"
  
  # Manual secrets
  manual:
    # Database credentials
    database:
      username: ""
      password: ""
    
    # API keys
    apiKeys:
      openai: ""
      anthropic: ""
      google: ""
    
    # OAuth credentials
    oauth:
      clientId: ""
      clientSecret: ""
    
    # TLS certificates
    tls:
      certificate: ""
      privateKey: ""
```

### `healthChecks`

Health check configuration.

```yaml
healthChecks:
  # Liveness probe
  livenessProbe:
    enabled: true
    
    # HTTP probe
    httpGet:
      path: "/health/live"
      port: 8080
      scheme: HTTP
    
    # Timing settings
    initialDelaySeconds: 30
    periodSeconds: 10
    timeoutSeconds: 5
    successThreshold: 1
    failureThreshold: 3
  
  # Readiness probe
  readinessProbe:
    enabled: true
    
    # HTTP probe
    httpGet:
      path: "/health/ready"
      port: 8080
      scheme: HTTP
    
    # Timing settings
    initialDelaySeconds: 10
    periodSeconds: 5
    timeoutSeconds: 3
    successThreshold: 1
    failureThreshold: 3
  
  # Startup probe
  startupProbe:
    enabled: true
    
    # HTTP probe
    httpGet:
      path: "/health/startup"
      port: 8080
      scheme: HTTP
    
    # Timing settings
    initialDelaySeconds: 10
    periodSeconds: 10
    timeoutSeconds: 5
    successThreshold: 1
    failureThreshold: 30
```

### `podDisruptionBudget`

Pod Disruption Budget configuration.

```yaml
podDisruptionBudget:
  # Enable PDB
  enabled: true
  
  # Minimum available pods
  minAvailable: 2
  
  # Maximum unavailable pods (alternative to minAvailable)
  # maxUnavailable: 1
```

### `horizontalPodAutoscaler`

Advanced HPA configuration.

```yaml
horizontalPodAutoscaler:
  # Enable HPA
  enabled: true
  
  # API version
  apiVersion: "autoscaling/v2"
  
  # Scale target reference
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: security-dashboard
  
  # Min/Max replicas
  minReplicas: 3
  maxReplicas: 20
  
  # Metrics
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70
    
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"
  
  # Behavior
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
        - type: Pods
          value: 2
          periodSeconds: 60
      selectPolicy: Min
    
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
        - type: Pods
          value: 4
          periodSeconds: 60
      selectPolicy: Max
```

---

## 📝 Usage Examples

### Development Environment

```yaml
# values-dev.yaml
global:
  environment: development
  debug: true
  logLevel: debug

replicaCount: 1

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: false

postgresql:
  primary:
    persistence:
      size: 10Gi

redis:
  master:
    persistence:
      size: 5Gi

monitoring:
  enabled: false

ai:
  enabled: false

collaboration:
  enabled: false
```

### Staging Environment

```yaml
# values-staging.yaml
global:
  environment: staging
  debug: false
  logLevel: info
  domain: staging.nexus-ide.dev

replicaCount: 2

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 1000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5

postgresql:
  architecture: replication
  readReplicas:
    replicaCount: 1

monitoring:
  enabled: true
  prometheus:
    enabled: true
  grafana:
    enabled: true

ai:
  enabled: true
  models:
    gpt4:
      enabled: false
    claude:
      enabled: true

collaboration:
  enabled: true
  voiceVideo:
    enabled: false
```

### Production Environment

```yaml
# values-prod.yaml
global:
  environment: production
  debug: false
  logLevel: warn
  domain: nexus-ide.dev

replicaCount: 5

resources:
  requests:
    cpu: 1000m
    memory: 2Gi
  limits:
    cpu: 2000m
    memory: 4Gi

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20

postgresql:
  architecture: replication
  readReplicas:
    replicaCount: 3
  backup:
    enabled: true

redis:
  architecture: replication
  replica:
    replicaCount: 3

mongodb:
  architecture: replicaset
  replicaSet:
    replicas: 3

security:
  networkPolicy:
    enabled: true
  podSecurityPolicy:
    enabled: true
  rbac:
    create: true

monitoring:
  enabled: true
  prometheus:
    enabled: true
  grafana:
    enabled: true
  jaeger:
    enabled: true
  alertmanager:
    enabled: true

logging:
  enabled: true
  elasticsearch:
    enabled: true
  fluentd:
    enabled: true
  kibana:
    enabled: true

ai:
  enabled: true
  models:
    gpt4:
      enabled: true
    claude:
      enabled: true
    llama:
      enabled: true

collaboration:
  enabled: true
  websocket:
    enabled: true
  liveSharing:
    enabled: true
  voiceVideo:
    enabled: true

backup:
  enabled: true
  schedule: "0 1 * * *"
  retention: "30d"
```

---

## 🔍 Validation

The chart includes JSON Schema validation for all values. Invalid configurations will be rejected during installation.

### Common Validation Errors

1. **Invalid Resource Format**:
   ```
   Error: values don't meet the specifications of the schema(s)
   - resources.requests.cpu: Invalid format
   ```

2. **Missing Required Fields**:
   ```
   Error: values don't meet the specifications of the schema(s)
   - global.domain: Required field missing
   ```

3. **Invalid Enum Values**:
   ```
   Error: values don't meet the specifications of the schema(s)
   - global.environment: Must be one of [development, staging, production]
   ```

### Validation Commands

```bash
# Validate values file
helm lint . -f values-production.yaml

# Validate with schema
helm template nexus-ide . -f values-production.yaml --validate

# Dry run installation
helm install nexus-ide . -f values-production.yaml --dry-run
```

---

**© 2024 NEXUS IDE. All rights reserved.**

*For the latest updates and detailed information, please visit our [official documentation](https://docs.nexus-ide.dev).*