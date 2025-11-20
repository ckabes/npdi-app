# API Quick Start Guide

## Getting Started with the NPDI Ticket API

This guide will help you quickly set up and start using the NPDI Ticket API.

## Prerequisites

- Node.js installed
- MongoDB running
- NPDI application running (both server and client)

## Step 1: Start the Application

```bash
# Start MongoDB (if not already running)
mongod

# Start the server (in one terminal)
cd /home/ckabes/npdi-app
npm start

# Start the client (in another terminal)
cd /home/ckabes/npdi-app/client
npm run dev
```

The application should be running at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## Step 2: Generate Your First API Key

### Option A: Using the Admin UI (Recommended)

1. Open http://localhost:5173 in your browser
2. Log in as an Admin user:
   - Select: **Mike Wilson (Admin)**
3. Navigate to **Admin Dashboard**
4. Click on the **API Keys** tab
5. Click **Generate New Key**
6. Fill in the form:
   - Name: "My First API Key"
   - Description: "Testing the API"
   - Permissions: Check "read"
7. Click **Generate API Key**
8. **Copy the key immediately** - you won't see it again!

### Option B: Using the Seed Script

```bash
cd /home/ckabes/npdi-app
node server/scripts/seedApiKey.js
```

This will create a development API key with full permissions and display it in the terminal.

## Step 3: Test Your API Key

### Using curl

```bash
# Replace YOUR_API_KEY with the key you generated
export API_KEY="YOUR_API_KEY"

# Get all tickets
curl -H "X-API-Key: $API_KEY" \
  http://localhost:5000/api/v1/tickets

# Get default template
curl -H "X-API-Key: $API_KEY" \
  http://localhost:5000/api/v1/tickets/template/default

# Get ticket statistics
curl -H "X-API-Key: $API_KEY" \
  http://localhost:5000/api/v1/tickets/statistics
```

### Using Postman

1. Create a new request
2. Set method to **GET**
3. Enter URL: `http://localhost:5000/api/v1/tickets`
4. Go to **Headers** tab
5. Add header:
   - Key: `X-API-Key`
   - Value: Your generated API key
6. Click **Send**

### Using JavaScript

```javascript
const axios = require('axios');

const API_KEY = 'your-api-key-here';
const BASE_URL = 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-Key': API_KEY
  }
});

// Get all tickets
async function getTickets() {
  try {
    const response = await api.get('/tickets');
    console.log('Tickets:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

getTickets();
```

### Using Python

```python
import requests

API_KEY = 'your-api-key-here'
BASE_URL = 'http://localhost:5000/api/v1'

headers = {
    'X-API-Key': API_KEY
}

# Get all tickets
response = requests.get(f'{BASE_URL}/tickets', headers=headers)
print(response.json())
```

## Step 4: Explore the API

### Available Endpoints

1. **List Tickets**
   ```bash
   GET /api/v1/tickets
   ```

2. **Get Single Ticket**
   ```bash
   GET /api/v1/tickets/:id
   ```

3. **Search Tickets**
   ```bash
   POST /api/v1/tickets/search
   Content-Type: application/json

   {
     "query": "formaldehyde",
     "filters": { "status": "IN_PROCESS" }
   }
   ```

4. **Get Statistics**
   ```bash
   GET /api/v1/tickets/statistics
   ```

5. **Get Default Template**
   ```bash
   GET /api/v1/tickets/template/default
   ```

6. **Get Schema**
   ```bash
   GET /api/v1/tickets/schema
   ```

### Example: Get Filtered Tickets

```bash
# Get all tickets in IN_PROCESS status from SBU 775
curl -H "X-API-Key: $API_KEY" \
  "http://localhost:5000/api/v1/tickets?status=IN_PROCESS&sbu=775&limit=10"
```

### Example: Search Tickets

```bash
curl -X POST \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "chemical",
    "filters": {
      "status": "IN_PROCESS",
      "priority": "HIGH"
    },
    "page": 1,
    "limit": 20
  }' \
  http://localhost:5000/api/v1/tickets/search
```

