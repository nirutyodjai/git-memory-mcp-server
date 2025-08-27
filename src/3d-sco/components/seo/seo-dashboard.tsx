'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useI18n } from '@/lib/i18n/client'
import { useSEOState, useSEOMonitor, auditSEO, type SEOAudit } from '@/lib/seo/utils'
import { optimizeTitle, optimizeDescription, extractKeywords, calculateReadingTime } from '@/lib/seo/meta-tags'
import {
  Search,
  TrendingUp,
  Eye,
  MousePointer,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  Target,
  Clock,
  Hash,
  FileText,
  Globe,
  Zap
} from 'lucide-react'

interface SEODashboardProps {
  initialContent?: string
  onSEOUpdate?: (seoData: any) => void
}

export function SEODashboard({ initialContent = '', onSEOUpdate }: SEODashboardProps) {
  const { t } = useI18n()
  const { seoConfig, updateSEO, optimizeSEO } = useSEOState()
  const { analytics, trackPageView } = useSEOMonitor()
  const [content, setContent] = useState(initialContent)
  const [audit, setAudit] = useState<SEOAudit | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Auto-generate SEO data from content
  useEffect(() => {
    if (content) {
      const keywords = extractKeywords(content)
      const readingTime = calculateReadingTime(content)
      
      // Extract title from first heading
      const titleMatch = content.match(/^#\s+(.+)$/m)
      if (titleMatch && !seoConfig.title) {
        updateSEO({ title: titleMatch[1] })
      }
      
      // Extract description from first paragraph
      const descMatch = content.match(/^(?!#)(.{50,160})(?:\.|$)/m)
      if (descMatch && !seoConfig.description) {
        updateSEO({ description: descMatch[1].trim() })
      }
      
      updateSEO({ keywords })
    }
  }, [content])

  // Run SEO audit
  const runAudit = () => {
    if (typeof document !== 'undefined') {
      const auditResult = auditSEO(document.documentElement)
      setAudit(auditResult)
    }
  }

  // Optimize SEO automatically
  const handleOptimize = async () => {
    setIsOptimizing(true)
    try {
      optimizeSEO()
      if (onSEOUpdate) {
        onSEOUpdate(seoConfig)
      }
      runAudit()
    } finally {
      setIsOptimizing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getIssueIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* SEO Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('seo.pageViews')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% {t('common.fromLastMonth')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('seo.searchClicks')}</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.searchClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              CTR: {analytics.ctr.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('seo.avgPosition')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgPosition.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {t('seo.inSearchResults')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('seo.seoScore')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${audit ? getScoreColor(audit.score) : ''}`}>
              {audit ? audit.score : '--'}/100
            </div>
            <Button variant="outline" size="sm" onClick={runAudit} className="mt-2">
              {t('seo.runAudit')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="optimization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="optimization">{t('seo.optimization')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('seo.analytics')}</TabsTrigger>
          <TabsTrigger value="audit">{t('seo.audit')}</TabsTrigger>
          <TabsTrigger value="keywords">{t('seo.keywords')}</TabsTrigger>
        </TabsList>

        {/* SEO Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {t('seo.optimization')}
              </CardTitle>
              <CardDescription>
                {t('seo.optimizationDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seo-title">{t('seo.title')}</Label>
                  <Input
                    id="seo-title"
                    value={seoConfig.title || ''}
                    onChange={(e) => updateSEO({ title: e.target.value })}
                    placeholder={t('seo.titlePlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoConfig.title?.length || 0}/60 {t('common.characters')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seo-description">{t('seo.description')}</Label>
                  <Textarea
                    id="seo-description"
                    value={seoConfig.description || ''}
                    onChange={(e) => updateSEO({ description: e.target.value })}
                    placeholder={t('seo.descriptionPlaceholder')}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoConfig.description?.length || 0}/160 {t('common.characters')}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seo-keywords">{t('seo.keywords')}</Label>
                <Input
                  id="seo-keywords"
                  value={seoConfig.keywords?.join(', ') || ''}
                  onChange={(e) => updateSEO({ keywords: e.target.value.split(',').map(k => k.trim()) })}
                  placeholder={t('seo.keywordsPlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content-input">{t('seo.content')}</Label>
                <Textarea
                  id="content-input"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('seo.contentPlaceholder')}
                  rows={6}
                />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {content.length} {t('common.characters')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {calculateReadingTime(content)} {t('seo.minRead')}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleOptimize} disabled={isOptimizing}>
                  {isOptimizing ? t('common.optimizing') : t('seo.optimize')}
                </Button>
                <Button variant="outline" onClick={runAudit}>
                  {t('seo.runAudit')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('seo.analytics')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{t('seo.searchImpressions')}</span>
                      <span className="text-sm">{analytics.searchImpressions.toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min(analytics.searchImpressions / 1000 * 100, 100)} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{t('seo.clickThroughRate')}</span>
                      <span className="text-sm">{analytics.ctr.toFixed(2)}%</span>
                    </div>
                    <Progress value={analytics.ctr} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{t('seo.topKeywords')}</h4>
                  <div className="space-y-2">
                    {analytics.keywords.slice(0, 5).map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{keyword.keyword}</span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>#{keyword.position}</span>
                          <span>{keyword.clicks} clicks</span>
                          <span>{keyword.impressions} impressions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {t('seo.audit')}
              </CardTitle>
              {audit && (
                <CardDescription>
                  {t('seo.overallScore')}: <span className={`font-bold ${getScoreColor(audit.score)}`}>{audit.score}/100</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {audit ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('seo.seoScore')}</span>
                      <span className={`text-lg font-bold ${getScoreColor(audit.score)}`}>
                        {audit.score}/100
                      </span>
                    </div>
                    <Progress value={audit.score} className="h-2" />
                  </div>
                  
                  {audit.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">{t('seo.issues')}</h4>
                      <div className="space-y-2">
                        {audit.issues.map((issue, index) => (
                          <Alert key={index}>
                            <div className="flex items-start gap-2">
                              {getIssueIcon(issue.type)}
                              <div className="flex-1">
                                <AlertTitle className="text-sm">{issue.message}</AlertTitle>
                                <AlertDescription className="text-xs">
                                  {issue.recommendation}
                                </AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {audit.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">{t('seo.recommendations')}</h4>
                      <div className="space-y-1">
                        {audit.recommendations.map((rec, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            • {rec}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">{t('seo.noAuditYet')}</p>
                  <Button onClick={runAudit}>
                    {t('seo.runAudit')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                {t('seo.keywordAnalysis')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seoConfig.keywords && seoConfig.keywords.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">{t('seo.currentKeywords')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {seoConfig.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('seo.noKeywords')}</p>
                )}
                
                {content && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">{t('seo.extractedKeywords')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractKeywords(content).slice(0, 10).map((keyword, index) => (
                        <Badge key={index} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SEODashboard