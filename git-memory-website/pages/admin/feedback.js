import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';

const AdminFeedback = () => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [surveyData, setSurveyData] = useState([]);
  const [activeTab, setActiveTab] = useState('feedback');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    rating: 'all',
    dateRange: '30'
  });

  useEffect(() => {
    // Load data from localStorage (in real app, fetch from API)
    const feedback = JSON.parse(localStorage.getItem('git_memory_feedback') || '[]');
    const surveys = JSON.parse(localStorage.getItem('git_memory_surveys') || '[]');
    
    setFeedbackData(feedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    setSurveyData(surveys.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  }, []);

  const filteredFeedback = feedbackData.filter(item => {
    const date = new Date(item.timestamp);
    const daysAgo = parseInt(filters.dateRange);
    const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    if (date < cutoffDate) return false;
    if (filters.type !== 'all' && item.feedbackType !== filters.type) return false;
    if (filters.rating !== 'all' && item.rating !== parseInt(filters.rating)) return false;
    
    return true;
  });

  const getFeedbackStats = () => {
    const total = filteredFeedback.length;
    const avgRating = total > 0 ? (filteredFeedback.reduce((sum, item) => sum + item.rating, 0) / total).toFixed(1) : 0;
    const typeBreakdown = filteredFeedback.reduce((acc, item) => {
      acc[item.feedbackType] = (acc[item.feedbackType] || 0) + 1;
      return acc;
    }, {});
    
    return { total, avgRating, typeBreakdown };
  };

  const getSurveyStats = () => {
    const total = surveyData.length;
    const avgCompletionTime = total > 0 ? 
      Math.round(surveyData.reduce((sum, item) => sum + (item.completionTime || 0), 0) / total / 1000) : 0;
    
    // Analyze common responses
    const experienceLevels = {};
    const painPoints = {};
    const willingnessToPay = {};
    
    surveyData.forEach(survey => {
      const responses = survey.responses || {};
      
      if (responses.experience) {
        experienceLevels[responses.experience] = (experienceLevels[responses.experience] || 0) + 1;
      }
      
      if (Array.isArray(responses.pain_points)) {
        responses.pain_points.forEach(point => {
          painPoints[point] = (painPoints[point] || 0) + 1;
        });
      }
      
      if (responses.willingness_to_pay) {
        willingnessToPay[responses.willingness_to_pay] = (willingnessToPay[responses.willingness_to_pay] || 0) + 1;
      }
    });
    
    return { total, avgCompletionTime, experienceLevels, painPoints, willingnessToPay };
  };

  const stats = getFeedbackStats();
  const surveyStats = getSurveyStats();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const exportData = () => {
    const data = {
      feedback: feedbackData,
      surveys: surveyData,
      exportDate: new Date().toISOString(),
      stats: { feedback: stats, surveys: surveyStats }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `git-memory-feedback-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Admin - Feedback & Surveys | Git Memory MCP Server</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">Feedback & Surveys</span>
              </div>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'feedback', label: 'Feedback', count: feedbackData.length },
                  { id: 'surveys', label: 'Surveys', count: surveyData.length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    style={{
                      color: activeTab === tab.id ? '#2563eb' : undefined
                    }}
                  >
                    <span>{tab.label}</span>
                    <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {activeTab === 'feedback' && (
            <>
              {/* Feedback Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-gray-600">Total Feedback</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{stats.avgRating}</div>
                  <div className="text-gray-600">Average Rating</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {Object.keys(stats.typeBreakdown).length}
                  </div>
                  <div className="text-gray-600">Feedback Types</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round((filteredFeedback.filter(f => f.rating >= 4).length / (stats.total || 1)) * 100)}%
                  </div>
                  <div className="text-gray-600">Positive (4-5★)</div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="general">General</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="pricing">Pricing</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <select
                      value={filters.rating}
                      onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value="all">All Ratings</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="365">Last year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feedback List */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Feedback</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {filteredFeedback.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No feedback matches the current filters.
                    </div>
                  ) : (
                    filteredFeedback.map(item => (
                      <div
                        key={item.id}
                        className="p-6 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedFeedback(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(item.rating)}`}>
                                {item.rating} ★
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {item.feedbackType}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{item.email}</span>
                              <span>•</span>
                              <span>{formatDate(item.timestamp)}</span>
                              {item.company && (
                                <>
                                  <span>•</span>
                                  <span>{item.company}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'surveys' && (
            <>
              {/* Survey Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{surveyStats.total}</div>
                  <div className="text-gray-600">Completed Surveys</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{surveyStats.avgCompletionTime}s</div>
                  <div className="text-gray-600">Avg Completion Time</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {Object.keys(surveyStats.experienceLevels).length}
                  </div>
                  <div className="text-gray-600">Experience Levels</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {Object.keys(surveyStats.painPoints).length}
                  </div>
                  <div className="text-gray-600">Unique Pain Points</div>
                </div>
              </div>

              {/* Survey Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Experience Levels</h3>
                  <div className="space-y-3">
                    {Object.entries(surveyStats.experienceLevels)
                      .sort(([,a], [,b]) => b - a)
                      .map(([level, count]) => (
                        <div key={level} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{level}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(count / surveyStats.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{count}</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Pain Points</h3>
                  <div className="space-y-3">
                    {Object.entries(surveyStats.painPoints)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([point, count]) => (
                        <div key={point} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex-1">{point}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full" 
                                style={{ width: `${(count / surveyStats.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{count}</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>

              {/* Survey List */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Survey Responses</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {surveyData.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No survey responses yet.
                    </div>
                  ) : (
                    surveyData.map(item => (
                      <div
                        key={item.id}
                        className="p-6 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedSurvey(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-medium text-gray-900">
                                Survey #{item.id.toString().slice(-6)}
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                                Completed
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{formatDate(item.timestamp)}</span>
                              <span>•</span>
                              <span>{Math.round((item.completionTime || 0) / 1000)}s completion</span>
                              <span>•</span>
                              <span>{Object.keys(item.responses || {}).length} responses</span>
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Feedback Details</h2>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{selectedFeedback.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedFeedback.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <p className="text-gray-900">{selectedFeedback.company || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="text-gray-900">{selectedFeedback.role || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-gray-900">{selectedFeedback.feedbackType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <p className="text-gray-900">{selectedFeedback.rating} ★</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedFeedback.message}</p>
              </div>
              
              {selectedFeedback.improvements && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Improvements</label>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedFeedback.improvements}</p>
                </div>
              )}
              
              {selectedFeedback.features && selectedFeedback.features.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features of Interest</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.features.map(feature => (
                      <span key={feature} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
                <p>Submitted: {formatDate(selectedFeedback.timestamp)}</p>
                <p>Would recommend: {selectedFeedback.wouldRecommend === true ? 'Yes' : selectedFeedback.wouldRecommend === false ? 'No' : 'Maybe/Unsure'}</p>
                <p>Contact permission: {selectedFeedback.contactPermission ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Survey Detail Modal */}
      {selectedSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Survey Response #{selectedSurvey.id.toString().slice(-6)}
                </h2>
                <button
                  onClick={() => setSelectedSurvey(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6 text-sm text-gray-500">
                <p>Completed: {formatDate(selectedSurvey.timestamp)}</p>
                <p>Time taken: {Math.round((selectedSurvey.completionTime || 0) / 1000)} seconds</p>
              </div>
              
              <div className="space-y-6">
                {Object.entries(selectedSurvey.responses || {}).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <div className="text-gray-900">
                      {Array.isArray(value) ? (
                        <div className="flex flex-wrap gap-2">
                          {value.map((item, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className={value && value.length > 100 ? 'bg-gray-50 p-3 rounded-lg' : ''}>
                          {value || 'Not answered'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AdminFeedback;