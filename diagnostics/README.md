# Azure OpenAI Connection Diagnostics

This directory contains diagnostic scripts to troubleshoot Azure OpenAI API connectivity issues.

## Quick Start

### Run All Diagnostics (Recommended)

```bash
cd diagnostics
chmod +x *.sh
./0-run-all-diagnostics.sh
```

This will run all tests and generate a comprehensive report.

## Individual Test Scripts

### 1. DNS Resolution Test (`1-test-dns.sh`)

Tests DNS resolution for Azure OpenAI endpoints.

```bash
./1-test-dns.sh
```

**What it tests:**
- External DNS resolution (to verify DNS is working)
- Merck Azure OpenAI endpoint resolution for all environments
- DNS server configuration
- Network configuration

**Expected results:**
-  Yes If VPN is connected: All Merck endpoints should resolve
-  No If VPN is NOT connected: Merck endpoints will fail to resolve

---

### 2. Network Connectivity Test (`2-test-network.sh`)

Tests network connectivity to Azure OpenAI endpoints.

```bash
# Test production environment (default)
./2-test-network.sh

# Test specific environment
./2-test-network.sh dev
./2-test-network.sh test
./2-test-network.sh staging
./2-test-network.sh prod
```

**What it tests:**
- DNS resolution
- ICMP ping (may be blocked - not critical)
- TCP port 443 connectivity
- Network route tracing
- HTTPS connection with curl
- VPN interface detection

**Expected results:**
- DNS resolution:  Yes (requires VPN)
- TCP port 443:  Yes (requires VPN)
- VPN interface:  Yes (should detect tun/tap interface)

---

### 3. API Test with curl (`3-test-api-curl.sh`)

Tests the actual Azure OpenAI API with authentication.

```bash
# Set API key first
export AZURE_OPENAI_API_KEY="your-key-here"

# Run test (defaults to prod environment)
./3-test-api-curl.sh

# Or specify environment inline
AZURE_OPENAI_ENV=dev ./3-test-api-curl.sh
```

**What it tests:**
- Full HTTPS connection
- API authentication
- API request/response
- SSL/TLS handshake

**Expected results:**
- HTTP 200:  Yes Success - API is working
- HTTP 401: Authentication failed (check API key)
- HTTP 404: Endpoint not found (check model/environment)
- Connection error: VPN or network issue

**Configuration via environment variables:**
```bash
export AZURE_OPENAI_API_KEY="your-key-here"
export AZURE_OPENAI_ENV="prod"              # dev, test, staging, prod
export AZURE_OPENAI_MODEL="gpt-4o-mini"     # deployment name
export AZURE_OPENAI_API_VERSION="2024-10-21"
```

---

## Interpreting Results

### DNS Resolution Failed (ENOTFOUND)
```
 No Cannot resolve api.nlp.prod.uptimize.merckgroup.com
```

**Cause:** VPN is not connected

**Solution:**
1. Connect to Merck VPN
2. Verify VPN connection: `ip addr show | grep tun`
3. Run diagnostics again

---

### Connection Refused (ECONNREFUSED)
```
 No Connection refused on port 443
```

**Cause:** Firewall blocking, or service is down

**Solution:**
1. Verify VPN is connected
2. Check firewall settings
3. Try a different environment (dev, test, staging, prod)
4. Contact IT support

---

### Authentication Failed (HTTP 401)
```
 No Authentication failed (HTTP 401)
```

**Cause:** Invalid or expired API key

**Solution:**
1. Verify API key is correct
2. Check if API key has expired
3. Request a new API key if needed

---

### Endpoint Not Found (HTTP 404)
```
 No Endpoint not found (HTTP 404)
```

**Cause:** Wrong model/deployment name or environment

**Solution:**
1. Verify the model/deployment name (e.g., "gpt-4o-mini")
2. Check the environment (dev, test, staging, prod)
3. Verify the API version is correct
4. Contact Azure OpenAI admin for available deployments

---

## Environment Configuration

The scripts support testing different environments:

- **dev**: Development environment
  - Endpoint: `api.nlp.dev.uptimize.merckgroup.com`
- **test**: Test environment
  - Endpoint: `api.nlp.test.uptimize.merckgroup.com`
- **staging**: Staging environment
  - Endpoint: `api.nlp.staging.uptimize.merckgroup.com`
- **prod**: Production environment (default)
  - Endpoint: `api.nlp.prod.uptimize.merckgroup.com`

**Yes, the environment IS included in the endpoint URL!**

The URL pattern is:
```
https://api.nlp.{environment}.uptimize.merckgroup.com/openai/deployments/{model}/chat/completions
```

## Log Files

Diagnostic logs are saved to `./logs/` directory:

```
diagnostics/logs/
├── diagnostic_report_20250111_143022.log    # Full diagnostic report
├── api_request_20250111_143045.log          # API request logs
├── api_response_20250111_143045.json        # API response (JSON)
└── api_full_20250111_143045.log             # Full curl verbose output
```

## Node.js Test Script

For testing within the Node.js application:

```bash
cd /home/ckabes/npdi-app

# Set configuration
export AZURE_OPENAI_API_KEY="your-key-here"
export AZURE_OPENAI_ENV="prod"
export AZURE_OPENAI_MODEL="gpt-4o-mini"

# Run test
node server/scripts/testAzureOpenAI.js
```

## Common Issues and Solutions

### Issue: "ENOTFOUND" error
**Solution:** Connect to Merck VPN

### Issue: "ECONNREFUSED" error
**Solution:** Check firewall, verify VPN is properly configured

### Issue: "401 Unauthorized"
**Solution:** Check API key, verify permissions

### Issue: "404 Not Found"
**Solution:** Verify model/deployment name and environment

### Issue: Scripts won't run
**Solution:** Make scripts executable:
```bash
chmod +x *.sh
```

## VPN Connection Verification

To verify VPN is connected:

```bash
# Check for VPN interface
ip addr show | grep -E "tun|tap|ppp"

# Test DNS resolution
nslookup api.nlp.prod.uptimize.merckgroup.com

# Test connectivity
curl -v https://api.nlp.prod.uptimize.merckgroup.com 2>&1 | grep "Connected to"
```

## Support

If diagnostics fail after:
1. Confirming VPN is connected
2. Verifying API key is correct
3. Testing multiple environments

Contact:
- IT Support for VPN/network issues
- Azure OpenAI admin for API access issues

## Cleanup

To remove old log files:

```bash
cd diagnostics/logs
rm *.log *.json
```
