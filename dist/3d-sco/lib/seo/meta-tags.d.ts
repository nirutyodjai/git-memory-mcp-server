import { Metadata } from 'next';
export interface SEOConfig {
    title?: string;
    description?: string;
    keywords?: string[];
    author?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'profile';
    siteName?: string;
    locale?: string;
    alternateLocales?: string[];
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
    noIndex?: boolean;
    noFollow?: boolean;
    canonical?: string;
}
export interface StructuredData {
    '@context': string;
    '@type': string;
    [key: string]: any;
}
export declare function generateMetadata(seoConfig?: SEOConfig): Metadata;
export declare function generateStructuredData(type: string, data: any): StructuredData;
export declare function generateOrganizationSchema(): StructuredData;
export declare function generateWebsiteSchema(): StructuredData;
export declare function generateArticleSchema(article: {
    title: string;
    description: string;
    author: string;
    publishedTime: string;
    modifiedTime?: string;
    image?: string;
    url: string;
    keywords?: string[];
}): StructuredData;
export declare function generateProductSchema(product: {
    name: string;
    description: string;
    image?: string;
    price?: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    brand?: string;
    category?: string;
    sku?: string;
    rating?: {
        value: number;
        count: number;
    };
}): StructuredData;
export declare function generateBreadcrumbSchema(breadcrumbs: Array<{
    name: string;
    url: string;
}>): StructuredData;
export declare function generateFAQSchema(faqs: Array<{
    question: string;
    answer: string;
}>): StructuredData;
export declare function generateServiceSchema(service: {
    name: string;
    description: string;
    provider: string;
    areaServed?: string;
    serviceType?: string;
    url?: string;
}): StructuredData;
export declare function optimizeTitle(title: string, maxLength?: number): string;
export declare function optimizeDescription(description: string, maxLength?: number): string;
export declare function generateSlug(text: string): string;
export declare function extractKeywords(text: string, maxKeywords?: number): string[];
export declare function calculateReadingTime(text: string, wordsPerMinute?: number): number;
export declare function generateCanonicalUrl(baseUrl: string, path: string, locale?: string): string;
export declare function generateAlternateUrls(baseUrl: string, path: string, locales: string[]): Record<string, string>;
//# sourceMappingURL=meta-tags.d.ts.map