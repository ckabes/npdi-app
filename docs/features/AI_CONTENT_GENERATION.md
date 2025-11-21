# AI Content Generation Feature

## Overview

The NPDI application includes AI-powered content generation for CorpBase website information using Azure OpenAI via Merck's NLP API. This feature automatically generates professional, SEO-optimized content for chemical products.

## Implementation Status

**COMPLETED** - All implementation tasks finished successfully

### What's Been Implemented

1. **Backend Services**
   - `azureOpenAIService.js` - Azure OpenAI API integration with error handling
   - `aiContentService.js` - Content generation orchestration
   - `POST /api/products/generate-corpbase-content` - API endpoint
   - Quota tracking and management
   - Graceful fallback to template-based generation

2. **Frontend Integration**
   - AI generation button in CreateTicket form
   - Real-time loading states and animations
   - Comprehensive error handling
   - Admin Dashboard configuration UI

3. **Admin Dashboard**
   - Complete AI Content Generation settings panel
   - Azure OpenAI API configuration (key, environment, model)
   - Quota tracking with visual progress bar
   - Editable AI prompts for each content type
   - Temperature and limit controls

## Features

### Generated Content Types

1. **Product Description** (200 words)
   - Professional technical overview
   - Key chemical properties
   - Applications and benefits
   - Quality highlights

2. **Website Title** (70 characters)
   - SEO-optimized
   - Includes brand name
   - Compelling for search engines

3. **Meta Description** (160 characters)
   - Brief, engaging summary
   - Highlights key benefits
   - Optimized for search snippets

4. **Key Features** (5 bullet points)
   - Quality specifications
   - Packaging availability
   - Application suitability
   - Support and reliability

5. **Applications** (4 items)
   - Specific research applications
   - Industry use cases
   - Scientific fields

6. **Target Industries** (4 items)
   - Primary market sectors
   - Research institutions
   - Manufacturing segments

### Prompt Template Variables

Available placeholders in prompts:
- `{productName}` - Product name
- `{casNumber}` - CAS registry number
- `{molecularFormula}` - Chemical formula
- `{molecularWeight}` - Molecular weight
- `{iupacName}` - IUPAC name
- `{sbu}` - Strategic Business Unit
- `{maxWords}` - Word limit
- `{maxChars}` - Character limit
- `{bulletCount}` - Number of bullets
- `{itemCount}` - Number of items

## Configuration

### System Settings (Admin Dashboard)

Navigate to: **Admin Dashboard → System Settings → AI Content Generation**

#### Azure OpenAI API Configuration

- **Enable/Disable**: Toggle AI content generation
- **API Key**: Secure input (encrypted in database)
- **Environment**: dev, test, staging, prod
- **Model/Deployment**: gpt-4o-mini (recommended), gpt-4o, gpt-5-mini
- **API Version**: 2024-10-21 (default)
- **Timeout**: 10-120 seconds (default: 30)

#### Quota Management

- **Total Quota**: Set your API request limit (default: 2000)
- **Used**: Automatically tracked (read-only)
- **Remaining**: Calculated display (read-only)
- **Progress Bar**: Visual quota usage indicator
  - Green: 0-70% used
  - Yellow: 70-90% used
  - Red: 90-100% used
- **Expiry Date**: API key expiration tracking
- **Endpoints**: Available API endpoints display

#### AI Prompt Templates

Each content type has:
- **Enable/Disable toggle**
- **Prompt Template**: Customizable prompt text
- **Limits**: Word/character counts
- **Temperature**: Creativity control (0-2)
  - 0 = Deterministic, consistent
  - 1 = Balanced
  - 2 = Very creative, varied

## API Configuration

### Required Setup

1. **Obtain Azure OpenAI API Key**
   - Request access from Merck IT
   - Receive API key for Merck's NLP API endpoint
   - Note quota and expiry date

2. **Configure in Admin Dashboard**
   ```
   Admin Dashboard → System Settings → AI Content Generation
   ```

3. **Set API Key and Environment**
   - Paste key in "API Key" field
   - Select environment (dev, test, staging, prod)
   - Choose model/deployment name (e.g., gpt-4o-mini)
   - Set quota and expiry date
   - Click "Save Settings"

4. **Verify Configuration**
   - Use Test Connection button in Admin Dashboard
   - Or run diagnostics: `./diagnostics/0-run-all-diagnostics.sh`

5. **Important**: Ensure you are connected to Merck VPN for API access

## Usage

### For Users (Product Managers)

1. **Create New Product Ticket**
   - Navigate to "Create Ticket"
   - Fill in product details (name, CAS, formula)
   - Scroll to "CorpBase Website Information" section

2. **Generate AI Content**
   - Click "Generate with AI" button
   - Wait 10-30 seconds (loading indicator shown)
   - Review generated content
   - Edit if needed

3. **Save Ticket**
   - AI-generated content is included in ticket
   - Marked as `aiGenerated: true`
   - Timestamp recorded

### For Administrators

1. **Monitor Quota Usage**
   - Check Admin Dashboard → AI Content Generation
   - View usage progress bar
   - Track remaining requests

2. **Customize Prompts**
   - Edit prompt templates for each content type
   - Adjust word/character limits
   - Fine-tune temperature settings
   - Test changes with new tickets

3. **Handle Quota Limits**
   - Update quota when renewed
   - Disable AI if quota exhausted
   - Fallback uses template generation

