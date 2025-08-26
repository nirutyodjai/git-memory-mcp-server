import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

// Performance optimization: Preload critical resources
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Optimize rendering with concurrent features
const root = createRoot(document.getElementById('root')!, {
  // Enable concurrent features for better performance
  identifierPrefix: 'awesome-ui-'
});

root.render(
  <StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log errors in production (you can integrate with error tracking services)
        if (process.env.NODE_ENV === 'production') {
          console.error('Application Error:', error, errorInfo);
          // Example: Send to error tracking service
          // errorTrackingService.captureException(error, { extra: errorInfo });
        }
      }}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
