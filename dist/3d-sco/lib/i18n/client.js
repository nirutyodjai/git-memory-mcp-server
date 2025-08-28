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
exports.translationStore = exports.I18nContext = void 0;
exports.useI18n = useI18n;
exports.useTranslation = useTranslation;
exports.useLocale = useLocale;
exports.getStoredLocale = getStoredLocale;
exports.setStoredLocale = setStoredLocale;
exports.getBrowserLocale = getBrowserLocale;
const react_1 = require("react");
const config_1 = require("./config");
const I18nContext = (0, react_1.createContext)(undefined);
exports.I18nContext = I18nContext;
class TranslationStore {
    constructor() {
        this.translations = new Map();
        this.loadingPromises = new Map();
    }
    static getInstance() {
        if (!TranslationStore.instance) {
            TranslationStore.instance = new TranslationStore();
        }
        return TranslationStore.instance;
    }
    async loadTranslations(locale, namespace) {
        const key = `${locale}-${namespace}`;
        if (this.translations.has(key)) {
            return this.translations.get(key);
        }
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }
        const loadPromise = this.fetchTranslations(locale, namespace);
        this.loadingPromises.set(key, loadPromise);
        try {
            const translations = await loadPromise;
            this.translations.set(key, translations);
            this.loadingPromises.delete(key);
            return translations;
        }
        catch (error) {
            this.loadingPromises.delete(key);
            console.error(`Failed to load translations for ${locale}/${namespace}:`, error);
            // Fallback to default locale if available
            if (locale !== config_1.defaultLocale) {
                return this.loadTranslations(config_1.defaultLocale, namespace);
            }
            return {};
        }
    }
    async fetchTranslations(locale, namespace) {
        try {
            const response = await fetch(`/api/i18n/${locale}/${namespace}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            // Fallback to static import for development
            try {
                const module = await Promise.resolve(`${`./locales/${locale}/${namespace}.json`}`).then(s => __importStar(require(s)));
                return module.default;
            }
            catch (importError) {
                console.error(`Failed to import translations for ${locale}/${namespace}:`, importError);
                return {};
            }
        }
    }
    getTranslations(locale, namespace) {
        const key = `${locale}-${namespace}`;
        return this.translations.get(key) || null;
    }
    clearCache() {
        this.translations.clear();
        this.loadingPromises.clear();
    }
}
const translationStore = TranslationStore.getInstance();
exports.translationStore = translationStore;
function useI18n(namespace = 'common') {
    const context = (0, react_1.useContext)(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    const { locale, setLocale, isLoading } = context;
    const [translations, setTranslations] = (0, react_1.useState)({});
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        let isMounted = true;
        const loadTranslations = async () => {
            setLoading(true);
            try {
                const trans = await translationStore.loadTranslations(locale, namespace);
                if (isMounted) {
                    setTranslations(trans);
                }
            }
            catch (error) {
                console.error('Failed to load translations:', error);
            }
            finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        loadTranslations();
        return () => {
            isMounted = false;
        };
    }, [locale, namespace]);
    const t = (key, options = {}) => {
        const keys = key.split('.');
        let value = translations;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            }
            else {
                // Return key if translation not found
                return key;
            }
        }
        if (typeof value !== 'string') {
            return key;
        }
        // Simple interpolation
        let result = value;
        Object.entries(options).forEach(([optionKey, optionValue]) => {
            const placeholder = `{{${optionKey}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), String(optionValue));
        });
        return result;
    };
    return {
        locale,
        setLocale,
        t,
        isLoading: isLoading || loading,
        translations
    };
}
function useTranslation(namespace = 'common') {
    return useI18n(namespace);
}
function useLocale() {
    const context = (0, react_1.useContext)(I18nContext);
    if (!context) {
        throw new Error('useLocale must be used within an I18nProvider');
    }
    return {
        locale: context.locale,
        setLocale: context.setLocale,
        isLoading: context.isLoading
    };
}
// Utility functions
function getStoredLocale() {
    if (typeof window === 'undefined')
        return config_1.defaultLocale;
    try {
        const stored = localStorage.getItem('locale');
        if (stored && config_1.locales.includes(stored)) {
            return stored;
        }
    }
    catch (error) {
        console.error('Failed to get stored locale:', error);
    }
    return config_1.defaultLocale;
}
function setStoredLocale(locale) {
    if (typeof window === 'undefined')
        return;
    try {
        localStorage.setItem('locale', locale);
    }
    catch (error) {
        console.error('Failed to store locale:', error);
    }
}
function getBrowserLocale() {
    if (typeof window === 'undefined')
        return config_1.defaultLocale;
    const browserLang = navigator.language.split('-')[0];
    return config_1.locales.includes(browserLang) ? browserLang : config_1.defaultLocale;
}
//# sourceMappingURL=client.js.map