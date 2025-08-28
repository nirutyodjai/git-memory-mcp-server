"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEODashboard = SEODashboard;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const badge_1 = require("@/components/ui/badge");
const progress_1 = require("@/components/ui/progress");
const tabs_1 = require("@/components/ui/tabs");
const alert_1 = require("@/components/ui/alert");
const client_1 = require("@/lib/i18n/client");
const utils_1 = require("@/lib/seo/utils");
const meta_tags_1 = require("@/lib/seo/meta-tags");
const lucide_react_1 = require("lucide-react");
function SEODashboard({ initialContent = '', onSEOUpdate }) {
    const { t } = (0, client_1.useI18n)();
    const { seoConfig, updateSEO, optimizeSEO } = (0, utils_1.useSEOState)();
    const { analytics, trackPageView } = (0, utils_1.useSEOMonitor)();
    const [content, setContent] = (0, react_1.useState)(initialContent);
    const [audit, setAudit] = (0, react_1.useState)(null);
    const [isOptimizing, setIsOptimizing] = (0, react_1.useState)(false);
    // Auto-generate SEO data from content
    (0, react_1.useEffect)(() => {
        if (content) {
            const keywords = (0, meta_tags_1.extractKeywords)(content);
            const readingTime = (0, meta_tags_1.calculateReadingTime)(content);
            // Extract title from first heading
            const titleMatch = content.match(/^#\s+(.+)$/m);
            if (titleMatch && !seoConfig.title) {
                updateSEO({ title: titleMatch[1] });
            }
            // Extract description from first paragraph
            const descMatch = content.match(/^(?!#)(.{50,160})(?:\.|$)/m);
            if (descMatch && !seoConfig.description) {
                updateSEO({ description: descMatch[1].trim() });
            }
            updateSEO({ keywords });
        }
    }, [content]);
    // Run SEO audit
    const runAudit = () => {
        if (typeof document !== 'undefined') {
            const auditResult = (0, utils_1.auditSEO)(document.documentElement);
            setAudit(auditResult);
        }
    };
    // Optimize SEO automatically
    const handleOptimize = async () => {
        setIsOptimizing(true);
        try {
            optimizeSEO();
            if (onSEOUpdate) {
                onSEOUpdate(seoConfig);
            }
            runAudit();
        }
        finally {
            setIsOptimizing(false);
        }
    };
    const getScoreColor = (score) => {
        if (score >= 90)
            return 'text-green-600';
        if (score >= 70)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    const getIssueIcon = (type) => {
        switch (type) {
            case 'error': return <lucide_react_1.AlertTriangle className="h-4 w-4 text-red-500"/>;
            case 'warning': return <lucide_react_1.AlertTriangle className="h-4 w-4 text-yellow-500"/>;
            case 'info': return <lucide_react_1.Info className="h-4 w-4 text-blue-500"/>;
        }
    };
    return (<div className="space-y-6">
      {/* SEO Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">{t('seo.pageViews')}</card_1.CardTitle>
            <lucide_react_1.Eye className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{analytics.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% {t('common.fromLastMonth')}
            </p>
          </card_1.CardContent>
        </card_1.Card>
        
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">{t('seo.searchClicks')}</card_1.CardTitle>
            <lucide_react_1.MousePointer className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{analytics.searchClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              CTR: {analytics.ctr.toFixed(1)}%
            </p>
          </card_1.CardContent>
        </card_1.Card>
        
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">{t('seo.avgPosition')}</card_1.CardTitle>
            <lucide_react_1.TrendingUp className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{analytics.avgPosition.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {t('seo.inSearchResults')}
            </p>
          </card_1.CardContent>
        </card_1.Card>
        
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">{t('seo.seoScore')}</card_1.CardTitle>
            <lucide_react_1.Target className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className={`text-2xl font-bold ${audit ? getScoreColor(audit.score) : ''}`}>
              {audit ? audit.score : '--'}/100
            </div>
            <button_1.Button variant="outline" size="sm" onClick={runAudit} className="mt-2">
              {t('seo.runAudit')}
            </button_1.Button>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      <tabs_1.Tabs defaultValue="optimization" className="space-y-4">
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="optimization">{t('seo.optimization')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="analytics">{t('seo.analytics')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="audit">{t('seo.audit')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="keywords">{t('seo.keywords')}</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        {/* SEO Optimization Tab */}
        <tabs_1.TabsContent value="optimization" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Zap className="h-5 w-5"/>
                {t('seo.optimization')}
              </card_1.CardTitle>
              <card_1.CardDescription>
                {t('seo.optimizationDescription')}
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label_1.Label htmlFor="seo-title">{t('seo.title')}</label_1.Label>
                  <input_1.Input id="seo-title" value={seoConfig.title || ''} onChange={(e) => updateSEO({ title: e.target.value })} placeholder={t('seo.titlePlaceholder')}/>
                  <p className="text-xs text-muted-foreground">
                    {seoConfig.title?.length || 0}/60 {t('common.characters')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label_1.Label htmlFor="seo-description">{t('seo.description')}</label_1.Label>
                  <textarea_1.Textarea id="seo-description" value={seoConfig.description || ''} onChange={(e) => updateSEO({ description: e.target.value })} placeholder={t('seo.descriptionPlaceholder')} rows={3}/>
                  <p className="text-xs text-muted-foreground">
                    {seoConfig.description?.length || 0}/160 {t('common.characters')}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label_1.Label htmlFor="seo-keywords">{t('seo.keywords')}</label_1.Label>
                <input_1.Input id="seo-keywords" value={seoConfig.keywords?.join(', ') || ''} onChange={(e) => updateSEO({ keywords: e.target.value.split(',').map(k => k.trim()) })} placeholder={t('seo.keywordsPlaceholder')}/>
              </div>
              
              <div className="space-y-2">
                <label_1.Label htmlFor="content-input">{t('seo.content')}</label_1.Label>
                <textarea_1.Textarea id="content-input" value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('seo.contentPlaceholder')} rows={6}/>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <lucide_react_1.FileText className="h-3 w-3"/>
                    {content.length} {t('common.characters')}
                  </span>
                  <span className="flex items-center gap-1">
                    <lucide_react_1.Clock className="h-3 w-3"/>
                    {(0, meta_tags_1.calculateReadingTime)(content)} {t('seo.minRead')}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button_1.Button onClick={handleOptimize} disabled={isOptimizing}>
                  {isOptimizing ? t('common.optimizing') : t('seo.optimize')}
                </button_1.Button>
                <button_1.Button variant="outline" onClick={runAudit}>
                  {t('seo.runAudit')}
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        {/* Analytics Tab */}
        <tabs_1.TabsContent value="analytics" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.BarChart3 className="h-5 w-5"/>
                {t('seo.analytics')}
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{t('seo.searchImpressions')}</span>
                      <span className="text-sm">{analytics.searchImpressions.toLocaleString()}</span>
                    </div>
                    <progress_1.Progress value={Math.min(analytics.searchImpressions / 1000 * 100, 100)}/>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{t('seo.clickThroughRate')}</span>
                      <span className="text-sm">{analytics.ctr.toFixed(2)}%</span>
                    </div>
                    <progress_1.Progress value={analytics.ctr}/>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{t('seo.topKeywords')}</h4>
                  <div className="space-y-2">
                    {analytics.keywords.slice(0, 5).map((keyword, index) => (<div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{keyword.keyword}</span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>#{keyword.position}</span>
                          <span>{keyword.clicks} clicks</span>
                          <span>{keyword.impressions} impressions</span>
                        </div>
                      </div>))}
                  </div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        {/* Audit Tab */}
        <tabs_1.TabsContent value="audit" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.CheckCircle className="h-5 w-5"/>
                {t('seo.audit')}
              </card_1.CardTitle>
              {audit && (<card_1.CardDescription>
                  {t('seo.overallScore')}: <span className={`font-bold ${getScoreColor(audit.score)}`}>{audit.score}/100</span>
                </card_1.CardDescription>)}
            </card_1.CardHeader>
            <card_1.CardContent>
              {audit ? (<div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('seo.seoScore')}</span>
                      <span className={`text-lg font-bold ${getScoreColor(audit.score)}`}>
                        {audit.score}/100
                      </span>
                    </div>
                    <progress_1.Progress value={audit.score} className="h-2"/>
                  </div>
                  
                  {audit.issues.length > 0 && (<div className="space-y-2">
                      <h4 className="text-sm font-medium">{t('seo.issues')}</h4>
                      <div className="space-y-2">
                        {audit.issues.map((issue, index) => (<alert_1.Alert key={index}>
                            <div className="flex items-start gap-2">
                              {getIssueIcon(issue.type)}
                              <div className="flex-1">
                                <alert_1.AlertTitle className="text-sm">{issue.message}</alert_1.AlertTitle>
                                <alert_1.AlertDescription className="text-xs">
                                  {issue.recommendation}
                                </alert_1.AlertDescription>
                              </div>
                            </div>
                          </alert_1.Alert>))}
                      </div>
                    </div>)}
                  
                  {audit.recommendations.length > 0 && (<div className="space-y-2">
                      <h4 className="text-sm font-medium">{t('seo.recommendations')}</h4>
                      <div className="space-y-1">
                        {audit.recommendations.map((rec, index) => (<p key={index} className="text-sm text-muted-foreground">
                            • {rec}
                          </p>))}
                      </div>
                    </div>)}
                </div>) : (<div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">{t('seo.noAuditYet')}</p>
                  <button_1.Button onClick={runAudit}>
                    {t('seo.runAudit')}
                  </button_1.Button>
                </div>)}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        {/* Keywords Tab */}
        <tabs_1.TabsContent value="keywords" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Hash className="h-5 w-5"/>
                {t('seo.keywordAnalysis')}
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {seoConfig.keywords && seoConfig.keywords.length > 0 ? (<div className="space-y-2">
                    <h4 className="text-sm font-medium">{t('seo.currentKeywords')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {seoConfig.keywords.map((keyword, index) => (<badge_1.Badge key={index} variant="secondary">
                          {keyword}
                        </badge_1.Badge>))}
                    </div>
                  </div>) : (<p className="text-muted-foreground">{t('seo.noKeywords')}</p>)}
                
                {content && (<div className="space-y-2">
                    <h4 className="text-sm font-medium">{t('seo.extractedKeywords')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {(0, meta_tags_1.extractKeywords)(content).slice(0, 10).map((keyword, index) => (<badge_1.Badge key={index} variant="outline">
                          {keyword}
                        </badge_1.Badge>))}
                    </div>
                  </div>)}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
exports.default = SEODashboard;
//# sourceMappingURL=seo-dashboard.js.map