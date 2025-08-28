"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEOProvider = SEOProvider;
exports.useSEO = useSEO;
exports.useSEORouteTracking = useSEORouteTracking;
const react_1 = __importStar(require("react"));
const utils_1 = require("@/lib/seo/utils");
const navigation_1 = require("next/navigation");
const react_i18next_1 = require("react-i18next");
const SEOContext = (0, react_1.createContext)(undefined);
const initialState = {
    seoConfig: {
        title: '',
        description: '',
        keywords: [],
        author: '',
        siteUrl: '',
        siteName: '',
        locale: 'en',
        type: 'website',
        image: '',
        twitterHandle: '',
        facebookAppId: '',
    },
    analytics: null,
    isLoading: false,
    error: null,
};
function seoReducer(state, action) {
    switch (action.type) {
        case 'SET_CONFIG':
            return { ...state, seoConfig: action.payload };
        case 'UPDATE_CONFIG':
            return {
                ...state,
                seoConfig: { ...state.seoConfig, ...action.payload }
            };
        case 'SET_ANALYTICS':
            return { ...state, analytics: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
}
function SEOProvider({ children, initialConfig }) {
    const [state, dispatch] = (0, react_1.useReducer)(seoReducer, {
        ...initialState,
        seoConfig: { ...initialState.seoConfig, ...initialConfig },
    });
    const router = (0, navigation_1.useRouter)();
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const { seoConfig: hookConfig, updateSEO: hookUpdateSEO } = (0, utils_1.useSEOState)();
    // Sync with hook state
    (0, react_1.useEffect)(() => {
        if (hookConfig) {
            dispatch({ type: 'SET_CONFIG', payload: hookConfig });
        }
    }, [hookConfig]);
    // Update locale when language changes
    (0, react_1.useEffect)(() => {
        dispatch({
            type: 'UPDATE_CONFIG',
            payload: { locale: i18n.language }
        });
    }, [i18n.language]);
    const updateSEO = (config) => {
        dispatch({ type: 'UPDATE_CONFIG', payload: config });
        hookUpdateSEO(config);
    };
    const optimizeContent = async (content) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            // Extract keywords from content
            const words = content.toLowerCase().match(/\b\w+\b/g) || [];
            const wordCount = words.reduce((acc, word) => {
                acc[word] = (acc[word] || 0) + 1;
                return acc;
            }, {});
            // Get top keywords
            const keywords = Object.entries(wordCount)
                .filter(([word]) => word.length > 3)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([word]) => word);
            // Generate optimized title and description
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const title = sentences[0]?.trim().substring(0, 60) || '';
            const description = content.substring(0, 160).trim();
            updateSEO({
                title,
                description,
                keywords,
            });
        }
        catch (error) {
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error.message : 'Optimization failed'
            });
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
    const runAudit = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            // Simulate SEO audit
            const issues = [];
            const recommendations = [];
            if (!state.seoConfig.title || state.seoConfig.title.length < 30) {
                issues.push('Title is too short (should be 30-60 characters)');
                recommendations.push('Add a descriptive title with target keywords');
            }
            if (!state.seoConfig.description || state.seoConfig.description.length < 120) {
                issues.push('Meta description is too short (should be 120-160 characters)');
                recommendations.push('Write a compelling meta description');
            }
            if (!state.seoConfig.keywords || state.seoConfig.keywords.length === 0) {
                issues.push('No keywords defined');
                recommendations.push('Add relevant keywords for better search visibility');
            }
            const score = Math.max(0, 100 - (issues.length * 20));
            const analytics = {
                pageViews: Math.floor(Math.random() * 10000),
                searchClicks: Math.floor(Math.random() * 1000),
                searchImpressions: Math.floor(Math.random() * 5000),
                clickThroughRate: Math.random() * 10,
                averagePosition: Math.random() * 20 + 1,
                bounceRate: Math.random() * 100,
                organicTraffic: Math.floor(Math.random() * 5000),
                topKeywords: state.seoConfig.keywords?.slice(0, 5) || [],
                seoScore: score,
                issues,
                recommendations,
            };
            dispatch({ type: 'SET_ANALYTICS', payload: analytics });
        }
        catch (error) {
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error.message : 'Audit failed'
            });
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
    const trackPageView = (url) => {
        // Track page view for analytics
        if (typeof window !== 'undefined') {
            // Send to analytics service
            console.log('Page view tracked:', url);
        }
    };
    const contextValue = {
        seoConfig: state.seoConfig,
        analytics: state.analytics,
        isLoading: state.isLoading,
        error: state.error,
        updateSEO,
        optimizeContent,
        runAudit,
        trackPageView,
    };
    return (<SEOContext.Provider value={contextValue}>
      {children}
    </SEOContext.Provider>);
}
function useSEO() {
    const context = (0, react_1.useContext)(SEOContext);
    if (context === undefined) {
        throw new Error('useSEO must be used within a SEOProvider');
    }
    return context;
}
// Hook for tracking route changes
function useSEORouteTracking() {
    const { trackPageView, updateSEO } = useSEO();
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        const handleRouteChange = (url) => {
            trackPageView(url);
            // Update canonical URL
            updateSEO({
                canonicalUrl: `${window.location.origin}${url}`
            });
        };
        // Track initial page load
        if (typeof window !== 'undefined') {
            handleRouteChange(window.location.pathname);
        }
        // Note: Next.js 13+ App Router doesn't have router events
        // You might need to implement route tracking differently
    }, [trackPageView, updateSEO]);
}
//# sourceMappingURL=seo-provider.js.map