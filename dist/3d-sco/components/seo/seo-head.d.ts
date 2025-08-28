import { Metadata } from 'next';
import type { StructuredData } from '@/lib/seo/meta-tags';
interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string[];
    author?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'profile';
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
    locale?: string;
    siteName?: string;
    twitterHandle?: string;
    noIndex?: boolean;
    noFollow?: boolean;
    canonical?: string;
    structuredData?: StructuredData[];
    breadcrumbs?: Array<{
        name: string;
        url: string;
    }>;
    faqs?: Array<{
        question: string;
        answer: string;
    }>;
}
interface ArticleSEOProps extends SEOProps {
    type: 'article';
    author: string;
    publishedTime: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
}
interface ProductSEOProps extends SEOProps {
    type: 'product';
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
}
interface ServiceSEOProps extends SEOProps {
    type: 'service';
    provider?: string;
    areaServed?: string;
    serviceType?: string;
}
export declare function generateSEOMetadata({ title, description, keywords, author, image, url, type, publishedTime, modifiedTime, section, tags, locale, siteName, twitterHandle, noIndex, canonical, }?: SEOProps): Metadata;
export declare function generateJSONLD(data: {
    type: 'WebSite' | 'Article' | 'Person' | 'Organization' | 'BlogPosting';
    name?: string;
    description?: string;
    url?: string;
    image?: string;
    author?: {
        name: string;
        url?: string;
    };
    publisher?: {
        name: string;
        logo?: string;
    };
    datePublished?: string;
    dateModified?: string;
    headline?: string;
    articleBody?: string;
    keywords?: string[];
    mainEntityOfPage?: string;
}): {
    '@context': string;
    '@type': "WebSite" | "Article" | "Person" | "Organization" | "BlogPosting";
} | {
    name: string | undefined;
    description: string | undefined;
    url: string | undefined;
    potentialAction: {
        '@type': string;
        target: {
            '@type': string;
            urlTemplate: string;
        };
        'query-input': string;
    };
    '@context': string;
    '@type': "WebSite" | "Article" | "Person" | "Organization" | "BlogPosting";
} | {
    headline: string | undefined;
    description: string | undefined;
    image: string | undefined;
    author: {
        '@type': string;
        name: string | undefined;
        url: string | undefined;
    };
    publisher: {
        '@type': string;
        name: string | undefined;
        logo: {
            '@type': string;
            url: string | undefined;
        };
    };
    datePublished: string | undefined;
    dateModified: string | undefined;
    mainEntityOfPage: {
        '@type': string;
        '@id': string | undefined;
    };
    keywords: string[] | undefined;
    '@context': string;
    '@type': "WebSite" | "Article" | "Person" | "Organization" | "BlogPosting";
} | {
    name: string | undefined;
    description: string | undefined;
    url: string | undefined;
    image: string | undefined;
    '@context': string;
    '@type': "WebSite" | "Article" | "Person" | "Organization" | "BlogPosting";
} | {
    name: string | undefined;
    description: string | undefined;
    url: string | undefined;
    logo: string | undefined;
    '@context': string;
    '@type': "WebSite" | "Article" | "Person" | "Organization" | "BlogPosting";
};
export declare function SEOHead({ title, description, keywords, image, type, publishedTime, modifiedTime, author, section, tags, noIndex, noFollow, canonical, structuredData, breadcrumbs, faqs, ...props }: SEOProps): any;
export declare function ArticleSEO({ title, description, author, publishedTime, modifiedTime, image, keywords, tags, section, ...props }: ArticleSEOProps): any;
export declare function ProductSEO({ title, description, image, price, currency, availability, brand, category, sku, rating, keywords, ...props }: ProductSEOProps): any;
export declare function ServiceSEO({ title, description, provider, areaServed, serviceType, keywords, ...props }: ServiceSEOProps): any;
export declare function useSEO(): {
    updateTitle: (title: string) => void;
    updateDescription: (description: string) => void;
    updateCanonical: (url: string) => void;
    addStructuredData: (data: StructuredData) => void;
};
export default SEOHead;
//# sourceMappingURL=seo-head.d.ts.map