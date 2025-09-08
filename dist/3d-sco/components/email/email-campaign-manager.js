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
exports.EmailCampaignManager = EmailCampaignManager;
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const lucide_react_1 = require("lucide-react");
function EmailCampaignManager({ className = '', onCreateCampaign, onEditCampaign, onDeleteCampaign, onSendCampaign, onPauseCampaign, onResumeCampaign, }) {
    const { t } = (0, react_i18next_1.useTranslation)();
    const [campaigns, setCampaigns] = (0, react_1.useState)([]);
    const [stats, setStats] = (0, react_1.useState)({});
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [filterStatus, setFilterStatus] = (0, react_1.useState)('all');
    const [selectedCampaigns, setSelectedCampaigns] = (0, react_1.useState)([]);
    const [showStats, setShowStats] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        loadCampaigns();
    }, []);
    const loadCampaigns = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/email/campaigns');
            if (response.ok) {
                const data = await response.json();
                setCampaigns(data.campaigns || []);
                setStats(data.stats || {});
            }
        }
        catch (error) {
            console.error('Failed to load campaigns:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const filteredCampaigns = campaigns.filter((campaign) => {
        const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
        return matchesSearch && matchesFilter;
    });
    const getStatusIcon = (status) => {
        switch (status) {
            case 'draft':
                return react_1.default.createElement(lucide_react_1.Edit, { className: "w-4 h-4 text-gray-500" });
            case 'scheduled':
                return react_1.default.createElement(lucide_react_1.Clock, { className: "w-4 h-4 text-blue-500" });
            case 'sending':
                return react_1.default.createElement(lucide_react_1.Send, { className: "w-4 h-4 text-orange-500 animate-pulse" });
            case 'sent':
                return react_1.default.createElement(lucide_react_1.CheckCircle, { className: "w-4 h-4 text-green-500" });
            case 'paused':
                return react_1.default.createElement(lucide_react_1.Pause, { className: "w-4 h-4 text-yellow-500" });
            case 'cancelled':
                return react_1.default.createElement(lucide_react_1.XCircle, { className: "w-4 h-4 text-red-500" });
            default:
                return react_1.default.createElement(lucide_react_1.Mail, { className: "w-4 h-4 text-gray-500" });
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
            case 'scheduled':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'sending':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'sent':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'paused':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };
    const handleSelectCampaign = (campaignId) => {
        setSelectedCampaigns(prev => prev.includes(campaignId)
            ? prev.filter(id => id !== campaignId)
            : [...prev, campaignId]);
    };
    const handleSelectAll = () => {
        if (selectedCampaigns.length === filteredCampaigns.length) {
            setSelectedCampaigns([]);
        }
        else {
            setSelectedCampaigns(filteredCampaigns.map(c => c.id));
        }
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };
    const calculateOpenRate = (campaignStats) => {
        if (campaignStats.sent === 0)
            return 0;
        return Math.round((campaignStats.opened / campaignStats.sent) * 100);
    };
    const calculateClickRate = (campaignStats) => {
        if (campaignStats.sent === 0)
            return 0;
        return Math.round((campaignStats.clicked / campaignStats.sent) * 100);
    };
    if (isLoading) {
        return (react_1.default.createElement("div", { className: `flex items-center justify-center p-8 ${className}` },
            react_1.default.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" })));
    }
    return (react_1.default.createElement("div", { className: `space-y-6 ${className}` },
        react_1.default.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white" }, t('email.campaigns.title')),
                react_1.default.createElement("p", { className: "text-gray-600 dark:text-gray-400" }, t('email.campaigns.description'))),
            react_1.default.createElement("button", { onClick: onCreateCampaign, className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" },
                react_1.default.createElement(lucide_react_1.Plus, { className: "w-4 h-4" }),
                t('email.campaigns.create'))),
        react_1.default.createElement("div", { className: "flex flex-col sm:flex-row gap-4" },
            react_1.default.createElement("div", { className: "flex-1" },
                react_1.default.createElement("div", { className: "relative" },
                    react_1.default.createElement(lucide_react_1.Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }),
                    react_1.default.createElement("input", { type: "text", placeholder: t('email.campaigns.search'), value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" }))),
            react_1.default.createElement("div", { className: "flex gap-2" },
                react_1.default.createElement("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" },
                    react_1.default.createElement("option", { value: "all" }, t('email.campaigns.filter.all')),
                    react_1.default.createElement("option", { value: "draft" }, t('email.campaigns.status.draft')),
                    react_1.default.createElement("option", { value: "scheduled" }, t('email.campaigns.status.scheduled')),
                    react_1.default.createElement("option", { value: "sending" }, t('email.campaigns.status.sending')),
                    react_1.default.createElement("option", { value: "sent" }, t('email.campaigns.status.sent')),
                    react_1.default.createElement("option", { value: "paused" }, t('email.campaigns.status.paused')),
                    react_1.default.createElement("option", { value: "cancelled" }, t('email.campaigns.status.cancelled'))),
                react_1.default.createElement("button", { className: "flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700" },
                    react_1.default.createElement(lucide_react_1.Download, { className: "w-4 h-4" }),
                    t('common.export')))),
        selectedCampaigns.length > 0 && (react_1.default.createElement("div", { className: "flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg" },
            react_1.default.createElement("span", { className: "text-sm text-blue-700 dark:text-blue-300" }, t('email.campaigns.selected', { count: selectedCampaigns.length })),
            react_1.default.createElement("div", { className: "flex gap-2" },
                react_1.default.createElement("button", { className: "flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700" },
                    react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3 h-3" }),
                    t('common.delete'))))),
        react_1.default.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" },
            react_1.default.createElement("div", { className: "overflow-x-auto" },
                react_1.default.createElement("table", { className: "w-full" },
                    react_1.default.createElement("thead", { className: "bg-gray-50 dark:bg-gray-700" },
                        react_1.default.createElement("tr", null,
                            react_1.default.createElement("th", { className: "px-6 py-3 text-left" },
                                react_1.default.createElement("input", { type: "checkbox", checked: selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0, onChange: handleSelectAll, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" })),
                            react_1.default.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" }, t('email.campaigns.name')),
                            react_1.default.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" }, t('email.campaigns.status')),
                            react_1.default.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" }, t('email.campaigns.recipients')),
                            react_1.default.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" }, t('email.campaigns.scheduled')),
                            react_1.default.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" }, t('email.campaigns.performance')),
                            react_1.default.createElement("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" }, t('common.actions')))),
                    react_1.default.createElement("tbody", { className: "bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" }, filteredCampaigns.map((campaign) => {
                        const campaignStats = stats[campaign.id];
                        return (react_1.default.createElement("tr", { key: campaign.id, className: "hover:bg-gray-50 dark:hover:bg-gray-700" },
                            react_1.default.createElement("td", { className: "px-6 py-4" },
                                react_1.default.createElement("input", { type: "checkbox", checked: selectedCampaigns.includes(campaign.id), onChange: () => handleSelectCampaign(campaign.id), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" })),
                            react_1.default.createElement("td", { className: "px-6 py-4" },
                                react_1.default.createElement("div", null,
                                    react_1.default.createElement("div", { className: "text-sm font-medium text-gray-900 dark:text-white" }, campaign.name),
                                    react_1.default.createElement("div", { className: "text-sm text-gray-500 dark:text-gray-400" }, campaign.subject))),
                            react_1.default.createElement("td", { className: "px-6 py-4" },
                                react_1.default.createElement("span", { className: `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}` },
                                    getStatusIcon(campaign.status),
                                    t(`email.campaigns.status.${campaign.status}`))),
                            react_1.default.createElement("td", { className: "px-6 py-4" },
                                react_1.default.createElement("div", { className: "flex items-center gap-1 text-sm text-gray-900 dark:text-white" },
                                    react_1.default.createElement(lucide_react_1.Users, { className: "w-4 h-4" }),
                                    campaign.recipientListIds.length)),
                            react_1.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-500 dark:text-gray-400" }, campaign.scheduledAt ? formatDate(campaign.scheduledAt) : '-'),
                            react_1.default.createElement("td", { className: "px-6 py-4" }, campaignStats ? (react_1.default.createElement("div", { className: "flex items-center gap-4" },
                                react_1.default.createElement("div", { className: "text-xs" },
                                    react_1.default.createElement("div", { className: "text-gray-500 dark:text-gray-400" }, t('email.stats.openRate')),
                                    react_1.default.createElement("div", { className: "font-medium" },
                                        calculateOpenRate(campaignStats),
                                        "%")),
                                react_1.default.createElement("div", { className: "text-xs" },
                                    react_1.default.createElement("div", { className: "text-gray-500 dark:text-gray-400" }, t('email.stats.clickRate')),
                                    react_1.default.createElement("div", { className: "font-medium" },
                                        calculateClickRate(campaignStats),
                                        "%")),
                                react_1.default.createElement("button", { onClick: () => setShowStats(showStats === campaign.id ? null : campaign.id), className: "text-blue-600 hover:text-blue-800" },
                                    react_1.default.createElement(lucide_react_1.BarChart3, { className: "w-4 h-4" })))) : (react_1.default.createElement("span", { className: "text-gray-400 text-sm" }, "-"))),
                            react_1.default.createElement("td", { className: "px-6 py-4 text-right" },
                                react_1.default.createElement("div", { className: "flex items-center justify-end gap-2" },
                                    react_1.default.createElement("button", { onClick: () => onEditCampaign?.(campaign), className: "text-gray-400 hover:text-gray-600" },
                                        react_1.default.createElement(lucide_react_1.Edit, { className: "w-4 h-4" })),
                                    react_1.default.createElement("button", { className: "text-gray-400 hover:text-gray-600" },
                                        react_1.default.createElement(lucide_react_1.Eye, { className: "w-4 h-4" })),
                                    campaign.status === 'draft' && (react_1.default.createElement("button", { onClick: () => onSendCampaign?.(campaign.id), className: "text-green-600 hover:text-green-800" },
                                        react_1.default.createElement(lucide_react_1.Send, { className: "w-4 h-4" }))),
                                    campaign.status === 'sending' && (react_1.default.createElement("button", { onClick: () => onPauseCampaign?.(campaign.id), className: "text-yellow-600 hover:text-yellow-800" },
                                        react_1.default.createElement(lucide_react_1.Pause, { className: "w-4 h-4" }))),
                                    campaign.status === 'paused' && (react_1.default.createElement("button", { onClick: () => onResumeCampaign?.(campaign.id), className: "text-green-600 hover:text-green-800" },
                                        react_1.default.createElement(lucide_react_1.Play, { className: "w-4 h-4" }))),
                                    react_1.default.createElement("button", { onClick: () => onDeleteCampaign?.(campaign.id), className: "text-red-400 hover:text-red-600" },
                                        react_1.default.createElement(lucide_react_1.Trash2, { className: "w-4 h-4" }))))));
                    })))),
            filteredCampaigns.length === 0 && (react_1.default.createElement("div", { className: "text-center py-12" },
                react_1.default.createElement(lucide_react_1.Mail, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }),
                react_1.default.createElement("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2" }, t('email.campaigns.empty.title')),
                react_1.default.createElement("p", { className: "text-gray-500 dark:text-gray-400 mb-4" }, t('email.campaigns.empty.description')),
                react_1.default.createElement("button", { onClick: onCreateCampaign, className: "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" },
                    react_1.default.createElement(lucide_react_1.Plus, { className: "w-4 h-4" }),
                    t('email.campaigns.create'))))),
        showStats && stats[showStats] && (react_1.default.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" },
            react_1.default.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" },
                react_1.default.createElement("div", { className: "flex justify-between items-center mb-6" },
                    react_1.default.createElement("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white" }, t('email.campaigns.stats.title')),
                    react_1.default.createElement("button", { onClick: () => setShowStats(null), className: "text-gray-400 hover:text-gray-600" },
                        react_1.default.createElement(lucide_react_1.XCircle, { className: "w-6 h-6" }))),
                react_1.default.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
                    react_1.default.createElement("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg" },
                        react_1.default.createElement("div", { className: "text-2xl font-bold text-blue-600 dark:text-blue-400" }, stats[showStats].sent),
                        react_1.default.createElement("div", { className: "text-sm text-gray-600 dark:text-gray-400" }, t('email.stats.sent'))),
                    react_1.default.createElement("div", { className: "bg-green-50 dark:bg-green-900/20 p-4 rounded-lg" },
                        react_1.default.createElement("div", { className: "text-2xl font-bold text-green-600 dark:text-green-400" }, stats[showStats].delivered),
                        react_1.default.createElement("div", { className: "text-sm text-gray-600 dark:text-gray-400" }, t('email.stats.delivered'))),
                    react_1.default.createElement("div", { className: "bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg" },
                        react_1.default.createElement("div", { className: "text-2xl font-bold text-yellow-600 dark:text-yellow-400" }, stats[showStats].opened),
                        react_1.default.createElement("div", { className: "text-sm text-gray-600 dark:text-gray-400" }, t('email.stats.opened'))),
                    react_1.default.createElement("div", { className: "bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg" },
                        react_1.default.createElement("div", { className: "text-2xl font-bold text-purple-600 dark:text-purple-400" }, stats[showStats].clicked),
                        react_1.default.createElement("div", { className: "text-sm text-gray-600 dark:text-gray-400" }, t('email.stats.clicked')))))))));
}
