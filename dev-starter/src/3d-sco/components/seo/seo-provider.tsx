'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { SEOConfig, generateMetadata } from '@/lib/seo/meta-tags';
import { useSEOState, SEOAnalytics } from '@/lib/seo/utils';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface SEOContextType {
  seoConfig: SEOConfig;
  analytics: SEOAnalytics | null;
  isLoading: boolean;
  error: string | null;
  updateSEO: (config: Partial<SEOConfig>) => void;
  optimizeContent: (content: string) => Promise<void>;
  runAudit: () => Promise<void>;
  trackPageView: (url: string) => void;
}

const SEOContext = createContext<SEOContextType | undefined>(undefined);

interface SEOState {
  seoConfig: SEOConfig;
  analytics: SEOAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

type SEOAction =
  | { type: 'SET_CONFIG'; payload: SEOConfig }
  | { type: 'UPDATE_CONFIG'; payload: Partial<SEOConfig> }
  | { type: 'SET_ANALYTICS'; payload: SEOAnalytics }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: SEOState = {
  seoConfig: {
    title: '',
    description: '',
    keywords: [],
    author: '',
    siteUrl: '',
    siteName: '',
    locale: 'en',
    type: 'website',
    image: '',
    twitterHandle: '',
    facebookAppId: '',
  },
  analytics: null,
  isLoading: false,
  error: null,
};

function seoReducer(state: SEOState, action: SEOAction): SEOState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, seoConfig: action.payload };
    case 'UPDATE_CONFIG':
      return { 
        ...state, 
        seoConfig: { ...state.seoConfig, ...action.payload } 
      };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface SEOProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<SEOConfig>;
}

export function SEOProvider({ children, initialConfig }: SEOProviderProps) {
  const [state, dispatch] = useReducer(seoReducer, {
    ...initialState,
    seoConfig: { ...initialState.seoConfig, ...initialConfig },
  });
  
  const router = useRouter();
  const { i18n } = useTranslation();
  const { seoConfig: hookConfig, updateSEO: hookUpdateSEO } = useSEOState();

  // Sync with hook state
  useEffect(() => {
    if (hookConfig) {
      dispatch({ type: 'SET_CONFIG', payload: hookConfig });
    }
  }, [hookConfig]);

  // Update locale when language changes
  useEffect(() => {
    dispatch({ 
      type: 'UPDATE_CONFIG', 
      payload: { locale: i18n.language } 
    });
  }, [i18n.language]);

  const updateSEO = (config: Partial<SEOConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: config });
    hookUpdateSEO(config);
  };

  const optimizeContent = async (content: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      // Extract keywords from content
      const words = content.toLowerCase().match(/\b\w+\b/g) || [];
      const wordCount = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Get top keywords
      const keywords = Object.entries(wordCount)
        .filter(([word]) => word.length > 3)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
      
      // Generate optimized title and description
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const title = sentences[0]?.trim().substring(0, 60) || '';
      const description = content.substring(0, 160).trim();
      
      updateSEO({
        title,
        description,
        keywords,
      });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Optimization failed' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const runAudit = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      // Simulate SEO audit
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      if (!state.seoConfig.title || state.seoConfig.title.length < 30) {
        issues.push('Title is too short (should be 30-60 characters)');
        recommendations.push('Add a descriptive title with target keywords');
      }
      
      if (!state.seoConfig.description || state.seoConfig.description.length < 120) {
        issues.push('Meta description is too short (should be 120-160 characters)');
        recommendations.push('Write a compelling meta description');
      }
      
      if (!state.seoConfig.keywords || state.seoConfig.keywords.length === 0) {
        issues.push('No keywords defined');
        recommendations.push('Add relevant keywords for better search visibility');
      }
      
      const score = Math.max(0, 100 - (issues.length * 20));
      
      const analytics: SEOAnalytics = {
        pageViews: Math.floor(Math.random() * 10000),
        searchClicks: Math.floor(Math.random() * 1000),
        searchImpressions: Math.floor(Math.random() * 5000),
        clickThroughRate: Math.random() * 10,
        averagePosition: Math.random() * 20 + 1,
        bounceRate: Math.random() * 100,
        organicTraffic: Math.floor(Math.random() * 5000),
        topKeywords: state.seoConfig.keywords?.slice(0, 5) || [],
        seoScore: score,
        issues,
        recommendations,
      };
      
      dispatch({ type: 'SET_ANALYTICS', payload: analytics });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Audit failed' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const trackPageView = (url: string) => {
    // Track page view for analytics
    if (typeof window !== 'undefined') {
      // Send to analytics service
      console.log('Page view tracked:', url);
    }
  };

  const contextValue: SEOContextType = {
    seoConfig: state.seoConfig,
    analytics: state.analytics,
    isLoading: state.isLoading,
    error: state.error,
    updateSEO,
    optimizeContent,
    runAudit,
    trackPageView,
  };

  return (
    <SEOContext.Provider value={contextValue}>
      {children}
    </SEOContext.Provider>
  );
}

export function useSEO() {
  const context = useContext(SEOContext);
  if (context === undefined) {
    throw new Error('useSEO must be used within a SEOProvider');
  }
  return context;
}

// Hook for tracking route changes
export function useSEORouteTracking() {
  const { trackPageView, updateSEO } = useSEO();
  const router = useRouter();
  
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      trackPageView(url);
      
      // Update canonical URL
      updateSEO({ 
        canonicalUrl: `${window.location.origin}${url}` 
      });
    };
    
    // Track initial page load
    if (typeof window !== 'undefined') {
      handleRouteChange(window.location.pathname);
    }
    
    // Note: Next.js 13+ App Router doesn't have router events
    // You might need to implement route tracking differently
    
  }, [trackPageView, updateSEO]);
}