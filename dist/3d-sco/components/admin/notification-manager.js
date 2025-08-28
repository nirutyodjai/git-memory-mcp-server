"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = NotificationManager;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const label_1 = require("@/components/ui/label");
const badge_1 = require("@/components/ui/badge");
const switch_1 = require("@/components/ui/switch");
const separator_1 = require("@/components/ui/separator");
const alert_1 = require("@/components/ui/alert");
const select_1 = require("@/components/ui/select");
const lucide_react_1 = require("lucide-react");
const use_push_notifications_1 = require("@/hooks/use-push-notifications");
const use_toast_1 = require("@/hooks/use-toast");
const NOTIFICATION_TEMPLATES = [
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
function NotificationManager() {
    const { isSupported, isSubscribed, isLoading, permission, error, subscribe, unsubscribe, sendTestNotification, sendNotificationToAll, clearError } = (0, use_push_notifications_1.usePushNotifications)();
    const { toast } = (0, use_toast_1.useToast)();
    const [selectedTemplate, setSelectedTemplate] = (0, react_1.useState)('');
    const [customNotification, setCustomNotification] = (0, react_1.useState)({
        title: '',
        body: '',
        icon: '/icons/icon-192x192.png',
        requireInteraction: false,
        vibrate: true
    });
    const [isSending, setIsSending] = (0, react_1.useState)(false);
    const [stats, setStats] = (0, react_1.useState)({ totalSubscriptions: 0 });
    // Load subscription stats
    const loadStats = async () => {
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setStats({ totalSubscriptions: data.totalSubscriptions });
            }
        }
        catch (error) {
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
        }
        else {
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
        if (!selectedTemplate)
            return;
        const template = NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplate);
        if (!template)
            return;
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
        }
        finally {
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
        }
        finally {
            setIsSending(false);
        }
    };
    // Get permission status badge
    const getPermissionBadge = () => {
        switch (permission) {
            case 'granted':
                return <badge_1.Badge variant="default" className="bg-green-500"><lucide_react_1.CheckCircle className="h-3 w-3 mr-1"/>อนุญาต</badge_1.Badge>;
            case 'denied':
                return <badge_1.Badge variant="destructive"><lucide_react_1.BellOff className="h-3 w-3 mr-1"/>ปฏิเสธ</badge_1.Badge>;
            default:
                return <badge_1.Badge variant="secondary"><lucide_react_1.AlertCircle className="h-3 w-3 mr-1"/>รอการตัดสินใจ</badge_1.Badge>;
        }
    };
    if (!isSupported) {
        return (<card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.BellOff className="h-5 w-5"/>
            การแจ้งเตือนไม่รองรับ
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <alert_1.Alert>
            <lucide_react_1.AlertCircle className="h-4 w-4"/>
            <alert_1.AlertDescription>
              เบราว์เซอร์ของคุณไม่รองรับการแจ้งเตือนแบบ Push Notifications
            </alert_1.AlertDescription>
          </alert_1.Alert>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<div className="space-y-6">
      {/* Status Card */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.Bell className="h-5 w-5"/>
            สถานะการแจ้งเตือน
          </card_1.CardTitle>
          <card_1.CardDescription>
            จัดการการแจ้งเตือนแบบ Push Notifications
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          {error && (<alert_1.Alert variant="destructive">
              <lucide_react_1.AlertCircle className="h-4 w-4"/>
              <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
              <button_1.Button variant="outline" size="sm" onClick={clearError} className="mt-2">
                ปิดข้อความ
              </button_1.Button>
            </alert_1.Alert>)}
          
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
              <badge_1.Badge variant={isSubscribed ? "default" : "secondary"}>
                {isSubscribed ? (<><lucide_react_1.BellRing className="h-3 w-3 mr-1"/>เปิดใช้งาน</>) : (<><lucide_react_1.BellOff className="h-3 w-3 mr-1"/>ปิดใช้งาน</>)}
              </badge_1.Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">ผู้ติดตาม</p>
                <p className="text-xs text-muted-foreground">จำนวนผู้สมัครรับ</p>
              </div>
              <badge_1.Badge variant="outline">
                <lucide_react_1.Users className="h-3 w-3 mr-1"/>
                {stats.totalSubscriptions}
              </badge_1.Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button_1.Button onClick={handleSubscriptionToggle} disabled={isLoading} variant={isSubscribed ? "destructive" : "default"}>
              {isLoading && <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
              {isSubscribed ? 'ยกเลิกการแจ้งเตือน' : 'เปิดการแจ้งเตือน'}
            </button_1.Button>
            
            {isSubscribed && (<button_1.Button onClick={handleTestNotification} variant="outline">
                <lucide_react_1.TestTube className="h-4 w-4 mr-2"/>
                ทดสอบการแจ้งเตือน
              </button_1.Button>)}
            
            <button_1.Button onClick={loadStats} variant="outline">
              <lucide_react_1.Settings className="h-4 w-4 mr-2"/>
              รีเฟรชสถิติ
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Template Notifications */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>ส่งการแจ้งเตือนจากเทมเพลต</card_1.CardTitle>
          <card_1.CardDescription>
            เลือกเทมเพลตการแจ้งเตือนที่กำหนดไว้แล้ว
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          <div className="space-y-2">
            <label_1.Label htmlFor="template">เลือกเทมเพลต</label_1.Label>
            <select_1.Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="เลือกเทมเพลตการแจ้งเตือน"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                {NOTIFICATION_TEMPLATES.map((template) => (<select_1.SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </select_1.SelectItem>))}
              </select_1.SelectContent>
            </select_1.Select>
          </div>
          
          {selectedTemplate && (<div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">ตัวอย่างการแจ้งเตือน</h4>
              {(() => {
                const template = NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplate);
                return template ? (<div className="space-y-2">
                    <p className="font-medium">{template.title}</p>
                    <p className="text-sm text-muted-foreground">{template.body}</p>
                    {template.actions && (<div className="flex gap-2">
                        {template.actions.map((action, index) => (<badge_1.Badge key={index} variant="outline">{action.title}</badge_1.Badge>))}
                      </div>)}
                  </div>) : null;
            })()}
            </div>)}
          
          <button_1.Button onClick={handleSendTemplate} disabled={!selectedTemplate || isSending} className="w-full">
            {isSending && <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
            <lucide_react_1.Send className="h-4 w-4 mr-2"/>
            ส่งการแจ้งเตือน
          </button_1.Button>
        </card_1.CardContent>
      </card_1.Card>

      {/* Custom Notification */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>สร้างการแจ้งเตือนที่กำหนดเอง</card_1.CardTitle>
          <card_1.CardDescription>
            สร้างและส่งการแจ้งเตือนที่กำหนดเองให้ผู้ติดตามทั้งหมด
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          <div className="space-y-2">
            <label_1.Label htmlFor="title">หัวข้อการแจ้งเตือน</label_1.Label>
            <input_1.Input id="title" placeholder="หัวข้อการแจ้งเตือน" value={customNotification.title} onChange={(e) => setCustomNotification(prev => ({ ...prev, title: e.target.value }))} maxLength={100}/>
          </div>
          
          <div className="space-y-2">
            <label_1.Label htmlFor="body">เนื้อหาการแจ้งเตือน</label_1.Label>
            <textarea_1.Textarea id="body" placeholder="เนื้อหาการแจ้งเตือน" value={customNotification.body} onChange={(e) => setCustomNotification(prev => ({ ...prev, body: e.target.value }))} maxLength={300} rows={3}/>
          </div>
          
          <div className="space-y-2">
            <label_1.Label htmlFor="icon">ไอคอน URL</label_1.Label>
            <input_1.Input id="icon" placeholder="URL ของไอคอน" value={customNotification.icon} onChange={(e) => setCustomNotification(prev => ({ ...prev, icon: e.target.value }))}/>
          </div>
          
          <separator_1.Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label_1.Label htmlFor="require-interaction">ต้องการการตอบสนอง</label_1.Label>
                <p className="text-xs text-muted-foreground">การแจ้งเตือนจะไม่หายไปจนกว่าผู้ใช้จะตอบสนอง</p>
              </div>
              <switch_1.Switch id="require-interaction" checked={customNotification.requireInteraction} onCheckedChange={(checked) => setCustomNotification(prev => ({ ...prev, requireInteraction: checked }))}/>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label_1.Label htmlFor="vibrate">การสั่น</label_1.Label>
                <p className="text-xs text-muted-foreground">เปิดการสั่นเมื่อได้รับการแจ้งเตือน</p>
              </div>
              <switch_1.Switch id="vibrate" checked={customNotification.vibrate} onCheckedChange={(checked) => setCustomNotification(prev => ({ ...prev, vibrate: checked }))}/>
            </div>
          </div>
          
          <button_1.Button onClick={handleSendCustom} disabled={!customNotification.title || !customNotification.body || isSending} className="w-full">
            {isSending && <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
            <lucide_react_1.Send className="h-4 w-4 mr-2"/>
            ส่งการแจ้งเตือนที่กำหนดเอง
          </button_1.Button>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
//# sourceMappingURL=notification-manager.js.map