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
            return (React.createElement(badge_1.Badge, { variant: "default", className: "bg-green-500" },
                React.createElement(lucide_react_1.BellRing, { className: "h-3 w-3 mr-1" }),
                "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19"));
        }
        if (permission === 'denied') {
            return (React.createElement(badge_1.Badge, { variant: "destructive" },
                React.createElement(lucide_react_1.BellOff, { className: "h-3 w-3 mr-1" }),
                "\u0E16\u0E39\u0E01\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18"));
        }
        return (React.createElement(badge_1.Badge, { variant: "secondary" },
            React.createElement(lucide_react_1.Bell, { className: "h-3 w-3 mr-1" }),
            "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19"));
    };
    if (variant === 'minimal') {
        return (React.createElement("div", { className: `flex items-center gap-2 ${className}` },
            getStatusBadge(),
            React.createElement(button_1.Button, { size: "sm", variant: isSubscribed ? "outline" : "default", onClick: handleSubscriptionToggle, disabled: isLoading || permission === 'denied' },
                isLoading && React.createElement(lucide_react_1.Loader2, { className: "h-3 w-3 mr-1 animate-spin" }),
                isSubscribed ? (React.createElement(React.Fragment, null,
                    React.createElement(lucide_react_1.BellOff, { className: "h-3 w-3 mr-1" }),
                    "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")) : (React.createElement(React.Fragment, null,
                    React.createElement(lucide_react_1.Bell, { className: "h-3 w-3 mr-1" }),
                    "\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19")))));
    }
    if (variant === 'inline') {
        return (React.createElement("div", { className: `flex items-center justify-between p-4 border rounded-lg bg-muted/50 ${className}` },
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("div", { className: "p-2 bg-primary/10 rounded-full" },
                    React.createElement(lucide_react_1.Bell, { className: "h-5 w-5 text-primary" })),
                React.createElement("div", null,
                    React.createElement("h4", { className: "font-medium" }, isSubscribed ? 'การแจ้งเตือนเปิดใช้งานแล้ว' : 'เปิดการแจ้งเตือน'),
                    React.createElement("p", { className: "text-sm text-muted-foreground" }, isSubscribed
                        ? 'คุณจะได้รับการแจ้งเตือนเมื่อมีเนื้อหาใหม่'
                        : 'รับการแจ้งเตือนเมื่อมีผลงานและบทความใหม่'))),
            React.createElement("div", { className: "flex items-center gap-2" },
                getStatusBadge(),
                React.createElement(button_1.Button, { size: "sm", variant: isSubscribed ? "outline" : "default", onClick: handleSubscriptionToggle, disabled: isLoading || permission === 'denied' },
                    isLoading && React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                    isSubscribed ? 'ยกเลิก' : 'เปิดใช้งาน'),
                showDismiss && !isSubscribed && (React.createElement(button_1.Button, { size: "sm", variant: "ghost", onClick: handleDismiss },
                    React.createElement(lucide_react_1.X, { className: "h-4 w-4" }))))));
    }
    // Card variant (default)
    return (React.createElement(card_1.Card, { className: className },
        React.createElement(card_1.CardHeader, { className: "pb-3" },
            React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("div", { className: "flex items-center gap-2" },
                    React.createElement(lucide_react_1.Bell, { className: "h-5 w-5" }),
                    React.createElement(card_1.CardTitle, { className: "text-lg" }, isSubscribed ? 'การแจ้งเตือนเปิดใช้งานแล้ว' : 'เปิดการแจ้งเตือน')),
                showDismiss && !isSubscribed && (React.createElement(button_1.Button, { size: "sm", variant: "ghost", onClick: handleDismiss },
                    React.createElement(lucide_react_1.X, { className: "h-4 w-4" })))),
            React.createElement(card_1.CardDescription, null, isSubscribed
                ? 'คุณจะได้รับการแจ้งเตือนเมื่อมีเนื้อหาใหม่ ผลงาน หรือบทความใหม่'
                : 'รับการแจ้งเตือนทันทีเมื่อมีผลงานใหม่ บทความ หรือการอัปเดตสำคัญ')),
        React.createElement(card_1.CardContent, { className: "space-y-4" },
            error && (React.createElement(alert_1.Alert, { variant: "destructive" },
                React.createElement(lucide_react_1.AlertCircle, { className: "h-4 w-4" }),
                React.createElement(alert_1.AlertDescription, null, error),
                React.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: clearError, className: "mt-2" }, "\u0E1B\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21"))),
            showSuccess && isSubscribed && (React.createElement(alert_1.Alert, null,
                React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4" }),
                React.createElement(alert_1.AlertDescription, null, "\uD83C\uDF89 \u0E22\u0E34\u0E19\u0E14\u0E35\u0E14\u0E49\u0E27\u0E22! \u0E04\u0E38\u0E13\u0E08\u0E30\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E21\u0E35\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E43\u0E2B\u0E21\u0E48\u0E41\u0E25\u0E49\u0E27"))),
            permission === 'denied' && (React.createElement(alert_1.Alert, { variant: "destructive" },
                React.createElement(lucide_react_1.BellOff, { className: "h-4 w-4" }),
                React.createElement(alert_1.AlertDescription, null, "\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E16\u0E39\u0E01\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E43\u0E19\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C"))),
            React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("div", { className: "flex items-center gap-2" },
                    React.createElement("span", { className: "text-sm text-muted-foreground" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30:"),
                    getStatusBadge()),
                React.createElement("div", { className: "flex gap-2" },
                    isSubscribed && (React.createElement(button_1.Button, { size: "sm", variant: "outline", onClick: sendTestNotification, disabled: isLoading }, "\u0E17\u0E14\u0E2A\u0E2D\u0E1A")),
                    React.createElement(button_1.Button, { onClick: handleSubscriptionToggle, disabled: isLoading || permission === 'denied', variant: isSubscribed ? "outline" : "default" },
                        isLoading && React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                        isSubscribed ? (React.createElement(React.Fragment, null,
                            React.createElement(lucide_react_1.BellOff, { className: "h-4 w-4 mr-2" }),
                            "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19")) : (React.createElement(React.Fragment, null,
                            React.createElement(lucide_react_1.Bell, { className: "h-4 w-4 mr-2" }),
                            "\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19"))))),
            isSubscribed && (React.createElement("div", { className: "text-xs text-muted-foreground" }, "\uD83D\uDCA1 \u0E40\u0E04\u0E25\u0E47\u0E14\u0E25\u0E31\u0E1A: \u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E44\u0E14\u0E49\u0E15\u0E25\u0E2D\u0E14\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C")))));
}
