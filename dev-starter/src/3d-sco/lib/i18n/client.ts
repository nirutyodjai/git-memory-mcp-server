'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, locales, Namespace } from './config';

type TranslationFunction = (key: string, options?: { [key: string]: any }) => string;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationFunction;
  isLoading: boolean;
  translations: Record<string, any>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

class TranslationStore {
  private static instance: TranslationStore;
  private translations: Map<string, Record<string, any>> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  static getInstance(): TranslationStore {
    if (!TranslationStore.instance) {
      TranslationStore.instance = new TranslationStore();
    }
    return TranslationStore.instance;
  }

  async loadTranslations(locale: Locale, namespace: Namespace): Promise<Record<string, any>> {
    const key = `${locale}-${namespace}`;
    
    if (this.translations.has(key)) {
      return this.translations.get(key)!;
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    const loadPromise = this.fetchTranslations(locale, namespace);
    this.loadingPromises.set(key, loadPromise);

    try {
      const translations = await loadPromise;
      this.translations.set(key, translations);
      this.loadingPromises.delete(key);
      return translations;
    } catch (error) {
      this.loadingPromises.delete(key);
      console.error(`Failed to load translations for ${locale}/${namespace}:`, error);
      // Fallback to default locale if available
      if (locale !== defaultLocale) {
        return this.loadTranslations(defaultLocale, namespace);
      }
      return {};
    }
  }

  private async fetchTranslations(locale: Locale, namespace: Namespace): Promise<Record<string, any>> {
    try {
      const response = await fetch(`/api/i18n/${locale}/${namespace}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Fallback to static import for development
      try {
        const module = await import(`./locales/${locale}/${namespace}.json`);
        return module.default;
      } catch (importError) {
        console.error(`Failed to import translations for ${locale}/${namespace}:`, importError);
        return {};
      }
    }
  }

  getTranslations(locale: Locale, namespace: Namespace): Record<string, any> | null {
    const key = `${locale}-${namespace}`;
    return this.translations.get(key) || null;
  }

  clearCache(): void {
    this.translations.clear();
    this.loadingPromises.clear();
  }
}

const translationStore = TranslationStore.getInstance();

export function useI18n(namespace: Namespace = 'common') {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  const { locale, setLocale, isLoading } = context;
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTranslations = async () => {
      setLoading(true);
      try {
        const trans = await translationStore.loadTranslations(locale, namespace);
        if (isMounted) {
          setTranslations(trans);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
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

  return {
    locale,
    setLocale,
    t,
    isLoading: isLoading || loading,
    translations
  };
}

export function useTranslation(namespace: Namespace = 'common') {
  return useI18n(namespace);
}

export function useLocale() {
  const context = useContext(I18nContext);
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
export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  try {
    const stored = localStorage.getItem('locale');
    if (stored && locales.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch (error) {
    console.error('Failed to get stored locale:', error);
  }
  
  return defaultLocale;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('locale', locale);
  } catch (error) {
    console.error('Failed to store locale:', error);
  }
}

export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const browserLang = navigator.language.split('-')[0];
  return locales.includes(browserLang as Locale) ? browserLang as Locale : defaultLocale;
}

export { I18nContext, translationStore };