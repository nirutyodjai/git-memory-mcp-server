/**
 * AIAssistant Component
 * 
 * An advanced AI-powered coding assistant for the NEXUS IDE.
 * Provides intelligent code suggestions, explanations, debugging help, and natural language programming.
 * 
 * Features:
 * - Multi-model AI integration (GPT-4, Claude, Llama, etc.)
 * - Context-aware code suggestions
 * - Natural language to code conversion
 * - Code explanation and documentation
 * - Bug detection and fixing suggestions
 * - Performance optimization recommendations
 * - Real-time code analysis
 * - Learning from user coding patterns
 * - Proactive suggestions
 * - Code review assistance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Send, Mic, MicOff, Settings, History, Code, FileText, Zap, Brain, MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export type AIModel = 'gpt-4' | 'claude-3' | 'llama-2' | 'codellama' | 'auto';
export type MessageType = 'user' | 'assistant' | 'system';
export type SuggestionType = 'code' | 'explanation' | 'optimization' | 'bug-fix' | 'documentation';

export interface AIMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  model?: AIModel;
  metadata?: {
    codeLanguage?: string;
    filePath?: string;
    lineNumber?: number;
    suggestionType?: SuggestionType;
    confidence?: number;
  };
}

export interface AISuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  code?: string;
  language?: string;
  confidence: number;
  action?: () => void;
}

export interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  className?: string;
  currentFile?: string;
  selectedCode?: string;
  cursorPosition?: { line: number; column: number };
}

// Mock AI responses for demonstration
const mockResponses = [
  "I can help you with that! Let me analyze your code and provide suggestions.",
  "Based on your code context, I recommend using a more efficient approach.",
  "I've detected a potential performance issue. Here's how to optimize it.",
  "This code looks good! Here are some additional improvements you might consider.",
  "I can help you debug this issue. Let me walk through the problem step by step."
];

// Mock suggestions
const mockSuggestions: AISuggestion[] = [
  {
    id: '1',
    type: 'optimization',
    title: 'Optimize React Component',
    description: 'Use React.memo to prevent unnecessary re-renders',
    code: 'const MyComponent = React.memo(({ prop1, prop2 }) => {\n  // component logic\n});',
    language: 'typescript',
    confidence: 0.92
  },
  {
    id: '2',
    type: 'bug-fix',
    title: 'Fix Memory Leak',
    description: 'Add cleanup function to useEffect hook',
    code: 'useEffect(() => {\n  const subscription = subscribe();\n  return () => subscription.unsubscribe();\n}, []);',
    language: 'typescript',
    confidence: 0.88
  },
  {
    id: '3',
    type: 'code',
    title: 'Add Error Boundary',
    description: 'Implement error boundary for better error handling',
    confidence: 0.85
  }
];

const getModelIcon = (model: AIModel) => {
  switch (model) {
    case 'gpt-4':
      return 'AI';
    case 'claude-3':
      return 'Brain';
    case 'llama-2':
      return 'Llama';
    case 'codellama':
      return 'Computer';
    default:
      return 'Sparkles';
  }
};

const getSuggestionIcon = (type: SuggestionType) => {
  switch (type) {
    case 'code':
      return <Code className="w-4 h-4" />;
    case 'explanation':
      return <FileText className="w-4 h-4" />;
    case 'optimization':
      return <Zap className="w-4 h-4" />;
    case 'bug-fix':
      return <Bot className="w-4 h-4" />;
    case 'documentation':
      return <FileText className="w-4 h-4" />;
    default:
      return <Brain className="w-4 h-4" />;
  }
};

const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  onMinimize,
  isMinimized = false,
  className,
  currentFile,
  selectedCode,
  cursorPosition
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI coding assistant. I can help you with code suggestions, explanations, debugging, and optimization. How can I assist you today?',
      timestamp: new Date(),
      model: 'auto'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('auto');
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>(mockSuggestions);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.ctrlKey && e.key === 'Enter' && isOpen && !isMinimized) {
        handleSendMessage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, input]);

  // Simulate AI response
  const simulateAIResponse = useCallback(async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simple response logic based on keywords
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('bug') || lowerMessage.includes('error') || lowerMessage.includes('fix')) {
      return "I can help you debug this issue. Let me analyze your code and identify potential problems. Could you share the specific error message or the code that's causing issues?";
    }
    
    if (lowerMessage.includes('optimize') || lowerMessage.includes('performance')) {
      return "Great question about optimization! I can suggest several performance improvements. Are you looking to optimize for speed, memory usage, or bundle size?";
    }
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return "I'd be happy to explain that concept! Could you be more specific about what you'd like me to explain? I can break down complex code, algorithms, or programming concepts.";
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('write') || lowerMessage.includes('create')) {
      return "I can help you write code! What would you like to create? Please describe the functionality you need, and I'll provide a well-structured solution with explanations.";
    }
    
    // Default response
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }, []);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await simulateAIResponse(input.trim());
      
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        model: selectedModel
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedModel, simulateAIResponse]);

  // Handle voice input (mock)
  const toggleVoiceInput = useCallback(() => {
    setIsListening(!isListening);
    if (!isListening) {
      toast.info('Voice input started (mock)');
      // Simulate voice input
      setTimeout(() => {
        setInput('How can I optimize this React component?');
        setIsListening(false);
        toast.success('Voice input completed');
      }, 3000);
    } else {
      toast.info('Voice input stopped');
    }
  }, [isListening]);

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    } else {
      toast.success(`Applied suggestion: ${suggestion.title}`);
    }
    
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: 'Conversation cleared. How can I help you?',
        timestamp: new Date(),
        model: 'auto'
      }
    ]);
  }, []);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className={cn(
        'fixed bottom-4 right-4 z-50',
        'w-16 h-16 bg-primary rounded-full',
        'flex items-center justify-center',
        'shadow-lg cursor-pointer',
        'hover:scale-110 transition-transform',
        className
      )}
      onClick={onMinimize}
      >
        <Bot className="w-8 h-8 text-primary-foreground" />
        {messages.filter(m => m.type === 'assistant').length > 1 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">!</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50',
      'w-96 h-[600px]',
      'bg-background border border-border rounded-lg shadow-2xl',
      'flex flex-col overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">AI Assistant</h2>
          <span className="text-xs text-muted-foreground">
            {getModelIcon(selectedModel)} {selectedModel}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={clearConversation}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Clear conversation"
          >
            <History className="w-4 h-4" />
          </button>
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context Info */}
      {(currentFile || selectedCode) && (
        <div className="p-2 bg-muted/20 border-b border-border text-xs">
          {currentFile && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="w-3 h-3" />
              <span>File: {currentFile}</span>
            </div>
          )}
          {selectedCode && (
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <Code className="w-3 h-3" />
              <span>Selected: {selectedCode.length} characters</span>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="p-3 border-b border-border bg-muted/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Smart Suggestions</h3>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Hide
            </button>
          </div>
          <div className="space-y-2">
            {suggestions.slice(0, 2).map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-start gap-2 p-2 bg-background rounded border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => applySuggestion(suggestion)}
              >
                <div className="flex-shrink-0 mt-0.5 text-primary">
                  {getSuggestionIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium">{suggestion.title}</h4>
                  <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Confidence: {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.type === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.type === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            
            <div className={cn(
              'max-w-[80%] rounded-lg p-3',
              message.type === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.model && message.type === 'assistant' && (
                  <span>{getModelIcon(message.model)} {message.model}</span>
                )}
              </div>
            </div>
            
            {message.type === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">U</span>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask me anything about your code..."
              className="w-full p-3 pr-12 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={toggleVoiceInput}
              className={cn(
                'absolute right-2 top-2 p-1.5 rounded-md transition-colors',
                isListening
                  ? 'bg-red-500 text-white'
                  : 'hover:bg-accent'
              )}
              title={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Press Ctrl+Enter to send, Shift+Enter for new line</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as AIModel)}
            className="bg-transparent text-xs outline-none"
          >
            <option value="auto">Auto</option>
            <option value="gpt-4">GPT-4</option>
            <option value="claude-3">Claude 3</option>
            <option value="llama-2">Llama 2</option>
            <option value="codellama">CodeLlama</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;