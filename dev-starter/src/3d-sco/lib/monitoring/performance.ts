'use client';

import { useEffect, useRef, useState } from 'react';

// Performance metrics interfaces
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // Custom metrics
  pageLoadTime: number | null;
  domContentLoaded: number | null;
  resourceLoadTime: number | null;
  memoryUsage: number | null;
  
  // User experience metrics
  timeToInteractive: number | null;
  totalBlockingTime: number | null;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
  startTime: number;
  endTime: number;
}

export interface PerformanceReport {
  url: string;
  timestamp: number;
  userAgent: string;
  connection: string;
  metrics: PerformanceMetrics;
  resources: ResourceTiming[];
  errors: ErrorInfo[];
  warnings: string[];
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  type: 'javascript' | 'network' | 'resource' | 'unhandledrejection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
  url: string;
  userAgent: string;
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private errors: ErrorInfo[] = [];
  private observers: PerformanceObserver[] = [];
  private reportCallback?: (report: PerformanceReport) => void;
  private sessionId: string;
  
  private constructor() {
    this.sessionId = this.generateSessionId();
    this.metrics = this.initializeMetrics();
    this.setupPerformanceObservers();
    this.setupErrorHandlers();
  }
  
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private initializeMetrics(): PerformanceMetrics {
    return {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      pageLoadTime: null,
      domContentLoaded: null,
      resourceLoadTime: null,
      memoryUsage: null,
      timeToInteractive: null,
      totalBlockingTime: null,
    };
  }
  
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined') return;
    
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }
      
      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }
      
      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
      
      // Navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fcp = entry.firstContentfulPaint;
            this.metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
            this.metrics.pageLoadTime = entry.loadEventEnd - entry.loadEventStart;
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation observer not supported');
      }
    }
    
    // Fallback for basic metrics
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        const timing = window.performance.timing;
        this.metrics.ttfb = timing.responseStart - timing.navigationStart;
        this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
        this.metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      });
    }
    
    // Memory usage (if available)
    if ('memory' in window.performance) {
      const updateMemory = () => {
        const memory = (window.performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
      };
      updateMemory();
      setInterval(updateMemory, 5000); // Update every 5 seconds
    }
  }
  
  private setupErrorHandlers(): void {
    if (typeof window === 'undefined') return;
    
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        type: 'javascript',
        severity: 'high',
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: `Unhandled promise rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        type: 'unhandledrejection',
        severity: 'high',
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });
    
    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.recordError({
          message: `Resource failed to load: ${target.tagName}`,
          filename: (target as any).src || (target as any).href,
          timestamp: Date.now(),
          type: 'resource',
          severity: 'medium',
          sessionId: this.sessionId,
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      }
    }, true);
  }
  
  public recordError(error: ErrorInfo): void {
    this.errors.push(error);
    
    // Limit error storage
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-50);
    }
    
    // Send critical errors immediately
    if (error.severity === 'critical' && this.reportCallback) {
      this.sendReport();
    }
  }
  
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  public getErrors(): ErrorInfo[] {
    return [...this.errors];
  }
  
  public getResourceTimings(): ResourceTiming[] {
    if (typeof window === 'undefined') return [];
    
    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: this.getResourceType(resource.name),
      startTime: resource.startTime,
      endTime: resource.responseEnd,
    }));
  }
  
  private getResourceType(url: string): string {
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script';
    if (url.match(/\.(css|scss|sass)$/)) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.match(/\.(mp4|webm|ogg|mp3|wav)$/)) return 'media';
    return 'other';
  }
  
  public generateReport(): PerformanceReport {
    return {
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connection: this.getConnectionInfo(),
      metrics: this.getMetrics(),
      resources: this.getResourceTimings(),
      errors: this.getErrors(),
      warnings: this.generateWarnings(),
    };
  }
  
  private getConnectionInfo(): string {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return `${connection.effectiveType || 'unknown'} (${connection.downlink || 'unknown'}Mbps)`;
    }
    return 'unknown';
  }
  
  private generateWarnings(): string[] {
    const warnings: string[] = [];
    
    if (this.metrics.lcp && this.metrics.lcp > 2500) {
      warnings.push('LCP is slower than recommended (>2.5s)');
    }
    
    if (this.metrics.fid && this.metrics.fid > 100) {
      warnings.push('FID is slower than recommended (>100ms)');
    }
    
    if (this.metrics.cls && this.metrics.cls > 0.1) {
      warnings.push('CLS is higher than recommended (>0.1)');
    }
    
    if (this.metrics.memoryUsage && this.metrics.memoryUsage > 50 * 1024 * 1024) {
      warnings.push('High memory usage detected (>50MB)');
    }
    
    return warnings;
  }
  
  public setReportCallback(callback: (report: PerformanceReport) => void): void {
    this.reportCallback = callback;
  }
  
  public sendReport(): void {
    if (this.reportCallback) {
      const report = this.generateReport();
      this.reportCallback(report);
    }
  }
  
  public startPeriodicReporting(intervalMs: number = 30000): void {
    setInterval(() => {
      this.sendReport();
    }, intervalMs);
  }
  
  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React hooks for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  
  useEffect(() => {
    monitorRef.current = PerformanceMonitor.getInstance();
    
    const updateMetrics = () => {
      if (monitorRef.current) {
        setMetrics(monitorRef.current.getMetrics());
        setErrors(monitorRef.current.getErrors());
        setIsLoading(false);
      }
    };
    
    // Initial update
    updateMetrics();
    
    // Periodic updates
    const interval = setInterval(updateMetrics, 5000);
    
    return () => {
      clearInterval(interval);
      if (monitorRef.current) {
        monitorRef.current.cleanup();
      }
    };
  }, []);
  
  const generateReport = () => {
    return monitorRef.current?.generateReport() || null;
  };
  
  const recordCustomError = (error: Partial<ErrorInfo>) => {
    if (monitorRef.current) {
      monitorRef.current.recordError({
        message: error.message || 'Unknown error',
        timestamp: Date.now(),
        type: error.type || 'javascript',
        severity: error.severity || 'medium',
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ...error,
      } as ErrorInfo);
    }
  };
  
  return {
    metrics,
    errors,
    isLoading,
    generateReport,
    recordCustomError,
  };
}

// Performance measurement utilities
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`Performance: ${name} took ${end - start} milliseconds`);
  
  // Mark for performance timeline
  if ('mark' in performance) {
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }
  
  return result;
}

export async function measureAsyncPerformance<T>(
  name: string, 
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`Async Performance: ${name} took ${end - start} milliseconds`);
  
  // Mark for performance timeline
  if ('mark' in performance) {
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }
  
  return result;
}

// Web Vitals scoring
export function getWebVitalsScore(metrics: PerformanceMetrics): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  details: Record<string, { value: number | null; score: number; threshold: string }>;
} {
  const details = {
    lcp: {
      value: metrics.lcp,
      score: metrics.lcp ? (metrics.lcp <= 2500 ? 100 : metrics.lcp <= 4000 ? 50 : 0) : 0,
      threshold: '≤2.5s (good), ≤4s (needs improvement), >4s (poor)'
    },
    fid: {
      value: metrics.fid,
      score: metrics.fid ? (metrics.fid <= 100 ? 100 : metrics.fid <= 300 ? 50 : 0) : 0,
      threshold: '≤100ms (good), ≤300ms (needs improvement), >300ms (poor)'
    },
    cls: {
      value: metrics.cls,
      score: metrics.cls ? (metrics.cls <= 0.1 ? 100 : metrics.cls <= 0.25 ? 50 : 0) : 0,
      threshold: '≤0.1 (good), ≤0.25 (needs improvement), >0.25 (poor)'
    },
    fcp: {
      value: metrics.fcp,
      score: metrics.fcp ? (metrics.fcp <= 1800 ? 100 : metrics.fcp <= 3000 ? 50 : 0) : 0,
      threshold: '≤1.8s (good), ≤3s (needs improvement), >3s (poor)'
    },
    ttfb: {
      value: metrics.ttfb,
      score: metrics.ttfb ? (metrics.ttfb <= 800 ? 100 : metrics.ttfb <= 1800 ? 50 : 0) : 0,
      threshold: '≤800ms (good), ≤1.8s (needs improvement), >1.8s (poor)'
    }
  };
  
  const totalScore = Object.values(details).reduce((sum, detail) => sum + detail.score, 0);
  const averageScore = totalScore / Object.keys(details).length;
  
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (averageScore >= 90) grade = 'A';
  else if (averageScore >= 80) grade = 'B';
  else if (averageScore >= 70) grade = 'C';
  else if (averageScore >= 60) grade = 'D';
  else grade = 'F';
  
  return {
    score: Math.round(averageScore),
    grade,
    details
  };
}