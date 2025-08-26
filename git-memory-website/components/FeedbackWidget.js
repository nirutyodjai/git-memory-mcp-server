import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FeedbackForm from './FeedbackForm';
import UserSurvey from './UserSurvey';
import { event } from '../lib/gtag';
import { mixpanel } from '../lib/mixpanel';

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'feedback' | 'survey' | null
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleWidgetClick = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      event({
        action: 'feedback_widget_first_interaction',
        category: 'engagement',
        label: 'feedback_widget'
      });
      mixpanel.track('Feedback Widget First Interaction');
    }
    
    setIsOpen(!isOpen);
    
    if (!isOpen) {
      event({
        action: 'feedback_widget_opened',
        category: 'engagement',
        label: 'feedback_widget'
      });
      mixpanel.track('Feedback Widget Opened');
    }
  };

  const handleFeedbackClick = () => {
    setActiveModal('feedback');
    setIsOpen(false);
    
    event({
      action: 'feedback_form_opened',
      category: 'engagement',
      label: 'from_widget'
    });
    mixpanel.track('Feedback Form Opened', { source: 'widget' });
  };

  const handleSurveyClick = () => {
    setActiveModal('survey');
    setIsOpen(false);
    
    event({
      action: 'survey_opened',
      category: 'engagement',
      label: 'from_widget'
    });
    mixpanel.track('Survey Opened', { source: 'widget' });
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handleSurveyComplete = (surveyData) => {
    setActiveModal(null);
    // Show thank you message or redirect
    alert('Thank you for completing the survey! Your feedback is valuable to us.');
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    setIsOpen(false);
    
    event({
      action: 'feedback_widget_minimized',
      category: 'engagement',
      label: 'feedback_widget'
    });
    mixpanel.track('Feedback Widget Minimized');
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="Open feedback widget"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </motion.div>
    );
  }

  return (
    <>
      {/* Main Widget */}
      <div className="fixed bottom-4 right-4 z-40">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="mb-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Help Us Improve</h3>
                <button
                  onClick={handleMinimize}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Minimize widget"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">
                Share your thoughts and help us build better developer tools.
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={handleFeedbackClick}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" style={{color: '#2563eb'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Send Feedback</div>
                    <div className="text-sm text-gray-500">Share bugs, ideas, or suggestions</div>
                  </div>
                </button>
                
                <button
                  onClick={handleSurveyClick}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Take Survey</div>
                    <div className="text-sm text-gray-500">5 min research survey</div>
                  </div>
                </button>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Your feedback matters</span>
                  <div className="flex items-center space-x-1">
                    <span>Powered by</span>
                    <span className="font-semibold" style={{color: '#2563eb'}}>Git Memory</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Widget Button */}
        <motion.button
          onClick={handleWidgetClick}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Feedback & Survey"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.svg
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </motion.svg>
            ) : (
              <motion.svg
                key="feedback"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>
        
        {/* Notification Dot */}
        {!hasInteracted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 bg-white rounded-full"
            />
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'feedback' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <FeedbackForm onClose={handleCloseModal} />
          </motion.div>
        )}
        
        {activeModal === 'survey' && (
          <UserSurvey
            onComplete={handleSurveyComplete}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackWidget;