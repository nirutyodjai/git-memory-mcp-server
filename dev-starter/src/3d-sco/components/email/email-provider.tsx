'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { EmailService, EmailCampaign, Subscriber, EmailTemplate, EmailStats } from '@/lib/email/email-service';

interface EmailState {
  campaigns: EmailCampaign[];
  subscribers: Subscriber[];
  templates: EmailTemplate[];
  stats: EmailStats | null;
  loading: boolean;
  error: string | null;
}

type EmailAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CAMPAIGNS'; payload: EmailCampaign[] }
  | { type: 'ADD_CAMPAIGN'; payload: EmailCampaign }
  | { type: 'UPDATE_CAMPAIGN'; payload: EmailCampaign }
  | { type: 'DELETE_CAMPAIGN'; payload: string }
  | { type: 'SET_SUBSCRIBERS'; payload: Subscriber[] }
  | { type: 'ADD_SUBSCRIBER'; payload: Subscriber }
  | { type: 'UPDATE_SUBSCRIBER'; payload: Subscriber }
  | { type: 'DELETE_SUBSCRIBER'; payload: string }
  | { type: 'SET_TEMPLATES'; payload: EmailTemplate[] }
  | { type: 'ADD_TEMPLATE'; payload: EmailTemplate }
  | { type: 'UPDATE_TEMPLATE'; payload: EmailTemplate }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'SET_STATS'; payload: EmailStats };

const initialState: EmailState = {
  campaigns: [],
  subscribers: [],
  templates: [],
  stats: null,
  loading: false,
  error: null,
};

function emailReducer(state: EmailState, action: EmailAction): EmailState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CAMPAIGNS':
      return { ...state, campaigns: action.payload };
    case 'ADD_CAMPAIGN':
      return { ...state, campaigns: [...state.campaigns, action.payload] };
    case 'UPDATE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === action.payload.id ? action.payload : campaign
        ),
      };
    case 'DELETE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.filter(campaign => campaign.id !== action.payload),
      };
    case 'SET_SUBSCRIBERS':
      return { ...state, subscribers: action.payload };
    case 'ADD_SUBSCRIBER':
      return { ...state, subscribers: [...state.subscribers, action.payload] };
    case 'UPDATE_SUBSCRIBER':
      return {
        ...state,
        subscribers: state.subscribers.map(subscriber =>
          subscriber.id === action.payload.id ? action.payload : subscriber
        ),
      };
    case 'DELETE_SUBSCRIBER':
      return {
        ...state,
        subscribers: state.subscribers.filter(subscriber => subscriber.id !== action.payload),
      };
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(template =>
          template.id === action.payload.id ? action.payload : template
        ),
      };
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(template => template.id !== action.payload),
      };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    default:
      return state;
  }
}

interface EmailContextType {
  state: EmailState;
  emailService: EmailService;
  // Campaign methods
  loadCampaigns: () => Promise<void>;
  createCampaign: (campaign: Omit<EmailCampaign, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<EmailCampaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  sendCampaign: (id: string) => Promise<void>;
  pauseCampaign: (id: string) => Promise<void>;
  resumeCampaign: (id: string) => Promise<void>;
  // Subscriber methods
  loadSubscribers: () => Promise<void>;
  addSubscriber: (email: string, firstName?: string, lastName?: string) => Promise<void>;
  updateSubscriber: (id: string, updates: Partial<Subscriber>) => Promise<void>;
  deleteSubscriber: (id: string) => Promise<void>;
  subscribeToNewsletter: (email: string, firstName?: string, lastName?: string) => Promise<void>;
  unsubscribeFromNewsletter: (email: string) => Promise<void>;
  // Template methods
  loadTemplates: () => Promise<void>;
  createTemplate: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<EmailTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  // Stats methods
  loadStats: () => Promise<void>;
  getCampaignStats: (campaignId: string) => Promise<EmailStats>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

interface EmailProviderProps {
  children: ReactNode;
}

export function EmailProvider({ children }: EmailProviderProps) {
  const [state, dispatch] = useReducer(emailReducer, initialState);
  const emailService = new EmailService();

  const handleError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    dispatch({ type: 'SET_ERROR', payload: message });
  }, []);

