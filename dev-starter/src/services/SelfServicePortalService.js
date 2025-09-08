const EventEmitter = require('events');

/**
 * @class SelfServicePortalService
 * @description Manages the self-service portal, including account management, billing, and support.
 */
class SelfServicePortalService extends EventEmitter {
    constructor() {
        super();
        // Mock data for demonstration
        this.accounts = new Map();
        this.billingInfo = new Map();
        this.usageAnalytics = new Map();
        this.supportTickets = new Map();
    }

    /**
     * @description Get account details for a user.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Object|null>} The user's account details.
     */
    async getAccountDetails(userId) {
        return this.accounts.get(userId) || null;
    }

    /**
     * @description Update account details for a user.
     * @param {string} userId - The ID of the user.
     * @param {Object} updatedDetails - The updated account information.
     * @returns {Promise<Object>} The updated account details.
     */
    async updateAccountDetails(userId, updatedDetails) {
        if (!this.accounts.has(userId)) {
            throw new Error('User account not found.');
        }
        const currentDetails = this.accounts.get(userId);
        const newDetails = { ...currentDetails, ...updatedDetails };
        this.accounts.set(userId, newDetails);
        this.emit('account-updated', newDetails);
        return newDetails;
    }

    /**
     * @description Get billing history for a user.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Array>} The user's billing history.
     */
    async getBillingHistory(userId) {
        return this.billingInfo.get(userId) || [];
    }

    /**
     * @description Get usage analytics for a user.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Object|null>} The user's usage analytics.
     */
    async getUsageAnalytics(userId) {
        return this.usageAnalytics.get(userId) || null;
    }

    /**
     * @description Create a new support ticket.
     * @param {string} userId - The ID of the user creating the ticket.
     * @param {Object} ticketDetails - The details of the support ticket.
     * @returns {Promise<Object>} The newly created support ticket.
     */
    async createSupportTicket(userId, ticketDetails) {
        const ticketId = `ticket_${Date.now()}`;
        const newTicket = {
            id: ticketId,
            userId,
            ...ticketDetails,
            status: 'open',
            createdAt: new Date(),
        };
        if (!this.supportTickets.has(userId)) {
            this.supportTickets.set(userId, []);
        }
        this.supportTickets.get(userId).push(newTicket);
        this.emit('support-ticket-created', newTicket);
        return newTicket;
    }

    /**
     * @description Get all support tickets for a user.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Array>} A list of the user's support tickets.
     */
    async getSupportTickets(userId) {
        return this.supportTickets.get(userId) || [];
    }
}

module.exports = new SelfServicePortalService();