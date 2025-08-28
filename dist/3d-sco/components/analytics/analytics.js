"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAnalytics = GoogleAnalytics;
exports.GoogleTagManager = GoogleTagManager;
exports.FacebookPixel = FacebookPixel;
exports.useAnalytics = useAnalytics;
exports.usePerformanceMonitoring = usePerformanceMonitoring;
exports.useErrorTracking = useErrorTracking;
exports.AnalyticsProvider = AnalyticsProvider;
const react_1 = require("react");
const script_1 = __importDefault(require("next/script"));
// Google Analytics
function GoogleAnalytics({ gaId }) {
    return (<>
      <script_1.default src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/>
      <script_1.default id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </script_1.default>
    </>);
}
// Google Tag Manager
function GoogleTagManager({ gtmId }) {
    return (<>
      <script_1.default id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </script_1.default>
      <noscript>
        <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}/>
      </noscript>
    </>);
}
// Facebook Pixel
function FacebookPixel({ pixelId }) {
    (0, react_1.useEffect)(() => {
        // Simple Facebook Pixel implementation without external dependency
        if (typeof window !== 'undefined') {
            // Initialize Facebook Pixel
            window.fbq = window.fbq || function () {
                (window.fbq.q = window.fbq.q || []).push(arguments);
            };
            if (!window._fbq) {
                window._fbq = window.fbq;
                window.fbq.push = window.fbq;
                window.fbq.loaded = true;
                window.fbq.version = '2.0';
                window.fbq.queue = [];
                const script = document.createElement('script');
                script.async = true;
                script.src = 'https://connect.facebook.net/en_US/fbevents.js';
                document.head.appendChild(script);
            }
            window.fbq('init', pixelId);
            window.fbq('track', 'PageView');
        }
    }, [pixelId]);
    return null;
}
// Custom Analytics Hook
function useAnalytics() {
    const trackEvent = (eventName, parameters) => {
        // Google Analytics 4
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', eventName, parameters);
        }
        // Facebook Pixel
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', eventName, parameters);
        }
        // Custom analytics (you can add your own tracking service here)
        console.log('Analytics Event:', eventName, parameters);
    };
    const trackPageView = (url) => {
        // Google Analytics
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
                page_path: url,
            });
        }
        // Facebook Pixel
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'PageView');
        }
    };
    const trackConversion = (conversionName, value) => {
        trackEvent('conversion', {
            event_category: 'engagement',
            event_label: conversionName,
            value: value,
        });
    };
    const trackUserEngagement = (action, category = 'engagement') => {
        trackEvent('user_engagement', {
            event_category: category,
            event_label: action,
        });
    };
    return {
        trackEvent,
        trackPageView,
        trackConversion,
        trackUserEngagement,
    };
}
// Performance Monitoring
function usePerformanceMonitoring() {
    (0, react_1.useEffect)(() => {
        // Web Vitals monitoring
        if (typeof window !== 'undefined') {
            Promise.resolve().then(() => __importStar(require('web-vitals'))).then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
                onCLS(console.log);
                onFID(console.log);
                onFCP(console.log);
                onLCP(console.log);
                onTTFB(console.log);
            });
        }
        // Custom performance monitoring
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'navigation') {
                    const navigationEntry = entry;
                    console.log('Navigation Timing:', {
                        dns: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
                        tcp: navigationEntry.connectEnd - navigationEntry.connectStart,
                        request: navigationEntry.responseStart - navigationEntry.requestStart,
                        response: navigationEntry.responseEnd - navigationEntry.responseStart,
                        dom: navigationEntry.domContentLoadedEventEnd - navigationEntry.responseEnd,
                        load: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
                    });
                }
                if (entry.entryType === 'resource') {
                    const resourceEntry = entry;
                    if (resourceEntry.duration > 1000) { // Log slow resources
                        console.warn('Slow Resource:', {
                            name: resourceEntry.name,
                            duration: resourceEntry.duration,
                            size: resourceEntry.transferSize,
                        });
                    }
                }
            }
        });
        observer.observe({ entryTypes: ['navigation', 'resource'] });
        return () => observer.disconnect();
    }, []);
}
// Error Tracking
function useErrorTracking() {
    (0, react_1.useEffect)(() => {
        const handleError = (event) => {
            console.error('JavaScript Error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
            });
            // Track error in analytics
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'exception', {
                    description: event.message,
                    fatal: false,
                });
            }
        };
        const handleUnhandledRejection = (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            // Track error in analytics
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'exception', {
                    description: `Unhandled Promise: ${event.reason}`,
                    fatal: false,
                });
            }
        };
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);
}
function AnalyticsProvider({ children, gaId, gtmId, pixelId }) {
    usePerformanceMonitoring();
    useErrorTracking();
    return (<>
      {gaId && <GoogleAnalytics gaId={gaId}/>}
      {gtmId && <GoogleTagManager gtmId={gtmId}/>}
      {pixelId && <FacebookPixel pixelId={pixelId}/>}
      {children}
    </>);
}
exports.default = AnalyticsProvider;
//# sourceMappingURL=analytics.js.map