/**
 * NEXUS IDE Security Dashboard - Charts & Data Visualization
 * Advanced charting system with real-time updates
 */

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#333',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#666'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#666'
                    }
                }
            }
        };
    }

    /**
     * Create threat level chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     */
    createThreatLevelChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const chartData = {
            labels: ['Low', 'Medium', 'High', 'Critical'],
            datasets: [{
                data: [data.low || 0, data.medium || 0, data.high || 0, data.critical || 0],
                backgroundColor: [
                    '#28a745',
                    '#ffc107',
                    '#fd7e14',
                    '#dc3545'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        const options = {
            ...this.defaultOptions,
            plugins: {
                ...this.defaultOptions.plugins,
                legend: {
                    ...this.defaultOptions.plugins.legend,
                    display: true
                }
            }
        };

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: options
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Create security events timeline chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} events - Security events data
     */
    createSecurityEventsChart(canvasId, events) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        // Process events data for timeline
        const timelineData = this.processTimelineData(events);

        const chartData = {
            labels: timelineData.labels,
            datasets: [
                {
                    label: 'Security Events',
                    data: timelineData.events,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Threats Blocked',
                    data: timelineData.blocked,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };

        const options = {
            ...this.defaultOptions,
            scales: {
                ...this.defaultOptions.scales,
                y: {
                    ...this.defaultOptions.scales.y,
                    beginAtZero: true
                }
            }
        };

        const chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Create system performance chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} performanceData - Performance metrics
     */
    createPerformanceChart(canvasId, performanceData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const chartData = {
            labels: performanceData.labels || [],
            datasets: [
                {
                    label: 'CPU Usage (%)',
                    data: performanceData.cpu || [],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Memory Usage (%)',
                    data: performanceData.memory || [],
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Network I/O (MB/s)',
                    data: performanceData.network || [],
                    borderColor: '#17a2b8',
                    backgroundColor: 'rgba(23, 162, 184, 0.1)',
                    yAxisID: 'y1'
                }
            ]
        };

        const options = {
            ...this.defaultOptions,
            scales: {
                x: this.defaultOptions.scales.x,
                y: {
                    ...this.defaultOptions.scales.y,
                    type: 'linear',
                    display: true,
                    position: 'left',
                    max: 100
                },
                y1: {
                    ...this.defaultOptions.scales.y,
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        };

        const chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Create compliance status chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} complianceData - Compliance data
     */
    createComplianceChart(canvasId, complianceData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const frameworks = Object.keys(complianceData);
        const scores = frameworks.map(framework => complianceData[framework].score || 0);
        const colors = frameworks.map(framework => {
            const score = complianceData[framework].score || 0;
            if (score >= 90) return '#28a745';
            if (score >= 70) return '#ffc107';
            if (score >= 50) return '#fd7e14';
            return '#dc3545';
        });

        const chartData = {
            labels: frameworks,
            datasets: [{
                label: 'Compliance Score (%)',
                data: scores,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }]
        };

        const options = {
            ...this.defaultOptions,
            scales: {
                ...this.defaultOptions.scales,
                y: {
                    ...this.defaultOptions.scales.y,
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                ...this.defaultOptions.plugins,
                legend: {
                    display: false
                }
            }
        };

        const chart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: options
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Create vulnerability distribution chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} vulnerabilityData - Vulnerability data
     */
    createVulnerabilityChart(canvasId, vulnerabilityData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const chartData = {
            labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
            datasets: [{
                data: [
                    vulnerabilityData.critical || 0,
                    vulnerabilityData.high || 0,
                    vulnerabilityData.medium || 0,
                    vulnerabilityData.low || 0,
                    vulnerabilityData.info || 0
                ],
                backgroundColor: [
                    '#dc3545',
                    '#fd7e14',
                    '#ffc107',
                    '#28a745',
                    '#17a2b8'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        const options = {
            ...this.defaultOptions,
            plugins: {
                ...this.defaultOptions.plugins,
                legend: {
                    ...this.defaultOptions.plugins.legend,
                    display: true,
                    position: 'right'
                }
            }
        };

        const chart = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: options
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Create network traffic chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} trafficData - Network traffic data
     */
    createNetworkTrafficChart(canvasId, trafficData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const chartData = {
            labels: trafficData.labels || [],
            datasets: [
                {
                    label: 'Inbound (MB)',
                    data: trafficData.inbound || [],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    fill: true
                },
                {
                    label: 'Outbound (MB)',
                    data: trafficData.outbound || [],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    fill: true
                }
            ]
        };

        const options = {
            ...this.defaultOptions,
            scales: {
                ...this.defaultOptions.scales,
                y: {
                    ...this.defaultOptions.scales.y,
                    beginAtZero: true
                }
            }
        };

        const chart = new Chart(ctx, {
            type: 'area',
            data: chartData,
            options: options
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Create real-time monitoring chart
     * @param {string} canvasId - Canvas element ID
     * @param {number} maxDataPoints - Maximum data points to display
     */
    createRealTimeChart(canvasId, maxDataPoints = 50) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const chartData = {
            labels: [],
            datasets: [
                {
                    label: 'Active Connections',
                    data: [],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Requests/sec',
                    data: [],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };

        const options = {
            ...this.defaultOptions,
            animation: {
                duration: 0
            },
            scales: {
                ...this.defaultOptions.scales,
                x: {
                    ...this.defaultOptions.scales.x,
                    display: false
                },
                y: {
                    ...this.defaultOptions.scales.y,
                    beginAtZero: true
                }
            }
        };

        const chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });

        // Store max data points for real-time updates
        chart.maxDataPoints = maxDataPoints;
        
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Update chart data
     * @param {string} chartId - Chart ID
     * @param {Object} newData - New data
     */
    updateChart(chartId, newData) {
        const chart = this.charts.get(chartId);
        if (!chart) return;

        if (newData.labels) {
            chart.data.labels = newData.labels;
        }

        if (newData.datasets) {
            newData.datasets.forEach((dataset, index) => {
                if (chart.data.datasets[index]) {
                    chart.data.datasets[index].data = dataset.data;
                }
            });
        }

        chart.update('none');
    }

    /**
     * Add real-time data point
     * @param {string} chartId - Chart ID
     * @param {Object} dataPoint - New data point
     */
    addRealTimeData(chartId, dataPoint) {
        const chart = this.charts.get(chartId);
        if (!chart) return;

        const now = new Date().toLocaleTimeString();
        
        // Add new data point
        chart.data.labels.push(now);
        chart.data.datasets.forEach((dataset, index) => {
            dataset.data.push(dataPoint.values[index] || 0);
        });

        // Remove old data points if exceeding max
        if (chart.data.labels.length > chart.maxDataPoints) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }

        chart.update('none');
    }

    /**
     * Process timeline data for charts
     * @param {Array} events - Raw events data
     * @returns {Object} Processed timeline data
     */
    processTimelineData(events) {
        const now = new Date();
        const labels = [];
        const eventsCount = [];
        const blockedCount = [];

        // Generate last 24 hours in hourly intervals
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
            labels.push(time.getHours() + ':00');
            
            // Count events in this hour
            const hourEvents = events.filter(event => {
                const eventTime = new Date(event.timestamp);
                return eventTime.getHours() === time.getHours() &&
                       eventTime.getDate() === time.getDate();
            });
            
            eventsCount.push(hourEvents.length);
            blockedCount.push(hourEvents.filter(e => e.action === 'blocked').length);
        }

        return { labels, events: eventsCount, blocked: blockedCount };
    }

    /**
     * Destroy chart
     * @param {string} chartId - Chart ID
     */
    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
        }
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        this.charts.forEach((chart, id) => {
            chart.destroy();
        });
        this.charts.clear();
    }

    /**
     * Resize all charts
     */
    resizeAllCharts() {
        this.charts.forEach(chart => {
            chart.resize();
        });
    }

    /**
     * Get chart instance
     * @param {string} chartId - Chart ID
     * @returns {Chart} Chart instance
     */
    getChart(chartId) {
        return this.charts.get(chartId);
    }

    /**
     * Export chart as image
     * @param {string} chartId - Chart ID
     * @param {string} format - Image format (png, jpeg)
     * @returns {string} Base64 image data
     */
    exportChart(chartId, format = 'png') {
        const chart = this.charts.get(chartId);
        if (!chart) return null;

        return chart.toBase64Image(format, 1.0);
    }
}

// Initialize global chart manager
window.chartManager = new ChartManager();

// Handle window resize
window.addEventListener('resize', SecurityUtils.debounce(() => {
    window.chartManager.resizeAllCharts();
}, 250));

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartManager };
}