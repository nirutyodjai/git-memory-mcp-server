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
export declare class EmailService {
    private config;
    private transporter;
    private templates;
    private campaigns;
    private subscribers;
    private recipientLists;
    constructor(config: EmailConfig);
    createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate>;
    updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null>;
    deleteTemplate(id: string): Promise<boolean>;
    getTemplate(id: string): Promise<EmailTemplate | null>;
    getTemplates(category?: EmailTemplate['category']): Promise<EmailTemplate[]>;
    addSubscriber(subscriber: Omit<Subscriber, 'id' | 'subscribedAt'>): Promise<Subscriber>;
    updateSubscriber(id: string, updates: Partial<Subscriber>): Promise<Subscriber | null>;
    unsubscribe(email: string): Promise<boolean>;
    getSubscriber(id: string): Promise<Subscriber | null>;
    getSubscribers(filters?: {
        status?: Subscriber['status'];
        tags?: string[];
        search?: string;
    }): Promise<Subscriber[]>;
    createRecipientList(list: Omit<RecipientList, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecipientList>;
    updateRecipientList(id: string, updates: Partial<RecipientList>): Promise<RecipientList | null>;
    getRecipientLists(): Promise<RecipientList[]>;
    createCampaign(campaign: Omit<EmailCampaign, 'id' | 'stats' | 'createdAt' | 'updatedAt'>): Promise<EmailCampaign>;
    updateCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | null>;
    getCampaign(id: string): Promise<EmailCampaign | null>;
    getCampaigns(): Promise<EmailCampaign[]>;
    sendCampaign(campaignId: string): Promise<boolean>;
    sendEmail(options: {
        to: string;
        subject: string;
        html: string;
        text?: string;
    }): Promise<void>;
    getEmailStats(): Promise<EmailStats>;
    private generateId;
    private replaceVariables;
    createNewsletter(options: {
        subject: string;
        content: string;
        recipientListId: string;
        scheduledAt?: Date;
    }): Promise<EmailCampaign>;
    subscribeToNewsletter(email: string, firstName?: string, lastName?: string): Promise<Subscriber>;
}
//# sourceMappingURL=email-service.d.ts.map