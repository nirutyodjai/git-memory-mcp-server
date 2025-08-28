import { Locale } from '@/lib/i18n/config';
interface Language {
    code: Locale;
    name: string;
    nativeName: string;
    flag: string;
}
interface LanguageSwitcherProps {
    variant?: 'dropdown' | 'buttons' | 'minimal';
    showFlag?: boolean;
    showName?: boolean;
    className?: string;
}
export default function LanguageSwitcher({ variant, showFlag, showName, className, }: LanguageSwitcherProps): any;
export declare function useLanguageSwitcher(): {
    currentLanguage: any;
    currentLanguageData: Language;
    languages: Language[];
    changeLanguage: any;
    isLoading: any;
};
export declare function LanguageInfo({ className }: {
    className?: string;
}): any;
export {};
//# sourceMappingURL=language-switcher.d.ts.map