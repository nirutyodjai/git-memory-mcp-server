# Monitoring & Alerting Guide

## Overview

Git Memory MCP Server มีระบบ monitoring และ metrics collection ที่ครบครอบคลุม เพื่อช่วยในการติดตามสุขภาพของระบบและประสิทธิภาพการทำงาน

## Metrics Collection

### Built-in Metrics

Server เก็บ metrics ต่อไปนี้:

1. **Connection Metrics**
   - `active_connections` - จำนวน WebSocket connections ที่ active
   - `total_connections` - จำนวน connections ทั้งหมดตั้งแต่เริ่มต้น
   - `connection_errors` - จำนวน connection errors

2. **Tool Execution Metrics**
   - `tool_calls_total{tool="<tool_name>"}` - จำนวนครั้งที่เรียกใช้แต่ละ tool
   - `tool_duration_ms{tool="<tool_name>"}` - เวลาที่ใช้ในการ execute (milliseconds)
   - `tool_errors_total{tool="<tool_name>"}` - จำนวน errors ของแต่ละ tool

3. **HTTP Endpoint Metrics**
   - `http_git_status_cli_duration` - เวลาที่ใช้สำหรับ `/git/status`
   - `http_git_fetch_cli_duration` - เวลาที่ใช้สำหรับ `/git/fetch`
   - `http_git_rebase_cli_duration` - เวลาที่ใช้สำหรับ `/git/rebase`
   - `http_git_*_errors` - จำนวน errors ของแต่ละ endpoint

4. **System Metrics**
   - `memory_usage_bytes` - การใช้งาน memory
   - `cpu_usage_percent` - การใช้งาน CPU
   - `uptime_seconds` - เวลาที่ server ทำงาน

### Accessing Metrics

#### Prometheus Format
```bash
curl http://localhost:3000/metrics
```

ตัวอย่าง output:
```
# HELP active_connections Number of active WebSocket connections
# TYPE active_connections gauge
active_connections 42

# HELP tool_calls_total Total number of tool calls
# TYPE tool_calls_total counter
tool_calls_total{tool="git_status_cli"} 150
tool_calls_total{tool="git_fetch_cli"} 75

# HELP tool_duration_ms Tool execution duration in milliseconds
# TYPE tool_duration_ms histogram
tool_duration_ms{tool="git_status_cli",le="100"} 120
tool_duration_ms{tool="git_status_cli",le="500"} 145
```

## Health Checks

### Health Endpoint

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T00:47:00.000Z",
  "uptime": 3600,
  "connections": {
    "active": 42,
    "total": 1250
  },
  "memory": {
    "used": 256000000,
    "total": 8589934592,
    "percentage": 2.98
  },
  "services": {
    "redis": "connected",
    "database": "healthy"
  }
}
```

### Health Check Criteria

Server ถือว่า "healthy" เมื่อ:
- ✅ Memory usage < 90%
- ✅ Active connections < max allowed
- ✅ No critical errors in last 5 minutes
- ✅ All required services are connected

## Prometheus Integration

### 1. Install Prometheus

```bash
# Download Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-2.45.0.linux-amd64.tar.gz
cd prometheus-2.45.0.linux-amd64
```

### 2. Configure Prometheus

สร้างไฟล์ `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'git-memory-mcp-server'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

### 3. Start Prometheus

```bash
./prometheus --config.file=prometheus.yml
```

เข้าถึง Prometheus UI ที่: http://localhost:9090

### 4. Example Queries

```promql
# Average tool execution time (last 5 minutes)
rate(tool_duration_ms_sum[5m]) / rate(tool_duration_ms_count[5m])

# Error rate per tool
rate(tool_errors_total[5m])

# Active connections over time
active_connections

# Memory usage percentage
(memory_usage_bytes / memory_total_bytes) * 100
```

## Grafana Dashboard

### 1. Install Grafana

```bash
# Ubuntu/Debian
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana
```

### 2. Start Grafana

```bash
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

เข้าถึง Grafana UI ที่: http://localhost:3000 (default: admin/admin)

### 3. Add Prometheus Data Source

1. ไปที่ Configuration > Data Sources
2. เลือก "Add data source"
3. เลือก "Prometheus"
4. ตั้งค่า URL: `http://localhost:9090`
5. คลิก "Save & Test"

### 4. Import Dashboard

สร้าง dashboard ใหม่ด้วย panels ต่อไปนี้:

