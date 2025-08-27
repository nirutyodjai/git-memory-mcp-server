export const defaultLocale = 'th' as const;
export const locales = ['th', 'en', 'zh', 'ja'] as const;

export type Locale = typeof locales[number];

export const localeNames: Record<Locale, { name: string; nativeName: string; flag: string }> = {
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

export const i18nConfig = {
  defaultLocale,
  locales,
  localeDetection: true,
  cookieName: 'NEXT_LOCALE',
  localePath: './src/lib/i18n/locales',
  fallbackLng: defaultLocale,
  debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false
  },
  react: {
    useSuspense: false
  }
};

export const namespaces = [
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
] as const;

export type Namespace = typeof namespaces[number];

export const getLocaleFromPathname = (pathname: string): Locale | null => {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  if (locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale;
  }
  
  return null;
};

export const removeLocaleFromPathname = (pathname: string): string => {
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/';
  }
  return pathname;
};

export const addLocaleToPathname = (pathname: string, locale: Locale): string => {
  const cleanPathname = removeLocaleFromPathname(pathname);
  if (locale === defaultLocale) {
    return cleanPathname;
  }
  return `/${locale}${cleanPathname}`;
};