  // Campaign methods
  const loadCampaigns = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const campaigns = await emailService.getCampaigns();
      dispatch({ type: 'SET_CAMPAIGNS', payload: campaigns });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const createCampaign = useCallback(async (campaign: Omit<EmailCampaign, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newCampaign = await emailService.createCampaign(campaign);
      dispatch({ type: 'ADD_CAMPAIGN', payload: newCampaign });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const updateCampaign = useCallback(async (id: string, updates: Partial<EmailCampaign>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedCampaign = await emailService.updateCampaign(id, updates);
      dispatch({ type: 'UPDATE_CAMPAIGN', payload: updatedCampaign });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const deleteCampaign = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await emailService.deleteCampaign(id);
      dispatch({ type: 'DELETE_CAMPAIGN', payload: id });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const sendCampaign = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await emailService.sendCampaign(id);
      // Reload campaigns to get updated status
      await loadCampaigns();
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError, loadCampaigns]);

  const pauseCampaign = useCallback(async (id: string) => {
    try {
      await emailService.pauseCampaign(id);
      await loadCampaigns();
    } catch (error) {
      handleError(error);
    }
  }, [emailService, handleError, loadCampaigns]);

  const resumeCampaign = useCallback(async (id: string) => {
    try {
      await emailService.resumeCampaign(id);
      await loadCampaigns();
    } catch (error) {
      handleError(error);
    }
  }, [emailService, handleError, loadCampaigns]);

  // Subscriber methods
  const loadSubscribers = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const subscribers = await emailService.getSubscribers();
      dispatch({ type: 'SET_SUBSCRIBERS', payload: subscribers });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const addSubscriber = useCallback(async (email: string, firstName?: string, lastName?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const subscriber = await emailService.addSubscriber(email, firstName, lastName);
      dispatch({ type: 'ADD_SUBSCRIBER', payload: subscriber });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const updateSubscriber = useCallback(async (id: string, updates: Partial<Subscriber>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedSubscriber = await emailService.updateSubscriber(id, updates);
      dispatch({ type: 'UPDATE_SUBSCRIBER', payload: updatedSubscriber });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const deleteSubscriber = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await emailService.removeSubscriber(id);
      dispatch({ type: 'DELETE_SUBSCRIBER', payload: id });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const subscribeToNewsletter = useCallback(async (email: string, firstName?: string, lastName?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await emailService.subscribeToNewsletter(email, firstName, lastName);
      await loadSubscribers();
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError, loadSubscribers]);

  const unsubscribeFromNewsletter = useCallback(async (email: string) => {
    try {
      await emailService.unsubscribeFromNewsletter(email);
      await loadSubscribers();
    } catch (error) {
      handleError(error);
    }
  }, [emailService, handleError, loadSubscribers]);

  // Template methods
  const loadTemplates = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const templates = await emailService.getTemplates();
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const createTemplate = useCallback(async (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newTemplate = await emailService.createTemplate(template);
      dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<EmailTemplate>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedTemplate = await emailService.updateTemplate(id, updates);
      dispatch({ type: 'UPDATE_TEMPLATE', payload: updatedTemplate });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await emailService.deleteTemplate(id);
      dispatch({ type: 'DELETE_TEMPLATE', payload: id });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  // Stats methods
  const loadStats = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const stats = await emailService.getEmailStats();
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [emailService, handleError]);

  const getCampaignStats = useCallback(async (campaignId: string): Promise<EmailStats> => {
    try {
      return await emailService.getCampaignStats(campaignId);
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [emailService, handleError]);

  const value: EmailContextType = {
    state,
    emailService,
    // Campaign methods
    loadCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    pauseCampaign,
    resumeCampaign,
    // Subscriber methods
    loadSubscribers,
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    subscribeToNewsletter,
    unsubscribeFromNewsletter,
    // Template methods
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    // Stats methods
    loadStats,
    getCampaignStats,
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
}