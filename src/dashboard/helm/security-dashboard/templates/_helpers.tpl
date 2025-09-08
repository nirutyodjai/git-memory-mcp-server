{{/*
=============================================================================
ENTERPRISE SECURITY DASHBOARD - HELM HELPERS
Template Helper Functions for Kubernetes Resources
=============================================================================
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "security-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "security-dashboard.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "security-dashboard.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "security-dashboard.labels" -}}
helm.sh/chart: {{ include "security-dashboard.chart" . }}
{{ include "security-dashboard.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: nexus-ide
app.kubernetes.io/created-by: helm
{{- with .Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "security-dashboard.selectorLabels" -}}
app.kubernetes.io/name: {{ include "security-dashboard.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "security-dashboard.serviceAccountName" -}}
{{- if .Values.security.serviceAccount.create }}
{{- default (include "security-dashboard.fullname" .) .Values.security.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.security.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the cluster role to use
*/}}
{{- define "security-dashboard.clusterRoleName" -}}
{{- if .Values.security.rbac.create }}
{{- default (include "security-dashboard.fullname" .) .Values.security.rbac.clusterRoleName }}
{{- else }}
{{- default "cluster-admin" .Values.security.rbac.clusterRoleName }}
{{- end }}
{{- end }}

{{/*
Create the name of the role to use
*/}}
{{- define "security-dashboard.roleName" -}}
{{- if .Values.security.rbac.create }}
{{- default (include "security-dashboard.fullname" .) .Values.security.rbac.roleName }}
{{- else }}
{{- default "admin" .Values.security.rbac.roleName }}
{{- end }}
{{- end }}

{{/*
PostgreSQL fullname
*/}}
{{- define "security-dashboard.postgresql.fullname" -}}
{{- if .Values.postgresql.fullnameOverride }}
{{- .Values.postgresql.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "postgresql" .Values.postgresql.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Redis fullname
*/}}
{{- define "security-dashboard.redis.fullname" -}}
{{- if .Values.redis.fullnameOverride }}
{{- .Values.redis.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "redis" .Values.redis.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
MongoDB fullname
*/}}
{{- define "security-dashboard.mongodb.fullname" -}}
{{- if .Values.mongodb.fullnameOverride }}
{{- .Values.mongodb.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "mongodb" .Values.mongodb.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Database connection string for PostgreSQL
*/}}
{{- define "security-dashboard.postgresql.connectionString" -}}
{{- if .Values.postgresql.enabled }}
postgresql://{{ .Values.postgresql.auth.username }}:{{ .Values.postgresql.auth.password }}@{{ include "security-dashboard.postgresql.fullname" . }}:5432/{{ .Values.postgresql.auth.database }}
{{- else }}
{{ .Values.externalDatabase.connectionString }}
{{- end }}
{{- end }}

{{/*
Redis connection string
*/}}
{{- define "security-dashboard.redis.connectionString" -}}
{{- if .Values.redis.enabled }}
{{- if .Values.redis.auth.enabled }}
redis://:{{ .Values.redis.auth.password }}@{{ include "security-dashboard.redis.fullname" . }}-master:6379
{{- else }}
redis://{{ include "security-dashboard.redis.fullname" . }}-master:6379
{{- end }}
{{- else }}
{{ .Values.externalRedis.connectionString }}
{{- end }}
{{- end }}

{{/*
MongoDB connection string
*/}}
{{- define "security-dashboard.mongodb.connectionString" -}}
{{- if .Values.mongodb.enabled }}
{{- if .Values.mongodb.auth.enabled }}
mongodb://{{ .Values.mongodb.auth.username }}:{{ .Values.mongodb.auth.password }}@{{ include "security-dashboard.mongodb.fullname" . }}:27017/{{ .Values.mongodb.auth.database }}
{{- else }}
mongodb://{{ include "security-dashboard.mongodb.fullname" . }}:27017/{{ .Values.mongodb.auth.database }}
{{- end }}
{{- else }}
{{ .Values.externalMongoDB.connectionString }}
{{- end }}
{{- end }}

{{/*
Environment variables
*/}}
{{- define "security-dashboard.env" -}}
- name: NODE_ENV
  value: {{ .Values.app.env.NODE_ENV | quote }}
- name: LOG_LEVEL
  value: {{ .Values.app.env.LOG_LEVEL | quote }}
- name: METRICS_ENABLED
  value: {{ .Values.app.env.METRICS_ENABLED | quote }}
- name: SECURITY_SCAN_ENABLED
  value: {{ .Values.app.env.SECURITY_SCAN_ENABLED | quote }}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "security-dashboard.fullname" . }}-secret
      key: database-url
