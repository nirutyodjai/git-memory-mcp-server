import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  CursorArrowRaysIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    pageViews: 0,
    uniqueVisitors: 0,
    conversionRate: 0,
    revenue: 0,
    topPages: [],
    userEngagement: {},
    pricingInteractions: {},
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching analytics data
    // In a real implementation, this would fetch from Google Analytics API or your backend
    const fetchAnalytics = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setAnalytics({
          pageViews: 12543,
          uniqueVisitors: 8921,
          conversionRate: 3.2,
          revenue: 15420,
          topPages: [
            { page: '/', views: 5432, title: 'Home' },
            { page: '/#pricing', views: 3210, title: 'Pricing' },
            { page: '/#features', views: 2876, title: 'Features' },
            { page: '/#contact', views: 1025, title: 'Contact' },
          ],
          userEngagement: {
            avgSessionDuration: 245, // seconds
            bounceRate: 32.5, // percentage
            pagesPerSession: 2.8,
          },
          pricingInteractions: {
            free: { views: 8921, clicks: 234 },
            pro: { views: 8921, clicks: 456 },
            enterprise: { views: 8921, clicks: 89 },
          },
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const stats = [
    {
      name: 'Page Views',
      value: analytics.pageViews.toLocaleString(),
      icon: ChartBarIcon,
      change: '+12.5%',
      changeType: 'positive',
    },
    {
      name: 'Unique Visitors',
      value: analytics.uniqueVisitors.toLocaleString(),
      icon: UsersIcon,
      change: '+8.2%',
      changeType: 'positive',
    },
    {
      name: 'Conversion Rate',
      value: `${analytics.conversionRate}%`,
      icon: CursorArrowRaysIcon,
      change: '+0.3%',
      changeType: 'positive',
    },
    {
      name: 'Revenue',
      value: formatCurrency(analytics.revenue),
      icon: BanknotesIcon,
      change: '+15.8%',
      changeType: 'positive',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-8 w-8" style={{color: '#2563eb'}} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change} from last month
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Top Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white p-6 rounded-lg shadow"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top Pages</h2>
              <div className="space-y-4">
                {analytics.topPages.map((page, index) => (
                  <div key={page.page} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{page.title}</p>
                      <p className="text-sm text-gray-500">{page.page}</p>
                    </div>
                    <span className="text-lg font-bold" style={{color: '#2563eb'}}>
                      {page.views.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* User Engagement */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white p-6 rounded-lg shadow"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">User Engagement</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg. Session Duration</span>
                  <span className="font-bold text-gray-900">
                    {formatDuration(analytics.userEngagement.avgSessionDuration)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bounce Rate</span>
                  <span className="font-bold text-gray-900">
                    {analytics.userEngagement.bounceRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pages per Session</span>
                  <span className="font-bold text-gray-900">
                    {analytics.userEngagement.pagesPerSession}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Pricing Interactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Plan Interactions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(analytics.pricingInteractions).map(([plan, data]) => {
                const conversionRate = ((data.clicks / data.views) * 100).toFixed(1);
                return (
                  <div key={plan} className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize mb-2">
                      {plan}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-2xl font-bold" style={{color: '#2563eb'}}>{data.views.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Views</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{data.clicks}</p>
                        <p className="text-sm text-gray-500">Clicks</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">{conversionRate}%</p>
                        <p className="text-sm text-gray-500">Conversion Rate</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;