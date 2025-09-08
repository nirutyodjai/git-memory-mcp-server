'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Send,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  BarChart3,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
} from 'lucide-react';
import { EmailCampaign, EmailStats, EmailTemplate } from '../../lib/email/email-service';

interface EmailCampaignManagerProps {
  className?: string;
  onCreateCampaign?: () => void;
  onEditCampaign?: (campaign: EmailCampaign) => void;
  onDeleteCampaign?: (campaignId: string) => void;
  onSendCampaign?: (campaignId: string) => void;
  onPauseCampaign?: (campaignId: string) => void;
  onResumeCampaign?: (campaignId: string) => void;
}

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
type FilterType = 'all' | CampaignStatus;

export function EmailCampaignManager({
  className = '',
  onCreateCampaign,
  onEditCampaign,
  onDeleteCampaign,
  onSendCampaign,
  onPauseCampaign,
  onResumeCampaign,
}: EmailCampaignManagerProps) {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [stats, setStats] = useState<Record<string, EmailStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [showStats, setShowStats] = useState<string | null>(null);

  useEffect(() => {
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
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: CampaignStatus) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'sending':
        return <Send className="w-4 h-4 text-orange-500 animate-pulse" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: CampaignStatus) => {
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

  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map(c => c.id));
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const calculateOpenRate = (campaignStats: EmailStats) => {
    if (campaignStats.sent === 0) return 0;
    return Math.round((campaignStats.opened / campaignStats.sent) * 100);
  };

  const calculateClickRate = (campaignStats: EmailStats) => {
    if (campaignStats.sent === 0) return 0;
    return Math.round((campaignStats.clicked / campaignStats.sent) * 100);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
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
        <button
          onClick={onCreateCampaign}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {t('email.campaigns.create')}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('email.campaigns.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterType)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">{t('email.campaigns.filter.all')}</option>
            <option value="draft">{t('email.campaigns.status.draft')}</option>
            <option value="scheduled">{t('email.campaigns.status.scheduled')}</option>
            <option value="sending">{t('email.campaigns.status.sending')}</option>
            <option value="sent">{t('email.campaigns.status.sent')}</option>
            <option value="paused">{t('email.campaigns.status.paused')}</option>
            <option value="cancelled">{t('email.campaigns.status.cancelled')}</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" />
            {t('common.export')}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCampaigns.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {t('email.campaigns.selected', { count: selectedCampaigns.length })}
          </span>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
              <Trash2 className="w-3 h-3" />
              {t('common.delete')}
            </button>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
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
                return (
                  <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.includes(campaign.id)}
                        onChange={() => handleSelectCampaign(campaign.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
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
                        <Users className="w-4 h-4" />
                        {campaign.recipientListIds.length}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {campaign.scheduledAt ? formatDate(campaign.scheduledAt) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {campaignStats ? (
                        <div className="flex items-center gap-4">
                          <div className="text-xs">
                            <div className="text-gray-500 dark:text-gray-400">{t('email.stats.openRate')}</div>
                            <div className="font-medium">{calculateOpenRate(campaignStats)}%</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-gray-500 dark:text-gray-400">{t('email.stats.clickRate')}</div>
                            <div className="font-medium">{calculateClickRate(campaignStats)}%</div>
                          </div>
                          <button
                            onClick={() => setShowStats(showStats === campaign.id ? null : campaign.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditCampaign?.(campaign)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        {campaign.status === 'draft' && (
                          <button
                            onClick={() => onSendCampaign?.(campaign.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {campaign.status === 'sending' && (
                          <button
                            onClick={() => onPauseCampaign?.(campaign.id)}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {campaign.status === 'paused' && (
                          <button
                            onClick={() => onResumeCampaign?.(campaign.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteCampaign?.(campaign.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('email.campaigns.empty.title')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('email.campaigns.empty.description')}
            </p>
            <button
              onClick={onCreateCampaign}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              {t('email.campaigns.create')}
            </button>
          </div>
        )}
      </div>

      {/* Detailed Stats Modal */}
      {showStats && stats[showStats] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('email.campaigns.stats.title')}
              </h3>
              <button
                onClick={() => setShowStats(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
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
        </div>
      )}
    </div>
  );
}