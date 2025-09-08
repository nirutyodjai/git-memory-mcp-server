// Custom hooks for NEXUS IDE

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce, throttle } from '../utils';

// Local storage hook
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// Session storage hook
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled value hook
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Previous value hook
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Toggle hook
export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(v => !v), []);
  const setToggle = useCallback((value: boolean) => setValue(value), []);
  
  return [value, toggle, setToggle];
}

// Counter hook
export function useCounter(
  initialValue = 0
): {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
} {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  const set = useCallback((value: number) => setCount(value), []);

  return { count, increment, decrement, reset, set };
}

// Array hook
export function useArray<T>(initialValue: T[] = []): {
  value: T[];
  push: (item: T) => void;
  pop: () => T | undefined;
  shift: () => T | undefined;
  unshift: (item: T) => void;
  clear: () => void;
  set: (value: T[]) => void;
  remove: (index: number) => void;
  filter: (callback: (item: T, index: number) => boolean) => void;
  update: (index: number, item: T) => void;
} {
  const [value, setValue] = useState<T[]>(initialValue);

  const push = useCallback((item: T) => {
    setValue(arr => [...arr, item]);
  }, []);

  const pop = useCallback(() => {
    let poppedItem: T | undefined;
    setValue(arr => {
      const newArr = [...arr];
      poppedItem = newArr.pop();
      return newArr;
    });
    return poppedItem;
  }, []);

  const shift = useCallback(() => {
    let shiftedItem: T | undefined;
    setValue(arr => {
      const newArr = [...arr];
      shiftedItem = newArr.shift();
      return newArr;
    });
    return shiftedItem;
  }, []);

  const unshift = useCallback((item: T) => {
    setValue(arr => [item, ...arr]);
  }, []);

  const clear = useCallback(() => {
    setValue([]);
  }, []);

  const set = useCallback((newValue: T[]) => {
    setValue(newValue);
  }, []);

  const remove = useCallback((index: number) => {
    setValue(arr => arr.filter((_, i) => i !== index));
  }, []);

  const filter = useCallback((callback: (item: T, index: number) => boolean) => {
    setValue(arr => arr.filter(callback));
  }, []);

  const update = useCallback((index: number, item: T) => {
    setValue(arr => arr.map((existingItem, i) => i === index ? item : existingItem));
  }, []);

  return {
    value,
    push,
    pop,
    shift,
    unshift,
    clear,
    set,
    remove,
    filter,
    update
  };
}

// Async hook
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true
): {
  execute: () => Promise<void>;
  loading: boolean;
  value: T | null;
  error: E | null;
} {
  const [loading, setLoading] = useState<boolean>(immediate);
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setValue(null);
    setError(null);

    try {
      const result = await asyncFunction();
      setValue(result);
    } catch (error) {
      setError(error as E);
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, loading, value, error };
}

// Fetch hook
export function useFetch<T>(
  url: string,
  options?: RequestInit
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Window size hook
export function useWindowSize(): { width: number; height: number } {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Online status hook
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Clipboard hook
export function useClipboard(): {
  copy: (text: string) => Promise<boolean>;
  paste: () => Promise<string>;
  isSupported: boolean;
} {
  const isSupported = navigator.clipboard && window.isSecureContext;

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, [isSupported]);

  const paste = useCallback(async (): Promise<string> => {
    if (!isSupported) return '';

    try {
      return await navigator.clipboard.readText();
    } catch {
      return '';
    }
  }, [isSupported]);

  return { copy, paste, isSupported };
}

// Intersection observer hook
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, options]);

  return entry;
}

// Mutation observer hook
export function useMutationObserver(
  targetRef: React.RefObject<Node>,
  callback: MutationCallback,
  options?: MutationObserverInit
): void {
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new MutationObserver(callback);
    observer.observe(target, options);

    return () => observer.disconnect();
  }, [targetRef, callback, options]);
}

