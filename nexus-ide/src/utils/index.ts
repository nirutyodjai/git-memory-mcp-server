// Utility functions for NEXUS IDE

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// CSS class utilities
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// String utilities
export const stringUtils = {
  /**
   * Capitalize first letter of a string
   */
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Convert string to camelCase
   */
  toCamelCase: (str: string): string => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  },

  /**
   * Convert string to kebab-case
   */
  toKebabCase: (str: string): string => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  },

  /**
   * Convert string to snake_case
   */
  toSnakeCase: (str: string): string => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  },

  /**
   * Truncate string with ellipsis
   */
  truncate: (str: string, length: number, suffix = '...'): string => {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  },

  /**
   * Generate random string
   */
  random: (length = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Generate UUID v4
   */
  uuid: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Escape HTML characters
   */
  escapeHtml: (str: string): string => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Remove HTML tags
   */
  stripHtml: (str: string): string => {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || div.innerText || '';
  },

  /**
   * Pluralize word based on count
   */
  pluralize: (word: string, count: number, suffix = 's'): string => {
    return count === 1 ? word : word + suffix;
  },

  /**
   * Extract file extension from filename
   */
  getFileExtension: (filename: string): string => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  },

  /**
   * Get filename without extension
   */
  getFileNameWithoutExtension: (filename: string): string => {
    return filename.replace(/\.[^/.]+$/, '');
  }
};

