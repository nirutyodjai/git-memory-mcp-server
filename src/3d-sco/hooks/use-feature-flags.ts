'use client';

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface FeatureFlags {
  [key: string]: boolean;
}

interface ABTests {
  [key: string]: {
    variant: string;
    config: Record<string, any>;
  };
}

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  tests: ABTests;
  isLoading: boolean;
  error: string | null;
  isEnabled: (flagName: string) => boolean;
  getVariant: (testName: string) => string | null;
  getTestConfig: (testName: string) => Record<string, any> | null;
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function FeatureFlagsProvider({ children, userId }: FeatureFlagsProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>({});
  const [tests, setTests] = useState<ABTests>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Use provided userId or fallback to authenticated user
  const effectiveUserId = userId || user?.id || `anonymous_${Date.now()}`;

  const fetchFeatureFlags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        userId: effectiveUserId,
        type: 'all'
      });
      
      const response = await fetch(`/api/feature-flags?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setFlags(data.flags || {});
      setTests(data.tests || {});
      
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feature flags');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  const isEnabled = useCallback((flagName: string): boolean => {
    return flags[flagName] === true;
  }, [flags]);

  const getVariant = useCallback((testName: string): string | null => {
    return tests[testName]?.variant || null;
  }, [tests]);

  const getTestConfig = useCallback((testName: string): Record<string, any> | null => {
    return tests[testName]?.config || null;
  }, [tests]);

  const trackEvent = useCallback(async (eventName: string, properties?: Record<string, any>) => {
    try {
      // Track events for A/B test analytics
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: effectiveUserId,
          event: eventName,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            activeTests: Object.keys(tests),
            activeFlags: Object.keys(flags).filter(key => flags[key]),
          },
        }),
      });
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  }, [effectiveUserId, tests, flags]);

  const refresh = useCallback(async () => {
    await fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  const value: FeatureFlagsContextType = {
    flags,
    tests,
    isLoading,
    error,
    isEnabled,
    getVariant,
    getTestConfig,
    trackEvent,
    refresh,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}

// Convenience hooks for specific use cases
export function useFeatureFlag(flagName: string): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flagName);
}

export function useABTest(testName: string) {
  const { getVariant, getTestConfig, trackEvent } = useFeatureFlags();
  
  const variant = getVariant(testName);
  const config = getTestConfig(testName);
  
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    trackEvent(eventName, {
      ...properties,
      abTest: testName,
      variant,
    });
  }, [trackEvent, testName, variant]);
  
  return {
    variant,
    config,
    track,
    isInTest: variant !== null,
  };
}

// Higher-order component for feature flag gating
export function withFeatureFlag<P extends object>(
  flagName: string,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(flagName);
    
    if (isEnabled) {
      return <Component {...props} />;
    }
    
    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}

// Component for conditional rendering based on feature flags
interface FeatureFlagProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureFlag({ flag, children, fallback = null }: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag);
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Component for A/B test variants
interface ABTestProps {
  test: string;
  variants: {
    [variantName: string]: React.ReactNode;
  };
  fallback?: React.ReactNode;
}

export function ABTestComponent({ test, variants, fallback = null }: ABTestProps) {
  const { variant } = useABTest(test);
  
  if (variant && variants[variant]) {
    return <>{variants[variant]}</>;
  }
  
  // Try control variant
  if (variants.control) {
    return <>{variants.control}</>;
  }
  
  return <>{fallback}</>;
}

// Hook for gradual rollouts
export function useGradualRollout(flagName: string, percentage: number): boolean {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  
  useEffect(() => {
    if (!user?.id) {
      setIsEnabled(false);
      return;
    }
    
    // Simple hash-based rollout
    let hash = 0;
    const str = user.id + flagName;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const userPercentile = Math.abs(hash) % 100;
    setIsEnabled(userPercentile < percentage);
  }, [user?.id, flagName, percentage]);
  
  return isEnabled;
}