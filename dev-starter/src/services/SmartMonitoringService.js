const EventEmitter = require('events');

class SmartMonitoringService extends EventEmitter {
  constructor(metrics) {
    super();
    this.metrics = metrics;
    this.thresholds = {
      highLatency: 1000, // ms
      highErrorRate: 0.1, // 10%
      lowUpstreamAvailability: 0.5, // 50%
    };
  }

  checkMetrics() {
    // High latency
    if (this.metrics.latency.avg > this.thresholds.highLatency) {
      this.emit('alert', {
        type: 'high-latency',
        message: `Average latency is ${this.metrics.latency.avg}ms, exceeding the threshold of ${this.thresholds.highLatency}ms.`,
        details: this.metrics.latency,
      });
    }

    // High error rate
    const errorRate = this.metrics.requests.error / this.metrics.requests.total;
    if (errorRate > this.thresholds.highErrorRate) {
      this.emit('alert', {
        type: 'high-error-rate',
        message: `Error rate is ${errorRate * 100}%, exceeding the threshold of ${this.thresholds.highErrorRate * 100}%.`,
        details: this.metrics.requests,
      });
    }

    // Low upstream availability
    const healthyUpstreams = Array.from(this.metrics.upstreams.values()).filter(u => u.health === 'healthy').length;
    const upstreamAvailability = healthyUpstreams / this.metrics.upstreams.size;
    if (upstreamAvailability < this.thresholds.lowUpstreamAvailability) {
      this.emit('alert', {
        type: 'low-upstream-availability',
        message: `Upstream availability is ${upstreamAvailability * 100}%, below the threshold of ${this.thresholds.lowUpstreamAvailability * 100}%.`,
        details: { ...this.metrics.upstreams },
      });
    }
  }

  start() {
    setInterval(() => {
      this.checkMetrics();
    }, 60000); // Run every minute

    this.on('alert', (alert) => {
      console.log(`🚨 Smart Monitoring Alert: ${alert.message}`);
      // In a real implementation, you would send notifications (email, Slack, etc.)
    });
  }
}

module.exports = SmartMonitoringService;