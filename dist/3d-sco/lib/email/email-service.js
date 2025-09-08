"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor(config) {
        this.config = config;
        this.templates = new Map();
        this.campaigns = new Map();
        this.subscribers = new Map();
        this.recipientLists = new Map();
        this.transporter = nodemailer_1.default.createTransporter({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: config.auth,
        });
    }
    // Template Management
    async createTemplate(template) {
        const newTemplate = {
            ...template,
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.templates.set(newTemplate.id, newTemplate);
        return newTemplate;
    }
    async updateTemplate(id, updates) {
        const template = this.templates.get(id);
        if (!template)
            return null;
        const updatedTemplate = {
            ...template,
            ...updates,
            updatedAt: new Date(),
        };
        this.templates.set(id, updatedTemplate);
        return updatedTemplate;
    }
    async deleteTemplate(id) {
        return this.templates.delete(id);
    }
    async getTemplate(id) {
        return this.templates.get(id) || null;
    }
    async getTemplates(category) {
        const templates = Array.from(this.templates.values());
        return category ? templates.filter(t => t.category === category) : templates;
    }
    // Subscriber Management
    async addSubscriber(subscriber) {
        const existingSubscriber = Array.from(this.subscribers.values())
            .find(s => s.email === subscriber.email);
        if (existingSubscriber) {
            throw new Error('Subscriber already exists');
        }
        const newSubscriber = {
            ...subscriber,
            id: this.generateId(),
            subscribedAt: new Date(),
        };
        this.subscribers.set(newSubscriber.id, newSubscriber);
        return newSubscriber;
    }
    async updateSubscriber(id, updates) {
        const subscriber = this.subscribers.get(id);
        if (!subscriber)
            return null;
        const updatedSubscriber = { ...subscriber, ...updates };
        this.subscribers.set(id, updatedSubscriber);
        return updatedSubscriber;
    }
    async unsubscribe(email) {
        const subscriber = Array.from(this.subscribers.values())
            .find(s => s.email === email);
        if (!subscriber)
            return false;
        subscriber.status = 'unsubscribed';
        subscriber.unsubscribedAt = new Date();
        this.subscribers.set(subscriber.id, subscriber);
        return true;
    }
    async getSubscriber(id) {
        return this.subscribers.get(id) || null;
    }
    async getSubscribers(filters) {
        let subscribers = Array.from(this.subscribers.values());
        if (filters?.status) {
            subscribers = subscribers.filter(s => s.status === filters.status);
        }
        if (filters?.tags?.length) {
            subscribers = subscribers.filter(s => filters.tags.some(tag => s.tags.includes(tag)));
        }
        if (filters?.search) {
            const search = filters.search.toLowerCase();
            subscribers = subscribers.filter(s => s.email.toLowerCase().includes(search) ||
                s.firstName?.toLowerCase().includes(search) ||
                s.lastName?.toLowerCase().includes(search));
        }
        return subscribers;
    }
    // Recipient List Management
    async createRecipientList(list) {
        const newList = {
            ...list,
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.recipientLists.set(newList.id, newList);
        return newList;
    }
    async updateRecipientList(id, updates) {
        const list = this.recipientLists.get(id);
        if (!list)
            return null;
        const updatedList = {
            ...list,
            ...updates,
            updatedAt: new Date(),
        };
        this.recipientLists.set(id, updatedList);
        return updatedList;
    }
    async getRecipientLists() {
        return Array.from(this.recipientLists.values());
    }
    // Campaign Management
    async createCampaign(campaign) {
        const newCampaign = {
            ...campaign,
            id: this.generateId(),
            stats: {
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                bounced: 0,
                unsubscribed: 0,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.campaigns.set(newCampaign.id, newCampaign);
        return newCampaign;
    }
    async updateCampaign(id, updates) {
        const campaign = this.campaigns.get(id);
        if (!campaign)
            return null;
        const updatedCampaign = {
            ...campaign,
            ...updates,
            updatedAt: new Date(),
        };
        this.campaigns.set(id, updatedCampaign);
        return updatedCampaign;
    }
    async getCampaign(id) {
        return this.campaigns.get(id) || null;
    }
    async getCampaigns() {
        return Array.from(this.campaigns.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    // Email Sending
    async sendCampaign(campaignId) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign || campaign.status !== 'draft') {
            throw new Error('Campaign not found or not in draft status');
        }
        const template = this.templates.get(campaign.templateId);
        if (!template) {
            throw new Error('Template not found');
        }
        const recipientList = this.recipientLists.get(campaign.recipientListId);
        if (!recipientList) {
            throw new Error('Recipient list not found');
        }
        // Update campaign status
        campaign.status = 'sending';
        campaign.sentAt = new Date();
        this.campaigns.set(campaignId, campaign);
        try {
            // Get active subscribers from the list
            const recipients = recipientList.subscriberIds
                .map(id => this.subscribers.get(id))
                .filter((subscriber) => subscriber !== undefined && subscriber.status === 'active');
            // Send emails
            for (const recipient of recipients) {
                try {
                    await this.sendEmail({
                        to: recipient.email,
                        subject: this.replaceVariables(campaign.subject, recipient),
                        html: this.replaceVariables(template.htmlContent, recipient),
                        text: template.textContent ? this.replaceVariables(template.textContent, recipient) : undefined,
                    });
                    campaign.stats.sent++;
                    campaign.stats.delivered++; // Assume delivered for now
                }
                catch (error) {
                    console.error(`Failed to send email to ${recipient.email}:`, error);
                    campaign.stats.bounced++;
                }
            }
            // Update campaign status
            campaign.status = 'sent';
            this.campaigns.set(campaignId, campaign);
            return true;
        }
        catch (error) {
            campaign.status = 'draft';
            this.campaigns.set(campaignId, campaign);
            throw error;
        }
    }
    async sendEmail(options) {
        await this.transporter.sendMail({
            from: this.config.auth.user,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
    }
    // Analytics
    async getEmailStats() {
        const subscribers = Array.from(this.subscribers.values());
        const campaigns = Array.from(this.campaigns.values());
        const totalSubscribers = subscribers.length;
        const activeSubscribers = subscribers.filter(s => s.status === 'active').length;
        const totalCampaigns = campaigns.length;
        const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.stats.sent, 0);
        const campaignsWithStats = campaigns.filter(c => c.stats.sent > 0);
        const averageOpenRate = campaignsWithStats.length > 0
            ? campaignsWithStats.reduce((sum, c) => sum + (c.stats.opened / c.stats.sent), 0) / campaignsWithStats.length
            : 0;
        const averageClickRate = campaignsWithStats.length > 0
            ? campaignsWithStats.reduce((sum, c) => sum + (c.stats.clicked / c.stats.sent), 0) / campaignsWithStats.length
            : 0;
        const recentCampaigns = campaigns
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);
        return {
            totalSubscribers,
            activeSubscribers,
            totalCampaigns,
            totalEmailsSent,
            averageOpenRate: Math.round(averageOpenRate * 100),
            averageClickRate: Math.round(averageClickRate * 100),
            recentCampaigns,
        };
    }
    // Utility Methods
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    replaceVariables(content, subscriber) {
        let result = content;
        // Replace common variables
        result = result.replace(/{{firstName}}/g, subscriber.firstName || '');
        result = result.replace(/{{lastName}}/g, subscriber.lastName || '');
        result = result.replace(/{{email}}/g, subscriber.email);
        // Replace custom fields
        Object.entries(subscriber.customFields).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, String(value));
        });
        return result;
    }
    // Newsletter specific methods
    async createNewsletter(options) {
        // Create a newsletter template
        const template = await this.createTemplate({
            name: `Newsletter - ${options.subject}`,
            subject: options.subject,
            htmlContent: options.content,
            variables: ['firstName', 'lastName', 'email'],
            category: 'newsletter',
        });
        // Create campaign
        const campaign = await this.createCampaign({
            name: `Newsletter - ${options.subject}`,
            subject: options.subject,
            templateId: template.id,
            recipientListId: options.recipientListId,
            scheduledAt: options.scheduledAt,
            status: options.scheduledAt ? 'scheduled' : 'draft',
        });
        return campaign;
    }
    async subscribeToNewsletter(email, firstName, lastName) {
        return this.addSubscriber({
            email,
            firstName,
            lastName,
            tags: ['newsletter'],
            status: 'active',
            customFields: {},
        });
    }
}
exports.EmailService = EmailService;
