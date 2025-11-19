# Quick Start Guide - Azure OpenAI Diagnostics

## For the Dev Environment

**YES, the environment IS included in the URL!**

For dev environment, the endpoint is:
```
https://api.nlp.dev.uptimize.merckgroup.com
```

For prod environment, it's:
```
https://api.nlp.prod.uptimize.merckgroup.com
```

## Run Diagnostics Now

### Step 1: Run All Tests

```bash
cd /home/ckabes/npdi-app/diagnostics
./0-run-all-diagnostics.sh
```

When prompted, select your environment:
- Enter `1` for **dev**
- Enter `2` for test
- Enter `3` for staging
- Enter `4` for prod (default)

### Step 2: View Results

The script will show results in real-time and save a full report to `./logs/`

### Step 3: Share Results

After the tests complete, you can share the log file:

```bash
# View the latest report
ls -lt diagnostics/logs/diagnostic_report_*.log | head -n 1

# Display the report
cat diagnostics/logs/diagnostic_report_*.log | less
```

## Individual Quick Tests

### Test DNS Only (Fastest)
```bash
./1-test-dns.sh
```

### Test Network Connectivity (for dev)
```bash
./2-test-network.sh dev
```

### Test API with Your Key (for dev)
```bash
export AZURE_OPENAI_API_KEY="your-key-here"
AZURE_OPENAI_ENV=dev ./3-test-api-curl.sh
```

## What to Look For

### If VPN is NOT Connected:
```
✗ Cannot resolve api.nlp.dev.uptimize.merckgroup.com
✗ ENOTFOUND
✗ No VPN interface found
```

**Action:** Connect to Merck VPN and try again

### If VPN IS Connected:
```
✓ Resolved to: 10.x.x.x
✓ Port is open and accepting connections
✓ VPN interface detected
```

**Action:** Proceed to API key testing

### If API Key is Wrong:
```
✗ Authentication failed (HTTP 401)
```

**Action:** Check your API key in Admin Dashboard

### If Environment/Model is Wrong:
```
✗ Endpoint not found (HTTP 404)
```

**Action:** Verify:
- Environment: dev, test, staging, or prod
- Model/deployment name (e.g., "gpt-4o-mini")
- API version (e.g., "2024-10-21")

## Testing from Admin Dashboard

After running diagnostics and fixing issues:

1. Navigate to: **Admin Dashboard → System Settings → AI Content Generation**
2. Configure:
   - Enable: ✓ Enable Azure OpenAI Content Generation
   - API Key: `your-key-here`
   - Environment: `dev` (or whichever environment works)
   - API Version: `2024-10-21`
   - Model: `gpt-4o-mini` (or your deployment name)
3. Click **"Save Settings"**
4. Click **"Test Connection"**
5. View results

## Need Help?

See full documentation: `./diagnostics/README.md`

Run comprehensive diagnostics: `./0-run-all-diagnostics.sh`

After running diagnostics, send the log file at:
```
diagnostics/logs/diagnostic_report_YYYYMMDD_HHMMSS.log
```
