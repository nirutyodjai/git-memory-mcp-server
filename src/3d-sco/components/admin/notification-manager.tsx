'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Send,
  Users,
  Settings,
  TestTube,
  AlertCircle,
  CheckCircle,
  Loader2,
  BellRing,
  BellOff,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  icon?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'welcome',
    name: 'ยินดีต้อนรับ',
    title: '🎉 ยินดีต้อนรับสู่ 3D-SCO Portfolio',
    body: 'ขอบคุณที่เข้าร่วมกับเรา! สำรวจผลงานและโปรเจกต์ใหม่ๆ ได้เลย',
    icon: '/icons/icon-192x192.png',
    actions: [
      { action: 'explore', title: 'สำรวจผลงาน' },
      { action: 'close', title: 'ปิด' }
    ]
  },
  {
    id: 'new-project',
    name: 'โปรเจกต์ใหม่',
    title: '🚀 โปรเจกต์ใหม่เพิ่มแล้ว!',
    body: 'มาดูผลงานใหม่ล่าสุดที่เพิ่งเสร็จสมบูรณ์กันเถอะ',
    icon: '/icons/icon-192x192.png',
    actions: [
      { action: 'view', title: 'ดูโปรเจกต์' },
      { action: 'close', title: 'ปิด' }
    ]
  },
  {
    id: 'blog-post',
    name: 'บทความใหม่',
    title: '📝 บทความใหม่ในบล็อก',
    body: 'อ่านบทความใหม่เกี่ยวกับเทคโนโลยีและการพัฒนาเว็บไซต์',
    icon: '/icons/icon-192x192.png',
    actions: [
      { action: 'read', title: 'อ่านบทความ' },
      { action: 'close', title: 'ปิด' }
    ]
  },
  {
    id: 'maintenance',
    name: 'การบำรุงรักษา',
    title: '🔧 แจ้งเตือนการบำรุงรักษา',
    body: 'เว็บไซต์จะปิดปรับปรุงชั่วคราวในวันที่กำหนด',
    icon: '/icons/icon-192x192.png',
    actions: [
      { action: 'details', title: 'รายละเอียด' },
      { action: 'close', title: 'ปิด' }
    ]
  }
];

