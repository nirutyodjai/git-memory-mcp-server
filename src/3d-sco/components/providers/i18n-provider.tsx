'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, locales } from '@/lib/i18n/config';
import { getStoredLocale, setStoredLocale, getBrowserLocale } from '@/lib/i18n/client';

type TranslationFunction = (key: string, options?: { [key: string]: any }) => string;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationFunction;
  isLoading: boolean;
  translations: Record<string, any>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    if (typeof window !== 'undefined') {
      return getStoredLocale() || getBrowserLocale();
    }
    return defaultLocale;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [translations, setTranslations] = useState<Record<string, any>>({});

  const setLocale = (newLocale: Locale) => {
    if (!locales.includes(newLocale)) {
      console.warn(`Locale '${newLocale}' is not supported. Using default locale '${defaultLocale}'.`);
      newLocale = defaultLocale;
    }
    
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
    
    // Update document language
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
    
    // Update cookie for server-side rendering
    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  const t: TranslationFunction = (key: string, options = {}) => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
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
  useEffect(() => {
    const loadInitialTranslations = async () => {
      setIsLoading(true);
      try {
        // Load common translations by default
        const commonTranslations = await import(`@/lib/i18n/locales/${locale}/common.json`);
        const navigationTranslations = await import(`@/lib/i18n/locales/${locale}/navigation.json`);
        
        setTranslations({
          common: commonTranslations.default,
          navigation: navigationTranslations.default
        });
      } catch (error) {
        console.error('Failed to load initial translations:', error);
        // Fallback to default locale
        if (locale !== defaultLocale) {
          try {
            const commonTranslations = await import(`@/lib/i18n/locales/${defaultLocale}/common.json`);
            const navigationTranslations = await import(`@/lib/i18n/locales/${defaultLocale}/navigation.json`);
            
            setTranslations({
              common: commonTranslations.default,
              navigation: navigationTranslations.default
            });
          } catch (fallbackError) {
            console.error('Failed to load fallback translations:', fallbackError);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialTranslations();
  }, [locale]);

  // Set document language on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const contextValue: I18nContextType = {
    locale,
    setLocale,
    t,
    isLoading,
    translations
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation(namespace: string = 'common') {
  const { locale, t: globalT, isLoading, translations } = useI18n();
  
  const t = (key: string, options?: { [key: string]: any }) => {
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

export function useLocale() {
  const { locale, setLocale, isLoading } = useI18n();
  return { locale, setLocale, isLoading };
}

export { I18nContext };