// Number utilities
export const numberUtils = {
  /**
   * Format number with commas
   */
  formatWithCommas: (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  /**
   * Format bytes to human readable format
   */
  formatBytes: (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Clamp number between min and max
   */
  clamp: (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
  },

  /**
   * Generate random number between min and max
   */
  random: (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  },

  /**
   * Generate random integer between min and max
   */
  randomInt: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Round number to specified decimal places
   */
  round: (num: number, decimals = 0): number => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  /**
   * Check if number is in range
   */
  inRange: (num: number, min: number, max: number): boolean => {
    return num >= min && num <= max;
  },

  /**
   * Convert percentage to decimal
   */
  percentToDecimal: (percent: number): number => {
    return percent / 100;
  },

  /**
   * Convert decimal to percentage
   */
  decimalToPercent: (decimal: number): number => {
    return decimal * 100;
  }
};

// Date utilities
export const dateUtils = {
  /**
   * Format date to relative time (e.g., "2 hours ago")
   */
  formatRelative: (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${years} year${years > 1 ? 's' : ''} ago`;
  },

  /**
   * Format date to ISO string
   */
  toISOString: (date: Date): string => {
    return date.toISOString();
  },

  /**
   * Format date to locale string
   */
  toLocaleString: (date: Date, locale = 'en-US', options?: Intl.DateTimeFormatOptions): string => {
    return date.toLocaleString(locale, options);
  },

  /**
   * Check if date is today
   */
  isToday: (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  /**
   * Check if date is yesterday
   */
  isYesterday: (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  },

  /**
   * Get start of day
   */
  startOfDay: (date: Date): Date => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  },

  /**
   * Get end of day
   */
  endOfDay: (date: Date): Date => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  },

  /**
   * Add days to date
   */
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Add hours to date
   */
  addHours: (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  },

  /**
   * Add minutes to date
   */
  addMinutes: (date: Date, minutes: number): Date => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }
};

// Array utilities
export const arrayUtils = {
  /**
   * Remove duplicates from array
   */
  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  /**
   * Remove duplicates by key
   */
  uniqueBy: <T>(array: T[], key: keyof T): T[] => {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  /**
   * Group array by key
   */
  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      if (!groups[value]) groups[value] = [];
      groups[value].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  /**
   * Sort array by key
   */
  sortBy: <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Flatten nested array
   */
  flatten: <T>(array: (T | T[])[]): T[] => {
    return array.reduce((flat, item) => {
      return flat.concat(Array.isArray(item) ? arrayUtils.flatten(item) : item);
    }, [] as T[]);
  },

  /**
   * Get random item from array
   */
  random: <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  },

  /**
   * Shuffle array
   */
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Get intersection of two arrays
   */
  intersection: <T>(array1: T[], array2: T[]): T[] => {
    return array1.filter(item => array2.includes(item));
  },

  /**
   * Get difference of two arrays
   */
  difference: <T>(array1: T[], array2: T[]): T[] => {
    return array1.filter(item => !array2.includes(item));
  }
};

// Object utilities
export const objectUtils = {
  /**
   * Deep clone object
   */
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (obj instanceof Array) return obj.map(item => objectUtils.deepClone(item)) as unknown as T;
    if (typeof obj === 'object') {
      const cloned = {} as T;
      Object.keys(obj).forEach(key => {
        (cloned as any)[key] = objectUtils.deepClone((obj as any)[key]);
      });
      return cloned;
    }
    return obj;
  },

  /**
   * Deep merge objects
   */
  deepMerge: <T>(target: T, ...sources: Partial<T>[]): T => {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (objectUtils.isObject(target) && objectUtils.isObject(source)) {
      for (const key in source) {
        if (objectUtils.isObject(source[key])) {
          if (!(target as any)[key]) Object.assign(target as any, { [key]: {} });
          objectUtils.deepMerge((target as any)[key], source[key]);
        } else {
          Object.assign(target as any, { [key]: source[key] });
        }
      }
    }
    
    return objectUtils.deepMerge(target, ...sources);
  },

  /**
   * Check if value is object
   */
  isObject: (item: any): boolean => {
    return item && typeof item === 'object' && !Array.isArray(item);
  },

  /**
   * Get nested property value
   */
  get: (obj: any, path: string, defaultValue?: any): any => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  },

  /**
   * Set nested property value
   */
  set: (obj: any, path: string, value: any): void => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || !objectUtils.isObject(current[key])) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  },

  /**
   * Pick properties from object
   */
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  /**
   * Omit properties from object
   */
  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  /**
   * Check if object is empty
   */
  isEmpty: (obj: any): boolean => {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }
};

// Function utilities
export const functionUtils = {
  /**
   * Debounce function
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;
    
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      
      const callNow = immediate && !timeout;
      
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func(...args);
    };
  },

  /**
   * Throttle function
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    
    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Memoize function
   */
  memoize: <T extends (...args: any[]) => any>(func: T): T => {
    const cache = new Map();
    
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  /**
   * Retry function with exponential backoff
   */
  retry: async <T>(
    func: () => Promise<T>,
    maxAttempts = 3,
    baseDelay = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await func();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  },

  /**
   * Create async function with timeout
   */
  withTimeout: <T>(
    func: () => Promise<T>,
    timeout: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> => {
    return Promise.race([
      func(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeout);
      })
    ]);
  }
};

// Local storage utilities
export const storageUtils = {
  /**
   * Get item from localStorage with JSON parsing
   */
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue || null;
      return JSON.parse(item);
    } catch {
      return defaultValue || null;
    }
  },

  /**
   * Set item in localStorage with JSON stringifying
   */
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  /**
   * Remove item from localStorage
   */
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  /**
   * Clear all localStorage
   */
  clear: (): void => {
    localStorage.clear();
  },

  /**
   * Get all keys from localStorage
   */
  keys: (): string[] => {
    return Object.keys(localStorage);
  },

  /**
   * Check if key exists in localStorage
   */
  has: (key: string): boolean => {
    return localStorage.getItem(key) !== null;
  }
};

// URL utilities
export const urlUtils = {
  /**
   * Parse URL parameters
   */
  parseParams: (url: string): Record<string, string> => {
    const params: Record<string, string> = {};
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  },

  /**
   * Build URL with parameters
   */
  buildUrl: (baseUrl: string, params: Record<string, any>): string => {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    return url.toString();
  },

  /**
   * Check if URL is valid
   */
  isValid: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get domain from URL
   */
  getDomain: (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  },

  /**
   * Join URL paths
   */
  joinPaths: (...paths: string[]): string => {
    return paths
      .map(path => path.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  }
};

// Color utilities
export const colorUtils = {
  /**
   * Convert hex to RGB
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  },

  /**
   * Convert RGB to hex
   */
  rgbToHex: (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },

  /**
   * Generate random color
   */
  random: (): string => {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  },

  /**
   * Check if color is light
   */
  isLight: (hex: string): boolean => {
    const rgb = colorUtils.hexToRgb(hex);
    if (!rgb) return false;
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128;
  },

  /**
   * Get contrast color (black or white)
   */
  getContrast: (hex: string): string => {
    return colorUtils.isLight(hex) ? '#000000' : '#ffffff';
  }
};

// Validation utilities
export const validationUtils = {
  /**
   * Validate email
   */
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL
   */
  isUrl: (url: string): boolean => {
    return urlUtils.isValid(url);
  },

  /**
   * Validate phone number
   */
  isPhone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },

  /**
   * Validate credit card number
   */
  isCreditCard: (number: string): boolean => {
    const cleaned = number.replace(/\s/g, '');
    const cardRegex = /^[0-9]{13,19}$/;
    return cardRegex.test(cleaned);
  },

  /**
   * Validate password strength
   */
  isStrongPassword: (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }
};

// Export all utilities
export {
  stringUtils,
  numberUtils,
  dateUtils,
  arrayUtils,
  objectUtils,
  functionUtils,
  storageUtils,
  urlUtils,
  colorUtils,
  validationUtils
};

// Default export
export default {
  cn,
  string: stringUtils,
  number: numberUtils,
  date: dateUtils,
  array: arrayUtils,
  object: objectUtils,
  function: functionUtils,
  storage: storageUtils,
  url: urlUtils,
  color: colorUtils,
  validation: validationUtils
};