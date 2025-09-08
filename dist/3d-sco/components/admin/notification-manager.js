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
                return React.createElement(badge_1.Badge, { variant: "default", className: "bg-green-500" },
                    React.createElement(lucide_react_1.CheckCircle, { className: "h-3 w-3 mr-1" }),
                    "\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15");
            case 'denied':
                return React.createElement(badge_1.Badge, { variant: "destructive" },
                    React.createElement(lucide_react_1.BellOff, { className: "h-3 w-3 mr-1" }),
                    "\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18");
            default:
                return React.createElement(badge_1.Badge, { variant: "secondary" },
                    React.createElement(lucide_react_1.AlertCircle, { className: "h-3 w-3 mr-1" }),
                    "\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E43\u0E08");
        }
    };
    if (!isSupported) {
        return (React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                    React.createElement(lucide_react_1.BellOff, { className: "h-5 w-5" }),
                    "\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A")),
            React.createElement(card_1.CardContent, null,
                React.createElement(alert_1.Alert, null,
                    React.createElement(lucide_react_1.AlertCircle, { className: "h-4 w-4" }),
                    React.createElement(alert_1.AlertDescription, null, "\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E41\u0E1A\u0E1A Push Notifications")))));
    }
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                    React.createElement(lucide_react_1.Bell, { className: "h-5 w-5" }),
                    "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19"),
                React.createElement(card_1.CardDescription, null, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E41\u0E1A\u0E1A Push Notifications")),
            React.createElement(card_1.CardContent, { className: "space-y-4" },
                error && (React.createElement(alert_1.Alert, { variant: "destructive" },
                    React.createElement(lucide_react_1.AlertCircle, { className: "h-4 w-4" }),
                    React.createElement(alert_1.AlertDescription, null, error),
                    React.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: clearError, className: "mt-2" }, "\u0E1B\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21"))),
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
                    React.createElement("div", { className: "flex items-center justify-between p-3 border rounded-lg" },
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-sm font-medium" }, "\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19"),
                            React.createElement("p", { className: "text-xs text-muted-foreground" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15")),
                        getPermissionBadge()),
                    React.createElement("div", { className: "flex items-center justify-between p-3 border rounded-lg" },
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-sm font-medium" }, "\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21"),
                            React.createElement("p", { className: "text-xs text-muted-foreground" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E01\u0E32\u0E23\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E23\u0E31\u0E1A")),
                        React.createElement(badge_1.Badge, { variant: isSubscribed ? "default" : "secondary" }, isSubscribed ? (React.createElement(React.Fragment, null,
                            React.createElement(lucide_react_1.BellRing, { className: "h-3 w-3 mr-1" }),
                            "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19")) : (React.createElement(React.Fragment, null,
                            React.createElement(lucide_react_1.BellOff, { className: "h-3 w-3 mr-1" }),
                            "\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19")))),
                    React.createElement("div", { className: "flex items-center justify-between p-3 border rounded-lg" },
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-sm font-medium" }, "\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21"),
                            React.createElement("p", { className: "text-xs text-muted-foreground" }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E1C\u0E39\u0E49\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E23\u0E31\u0E1A")),
                        React.createElement(badge_1.Badge, { variant: "outline" },
                            React.createElement(lucide_react_1.Users, { className: "h-3 w-3 mr-1" }),
                            stats.totalSubscriptions))),
                React.createElement("div", { className: "flex gap-2" },
                    React.createElement(button_1.Button, { onClick: handleSubscriptionToggle, disabled: isLoading, variant: isSubscribed ? "destructive" : "default" },
                        isLoading && React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                        isSubscribed ? 'ยกเลิกการแจ้งเตือน' : 'เปิดการแจ้งเตือน'),
                    isSubscribed && (React.createElement(button_1.Button, { onClick: handleTestNotification, variant: "outline" },
                        React.createElement(lucide_react_1.TestTube, { className: "h-4 w-4 mr-2" }),
                        "\u0E17\u0E14\u0E2A\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19")),
                    React.createElement(button_1.Button, { onClick: loadStats, variant: "outline" },
                        React.createElement(lucide_react_1.Settings, { className: "h-4 w-4 mr-2" }),
                        "\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2A\u0E16\u0E34\u0E15\u0E34")))),
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "\u0E2A\u0E48\u0E07\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E08\u0E32\u0E01\u0E40\u0E17\u0E21\u0E40\u0E1E\u0E25\u0E15"),
                React.createElement(card_1.CardDescription, null, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E17\u0E21\u0E40\u0E1E\u0E25\u0E15\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27")),
            React.createElement(card_1.CardContent, { className: "space-y-4" },
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "template" }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E17\u0E21\u0E40\u0E1E\u0E25\u0E15"),
                    React.createElement(select_1.Select, { value: selectedTemplate, onValueChange: setSelectedTemplate },
                        React.createElement(select_1.SelectTrigger, null,
                            React.createElement(select_1.SelectValue, { placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E17\u0E21\u0E40\u0E1E\u0E25\u0E15\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19" })),
                        React.createElement(select_1.SelectContent, null, NOTIFICATION_TEMPLATES.map((template) => (React.createElement(select_1.SelectItem, { key: template.id, value: template.id }, template.name)))))),
                selectedTemplate && (React.createElement("div", { className: "p-4 border rounded-lg bg-muted/50" },
                    React.createElement("h4", { className: "font-medium mb-2" }, "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19"),
                    (() => {
                        const template = NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplate);
                        return template ? (React.createElement("div", { className: "space-y-2" },
                            React.createElement("p", { className: "font-medium" }, template.title),
                            React.createElement("p", { className: "text-sm text-muted-foreground" }, template.body),
                            template.actions && (React.createElement("div", { className: "flex gap-2" }, template.actions.map((action, index) => (React.createElement(badge_1.Badge, { key: index, variant: "outline" }, action.title))))))) : null;
                    })())),
                React.createElement(button_1.Button, { onClick: handleSendTemplate, disabled: !selectedTemplate || isSending, className: "w-full" },
                    isSending && React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                    React.createElement(lucide_react_1.Send, { className: "h-4 w-4 mr-2" }),
                    "\u0E2A\u0E48\u0E07\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19"))),
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07"),
                React.createElement(card_1.CardDescription, null, "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E41\u0E25\u0E30\u0E2A\u0E48\u0E07\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")),
            React.createElement(card_1.CardContent, { className: "space-y-4" },
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "title" }, "\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19"),
                    React.createElement(input_1.Input, { id: "title", placeholder: "\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19", value: customNotification.title, onChange: (e) => setCustomNotification(prev => ({ ...prev, title: e.target.value })), maxLength: 100 })),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "body" }, "\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19"),
                    React.createElement(textarea_1.Textarea, { id: "body", placeholder: "\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19", value: customNotification.body, onChange: (e) => setCustomNotification(prev => ({ ...prev, body: e.target.value })), maxLength: 300, rows: 3 })),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "icon" }, "\u0E44\u0E2D\u0E04\u0E2D\u0E19 URL"),
                    React.createElement(input_1.Input, { id: "icon", placeholder: "URL \u0E02\u0E2D\u0E07\u0E44\u0E2D\u0E04\u0E2D\u0E19", value: customNotification.icon, onChange: (e) => setCustomNotification(prev => ({ ...prev, icon: e.target.value })) })),
                React.createElement(separator_1.Separator, null),
                React.createElement("div", { className: "space-y-4" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("div", null,
                            React.createElement(label_1.Label, { htmlFor: "require-interaction" }, "\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E01\u0E32\u0E23\u0E15\u0E2D\u0E1A\u0E2A\u0E19\u0E2D\u0E07"),
                            React.createElement("p", { className: "text-xs text-muted-foreground" }, "\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E08\u0E30\u0E44\u0E21\u0E48\u0E2B\u0E32\u0E22\u0E44\u0E1B\u0E08\u0E19\u0E01\u0E27\u0E48\u0E32\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E08\u0E30\u0E15\u0E2D\u0E1A\u0E2A\u0E19\u0E2D\u0E07")),
                        React.createElement(switch_1.Switch, { id: "require-interaction", checked: customNotification.requireInteraction, onCheckedChange: (checked) => setCustomNotification(prev => ({ ...prev, requireInteraction: checked })) })),
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("div", null,
                            React.createElement(label_1.Label, { htmlFor: "vibrate" }, "\u0E01\u0E32\u0E23\u0E2A\u0E31\u0E48\u0E19"),
                            React.createElement("p", { className: "text-xs text-muted-foreground" }, "\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E2A\u0E31\u0E48\u0E19\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19")),
                        React.createElement(switch_1.Switch, { id: "vibrate", checked: customNotification.vibrate, onCheckedChange: (checked) => setCustomNotification(prev => ({ ...prev, vibrate: checked })) }))),
                React.createElement(button_1.Button, { onClick: handleSendCustom, disabled: !customNotification.title || !customNotification.body || isSending, className: "w-full" },
                    isSending && React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                    React.createElement(lucide_react_1.Send, { className: "h-4 w-4 mr-2" }),
                    "\u0E2A\u0E48\u0E07\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07")))));
}
