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
        return fallback ? React.createElement("div", { className: className }, fallback) : null;
    }
    return React.createElement("div", { className: className }, children);
}
// Component for A/B test variant rendering
function ABTestWrapper({ testName, variants, fallback = null, className }) {
    const { variant, config } = (0, use_feature_flags_1.useABTest)(testName);
    if (!variant || !variants[variant]) {
        return fallback ? React.createElement("div", { className: className }, fallback) : null;
    }
    return React.createElement("div", { className: className }, variants[variant]);
}
// Higher-order component for feature flags
function withFeatureFlag(Component, flagName, fallback) {
    return function FeatureFlaggedComponent(props) {
        const isEnabled = (0, use_feature_flags_1.useFeatureFlag)(flagName);
        if (!isEnabled) {
            return fallback ? React.createElement(React.Fragment, null, fallback) : null;
        }
        return React.createElement(Component, { ...props });
    };
}
// Higher-order component for A/B tests
function withABTest(variants, testName, fallback) {
    return function ABTestComponent(props) {
        const { variant } = (0, use_feature_flags_1.useABTest)(testName);
        if (!variant || !variants[variant]) {
            return fallback ? React.createElement(React.Fragment, null, fallback) : null;
        }
        const VariantComponent = variants[variant];
        return React.createElement(VariantComponent, { ...props });
    };
}
// Example usage components
function ExampleFeatureFlag() {
    return (React.createElement(FeatureFlagWrapper, { flagName: "new-ui-design", fallback: React.createElement("div", { className: "p-4 bg-gray-100 rounded" }, "Old UI Design") },
        React.createElement("div", { className: "p-4 bg-blue-100 rounded border-2 border-blue-300" },
            React.createElement("h3", { className: "text-lg font-semibold text-blue-800" }, "New UI Design"),
            React.createElement("p", { className: "text-blue-600" }, "This is the new and improved user interface!"))));
}
function ExampleABTest() {
    return (React.createElement(ABTestWrapper, { testName: "homepage-cta", variants: {
            control: (React.createElement("button", { className: "px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600" }, "Get Started")),
            'variant-a': (React.createElement("button", { className: "px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600" }, "Start Now")),
        }, fallback: React.createElement("button", { className: "px-6 py-3 bg-gray-500 text-white rounded" }, "Default") }));
}
