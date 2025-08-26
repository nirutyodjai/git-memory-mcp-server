import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { pageview } from '../lib/gtag';
import FeedbackWidget from '../components/FeedbackWidget';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      pageview(url);
    };

    // Track page views on route change
    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Track initial page load
    pageview(router.asPath);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, router.asPath]);

  // Track user engagement time
  useEffect(() => {
    let startTime = Date.now();
    
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent > 10) { // Only track if user spent more than 10 seconds
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'page_engagement', {
            event_category: 'engagement',
            event_label: router.pathname,
            value: timeSpent,
          });
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      } else {
        startTime = Date.now(); // Reset timer when page becomes visible again
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router.pathname]);

  return (
    <main className={inter.className}>
      <Component {...pageProps} />
      {/* Only show feedback widget on non-admin pages */}
      {!router.pathname.startsWith('/admin') && <FeedbackWidget />}
    </main>
  );
}