import { ReactNode } from 'react';
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
export declare function FeatureFlagWrapper({ flagName, children, fallback, className }: FeatureFlagWrapperProps): any;
export declare function ABTestWrapper({ testName, variants, fallback, className }: ABTestWrapperProps): any;
export declare function withFeatureFlag<P extends object>(Component: React.ComponentType<P>, flagName: string, fallback?: ReactNode): (props: P) => any;
export declare function withABTest<P extends object>(variants: {
    [variantName: string]: React.ComponentType<P>;
}, testName: string, fallback?: ReactNode): (props: P) => any;
export declare function ExampleFeatureFlag(): any;
export declare function ExampleABTest(): any;
export {};
//# sourceMappingURL=feature-flag-wrapper.d.ts.map