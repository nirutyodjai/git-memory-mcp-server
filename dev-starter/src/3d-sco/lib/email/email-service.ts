import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category: 'newsletter' | 'marketing' | 'transactional' | 'welcome' | 'notification';
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateId: string;
  recipientListId: string;
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  subscribedAt: Date;
  unsubscribedAt?: Date;
  lastEmailSent?: Date;
  customFields: Record<string, any>;
}

export interface RecipientList {
  id: string;
  name: string;
  description?: string;
  subscriberIds: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  recentCampaigns: EmailCampaign[];
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, EmailTemplate> = new Map();
  private campaigns: Map<string, EmailCampaign> = new Map();
  private subscribers: Map<string, Subscriber> = new Map();
  private recipientLists: Map<string, RecipientList> = new Map();

  constructor(private config: EmailConfig) {
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }

  // Template Management
  async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const newTemplate: EmailTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    const template = this.templates.get(id);
    if (!template) return null;

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  async getTemplate(id: string): Promise<EmailTemplate | null> {
    return this.templates.get(id) || null;
  }

  async getTemplates(category?: EmailTemplate['category']): Promise<EmailTemplate[]> {
    const templates = Array.from(this.templates.values());
    return category ? templates.filter(t => t.category === category) : templates;
  }

  // Subscriber Management
  async addSubscriber(subscriber: Omit<Subscriber, 'id' | 'subscribedAt'>): Promise<Subscriber> {
    const existingSubscriber = Array.from(this.subscribers.values())
      .find(s => s.email === subscriber.email);
    
    if (existingSubscriber) {
      throw new Error('Subscriber already exists');
    }

    const newSubscriber: Subscriber = {
      ...subscriber,
      id: this.generateId(),
      subscribedAt: new Date(),
    };

    this.subscribers.set(newSubscriber.id, newSubscriber);
    return newSubscriber;
  }

  async updateSubscriber(id: string, updates: Partial<Subscriber>): Promise<Subscriber | null> {
    const subscriber = this.subscribers.get(id);
    if (!subscriber) return null;

    const updatedSubscriber = { ...subscriber, ...updates };
    this.subscribers.set(id, updatedSubscriber);
    return updatedSubscriber;
  }

  async unsubscribe(email: string): Promise<boolean> {
    const subscriber = Array.from(this.subscribers.values())
      .find(s => s.email === email);
    
    if (!subscriber) return false;

    subscriber.status = 'unsubscribed';
    subscriber.unsubscribedAt = new Date();
    this.subscribers.set(subscriber.id, subscriber);
    return true;
  }

  async getSubscriber(id: string): Promise<Subscriber | null> {
    return this.subscribers.get(id) || null;
  }

  async getSubscribers(filters?: {
    status?: Subscriber['status'];
    tags?: string[];
    search?: string;
  }): Promise<Subscriber[]> {
    let subscribers = Array.from(this.subscribers.values());

    if (filters?.status) {
      subscribers = subscribers.filter(s => s.status === filters.status);
    }

    if (filters?.tags?.length) {
      subscribers = subscribers.filter(s => 
        filters.tags!.some(tag => s.tags.includes(tag))
      );
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      subscribers = subscribers.filter(s => 
        s.email.toLowerCase().includes(search) ||
        s.firstName?.toLowerCase().includes(search) ||
        s.lastName?.toLowerCase().includes(search)
      );
    }

    return subscribers;
  }

  // Recipient List Management
  async createRecipientList(list: Omit<RecipientList, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecipientList> {
    const newList: RecipientList = {
      ...list,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.recipientLists.set(newList.id, newList);
    return newList;
  }

  async updateRecipientList(id: string, updates: Partial<RecipientList>): Promise<RecipientList | null> {
    const list = this.recipientLists.get(id);
    if (!list) return null;

    const updatedList = {
      ...list,
      ...updates,
      updatedAt: new Date(),
    };

    this.recipientLists.set(id, updatedList);
    return updatedList;
  }

  async getRecipientLists(): Promise<RecipientList[]> {
    return Array.from(this.recipientLists.values());
  }

  // Campaign Management
  async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'stats' | 'createdAt' | 'updatedAt'>): Promise<EmailCampaign> {
    const newCampaign: EmailCampaign = {
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

  async updateCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | null> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return null;

    const updatedCampaign = {
      ...campaign,
      ...updates,
      updatedAt: new Date(),
    };

    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async getCampaign(id: string): Promise<EmailCampaign | null> {
    return this.campaigns.get(id) || null;
  }

  async getCampaigns(): Promise<EmailCampaign[]> {
    return Array.from(this.campaigns.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Email Sending
  async sendCampaign(campaignId: string): Promise<boolean> {
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
        .filter((subscriber): subscriber is Subscriber => 
          subscriber !== undefined && subscriber.status === 'active'
        );

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
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          campaign.stats.bounced++;
        }
      }

      // Update campaign status
      campaign.status = 'sent';
      this.campaigns.set(campaignId, campaign);

      return true;
    } catch (error) {
      campaign.status = 'draft';
      this.campaigns.set(campaignId, campaign);
      throw error;
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.auth.user,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }

  // Analytics
  async getEmailStats(): Promise<EmailStats> {
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
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private replaceVariables(content: string, subscriber: Subscriber): string {
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
  async createNewsletter(options: {
    subject: string;
    content: string;
    recipientListId: string;
    scheduledAt?: Date;
  }): Promise<EmailCampaign> {
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

  async subscribeToNewsletter(email: string, firstName?: string, lastName?: string): Promise<Subscriber> {
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