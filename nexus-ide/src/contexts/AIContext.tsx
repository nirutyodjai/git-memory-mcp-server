/**
 * AI Context Provider
 * 
 * Manages AI models, MCP connections, and intelligent code assistance
 * across the entire NEXUS IDE application.
 * 
 * Features:
 * - Multi-Model AI Management
 * - MCP Server Integration
 * - Context-Aware Intelligence
 * - Real-time Learning
 * - Performance Optimization
 * - Error Handling & Fallbacks
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AIModel, CodeContext, AISuggestion } from '../components/features/AICodeCompletion';
import { useMCP } from '../hooks/useMCP';

export interface AIState {
  models: AIModel[];
  activeModels: string[];
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  suggestions: AISuggestion[];
  learningData: any[];
  performance: {
    responseTime: number;
    accuracy: number;
    userSatisfaction: number;
  };
  settings: {
    autoComplete: boolean;
    naturalLanguage: boolean;
    contextAwareness: boolean;
    learningMode: boolean;
    maxSuggestions: number;
    confidenceThreshold: number;
  };
}

export interface AIActions {
  initializeAI: () => Promise<void>;
  toggleModel: (modelId: string, enabled: boolean) => void;
  generateSuggestions: (context: CodeContext) => Promise<AISuggestion[]>;
  acceptSuggestion: (suggestion: AISuggestion) => void;
  rejectSuggestion: (suggestion: AISuggestion) => void;
  updateSettings: (settings: Partial<AIState['settings']>) => void;
  clearError: () => void;
  resetLearning: () => void;
  exportLearningData: () => any[];
  importLearningData: (data: any[]) => void;
}

type AIActionType =
  | { type: 'INITIALIZE_START' }
  | { type: 'INITIALIZE_SUCCESS'; payload: { models: AIModel[] } }
  | { type: 'INITIALIZE_ERROR'; payload: { error: string } }
  | { type: 'TOGGLE_MODEL'; payload: { modelId: string; enabled: boolean } }
  | { type: 'SET_LOADING'; payload: { loading: boolean } }
  | { type: 'SET_SUGGESTIONS'; payload: { suggestions: AISuggestion[] } }
  | { type: 'ADD_LEARNING_DATA'; payload: { data: any } }
  | { type: 'UPDATE_PERFORMANCE'; payload: { performance: Partial<AIState['performance']> } }
  | { type: 'UPDATE_SETTINGS'; payload: { settings: Partial<AIState['settings']> } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_LEARNING' }
  | { type: 'IMPORT_LEARNING_DATA'; payload: { data: any[] } };

const initialState: AIState = {
  models: [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      enabled: true,
      priority: 1
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      enabled: true,
      priority: 2
    },
    {
      id: 'llama-3-70b',
      name: 'Llama 3 70B',
      provider: 'meta',
      model: 'llama-3-70b-instruct',
      enabled: false,
      priority: 3
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'google',
      model: 'gemini-pro',
      enabled: false,
      priority: 4
    }
  ],
  activeModels: ['gpt-4-turbo', 'claude-3-opus'],
  isInitialized: false,
  isLoading: false,
  error: null,
  suggestions: [],
  learningData: [],
  performance: {
    responseTime: 0,
    accuracy: 0,
    userSatisfaction: 0
  },
  settings: {
    autoComplete: true,
    naturalLanguage: true,
    contextAwareness: true,
    learningMode: true,
    maxSuggestions: 10,
    confidenceThreshold: 0.7
  }
};

function aiReducer(state: AIState, action: AIActionType): AIState {
  switch (action.type) {
    case 'INITIALIZE_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'INITIALIZE_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        models: action.payload.models,
        activeModels: action.payload.models.filter(m => m.enabled).map(m => m.id)
      };

    case 'INITIALIZE_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error
      };

    case 'TOGGLE_MODEL':
      const updatedModels = state.models.map(model =>
        model.id === action.payload.modelId
          ? { ...model, enabled: action.payload.enabled }
          : model
      );
      return {
        ...state,
        models: updatedModels,
        activeModels: updatedModels.filter(m => m.enabled).map(m => m.id)
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.loading
      };

    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload.suggestions
      };

    case 'ADD_LEARNING_DATA':
      return {
        ...state,
        learningData: [...state.learningData, action.payload.data]
      };

    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performance: {
          ...state.performance,
          ...action.payload.performance
        }
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload.settings
        }
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'RESET_LEARNING':
      return {
        ...state,
        learningData: []
      };

    case 'IMPORT_LEARNING_DATA':
      return {
        ...state,
        learningData: action.payload.data
      };

    default:
      return state;
  }
}

const AIContext = createContext<{
  state: AIState;
  actions: AIActions;
} | null>(null);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);
  const { sendMessage, isConnected } = useMCP();

  // Initialize AI system
  const initializeAI = useCallback(async () => {
    dispatch({ type: 'INITIALIZE_START' });
    
    try {
      // Check MCP connection
      if (!isConnected) {
        throw new Error('MCP connection required for AI features');
      }

      // Initialize AI models through MCP
      const response = await sendMessage({
        type: 'ai_initialize',
        payload: {
          models: state.models.filter(m => m.enabled),
          settings: state.settings
        }
      });

      if (response.success) {
        dispatch({
          type: 'INITIALIZE_SUCCESS',
          payload: { models: response.data.models || state.models }
        });
        toast.success('AI system initialized successfully');
      } else {
        throw new Error(response.error || 'Failed to initialize AI');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'INITIALIZE_ERROR', payload: { error: errorMessage } });
      toast.error(`AI initialization failed: ${errorMessage}`);
    }
  }, [isConnected, sendMessage, state.models, state.settings]);

  // Toggle AI model
  const toggleModel = useCallback((modelId: string, enabled: boolean) => {
    dispatch({ type: 'TOGGLE_MODEL', payload: { modelId, enabled } });
    
    // Update performance tracking
    if (enabled) {
      toast.success(`${state.models.find(m => m.id === modelId)?.name} enabled`);
    } else {
      toast.info(`${state.models.find(m => m.id === modelId)?.name} disabled`);
    }
  }, [state.models]);

  // Generate AI suggestions
  const generateSuggestions = useCallback(async (context: CodeContext): Promise<AISuggestion[]> => {
    if (!state.isInitialized || !isConnected) {
      return [];
    }

    dispatch({ type: 'SET_LOADING', payload: { loading: true } });
    const startTime = Date.now();

    try {
      const response = await sendMessage({
        type: 'ai_generate_suggestions',
        payload: {
          context,
          models: state.activeModels,
          settings: state.settings
        }
      });

      if (response.success && response.data.suggestions) {
        const suggestions: AISuggestion[] = response.data.suggestions;
        
        // Filter by confidence threshold
        const filteredSuggestions = suggestions.filter(
          s => s.confidence >= state.settings.confidenceThreshold
        ).slice(0, state.settings.maxSuggestions);

        dispatch({ type: 'SET_SUGGESTIONS', payload: { suggestions: filteredSuggestions } });
        
        // Update performance metrics
        const responseTime = Date.now() - startTime;
        dispatch({
          type: 'UPDATE_PERFORMANCE',
          payload: {
            performance: {
              responseTime: (state.performance.responseTime + responseTime) / 2
            }
          }
        });

        return filteredSuggestions;
      } else {
        throw new Error(response.error || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { loading: false } });
    }
  }, [state.isInitialized, state.activeModels, state.settings, isConnected, sendMessage, state.performance.responseTime]);

  // Accept suggestion (for learning)
  const acceptSuggestion = useCallback((suggestion: AISuggestion) => {
    if (state.settings.learningMode) {
      dispatch({
        type: 'ADD_LEARNING_DATA',
        payload: {
          data: {
            type: 'accepted',
            suggestion,
            timestamp: Date.now(),
            context: 'code_completion'
          }
        }
      });

      // Update accuracy metric
      dispatch({
        type: 'UPDATE_PERFORMANCE',
        payload: {
          performance: {
            accuracy: Math.min(state.performance.accuracy + 0.01, 1.0)
          }
        }
      });
    }

    // Send learning data to MCP server
    if (isConnected) {
      sendMessage({
        type: 'ai_learn',
        payload: {
          action: 'accept',
          suggestion,
          timestamp: Date.now()
        }
      }).catch(console.error);
    }
  }, [state.settings.learningMode, state.performance.accuracy, isConnected, sendMessage]);

  // Reject suggestion (for learning)
  const rejectSuggestion = useCallback((suggestion: AISuggestion) => {
    if (state.settings.learningMode) {
      dispatch({
        type: 'ADD_LEARNING_DATA',
        payload: {
          data: {
            type: 'rejected',
            suggestion,
            timestamp: Date.now(),
            context: 'code_completion'
          }
        }
      });

      // Slightly decrease accuracy metric
      dispatch({
        type: 'UPDATE_PERFORMANCE',
        payload: {
          performance: {
            accuracy: Math.max(state.performance.accuracy - 0.005, 0.0)
          }
        }
      });
    }

    // Send learning data to MCP server
    if (isConnected) {
      sendMessage({
        type: 'ai_learn',
        payload: {
          action: 'reject',
          suggestion,
          timestamp: Date.now()
        }
      }).catch(console.error);
    }
  }, [state.settings.learningMode, state.performance.accuracy, isConnected, sendMessage]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AIState['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { settings: newSettings } });
    toast.success('AI settings updated');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Reset learning data
  const resetLearning = useCallback(() => {
    dispatch({ type: 'RESET_LEARNING' });
    toast.success('Learning data reset');
  }, []);

  // Export learning data
  const exportLearningData = useCallback(() => {
    return state.learningData;
  }, [state.learningData]);

  // Import learning data
  const importLearningData = useCallback((data: any[]) => {
    dispatch({ type: 'IMPORT_LEARNING_DATA', payload: { data } });
    toast.success(`Imported ${data.length} learning entries`);
  }, []);

  // Auto-initialize when MCP connects
  useEffect(() => {
    if (isConnected && !state.isInitialized && !state.isLoading) {
      initializeAI();
    }
  }, [isConnected, state.isInitialized, state.isLoading, initializeAI]);

  // Save learning data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.learningData.length > 0 && isConnected) {
        sendMessage({
          type: 'ai_save_learning_data',
          payload: {
            data: state.learningData,
            timestamp: Date.now()
          }
        }).catch(console.error);
      }
    }, 60000); // Save every minute

    return () => clearInterval(interval);
  }, [state.learningData, isConnected, sendMessage]);

  const actions: AIActions = {
    initializeAI,
    toggleModel,
    generateSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    updateSettings,
    clearError,
    resetLearning,
    exportLearningData,
    importLearningData
  };

  return (
    <AIContext.Provider value={{ state, actions }}>
      {children}
    </AIContext.Provider>
  );
};

export default AIProvider;