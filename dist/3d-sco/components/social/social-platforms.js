"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialPlatforms = SocialPlatforms;
const react_1 = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const dialog_1 = require("@/components/ui/dialog");
const alert_1 = require("@/components/ui/alert");
const separator_1 = require("@/components/ui/separator");
const lucide_react_1 = require("lucide-react");
const social_service_1 = require("@/lib/social/social-service");
const use_translation_1 = require("@/lib/i18n/use-translation");
const platformIcons = {
    facebook: lucide_react_1.Facebook,
    twitter: lucide_react_1.Twitter,
    instagram: lucide_react_1.Instagram,
    linkedin: lucide_react_1.Linkedin,
    youtube: lucide_react_1.Youtube,
    tiktok: lucide_react_1.Music,
};
function SocialPlatforms() {
    const { t } = (0, use_translation_1.useTranslation)();
    const [platforms, setPlatforms] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [connectDialog, setConnectDialog] = (0, react_1.useState)({ open: false });
    const [credentials, setCredentials] = (0, react_1.useState)({
        username: '',
        accessToken: '',
    });
    const [connecting, setConnecting] = (0, react_1.useState)(false);
    const [syncing, setSyncing] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        loadPlatforms();
    }, []);
    const loadPlatforms = async () => {
        try {
            setLoading(true);
            const data = await social_service_1.socialService.getPlatforms();
            setPlatforms(data);
        }
        catch (error) {
            console.error('Failed to load platforms:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleConnect = async () => {
        if (!connectDialog.platform)
            return;
        try {
            setConnecting(true);
            await social_service_1.socialService.connectPlatform(connectDialog.platform.id, credentials);
            await loadPlatforms();
            setConnectDialog({ open: false });
            setCredentials({ username: '', accessToken: '' });
        }
        catch (error) {
            console.error('Failed to connect platform:', error);
        }
        finally {
            setConnecting(false);
        }
    };
    const handleDisconnect = async (platformId) => {
        try {
            await social_service_1.socialService.disconnectPlatform(platformId);
            await loadPlatforms();
        }
        catch (error) {
            console.error('Failed to disconnect platform:', error);
        }
    };
    const handleSync = async (platformId) => {
        try {
            setSyncing(platformId);
            await social_service_1.socialService.syncPlatform(platformId);
            await loadPlatforms();
        }
        catch (error) {
            console.error('Failed to sync platform:', error);
        }
        finally {
            setSyncing(null);
        }
    };
    const openConnectDialog = (platform) => {
        setConnectDialog({ open: true, platform });
        setCredentials({ username: '', accessToken: '' });
    };
    if (loading) {
        return (react_1.default.createElement("div", { className: "flex items-center justify-center p-8" },
            react_1.default.createElement(lucide_react_1.Loader2, { className: "w-8 h-8 animate-spin" })));
    }
    return (react_1.default.createElement("div", { className: "space-y-6" },
        react_1.default.createElement("div", { className: "flex items-center justify-between" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h2", { className: "text-2xl font-bold" }, t('social.platforms.title')),
                react_1.default.createElement("p", { className: "text-muted-foreground" }, t('social.platforms.description'))),
            react_1.default.createElement(button_1.Button, { onClick: loadPlatforms, variant: "outline", size: "sm" },
                react_1.default.createElement(lucide_react_1.RefreshCw, { className: "w-4 h-4 mr-2" }),
                t('common.refresh'))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, platforms.map((platform) => {
            const IconComponent = platformIcons[platform.icon] || lucide_react_1.Link;
            return (react_1.default.createElement(card_1.Card, { key: platform.id, className: "relative" },
                react_1.default.createElement(card_1.CardHeader, { className: "pb-3" },
                    react_1.default.createElement("div", { className: "flex items-center justify-between" },
                        react_1.default.createElement("div", { className: "flex items-center space-x-3" },
                            react_1.default.createElement("div", { className: "p-2 rounded-lg", style: { backgroundColor: `${platform.color}20` } },
                                react_1.default.createElement(IconComponent, { className: "w-6 h-6", style: { color: platform.color } })),
                            react_1.default.createElement("div", null,
                                react_1.default.createElement(card_1.CardTitle, { className: "text-lg" }, platform.name),
                                platform.isConnected && platform.username && (react_1.default.createElement("p", { className: "text-sm text-muted-foreground" },
                                    "@",
                                    platform.username)))),
                        react_1.default.createElement(badge_1.Badge, { variant: platform.isConnected ? 'default' : 'secondary', className: platform.isConnected ? 'bg-green-100 text-green-800' : '' },
                            platform.isConnected ? (react_1.default.createElement(lucide_react_1.CheckCircle, { className: "w-3 h-3 mr-1" })) : (react_1.default.createElement(lucide_react_1.XCircle, { className: "w-3 h-3 mr-1" })),
                            platform.isConnected ? t('social.connected') : t('social.disconnected')))),
                react_1.default.createElement(card_1.CardContent, { className: "space-y-4" }, platform.isConnected ? (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement("div", { className: "grid grid-cols-2 gap-4 text-sm" },
                        platform.followers && (react_1.default.createElement("div", { className: "flex items-center space-x-2" },
                            react_1.default.createElement(lucide_react_1.Users, { className: "w-4 h-4 text-muted-foreground" }),
                            react_1.default.createElement("span", null,
                                platform.followers.toLocaleString(),
                                " ",
                                t('social.followers')))),
                        platform.lastSync && (react_1.default.createElement("div", { className: "flex items-center space-x-2" },
                            react_1.default.createElement(lucide_react_1.Calendar, { className: "w-4 h-4 text-muted-foreground" }),
                            react_1.default.createElement("span", null, new Date(platform.lastSync).toLocaleDateString())))),
                    react_1.default.createElement(separator_1.Separator, null),
                    react_1.default.createElement("div", { className: "flex space-x-2" },
                        react_1.default.createElement(button_1.Button, { onClick: () => handleSync(platform.id), disabled: syncing === platform.id, variant: "outline", size: "sm", className: "flex-1" },
                            syncing === platform.id ? (react_1.default.createElement(lucide_react_1.Loader2, { className: "w-4 h-4 mr-2 animate-spin" })) : (react_1.default.createElement(lucide_react_1.RefreshCw, { className: "w-4 h-4 mr-2" })),
                            t('social.sync')),
                        react_1.default.createElement(button_1.Button, { onClick: () => handleDisconnect(platform.id), variant: "outline", size: "sm", className: "flex-1" },
                            react_1.default.createElement(lucide_react_1.Unlink, { className: "w-4 h-4 mr-2" }),
                            t('social.disconnect'))))) : (react_1.default.createElement(button_1.Button, { onClick: () => openConnectDialog(platform), className: "w-full", style: { backgroundColor: platform.color } },
                    react_1.default.createElement(lucide_react_1.Link, { className: "w-4 h-4 mr-2" }),
                    t('social.connect'))))));
        })),
        react_1.default.createElement(dialog_1.Dialog, { open: connectDialog.open, onOpenChange: (open) => setConnectDialog({ open }) },
            react_1.default.createElement(dialog_1.DialogContent, null,
                react_1.default.createElement(dialog_1.DialogHeader, null,
                    react_1.default.createElement(dialog_1.DialogTitle, null,
                        t('social.connect'),
                        " ",
                        connectDialog.platform?.name),
                    react_1.default.createElement(dialog_1.DialogDescription, null, t('social.connectDescription'))),
                react_1.default.createElement("div", { className: "space-y-4" },
                    react_1.default.createElement(alert_1.Alert, null,
                        react_1.default.createElement(alert_1.AlertDescription, null, t('social.connectNote'))),
                    react_1.default.createElement("div", { className: "space-y-2" },
                        react_1.default.createElement(label_1.Label, { htmlFor: "username" }, t('social.username')),
                        react_1.default.createElement(input_1.Input, { id: "username", value: credentials.username, onChange: (e) => setCredentials(prev => ({ ...prev, username: e.target.value })), placeholder: t('social.usernamePlaceholder') })),
                    react_1.default.createElement("div", { className: "space-y-2" },
                        react_1.default.createElement(label_1.Label, { htmlFor: "accessToken" }, t('social.accessToken')),
                        react_1.default.createElement(input_1.Input, { id: "accessToken", type: "password", value: credentials.accessToken, onChange: (e) => setCredentials(prev => ({ ...prev, accessToken: e.target.value })), placeholder: t('social.accessTokenPlaceholder') }))),
                react_1.default.createElement(dialog_1.DialogFooter, null,
                    react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => setConnectDialog({ open: false }) }, t('common.cancel')),
                    react_1.default.createElement(button_1.Button, { onClick: handleConnect, disabled: connecting || !credentials.username || !credentials.accessToken },
                        connecting ? (react_1.default.createElement(lucide_react_1.Loader2, { className: "w-4 h-4 mr-2 animate-spin" })) : (react_1.default.createElement(lucide_react_1.Link, { className: "w-4 h-4 mr-2" })),
                        t('social.connect')))))));
}
