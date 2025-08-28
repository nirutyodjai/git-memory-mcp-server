import { Locale, Namespace } from './config';
type TranslationFunction = (key: string, options?: {
    [key: string]: any;
}) => string;
declare const I18nContext: any;
declare class TranslationStore {
    private static instance;
    private translations;
    private loadingPromises;
    static getInstance(): TranslationStore;
    loadTranslations(locale: Locale, namespace: Namespace): Promise<Record<string, any>>;
    private fetchTranslations;
    getTranslations(locale: Locale, namespace: Namespace): Record<string, any> | null;
    clearCache(): void;
}
declare const translationStore: TranslationStore;
export declare function useI18n(namespace?: Namespace): {
    locale: any;
    setLocale: any;
    t: TranslationFunction;
    isLoading: any;
    translations: any;
};
export declare function useTranslation(namespace?: Namespace): {
    locale: any;
    setLocale: any;
    t: TranslationFunction;
    isLoading: any;
    translations: any;
};
export declare function useLocale(): {
    locale: any;
    setLocale: any;
    isLoading: any;
};
export declare function getStoredLocale(): Locale;
export declare function setStoredLocale(locale: Locale): void;
export declare function getBrowserLocale(): Locale;
export { I18nContext, translationStore };
//# sourceMappingURL=client.d.ts.map