#### Panel 1: Active Connections
```promql
active_connections
```

#### Panel 2: Request Rate
```promql
rate(tool_calls_total[5m])
```

#### Panel 3: Error Rate
```promql
rate(tool_errors_total[5m])
```

#### Panel 4: Average Response Time
```promql
rate(tool_duration_ms_sum[5m]) / rate(tool_duration_ms_count[5m])
```

#### Panel 5: Memory Usage
```promql
memory_usage_bytes
```

## Alerting

### Prometheus Alerting Rules

สร้างไฟล์ `alerts.yml`:

```yaml
groups:
  - name: git_memory_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(tool_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (memory_usage_bytes / memory_total_bytes) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}%"

      # Too many connections
      - alert: TooManyConnections
        expr: active_connections > 2800
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Connection limit approaching"
          description: "Active connections: {{ $value }}"

      # Slow response time
      - alert: SlowResponseTime
        expr: rate(tool_duration_ms_sum[5m]) / rate(tool_duration_ms_count[5m]) > 5000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time detected"
          description: "Average response time is {{ $value }}ms"

      # Service down
      - alert: ServiceDown
        expr: up{job="git-memory-mcp-server"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Git Memory MCP Server is down"
          description: "The server has been down for more than 1 minute"
```

### Configure Alertmanager

สร้างไฟล์ `alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'email-notifications'

receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'ops-team@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alertmanager@example.com'
        auth_password: 'your-password'
        headers:
          Subject: '[ALERT] Git Memory MCP Server'

  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        title: 'Git Memory MCP Server Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### Start Alertmanager

```bash
./alertmanager --config.file=alertmanager.yml
```

## Logging

### Log Files

- `logs/error.log` - Error-level logs เท่านั้น
- `logs/combined.log` - ทุก log levels
- Console output - Formatted และ colorized สำหรับ development

### Log Levels

```bash
# ตั้งค่า log level ผ่าน environment variable
LOG_LEVEL=debug npm start  # debug, info, warn, error
```

### Log Format

```json
{
  "level": "info",
  "message": "Git status CLI executed successfully",
  "timestamp": "2025-10-05T00:47:00.000Z",
  "metadata": {
    "repoPath": "/path/to/repo",
    "duration": 245,
    "tool": "git_status_cli"
  }
}
```

### Viewing Logs

```bash
# Real-time monitoring
tail -f logs/combined.log

# Filter errors only
tail -f logs/error.log

# Search for specific patterns
grep "git_status_cli" logs/combined.log

# View last 100 lines
tail -n 100 logs/combined.log
```

## Performance Monitoring

### Key Metrics to Monitor

1. **Response Time**
   - Target: < 500ms for most operations
   - Alert: > 2000ms

2. **Error Rate**
   - Target: < 0.1%
   - Alert: > 1%

3. **Memory Usage**
   - Target: < 70%
   - Alert: > 90%

4. **Connection Count**
   - Target: < 2500
   - Alert: > 2800

5. **CPU Usage**
   - Target: < 70%
   - Alert: > 90%

### Monitoring Checklist

- [ ] Prometheus scraping metrics every 10-15 seconds
- [ ] Grafana dashboard displaying key metrics
- [ ] Alert rules configured for critical thresholds
- [ ] Alertmanager sending notifications
- [ ] Log rotation configured
- [ ] Health check endpoint responding
- [ ] Metrics endpoint accessible

## Troubleshooting

### High Memory Usage

```bash
# Check memory usage
node --max-old-space-size=8192 src/server.js

# Monitor with htop
htop -p $(pgrep -f "node.*server.js")
```

### High Error Rate

```bash
# Check error logs
tail -f logs/error.log | grep -i "error"

# Check specific tool errors
curl http://localhost:3000/metrics | grep tool_errors
```

### Slow Response Time

```bash
# Check tool durations
curl http://localhost:3000/metrics | grep duration

# Enable debug logging
LOG_LEVEL=debug npm start
```

## Best Practices

1. **Set up alerts** สำหรับ critical metrics
2. **Review metrics daily** เพื่อหา trends
3. **Keep logs** อย่างน้อย 30 วัน
4. **Monitor disk space** สำหรับ logs
5. **Test alerts** เป็นประจำ
6. **Document incidents** และ resolutions
7. **Review dashboards** กับทีมเป็นประจำ
8. **Update thresholds** ตาม usage patterns

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/)
