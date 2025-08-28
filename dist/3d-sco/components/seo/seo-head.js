"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSEOMetadata = generateSEOMetadata;
exports.generateJSONLD = generateJSONLD;
exports.SEOHead = SEOHead;
exports.ArticleSEO = ArticleSEO;
exports.ProductSEO = ProductSEO;
exports.ServiceSEO = ServiceSEO;
exports.useSEO = useSEO;
const head_1 = __importDefault(require("next/head"));
const client_1 = require("@/lib/i18n/client");
const meta_tags_1 = require("@/lib/seo/meta-tags");
const DEFAULT_SEO = {
    title: '3D-SCO | Portfolio & Blog',
    description: 'นักพัฒนาเว็บไซต์และแอปพลิเคชัน เชี่ยวชาญด้าน React, Next.js, และเทคโนโลยีสมัยใหม่',
    keywords: ['web development', 'react', 'nextjs', 'portfolio', 'blog', 'เว็บไซต์', 'พัฒนา'],
    author: '3D-SCO Developer',
    siteName: '3D-SCO',
    locale: 'th_TH',
    type: 'website',
    twitterHandle: '@3dsco',
};
function generateSEOMetadata({ title, description, keywords = [], author, image, url, type = 'website', publishedTime, modifiedTime, section, tags = [], locale, siteName, twitterHandle, noIndex = false, canonical, } = {}) {
    const seoTitle = title ? `${title} | ${DEFAULT_SEO.siteName}` : DEFAULT_SEO.title;
    const seoDescription = description || DEFAULT_SEO.description;
    const seoKeywords = [...DEFAULT_SEO.keywords, ...keywords];
    const seoAuthor = author || DEFAULT_SEO.author;
    const seoLocale = locale || DEFAULT_SEO.locale;
    const seoSiteName = siteName || DEFAULT_SEO.siteName;
    const seoTwitterHandle = twitterHandle || DEFAULT_SEO.twitterHandle;
    const seoType = type || DEFAULT_SEO.type;
    const metadata = {
        title: seoTitle,
        description: seoDescription,
        keywords: seoKeywords,
        authors: [{ name: seoAuthor }],
        creator: seoAuthor,
        publisher: seoSiteName,
        // Robots
        robots: {
            index: !noIndex,
            follow: !noIndex,
            googleBot: {
                index: !noIndex,
                follow: !noIndex,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        // Open Graph
        openGraph: {
            title: seoTitle,
            description: seoDescription,
            type: seoType,
            locale: seoLocale,
            siteName: seoSiteName,
            ...(url && { url }),
            ...(image && {
                images: [{
                        url: image,
                        width: 1200,
                        height: 630,
                        alt: seoTitle,
                    }],
            }),
            ...(publishedTime && { publishedTime }),
            ...(modifiedTime && { modifiedTime }),
            ...(section && { section }),
            ...(tags.length > 0 && { tags }),
        },
        // Twitter
        twitter: {
            card: 'summary_large_image',
            title: seoTitle,
            description: seoDescription,
            creator: seoTwitterHandle,
            site: seoTwitterHandle,
            ...(image && { images: [image] }),
        },
        // Additional metadata
        ...(canonical && { alternates: { canonical } }),
        // Verification
        verification: {
            google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
            yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
            yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
        },
        // App metadata
        applicationName: seoSiteName,
        referrer: 'origin-when-cross-origin',
        colorScheme: 'dark light',
        themeColor: [
            { media: '(prefers-color-scheme: light)', color: '#ffffff' },
            { media: '(prefers-color-scheme: dark)', color: '#000000' },
        ],
        // Viewport
        viewport: {
            width: 'device-width',
            initialScale: 1,
            maximumScale: 1,
        },
        // Icons
        icons: {
            icon: '/favicon.ico',
            shortcut: '/favicon-16x16.png',
            apple: '/apple-touch-icon.png',
            other: [
                {
                    rel: 'icon',
                    type: 'image/png',
                    sizes: '32x32',
                    url: '/favicon-32x32.png',
                },
                {
                    rel: 'icon',
                    type: 'image/png',
                    sizes: '16x16',
                    url: '/favicon-16x16.png',
                },
            ],
        },
        // Manifest
        manifest: '/site.webmanifest',
    };
    return metadata;
}
// JSON-LD Schema Generator
function generateJSONLD(data) {
    const baseSchema = {
        '@context': 'https://schema.org',
        '@type': data.type,
    };
    switch (data.type) {
        case 'WebSite':
            return {
                ...baseSchema,
                name: data.name,
                description: data.description,
                url: data.url,
                potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                        '@type': 'EntryPoint',
                        urlTemplate: `${data.url}/search?q={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                },
            };
        case 'Article':
        case 'BlogPosting':
            return {
                ...baseSchema,
                headline: data.headline,
                description: data.description,
                image: data.image,
                author: {
                    '@type': 'Person',
                    name: data.author?.name,
                    url: data.author?.url,
                },
                publisher: {
                    '@type': 'Organization',
                    name: data.publisher?.name,
                    logo: {
                        '@type': 'ImageObject',
                        url: data.publisher?.logo,
                    },
                },
                datePublished: data.datePublished,
                dateModified: data.dateModified,
                mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': data.mainEntityOfPage,
                },
                keywords: data.keywords,
            };
        case 'Person':
            return {
                ...baseSchema,
                name: data.name,
                description: data.description,
                url: data.url,
                image: data.image,
            };
        case 'Organization':
            return {
                ...baseSchema,
                name: data.name,
                description: data.description,
                url: data.url,
                logo: data.image,
            };
        default:
            return baseSchema;
    }
}
// SEO Component for Client-side usage
function SEOHead({ title, description, keywords, image, type = 'website', publishedTime, modifiedTime, author, section, tags, noIndex = false, noFollow = false, canonical, structuredData = [], breadcrumbs, faqs, ...props }) {
    const { locale } = (0, client_1.useI18n)();
    const currentUrl = typeof window !== 'undefined' ? window.location.href : (process.env.NEXT_PUBLIC_BASE_URL || 'https://3d-sco.com');
    // Use default values if not provided
    const finalTitle = title || DEFAULT_SEO.title;
    const finalDescription = description || DEFAULT_SEO.description;
    const finalKeywords = keywords || DEFAULT_SEO.keywords;
    // Optimize title and description
    const optimizedTitle = (0, meta_tags_1.optimizeTitle)(finalTitle);
    const optimizedDescription = (0, meta_tags_1.optimizeDescription)(finalDescription);
    // Generate canonical URL
    const canonicalUrl = canonical || currentUrl;
    // Generate alternate URLs for different locales
    const alternateUrls = (0, meta_tags_1.generateAlternateUrls)(process.env.NEXT_PUBLIC_BASE_URL || 'https://3d-sco.com', new URL(currentUrl).pathname, ['en', 'th', 'zh', 'ja']);
    // Generate structured data
    const allStructuredData = [...structuredData];
    // Add organization schema
    allStructuredData.push((0, meta_tags_1.generateOrganizationSchema)());
    // Add website schema
    allStructuredData.push((0, meta_tags_1.generateWebsiteSchema)());
    // Add breadcrumb schema if provided
    if (breadcrumbs && breadcrumbs.length > 0) {
        allStructuredData.push((0, meta_tags_1.generateBreadcrumbSchema)(breadcrumbs));
    }
    // Add FAQ schema if provided
    if (faqs && faqs.length > 0) {
        allStructuredData.push((0, meta_tags_1.generateFAQSchema)(faqs));
    }
    const fullTitle = finalTitle === DEFAULT_SEO.title ? finalTitle : `${finalTitle} | ${DEFAULT_SEO.siteName}`;
    const imageUrl = image || '/images/og-default.jpg';
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${currentUrl}${imageUrl}`;
    return (<head_1.default>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={optimizedDescription}/>
      <meta name="keywords" content={[...finalKeywords, ...(tags || [])].join(', ')}/>
      {author && <meta name="author" content={author}/>}
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl}/>
      
      {/* Alternate URLs */}
      {Object.entries(alternateUrls).map(([lang, url]) => (<link key={lang} rel="alternate" hrefLang={lang} href={url}/>))}
      
      {/* Open Graph */}
      <meta property="og:title" content={optimizedTitle}/>
      <meta property="og:description" content={optimizedDescription}/>
      <meta property="og:type" content={type}/>
      <meta property="og:url" content={currentUrl}/>
      <meta property="og:site_name" content={DEFAULT_SEO.siteName}/>
      <meta property="og:locale" content={locale}/>
      {image && (<>
          <meta property="og:image" content={fullImageUrl}/>
          <meta property="og:image:width" content="1200"/>
          <meta property="og:image:height" content="630"/>
          <meta property="og:image:alt" content={optimizedTitle}/>
        </>)}
      {publishedTime && <meta property="article:published_time" content={publishedTime}/>}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime}/>}
      {author && <meta property="article:author" content={author}/>}
      {section && <meta property="article:section" content={section}/>}
      {tags && tags.map(tag => (<meta key={tag} property="article:tag" content={tag}/>))}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image"/>
      <meta name="twitter:title" content={optimizedTitle}/>
      <meta name="twitter:description" content={optimizedDescription}/>
      {image && <meta name="twitter:image" content={fullImageUrl}/>}
      {author && <meta name="twitter:creator" content={`@${author}`}/>}
      
      {/* Robots */}
      <meta name="robots" content={`${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`}/>
      <meta name="googlebot" content={`${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}, max-video-preview:-1, max-image-preview:large, max-snippet:-1`}/>
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#000000"/>
      <meta name="color-scheme" content="light dark"/>
      <meta name="format-detection" content="telephone=no"/>
      
      {/* Favicons */}
      <link rel="icon" href="/favicon.ico"/>
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
      <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
      <link rel="manifest" href="/site.webmanifest"/>
      <meta name="msapplication-TileColor" content="#000000"/>
      <meta name="msapplication-config" content="/browserconfig.xml"/>
      
      {/* Structured Data */}
      {allStructuredData.map((data, index) => (<script key={index} type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify(data)
            }}/>))}
    </head_1.default>);
}
function ArticleSEO({ title, description, author, publishedTime, modifiedTime, image, keywords, tags, section, ...props }) {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : (process.env.NEXT_PUBLIC_BASE_URL || 'https://3d-sco.com');
    // Generate article structured data
    const articleSchema = (0, meta_tags_1.generateArticleSchema)({
        title: title || '',
        description: description || '',
        author,
        publishedTime,
        modifiedTime,
        image,
        url: currentUrl,
        keywords
    });
    return (<SEOHead {...props} title={title} description={description} keywords={keywords} image={image} type="article" author={author} publishedTime={publishedTime} modifiedTime={modifiedTime} section={section} tags={tags} structuredData={[articleSchema]}/>);
}
function ProductSEO({ title, description, image, price, currency, availability, brand, category, sku, rating, keywords, ...props }) {
    // Generate product structured data
    const productSchema = (0, meta_tags_1.generateProductSchema)({
        name: title || '',
        description: description || '',
        image,
        price,
        currency,
        availability,
        brand,
        category,
        sku,
        rating
    });
    return (<SEOHead {...props} title={title} description={description} keywords={keywords} image={image} type="website" structuredData={[productSchema]}/>);
}
function ServiceSEO({ title, description, provider = '3D-SCO', areaServed, serviceType, keywords, ...props }) {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : (process.env.NEXT_PUBLIC_BASE_URL || 'https://3d-sco.com');
    // Generate service structured data
    const serviceSchema = (0, meta_tags_1.generateServiceSchema)({
        name: title || '',
        description: description || '',
        provider,
        areaServed,
        serviceType,
        url: currentUrl
    });
    return (<SEOHead {...props} title={title} description={description} keywords={keywords} type="website" structuredData={[serviceSchema]}/>);
}
// Hook for dynamic SEO updates
function useSEO() {
    const updateTitle = (title) => {
        if (typeof document !== 'undefined') {
            document.title = (0, meta_tags_1.optimizeTitle)(title);
        }
    };
    const updateDescription = (description) => {
        if (typeof document !== 'undefined') {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', (0, meta_tags_1.optimizeDescription)(description));
            }
        }
    };
    const updateCanonical = (url) => {
        if (typeof document !== 'undefined') {
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) {
                canonical.setAttribute('href', url);
            }
        }
    };
    const addStructuredData = (data) => {
        if (typeof document !== 'undefined') {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(data);
            document.head.appendChild(script);
        }
    };
    return {
        updateTitle,
        updateDescription,
        updateCanonical,
        addStructuredData
    };
}
exports.default = SEOHead;
//# sourceMappingURL=seo-head.js.map