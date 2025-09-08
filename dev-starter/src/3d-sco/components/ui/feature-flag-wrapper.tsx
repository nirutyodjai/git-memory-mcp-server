'use client';

import { ReactNode } from 'react';
import { useFeatureFlag, useABTest } from '@/hooks/use-feature-flags';

interface FeatureFlagWrapperProps {
  flagName: string;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

interface ABTestWrapperProps {
  testName: string;
  variants: {
    [variantName: string]: ReactNode;
  };
  fallback?: ReactNode;
  className?: string;
}

// Component for feature flag conditional rendering
export function FeatureFlagWrapper({ 
  flagName, 
  children, 
  fallback = null, 
  className 
}: FeatureFlagWrapperProps) {
  const isEnabled = useFeatureFlag(flagName);
  
  if (!isEnabled) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }
  
  return <div className={className}>{children}</div>;
}

// Component for A/B test variant rendering
export function ABTestWrapper({ 
  testName, 
  variants, 
  fallback = null, 
  className 
}: ABTestWrapperProps) {
  const { variant, config } = useABTest(testName);
  
  if (!variant || !variants[variant]) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }
  
  return <div className={className}>{variants[variant]}</div>;
}

// Higher-order component for feature flags
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagName: string,
  fallback?: ReactNode
) {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(flagName);
    
    if (!isEnabled) {
      return fallback ? <>{fallback}</> : null;
    }
    
    return <Component {...props} />;
  };
}

// Higher-order component for A/B tests
export function withABTest<P extends object>(
  variants: { [variantName: string]: React.ComponentType<P> },
  testName: string,
  fallback?: ReactNode
) {
  return function ABTestComponent(props: P) {
    const { variant } = useABTest(testName);
    
    if (!variant || !variants[variant]) {
      return fallback ? <>{fallback}</> : null;
    }
    
    const VariantComponent = variants[variant];
    return <VariantComponent {...props} />;
  };
}

// Example usage components
export function ExampleFeatureFlag() {
  return (
    <FeatureFlagWrapper 
      flagName="new-ui-design" 
      fallback={<div className="p-4 bg-gray-100 rounded">Old UI Design</div>}
    >
      <div className="p-4 bg-blue-100 rounded border-2 border-blue-300">
        <h3 className="text-lg font-semibold text-blue-800">New UI Design</h3>
        <p className="text-blue-600">This is the new and improved user interface!</p>
      </div>
    </FeatureFlagWrapper>
  );
}

export function ExampleABTest() {
  return (
    <ABTestWrapper
      testName="homepage-cta"
      variants={{
        control: (
          <button className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">
            Get Started
          </button>
        ),
        'variant-a': (
          <button className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600">
            Start Now
          </button>
        ),
      }}
      fallback={<button className="px-6 py-3 bg-gray-500 text-white rounded">Default</button>}
    />
  );
}