"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProvider = EmailProvider;
exports.useEmail = useEmail;
const react_1 = __importStar(require("react"));
const email_service_1 = require("@/lib/email/email-service");
const initialState = {
    campaigns: [],
    subscribers: [],
    templates: [],
    stats: null,
    loading: false,
    error: null,
};
function emailReducer(state, action) {
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
                campaigns: state.campaigns.map(campaign => campaign.id === action.payload.id ? action.payload : campaign),
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
                subscribers: state.subscribers.map(subscriber => subscriber.id === action.payload.id ? action.payload : subscriber),
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
                templates: state.templates.map(template => template.id === action.payload.id ? action.payload : template),
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
const EmailContext = (0, react_1.createContext)(undefined);
function EmailProvider({ children }) {
    const [state, dispatch] = (0, react_1.useReducer)(emailReducer, initialState);
    const emailService = new email_service_1.EmailService();
    const handleError = (0, react_1.useCallback)((error) => {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        dispatch({ type: 'SET_ERROR', payload: message });
    }, []);
    // Campaign methods
    const loadCampaigns = (0, react_1.useCallback)(async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const campaigns = await emailService.getCampaigns();
            dispatch({ type: 'SET_CAMPAIGNS', payload: campaigns });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const createCampaign = (0, react_1.useCallback)(async (campaign) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const newCampaign = await emailService.createCampaign(campaign);
            dispatch({ type: 'ADD_CAMPAIGN', payload: newCampaign });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const updateCampaign = (0, react_1.useCallback)(async (id, updates) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const updatedCampaign = await emailService.updateCampaign(id, updates);
            dispatch({ type: 'UPDATE_CAMPAIGN', payload: updatedCampaign });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const deleteCampaign = (0, react_1.useCallback)(async (id) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            await emailService.deleteCampaign(id);
            dispatch({ type: 'DELETE_CAMPAIGN', payload: id });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const sendCampaign = (0, react_1.useCallback)(async (id) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            await emailService.sendCampaign(id);
            // Reload campaigns to get updated status
            await loadCampaigns();
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError, loadCampaigns]);
    const pauseCampaign = (0, react_1.useCallback)(async (id) => {
        try {
            await emailService.pauseCampaign(id);
            await loadCampaigns();
        }
        catch (error) {
            handleError(error);
        }
    }, [emailService, handleError, loadCampaigns]);
    const resumeCampaign = (0, react_1.useCallback)(async (id) => {
        try {
            await emailService.resumeCampaign(id);
            await loadCampaigns();
        }
        catch (error) {
            handleError(error);
        }
    }, [emailService, handleError, loadCampaigns]);
    // Subscriber methods
    const loadSubscribers = (0, react_1.useCallback)(async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const subscribers = await emailService.getSubscribers();
            dispatch({ type: 'SET_SUBSCRIBERS', payload: subscribers });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const addSubscriber = (0, react_1.useCallback)(async (email, firstName, lastName) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const subscriber = await emailService.addSubscriber(email, firstName, lastName);
            dispatch({ type: 'ADD_SUBSCRIBER', payload: subscriber });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const updateSubscriber = (0, react_1.useCallback)(async (id, updates) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const updatedSubscriber = await emailService.updateSubscriber(id, updates);
            dispatch({ type: 'UPDATE_SUBSCRIBER', payload: updatedSubscriber });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const deleteSubscriber = (0, react_1.useCallback)(async (id) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            await emailService.removeSubscriber(id);
            dispatch({ type: 'DELETE_SUBSCRIBER', payload: id });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const subscribeToNewsletter = (0, react_1.useCallback)(async (email, firstName, lastName) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            await emailService.subscribeToNewsletter(email, firstName, lastName);
            await loadSubscribers();
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError, loadSubscribers]);
    const unsubscribeFromNewsletter = (0, react_1.useCallback)(async (email) => {
        try {
            await emailService.unsubscribeFromNewsletter(email);
            await loadSubscribers();
        }
        catch (error) {
            handleError(error);
        }
    }, [emailService, handleError, loadSubscribers]);
    // Template methods
    const loadTemplates = (0, react_1.useCallback)(async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const templates = await emailService.getTemplates();
            dispatch({ type: 'SET_TEMPLATES', payload: templates });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const createTemplate = (0, react_1.useCallback)(async (template) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const newTemplate = await emailService.createTemplate(template);
            dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const updateTemplate = (0, react_1.useCallback)(async (id, updates) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const updatedTemplate = await emailService.updateTemplate(id, updates);
            dispatch({ type: 'UPDATE_TEMPLATE', payload: updatedTemplate });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const deleteTemplate = (0, react_1.useCallback)(async (id) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            await emailService.deleteTemplate(id);
            dispatch({ type: 'DELETE_TEMPLATE', payload: id });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    // Stats methods
    const loadStats = (0, react_1.useCallback)(async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const stats = await emailService.getEmailStats();
            dispatch({ type: 'SET_STATS', payload: stats });
        }
        catch (error) {
            handleError(error);
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [emailService, handleError]);
    const getCampaignStats = (0, react_1.useCallback)(async (campaignId) => {
        try {
            return await emailService.getCampaignStats(campaignId);
        }
        catch (error) {
            handleError(error);
            throw error;
        }
    }, [emailService, handleError]);
    const value = {
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
    return (<EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>);
}
function useEmail() {
    const context = (0, react_1.useContext)(EmailContext);
    if (context === undefined) {
        throw new Error('useEmail must be used within an EmailProvider');
    }
    return context;
}
//# sourceMappingURL=email-provider.js.map