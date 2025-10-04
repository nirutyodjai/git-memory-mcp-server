/**
 * Enhanced Styles for Git Memory Admin Dashboard
 */

const enhancedStyles = `
/* Advanced Dashboard Styles */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  --warning-gradient: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  --danger-gradient: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  --dark-gradient: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f0f23;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(120, 198, 255, 0.2) 0%, transparent 50%);
  min-height: 100vh;
  color: #e4e4e7;
  line-height: 1.6;
}

/* Animated Background */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.floating-element {
  animation: float 6s ease-in-out infinite;
}

/* Glassmorphism Container */
.glass-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Enhanced Header */
.dashboard-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.dashboard-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.dashboard-header:hover::before {
  transform: translateX(100%);
}

.dashboard-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #fff 0%, #a8a8ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(168, 168, 255, 0.5);
}

/* Enhanced Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--primary-gradient);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}

.stat-card:hover::before {
  transform: scaleX(1);
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 20px;
  background: var(--primary-gradient);
}

.stat-value {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #fff 0%, #a8a8ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  font-weight: 500;
}

.stat-trend {
  margin-top: 16px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.trend-up {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.trend-down {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

/* Enhanced Controls */
.controls-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 40px;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.control-group {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.control-group:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.control-label {
  font-weight: 600;
  margin-bottom: 12px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-input {
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  transition: all 0.3s ease;
}

.control-input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.control-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* Enhanced Buttons */
.button-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.btn-primary {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.btn-danger {
  background: var(--danger-gradient);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
}

.btn-danger:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(244, 67, 54, 0.4);
}

/* Enhanced Charts */
.chart-container {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.chart-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--success-gradient);
}

.chart-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: #fff;
  text-align: center;
}

/* Enhanced Logs */
.logs-section {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.logs-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
}

.logs-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.logs-container {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 13px;
  color: #e4e4e7;
  max-height: 500px;
  overflow-y: auto;
  line-height: 1.5;
}

.log-entry {
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.log-entry:hover {
  background: rgba(255, 255, 255, 0.05);
}

.log-timestamp {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
}

.log-level {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.log-info {
  background: rgba(79, 195, 247, 0.2);
  color: #4fc3f7;
}

.log-warn {
  background: rgba(255, 181, 77, 0.2);
  color: #ffb74d;
}

.log-error {
  background: rgba(244, 143, 177, 0.2);
  color: #f48fb1;
}

.log-debug {
  background: rgba(129, 199, 132, 0.2);
  color: #81c784;
}

/* Status Indicators */
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-healthy {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.status-warning {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.status-error {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); }
}

.pulse {
  animation: pulse 2s infinite;
}

.glow {
  animation: glow 2s infinite;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .control-grid {
    grid-template-columns: 1fr;
  }

  .button-grid {
    flex-direction: column;
  }

  .logs-controls {
    flex-direction: column;
    gap: 8px;
  }
}

/* Loading States */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Tooltips */
.tooltip {
  position: relative;
  cursor: help;
}

.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1000;
}

.tooltip:hover::after {
  opacity: 1;
}

/* Progress Bars */
.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--primary-gradient);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Badge System */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-success {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.badge-warning {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.badge-danger {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.badge-info {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
}

/* Dark Mode Optimizations */
@media (prefers-color-scheme: dark) {
  body {
    background: #0a0a0f;
  }
}

/* Accessibility Improvements */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus Styles for Accessibility */
.btn:focus,
.control-input:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* Print Styles */
@media print {
  body {
    background: white;
    color: black;
  }

  .glass-container,
  .stat-card,
  .controls-panel {
    background: white !important;
    box-shadow: none !important;
    border: 1px solid #ccc !important;
  }
}
`;

// Inject styles into the HTML
export function injectEnhancedStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = enhancedStyles;
  document.head.appendChild(styleElement);
}
