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
                return <lucide_react_1.Edit className="w-4 h-4 text-gray-500"/>;
            case 'scheduled':
                return <lucide_react_1.Clock className="w-4 h-4 text-blue-500"/>;
            case 'sending':
                return <lucide_react_1.Send className="w-4 h-4 text-orange-500 animate-pulse"/>;
            case 'sent':
                return <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>;
            case 'paused':
                return <lucide_react_1.Pause className="w-4 h-4 text-yellow-500"/>;
            case 'cancelled':
                return <lucide_react_1.XCircle className="w-4 h-4 text-red-500"/>;
            default:
                return <lucide_react_1.Mail className="w-4 h-4 text-gray-500"/>;
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
        return (<div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>);
    }
    return (<div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('email.campaigns.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('email.campaigns.description')}
          </p>
        </div>
        <button onClick={onCreateCampaign} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <lucide_react_1.Plus className="w-4 h-4"/>
          {t('email.campaigns.create')}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
            <input type="text" placeholder={t('email.campaigns.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
          </div>
        </div>
        <div className="flex gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="all">{t('email.campaigns.filter.all')}</option>
            <option value="draft">{t('email.campaigns.status.draft')}</option>
            <option value="scheduled">{t('email.campaigns.status.scheduled')}</option>
            <option value="sending">{t('email.campaigns.status.sending')}</option>
            <option value="sent">{t('email.campaigns.status.sent')}</option>
            <option value="paused">{t('email.campaigns.status.paused')}</option>
            <option value="cancelled">{t('email.campaigns.status.cancelled')}</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
            <lucide_react_1.Download className="w-4 h-4"/>
            {t('common.export')}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCampaigns.length > 0 && (<div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {t('email.campaigns.selected', { count: selectedCampaigns.length })}
          </span>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
              <lucide_react_1.Trash2 className="w-3 h-3"/>
              {t('common.delete')}
            </button>
          </div>
        </div>)}

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0} onChange={handleSelectAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('email.campaigns.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('email.campaigns.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('email.campaigns.recipients')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('email.campaigns.scheduled')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('email.campaigns.performance')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCampaigns.map((campaign) => {
            const campaignStats = stats[campaign.id];
            return (<tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedCampaigns.includes(campaign.id)} onChange={() => handleSelectCampaign(campaign.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {campaign.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {campaign.subject}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusIcon(campaign.status)}
                        {t(`email.campaigns.status.${campaign.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                        <lucide_react_1.Users className="w-4 h-4"/>
                        {campaign.recipientListIds.length}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {campaign.scheduledAt ? formatDate(campaign.scheduledAt) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {campaignStats ? (<div className="flex items-center gap-4">
                          <div className="text-xs">
                            <div className="text-gray-500 dark:text-gray-400">{t('email.stats.openRate')}</div>
                            <div className="font-medium">{calculateOpenRate(campaignStats)}%</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-gray-500 dark:text-gray-400">{t('email.stats.clickRate')}</div>
                            <div className="font-medium">{calculateClickRate(campaignStats)}%</div>
                          </div>
                          <button onClick={() => setShowStats(showStats === campaign.id ? null : campaign.id)} className="text-blue-600 hover:text-blue-800">
                            <lucide_react_1.BarChart3 className="w-4 h-4"/>
                          </button>
                        </div>) : (<span className="text-gray-400 text-sm">-</span>)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onEditCampaign?.(campaign)} className="text-gray-400 hover:text-gray-600">
                          <lucide_react_1.Edit className="w-4 h-4"/>
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <lucide_react_1.Eye className="w-4 h-4"/>
                        </button>
                        {campaign.status === 'draft' && (<button onClick={() => onSendCampaign?.(campaign.id)} className="text-green-600 hover:text-green-800">
                            <lucide_react_1.Send className="w-4 h-4"/>
                          </button>)}
                        {campaign.status === 'sending' && (<button onClick={() => onPauseCampaign?.(campaign.id)} className="text-yellow-600 hover:text-yellow-800">
                            <lucide_react_1.Pause className="w-4 h-4"/>
                          </button>)}
                        {campaign.status === 'paused' && (<button onClick={() => onResumeCampaign?.(campaign.id)} className="text-green-600 hover:text-green-800">
                            <lucide_react_1.Play className="w-4 h-4"/>
                          </button>)}
                        <button onClick={() => onDeleteCampaign?.(campaign.id)} className="text-red-400 hover:text-red-600">
                          <lucide_react_1.Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>);
        })}
            </tbody>
          </table>
        </div>

        {filteredCampaigns.length === 0 && (<div className="text-center py-12">
            <lucide_react_1.Mail className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('email.campaigns.empty.title')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('email.campaigns.empty.description')}
            </p>
            <button onClick={onCreateCampaign} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <lucide_react_1.Plus className="w-4 h-4"/>
              {t('email.campaigns.create')}
            </button>
          </div>)}
      </div>

      {/* Detailed Stats Modal */}
      {showStats && stats[showStats] && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('email.campaigns.stats.title')}
              </h3>
              <button onClick={() => setShowStats(null)} className="text-gray-400 hover:text-gray-600">
                <lucide_react_1.XCircle className="w-6 h-6"/>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats[showStats].sent}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('email.stats.sent')}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats[showStats].delivered}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('email.stats.delivered')}
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats[showStats].opened}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('email.stats.opened')}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats[showStats].clicked}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('email.stats.clicked')}
                </div>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=email-campaign-manager.js.map