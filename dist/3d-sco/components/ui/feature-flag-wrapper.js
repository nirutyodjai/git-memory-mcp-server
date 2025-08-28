"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagWrapper = FeatureFlagWrapper;
exports.ABTestWrapper = ABTestWrapper;
exports.withFeatureFlag = withFeatureFlag;
exports.withABTest = withABTest;
exports.ExampleFeatureFlag = ExampleFeatureFlag;
exports.ExampleABTest = ExampleABTest;
const use_feature_flags_1 = require("@/hooks/use-feature-flags");
// Component for feature flag conditional rendering
function FeatureFlagWrapper({ flagName, children, fallback = null, className }) {
    const isEnabled = (0, use_feature_flags_1.useFeatureFlag)(flagName);
    if (!isEnabled) {
        return fallback ? <div className={className}>{fallback}</div> : null;
    }
    return <div className={className}>{children}</div>;
}
// Component for A/B test variant rendering
function ABTestWrapper({ testName, variants, fallback = null, className }) {
    const { variant, config } = (0, use_feature_flags_1.useABTest)(testName);
    if (!variant || !variants[variant]) {
        return fallback ? <div className={className}>{fallback}</div> : null;
    }
    return <div className={className}>{variants[variant]}</div>;
}
// Higher-order component for feature flags
function withFeatureFlag(Component, flagName, fallback) {
    return function FeatureFlaggedComponent(props) {
        const isEnabled = (0, use_feature_flags_1.useFeatureFlag)(flagName);
        if (!isEnabled) {
            return fallback ? <>{fallback}</> : null;
        }
        return <Component {...props}/>;
    };
}
// Higher-order component for A/B tests
function withABTest(variants, testName, fallback) {
    return function ABTestComponent(props) {
        const { variant } = (0, use_feature_flags_1.useABTest)(testName);
        if (!variant || !variants[variant]) {
            return fallback ? <>{fallback}</> : null;
        }
        const VariantComponent = variants[variant];
        return <VariantComponent {...props}/>;
    };
}
// Example usage components
function ExampleFeatureFlag() {
    return (<FeatureFlagWrapper flagName="new-ui-design" fallback={<div className="p-4 bg-gray-100 rounded">Old UI Design</div>}>
      <div className="p-4 bg-blue-100 rounded border-2 border-blue-300">
        <h3 className="text-lg font-semibold text-blue-800">New UI Design</h3>
        <p className="text-blue-600">This is the new and improved user interface!</p>
      </div>
    </FeatureFlagWrapper>);
}
function ExampleABTest() {
    return (<ABTestWrapper testName="homepage-cta" variants={{
            control: (<button className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">
            Get Started
          </button>),
            'variant-a': (<button className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600">
            Start Now
          </button>),
        }} fallback={<button className="px-6 py-3 bg-gray-500 text-white rounded">Default</button>}/>);
}
//# sourceMappingURL=feature-flag-wrapper.js.map