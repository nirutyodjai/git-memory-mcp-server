import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import type { SEOConfig, StructuredData } from './meta-tags'
import {
  optimizeTitle,
  optimizeDescription,
  generateCanonicalUrl,
  extractKeywords,
  calculateReadingTime,
  generateSlug
} from './meta-tags'

// SEO Analytics and Tracking
export interface SEOAnalytics {
  pageViews: number
  bounceRate: number
  avgTimeOnPage: number
  searchImpressions: number
  searchClicks: number
  ctr: number
  avgPosition: number
  keywords: Array<{
    keyword: string
    position: number
    clicks: number
    impressions: number
  }>
}

// SEO Audit Interface
export interface SEOAudit {
  score: number
  issues: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    element?: string
    recommendation: string
  }>
  recommendations: string[]
}

// Hook for SEO state management
export function useSEOState(initialConfig?: Partial<SEOConfig>) {
  const [seoConfig, setSeoConfig] = useState<Partial<SEOConfig>>(initialConfig || {})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateSEO = (updates: Partial<SEOConfig>) => {
    setSeoConfig(prev => ({ ...prev, ...updates }))
  }

  const optimizeSEO = () => {
    if (seoConfig.title) {
      updateSEO({ title: optimizeTitle(seoConfig.title) })
    }
    if (seoConfig.description) {
      updateSEO({ description: optimizeDescription(seoConfig.description) })
    }
  }

  return {
    seoConfig,
    updateSEO,
    optimizeSEO,
    isLoading,
    error
  }
}

// Hook for dynamic SEO based on route changes
export function useRouteSEO() {
  const router = useRouter()
  const [seoData, setSeoData] = useState<Partial<SEOConfig>>({})

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Generate SEO data based on route
      const pathSegments = url.split('/').filter(Boolean)
      const pageName = pathSegments[pathSegments.length - 1] || 'home'
      
      setSeoData({
        title: generatePageTitle(pageName),
        description: generatePageDescription(pageName),
        canonical: generateCanonicalUrl(process.env.NEXT_PUBLIC_BASE_URL || '', url)
      })
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    handleRouteChange(router.asPath)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  return seoData
}

// Hook for content-based SEO optimization
export function useContentSEO(content: string) {
  const [seoData, setSeoData] = useState<{
    keywords: string[]
    readingTime: number
    title?: string
    description?: string
  }>({
    keywords: [],
    readingTime: 0
  })

  useEffect(() => {
    if (content) {
      const keywords = extractKeywords(content)
      const readingTime = calculateReadingTime(content)
      
      // Extract potential title from first heading
      const titleMatch = content.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : undefined
      
      // Extract description from first paragraph
      const descMatch = content.match(/^(?!#)(.{50,160})(?:\.|$)/m)
      const description = descMatch ? descMatch[1].trim() : undefined
      
      setSeoData({
        keywords,
        readingTime,
        title,
        description
      })
    }
  }, [content])

  return seoData
}

// SEO Audit Functions
export function auditSEO(element: HTMLElement): SEOAudit {
  const issues: SEOAudit['issues'] = []
  const recommendations: string[] = []
  let score = 100

  // Check title
  const title = element.querySelector('title')?.textContent
  if (!title) {
    issues.push({
      type: 'error',
      message: 'Missing page title',
      element: 'title',
      recommendation: 'Add a descriptive title tag'
    })
    score -= 20
  } else if (title.length < 30 || title.length > 60) {
    issues.push({
      type: 'warning',
      message: `Title length is ${title.length} characters (optimal: 30-60)`,
      element: 'title',
      recommendation: 'Optimize title length for better search visibility'
    })
    score -= 10
  }

  // Check meta description
  const description = element.querySelector('meta[name="description"]')?.getAttribute('content')
  if (!description) {
    issues.push({
      type: 'error',
      message: 'Missing meta description',
      element: 'meta[name="description"]',
      recommendation: 'Add a compelling meta description'
    })
    score -= 15
  } else if (description.length < 120 || description.length > 160) {
    issues.push({
      type: 'warning',
      message: `Description length is ${description.length} characters (optimal: 120-160)`,
      element: 'meta[name="description"]',
      recommendation: 'Optimize description length for better search snippets'
    })
    score -= 8
  }

  // Check headings structure
  const h1s = element.querySelectorAll('h1')
  if (h1s.length === 0) {
    issues.push({
      type: 'error',
      message: 'Missing H1 heading',
      element: 'h1',
      recommendation: 'Add a main H1 heading to the page'
    })
    score -= 15
  } else if (h1s.length > 1) {
    issues.push({
      type: 'warning',
      message: `Multiple H1 headings found (${h1s.length})`,
      element: 'h1',
      recommendation: 'Use only one H1 heading per page'
    })
    score -= 5
  }

  // Check images alt text
  const images = element.querySelectorAll('img')
  let imagesWithoutAlt = 0
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      imagesWithoutAlt++
    }
  })
  if (imagesWithoutAlt > 0) {
    issues.push({
      type: 'warning',
      message: `${imagesWithoutAlt} images missing alt text`,
      element: 'img',
      recommendation: 'Add descriptive alt text to all images'
    })
    score -= Math.min(imagesWithoutAlt * 2, 10)
  }

  // Check canonical URL
  const canonical = element.querySelector('link[rel="canonical"]')
  if (!canonical) {
    issues.push({
      type: 'info',
      message: 'Missing canonical URL',
      element: 'link[rel="canonical"]',
      recommendation: 'Add canonical URL to prevent duplicate content issues'
    })
    score -= 5
  }

  // Check structured data
  const structuredData = element.querySelectorAll('script[type="application/ld+json"]')
  if (structuredData.length === 0) {
    issues.push({
      type: 'info',
      message: 'No structured data found',
      element: 'script[type="application/ld+json"]',
      recommendation: 'Add structured data to improve search result appearance'
    })
    score -= 5
  }

  // Generate recommendations
  if (score >= 90) {
    recommendations.push('Excellent SEO! Consider minor optimizations for perfect score.')
  } else if (score >= 70) {
    recommendations.push('Good SEO foundation. Address warnings to improve further.')
  } else if (score >= 50) {
    recommendations.push('SEO needs improvement. Focus on fixing errors first.')
  } else {
    recommendations.push('Poor SEO. Immediate attention required for basic optimization.')
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations
  }
}

