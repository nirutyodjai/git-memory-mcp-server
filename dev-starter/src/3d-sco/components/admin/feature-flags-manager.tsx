'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Flag,
  TestTube,
  Play,
  Pause,
  Square,
  Trash2,
  Edit,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: {
    userSegments?: string[];
    countries?: string[];
    devices?: string[];
    browsers?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: {
    id: string;
    name: string;
    weight: number;
    config: Record<string, any>;
  }[];
  trafficAllocation: number;
  startDate?: string;
  endDate?: string;
  metrics: {
    primary: string;
    secondary?: string[];
  };
  results?: {
    [variantId: string]: {
      conversions: number;
      visitors: number;
      conversionRate: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export function FeatureFlagsManager() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [abTests, setABTests] = useState<ABTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('flags');
  const { toast } = useToast();

  // Form states
  const [newFlag, setNewFlag] = useState({
    name: '',
    description: '',
    enabled: false,
    rolloutPercentage: 0,
  });

  const [newTest, setNewTest] = useState({
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
      if (!response.ok) throw new Error('Failed to fetch data');
      
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
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch feature flags and A/B tests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
      
      if (!response.ok) throw new Error('Failed to create feature flag');
      
      const result = await response.json();
      setFeatureFlags(prev => [...prev, result.data]);
      setNewFlag({ name: '', description: '', enabled: false, rolloutPercentage: 0 });
      
      toast({
        title: 'Success',
        description: 'Feature flag created successfully',
      });
      
    } catch (error) {
      console.error('Error creating feature flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create feature flag',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle feature flag
  const toggleFeatureFlag = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'flag', enabled }),
      });
      
      if (!response.ok) throw new Error('Failed to update feature flag');
      
      setFeatureFlags(prev => 
        prev.map(flag => 
          flag.id === id ? { ...flag, enabled } : flag
        )
      );
      
      toast({
        title: 'Success',
        description: `Feature flag ${enabled ? 'enabled' : 'disabled'}`,
      });
      
    } catch (error) {
      console.error('Error updating feature flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feature flag',
        variant: 'destructive',
      });
    }
  };

  // Update rollout percentage
  const updateRolloutPercentage = async (id: string, rolloutPercentage: number) => {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'flag', rolloutPercentage }),
      });
      
      if (!response.ok) throw new Error('Failed to update rollout percentage');
      
      setFeatureFlags(prev => 
        prev.map(flag => 
          flag.id === id ? { ...flag, rolloutPercentage } : flag
        )
      );
      
    } catch (error) {
      console.error('Error updating rollout percentage:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rollout percentage',
        variant: 'destructive',
      });
    }
  };

  // Control A/B test
  const controlABTest = async (id: string, action: 'start' | 'pause' | 'stop') => {
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
      
      if (!response.ok) throw new Error(`Failed to ${action} A/B test`);
      
      setABTests(prev => 
        prev.map(test => 
          test.id === id ? { ...test, status: statusMap[action] as any } : test
        )
      );
      
      toast({
        title: 'Success',
        description: `A/B test ${action}ed successfully`,
      });
      
    } catch (error) {
      console.error(`Error ${action}ing A/B test:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} A/B test`,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading feature flags...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Feature Flags & A/B Testing</h2>
          <p className="text-muted-foreground">
            จัดการ feature flags และทดสอบ A/B เพื่อปรับปรุงประสบการณ์ผู้ใช้
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="flags">
            <Flag className="h-4 w-4 mr-2" />
            Feature Flags ({featureFlags.length})
          </TabsTrigger>
          <TabsTrigger value="tests">
            <TestTube className="h-4 w-4 mr-2" />
            A/B Tests ({abTests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flags" className="space-y-4">
          {/* Create Feature Flag */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Feature Flag
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="flag-name">Name</Label>
                  <Input
                    id="flag-name"
                    value={newFlag.name}
                    onChange={(e) => setNewFlag(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., new-checkout-flow"
                  />
                </div>
                <div>
                  <Label htmlFor="flag-rollout">Rollout Percentage</Label>
                  <Input
                    id="flag-rollout"
                    type="number"
                    min="0"
                    max="100"
                    value={newFlag.rolloutPercentage}
                    onChange={(e) => setNewFlag(prev => ({ ...prev, rolloutPercentage: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="flag-description">Description</Label>
                <Textarea
                  id="flag-description"
                  value={newFlag.description}
                  onChange={(e) => setNewFlag(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this feature flag controls..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newFlag.enabled}
                  onCheckedChange={(enabled) => setNewFlag(prev => ({ ...prev, enabled }))}
                />
                <Label>Enable immediately</Label>
              </div>
              <Button onClick={createFeatureFlag} disabled={isCreating || !newFlag.name}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Feature Flag
              </Button>
            </CardContent>
          </Card>

          {/* Feature Flags List */}
          <div className="grid gap-4">
            {featureFlags.map((flag) => (
              <Card key={flag.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5" />
                        {flag.name}
                        <Badge variant={flag.enabled ? "default" : "secondary"}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{flag.description}</CardDescription>
                    </div>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(enabled) => toggleFeatureFlag(flag.id, enabled)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Rollout Percentage</Label>
                        <span className="text-sm text-muted-foreground">
                          {flag.rolloutPercentage}%
                        </span>
                      </div>
                      <Progress value={flag.rolloutPercentage} className="h-2" />
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={flag.rolloutPercentage}
                        onChange={(e) => updateRolloutPercentage(flag.id, parseInt(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created: {new Date(flag.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(flag.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          {/* A/B Tests List */}
          <div className="grid gap-4">
            {abTests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TestTube className="h-5 w-5" />
                        {test.name}
                        <Badge variant="outline" className={getStatusColor(test.status)}>
                          {getStatusIcon(test.status)}
                          {test.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                    
                    <div className="flex gap-2">
                      {test.status === 'draft' && (
                        <Button size="sm" onClick={() => controlABTest(test.id, 'start')}>
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {test.status === 'running' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => controlABTest(test.id, 'pause')}>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => controlABTest(test.id, 'stop')}>
                            <Square className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        </>
                      )}
                      {test.status === 'paused' && (
                        <Button size="sm" onClick={() => controlABTest(test.id, 'start')}>
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Variants */}
                    <div>
                      <Label className="text-sm font-medium">Variants</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {test.variants.map((variant) => {
                          const result = test.results?.[variant.id];
                          return (
                            <div key={variant.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{variant.name}</span>
                                <Badge variant="outline">{variant.weight}%</Badge>
                              </div>
                              {result && (
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <div>Visitors: {result.visitors.toLocaleString()}</div>
                                  <div>Conversions: {result.conversions.toLocaleString()}</div>
                                  <div className="font-medium text-foreground">
                                    Rate: {result.conversionRate.toFixed(2)}%
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Metrics */}
                    <div>
                      <Label className="text-sm font-medium">Primary Metric</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Target className="h-4 w-4" />
                        <span className="text-sm">{test.metrics.primary}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Traffic Allocation: {test.trafficAllocation}%</span>
                      <span>Created: {new Date(test.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {abTests.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TestTube className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No A/B Tests</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first A/B test to start optimizing user experience
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create A/B Test
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}