export function NotificationManager() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    sendNotificationToAll,
    clearError
  } = usePushNotifications();
  
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customNotification, setCustomNotification] = useState({
    title: '',
    body: '',
    icon: '/icons/icon-192x192.png',
    requireInteraction: false,
    vibrate: true
  });
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState({ totalSubscriptions: 0 });

  // Load subscription stats
  const loadStats = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setStats({ totalSubscriptions: data.totalSubscriptions });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Handle subscription toggle
  const handleSubscriptionToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: 'ยกเลิกการแจ้งเตือนแล้ว',
          description: 'คุณจะไม่ได้รับการแจ้งเตือนอีกต่อไป'
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: 'เปิดการแจ้งเตือนแล้ว',
          description: 'คุณจะได้รับการแจ้งเตือนเมื่อมีเนื้อหาใหม่'
        });
      }
    }
  };

  // Send test notification
  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      toast({
        title: 'ส่งการแจ้งเตือนทดสอบแล้ว',
        description: 'ตรวจสอบการแจ้งเตือนในอุปกรณ์ของคุณ'
      });
    }
  };

  // Send notification using template
  const handleSendTemplate = async () => {
    if (!selectedTemplate) return;
    
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    setIsSending(true);
    try {
      const success = await sendNotificationToAll({
        title: template.title,
        body: template.body,
        icon: template.icon,
        actions: template.actions,
        vibrate: [100, 50, 100],
        data: {
          template: template.id,
          timestamp: Date.now()
        }
      });

      if (success) {
        toast({
          title: 'ส่งการแจ้งเตือนแล้ว',
          description: `ส่งการแจ้งเตือน "${template.name}" ให้ผู้ติดตามทั้งหมดแล้ว`
        });
        await loadStats();
      }
    } finally {
      setIsSending(false);
    }
  };

  // Send custom notification
  const handleSendCustom = async () => {
    if (!customNotification.title || !customNotification.body) {
      toast({
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณากรอกหัวข้อและเนื้อหาการแจ้งเตือน',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    try {
      const success = await sendNotificationToAll({
        title: customNotification.title,
        body: customNotification.body,
        icon: customNotification.icon,
        requireInteraction: customNotification.requireInteraction,
        vibrate: customNotification.vibrate ? [100, 50, 100] : undefined,
        data: {
          custom: true,
          timestamp: Date.now()
        }
      });

      if (success) {
        toast({
          title: 'ส่งการแจ้งเตือนแล้ว',
          description: 'ส่งการแจ้งเตือนที่กำหนดเองให้ผู้ติดตามทั้งหมดแล้ว'
        });
        setCustomNotification({
          title: '',
          body: '',
          icon: '/icons/icon-192x192.png',
          requireInteraction: false,
          vibrate: true
        });
        await loadStats();
      }
    } finally {
      setIsSending(false);
    }
  };

  // Get permission status badge
  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />อนุญาต</Badge>;
      case 'denied':
        return <Badge variant="destructive"><BellOff className="h-3 w-3 mr-1" />ปฏิเสธ</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />รอการตัดสินใจ</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            การแจ้งเตือนไม่รองรับ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              เบราว์เซอร์ของคุณไม่รองรับการแจ้งเตือนแบบ Push Notifications
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            สถานะการแจ้งเตือน
          </CardTitle>
          <CardDescription>
            จัดการการแจ้งเตือนแบบ Push Notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              <Button variant="outline" size="sm" onClick={clearError} className="mt-2">
                ปิดข้อความ
              </Button>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">สิทธิ์การแจ้งเตือน</p>
                <p className="text-xs text-muted-foreground">สถานะการอนุญาต</p>
              </div>
              {getPermissionBadge()}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">การติดตาม</p>
                <p className="text-xs text-muted-foreground">สถานะการสมัครรับ</p>
              </div>
              <Badge variant={isSubscribed ? "default" : "secondary"}>
                {isSubscribed ? (
                  <><BellRing className="h-3 w-3 mr-1" />เปิดใช้งาน</>
                ) : (
                  <><BellOff className="h-3 w-3 mr-1" />ปิดใช้งาน</>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">ผู้ติดตาม</p>
                <p className="text-xs text-muted-foreground">จำนวนผู้สมัครรับ</p>
              </div>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {stats.totalSubscriptions}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSubscriptionToggle} 
              disabled={isLoading}
              variant={isSubscribed ? "destructive" : "default"}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubscribed ? 'ยกเลิกการแจ้งเตือน' : 'เปิดการแจ้งเตือน'}
            </Button>
            
            {isSubscribed && (
              <Button onClick={handleTestNotification} variant="outline">
                <TestTube className="h-4 w-4 mr-2" />
                ทดสอบการแจ้งเตือน
              </Button>
            )}
            
            <Button onClick={loadStats} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              รีเฟรชสถิติ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>ส่งการแจ้งเตือนจากเทมเพลต</CardTitle>
          <CardDescription>
            เลือกเทมเพลตการแจ้งเตือนที่กำหนดไว้แล้ว
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">เลือกเทมเพลต</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกเทมเพลตการแจ้งเตือน" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedTemplate && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">ตัวอย่างการแจ้งเตือน</h4>
              {(() => {
                const template = NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplate);
                return template ? (
                  <div className="space-y-2">
                    <p className="font-medium">{template.title}</p>
                    <p className="text-sm text-muted-foreground">{template.body}</p>
                    {template.actions && (
                      <div className="flex gap-2">
                        {template.actions.map((action, index) => (
                          <Badge key={index} variant="outline">{action.title}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null;
              })()
              }
            </div>
          )}
          
          <Button 
            onClick={handleSendTemplate} 
            disabled={!selectedTemplate || isSending}
            className="w-full"
          >
            {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Send className="h-4 w-4 mr-2" />
            ส่งการแจ้งเตือน
          </Button>
        </CardContent>
      </Card>

      {/* Custom Notification */}
      <Card>
        <CardHeader>
          <CardTitle>สร้างการแจ้งเตือนที่กำหนดเอง</CardTitle>
          <CardDescription>
            สร้างและส่งการแจ้งเตือนที่กำหนดเองให้ผู้ติดตามทั้งหมด
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">หัวข้อการแจ้งเตือน</Label>
            <Input
              id="title"
              placeholder="หัวข้อการแจ้งเตือน"
              value={customNotification.title}
              onChange={(e) => setCustomNotification(prev => ({ ...prev, title: e.target.value }))}
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="body">เนื้อหาการแจ้งเตือน</Label>
            <Textarea
              id="body"
              placeholder="เนื้อหาการแจ้งเตือน"
              value={customNotification.body}
              onChange={(e) => setCustomNotification(prev => ({ ...prev, body: e.target.value }))}
              maxLength={300}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icon">ไอคอน URL</Label>
            <Input
              id="icon"
              placeholder="URL ของไอคอน"
              value={customNotification.icon}
              onChange={(e) => setCustomNotification(prev => ({ ...prev, icon: e.target.value }))}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-interaction">ต้องการการตอบสนอง</Label>
                <p className="text-xs text-muted-foreground">การแจ้งเตือนจะไม่หายไปจนกว่าผู้ใช้จะตอบสนอง</p>
              </div>
              <Switch
                id="require-interaction"
                checked={customNotification.requireInteraction}
                onCheckedChange={(checked) => setCustomNotification(prev => ({ ...prev, requireInteraction: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="vibrate">การสั่น</Label>
                <p className="text-xs text-muted-foreground">เปิดการสั่นเมื่อได้รับการแจ้งเตือน</p>
              </div>
              <Switch
                id="vibrate"
                checked={customNotification.vibrate}
                onCheckedChange={(checked) => setCustomNotification(prev => ({ ...prev, vibrate: checked }))}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSendCustom} 
            disabled={!customNotification.title || !customNotification.body || isSending}
            className="w-full"
          >
            {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Send className="h-4 w-4 mr-2" />
            ส่งการแจ้งเตือนที่กำหนดเอง
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}