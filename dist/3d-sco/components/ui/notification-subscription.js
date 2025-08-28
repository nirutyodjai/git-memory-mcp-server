"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSubscription = NotificationSubscription;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const alert_1 = require("@/components/ui/alert");
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const use_push_notifications_1 = require("@/hooks/use-push-notifications");
const use_toast_1 = require("@/hooks/use-toast");
function NotificationSubscription({ variant = 'card', showDismiss = false, className = '' }) {
    const { isSupported, isSubscribed, isLoading, permission, error, subscribe, unsubscribe, sendTestNotification, clearError } = (0, use_push_notifications_1.usePushNotifications)();
    const { toast } = (0, use_toast_1.useToast)();
    const [isDismissed, setIsDismissed] = (0, react_1.useState)(false);
    const [showSuccess, setShowSuccess] = (0, react_1.useState)(false);
    // Check if user has previously dismissed the notification prompt
    (0, react_1.useEffect)(() => {
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        setIsDismissed(dismissed === 'true');
    }, []);
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
                setShowSuccess(true);
                toast({
                    title: 'เปิดการแจ้งเตือนแล้ว! 🎉',
                    description: 'คุณจะได้รับการแจ้งเตือนเมื่อมีเนื้อหาใหม่'
                });
                // Send welcome notification after a short delay
                setTimeout(async () => {
                    await sendTestNotification();
                }, 2000);
            }
        }
    };
    // Handle dismiss
    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('notification-prompt-dismissed', 'true');
    };
    // Don't show if not supported or dismissed (for non-minimal variants)
    if (!isSupported || (isDismissed && variant !== 'minimal' && showDismiss)) {
        return null;
    }
    // Don't show if permission is denied and user hasn't subscribed
    if (permission === 'denied' && !isSubscribed && variant !== 'minimal') {
        return null;
    }
    const getStatusBadge = () => {
        if (isSubscribed) {
            return (<badge_1.Badge variant="default" className="bg-green-500">
          <lucide_react_1.BellRing className="h-3 w-3 mr-1"/>
          เปิดใช้งาน
        </badge_1.Badge>);
        }
        if (permission === 'denied') {
            return (<badge_1.Badge variant="destructive">
          <lucide_react_1.BellOff className="h-3 w-3 mr-1"/>
          ถูกปฏิเสธ
        </badge_1.Badge>);
        }
        return (<badge_1.Badge variant="secondary">
        <lucide_react_1.Bell className="h-3 w-3 mr-1"/>
        ยังไม่ได้เปิดใช้งาน
      </badge_1.Badge>);
    };
    if (variant === 'minimal') {
        return (<div className={`flex items-center gap-2 ${className}`}>
        {getStatusBadge()}
        <button_1.Button size="sm" variant={isSubscribed ? "outline" : "default"} onClick={handleSubscriptionToggle} disabled={isLoading || permission === 'denied'}>
          {isLoading && <lucide_react_1.Loader2 className="h-3 w-3 mr-1 animate-spin"/>}
          {isSubscribed ? (<><lucide_react_1.BellOff className="h-3 w-3 mr-1"/>ยกเลิก</>) : (<><lucide_react_1.Bell className="h-3 w-3 mr-1"/>เปิดการแจ้งเตือน</>)}
        </button_1.Button>
      </div>);
    }
    if (variant === 'inline') {
        return (<div className={`flex items-center justify-between p-4 border rounded-lg bg-muted/50 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <lucide_react_1.Bell className="h-5 w-5 text-primary"/>
          </div>
          <div>
            <h4 className="font-medium">
              {isSubscribed ? 'การแจ้งเตือนเปิดใช้งานแล้ว' : 'เปิดการแจ้งเตือน'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? 'คุณจะได้รับการแจ้งเตือนเมื่อมีเนื้อหาใหม่'
                : 'รับการแจ้งเตือนเมื่อมีผลงานและบทความใหม่'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button_1.Button size="sm" variant={isSubscribed ? "outline" : "default"} onClick={handleSubscriptionToggle} disabled={isLoading || permission === 'denied'}>
            {isLoading && <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
            {isSubscribed ? 'ยกเลิก' : 'เปิดใช้งาน'}
          </button_1.Button>
          
          {showDismiss && !isSubscribed && (<button_1.Button size="sm" variant="ghost" onClick={handleDismiss}>
              <lucide_react_1.X className="h-4 w-4"/>
            </button_1.Button>)}
        </div>
      </div>);
    }
    // Card variant (default)
    return (<card_1.Card className={className}>
      <card_1.CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <lucide_react_1.Bell className="h-5 w-5"/>
            <card_1.CardTitle className="text-lg">
              {isSubscribed ? 'การแจ้งเตือนเปิดใช้งานแล้ว' : 'เปิดการแจ้งเตือน'}
            </card_1.CardTitle>
          </div>
          
          {showDismiss && !isSubscribed && (<button_1.Button size="sm" variant="ghost" onClick={handleDismiss}>
              <lucide_react_1.X className="h-4 w-4"/>
            </button_1.Button>)}
        </div>
        
        <card_1.CardDescription>
          {isSubscribed
            ? 'คุณจะได้รับการแจ้งเตือนเมื่อมีเนื้อหาใหม่ ผลงาน หรือบทความใหม่'
            : 'รับการแจ้งเตือนทันทีเมื่อมีผลงานใหม่ บทความ หรือการอัปเดตสำคัญ'}
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
        
        {showSuccess && isSubscribed && (<alert_1.Alert>
            <lucide_react_1.CheckCircle className="h-4 w-4"/>
            <alert_1.AlertDescription>
              🎉 ยินดีด้วย! คุณจะได้รับการแจ้งเตือนเมื่อมีเนื้อหาใหม่แล้ว
            </alert_1.AlertDescription>
          </alert_1.Alert>)}
        
        {permission === 'denied' && (<alert_1.Alert variant="destructive">
            <lucide_react_1.BellOff className="h-4 w-4"/>
            <alert_1.AlertDescription>
              การแจ้งเตือนถูกปฏิเสธ กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์
            </alert_1.AlertDescription>
          </alert_1.Alert>)}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">สถานะ:</span>
            {getStatusBadge()}
          </div>
          
          <div className="flex gap-2">
            {isSubscribed && (<button_1.Button size="sm" variant="outline" onClick={sendTestNotification} disabled={isLoading}>
                ทดสอบ
              </button_1.Button>)}
            
            <button_1.Button onClick={handleSubscriptionToggle} disabled={isLoading || permission === 'denied'} variant={isSubscribed ? "outline" : "default"}>
              {isLoading && <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
              {isSubscribed ? (<><lucide_react_1.BellOff className="h-4 w-4 mr-2"/>ยกเลิกการแจ้งเตือน</>) : (<><lucide_react_1.Bell className="h-4 w-4 mr-2"/>เปิดการแจ้งเตือน</>)}
            </button_1.Button>
          </div>
        </div>
        
        {isSubscribed && (<div className="text-xs text-muted-foreground">
            💡 เคล็ดลับ: คุณสามารถปิดการแจ้งเตือนได้ตลอดเวลาในการตั้งค่าเบราว์เซอร์
          </div>)}
      </card_1.CardContent>
    </card_1.Card>);
}
//# sourceMappingURL=notification-subscription.js.map