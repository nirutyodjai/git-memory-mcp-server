import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';
declare const I18nContext: any;
interface I18nProviderProps {
    children: ReactNode;
    initialLocale?: Locale;
}
export declare function I18nProvider({ children, initialLocale }: I18nProviderProps): any;
export declare function useI18n(): any;
export declare function useTranslation(namespace?: string): {
    t: (key: string, options?: {
        [key: string]: any;
    }) => any;
    locale: any;
    isLoading: any;
    translations: any;
};
export declare function useLocale(): {
    locale: any;
    setLocale: any;
    isLoading: any;
};
export { I18nContext };
//# sourceMappingURL=i18n-provider.d.ts.map