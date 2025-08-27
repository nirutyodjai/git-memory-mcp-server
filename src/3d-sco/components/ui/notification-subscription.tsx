'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationSubscriptionProps {
  variant?: 'card' | 'inline' | 'minimal';
  showDismiss?: boolean;
  className?: string;
}

export function NotificationSubscription({ 
  variant = 'card', 
  showDismiss = false,
  className = '' 
}: NotificationSubscriptionProps) {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    clearError
  } = usePushNotifications();
  
  const { toast } = useToast();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user has previously dismissed the notification prompt
  useEffect(() => {
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
    } else {
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
      return (
        <Badge variant="default" className="bg-green-500">
          <BellRing className="h-3 w-3 mr-1" />
          เปิดใช้งาน
        </Badge>
      );
    }
    
    if (permission === 'denied') {
      return (
        <Badge variant="destructive">
          <BellOff className="h-3 w-3 mr-1" />
          ถูกปฏิเสธ
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary">
        <Bell className="h-3 w-3 mr-1" />
        ยังไม่ได้เปิดใช้งาน
      </Badge>
    );
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusBadge()}
        <Button
          size="sm"
          variant={isSubscribed ? "outline" : "default"}
          onClick={handleSubscriptionToggle}
          disabled={isLoading || permission === 'denied'}
        >
          {isLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {isSubscribed ? (
            <><BellOff className="h-3 w-3 mr-1" />ยกเลิก</>
          ) : (
            <><Bell className="h-3 w-3 mr-1" />เปิดการแจ้งเตือน</>
          )}
        </Button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center justify-between p-4 border rounded-lg bg-muted/50 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">
              {isSubscribed ? 'การแจ้งเตือนเปิดใช้งานแล้ว' : 'เปิดการแจ้งเตือน'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? 'คุณจะได้รับการแจ้งเตือนเมื่อมีเนื้อหาใหม่' 
                : 'รับการแจ้งเตือนเมื่อมีผลงานและบทความใหม่'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button
            size="sm"
            variant={isSubscribed ? "outline" : "default"}
            onClick={handleSubscriptionToggle}
            disabled={isLoading || permission === 'denied'}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubscribed ? 'ยกเลิก' : 'เปิดใช้งาน'}
          </Button>
          
          {showDismiss && !isSubscribed && (
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle className="text-lg">
              {isSubscribed ? 'การแจ้งเตือนเปิดใช้งานแล้ว' : 'เปิดการแจ้งเตือน'}
            </CardTitle>
          </div>
          
          {showDismiss && !isSubscribed && (
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <CardDescription>
          {isSubscribed 
            ? 'คุณจะได้รับการแจ้งเตือนเมื่อมีเนื้อหาใหม่ ผลงาน หรือบทความใหม่' 
            : 'รับการแจ้งเตือนทันทีเมื่อมีผลงานใหม่ บทความ หรือการอัปเดตสำคัญ'
          }
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
        
        {showSuccess && isSubscribed && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              🎉 ยินดีด้วย! คุณจะได้รับการแจ้งเตือนเมื่อมีเนื้อหาใหม่แล้ว
            </AlertDescription>
          </Alert>
        )}
        
        {permission === 'denied' && (
          <Alert variant="destructive">
            <BellOff className="h-4 w-4" />
            <AlertDescription>
              การแจ้งเตือนถูกปฏิเสธ กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">สถานะ:</span>
            {getStatusBadge()}
          </div>
          
          <div className="flex gap-2">
            {isSubscribed && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={sendTestNotification}
                disabled={isLoading}
              >
                ทดสอบ
              </Button>
            )}
            
            <Button
              onClick={handleSubscriptionToggle}
              disabled={isLoading || permission === 'denied'}
              variant={isSubscribed ? "outline" : "default"}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubscribed ? (
                <><BellOff className="h-4 w-4 mr-2" />ยกเลิกการแจ้งเตือน</>
              ) : (
                <><Bell className="h-4 w-4 mr-2" />เปิดการแจ้งเตือน</>
              )}
            </Button>
          </div>
        </div>
        
        {isSubscribed && (
          <div className="text-xs text-muted-foreground">
            💡 เคล็ดลับ: คุณสามารถปิดการแจ้งเตือนได้ตลอดเวลาในการตั้งค่าเบราว์เซอร์
          </div>
        )}
      </CardContent>
    </Card>
  );
}