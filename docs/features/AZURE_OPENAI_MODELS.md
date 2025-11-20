# Azure OpenAI Models Available at Merck

## Connection Confirmed Working

**Environment: dev**
- Endpoint: `https://api.nlp.dev.uptimize.merckgroup.com`
- Tested Model: `gpt-4o-mini`
- Status:  Yes Working (confirmed via diagnostics)

## Available Models (Dev & Prod)

### Chat Models (Recommended for Content Generation)

| Model Name | Region | Input/Output Tokens | Use Case |
|------------|--------|---------------------|----------|
| **gpt-4o-mini** | EU | 128k / 4k | **Recommended** - Fast, cost-effective |
| gpt-4o-mini-na | NA (US/Canada) | 128k / 4k | North America region |
| gpt-4o | EU | 128k / 4k | More capable, higher cost |
| gpt-4o-na | NA | 128k / 4k | North America region |
| gpt-4o-2024-11-20-gs | Global | 128k / 4k | Global Standard (multi-region) |
| gpt-41-gs | Global | 1M / 32k | Next-gen, larger context |
| gpt-41-mini-gs | Global | 1M / 32k | Next-gen, cost-effective |
| gpt-5 | EU | 272k / 128k | Latest model |
| gpt-5-mini | EU | 272k / 128k | Latest, cost-effective |

### Reasoning Models (o-series)

**Note:** NOT for batch processing, use for complex reasoning tasks

| Model Name | Region | Input/Output Tokens | Notes |
|------------|--------|---------------------|-------|
| o1-mini | EU | 128k / 65k | Reasoning model |
| o1-mini-na | NA | 128k / 65k | North America |
| o3-mini-gs | Global | 200k / 100k | Advanced reasoning |
| o4-mini-gs | Global | 200k / 100k | Latest reasoning |

For GPT-5 models, use `"reasoning_effort": "medium"` parameter if needed (default is "minimal").

### Embedding Models

| Model Name | Region | Tokens |
|------------|--------|--------|
| text-embedding-3-small | NA | 8k |
| text-embedding-3-large | EU | 8k |
| text-embedding-3-large-na | NA | 8k |
| text-embedding-ada-002-v2 | EU | 8k |

## Regional Considerations

- **EU models**: Data processed in Europe (GDPR compliant)
- **NA models** (-na suffix): Data processed in US/Canada
- **Global Standard** (-gs suffix): Data processed across multiple regions

**Important:** For data privacy, prefer EU or NA models over Global Standard for sensitive data.

## Pricing (per 1k tokens)

| Model | Prompt | Completion |
|-------|--------|------------|
| gpt-4o-mini | $0.000165 | $0.00066 |
| gpt-4o | $0.005 | $0.015 |
| gpt-5-mini | $0.000275 | $0.0022 |
| gpt-5 | $0.001375 | $0.011 |

## Rate Limits (Dev & Prod)

| Model | TPM | RPM |
|-------|-----|-----|
| gpt-4o-mini (EU) | 1M | 10k |
| gpt-4o-mini-na | 2M | 20k |
| gpt-4o (EU) | 200k | 1.2k |
| gpt-5 | 3M | 3k |

TPM = Tokens Per Minute, RPM = Requests Per Minute

## Default Quotas

- **GPT-4 models**: 1,000 calls per day (default)
- **Other models**: 10,000 calls per day (default)

To increase quota, email: gpt-api@merckgroup.com with:
- API token
- Expected daily calls
- End date

## Deprecated Models

**Do NOT use these** (deprecated or deprecating soon):
- gpt-35-turbo-16k
- gpt-35-turbo-0613
- gpt-35-turbo-1106

## Recommended Configuration for This App

For MilliporeSigma product content generation:

**Environment:** `dev` or `prod` (both work)

**Recommended Model:** `gpt-4o-mini`
- Fast response
- Cost-effective
- Sufficient quality for product descriptions
- EU region (data privacy)

**Alternative (Higher Quality):** `gpt-4o`
- Better quality output
- Higher cost
- Use if gpt-4o-mini quality is insufficient

**Alternative (Cost-Effective):** `gpt-5-mini`
- Latest generation
- Good balance of quality and cost
- Larger context window (272k tokens)

## Configuration in Admin Dashboard

1. Navigate to: **Admin Dashboard → System Settings → AI Content Generation**
2. Configure:
   - **Enable**:  Yes Enable Azure OpenAI Content Generation
   - **Environment**: `dev` (confirmed working)
   - **API Version**: `2024-10-21`
   - **Model/Deployment Name**: `gpt-4o-mini` (exact name)
   - **Max Tokens**: `2000` (default)
   - **Timeout**: `30` (seconds)
3. Click **"Save Settings"**
4. Click **"Test Connection"** to verify

## Support

- API issues: gpt-api@merckgroup.com
- SSL certificate issues: See AZURE_OPENAI_SETUP.md
- Certificate download: https://palantir.mcloud.merckgroup.com/workspace/preview-app/ri.blobster.main.certificate.ab5dc834-157d-46e0-9efc-b3757b973585
