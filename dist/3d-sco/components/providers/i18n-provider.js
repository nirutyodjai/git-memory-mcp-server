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
exports.I18nContext = void 0;
exports.I18nProvider = I18nProvider;
exports.useI18n = useI18n;
exports.useTranslation = useTranslation;
exports.useLocale = useLocale;
const react_1 = __importStar(require("react"));
const config_1 = require("@/lib/i18n/config");
const client_1 = require("@/lib/i18n/client");
const I18nContext = (0, react_1.createContext)(undefined);
exports.I18nContext = I18nContext;
function I18nProvider({ children, initialLocale }) {
    const [locale, setLocaleState] = (0, react_1.useState)(() => {
        if (initialLocale)
            return initialLocale;
        if (typeof window !== 'undefined') {
            return (0, client_1.getStoredLocale)() || (0, client_1.getBrowserLocale)();
        }
        return config_1.defaultLocale;
    });
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [translations, setTranslations] = (0, react_1.useState)({});
    const setLocale = (newLocale) => {
        if (!config_1.locales.includes(newLocale)) {
            console.warn(`Locale '${newLocale}' is not supported. Using default locale '${config_1.defaultLocale}'.`);
            newLocale = config_1.defaultLocale;
        }
        setLocaleState(newLocale);
        (0, client_1.setStoredLocale)(newLocale);
        // Update document language
        if (typeof document !== 'undefined') {
            document.documentElement.lang = newLocale;
        }
        // Update cookie for server-side rendering
        if (typeof document !== 'undefined') {
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        }
    };
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
    // Load initial translations
    (0, react_1.useEffect)(() => {
        const loadInitialTranslations = async () => {
            setIsLoading(true);
            try {
                // Load common translations by default
                const commonTranslations = await Promise.resolve(`${`@/lib/i18n/locales/${locale}/common.json`}`).then(s => __importStar(require(s)));
                const navigationTranslations = await Promise.resolve(`${`@/lib/i18n/locales/${locale}/navigation.json`}`).then(s => __importStar(require(s)));
                setTranslations({
                    common: commonTranslations.default,
                    navigation: navigationTranslations.default
                });
            }
            catch (error) {
                console.error('Failed to load initial translations:', error);
                // Fallback to default locale
                if (locale !== config_1.defaultLocale) {
                    try {
                        const commonTranslations = await Promise.resolve(`${`@/lib/i18n/locales/${config_1.defaultLocale}/common.json`}`).then(s => __importStar(require(s)));
                        const navigationTranslations = await Promise.resolve(`${`@/lib/i18n/locales/${config_1.defaultLocale}/navigation.json`}`).then(s => __importStar(require(s)));
                        setTranslations({
                            common: commonTranslations.default,
                            navigation: navigationTranslations.default
                        });
                    }
                    catch (fallbackError) {
                        console.error('Failed to load fallback translations:', fallbackError);
                    }
                }
            }
            finally {
                setIsLoading(false);
            }
        };
        loadInitialTranslations();
    }, [locale]);
    // Set document language on mount
    (0, react_1.useEffect)(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = locale;
        }
    }, [locale]);
    const contextValue = {
        locale,
        setLocale,
        t,
        isLoading,
        translations
    };
    return (react_1.default.createElement(I18nContext.Provider, { value: contextValue }, children));
}
function useI18n() {
    const context = (0, react_1.useContext)(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
function useTranslation(namespace = 'common') {
    const { locale, t: globalT, isLoading, translations } = useI18n();
    const t = (key, options) => {
        const namespacedKey = `${namespace}.${key}`;
        const translation = globalT(namespacedKey, options);
        // If namespaced key not found, try without namespace
        if (translation === namespacedKey) {
            return globalT(key, options);
        }
        return translation;
    };
    return {
        t,
        locale,
        isLoading,
        translations: translations[namespace] || {}
    };
}
function useLocale() {
    const { locale, setLocale, isLoading } = useI18n();
    return { locale, setLocale, isLoading };
}
