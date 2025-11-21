# Azure OpenAI Integration Setup

This document explains how to configure and test the Azure OpenAI integration using Merck's NLP API endpoint.

## Overview

The application uses Azure OpenAI via Merck's internal NLP API endpoint. The implementation is based on the Python example provided in the Merck documentation.

## Configuration

### Environment Variables (Optional)

You can configure Azure OpenAI using environment variables in your `.env` file:

```env
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_ENV=prod
AZURE_OPENAI_API_VERSION=2024-10-21
AZURE_OPENAI_MODEL=gpt-4o-mini
```

### Admin Dashboard Configuration (Recommended)

Alternatively, configure through the Admin Dashboard UI:

1. Navigate to **Admin Dashboard** → **System Settings** → **AI Content**
2. Enable "Azure OpenAI Content Generation"
3. Configure the following settings:
   - **API Key**: Your Azure OpenAI API key (required)
   - **Environment**: Choose environment (prod, staging, test, dev)
   - **API Version**: Azure OpenAI API version (default: 2024-10-21)
   - **Model/Deployment Name**: The Azure deployment name (e.g., gpt-4o-mini)
   - **Max Tokens**: Maximum tokens per request (default: 2000)
   - **Timeout**: Request timeout in seconds (default: 30)

## API Endpoint Format

The application connects to Azure OpenAI using this endpoint pattern:

```
https://api.nlp.{environment}.uptimize.merckgroup.com/openai/deployments/{model}/chat/completions?api-version={apiVersion}
```

**Example:**
```
https://api.nlp.prod.uptimize.merckgroup.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-10-21
```

## VPN Requirement

** WARNING: IMPORTANT:** You must be connected to the Merck VPN to access the Azure OpenAI API endpoint.

Without VPN connection, you will receive connection errors such as:
- `ENOTFOUND` - Cannot resolve hostname
- `ECONNREFUSED` - Connection refused

## Testing the Connection

### Method 1: Using the Test Script

A standalone test script is provided to verify the Azure OpenAI connection:

```bash
# Set your API key
export AZURE_OPENAI_API_KEY="your-api-key-here"

# Run the test (VPN required!)
node server/scripts/testAzureOpenAI.js
```

The test script will:
- Validate your configuration
- Send a simple test message
- Display the response and token usage
- Provide helpful error messages if connection fails

### Method 2: Using the Admin Dashboard

1. Configure Azure OpenAI settings in Admin Dashboard
2. Click the "Test Connection" button
3. View the connection test results

### Method 3: Using the Application

1. Configure Azure OpenAI settings
2. Create a new product ticket
3. Enter basic product information (CAS number, name, etc.)
4. Click "Generate CorpBase Content"
5. The application will use Azure OpenAI to generate product descriptions

## Changes Made

### Backend Changes

1. **azureOpenAIService.js** (`server/services/azureOpenAIService.js`):
   - Uses Azure OpenAI endpoint format
   - Authentication via `api-key` header
   - Environment-specific endpoint URL construction
   - VPN-related error detection and messaging
   - Supports dev, test, staging, and prod environments

2. **SystemSettings.js** (`server/models/SystemSettings.js`):
   - Configuration stored in `integrations.langdock` (field name for backward compatibility)
   - `environment` field: dev, test, staging, prod
   - `apiVersion` field (default: 2024-10-21)
   - `model` field: deployment name (e.g., gpt-4o-mini)

### Frontend Changes

3. **SystemSettings.jsx** (`client/src/components/admin/SystemSettings.jsx`):
   - Uses "Azure OpenAI" terminology
   - Environment dropdown (dev, test, staging, prod)
   - API Version configuration
   - Deployment name/Model configuration
   - VPN warning message for connectivity requirements
   - Removed "Available Endpoints" field

## API Key Management

**Security Notes:**
- API keys are stored encrypted in the database
- Never commit API keys to version control
- Use environment variables or secure vaults for production
- The Admin Dashboard masks API keys when displaying them

## Troubleshooting

### Connection Errors

**Problem:** `ENOTFOUND` or `ECONNREFUSED` errors

**Solution:**
- Ensure you are connected to Merck VPN
- Verify the environment value is correct (prod, staging, test, dev)

### Authentication Errors (401)

**Problem:** Authentication failed

**Solution:**
- Verify your API key is correct
- Check that the API key has not expired
- Ensure you have permissions to use the deployment

### Model Not Found (404)

**Problem:** Deployment not found

**Solution:**
- Verify the model/deployment name is correct
- Check that the deployment exists in the specified environment
- Confirm the API version is compatible with the deployment

### Rate Limiting (429)

**Problem:** Too many requests

**Solution:**
- Wait before retrying
- Check your quota usage in Admin Dashboard
- Consider increasing your API quota

## Available Models

Common Azure OpenAI deployment names (check with your admin for exact names):
- `gpt-4o-mini` - Recommended for most use cases
- `gpt-4o` - More capable, higher cost
- `gpt-4` - Previous generation
- `gpt-3.5-turbo` - Faster, lower cost
- `text-embedding-ada-002` - For embeddings (future use)

## Support

For Azure OpenAI API access and configuration questions, contact:
- Merck IT Support
- NLP API Team

For application-specific issues, check:
- Application logs: `server/logs/`
- Browser console for frontend errors
- System Settings → Performance → Logging
