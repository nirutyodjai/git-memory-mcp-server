"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoMonitor = exports.SEOMonitor = void 0;
exports.useSEOState = useSEOState;
exports.useRouteSEO = useRouteSEO;
exports.useContentSEO = useContentSEO;
exports.auditSEO = auditSEO;
exports.useSEOMonitor = useSEOMonitor;
const react_1 = require("react");
const router_1 = require("next/router");
const meta_tags_1 = require("./meta-tags");
// Hook for SEO state management
function useSEOState(initialConfig) {
    const [seoConfig, setSeoConfig] = (0, react_1.useState)(initialConfig || {});
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const updateSEO = (updates) => {
        setSeoConfig(prev => ({ ...prev, ...updates }));
    };
    const optimizeSEO = () => {
        if (seoConfig.title) {
            updateSEO({ title: (0, meta_tags_1.optimizeTitle)(seoConfig.title) });
        }
        if (seoConfig.description) {
            updateSEO({ description: (0, meta_tags_1.optimizeDescription)(seoConfig.description) });
        }
    };
    return {
        seoConfig,
        updateSEO,
        optimizeSEO,
        isLoading,
        error
    };
}
// Hook for dynamic SEO based on route changes
function useRouteSEO() {
    const router = (0, router_1.useRouter)();
    const [seoData, setSeoData] = (0, react_1.useState)({});
    (0, react_1.useEffect)(() => {
        const handleRouteChange = (url) => {
            // Generate SEO data based on route
            const pathSegments = url.split('/').filter(Boolean);
            const pageName = pathSegments[pathSegments.length - 1] || 'home';
            setSeoData({
                title: generatePageTitle(pageName),
                description: generatePageDescription(pageName),
                canonical: (0, meta_tags_1.generateCanonicalUrl)(process.env.NEXT_PUBLIC_BASE_URL || '', url)
            });
        };
        router.events.on('routeChangeComplete', handleRouteChange);
        handleRouteChange(router.asPath);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router]);
    return seoData;
}
// Hook for content-based SEO optimization
function useContentSEO(content) {
    const [seoData, setSeoData] = (0, react_1.useState)({
        keywords: [],
        readingTime: 0
    });
    (0, react_1.useEffect)(() => {
        if (content) {
            const keywords = (0, meta_tags_1.extractKeywords)(content);
            const readingTime = (0, meta_tags_1.calculateReadingTime)(content);
            // Extract potential title from first heading
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : undefined;
            // Extract description from first paragraph
            const descMatch = content.match(/^(?!#)(.{50,160})(?:\.|$)/m);
            const description = descMatch ? descMatch[1].trim() : undefined;
            setSeoData({
                keywords,
                readingTime,
                title,
                description
            });
        }
    }, [content]);
    return seoData;
}
// SEO Audit Functions
function auditSEO(element) {
    const issues = [];
    const recommendations = [];
    let score = 100;
    // Check title
    const title = element.querySelector('title')?.textContent;
    if (!title) {
        issues.push({
            type: 'error',
            message: 'Missing page title',
            element: 'title',
            recommendation: 'Add a descriptive title tag'
        });
        score -= 20;
    }
    else if (title.length < 30 || title.length > 60) {
        issues.push({
            type: 'warning',
            message: `Title length is ${title.length} characters (optimal: 30-60)`,
            element: 'title',
            recommendation: 'Optimize title length for better search visibility'
        });
        score -= 10;
    }
    // Check meta description
    const description = element.querySelector('meta[name="description"]')?.getAttribute('content');
    if (!description) {
        issues.push({
            type: 'error',
            message: 'Missing meta description',
            element: 'meta[name="description"]',
            recommendation: 'Add a compelling meta description'
        });
        score -= 15;
    }
    else if (description.length < 120 || description.length > 160) {
        issues.push({
            type: 'warning',
            message: `Description length is ${description.length} characters (optimal: 120-160)`,
            element: 'meta[name="description"]',
            recommendation: 'Optimize description length for better search snippets'
        });
        score -= 8;
    }
    // Check headings structure
    const h1s = element.querySelectorAll('h1');
    if (h1s.length === 0) {
        issues.push({
            type: 'error',
            message: 'Missing H1 heading',
            element: 'h1',
            recommendation: 'Add a main H1 heading to the page'
        });
        score -= 15;
    }
    else if (h1s.length > 1) {
        issues.push({
            type: 'warning',
            message: `Multiple H1 headings found (${h1s.length})`,
            element: 'h1',
            recommendation: 'Use only one H1 heading per page'
        });
        score -= 5;
    }
    // Check images alt text
    const images = element.querySelectorAll('img');
    let imagesWithoutAlt = 0;
    images.forEach(img => {
        if (!img.getAttribute('alt')) {
            imagesWithoutAlt++;
        }
    });
    if (imagesWithoutAlt > 0) {
        issues.push({
            type: 'warning',
            message: `${imagesWithoutAlt} images missing alt text`,
            element: 'img',
            recommendation: 'Add descriptive alt text to all images'
        });
        score -= Math.min(imagesWithoutAlt * 2, 10);
    }
    // Check canonical URL
    const canonical = element.querySelector('link[rel="canonical"]');
    if (!canonical) {
        issues.push({
            type: 'info',
            message: 'Missing canonical URL',
            element: 'link[rel="canonical"]',
            recommendation: 'Add canonical URL to prevent duplicate content issues'
        });
        score -= 5;
    }
    // Check structured data
    const structuredData = element.querySelectorAll('script[type="application/ld+json"]');
    if (structuredData.length === 0) {
        issues.push({
            type: 'info',
            message: 'No structured data found',
            element: 'script[type="application/ld+json"]',
            recommendation: 'Add structured data to improve search result appearance'
        });
        score -= 5;
    }
    // Generate recommendations
    if (score >= 90) {
        recommendations.push('Excellent SEO! Consider minor optimizations for perfect score.');
    }
    else if (score >= 70) {
        recommendations.push('Good SEO foundation. Address warnings to improve further.');
    }
    else if (score >= 50) {
        recommendations.push('SEO needs improvement. Focus on fixing errors first.');
    }
    else {
        recommendations.push('Poor SEO. Immediate attention required for basic optimization.');
    }
    return {
        score: Math.max(0, score),
        issues,
        recommendations
    };
}
// Utility functions
function generatePageTitle(pageName) {
    const titleMap = {
        home: '3D-SCO | Portfolio & Blog',
        about: 'About | 3D-SCO',
        portfolio: 'Portfolio | 3D-SCO',
        blog: 'Blog | 3D-SCO',
        contact: 'Contact | 3D-SCO',
        services: 'Services | 3D-SCO'
    };
    return titleMap[pageName] || `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} | 3D-SCO`;
}
function generatePageDescription(pageName) {
    const descriptionMap = {
        home: 'นักพัฒนาเว็บไซต์และแอปพลิเคชัน เชี่ยวชาญด้าน React, Next.js, และเทคโนโลยีสมัยใหม่',
        about: 'เรียนรู้เกี่ยวกับ 3D-SCO นักพัฒนาเว็บไซต์มืออาชีพ ประสบการณ์และความเชี่ยวชาญ',
        portfolio: 'ชมผลงานและโปรเจกต์ต่างๆ ของ 3D-SCO นักพัฒนาเว็บไซต์และแอปพลิเคชัน',
        blog: 'บทความและเนื้อหาเกี่ยวกับการพัฒนาเว็บไซต์ เทคโนโลยี และแนวโน้มใหม่ๆ',
        contact: 'ติดต่อ 3D-SCO สำหรับการพัฒนาเว็บไซต์และแอปพลิเคชัน',
        services: 'บริการพัฒนาเว็บไซต์และแอปพลิเคชันโดย 3D-SCO'
    };
    return descriptionMap[pageName] || `${pageName} - 3D-SCO Portfolio & Blog`;
}
// SEO Performance Monitoring
class SEOMonitor {
    constructor() {
        this.analytics = {
            pageViews: 0,
            bounceRate: 0,
            avgTimeOnPage: 0,
            searchImpressions: 0,
            searchClicks: 0,
            ctr: 0,
            avgPosition: 0,
            keywords: []
        };
    }
    trackPageView() {
        this.analytics.pageViews++;
        this.sendAnalytics('pageview');
    }
    trackSearchClick(keyword, position) {
        this.analytics.searchClicks++;
        const existingKeyword = this.analytics.keywords.find(k => k.keyword === keyword);
        if (existingKeyword) {
            existingKeyword.clicks++;
        }
        else {
            this.analytics.keywords.push({
                keyword,
                position,
                clicks: 1,
                impressions: 1
            });
        }
        this.updateCTR();
    }
    trackSearchImpression(keyword, position) {
        this.analytics.searchImpressions++;
        const existingKeyword = this.analytics.keywords.find(k => k.keyword === keyword);
        if (existingKeyword) {
            existingKeyword.impressions++;
        }
        else {
            this.analytics.keywords.push({
                keyword,
                position,
                clicks: 0,
                impressions: 1
            });
        }
        this.updateCTR();
    }
    updateCTR() {
        if (this.analytics.searchImpressions > 0) {
            this.analytics.ctr = (this.analytics.searchClicks / this.analytics.searchImpressions) * 100;
        }
    }
    sendAnalytics(event) {
        // Send to analytics service (Google Analytics, etc.)
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', event, {
                custom_parameter: 'seo_tracking'
            });
        }
    }
    getAnalytics() {
        return { ...this.analytics };
    }
    reset() {
        this.analytics = {
            pageViews: 0,
            bounceRate: 0,
            avgTimeOnPage: 0,
            searchImpressions: 0,
            searchClicks: 0,
            ctr: 0,
            avgPosition: 0,
            keywords: []
        };
    }
}
exports.SEOMonitor = SEOMonitor;
// Global SEO monitor instance
exports.seoMonitor = new SEOMonitor();
// Hook to use SEO monitor
function useSEOMonitor() {
    const [analytics, setAnalytics] = (0, react_1.useState)(exports.seoMonitor.getAnalytics());
    (0, react_1.useEffect)(() => {
        const interval = setInterval(() => {
            setAnalytics(exports.seoMonitor.getAnalytics());
        }, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, []);
    return {
        analytics,
        trackPageView: () => exports.seoMonitor.trackPageView(),
        trackSearchClick: (keyword, position) => exports.seoMonitor.trackSearchClick(keyword, position),
        trackSearchImpression: (keyword, position) => exports.seoMonitor.trackSearchImpression(keyword, position),
        reset: () => exports.seoMonitor.reset()
    };
}
exports.default = {
    useSEOState,
    useRouteSEO,
    useContentSEO,
    useSEOMonitor,
    auditSEO,
    seoMonitor: exports.seoMonitor
};
