"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLocaleToPathname = exports.removeLocaleFromPathname = exports.getLocaleFromPathname = exports.namespaces = exports.i18nConfig = exports.localeNames = exports.locales = exports.defaultLocale = void 0;
exports.defaultLocale = 'th';
exports.locales = ['th', 'en', 'zh', 'ja'];
exports.localeNames = {
    th: {
        name: 'Thai',
        nativeName: 'ไทย',
        flag: '🇹🇭'
    },
    en: {
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸'
    },
    zh: {
        name: 'Chinese',
        nativeName: '中文',
        flag: '🇨🇳'
    },
    ja: {
        name: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵'
    }
};
exports.i18nConfig = {
    defaultLocale: exports.defaultLocale,
    locales: exports.locales,
    localeDetection: true,
    cookieName: 'NEXT_LOCALE',
    localePath: './src/lib/i18n/locales',
    fallbackLng: exports.defaultLocale,
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
        escapeValue: false
    },
    react: {
        useSuspense: false
    }
};
exports.namespaces = [
    'common',
    'navigation',
    'home',
    'about',
    'projects',
    'blog',
    'contact',
    'admin',
    'search',
    'auth',
    'errors'
];
const getLocaleFromPathname = (pathname) => {
    const segments = pathname.split('/');
    const potentialLocale = segments[1];
    if (exports.locales.includes(potentialLocale)) {
        return potentialLocale;
    }
    return null;
};
exports.getLocaleFromPathname = getLocaleFromPathname;
const removeLocaleFromPathname = (pathname) => {
    const locale = (0, exports.getLocaleFromPathname)(pathname);
    if (locale) {
        return pathname.replace(`/${locale}`, '') || '/';
    }
    return pathname;
};
exports.removeLocaleFromPathname = removeLocaleFromPathname;
const addLocaleToPathname = (pathname, locale) => {
    const cleanPathname = (0, exports.removeLocaleFromPathname)(pathname);
    if (locale === exports.defaultLocale) {
        return cleanPathname;
    }
    return `/${locale}${cleanPathname}`;
};
exports.addLocaleToPathname = addLocaleToPathname;
//# sourceMappingURL=config.js.map