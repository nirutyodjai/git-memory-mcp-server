'use client';

import { useEffect } from 'react';
import Script from 'next/script';

// Google Analytics
export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  );
}

// Google Tag Manager
export function GoogleTagManager({ gtmId }: { gtmId: string }) {
  return (
    <>
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}

// Facebook Pixel
export function FacebookPixel({ pixelId }: { pixelId: string }) {
  useEffect(() => {
    // Simple Facebook Pixel implementation without external dependency
    if (typeof window !== 'undefined') {
      // Initialize Facebook Pixel
      (window as any).fbq = (window as any).fbq || function() {
        ((window as any).fbq.q = (window as any).fbq.q || []).push(arguments);
      };
      
      if (!(window as any)._fbq) {
        (window as any)._fbq = (window as any).fbq;
        (window as any).fbq.push = (window as any).fbq;
        (window as any).fbq.loaded = true;
        (window as any).fbq.version = '2.0';
        (window as any).fbq.queue = [];
        
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        document.head.appendChild(script);
      }
      
      (window as any).fbq('init', pixelId);
      (window as any).fbq('track', 'PageView');
    }
  }, [pixelId]);

  return null;
}

// Custom Analytics Hook
export function useAnalytics() {
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, parameters);
    }

    // Custom analytics (you can add your own tracking service here)
    console.log('Analytics Event:', eventName, parameters);
  };

  const trackPageView = (url: string) => {
    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: url,
      });
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }
  };

  const trackConversion = (conversionName: string, value?: number) => {
    trackEvent('conversion', {
      event_category: 'engagement',
      event_label: conversionName,
      value: value,
    });
  };

  const trackUserEngagement = (action: string, category: string = 'engagement') => {
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
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Web Vitals monitoring
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
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
          const navigationEntry = entry as PerformanceNavigationTiming;
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
          const resourceEntry = entry as PerformanceResourceTiming;
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
export function useErrorTracking() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });

      // Track error in analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: event.message,
          fatal: false,
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);

      // Track error in analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
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

// Analytics Provider Component
interface AnalyticsProviderProps {
  children: React.ReactNode;
  gaId?: string;
  gtmId?: string;
  pixelId?: string;
}

export function AnalyticsProvider({ 
  children, 
  gaId, 
  gtmId, 
  pixelId 
}: AnalyticsProviderProps) {
  usePerformanceMonitoring();
  useErrorTracking();

  return (
    <>
      {gaId && <GoogleAnalytics gaId={gaId} />}
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {pixelId && <FacebookPixel pixelId={pixelId} />}
      {children}
    </>
  );
}

export default AnalyticsProvider;