import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ภาษาที่รองรับ
export const supportedLanguages = {
  th: {
    name: 'ไทย',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    dir: 'ltr',
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    dir: 'ltr',
  },
  ko: {
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    dir: 'ltr',
  },
  zh: {
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    dir: 'ltr',
  },
};

export const defaultLanguage = 'th';
export const fallbackLanguage = 'en';

// Translation resources (embedded for client-side)
const resources = {
  th: {
    common: {
      "navigation": {
        "home": "หน้าแรก",
        "about": "เกี่ยวกับ",
        "projects": "โปรเจกต์",
        "blog": "บล็อก",
        "contact": "ติดต่อ",
        "admin": "ผู้ดูแลระบบ"
      },
      "buttons": {
        "submit": "ส่ง",
        "cancel": "ยกเลิก",
        "save": "บันทึก",
        "edit": "แก้ไข",
        "delete": "ลบ",
        "view": "ดู",
        "download": "ดาวน์โหลด",
        "upload": "อัปโหลด",
        "search": "ค้นหา",
        "filter": "กรอง",
        "reset": "รีเซ็ต",
        "back": "กลับ",
        "next": "ถัดไป",
        "previous": "ก่อนหน้า",
        "close": "ปิด",
        "open": "เปิด",
        "login": "เข้าสู่ระบบ",
        "logout": "ออกจากระบบ",
        "register": "สมัครสมาชิก",
        "subscribe": "สมัครรับข่าวสาร",
        "unsubscribe": "ยกเลิกการสมัคร"
      }
    },
    home: {
      "hero": {
        "title": "สร้างสรรค์โลกดิจิทัลด้วย 3D และเทคโนโลยี",
        "subtitle": "นักพัฒนาเว็บแอปพลิเคชันและนักออกแบบ 3D ที่มีประสบการณ์ในการสร้างประสบการณ์ดิจิทัลที่น่าประทับใจ",
        "cta": "ดูผลงานของฉัน",
        "secondary_cta": "ติดต่อฉัน"
      }
    }
  },
  en: {
    common: {
      "navigation": {
        "home": "Home",
        "about": "About",
        "projects": "Projects",
        "blog": "Blog",
        "contact": "Contact",
        "admin": "Admin"
      },
      "buttons": {
        "submit": "Submit",
        "cancel": "Cancel",
        "save": "Save",
        "edit": "Edit",
        "delete": "Delete",
        "view": "View",
        "download": "Download",
        "upload": "Upload",
        "search": "Search",
        "filter": "Filter",
        "reset": "Reset",
        "back": "Back",
        "next": "Next",
        "previous": "Previous",
        "close": "Close",
        "open": "Open",
        "login": "Login",
        "logout": "Logout",
        "register": "Register",
        "subscribe": "Subscribe",
        "unsubscribe": "Unsubscribe"
      }
    },
    home: {
      "hero": {
        "title": "Creating Digital Worlds with 3D & Technology",
        "subtitle": "Web Application Developer & 3D Designer with experience in creating impressive digital experiences",
        "cta": "View My Work",
        "secondary_cta": "Contact Me"
      }
    }
  }
};

// การตั้งค่า i18next
const createI18nInstance = () => {
  const i18n = createInstance();
  
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      lng: defaultLanguage,
      fallbackLng: fallbackLanguage,
      debug: process.env.NODE_ENV === 'development',
      
      // การตรวจจับภาษา
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
      
      // namespace
      ns: ['common', 'navigation', 'home', 'about', 'projects', 'blog', 'contact', 'admin'],
      defaultNS: 'common',
      
      interpolation: {
        escapeValue: false,
      },
      
      react: {
        useSuspense: false,
      },
      
      // Embedded resources
      resources,
    });
    
  return i18n;
};

export const i18n = createI18nInstance();

// Helper functions
export const getCurrentLanguage = () => {
  return i18n.language || defaultLanguage;
};

export const changeLanguage = (lng: string) => {
  return i18n.changeLanguage(lng);
};

