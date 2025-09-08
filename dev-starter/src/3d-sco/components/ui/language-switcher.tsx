'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/i18n-provider';
import { locales, localeNames, Locale } from '@/lib/i18n/config';

interface Language {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = locales.map(locale => ({
  code: locale,
  name: localeNames[locale].name,
  nativeName: localeNames[locale].nativeName,
  flag: localeNames[locale].flag
}));

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'minimal';
  showFlag?: boolean;
  showName?: boolean;
  className?: string;
}

export default function LanguageSwitcher({
  variant = 'dropdown',
  showFlag = true,
  showName = true,
  className = '',
}: LanguageSwitcherProps) {
  const { locale, setLocale, isLoading } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (langCode: Locale) => {
    setLocale(langCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isLoading}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              locale === lang.code
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
            title={lang.nativeName}
          >
            {showFlag && <span className="mr-1">{lang.flag}</span>}
            {showName && <span>{lang.code.toUpperCase()}</span>}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Globe className="w-4 h-4 text-gray-500" />
        <select
          value={locale}
          onChange={(e) => handleLanguageChange(e.target.value as Locale)}
          disabled={isLoading}
          className={cn(
            'bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {showFlag ? `${lang.flag} ${lang.nativeName}` : lang.nativeName}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-gray-50 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'transition-all duration-200',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showFlag && (
          <span className="text-lg" role="img" aria-label={currentLanguage.name}>
            {currentLanguage.flag}
          </span>
        )}
        {showName && (
          <span className="text-sm font-medium">
            {currentLanguage.nativeName}
          </span>
        )}
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="
            absolute top-full left-0 mt-2 w-48 z-20
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg
            py-1
          ">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-left',
                  'hover:bg-gray-50 dark:hover:bg-gray-700',
                  'transition-colors duration-150',
                  locale === lang.code
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
                role="option"
                aria-selected={locale === lang.code}
              >
                <span className="text-lg" role="img" aria-label={lang.name}>
                  {lang.flag}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {lang.name}
                  </span>
                </div>
                {locale === lang.code && (
                  <Check className="ml-auto w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Hook สำหรับใช้งานง่ายๆ
export function useLanguageSwitcher() {
  const { locale, setLocale, isLoading } = useLocale();
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];
  
  return {
    currentLanguage: locale,
    currentLanguageData: currentLanguage,
    languages,
    changeLanguage: setLocale,
    isLoading,
  };
}

// คอมโพเนนต์สำหรับแสดงข้อมูลภาษาปัจจุบัน
export function LanguageInfo({ className = '' }: { className?: string }) {
  const { locale } = useLocale();
  const language = languages.find(lang => lang.code === locale);
  
  if (!language) return null;
  
  return (
    <div className={cn('flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400', className)}>
      <Globe className="w-4 h-4" />
      <span>{language.flag} {language.nativeName}</span>
    </div>
  );
}