// Utility functions
function generatePageTitle(pageName: string): string {
  const titleMap: Record<string, string> = {
    home: '3D-SCO | Portfolio & Blog',
    about: 'About | 3D-SCO',
    portfolio: 'Portfolio | 3D-SCO',
    blog: 'Blog | 3D-SCO',
    contact: 'Contact | 3D-SCO',
    services: 'Services | 3D-SCO'
  }
  
  return titleMap[pageName] || `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} | 3D-SCO`
}

function generatePageDescription(pageName: string): string {
  const descriptionMap: Record<string, string> = {
    home: 'นักพัฒนาเว็บไซต์และแอปพลิเคชัน เชี่ยวชาญด้าน React, Next.js, และเทคโนโลยีสมัยใหม่',
    about: 'เรียนรู้เกี่ยวกับ 3D-SCO นักพัฒนาเว็บไซต์มืออาชีพ ประสบการณ์และความเชี่ยวชาญ',
    portfolio: 'ชมผลงานและโปรเจกต์ต่างๆ ของ 3D-SCO นักพัฒนาเว็บไซต์และแอปพลิเคชัน',
    blog: 'บทความและเนื้อหาเกี่ยวกับการพัฒนาเว็บไซต์ เทคโนโลยี และแนวโน้มใหม่ๆ',
    contact: 'ติดต่อ 3D-SCO สำหรับการพัฒนาเว็บไซต์และแอปพลิเคชัน',
    services: 'บริการพัฒนาเว็บไซต์และแอปพลิเคชันโดย 3D-SCO'
  }
  
  return descriptionMap[pageName] || `${pageName} - 3D-SCO Portfolio & Blog`
}

// SEO Performance Monitoring
export class SEOMonitor {
  private analytics: SEOAnalytics = {
    pageViews: 0,
    bounceRate: 0,
    avgTimeOnPage: 0,
    searchImpressions: 0,
    searchClicks: 0,
    ctr: 0,
    avgPosition: 0,
    keywords: []
  }

  trackPageView() {
    this.analytics.pageViews++
    this.sendAnalytics('pageview')
  }

  trackSearchClick(keyword: string, position: number) {
    this.analytics.searchClicks++
    const existingKeyword = this.analytics.keywords.find(k => k.keyword === keyword)
    if (existingKeyword) {
      existingKeyword.clicks++
    } else {
      this.analytics.keywords.push({
        keyword,
        position,
        clicks: 1,
        impressions: 1
      })
    }
    this.updateCTR()
  }

  trackSearchImpression(keyword: string, position: number) {
    this.analytics.searchImpressions++
    const existingKeyword = this.analytics.keywords.find(k => k.keyword === keyword)
    if (existingKeyword) {
      existingKeyword.impressions++
    } else {
      this.analytics.keywords.push({
        keyword,
        position,
        clicks: 0,
        impressions: 1
      })
    }
    this.updateCTR()
  }

  private updateCTR() {
    if (this.analytics.searchImpressions > 0) {
      this.analytics.ctr = (this.analytics.searchClicks / this.analytics.searchImpressions) * 100
    }
  }

  private sendAnalytics(event: string) {
    // Send to analytics service (Google Analytics, etc.)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        custom_parameter: 'seo_tracking'
      })
    }
  }

  getAnalytics(): SEOAnalytics {
    return { ...this.analytics }
  }

  reset() {
    this.analytics = {
      pageViews: 0,
      bounceRate: 0,
      avgTimeOnPage: 0,
      searchImpressions: 0,
      searchClicks: 0,
      ctr: 0,
      avgPosition: 0,
      keywords: []
    }
  }
}

// Global SEO monitor instance
export const seoMonitor = new SEOMonitor()

// Hook to use SEO monitor
export function useSEOMonitor() {
  const [analytics, setAnalytics] = useState<SEOAnalytics>(seoMonitor.getAnalytics())

  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(seoMonitor.getAnalytics())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return {
    analytics,
    trackPageView: () => seoMonitor.trackPageView(),
    trackSearchClick: (keyword: string, position: number) => seoMonitor.trackSearchClick(keyword, position),
    trackSearchImpression: (keyword: string, position: number) => seoMonitor.trackSearchImpression(keyword, position),
    reset: () => seoMonitor.reset()
  }
}

export default {
  useSEOState,
  useRouteSEO,
  useContentSEO,
  useSEOMonitor,
  auditSEO,
  seoMonitor
}