// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure API response time
  measureApiCall<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return fn().finally(() => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    });
  }

  // Record a performance metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  // Get average performance for a metric
  getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Get all metrics summary
  getMetricsSummary(): Record<string, { avg: number; count: number; latest: number }> {
    const summary: Record<string, { avg: number; count: number; latest: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        summary[name] = {
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          count: values.length,
          latest: values[values.length - 1]
        };
      }
    }
    
    return summary;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Database query performance wrapper
export async function withQueryPerformance<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  return monitor.measureApiCall(`db_${queryName}`, query);
}

// API route performance wrapper
export function withApiPerformance(handler: Function) {
  return async function(request: Request, ...args: any[]) {
    const monitor = PerformanceMonitor.getInstance();
    const url = new URL(request.url);
    const routeName = url.pathname.replace('/api/', '').replace('/', '_');
    
    return monitor.measureApiCall(`api_${routeName}`, () => 
      handler(request, ...args)
    );
  };
}

// Client-side performance utilities
export const clientPerformance = {
  // Measure component render time
  measureRender(componentName: string, renderFn: () => void): void {
    const start = performance.now();
    renderFn();
    const duration = performance.now() - start;
    
    if (typeof window !== 'undefined') {
      console.log(`${componentName} render time: ${duration.toFixed(2)}ms`);
    }
  },

  // Measure page load time
  measurePageLoad(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        console.log(`Page load time: ${loadTime.toFixed(2)}ms`);
      });
    }
  },

  // Get Core Web Vitals
  getCoreWebVitals(): Promise<{
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
  }> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve({});
        return;
      }

      const vitals: any = {};

      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = entry.startTime;
          }
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          vitals.fid = (entry as any).processingStart - entry.startTime;
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // Return vitals after a delay to collect data
      setTimeout(() => resolve(vitals), 3000);
    });
  }
};

// Bundle size analyzer
export const bundleAnalyzer = {
  // Log bundle information
  logBundleInfo(): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const totalSize = scripts.reduce((size, script) => {
        const src = (script as HTMLScriptElement).src;
        if (src.includes('/_next/')) {
          // Estimate size based on script name patterns
          if (src.includes('chunks/pages')) return size + 50; // ~50KB per page chunk
          if (src.includes('chunks/main')) return size + 200; // ~200KB for main bundle
          if (src.includes('chunks/framework')) return size + 150; // ~150KB for React
          return size + 20; // ~20KB for other chunks
        }
        return size;
      }, 0);
      
      console.log(`Estimated bundle size: ${totalSize}KB`);
    }
  }
};
