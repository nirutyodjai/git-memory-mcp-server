"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagsProvider = FeatureFlagsProvider;
exports.useFeatureFlags = useFeatureFlags;
exports.useFeatureFlag = useFeatureFlag;
exports.useABTest = useABTest;
exports.withFeatureFlag = withFeatureFlag;
exports.FeatureFlag = FeatureFlag;
exports.ABTestComponent = ABTestComponent;
exports.useGradualRollout = useGradualRollout;
const react_1 = require("react");
const auth_context_1 = require("@/contexts/auth-context");
const FeatureFlagsContext = (0, react_1.createContext)(undefined);
function FeatureFlagsProvider({ children, userId }) {
    const [flags, setFlags] = (0, react_1.useState)({});
    const [tests, setTests] = (0, react_1.useState)({});
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const { user } = (0, auth_context_1.useAuth)();
    // Use provided userId or fallback to authenticated user
    const effectiveUserId = userId || user?.id || `anonymous_${Date.now()}`;
    const fetchFeatureFlags = (0, react_1.useCallback)(async () => {
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
        }
        catch (err) {
            console.error('Error fetching feature flags:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch feature flags');
        }
        finally {
            setIsLoading(false);
        }
    }, [effectiveUserId]);
    (0, react_1.useEffect)(() => {
        fetchFeatureFlags();
    }, [fetchFeatureFlags]);
    const isEnabled = (0, react_1.useCallback)((flagName) => {
        return flags[flagName] === true;
    }, [flags]);
    const getVariant = (0, react_1.useCallback)((testName) => {
        return tests[testName]?.variant || null;
    }, [tests]);
    const getTestConfig = (0, react_1.useCallback)((testName) => {
        return tests[testName]?.config || null;
    }, [tests]);
    const trackEvent = (0, react_1.useCallback)(async (eventName, properties) => {
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
        }
        catch (err) {
            console.error('Error tracking event:', err);
        }
    }, [effectiveUserId, tests, flags]);
    const refresh = (0, react_1.useCallback)(async () => {
        await fetchFeatureFlags();
    }, [fetchFeatureFlags]);
    const value = {
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
    return (React.createElement(FeatureFlagsContext.Provider, { value: value }, children));
}
function useFeatureFlags() {
    const context = (0, react_1.useContext)(FeatureFlagsContext);
    if (context === undefined) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
    }
    return context;
}
// Convenience hooks for specific use cases
function useFeatureFlag(flagName) {
    const { isEnabled } = useFeatureFlags();
    return isEnabled(flagName);
}
function useABTest(testName) {
    const { getVariant, getTestConfig, trackEvent } = useFeatureFlags();
    const variant = getVariant(testName);
    const config = getTestConfig(testName);
    const track = (0, react_1.useCallback)((eventName, properties) => {
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
function withFeatureFlag(flagName, Component, FallbackComponent) {
    return function FeatureFlaggedComponent(props) {
        const isEnabled = useFeatureFlag(flagName);
        if (isEnabled) {
            return React.createElement(Component, { ...props });
        }
        if (FallbackComponent) {
            return React.createElement(FallbackComponent, { ...props });
        }
        return null;
    };
}
function FeatureFlag({ flag, children, fallback = null }) {
    const isEnabled = useFeatureFlag(flag);
    return isEnabled ? React.createElement(React.Fragment, null, children) : React.createElement(React.Fragment, null, fallback);
}
function ABTestComponent({ test, variants, fallback = null }) {
    const { variant } = useABTest(test);
    if (variant && variants[variant]) {
        return React.createElement(React.Fragment, null, variants[variant]);
    }
    // Try control variant
    if (variants.control) {
        return React.createElement(React.Fragment, null, variants.control);
    }
    return React.createElement(React.Fragment, null, fallback);
}
// Hook for gradual rollouts
function useGradualRollout(flagName, percentage) {
    const { user } = (0, auth_context_1.useAuth)();
    const [isEnabled, setIsEnabled] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
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
