'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Music,
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { socialService, SocialPlatform } from '@/lib/social/social-service';
import { useTranslation } from '@/lib/i18n/use-translation';

const platformIcons: Record<string, React.ComponentType<any>> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music,
};

export function SocialPlatforms() {
  const { t } = useTranslation();
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectDialog, setConnectDialog] = useState<{
    open: boolean;
    platform?: SocialPlatform;
  }>({ open: false });
  const [credentials, setCredentials] = useState({
    username: '',
    accessToken: '',
  });
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      const data = await socialService.getPlatforms();
      setPlatforms(data);
    } catch (error) {
      console.error('Failed to load platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!connectDialog.platform) return;

    try {
      setConnecting(true);
      await socialService.connectPlatform(connectDialog.platform.id, credentials);
      await loadPlatforms();
      setConnectDialog({ open: false });
      setCredentials({ username: '', accessToken: '' });
    } catch (error) {
      console.error('Failed to connect platform:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      await socialService.disconnectPlatform(platformId);
      await loadPlatforms();
    } catch (error) {
      console.error('Failed to disconnect platform:', error);
    }
  };

  const handleSync = async (platformId: string) => {
    try {
      setSyncing(platformId);
      await socialService.syncPlatform(platformId);
      await loadPlatforms();
    } catch (error) {
      console.error('Failed to sync platform:', error);
    } finally {
      setSyncing(null);
    }
  };

  const openConnectDialog = (platform: SocialPlatform) => {
    setConnectDialog({ open: true, platform });
    setCredentials({ username: '', accessToken: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('social.platforms.title')}</h2>
          <p className="text-muted-foreground">
            {t('social.platforms.description')}
          </p>
        </div>
        <Button onClick={loadPlatforms} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => {
          const IconComponent = platformIcons[platform.icon] || LinkIcon;
          
          return (
            <Card key={platform.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${platform.color}20` }}
                    >
                      <IconComponent 
                        className="w-6 h-6" 
                        style={{ color: platform.color }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      {platform.isConnected && platform.username && (
                        <p className="text-sm text-muted-foreground">
                          @{platform.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={platform.isConnected ? 'default' : 'secondary'}
                    className={platform.isConnected ? 'bg-green-100 text-green-800' : ''}
                  >
                    {platform.isConnected ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {platform.isConnected ? t('social.connected') : t('social.disconnected')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {platform.isConnected ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {platform.followers && (
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{platform.followers.toLocaleString()} {t('social.followers')}</span>
                        </div>
                      )}
                      {platform.lastSync && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(platform.lastSync).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSync(platform.id)}
                        disabled={syncing === platform.id}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {syncing === platform.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        {t('social.sync')}
                      </Button>
                      <Button
                        onClick={() => handleDisconnect(platform.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        {t('social.disconnect')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    onClick={() => openConnectDialog(platform)}
                    className="w-full"
                    style={{ backgroundColor: platform.color }}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {t('social.connect')}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connect Dialog */}
      <Dialog 
        open={connectDialog.open} 
        onOpenChange={(open) => setConnectDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('social.connect')} {connectDialog.platform?.name}
            </DialogTitle>
            <DialogDescription>
              {t('social.connectDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                {t('social.connectNote')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="username">{t('social.username')}</Label>
              <Input
                id="username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder={t('social.usernamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">{t('social.accessToken')}</Label>
              <Input
                id="accessToken"
                type="password"
                value={credentials.accessToken}
                onChange={(e) => setCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
                placeholder={t('social.accessTokenPlaceholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConnectDialog({ open: false })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConnect}
              disabled={connecting || !credentials.username || !credentials.accessToken}
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4 mr-2" />
              )}
              {t('social.connect')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}