## API Endpoint

### POST /api/products/generate-corpbase-content

**Request Body:**
```json
{
  "productData": {
    "productName": "Ethanol",
    "casNumber": "64-17-5",
    "molecularFormula": "C2H6O",
    "molecularWeight": "46.07",
    "iupacName": "Ethanol",
    "sbu": "Life Science"
  },
  "fields": ["productDescription", "websiteTitle", "metaDescription"]
}
```

**Response:**
```json
{
  "success": true,
  "aiGenerated": true,
  "generatedAt": "2025-11-10T...",
  "content": {
    "productDescription": "Ethanol is a high-quality chemical compound...",
    "websiteTitle": "Ethanol | High-Quality Chemical | MilliporeSigma",
    "metaDescription": "Buy Ethanol (C2H6O) from MilliporeSigma...",
    "keyFeatures": "• High purity and consistent quality\n...",
    "applications": "Chemical synthesis\nLaboratory solvent\n...",
    "targetIndustries": "Pharmaceutical R&D, Biotechnology, ..."
  }
}
```

## Error Handling

### API Key Issues

**Error:** "AI content generation is not enabled"
- **Solution**: Enable Azure OpenAI in Admin Dashboard
- **Alternative**: Check API key is configured

**Error:** "Azure OpenAI API authentication failed"
- **Solution**: Verify API key is correct
- **Alternative**: Check key hasn't expired
- **VPN**: Ensure you're connected to Merck VPN

### Quota Exceeded

**Error:** "Azure OpenAI API rate limit exceeded"
- **Solution**: Wait for quota reset
- **Alternative**: Increase quota in settings
- **Fallback**: System uses template generation

### Timeout

**Error:** "Azure OpenAI API request timed out"
- **Solution**: Increase timeout in settings
- **Alternative**: Try again (temporary network issue)
- **VPN**: Check VPN connection stability

## Fallback Behavior

If AI generation fails:
1. System logs error
2. Automatically falls back to template-based generation
3. Returns `aiGenerated: false` in response
4. User sees notification: "Template-based content generated (AI not available)"
5. Content still populated, functionality maintained

## Testing

### Test Scripts

1. **Test API Connection**
   - Use Test Connection button in Admin Dashboard → System Settings → AI Content
   - Or run diagnostics: `./diagnostics/0-run-all-diagnostics.sh`
   - Or test Azure OpenAI: `node server/scripts/testAzureOpenAI.js`

### Manual Testing

1. Start application: `npm start`
2. Navigate to Create Ticket
3. Enter test product:
   - Name: Ethanol
   - CAS: 64-17-5
   - Formula: C2H6O
4. Click "Generate with AI"
5. Verify all fields populated
6. Check console for debug logs

## Security

### API Key Storage

- API key stored in MongoDB SystemSettings collection
- Displayed as password field in UI
- Only last 8 characters shown in debug logs
- Never exposed in client-side code
- Never logged in full

### Server-Side Only

- All AI API calls made server-side
- Client never has direct access to API key
- Prevents key exposure in browser
- Protects against client-side attacks

## Performance

### Response Times

- Typical: 10-30 seconds
- Depends on: Model, prompt complexity, API load
- Timeout: Configurable (default 30s)

### Optimization

- Cache settings for 5 minutes
- Batch content generation in single call
- Reuse temperature settings
- Limit max tokens to reduce cost

## Monitoring

### Quota Tracking

- Automatic usage increment per request
- Visual progress bar in dashboard
- Warning at 70% usage (yellow)
- Alert at 90% usage (red)
- Expiry date notifications

### Logging

All AI requests logged with:
- Timestamp
- Product name
- Fields generated
- Success/failure status
- Error messages (if any)

## Troubleshooting

### Common Issues

1. **"Invalid API Key"**
   - Verify key copied correctly
   - Check no extra spaces
   - Confirm key is active
   - Test with curl command

2. **"No content generated"**
   - Check VPN connection
   - Verify Azure OpenAI API status
   - Review error logs
   - Run diagnostics: `./diagnostics/0-run-all-diagnostics.sh`

3. **"Quota exceeded"**
   - Check usage in dashboard
   - Wait for quota reset
   - Consider upgrading plan
   - Use template fallback

4. **"Slow generation"**
   - Normal for complex prompts
   - Check network speed
   - Consider simpler prompts
   - Reduce max_tokens setting

## Future Enhancements

Potential improvements:
- [ ] Batch generation for multiple products
- [ ] Content quality scoring
- [ ] A/B testing different prompts
- [ ] Multi-language support
- [ ] Custom model fine-tuning
- [ ] Cost tracking per request
- [ ] Content versioning
- [ ] Approval workflow

## Support

For issues or questions:
1. Check this documentation
2. Review server logs: `server/logs/`
3. Test with scripts in `server/scripts/`
4. Contact system administrator

## References

- [Azure OpenAI Setup Guide](./AZURE_OPENAI_SETUP.md)
- [Azure OpenAI Models](./AZURE_OPENAI_MODELS.md)
- [API Key Storage Documentation](../security/API_KEY_STORAGE.md)
- [Diagnostics Guide](../../diagnostics/README.md)

---

**Last Updated:** 2025-11-10
**Version:** 1.0.0
**Status:** Production Ready (pending valid API key)
