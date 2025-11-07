const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');

class TeamsNotificationService {
  /**
   * Send a notification to Microsoft Teams
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {Object} options.ticket - Ticket object
   * @param {string} options.actionType - Type of action (status_change, created, comment, assignment)
   * @param {Object} options.user - User who performed the action
   */
  async sendNotification({ title, message, ticket, actionType, user, oldStatus, newStatus }) {
    try {
      const settings = await SystemSettings.getSettings();

      // Check if Teams integration is enabled
      if (!settings.integrations.teams.enabled) {
        console.log('Teams notifications disabled');
        return { success: false, reason: 'Teams notifications disabled' };
      }

      // Check if we should notify for this action type
      if (actionType === 'status_change' && !settings.integrations.teams.notifyOnStatusChange) {
        return { success: false, reason: 'Status change notifications disabled' };
      }
      if (actionType === 'created' && !settings.integrations.teams.notifyOnTicketCreated) {
        return { success: false, reason: 'Ticket created notifications disabled' };
      }
      if (actionType === 'comment' && !settings.integrations.teams.notifyOnCommentAdded) {
        return { success: false, reason: 'Comment notifications disabled' };
      }
      if (actionType === 'assignment' && !settings.integrations.teams.notifyOnAssignment) {
        return { success: false, reason: 'Assignment notifications disabled' };
      }

      const webhookUrl = settings.integrations.teams.webhookUrl;
      if (!webhookUrl) {
        console.log('Teams webhook URL not configured');
        return { success: false, reason: 'Webhook URL not configured' };
      }

      // Create Adaptive Card payload
      const card = this.createAdaptiveCard({
        title,
        message,
        ticket,
        actionType,
        user,
        oldStatus,
        newStatus
      });

      // Send to Teams
      await axios.post(webhookUrl, card, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log(`Teams notification sent for ticket ${ticket.ticketNumber}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending Teams notification:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a status change notification to the ticket originator
   */
  async notifyStatusChange(ticket, oldStatus, newStatus, changedBy) {
    const statusColors = {
      'DRAFT': 'Attention',
      'SUBMITTED': 'Good',
      'IN_PROCESS': 'Accent',
      'NPDI_INITIATED': 'Accent',
      'COMPLETED': 'Good',
      'CANCELED': 'Warning'
    };

    return this.sendNotification({
      title: `📋 Ticket Status Updated`,
      message: `Your ticket has been updated from ${oldStatus} to ${newStatus}`,
      ticket,
      actionType: 'status_change',
      user: changedBy,
      oldStatus,
      newStatus
    });
  }

  /**
   * Create an Adaptive Card for Teams
   */
  createAdaptiveCard({ title, message, ticket, actionType, user, oldStatus, newStatus }) {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const ticketUrl = `${baseUrl}/tickets/${ticket._id}`;

    // Status color mapping
    const statusColors = {
      'DRAFT': 'Attention',
      'SUBMITTED': 'Good',
      'IN_PROCESS': 'Accent',
      'NPDI_INITIATED': 'Accent',
      'COMPLETED': 'Good',
      'CANCELED': 'Warning'
    };

    // Priority color mapping
    const priorityColors = {
      'LOW': 'Good',
      'MEDIUM': 'Attention',
      'HIGH': 'Warning',
      'URGENT': 'Attention'
    };

    const facts = [
      {
        title: 'Ticket Number:',
        value: ticket.ticketNumber || 'N/A'
      },
      {
        title: 'Product Name:',
        value: ticket.productName || 'N/A'
      },
      {
        title: 'SBU:',
        value: ticket.sbu || 'N/A'
      },
      {
        title: 'Priority:',
        value: ticket.priority || 'MEDIUM'
      }
    ];

    // Add status change specific facts
    if (actionType === 'status_change') {
      facts.push({
        title: 'Status Changed:',
        value: `${oldStatus} → ${newStatus}`
      });
      if (user) {
        facts.push({
          title: 'Changed By:',
          value: user.firstName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown'
        });
      }
    }

    // Add created by info
    if (ticket.createdBy) {
      facts.push({
        title: 'Ticket Creator:',
        value: ticket.createdBy
      });
    }

    // Build the Adaptive Card
    const adaptiveCard = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: title,
                weight: 'Bolder',
                size: 'Large',
                wrap: true,
                color: statusColors[newStatus] || 'Default'
              },
              {
                type: 'TextBlock',
                text: message,
                wrap: true,
                spacing: 'Small'
              },
              {
                type: 'FactSet',
                facts: facts,
                spacing: 'Medium'
              }
            ],
            actions: [
              {
                type: 'Action.OpenUrl',
                title: 'View Ticket',
                url: ticketUrl
              }
            ]
          }
        }
      ]
    };

    return adaptiveCard;
  }

  /**
   * Notify when a ticket is created
   */
  async notifyTicketCreated(ticket, creator) {
    return this.sendNotification({
      title: '🆕 New NPDI Ticket Created',
      message: `A new product development ticket has been created`,
      ticket,
      actionType: 'created',
      user: creator
    });
  }

  /**
   * Notify when a comment is added
   */
  async notifyCommentAdded(ticket, comment, commenter) {
    return this.sendNotification({
      title: '💬 New Comment Added',
      message: comment.content,
      ticket,
      actionType: 'comment',
      user: commenter
    });
  }

  /**
   * Notify when a ticket is assigned
   */
  async notifyAssignment(ticket, assignedTo, assignedBy) {
    return this.sendNotification({
      title: '👤 Ticket Assigned',
      message: `Ticket has been assigned to ${assignedTo}`,
      ticket,
      actionType: 'assignment',
      user: assignedBy
    });
  }
}

module.exports = new TeamsNotificationService();