// Resize observer hook
export function useResizeObserver(
  elementRef: React.RefObject<Element>,
  callback: ResizeObserverCallback
): void {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new ResizeObserver(callback);
    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, callback]);
}

// Idle hook
export function useIdle(timeout = 5000): boolean {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleActivity = () => {
      setIsIdle(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsIdle(true), timeout);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    timeoutId = setTimeout(() => setIsIdle(true), timeout);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimeout(timeoutId);
    };
  }, [timeout]);

  return isIdle;
}

// Keyboard shortcut hook
export function useKeyboardShortcut(
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  options?: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    target?: EventTarget;
  }
): void {
  const { preventDefault = true, stopPropagation = true, target = document } = options || {};

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKeys = [];
      
      if (event.ctrlKey) pressedKeys.push('ctrl');
      if (event.shiftKey) pressedKeys.push('shift');
      if (event.altKey) pressedKeys.push('alt');
      if (event.metaKey) pressedKeys.push('meta');
      
      pressedKeys.push(event.key.toLowerCase());
      
      const normalizedKeys = keys.map(key => key.toLowerCase());
      const isMatch = normalizedKeys.every(key => pressedKeys.includes(key)) &&
                     normalizedKeys.length === pressedKeys.length;
      
      if (isMatch) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        callback(event);
      }
    };

    target.addEventListener('keydown', handleKeyDown as EventListener);
    return () => target.removeEventListener('keydown', handleKeyDown as EventListener);
  }, [keys, callback, preventDefault, stopPropagation, target]);
}

// Hover hook
export function useHover<T extends HTMLElement>(): [
  React.RefObject<T>,
  boolean
] {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return [ref, isHovered];
}

// Focus hook
export function useFocus<T extends HTMLElement>(): [
  React.RefObject<T>,
  boolean,
  () => void
] {
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<T>(null);

  const focus = useCallback(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, []);

  return [ref, isFocused, focus];
}

// Event listener hook
export function useEventListener<T extends HTMLElement = HTMLDivElement>(
  eventName: string,
  handler: (event: Event) => void,
  element?: React.RefObject<T> | T | null
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element?.hasOwnProperty('current')
      ? (element as React.RefObject<T>).current
      : element || window;

    if (!targetElement?.addEventListener) return;

    const eventListener = (event: Event) => savedHandler.current(event);
    targetElement.addEventListener(eventName, eventListener);

    return () => {
      targetElement.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

// Interval hook
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Timeout hook
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

// Update effect hook (skip first render)
export function useUpdateEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    return effect();
  }, deps);
}

// Mount effect hook (only on mount)
export function useMountEffect(effect: React.EffectCallback): void {
  useEffect(effect, []);
}

// Unmount effect hook (only on unmount)
export function useUnmountEffect(effect: () => void): void {
  useEffect(() => {
    return effect;
  }, []);
}

// Force update hook
export function useForceUpdate(): () => void {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  return update;
}

// Render count hook (for debugging)
export function useRenderCount(): number {
  const count = useRef(1);
  useEffect(() => {
    count.current++;
  });
  return count.current;
}

// Why did you update hook (for debugging)
export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, any>
): void {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, any> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// Export all hooks
export default {
  useLocalStorage,
  useSessionStorage,
  useDebounce,
  useThrottle,
  usePrevious,
  useToggle,
  useCounter,
  useArray,
  useAsync,
  useFetch,
  useWindowSize,
  useMediaQuery,
  useOnlineStatus,
  useClipboard,
  useIntersectionObserver,
  useMutationObserver,
  useResizeObserver,
  useIdle,
  useKeyboardShortcut,
  useHover,
  useFocus,
  useEventListener,
  useInterval,
  useTimeout,
  useUpdateEffect,
  useMountEffect,
  useUnmountEffect,
  useForceUpdate,
  useRenderCount,
  useWhyDidYouUpdate
};