## Step 5: Understanding the Response

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 142,
    "pages": 3
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Common Use Cases

### 1. Get All Active Tickets

```bash
curl -H "X-API-Key: $API_KEY" \
  "http://localhost:5000/api/v1/tickets?status=IN_PROCESS&status=SUBMITTED"
```

### 2. Get Urgent Tickets

```bash
curl -H "X-API-Key: $API_KEY" \
  "http://localhost:5000/api/v1/tickets?priority=URGENT"
```

### 3. Get Tickets for a Specific SBU

```bash
curl -H "X-API-Key: $API_KEY" \
  "http://localhost:5000/api/v1/tickets?sbu=775"
```

### 4. Get Recently Created Tickets

```bash
curl -H "X-API-Key: $API_KEY" \
  "http://localhost:5000/api/v1/tickets?sortBy=createdAt&sortOrder=desc&limit=10"
```

### 5. Search by CAS Number

```bash
curl -X POST \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "50-00-0"}' \
  http://localhost:5000/api/v1/tickets/search
```

## Monitoring Your API Usage

1. Go to **Admin Dashboard** → **API Keys**
2. View your key's statistics:
   - Usage count
   - Last used date
   - Status

## Managing API Keys

### View All Keys
```bash
# Admin endpoint (requires admin permissions)
curl -H "X-API-Key: $API_KEY" \
  http://localhost:5000/api/admin/api-keys
```

### Get Statistics
```bash
curl -H "X-API-Key: $API_KEY" \
  http://localhost:5000/api/admin/api-keys/statistics
```

## Troubleshooting

### Error: "API key is required"
- **Solution**: Make sure you're including the `X-API-Key` header

### Error: "Invalid API key"
- **Solution**: Check that you copied the key correctly
- Generate a new key if needed

### Error: "API key is expired"
- **Solution**: Generate a new API key

### Error: 429 Too Many Requests
- **Solution**: You've exceeded the rate limit. Wait before making more requests.

## Next Steps

1. Read the full [API Documentation](./API_DOCUMENTATION.md)
2. Learn about [API Key Management](./API_KEY_SETUP.md)
3. Explore advanced filtering and search options
4. Set up error handling in your application
5. Implement retry logic for failed requests

## Support

For questions or issues:
1. Check the documentation files
2. Review the Admin Dashboard for key status
3. Check server logs for detailed errors
4. Contact your system administrator

## Rate Limits

- Default: 1000 requests per hour per key
- Development mode: 10000 requests per hour
- Customize per key in Admin Dashboard

## Best Practices

1. **Store Keys Securely**: Use environment variables
2. **Never Commit Keys**: Add to .gitignore
3. **Use Appropriate Permissions**: Only grant necessary permissions
4. **Monitor Usage**: Check the Admin Dashboard regularly
5. **Rotate Keys**: Periodically generate new keys
6. **Handle Errors**: Implement proper error handling
7. **Cache Results**: Cache frequently accessed data
8. **Use Pagination**: Always paginate large result sets

## Quick Reference Card

```bash
# Base URL
BASE_URL=http://localhost:5000/api/v1

# Authentication
-H "X-API-Key: YOUR_KEY"

# Common Endpoints
GET  /tickets                    # List all tickets
GET  /tickets/:id               # Get single ticket
GET  /tickets/number/:number    # Get by ticket number
POST /tickets/search            # Advanced search
GET  /tickets/statistics        # Get statistics
GET  /tickets/template/default  # Get default template
GET  /tickets/schema            # Get data schema

# Query Parameters
?page=1                         # Page number
&limit=50                       # Results per page
&status=IN_PROCESS             # Filter by status
&priority=HIGH                 # Filter by priority
&sbu=775                       # Filter by SBU
&sortBy=createdAt              # Sort field
&sortOrder=desc                # Sort direction
```

Happy coding!
