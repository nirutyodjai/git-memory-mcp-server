"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMetadata = generateMetadata;
exports.generateStructuredData = generateStructuredData;
exports.generateOrganizationSchema = generateOrganizationSchema;
exports.generateWebsiteSchema = generateWebsiteSchema;
exports.generateArticleSchema = generateArticleSchema;
exports.generateProductSchema = generateProductSchema;
exports.generateBreadcrumbSchema = generateBreadcrumbSchema;
exports.generateFAQSchema = generateFAQSchema;
exports.generateServiceSchema = generateServiceSchema;
exports.optimizeTitle = optimizeTitle;
exports.optimizeDescription = optimizeDescription;
exports.generateSlug = generateSlug;
exports.extractKeywords = extractKeywords;
exports.calculateReadingTime = calculateReadingTime;
exports.generateCanonicalUrl = generateCanonicalUrl;
exports.generateAlternateUrls = generateAlternateUrls;
const DEFAULT_SEO = {
    title: '3D-SCO - Professional 3D Modeling & Design Services',
    description: 'Expert 3D modeling, architectural visualization, and design services. Transform your ideas into stunning 3D reality with our professional team.',
    keywords: ['3D modeling', '3D design', 'architectural visualization', 'product design', '3D rendering', 'CAD services'],
    author: '3D-SCO Team',
    siteName: '3D-SCO',
    type: 'website',
    locale: 'en',
    alternateLocales: ['th', 'zh', 'ja']
};
function generateMetadata(seoConfig = {}) {
    const config = { ...DEFAULT_SEO, ...seoConfig };
    const metadata = {
        title: config.title,
        description: config.description,
        keywords: config.keywords?.join(', '),
        authors: config.author ? [{ name: config.author }] : undefined,
        // Open Graph
        openGraph: {
            title: config.title,
            description: config.description,
            type: config.type,
            siteName: config.siteName,
            locale: config.locale,
            alternateLocale: config.alternateLocales,
            url: config.url,
            images: config.image ? [{
                    url: config.image,
                    width: 1200,
                    height: 630,
                    alt: config.title
                }] : undefined,
            publishedTime: config.publishedTime,
            modifiedTime: config.modifiedTime,
            section: config.section,
            tags: config.tags
        },
        // Twitter Card
        twitter: {
            card: 'summary_large_image',
            title: config.title,
            description: config.description,
            images: config.image ? [config.image] : undefined,
            creator: config.author ? `@${config.author}` : undefined
        },
        // Robots
        robots: {
            index: !config.noIndex,
            follow: !config.noFollow,
            googleBot: {
                index: !config.noIndex,
                follow: !config.noFollow,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1
            }
        },
        // Canonical URL
        alternates: {
            canonical: config.canonical || config.url,
            languages: config.alternateLocales?.reduce((acc, locale) => {
                acc[locale] = `${config.url}/${locale}`;
                return acc;
            }, {})
        },
        // Additional meta tags
        other: {
            'theme-color': '#000000',
            'color-scheme': 'light dark',
            'format-detection': 'telephone=no'
        }
    };
    return metadata;
}
function generateStructuredData(type, data) {
    const baseStructuredData = {
        '@context': 'https://schema.org',
        '@type': type,
        ...data
    };
    return baseStructuredData;
}
function generateOrganizationSchema() {
    return generateStructuredData('Organization', {
        name: '3D-SCO',
        description: 'Professional 3D modeling and design services company',
        url: 'https://3d-sco.com',
        logo: 'https://3d-sco.com/logo.png',
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-555-0123',
            contactType: 'customer service',
            availableLanguage: ['English', 'Thai', 'Chinese', 'Japanese']
        },
        sameAs: [
            'https://facebook.com/3dsco',
            'https://twitter.com/3dsco',
            'https://linkedin.com/company/3dsco',
            'https://instagram.com/3dsco'
        ]
    });
}
function generateWebsiteSchema() {
    return generateStructuredData('WebSite', {
        name: '3D-SCO',
        url: 'https://3d-sco.com',
        description: 'Professional 3D modeling and design services',
        potentialAction: {
            '@type': 'SearchAction',
            target: 'https://3d-sco.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string'
        }
    });
}
function generateArticleSchema(article) {
    return generateStructuredData('Article', {
        headline: article.title,
        description: article.description,
        author: {
            '@type': 'Person',
            name: article.author
        },
        publisher: {
            '@type': 'Organization',
            name: '3D-SCO',
            logo: {
                '@type': 'ImageObject',
                url: 'https://3d-sco.com/logo.png'
            }
        },
        datePublished: article.publishedTime,
        dateModified: article.modifiedTime || article.publishedTime,
        image: article.image ? {
            '@type': 'ImageObject',
            url: article.image,
            width: 1200,
            height: 630
        } : undefined,
        url: article.url,
        keywords: article.keywords?.join(', '),
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': article.url
        }
    });
}
function generateProductSchema(product) {
    return generateStructuredData('Product', {
        name: product.name,
        description: product.description,
        image: product.image,
        brand: product.brand ? {
            '@type': 'Brand',
            name: product.brand
        } : undefined,
        category: product.category,
        sku: product.sku,
        offers: product.price ? {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: product.currency || 'USD',
            availability: `https://schema.org/${product.availability || 'InStock'}`
        } : undefined,
        aggregateRating: product.rating ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating.value,
            reviewCount: product.rating.count
        } : undefined
    });
}
function generateBreadcrumbSchema(breadcrumbs) {
    return generateStructuredData('BreadcrumbList', {
        itemListElement: breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: crumb.url
        }))
    });
}
function generateFAQSchema(faqs) {
    return generateStructuredData('FAQPage', {
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer
            }
        }))
    });
}
function generateServiceSchema(service) {
    return generateStructuredData('Service', {
        name: service.name,
        description: service.description,
        provider: {
            '@type': 'Organization',
            name: service.provider
        },
        areaServed: service.areaServed,
        serviceType: service.serviceType,
        url: service.url
    });
}
// SEO utilities
function optimizeTitle(title, maxLength = 60) {
    if (title.length <= maxLength)
        return title;
    return title.substring(0, maxLength - 3) + '...';
}
function optimizeDescription(description, maxLength = 160) {
    if (description.length <= maxLength)
        return description;
    return description.substring(0, maxLength - 3) + '...';
}
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
function extractKeywords(text, maxKeywords = 10) {
    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
    const wordCount = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {});
    return Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, maxKeywords)
        .map(([word]) => word);
}
function calculateReadingTime(text, wordsPerMinute = 200) {
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
}
function generateCanonicalUrl(baseUrl, path, locale) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
    return `${baseUrl}${localePrefix}${cleanPath}`;
}
function generateAlternateUrls(baseUrl, path, locales) {
    return locales.reduce((acc, locale) => {
        acc[locale] = generateCanonicalUrl(baseUrl, path, locale);
        return acc;
    }, {});
}
