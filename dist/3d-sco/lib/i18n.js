"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = exports.formatNumber = exports.formatDate = exports.isRTL = exports.changeLanguage = exports.getCurrentLanguage = exports.i18n = exports.fallbackLanguage = exports.defaultLanguage = exports.supportedLanguages = void 0;
const i18next_1 = require("i18next");
const react_i18next_1 = require("react-i18next");
const i18next_browser_languagedetector_1 = __importDefault(require("i18next-browser-languagedetector"));
// ภาษาที่รองรับ
exports.supportedLanguages = {
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
exports.defaultLanguage = 'th';
exports.fallbackLanguage = 'en';
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
    const i18n = (0, i18next_1.createInstance)();
    i18n
        .use(i18next_browser_languagedetector_1.default)
        .use(react_i18next_1.initReactI18next)
        .init({
        lng: exports.defaultLanguage,
        fallbackLng: exports.fallbackLanguage,
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
exports.i18n = createI18nInstance();
// Helper functions
const getCurrentLanguage = () => {
    return exports.i18n.language || exports.defaultLanguage;
};
exports.getCurrentLanguage = getCurrentLanguage;
const changeLanguage = (lng) => {
    return exports.i18n.changeLanguage(lng);
};
exports.changeLanguage = changeLanguage;
const isRTL = (lng) => {
    const language = lng || (0, exports.getCurrentLanguage)();
    return exports.supportedLanguages[language]?.dir === 'rtl';
};
exports.isRTL = isRTL;
// Format functions
const formatDate = (date, lng) => {
    const language = lng || (0, exports.getCurrentLanguage)();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return new Intl.DateTimeFormat(language, formatOptions).format(dateObj);
};
exports.formatDate = formatDate;
const formatNumber = (number, lng) => {
    const language = lng || (0, exports.getCurrentLanguage)();
    return new Intl.NumberFormat(language).format(number);
};
exports.formatNumber = formatNumber;
const formatCurrency = (amount, currency = 'THB', lng) => {
    const language = lng || (0, exports.getCurrentLanguage)();
    return new Intl.NumberFormat(language, {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
exports.default = exports.i18n;
//# sourceMappingURL=i18n.js.map