- name: REDIS_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "security-dashboard.fullname" . }}-secret
      key: redis-url
- name: MONGODB_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "security-dashboard.fullname" . }}-secret
      key: mongodb-url
{{- end }}

{{/*
Ingress class name
*/}}
{{- define "security-dashboard.ingressClassName" -}}
{{- if .Values.ingress.className }}
{{- .Values.ingress.className }}
{{- else if .Values.ingress.class }}
{{- .Values.ingress.class }}
{{- else }}
nginx
{{- end }}
{{- end }}

{{/*
TLS secret name
*/}}
{{- define "security-dashboard.tlsSecretName" -}}
{{- if .Values.ingress.tls }}
{{- range .Values.ingress.tls }}
{{- .secretName }}
{{- end }}
{{- else }}
{{ include "security-dashboard.fullname" . }}-tls
{{- end }}
{{- end }}

{{/*
Prometheus service monitor labels
*/}}
{{- define "security-dashboard.serviceMonitor.labels" -}}
{{ include "security-dashboard.labels" . }}
{{- with .Values.monitoring.prometheus.serviceMonitor.labels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Prometheus rules labels
*/}}
{{- define "security-dashboard.prometheusRule.labels" -}}
{{ include "security-dashboard.labels" . }}
{{- with .Values.monitoring.prometheus.rules.labels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Network policy labels
*/}}
{{- define "security-dashboard.networkPolicy.labels" -}}
{{ include "security-dashboard.labels" . }}
app.kubernetes.io/component: network-policy
{{- end }}

{{/*
Pod security policy labels
*/}}
{{- define "security-dashboard.podSecurityPolicy.labels" -}}
{{ include "security-dashboard.labels" . }}
app.kubernetes.io/component: pod-security-policy
{{- end }}

{{/*
Validate configuration
*/}}
{{- define "security-dashboard.validateConfig" -}}
{{- if and (not .Values.postgresql.enabled) (not .Values.externalDatabase.connectionString) }}
{{- fail "Either postgresql.enabled must be true or externalDatabase.connectionString must be provided" }}
{{- end }}
{{- if and (not .Values.redis.enabled) (not .Values.externalRedis.connectionString) }}
{{- fail "Either redis.enabled must be true or externalRedis.connectionString must be provided" }}
{{- end }}
{{- if and .Values.ingress.enabled (not .Values.ingress.hosts) }}
{{- fail "ingress.hosts must be provided when ingress is enabled" }}
{{- end }}
{{- if and .Values.tls.certManager.enabled (not .Values.tls.certManager.issuer.email) }}
{{- fail "tls.certManager.issuer.email must be provided when cert-manager is enabled" }}
{{- end }}
{{- end }}

{{/*
Generate certificates
*/}}
{{- define "security-dashboard.gen-certs" -}}
{{- $altNames := list ( printf "%s.%s" (include "security-dashboard.name" .) .Release.Namespace ) ( printf "%s.%s.svc" (include "security-dashboard.name" .) .Release.Namespace ) -}}
{{- $ca := genCA "security-dashboard-ca" 365 -}}
{{- $cert := genSignedCert ( include "security-dashboard.name" . ) nil $altNames 365 $ca -}}
tls.crt: {{ $cert.Cert | b64enc }}
tls.key: {{ $cert.Key | b64enc }}
ca.crt: {{ $ca.Cert | b64enc }}
{{- end }}

{{/*
Resource name with suffix
*/}}
{{- define "security-dashboard.resourceName" -}}
{{- $name := include "security-dashboard.fullname" . -}}
{{- if .suffix -}}
{{- printf "%s-%s" $name .suffix -}}
{{- else -}}
{{- $name -}}
{{- end -}}
{{- end }}

{{/*
Image pull policy
*/}}
{{- define "security-dashboard.imagePullPolicy" -}}
{{- if .Values.app.image.pullPolicy }}
{{- .Values.app.image.pullPolicy }}
{{- else if eq .Values.app.image.tag "latest" }}
Always
{{- else }}
IfNotPresent
{{- end }}
{{- end }}

{{/*
Image repository
*/}}
{{- define "security-dashboard.imageRepository" -}}
{{- if .Values.global.imageRegistry }}
{{- printf "%s/%s" .Values.global.imageRegistry .Values.app.image.repository }}
{{- else if .Values.app.image.registry }}
{{- printf "%s/%s" .Values.app.image.registry .Values.app.image.repository }}
{{- else }}
{{- .Values.app.image.repository }}
{{- end }}
{{- end }}

