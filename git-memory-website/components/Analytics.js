import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Google Analytics tracking ID
const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Custom hook for tracking page views
export const useAnalytics = () => {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      pageview(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);
};

// Analytics component for tracking specific events
const Analytics = () => {
  useAnalytics();
  return null;
};

export default Analytics;

// Event tracking functions for common actions
export const trackButtonClick = (buttonName, location) => {
  event({
    action: 'click',
    category: 'Button',
    label: `${buttonName} - ${location}`,
  });
};

export const trackPricingView = (tier) => {
  event({
    action: 'view',
    category: 'Pricing',
    label: tier,
  });
};

export const trackFeatureInteraction = (feature) => {
  event({
    action: 'interact',
    category: 'Feature',
    label: feature,
  });
};

export const trackDownload = (downloadType) => {
  event({
    action: 'download',
    category: 'Resource',
    label: downloadType,
  });
};

export const trackFormSubmission = (formName) => {
  event({
    action: 'submit',
    category: 'Form',
    label: formName,
  });
};