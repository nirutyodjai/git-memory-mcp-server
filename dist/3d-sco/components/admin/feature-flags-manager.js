"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagsManager = FeatureFlagsManager;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const switch_1 = require("@/components/ui/switch");
const badge_1 = require("@/components/ui/badge");
const tabs_1 = require("@/components/ui/tabs");
const progress_1 = require("@/components/ui/progress");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
function FeatureFlagsManager() {
    const [featureFlags, setFeatureFlags] = (0, react_1.useState)([]);
    const [abTests, setABTests] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isCreating, setIsCreating] = (0, react_1.useState)(false);
    const [activeTab, setActiveTab] = (0, react_1.useState)('flags');
    const { toast } = (0, use_toast_1.useToast)();
    // Form states
    const [newFlag, setNewFlag] = (0, react_1.useState)({
        name: '',
        description: '',
        enabled: false,
        rolloutPercentage: 0,
    });
    const [newTest, setNewTest] = (0, react_1.useState)({
        name: '',
        description: '',
        variants: [
            { name: 'Control', weight: 50, config: {} },
            { name: 'Variant A', weight: 50, config: {} },
        ],
        trafficAllocation: 100,
        metrics: { primary: 'conversion' },
    });
    // Fetch data
    const fetchData = async () => {
        try {
            setIsLoading(true);
            // In a real app, you'd have separate endpoints for admin data
            const response = await fetch('/api/feature-flags?admin=true');
            if (!response.ok)
                throw new Error('Failed to fetch data');
            const data = await response.json();
            // For now, we'll use mock data since the API returns user-facing data
            setFeatureFlags([
                {
                    id: 'new-ui-design',
                    name: 'New UI Design',
                    description: 'Enable new user interface design',
                    enabled: false,
                    rolloutPercentage: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'dark-mode-toggle',
                    name: 'Dark Mode Toggle',
                    description: 'Show dark mode toggle in header',
                    enabled: true,
                    rolloutPercentage: 100,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'push-notifications',
                    name: 'Push Notifications',
                    description: 'Enable push notification subscription',
                    enabled: true,
                    rolloutPercentage: 50,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ]);
            setABTests([
                {
                    id: 'homepage-cta',
                    name: 'Homepage CTA Test',
                    description: 'Test different call-to-action buttons on homepage',
                    status: 'running',
                    variants: [
                        { id: 'control', name: 'Control', weight: 50, config: { buttonText: 'Get Started', color: 'blue' } },
                        { id: 'variant-a', name: 'Variant A', weight: 50, config: { buttonText: 'Start Now', color: 'green' } },
                    ],
                    trafficAllocation: 100,
                    metrics: { primary: 'click_through_rate', secondary: ['conversion_rate'] },
                    results: {
                        control: { conversions: 45, visitors: 1000, conversionRate: 4.5 },
                        'variant-a': { conversions: 52, visitors: 1000, conversionRate: 5.2 },
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ]);
        }
        catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch feature flags and A/B tests',
                variant: 'destructive',
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchData();
    }, []);
    // Create feature flag
    const createFeatureFlag = async () => {
        try {
            setIsCreating(true);
            const response = await fetch('/api/feature-flags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'flag', ...newFlag }),
            });
            if (!response.ok)
                throw new Error('Failed to create feature flag');
            const result = await response.json();
            setFeatureFlags(prev => [...prev, result.data]);
            setNewFlag({ name: '', description: '', enabled: false, rolloutPercentage: 0 });
            toast({
                title: 'Success',
                description: 'Feature flag created successfully',
            });
        }
        catch (error) {
            console.error('Error creating feature flag:', error);
            toast({
                title: 'Error',
                description: 'Failed to create feature flag',
                variant: 'destructive',
            });
        }
        finally {
            setIsCreating(false);
        }
    };
    // Toggle feature flag
    const toggleFeatureFlag = async (id, enabled) => {
        try {
            const response = await fetch('/api/feature-flags', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type: 'flag', enabled }),
            });
            if (!response.ok)
                throw new Error('Failed to update feature flag');
            setFeatureFlags(prev => prev.map(flag => flag.id === id ? { ...flag, enabled } : flag));
            toast({
                title: 'Success',
                description: `Feature flag ${enabled ? 'enabled' : 'disabled'}`,
            });
        }
        catch (error) {
            console.error('Error updating feature flag:', error);
            toast({
                title: 'Error',
                description: 'Failed to update feature flag',
                variant: 'destructive',
            });
        }
    };
    // Update rollout percentage
    const updateRolloutPercentage = async (id, rolloutPercentage) => {
        try {
            const response = await fetch('/api/feature-flags', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type: 'flag', rolloutPercentage }),
            });
            if (!response.ok)
                throw new Error('Failed to update rollout percentage');
            setFeatureFlags(prev => prev.map(flag => flag.id === id ? { ...flag, rolloutPercentage } : flag));
        }
        catch (error) {
            console.error('Error updating rollout percentage:', error);
            toast({
                title: 'Error',
                description: 'Failed to update rollout percentage',
                variant: 'destructive',
            });
        }
    };
    // Control A/B test
    const controlABTest = async (id, action) => {
        try {
            const statusMap = {
                start: 'running',
                pause: 'paused',
                stop: 'completed',
            };
            const response = await fetch('/api/feature-flags', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type: 'test', status: statusMap[action] }),
            });
            if (!response.ok)
                throw new Error(`Failed to ${action} A/B test`);
            setABTests(prev => prev.map(test => test.id === id ? { ...test, status: statusMap[action] } : test));
            toast({
                title: 'Success',
                description: `A/B test ${action}ed successfully`,
            });
        }
        catch (error) {
            console.error(`Error ${action}ing A/B test:`, error);
            toast({
                title: 'Error',
                description: `Failed to ${action} A/B test`,
                variant: 'destructive',
            });
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'running': return <lucide_react_1.Play className="h-4 w-4 text-green-500"/>;
            case 'paused': return <lucide_react_1.Pause className="h-4 w-4 text-yellow-500"/>;
            case 'completed': return <lucide_react_1.CheckCircle className="h-4 w-4 text-blue-500"/>;
            default: return <lucide_react_1.Clock className="h-4 w-4 text-gray-500"/>;
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'running': return 'bg-green-500';
            case 'paused': return 'bg-yellow-500';
            case 'completed': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };
    if (isLoading) {
        return (<div className="flex items-center justify-center p-8">
        <lucide_react_1.Loader2 className="h-8 w-8 animate-spin"/>
        <span className="ml-2">Loading feature flags...</span>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Feature Flags & A/B Testing</h2>
          <p className="text-muted-foreground">
            จัดการ feature flags และทดสอบ A/B เพื่อปรับปรุงประสบการณ์ผู้ใช้
          </p>
        </div>
        
        <div className="flex gap-2">
          <button_1.Button onClick={fetchData} variant="outline">
            <lucide_react_1.BarChart3 className="h-4 w-4 mr-2"/>
            Refresh
          </button_1.Button>
        </div>
      </div>

      <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="flags">
            <lucide_react_1.Flag className="h-4 w-4 mr-2"/>
            Feature Flags ({featureFlags.length})
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="tests">
            <lucide_react_1.TestTube className="h-4 w-4 mr-2"/>
            A/B Tests ({abTests.length})
          </tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="flags" className="space-y-4">
          {/* Create Feature Flag */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Plus className="h-5 w-5"/>
                Create New Feature Flag
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label_1.Label htmlFor="flag-name">Name</label_1.Label>
                  <input_1.Input id="flag-name" value={newFlag.name} onChange={(e) => setNewFlag(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., new-checkout-flow"/>
                </div>
                <div>
                  <label_1.Label htmlFor="flag-rollout">Rollout Percentage</label_1.Label>
                  <input_1.Input id="flag-rollout" type="number" min="0" max="100" value={newFlag.rolloutPercentage} onChange={(e) => setNewFlag(prev => ({ ...prev, rolloutPercentage: parseInt(e.target.value) || 0 }))}/>
                </div>
              </div>
              <div>
                <label_1.Label htmlFor="flag-description">Description</label_1.Label>
                <textarea_1.Textarea id="flag-description" value={newFlag.description} onChange={(e) => setNewFlag(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe what this feature flag controls..."/>
              </div>
              <div className="flex items-center space-x-2">
                <switch_1.Switch checked={newFlag.enabled} onCheckedChange={(enabled) => setNewFlag(prev => ({ ...prev, enabled }))}/>
                <label_1.Label>Enable immediately</label_1.Label>
              </div>
              <button_1.Button onClick={createFeatureFlag} disabled={isCreating || !newFlag.name}>
                {isCreating && <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                Create Feature Flag
              </button_1.Button>
            </card_1.CardContent>
          </card_1.Card>

          {/* Feature Flags List */}
          <div className="grid gap-4">
            {featureFlags.map((flag) => (<card_1.Card key={flag.id}>
                <card_1.CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <card_1.CardTitle className="flex items-center gap-2">
                        <lucide_react_1.Flag className="h-5 w-5"/>
                        {flag.name}
                        <badge_1.Badge variant={flag.enabled ? "default" : "secondary"}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </badge_1.Badge>
                      </card_1.CardTitle>
                      <card_1.CardDescription>{flag.description}</card_1.CardDescription>
                    </div>
                    <switch_1.Switch checked={flag.enabled} onCheckedChange={(enabled) => toggleFeatureFlag(flag.id, enabled)}/>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label_1.Label>Rollout Percentage</label_1.Label>
                        <span className="text-sm text-muted-foreground">
                          {flag.rolloutPercentage}%
                        </span>
                      </div>
                      <progress_1.Progress value={flag.rolloutPercentage} className="h-2"/>
                      <input_1.Input type="range" min="0" max="100" value={flag.rolloutPercentage} onChange={(e) => updateRolloutPercentage(flag.id, parseInt(e.target.value))} className="mt-2"/>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created: {new Date(flag.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(flag.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>))}
          </div>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="tests" className="space-y-4">
          {/* A/B Tests List */}
          <div className="grid gap-4">
            {abTests.map((test) => (<card_1.Card key={test.id}>
                <card_1.CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <card_1.CardTitle className="flex items-center gap-2">
                        <lucide_react_1.TestTube className="h-5 w-5"/>
                        {test.name}
                        <badge_1.Badge variant="outline" className={getStatusColor(test.status)}>
                          {getStatusIcon(test.status)}
                          {test.status}
                        </badge_1.Badge>
                      </card_1.CardTitle>
                      <card_1.CardDescription>{test.description}</card_1.CardDescription>
                    </div>
                    
                    <div className="flex gap-2">
                      {test.status === 'draft' && (<button_1.Button size="sm" onClick={() => controlABTest(test.id, 'start')}>
                          <lucide_react_1.Play className="h-4 w-4 mr-1"/>
                          Start
                        </button_1.Button>)}
                      {test.status === 'running' && (<>
                          <button_1.Button size="sm" variant="outline" onClick={() => controlABTest(test.id, 'pause')}>
                            <lucide_react_1.Pause className="h-4 w-4 mr-1"/>
                            Pause
                          </button_1.Button>
                          <button_1.Button size="sm" variant="destructive" onClick={() => controlABTest(test.id, 'stop')}>
                            <lucide_react_1.Square className="h-4 w-4 mr-1"/>
                            Stop
                          </button_1.Button>
                        </>)}
                      {test.status === 'paused' && (<button_1.Button size="sm" onClick={() => controlABTest(test.id, 'start')}>
                          <lucide_react_1.Play className="h-4 w-4 mr-1"/>
                          Resume
                        </button_1.Button>)}
                    </div>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-4">
                    {/* Variants */}
                    <div>
                      <label_1.Label className="text-sm font-medium">Variants</label_1.Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {test.variants.map((variant) => {
                const result = test.results?.[variant.id];
                return (<div key={variant.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{variant.name}</span>
                                <badge_1.Badge variant="outline">{variant.weight}%</badge_1.Badge>
                              </div>
                              {result && (<div className="space-y-1 text-sm text-muted-foreground">
                                  <div>Visitors: {result.visitors.toLocaleString()}</div>
                                  <div>Conversions: {result.conversions.toLocaleString()}</div>
                                  <div className="font-medium text-foreground">
                                    Rate: {result.conversionRate.toFixed(2)}%
                                  </div>
                                </div>)}
                            </div>);
            })}
                      </div>
                    </div>
                    
                    {/* Metrics */}
                    <div>
                      <label_1.Label className="text-sm font-medium">Primary Metric</label_1.Label>
                      <div className="flex items-center gap-2 mt-1">
                        <lucide_react_1.Target className="h-4 w-4"/>
                        <span className="text-sm">{test.metrics.primary}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Traffic Allocation: {test.trafficAllocation}%</span>
                      <span>Created: {new Date(test.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>))}
          </div>
          
          {abTests.length === 0 && (<card_1.Card>
              <card_1.CardContent className="flex flex-col items-center justify-center py-12">
                <lucide_react_1.TestTube className="h-12 w-12 text-muted-foreground mb-4"/>
                <h3 className="text-lg font-medium mb-2">No A/B Tests</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first A/B test to start optimizing user experience
                </p>
                <button_1.Button>
                  <lucide_react_1.Plus className="h-4 w-4 mr-2"/>
                  Create A/B Test
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>)}
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
//# sourceMappingURL=feature-flags-manager.js.map