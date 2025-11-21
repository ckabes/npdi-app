# Microsoft Teams Integration

## Overview

The NPDI application now supports Microsoft Teams notifications via Incoming Webhooks. When enabled, the system will send rich, formatted notifications to a Teams channel whenever important ticket events occur.

## Features

- **Adaptive Card Notifications**: Beautiful, formatted messages with ticket details
- **Status Change Notifications**: Notifies ticket originators when their ticket status changes
- **Configurable Events**: Choose which events trigger notifications:
  - Status changes (DRAFT → SUBMITTED → IN_PROCESS → COMPLETED)
  - Ticket creation
  - Comment additions
  - Ticket assignments
- **Direct Links**: Each notification includes a "View Ticket" button that links directly to the ticket

## Setup Instructions

### Step 1: Create an Incoming Webhook in Teams

1. Open Microsoft Teams and navigate to the channel where you want to receive notifications
2. Click the **⋯** (More options) button next to the channel name
3. Select **Connectors** or **Manage channel** → **Connectors**
4. Search for "Incoming Webhook" in the connectors list
5. Click **Configure** next to Incoming Webhook
6. Give your webhook a name (e.g., "NPDI Notifications")
7. Optionally upload a custom image/icon
8. Click **Create**
9. **Copy the webhook URL** - you'll need this in the next step
10. Click **Done**

### Step 2: Configure NPDI Application

1. Log in to the NPDI application as an **Administrator**
2. Navigate to **Admin Panel** → **System Settings**
3. Click on the **Integrations** section
4. Find the **Microsoft Teams Integration** section (highlighted in purple/blue)
5. Check the box to **Enable Teams notifications**
6. Paste the webhook URL you copied from Teams into the **Teams Webhook URL** field
7. Select which notification events you want to enable:
   - **Notify on status changes** (recommended) - Sends notifications to ticket originators when status changes
   - Notify on ticket creation - Sends notifications when new tickets are created
   - Notify on comments - Sends notifications when comments are added
   - Notify on assignment - Sends notifications when tickets are assigned
8. Click **Save Settings** at the top right

### Step 3: Test the Integration

1. Create or update a ticket in NPDI
2. Change the ticket status (e.g., from SUBMITTED to IN_PROCESS)
3. Check your Teams channel for the notification

## Notification Format

Teams notifications use **Adaptive Cards** for rich formatting. Each notification includes:

### Header
- Status icon and title (e.g., "Ticket Status Updated")
- Color-coded status badge

### Ticket Information
- **Ticket Number**: The unique NPDI ticket ID
- **Product Name**: Name of the product
- **SBU**: Strategic Business Unit
- **Priority**: Current priority level
- **Status Changed**: Shows old → new status (for status change notifications)
- **Changed By**: User who made the change
- **Ticket Creator**: Original ticket creator

### Actions
- **View Ticket** button that opens the ticket directly in the NPDI application

## Technical Details

### Files Modified/Created

**Backend:**
- `server/models/SystemSettings.js` - Added Teams integration settings
- `server/services/teamsNotificationService.js` - **NEW** - Notification service
- `server/controllers/productController.js` - Integrated Teams notifications on status changes

**Frontend:**
- `client/src/components/admin/SystemSettings.jsx` - Added Teams configuration UI

### Notification Service API

The `teamsNotificationService` exposes the following methods:

```javascript
// Send status change notification
await teamsNotificationService.notifyStatusChange(ticket, oldStatus, newStatus, changedBy);

// Send ticket created notification
await teamsNotificationService.notifyTicketCreated(ticket, creator);

// Send comment added notification
await teamsNotificationService.notifyCommentAdded(ticket, comment, commenter);

// Send assignment notification
await teamsNotificationService.notifyAssignment(ticket, assignedTo, assignedBy);
```

### Configuration Schema

```javascript
{
  integrations: {
    teams: {
      enabled: Boolean,              // Enable/disable Teams integration
      webhookUrl: String,            // Teams Incoming Webhook URL
      notifyOnStatusChange: Boolean, // Send notifications on status changes
      notifyOnTicketCreated: Boolean,// Send notifications on ticket creation
      notifyOnCommentAdded: Boolean, // Send notifications on comments
      notifyOnAssignment: Boolean    // Send notifications on assignments
    }
  }
}
```

### Error Handling

- Notifications are sent asynchronously and **do not block** ticket operations
- If a Teams notification fails, it logs an error but allows the ticket operation to complete successfully
- Network timeouts are set to 10 seconds to prevent long delays

## Troubleshooting

### Notifications Not Appearing

1. **Check webhook URL**: Ensure the URL is correctly copied from Teams and starts with `https://`
2. **Verify Teams integration is enabled**: Check the checkbox in System Settings
3. **Verify event is enabled**: Make sure the specific notification type is checked
4. **Check the webhook is active**: In Teams, go to Connectors and verify the webhook hasn't been deleted
5. **Review server logs**: Check the Node.js console for error messages like "Failed to send Teams notification"

### Webhook URL Expired

Teams webhook URLs can expire or be revoked. If notifications stop working:
1. Delete the old webhook in Teams Connectors
2. Create a new Incoming Webhook
3. Update the webhook URL in NPDI System Settings

### Testing Without Teams

For development/testing without a real Teams channel, you can use:
- [RequestBin](https://requestbin.com) - Create a temporary endpoint to see webhook payloads
- [Webhook.site](https://webhook.site) - Inspect webhook requests
- Local testing tools like [ngrok](https://ngrok.com)

## Security Considerations

- **Webhook URLs are sensitive**: Treat them like passwords - anyone with the URL can post to your Teams channel
- **HTTPS only**: Teams webhooks only accept HTTPS connections
- **No authentication required**: The webhook URL itself is the authentication mechanism
- **Rate limiting**: Teams may rate-limit excessive webhook calls

## Future Enhancements

Potential improvements for future versions:
- **User-specific notifications**: Send notifications to individual users via Teams chat
- **Actionable buttons**: Add buttons to approve/reject tickets directly from Teams
- **Mention users**: @mention specific team members in notifications
- **Custom message templates**: Allow customization of notification messages
- **Microsoft Graph API**: Full Teams bot integration for two-way communication

## Support

For issues with Teams integration:
1. Check this documentation
2. Review server logs for error messages
3. Verify Teams webhook configuration
4. Contact your system administrator

---

**Last Updated**: 2025-11-06
**Version**: 1.0
**Author**: NPDI Development Team
