import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './App.css';

// Initialize the Universal Plugin System
import { universalPluginSystem } from './lib/universalPluginSystem';
import { mcpErrorHandler, LogLevel } from './lib/mcpErrorHandler';

// Global error handling
window.addEventListener('error', (event) => {
  mcpErrorHandler.handleError(event.error, 'Global error handler');
});

window.addEventListener('unhandledrejection', (event) => {
  mcpErrorHandler.handlePromiseRejection(event.reason, 'Global promise rejection handler');
});

// Initialize the plugin system
universalPluginSystem.initialize().then(() => {
  mcpErrorHandler.log(LogLevel.INFO, 'Universal Plugin System initialized successfully');
}).catch((error) => {
  mcpErrorHandler.log(LogLevel.ERROR, 'Failed to initialize Universal Plugin System', { error });
});

// Render the app
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log app startup
mcpErrorHandler.log(LogLevel.INFO, 'Git Memory MCP Server React App started');

// Development hot reload support
if (process.env.NODE_ENV === 'development' && (module as any).hot) {
  (module as any).hot.accept();
}