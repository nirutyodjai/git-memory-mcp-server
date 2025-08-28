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
exports.default = LanguageSwitcher;
exports.useLanguageSwitcher = useLanguageSwitcher;
exports.LanguageInfo = LanguageInfo;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const i18n_provider_1 = require("@/components/providers/i18n-provider");
const config_1 = require("@/lib/i18n/config");
const languages = config_1.locales.map(locale => ({
    code: locale,
    name: config_1.localeNames[locale].name,
    nativeName: config_1.localeNames[locale].nativeName,
    flag: config_1.localeNames[locale].flag
}));
function LanguageSwitcher({ variant = 'dropdown', showFlag = true, showName = true, className = '', }) {
    const { locale, setLocale, isLoading } = (0, i18n_provider_1.useLocale)();
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const dropdownRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const handleLanguageChange = (langCode) => {
        setLocale(langCode);
        setIsOpen(false);
    };
    const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];
    if (variant === 'buttons') {
        return (<div className={`flex gap-2 ${className}`}>
        {languages.map((lang) => (<button key={lang.code} onClick={() => handleLanguageChange(lang.code)} disabled={isLoading} className={(0, utils_1.cn)('px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200', locale === lang.code
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700', isLoading && 'opacity-50 cursor-not-allowed')} title={lang.nativeName}>
            {showFlag && <span className="mr-1">{lang.flag}</span>}
            {showName && <span>{lang.code.toUpperCase()}</span>}
          </button>))}
      </div>);
    }
    if (variant === 'minimal') {
        return (<div className={`flex items-center gap-1 ${className}`}>
        <lucide_react_1.Globe className="w-4 h-4 text-gray-500"/>
        <select value={locale} onChange={(e) => handleLanguageChange(e.target.value)} disabled={isLoading} className={(0, utils_1.cn)('bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer', isLoading && 'opacity-50 cursor-not-allowed')}>
          {languages.map((lang) => (<option key={lang.code} value={lang.code}>
              {showFlag ? `${lang.flag} ${lang.nativeName}` : lang.nativeName}
            </option>))}
        </select>
      </div>);
    }
    // Default dropdown variant
    return (<div ref={dropdownRef} className={(0, utils_1.cn)('relative', className)}>
      <button onClick={() => setIsOpen(!isOpen)} disabled={isLoading} className={(0, utils_1.cn)('flex items-center gap-2 px-3 py-2 rounded-lg', 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700', 'text-gray-700 dark:text-gray-300', 'hover:bg-gray-50 dark:hover:bg-gray-700', 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2', 'transition-all duration-200', isLoading && 'opacity-50 cursor-not-allowed')} aria-expanded={isOpen} aria-haspopup="listbox">
        {showFlag && (<span className="text-lg" role="img" aria-label={currentLanguage.name}>
            {currentLanguage.flag}
          </span>)}
        {showName && (<span className="text-sm font-medium">
            {currentLanguage.nativeName}
          </span>)}
        <lucide_react_1.ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}/>
      </button>

      {isOpen && (<>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}/>
          
          {/* Dropdown Menu */}
          <div className="
            absolute top-full left-0 mt-2 w-48 z-20
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg
            py-1
          ">
            {languages.map((lang) => (<button key={lang.code} onClick={() => handleLanguageChange(lang.code)} disabled={isLoading} className={(0, utils_1.cn)('w-full flex items-center gap-3 px-4 py-2 text-left', 'hover:bg-gray-50 dark:hover:bg-gray-700', 'transition-colors duration-150', locale === lang.code
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300', isLoading && 'opacity-50 cursor-not-allowed')} role="option" aria-selected={locale === lang.code}>
                <span className="text-lg" role="img" aria-label={lang.name}>
                  {lang.flag}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {lang.name}
                  </span>
                </div>
                {locale === lang.code && (<lucide_react_1.Check className="ml-auto w-4 h-4"/>)}
              </button>))}
          </div>
        </>)}
    </div>);
}
// Hook สำหรับใช้งานง่ายๆ
function useLanguageSwitcher() {
    const { locale, setLocale, isLoading } = (0, i18n_provider_1.useLocale)();
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
function LanguageInfo({ className = '' }) {
    const { locale } = (0, i18n_provider_1.useLocale)();
    const language = languages.find(lang => lang.code === locale);
    if (!language)
        return null;
    return (<div className={(0, utils_1.cn)('flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400', className)}>
      <lucide_react_1.Globe className="w-4 h-4"/>
      <span>{language.flag} {language.nativeName}</span>
    </div>);
}
//# sourceMappingURL=language-switcher.js.map