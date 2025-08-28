interface FeatureFlagsProviderProps {
    children: React.ReactNode;
    userId?: string;
}
export declare function FeatureFlagsProvider({ children, userId }: FeatureFlagsProviderProps): boolean;
export declare function useFeatureFlags(): any;
export declare function useFeatureFlag(flagName: string): boolean;
export declare function useABTest(testName: string): {
    variant: any;
    config: any;
    track: any;
    isInTest: boolean;
};
export declare function withFeatureFlag<P extends object>(flagName: string, Component: React.ComponentType<P>, FallbackComponent?: React.ComponentType<P>): (props: P) => boolean | null;
interface FeatureFlagProps {
    flag: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}
export declare function FeatureFlag({ flag, children, fallback }: FeatureFlagProps): any;
interface ABTestProps {
    test: string;
    variants: {
        [variantName: string]: React.ReactNode;
    };
    fallback?: React.ReactNode;
}
export declare function ABTestComponent({ test, variants, fallback }: ABTestProps): boolean;
export declare function useGradualRollout(flagName: string, percentage: number): boolean;
export {};
//# sourceMappingURL=use-feature-flags.d.ts.map