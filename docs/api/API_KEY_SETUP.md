# API Key Management System

## Overview

The NPDI application now features a comprehensive database-backed API key management system accessible through the admin console. API keys can be generated, managed, and revoked directly through the UI, and all keys are automatically validated against the database.

## Features

- **Admin Console Integration**: Generate and manage API keys through the admin dashboard
- **Database-Backed Authentication**: All API keys are stored securely in MongoDB with hashed values
- **Real-time Validation**: Keys are validated against the database on every request
- **Usage Tracking**: Track API key usage including last used date and request count
- **Permissions System**: Assign read, write, or admin permissions to keys
- **Expiration Support**: Set expiration dates for keys (optional)
- **IP Whitelisting**: Restrict keys to specific IP addresses (optional)
- **Rate Limiting**: Configure per-key rate limits
- **Revocation**: Instantly revoke keys without deleting history

## Accessing API Key Management

1. Log in as an **Admin** user
2. Navigate to **Admin Dashboard**
3. Click on the **API Keys** tab
4. Click **Generate New Key** to create a new API key

## Generating an API Key

### Through the Admin UI

1. Navigate to Admin Dashboard → API Keys
2. Click "Generate New Key"
3. Fill in the form:
   - **Key Name** (required): Descriptive name for the key
   - **Description** (optional): Additional details about the key's purpose
   - **Application** (optional): The application/service using this key
   - **Expires In (Days)** (optional): Number of days until expiration
   - **Rate Limit** (default: 1000): Requests per hour allowed
   - **Permissions**: Select read, write, and/or admin permissions
   - **IP Whitelist** (optional): Comma-separated list of allowed IP addresses
4. Click "Generate API Key"
5. **Important**: Copy the generated key immediately - it won't be shown again!

### Key Information Returned

After generation, you'll receive:
- Full API key (shown only once)
- Key prefix (for identification)
- Permissions assigned
- Expiration date (if set)
- Creation timestamp

## Using an API Key

Include the API key in the `X-API-Key` header of your requests:

```bash
curl -H "X-API-Key: your-api-key-here" \
  http://localhost:5000/api/v1/tickets
```

### Example with Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
});

// Make requests
const tickets = await api.get('/tickets');
```

### Example with Python

```python
import requests

headers = {
    'X-API-Key': 'your-api-key-here'
}

response = requests.get('http://localhost:5000/api/v1/tickets', headers=headers)
tickets = response.json()
```

## Managing API Keys

### View All Keys

The API Keys tab displays:
- Key name and application
- Key prefix (first 8 characters)
- Permissions
- Status (Active, Revoked, Expired)
- Usage count
- Last used date
- Expiration date

### Statistics Dashboard

Monitor key usage with:
- Total keys count
- Active keys count
- Total API usage
- Keys expiring soon

### Revoking a Key

1. Navigate to Admin Dashboard → API Keys
2. Find the key you want to revoke
3. Click the revoke icon (X)
4. Confirm the action
5. The key will be immediately deactivated

### Deleting a Key

1. Navigate to Admin Dashboard → API Keys
2. Find the key you want to delete
3. Click the delete icon (trash)
4. Confirm the action
5. The key will be permanently removed

## Permissions System

### Permission Levels

- **read**: Can read ticket data (GET requests)
- **write**: Can read and modify data (GET, POST, PUT, PATCH requests)
- **admin**: Full access to all operations

### Permission Checks

Some endpoints may require specific permissions:
```javascript
// In your route
router.post('/tickets',
  authenticateApiKey,
  checkPermission('write'),
  createTicket
);
```

## Security Features

### Key Hashing

- Full keys are never stored in plain text
- SHA-256 hash is used for validation
- Only the key prefix (8 chars) is stored for identification

### IP Whitelisting

Restrict API key usage to specific IP addresses:
1. When generating a key, enter comma-separated IP addresses
2. Only requests from those IPs will be accepted
3. Leave empty to allow all IPs

### Expiration

Set an expiration date to automatically invalidate keys:
- Specify days until expiration when creating
- Expired keys are automatically rejected
- View expiring keys in the statistics dashboard

### Rate Limiting

Configure per-key rate limits:
- Default: 1000 requests per hour
- Customize during key generation
- Helps prevent abuse and control costs

## Development Mode

In development mode with no API keys configured:
- Authentication is automatically disabled
- A warning message is logged
- All API requests are allowed

**Warning**: This is only for development. Always configure API keys in production!

## API Endpoints for Key Management

Admin users can also manage keys programmatically:

### Generate Key
```http
POST /api/admin/api-keys
Content-Type: application/json

