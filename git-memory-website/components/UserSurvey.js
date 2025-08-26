import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { event } from '../lib/gtag';
import { mixpanel } from '../lib/mixpanel';

const UserSurvey = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const surveySteps = [
    {
      id: 'background',
      title: 'About You',
      questions: [
        {
          id: 'experience',
          type: 'single',
          question: 'How many years of development experience do you have?',
          options: ['< 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years']
        },
        {
          id: 'team_size',
          type: 'single',
          question: 'What size is your development team?',
          options: ['Solo developer', '2-5 people', '6-15 people', '16-50 people', '50+ people']
        },
        {
          id: 'primary_languages',
          type: 'multiple',
          question: 'What programming languages do you primarily use?',
          options: ['JavaScript/TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other']
        }
      ]
    },
    {
      id: 'current_tools',
      title: 'Current Workflow',
      questions: [
        {
          id: 'ai_tools',
          type: 'multiple',
          question: 'Which AI coding tools do you currently use?',
          options: ['GitHub Copilot', 'ChatGPT', 'Claude', 'Cursor', 'Codeium', 'Tabnine', 'None', 'Other']
        },
        {
          id: 'pain_points',
          type: 'multiple',
          question: 'What are your biggest development pain points?',
          options: [
            'Repetitive coding tasks',
            'Understanding legacy code',
            'Code review process',
            'Documentation',
            'Debugging',
            'Learning new codebases',
            'Context switching',
            'Code quality consistency'
          ]
        },
        {
          id: 'git_usage',
          type: 'single',
          question: 'How often do you work with Git repositories?',
          options: ['Multiple times daily', 'Daily', 'Few times a week', 'Weekly', 'Rarely']
        }
      ]
    },
    {
      id: 'git_memory_interest',
      title: 'Git Memory MCP Server',
      questions: [
        {
          id: 'most_valuable_feature',
          type: 'single',
          question: 'Which Git Memory feature would be most valuable to you?',
          options: [
            'AI code suggestions based on repo history',
            'Intelligent code pattern recognition',
            'Automated documentation generation',
            'Smart code review assistance',
            'Repository knowledge search',
            'Team collaboration insights'
          ]
        },
        {
          id: 'integration_preference',
          type: 'multiple',
          question: 'How would you prefer to integrate Git Memory?',
          options: [
            'VS Code extension',
            'Command line tool',
            'Web dashboard',
            'API integration',
            'Slack/Teams bot',
            'GitHub/GitLab integration'
          ]
        },
        {
          id: 'willingness_to_pay',
          type: 'single',
          question: 'What would you be willing to pay monthly for a comprehensive AI coding assistant?',
          options: ['Free only', '$5-10', '$10-20', '$20-50', '$50-100', '$100+']
        }
      ]
    },
    {
      id: 'priorities',
      title: 'Priorities & Preferences',
      questions: [
        {
          id: 'feature_priorities',
          type: 'ranking',
          question: 'Rank these features by importance (drag to reorder):',
          options: [
            'Code completion accuracy',
            'Repository understanding',
            'Privacy & security',
            'Integration ease',
            'Performance speed',
            'Customization options'
          ]
        },
        {
          id: 'privacy_concerns',
          type: 'single',
          question: 'How important is code privacy to you?',
          options: [
            'Extremely important - local processing only',
            'Very important - encrypted cloud processing',
            'Moderately important - trusted providers only',
            'Somewhat important - standard security is fine',
            'Not a major concern'
          ]
        },
        {
          id: 'trial_interest',
          type: 'single',
          question: 'Would you be interested in beta testing Git Memory?',
          options: ['Yes, definitely', 'Yes, maybe', 'Not sure', 'Probably not', 'No']
        }
      ]
    },
    {
      id: 'feedback',
      title: 'Final Thoughts',
      questions: [
        {
          id: 'additional_features',
          type: 'text',
          question: 'What other features would you like to see in an AI coding assistant?',
          placeholder: 'Describe any features or capabilities not mentioned...'
        },
        {
          id: 'concerns',
          type: 'text',
          question: 'Do you have any concerns about AI-assisted development?',
          placeholder: 'Share any worries or hesitations...'
        },
        {
          id: 'contact_info',
          type: 'text',
          question: 'Email (optional - for beta testing or follow-up)',
          placeholder: 'your@email.com'
        }
      ]
    }
  ];

  const totalSteps = surveySteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    // Track survey start
    event({
      action: 'survey_started',
      category: 'engagement',
      label: 'user_survey'
    });
    
    mixpanel.track('Survey Started', {
      survey_type: 'user_research',
      total_steps: totalSteps
    });
  }, []);

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    const currentStepData = surveySteps[currentStep];
    
    // Track step completion
    event({
      action: 'survey_step_completed',
      category: 'engagement',
      label: currentStepData.id,
      value: currentStep + 1
    });
    
    mixpanel.track('Survey Step Completed', {
      step_id: currentStepData.id,
      step_number: currentStep + 1,
      responses_count: Object.keys(responses).length
    });

    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const completionTime = Date.now() - startTime;
    
    try {
      // Track survey completion
      event({
        action: 'survey_completed',
        category: 'engagement',
        label: 'user_survey',
        value: Math.round(completionTime / 1000) // seconds
      });
      
      mixpanel.track('Survey Completed', {
        survey_type: 'user_research',
        completion_time_seconds: Math.round(completionTime / 1000),
        total_responses: Object.keys(responses).length,
        responses: responses
      });
      
      // Store survey data (in real app, send to backend)
      const surveyData = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        completionTime,
        responses
      };
      
      const existingSurveys = JSON.parse(localStorage.getItem('git_memory_surveys') || '[]');
      existingSurveys.push(surveyData);
      localStorage.setItem('git_memory_surveys', JSON.stringify(existingSurveys));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onComplete) onComplete(surveyData);
      
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const currentValue = responses[question.id];

    switch (question.type) {
      case 'single':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="focus:ring-blue-500"
                  style={{color: '#2563eb'}}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(currentValue) && currentValue.includes(option)}
                  onChange={(e) => {
                    const current = Array.isArray(currentValue) ? currentValue : [];
                    if (e.target.checked) {
                      handleResponse(question.id, [...current, option]);
                    } else {
                      handleResponse(question.id, current.filter(v => v !== option));
                    }
                  }}
                  className="rounded border-gray-300 focus:ring-blue-500"
                  style={{color: '#2563eb'}}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'ranking':
        const rankedOptions = Array.isArray(currentValue) ? currentValue : [...question.options];
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">Drag items to reorder by importance (most important at top):</p>
            {rankedOptions.map((option, index) => (
              <div
                key={option}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  const dropIndex = index;
                  
                  if (dragIndex !== dropIndex) {
                    const newOrder = [...rankedOptions];
                    const draggedItem = newOrder[dragIndex];
                    newOrder.splice(dragIndex, 1);
                    newOrder.splice(dropIndex, 0, draggedItem);
                    handleResponse(question.id, newOrder);
                  }
                }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold" style={{backgroundColor: '#dbeafe', color: '#2563eb'}}>
                  {index + 1}
                </div>
                <span className="text-gray-700 flex-1">{option}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={currentValue || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      default:
        return null;
    }
  };

  const currentStepData = surveySteps[currentStep];
  const canProceed = currentStepData.questions.every(q => {
    const response = responses[q.id];
    if (q.type === 'text') return true; // Text questions are optional
    if (q.type === 'multiple') return Array.isArray(response) && response.length > 0;
    return response !== undefined && response !== '';
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">User Research Survey</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-blue-500 rounded-full h-2 mb-2">
            <motion.div
              className="bg-white rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-blue-100 text-sm">
            Step {currentStep + 1} of {totalSteps} • {Math.round(progress)}% complete
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {currentStepData.title}
              </h3>
              
              <div className="space-y-8">
                {currentStepData.questions.map((question, index) => (
                  <div key={question.id} className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-800">
                      {question.question}
                    </h4>
                    {renderQuestion(question)}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {surveySteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {isSubmitting ? 'Submitting...' : currentStep === totalSteps - 1 ? 'Complete Survey' : 'Next'}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UserSurvey;