{{/*
Image tag
*/}}
{{- define "security-dashboard.imageTag" -}}
{{- .Values.app.image.tag | default .Chart.AppVersion }}
{{- end }}

{{/*
Full image name
*/}}
{{- define "security-dashboard.image" -}}
{{- printf "%s:%s" (include "security-dashboard.imageRepository" .) (include "security-dashboard.imageTag" .) }}
{{- end }}

{{/*
Storage class name
*/}}
{{- define "security-dashboard.storageClass" -}}
{{- if .Values.global.storageClass }}
{{- .Values.global.storageClass }}
{{- else if .Values.persistence.storageClass }}
{{- .Values.persistence.storageClass }}
{{- else }}
default
{{- end }}
{{- end }}

{{/*
Annotations for pods
*/}}
{{- define "security-dashboard.podAnnotations" -}}
{{- with .Values.app.podAnnotations }}
{{- toYaml . }}
{{- end }}
checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
prometheus.io/scrape: "true"
prometheus.io/port: "3000"
prometheus.io/path: "/metrics"
{{- end }}

{{/*
Security context for containers
*/}}
{{- define "security-dashboard.securityContext" -}}
{{- if .Values.app.securityContext }}
{{- toYaml .Values.app.securityContext }}
{{- else }}
allowPrivilegeEscalation: false
capabilities:
  drop:
    - ALL
readOnlyRootFilesystem: true
runAsNonRoot: true
runAsUser: 1001
{{- end }}
{{- end }}

{{/*
Pod security context
*/}}
{{- define "security-dashboard.podSecurityContext" -}}
{{- if .Values.global.securityContext }}
{{- toYaml .Values.global.securityContext }}
{{- else }}
runAsNonRoot: true
runAsUser: 1001
runAsGroup: 1001
fsGroup: 1001
{{- end }}
{{- end }}

{{/*
Node selector
*/}}
{{- define "security-dashboard.nodeSelector" -}}
{{- with .Values.app.nodeSelector }}
{{- toYaml . }}
{{- end }}
{{- end }}

{{/*
Tolerations
*/}}
{{- define "security-dashboard.tolerations" -}}
{{- with .Values.app.tolerations }}
{{- toYaml . }}
{{- end }}
{{- end }}

{{/*
Affinity rules
*/}}
{{- define "security-dashboard.affinity" -}}
{{- if .Values.app.affinity }}
{{- toYaml .Values.app.affinity }}
{{- else }}
podAntiAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
            - key: app.kubernetes.io/name
              operator: In
              values:
                - {{ include "security-dashboard.name" . }}
        topologyKey: kubernetes.io/hostname
{{- end }}
{{- end }}

{{/*
Probes configuration
*/}}
{{- define "security-dashboard.livenessProbe" -}}
{{- if .Values.app.livenessProbe }}
{{- toYaml .Values.app.livenessProbe }}
{{- else }}
httpGet:
  path: /health
  port: 3000
initialDelaySeconds: 30
periodSeconds: 10
timeoutSeconds: 5
failureThreshold: 3
{{- end }}
{{- end }}

{{- define "security-dashboard.readinessProbe" -}}
{{- if .Values.app.readinessProbe }}
{{- toYaml .Values.app.readinessProbe }}
{{- else }}
httpGet:
  path: /ready
  port: 3000
initialDelaySeconds: 5
periodSeconds: 5
timeoutSeconds: 3
failureThreshold: 3
{{- end }}
{{- end }}

{{/*
Feature flags as environment variables
*/}}
{{- define "security-dashboard.featureFlags" -}}
{{- range $key, $value := .Values.featureFlags }}
- name: {{ printf "FEATURE_%s" ($key | upper | replace "-" "_") }}
  value: {{ $value | quote }}
{{- end }}
{{- end }}

{{/*
Validate required values
*/}}
{{- define "security-dashboard.validateRequired" -}}
{{- required "A valid .Values.app.image.repository is required!" .Values.app.image.repository }}
{{- required "A valid .Values.app.image.tag is required!" .Values.app.image.tag }}
{{- if .Values.ingress.enabled }}
{{- required "A valid .Values.ingress.hosts is required when ingress is enabled!" .Values.ingress.hosts }}
{{- end }}
{{- if .Values.tls.certManager.enabled }}
{{- required "A valid .Values.tls.certManager.issuer.email is required when cert-manager is enabled!" .Values.tls.certManager.issuer.email }}
{{- end }}
{{- end }}

# =============================================================================
# END OF HELPER TEMPLATES
# =============================================================================