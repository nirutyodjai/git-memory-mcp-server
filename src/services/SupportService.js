class SupportService {
  static async createTicket(userId, subject, message) {
    // In a real application, you would save this to a database
    const ticket = {
      id: `ticket-${Date.now()}`,
      userId,
      subject,
      message,
      status: 'open',
      createdAt: new Date().toISOString(),
      comments: [],
    };
    return ticket;
  }

  static async getTicket(ticketId) {
    // In a real application, you would retrieve this from a database
    return {
      id: ticketId,
      userId: 'user-123',
      subject: 'Test Ticket',
      message: 'This is a test ticket.',
      status: 'open',
      createdAt: new Date().toISOString(),
      comments: [],
    };
  }

  static async addComment(ticketId, userId, comment) {
    // In a real application, you would update the ticket in the database
    return {
      ticketId,
      userId,
      comment,
      createdAt: new Date().toISOString(),
    };
  }
}

module.exports = SupportService;