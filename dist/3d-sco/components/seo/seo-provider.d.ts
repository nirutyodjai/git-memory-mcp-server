import React from 'react';
import { SEOConfig } from '@/lib/seo/meta-tags';
interface SEOProviderProps {
    children: React.ReactNode;
    initialConfig?: Partial<SEOConfig>;
}
export declare function SEOProvider({ children, initialConfig }: SEOProviderProps): any;
export declare function useSEO(): any;
export declare function useSEORouteTracking(): void;
export {};
//# sourceMappingURL=seo-provider.d.ts.map