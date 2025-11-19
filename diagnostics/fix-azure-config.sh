#!/bin/bash

# Quick fix for Azure OpenAI configuration
# Based on successful diagnostic test

echo "================================================================"
echo "Azure OpenAI Configuration Helper"
echo "================================================================"
echo ""
echo "Based on your diagnostic test, we confirmed that:"
echo "  ✓ Environment: dev"
echo "  ✓ Model: gpt-4o-mini"
echo "  ✓ Connection: SUCCESSFUL (HTTP 200)"
echo ""
echo "================================================================"
echo ""

cat << 'EOF'
CONFIGURATION INSTRUCTIONS:

1. Open your application Admin Dashboard:
   - Navigate to: Admin Dashboard → System Settings → AI Content Generation

2. Update the following settings:

   [✓] Enable Azure OpenAI Content Generation

   Environment: dev
   (Change from "prod" to "dev")

   API Version: 2024-10-21
   (Keep as is)

   Model/Deployment Name: gpt-4o-mini
   (Exact name from Merck's model list)

   Max Tokens: 2000
   (Default is fine)

   Timeout: 30
   (Default is fine)

3. Click "Save Settings"

4. Click "Test Connection"
   - You should see: ✓ Connection Successful

5. If Test Connection still fails:
   - Restart your Node.js application
   - Clear DNS cache: sudo systemd-resolve --flush-caches
   - Run diagnostics again: ./0-run-all-diagnostics.sh

================================================================
VERIFIED WORKING CONFIGURATION
================================================================

Based on diagnostic log: logs/diagnostic_report_20251111_103507.log

Endpoint URL:
  https://api.nlp.dev.uptimize.merckgroup.com

Full API Endpoint:
  https://api.nlp.dev.uptimize.merckgroup.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-10-21

Test Result:
  HTTP 200 - Connection successful
  IP: 75.2.0.186
  Response: "Connection successful."

================================================================
AVAILABLE MODELS (All environments: dev & prod)
================================================================

Recommended for content generation:
  • gpt-4o-mini      - Fast, cost-effective (RECOMMENDED)
  • gpt-4o           - Higher quality, more expensive
  • gpt-5-mini       - Latest generation, good balance
  • gpt-5            - Latest, highest quality

See full model list: AZURE_OPENAI_MODELS.md

================================================================
ALTERNATIVE: Direct Database Update (Advanced)
================================================================

If you prefer to update the database directly using MongoDB:

1. Connect to MongoDB:
   mongosh

2. Switch to your database:
   use npdi

3. Update the configuration:
   db.systemsettings.updateOne(
     {},
     {
       $set: {
         "integrations.langdock.enabled": true,
         "integrations.langdock.environment": "dev",
         "integrations.langdock.apiVersion": "2024-10-21",
         "integrations.langdock.model": "gpt-4o-mini",
         "integrations.langdock.maxTokens": 2000,
         "integrations.langdock.timeout": 30
       }
     }
   )

4. Verify the update:
   db.systemsettings.findOne({}, {"integrations.langdock": 1})

5. Restart your Node.js application

================================================================

After updating configuration, test with:
  cd /home/ckabes/npdi-app
  export AZURE_OPENAI_API_KEY="your-key-here"
  export AZURE_OPENAI_ENV=dev
  node server/scripts/testAzureOpenAI.js

================================================================
EOF

echo ""
echo "Configuration guide complete!"
echo ""
