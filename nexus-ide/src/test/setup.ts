/**
 * Test Setup Configuration for NEXUS IDE
 * 
 * This file configures the testing environment for Vitest,
 * including DOM setup, mocks, and global test utilities.
 */

import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Global test setup
beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'error' });
  
  // Mock console methods in tests
  if (import.meta.env.MODE === 'test') {
    // Suppress console.log in tests unless explicitly needed
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    
    // Keep console.warn and console.error for debugging
    // vi.spyOn(console, 'warn').mockImplementation(() => {});
    // vi.spyOn(console, 'error').mockImplementation(() => {});
  }
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }));
  
  // Mock MutationObserver
  global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(),
  }));
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn().mockImplementation(cb => {
    return setTimeout(cb, 16);
  });
  
  global.cancelAnimationFrame = vi.fn().mockImplementation(id => {
    clearTimeout(id);
  });
  
  // Mock requestIdleCallback
  global.requestIdleCallback = vi.fn().mockImplementation(cb => {
    return setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);
  });
  
  global.cancelIdleCallback = vi.fn().mockImplementation(id => {
    clearTimeout(id);
  });
  
  // Mock scrollTo
  global.scrollTo = vi.fn();
  
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
  
  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });
  
  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn().mockReturnValue('mocked-url');
  global.URL.revokeObjectURL = vi.fn();
  
  // Mock Blob
  global.Blob = vi.fn().mockImplementation((content, options) => ({
    content,
    options,
    size: content ? content.length : 0,
    type: options?.type || '',
  }));
  
  // Mock File
  global.File = vi.fn().mockImplementation((content, name, options) => ({
    content,
    name,
    options,
    size: content ? content.length : 0,
    type: options?.type || '',
    lastModified: Date.now(),
  }));
  
  // Mock FileReader
  global.FileReader = vi.fn().mockImplementation(() => ({
    readAsText: vi.fn(),
    readAsDataURL: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    readAsBinaryString: vi.fn(),
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null,
    result: null,
    error: null,
    readyState: 0,
    EMPTY: 0,
    LOADING: 1,
    DONE: 2,
  }));
  
  // Mock Clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue([]),
    },
    writable: true,
  });
  
  // Mock Notification API
  global.Notification = vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    onclick: null,
    onclose: null,
    onerror: null,
    onshow: null,
  }));
  
  Object.defineProperty(Notification, 'permission', {
    value: 'granted',
    writable: true,
  });
  
  Notification.requestPermission = vi.fn().mockResolvedValue('granted');
  
  // Mock WebSocket
  global.WebSocket = vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  }));
  
  // Mock Worker
  global.Worker = vi.fn().mockImplementation(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onmessage: null,
    onerror: null,
  }));
  
  // Mock SharedWorker
  global.SharedWorker = vi.fn().mockImplementation(() => ({
    port: {
      postMessage: vi.fn(),
      start: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onmessage: null,
    },
    onerror: null,
  }));
  
  // Mock ServiceWorker
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: vi.fn().mockResolvedValue({
        installing: null,
        waiting: null,
        active: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
      ready: Promise.resolve({
        installing: null,
        waiting: null,
        active: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
      controller: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    writable: true,
  });
  
  // Mock Performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn().mockReturnValue(Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn().mockReturnValue([]),
      getEntriesByType: vi.fn().mockReturnValue([]),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    },
    writable: true,
  });
  
  // Mock crypto API
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn().mockReturnValue('mocked-uuid'),
      getRandomValues: vi.fn().mockImplementation(arr => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    },
    writable: true,
  });
});

// Clean up after each test
afterEach(() => {
  // Clean up DOM
  cleanup();
  
  // Reset MSW handlers
  server.resetHandlers();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
});

// Global test teardown
afterAll(() => {
  // Stop MSW server
  server.close();
  
  // Restore all mocks
  vi.restoreAllMocks();
});

// Global test utilities
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeInTheDocument(): T;
      toHaveClass(className: string): T;
      toHaveStyle(style: Record<string, any>): T;
      toHaveAttribute(attr: string, value?: string): T;
      toHaveTextContent(text: string | RegExp): T;
      toBeVisible(): T;
      toBeDisabled(): T;
      toBeEnabled(): T;
      toHaveValue(value: string | number): T;
      toBeChecked(): T;
      toHaveFocus(): T;
      toBeEmptyDOMElement(): T;
      toContainElement(element: HTMLElement | null): T;
    }
  }
}

// Export test utilities
export * from '@testing-library/react';
export * from '@testing-library/user-event';
export { expect, vi } from 'vitest';