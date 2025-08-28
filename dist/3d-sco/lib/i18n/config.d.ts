export declare const defaultLocale: "th";
export declare const locales: readonly ["th", "en", "zh", "ja"];
export type Locale = typeof locales[number];
export declare const localeNames: Record<Locale, {
    name: string;
    nativeName: string;
    flag: string;
}>;
export declare const i18nConfig: {
    defaultLocale: "th";
    locales: readonly ["th", "en", "zh", "ja"];
    localeDetection: boolean;
    cookieName: string;
    localePath: string;
    fallbackLng: "th";
    debug: boolean;
    interpolation: {
        escapeValue: boolean;
    };
    react: {
        useSuspense: boolean;
    };
};
export declare const namespaces: readonly ["common", "navigation", "home", "about", "projects", "blog", "contact", "admin", "search", "auth", "errors"];
export type Namespace = typeof namespaces[number];
export declare const getLocaleFromPathname: (pathname: string) => Locale | null;
export declare const removeLocaleFromPathname: (pathname: string) => string;
export declare const addLocaleToPathname: (pathname: string, locale: Locale) => string;
//# sourceMappingURL=config.d.ts.map