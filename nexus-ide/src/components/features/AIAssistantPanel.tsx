/**
 * AI Assistant Panel Component
 * 
 * Features:
 * - Multi-model AI chat interface
 * - Code generation and explanation
 * - Context-aware suggestions
 * - Real-time collaboration with AI
 * - Voice input/output support
 * - Code review assistance
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Brain, 
  Code, 
  FileText, 
  Lightbulb, 
  Search, 
  Zap, 
  Copy, 
  Check, 
  X, 
  MoreVertical,
  Sparkles,
  Bot,
  User
} from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { toast } from 'sonner';

export interface AIMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  context?: {
    file?: string;
    line?: number;
    selection?: string;
  };
  actions?: {
    type: 'code' | 'file' | 'command';
    data: any;
  }[];
}

export interface AIAssistantPanelProps {
  className?: string;
  onClose?: () => void;
  initialContext?: {
    file?: string;
    selection?: string;
    task?: string;
  };
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  className = '',
  onClose,
  initialContext
}) => {
  const { state: aiState, actions: aiActions } = useAI();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(prev => prev + transcript);
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = () => {
          setIsListening(false);
          toast.error('Speech recognition error');
        };
      }
      
      // Speech Synthesis
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set initial model
  useEffect(() => {
    if (aiState.activeModels.length > 0 && !selectedModel) {
      setSelectedModel(aiState.activeModels[0]);
    }
  }, [aiState.activeModels, selectedModel]);

  // Add initial context message
  useEffect(() => {
    if (initialContext && messages.length === 0) {
      const contextMessage: AIMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `Context: ${initialContext.file ? `File: ${initialContext.file}` : ''} ${initialContext.selection ? `Selection: ${initialContext.selection}` : ''} ${initialContext.task ? `Task: ${initialContext.task}` : ''}`,
        timestamp: new Date()
      };
      setMessages([contextMessage]);
    }
  }, [initialContext]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Generate AI response
      const response = await aiActions.generateSuggestion({
        prompt: inputValue.trim(),
        context: {
          messages: messages.slice(-5), // Last 5 messages for context
          file: initialContext?.file,
          selection: initialContext?.selection
        },
        model: selectedModel
      });
      
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        model: selectedModel,
        actions: response.actions
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the response if enabled
      if (isSpeaking && synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(response.content);
        synthRef.current.speak(utterance);
      }
      
    } catch (error) {
      console.error('AI response error:', error);
      toast.error('Failed to get AI response');
      
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, selectedModel, initialContext, aiActions, isSpeaking]);

  const handleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const renderMessage = useCallback((message: AIMessage) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    
    return (
      <div
        key={message.id}
        className={`flex gap-3 p-4 ${
          isUser ? 'bg-primary/5' : isSystem ? 'bg-muted/50' : 'bg-background'
        }`}
      >
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
          ) : isSystem ? (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {isUser ? 'You' : isSystem ? 'System' : `AI (${message.model || 'Unknown'})`}
            </span>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {message.content}
            </pre>
          </div>
          
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.actions.map((action, index) => (
                <button
                  key={index}
                  className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm transition-colors"
                  onClick={() => {
                    // Handle action execution
                    toast.info(`Executing ${action.type} action`);
                  }}
                >
                  {action.type === 'code' && <Code className="w-3 h-3 mr-1 inline" />}
                  {action.type === 'file' && <FileText className="w-3 h-3 mr-1 inline" />}
                  Apply {action.type}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={() => handleCopyMessage(message.id, message.content)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy message"
          >
            {copiedMessageId === message.id ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  }, [copiedMessageId, handleCopyMessage]);

  return (
    <div className={`flex flex-col h-full bg-background border-l border-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
          {aiState.isLoading && (
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSpeaking(!isSpeaking)}
            className={`p-2 rounded-md transition-colors ${
              isSpeaking ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
            }`}
            title={isSpeaking ? 'Disable voice output' : 'Enable voice output'}
          >
            {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">AI Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background"
              >
                {aiState.activeModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Voice Input</span>
              <button
                onClick={handleVoiceInput}
                className={`p-2 rounded-md transition-colors ${
                  isListening ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                }`}
                disabled={!recognitionRef.current}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">AI Assistant Ready</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Ask me anything about your code, get suggestions, or request help with development tasks.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setInputValue('Explain this code')}
                className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm hover:bg-primary/20 transition-colors"
              >
                <Code className="w-3 h-3 mr-1 inline" />
                Explain code
              </button>
              <button
                onClick={() => setInputValue('Review my code for issues')}
                className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm hover:bg-primary/20 transition-colors"
              >
                <Search className="w-3 h-3 mr-1 inline" />
                Code review
              </button>
              <button
                onClick={() => setInputValue('Generate documentation')}
                className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm hover:bg-primary/20 transition-colors"
              >
                <FileText className="w-3 h-3 mr-1 inline" />
                Documentation
              </button>
            </div>
          </div>
        ) : (
          <div>
            {messages.map(renderMessage)}
            {isLoading && (
              <div className="flex gap-3 p-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">AI is thinking...</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask AI anything about your code..."
              className="w-full p-3 pr-12 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            {recognitionRef.current && (
              <button
                onClick={handleVoiceInput}
                className={`absolute right-2 top-2 p-2 rounded-md transition-colors ${
                  isListening 
                    ? 'bg-red-500/10 text-red-500 animate-pulse' 
                    : 'hover:bg-accent text-muted-foreground'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            {aiState.activeModels.length > 0 
              ? `${aiState.activeModels.length} AI models available` 
              : 'No AI models active'
            }
          </span>
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;