{
  "name": "Production Key",
  "description": "Key for production app",
  "application": "Mobile App",
  "expiresInDays": 365,
  "permissions": ["read", "write"],
  "ipWhitelist": ["192.168.1.1"],
  "rateLimit": { "requestsPerHour": 2000 }
}
```

### List All Keys
```http
GET /api/admin/api-keys?includeInactive=true
```

### Get Key Statistics
```http
GET /api/admin/api-keys/statistics
```

### Revoke Key
```http
PATCH /api/admin/api-keys/:id/revoke
```

### Delete Key
```http
DELETE /api/admin/api-keys/:id
```

### Validate Key (Testing)
```http
POST /api/admin/api-keys/validate
Content-Type: application/json

{
  "key": "your-api-key-here"
}
```

## Database Schema

API keys are stored in MongoDB with the following structure:

```javascript
{
  name: String,              // Key name
  description: String,       // Optional description
  key: String,              // Full key (returned once)
  keyHash: String,          // SHA-256 hash for validation
  keyPrefix: String,        // First 8 characters for display
  isActive: Boolean,        // Active status
  permissions: [String],    // ['read', 'write', 'admin']
  lastUsedAt: Date,        // Last usage timestamp
  usageCount: Number,      // Total requests made
  rateLimit: {
    requestsPerHour: Number
  },
  expiresAt: Date,         // Optional expiration
  createdBy: String,       // Creator email
  createdAt: Date,
  updatedAt: Date,
  ipWhitelist: [String],   // Optional IP restrictions
  application: String      // Application name
}
```

## Troubleshooting

### 401 Unauthorized Error
- **Cause**: No API key provided
- **Solution**: Add the `X-API-Key` header to your request

### 403 Forbidden Error
- **Cause**: Invalid, expired, or revoked API key
- **Solution**: Generate a new key or check key status in admin dashboard

### Key Not Working After Generation
- **Cause**: Incorrect key copied or database connection issue
- **Solution**:
  1. Verify you copied the entire key
  2. Check MongoDB connection
  3. Generate a new key if needed

### Authentication Disabled Warning
- **Cause**: No API keys configured in development mode
- **Solution**: Generate at least one API key to enable authentication

## Best Practices

1. **Name Keys Descriptively**: Use clear names like "Production App", "Staging Environment"
2. **Use Appropriate Permissions**: Only grant the minimum permissions needed
3. **Set Expiration Dates**: For temporary access, set an expiration date
4. **Monitor Usage**: Regularly check the statistics dashboard
5. **Rotate Keys**: Periodically generate new keys and revoke old ones
6. **Secure Storage**: Store API keys securely (use environment variables, secrets managers)
7. **Never Commit Keys**: Don't commit API keys to version control
8. **Use IP Whitelisting**: For production apps with known IPs, use IP whitelisting
9. **Revoke Compromised Keys**: Immediately revoke any compromised keys
10. **Document Key Usage**: Keep track of which keys are used where

## Migration from Environment Variables

If you previously used `.env` file API keys:

1. Generate new keys through the admin UI
2. Update your applications to use the new keys
3. Remove old `API_KEY_*` entries from `.env` file
4. Test all integrations

The old environment variable-based system is no longer used.

## Support

For issues or questions:
1. Check the Admin Dashboard → API Keys tab for key status
2. Review the API_DOCUMENTATION.md file
3. Check server logs for detailed error messages
4. Contact your system administrator

## Changelog

### Version 2.0.0 (Current)
- Added database-backed API key management
- Integrated API key generation into admin console
- Added usage tracking and statistics
- Implemented permissions system
- Added IP whitelisting support
- Added rate limiting per key
- Added expiration support
- Removed environment variable-based keys

### Version 1.0.0
- Basic API key authentication via environment variables
- Static API keys defined in .env file