export const isRTL = (lng?: string) => {
  const language = lng || getCurrentLanguage();
  return supportedLanguages[language as keyof typeof supportedLanguages]?.dir === 'rtl';
};

// Format functions
export const formatDate = (date: Date | string, lng?: string) => {
  const language = lng || getCurrentLanguage();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(language, formatOptions).format(dateObj);
};

export const formatNumber = (number: number, lng?: string) => {
  const language = lng || getCurrentLanguage();
  return new Intl.NumberFormat(language).format(number);
};

export const formatCurrency = (amount: number, currency = 'THB', lng?: string) => {
  const language = lng || getCurrentLanguage();
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
  }).format(amount);
};

// Translation keys type safety
export type TranslationKeys = {
  common: {
    loading: string;
    error: string;
    success: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    view: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    filter: string;
    sort: string;
    clear: string;
    submit: string;
    close: string;
    open: string;
    yes: string;
    no: string;
    ok: string;
    confirm: string;
    warning: string;
    info: string;
    required: string;
    optional: string;
    selectAll: string;
    deselectAll: string;
    noData: string;
    comingSoon: string;
  };
  navigation: {
    home: string;
    about: string;
    projects: string;
    blog: string;
    contact: string;
    admin: string;
    login: string;
    logout: string;
    profile: string;
    settings: string;
    dashboard: string;
  };
  home: {
    hero: {
      title: string;
      subtitle: string;
      description: string;
      cta: string;
      learnMore: string;
    };
    features: {
      title: string;
      subtitle: string;
    };
    testimonials: {
      title: string;
      subtitle: string;
    };
    cta: {
      title: string;
      subtitle: string;
      button: string;
    };
  };
  about: {
    title: string;
    subtitle: string;
    description: string;
    skills: {
      title: string;
      subtitle: string;
    };
    experience: {
      title: string;
      subtitle: string;
    };
    education: {
      title: string;
      subtitle: string;
    };
  };
  projects: {
    title: string;
    subtitle: string;
    categories: {
      all: string;
      web: string;
      mobile: string;
      desktop: string;
      '3d': string;
    };
    status: {
      planning: string;
      inProgress: string;
      completed: string;
      onHold: string;
    };
    details: {
      client: string;
      duration: string;
      technologies: string;
      category: string;
      status: string;
      budget: string;
      team: string;
      description: string;
      features: string;
      challenges: string;
      results: string;
      gallery: string;
      relatedProjects: string;
    };
  };
  blog: {
    title: string;
    subtitle: string;
    readMore: string;
    readTime: string;
    publishedOn: string;
    author: string;
    category: string;
    tags: string;
    relatedPosts: string;
    comments: string;
    share: string;
    newsletter: {
      title: string;
      subtitle: string;
      placeholder: string;
      button: string;
      success: string;
      error: string;
    };
  };
  contact: {
    title: string;
    subtitle: string;
    form: {
      name: string;
      email: string;
      subject: string;
      message: string;
      send: string;
      sending: string;
      success: string;
      error: string;
    };
    info: {
      address: string;
      phone: string;
      email: string;
      social: string;
    };
  };
  admin: {
    dashboard: {
      title: string;
      welcome: string;
      stats: {
        projects: string;
        blogPosts: string;
        subscribers: string;
        uploads: string;
      };
    };
    projects: {
      title: string;
      create: string;
      edit: string;
      delete: string;
      status: string;
      category: string;
    };
    blog: {
      title: string;
      create: string;
      edit: string;
      delete: string;
      publish: string;
      draft: string;
      categories: string;
      tags: string;
    };
    uploads: {
      title: string;
      upload: string;
      delete: string;
      manage: string;
    };
    backup: {
      title: string;
      create: string;
      restore: string;
      download: string;
      schedule: string;
    };
    settings: {
      title: string;
      general: string;
      security: string;
      notifications: string;
      language: string;
      theme: string;
    };
  };
};

export default i18n;