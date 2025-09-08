/**
 * Advanced AI Hook for NEXUS IDE
 * Provides comprehensive AI capabilities with multi-model support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AIService } from '../services/AIService';
import { MCPService } from '../services/MCPService';
import { ContextManager } from '../services/ContextManager';

export interface AIRequest {
  prompt: string;
  context?: any;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: any;
}

export interface AIHookState {
  isLoading: boolean;
  error: string | null;
  response: AIResponse | null;
  history: AIResponse[];
  models: string[];
  currentModel: string;
}

export interface AIHookActions {
  sendMessage: (request: AIRequest) => Promise<AIResponse | null>;
  generateCode: (description: string, language?: string) => Promise<string | null>;
  explainCode: (code: string, language?: string) => Promise<string | null>;
  reviewCode: (code: string, language?: string) => Promise<string | null>;
  optimizeCode: (code: string, language?: string) => Promise<string | null>;
  findBugs: (code: string, language?: string) => Promise<string | null>;
  generateTests: (code: string, language?: string) => Promise<string | null>;
  generateDocumentation: (code: string, language?: string) => Promise<string | null>;
  refactorCode: (code: string, instructions: string, language?: string) => Promise<string | null>;
  translateCode: (code: string, fromLang: string, toLang: string) => Promise<string | null>;
  setModel: (model: string) => void;
  clearHistory: () => void;
  retryLastRequest: () => Promise<AIResponse | null>;
}

export function useAI(): AIHookState & AIHookActions {
  const [state, setState] = useState<AIHookState>({
    isLoading: false,
    error: null,
    response: null,
    history: [],
    models: [],
    currentModel: 'gpt-4'
  });

  const lastRequestRef = useRef<AIRequest | null>(null);
  const aiService = AIService.getInstance();
  const mcpService = MCPService.getInstance();
  const contextManager = ContextManager.getInstance();

  // Initialize AI service and load available models
  useEffect(() => {
    const initializeAI = async () => {
      try {
        await aiService.initialize();
        const availableModels = aiService.getAvailableModels();
        setState(prev => ({
          ...prev,
          models: availableModels,
          currentModel: availableModels[0] || 'gpt-4'
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: `Failed to initialize AI service: ${error}`
        }));
      }
    };

    initializeAI();
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (request: AIRequest): Promise<AIResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    lastRequestRef.current = request;

    try {
      // Get current context
      const context = await contextManager.getCurrentContext();
      
      // Prepare AI request with context
      const aiRequest = {
        ...request,
        context: {
          ...context,
          ...request.context
        },
        model: request.model || state.currentModel
      };

      const response = await aiService.processRequest(aiRequest);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        response,
        history: [...prev.history, response]
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return null;
    }
  }, [state.currentModel]);

  // Generate code from description
  const generateCode = useCallback(async (description: string, language = 'typescript'): Promise<string | null> => {
    const response = await sendMessage({
      prompt: `Generate ${language} code for: ${description}`,
      context: { task: 'code_generation', language }
    });
    return response?.content || null;
  }, [sendMessage]);

  // Explain code
  const explainCode = useCallback(async (code: string, language = 'typescript'): Promise<string | null> => {
    const response = await sendMessage({
      prompt: `Explain this ${language} code:\n\n${code}`,
      context: { task: 'code_explanation', language, code }
    });
    return response?.content || null;
  }, [sendMessage]);

  // Review code
  const reviewCode = useCallback(async (code: string, language = 'typescript'): Promise<string | null> => {
    const response = await sendMessage({
      prompt: `Review this ${language} code for best practices, potential issues, and improvements:\n\n${code}`,
      context: { task: 'code_review', language, code }
    });
    return response?.content || null;
  }, [sendMessage]);

  // Optimize code
  const optimizeCode = useCallback(async (code: string, language = 'typescript'): Promise<string | null> => {
    const response = await sendMessage({
      prompt: `Optimize this ${language} code for better performance and readability:\n\n${code}`,
      context: { task: 'code_optimization', language, code }
    });
    return response?.content || null;
  }, [sendMessage]);

  // Find bugs
  const findBugs = useCallback(async (code: string, language = 'typescript'): Promise<string | null> => {
    const response = await sendMessage({
      prompt: `Analyze this ${language} code for bugs, security vulnerabilities, and potential issues:\n\n${code}`,
      context: { task: 'bug_detection', language, code }
    });
    return response?.content || null;
  }, [sendMessage]);

  // Generate tests
  const generateTests = useCallback(async (code: string, language = 'typescript'): Promise<string | null> => {
    const response = await sendMessage({
      prompt: `Generate comprehensive unit tests for this ${language} code:\n\n${code}`,
      context: { task: 'test_generation', language, code }
    });
    return response?.content || null;
  }, [sendMessage]);

  // Generate documentation
  const generateDocumentation = useCallback(async (code: string, language = 'typescript'): Promise<string | null> => {
    const response = await sendMessage({
      prompt: `Generate comprehensive documentation for this ${language} code:\n\n${code}`,
      context: { task: 'documentation_generation', language, code }
    });
    return response?.content || null;
  }, [sendMessage]);

  // Refactor code
  const refactorCode = useCallback(async (code: string, instructions: string, language = 'typescript'): Promise<string | null> => {
    const response = await sendMessage({
      prompt: `Refactor this ${language} code according to these instructions: ${instructions}\n\nCode:\n${code}`,
      context: { task: 'code_refactoring', language, code, instructions }
    });
    return response?.content || null;
  }, [sendMessage]);

  // Translate code between languages
  const translateCode = useCallback(async (code: string, fromLang: string, toLang: string): Promise<string | null> => {
    const response = await sendMessage({
      prompt: `Translate this ${fromLang} code to ${toLang}:\n\n${code}`,
      context: { task: 'code_translation', fromLanguage: fromLang, toLanguage: toLang, code }
    });
    return response?.content || null;
  }, [sendMessage]);

  // Set current AI model
  const setModel = useCallback((model: string) => {
    setState(prev => ({ ...prev, currentModel: model }));
  }, []);

  // Clear conversation history
  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [], response: null }));
  }, []);

  // Retry last request
  const retryLastRequest = useCallback(async (): Promise<AIResponse | null> => {
    if (lastRequestRef.current) {
      return await sendMessage(lastRequestRef.current);
    }
    return null;
  }, [sendMessage]);

  return {
    ...state,
    sendMessage,
    generateCode,
    explainCode,
    reviewCode,
    optimizeCode,
    findBugs,
    generateTests,
    generateDocumentation,
    refactorCode,
    translateCode,
    setModel,
    clearHistory,
    retryLastRequest
  };
}

export default useAI;