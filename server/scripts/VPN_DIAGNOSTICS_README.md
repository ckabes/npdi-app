# VPN Connectivity Diagnostic Tools

## Purpose

These diagnostic scripts help identify network connectivity issues when using Claude Code while connected to a corporate VPN. They test various aspects of network connectivity to pinpoint where connections are being blocked.

## Available Scripts

### 1. Bash Version (`diagnoseVPN.sh`)
**Best for:** Quick diagnostics with detailed system-level information

**Run with:**
```bash
bash server/scripts/diagnoseVPN.sh
```

**Requirements:**
- Linux/macOS/WSL
- Standard networking tools (curl, openssl, ping, ip/ifconfig)

### 2. Node.js Version (`diagnoseVPN.js`)
**Best for:** Cross-platform testing, doesn't require admin privileges

**Run with:**
```bash
node server/scripts/diagnoseVPN.js
```

**Requirements:**
- Node.js (already installed)
- No additional dependencies

## What Gets Tested

Both scripts test the following:

### 1. **DNS Resolution**
- Tests if `api.anthropic.com` and other Anthropic domains can be resolved
- **Common Issue:** Corporate DNS blocking external domains
- **Symptom:** "DNS lookup failed" or "ENOTFOUND"

### 2. **HTTPS Connectivity**
- Tests if HTTPS connections to Claude API endpoints succeed
- **Common Issue:** Firewall blocking outbound HTTPS
- **Symptom:** "Connection refused" or "ETIMEDOUT"

### 3. **SSL Certificate Validation**
- Checks if SSL certificates are valid and trusted
- **Common Issue:** Corporate SSL inspection (MITM proxy)
- **Symptom:** "Certificate validation failed" or "UNABLE_TO_VERIFY_LEAF_SIGNATURE"

### 4. **Proxy Configuration**
- Detects proxy environment variables
- **Common Issue:** Proxy intercepting/blocking API calls
- **Symptom:** Claude Code hangs or times out

### 5. **Port Connectivity**
- Tests if specific ports (443, 80, 8080) are accessible
- **Common Issue:** Firewall blocking outbound ports
- **Symptom:** "Connection refused"

### 6. **Network Latency**
- Measures response time to Claude API
- **Common Issue:** VPN adding excessive latency
- **Symptom:** Slow responses or timeouts

### 7. **VPN Interface Detection**
- Checks if VPN interface (tun/tap/ppp) is active
- **Common Issue:** Not actually connected to VPN
- **Symptom:** Tests pass but Claude Code still fails

## Interpreting Results

### ✅ PASS - Test succeeded
The component is working correctly.

### ❌ FAIL - Test failed
This component is blocking Claude Code. See recommendations below.

### ⚠️  WARN - Potential issue
May not be blocking, but could cause problems.

## Common Issues and Solutions

### Issue 1: SSL Certificate Validation Failed
```
[FAIL] SSL Certificate Validation
    Error: UNABLE_TO_VERIFY_LEAF_SIGNATURE - Corporate SSL inspection likely active
```

**What it means:** Your company's firewall is intercepting HTTPS connections and replacing certificates (Man-in-the-Middle inspection).

**Solutions:**
1. **Request IT to whitelist Claude Code domains:**
   - `*.anthropic.com`
   - `api.anthropic.com`
   - `console.anthropic.com`

2. **Use split-tunnel VPN:**
   - Configure VPN to bypass `*.anthropic.com` domains
   - This allows direct internet access for Claude Code

3. **Certificate trust workaround** (last resort):
   - Install corporate root certificate
   - May require additional configuration

### Issue 2: DNS Resolution Failed
```
[FAIL] DNS: api.anthropic.com
    Failed to resolve DNS
```

**What it means:** VPN DNS servers cannot or will not resolve Anthropic domains.

**Solutions:**
1. **Request DNS exception from IT:**
   - Add `*.anthropic.com` to allowed DNS queries

2. **Use public DNS as fallback:**
   - Configure VPN to allow fallback to 8.8.8.8 or 1.1.1.1

3. **Modify hosts file** (temporary):
   ```bash
   # Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
   160.79.104.106 api.anthropic.com
   ```
   ⚠️ IP addresses may change - not recommended for production

### Issue 3: Port 443 Blocked
```
[FAIL] Port 443
    Port is blocked or unreachable
```

**What it means:** Firewall is blocking outbound HTTPS traffic.

**Solutions:**
1. **Request firewall rule from IT:**
   - Allow outbound TCP port 443 to `api.anthropic.com`
   - Whitelist IP range if needed

2. **Check VPN configuration:**
   - Ensure split-tunnel allows port 443
   - Verify no local firewall blocking

### Issue 4: Proxy Configuration Detected
```
[WARN] Proxy Configuration
    Proxy environment variables detected - may affect Claude Code
```

**What it means:** System is configured to use a proxy server.

**Solutions:**
1. **Configure Claude Code to use proxy:**
   ```bash
   # Set in environment
   export HTTPS_PROXY=http://proxy.company.com:8080
   export NO_PROXY=localhost,127.0.0.1
   ```

2. **Bypass proxy for Claude Code:**
   ```bash
   # Add to .bashrc or .zshrc
   export NO_PROXY="$NO_PROXY,*.anthropic.com"
   ```

3. **Request proxy whitelist:**
   - Ask IT to whitelist `*.anthropic.com` in proxy

### Issue 5: All Tests Pass But Claude Code Still Fails
```
✅ All tests passed - network connectivity looks good
```

**What it means:** Network connectivity is fine, but Claude Code is still blocked at application level.

**Possible Causes:**
1. **Deep Packet Inspection (DPI):**
   - Firewall analyzing encrypted traffic patterns
   - Solution: Request IT to exempt Claude Code traffic

2. **Application-level blocking:**
   - Security software blocking Claude Code binary
   - Solution: Whitelist Claude Code in antivirus/EDR

3. **Rate limiting:**
   - Corporate firewall limiting API request rates
   - Solution: Request higher rate limits for `api.anthropic.com`

4. **WebSocket blocking:**
   - Some features require WebSocket connections
   - Solution: Ensure WebSocket (ws://, wss://) isn't blocked

## Next Steps After Running Diagnostics

### If Tests Fail:

1. **Save the report:**
   ```bash
   # Report is automatically saved as:
   # VPN_DIAGNOSTIC_REPORT_YYYYMMDD_HHMMSS.txt
   ```

2. **Share with IT team:**
   - Include the full diagnostic report
   - Highlight specific failed tests
   - Request whitelisting for Claude Code

3. **Request specific changes:**
   - Use the "Common Issues and Solutions" section above
   - Be specific about what needs to be whitelisted

4. **Test after changes:**
   - Re-run diagnostics after IT makes changes
   - Verify all tests pass before trying Claude Code

### If Tests Pass But Claude Code Still Fails:

1. **Check Claude Code logs:**
   ```bash
   # Look for errors in Claude Code output
   # Check VS Code developer console (Help > Toggle Developer Tools)
   ```

2. **Verify API key:**
   - Ensure valid Anthropic API key is configured
   - Check key hasn't expired or been revoked

3. **Try different network:**
   - Disconnect from VPN temporarily
   - Test on home network or mobile hotspot
   - This confirms if VPN is the issue

4. **Contact Anthropic support:**
   - If tests pass and API key is valid
   - May be an issue with Claude Code itself

## IT Team Information

When requesting changes from your IT team, provide:

### Required Whitelists:

**Domains:**
- `api.anthropic.com`
- `console.anthropic.com`
- `*.anthropic.com` (wildcard for all subdomains)

**Ports:**
- Outbound TCP 443 (HTTPS)
- Outbound TCP 80 (HTTP, for redirects)

**Protocols:**
- HTTPS/TLS
- WebSocket (wss://)

**IP Ranges** (if domain whitelisting isn't possible):
- Check current IPs: `nslookup api.anthropic.com`
- Note: IPs may change, domain whitelisting is preferred

### Security Considerations:

- Claude Code connects to Anthropic's secure API
- All traffic is encrypted with TLS 1.2+
- No local server component required
- Read-only access to code (for analysis)
- API key required for authentication

## Troubleshooting Tips

### "Permission denied" errors
```bash
# Use sudo for bash script (if needed)
sudo bash server/scripts/diagnoseVPN.sh

# Or use Node.js version (no sudo needed)
node server/scripts/diagnoseVPN.js
```

### "Command not found" errors
```bash
# Install missing tools (Ubuntu/Debian)
sudo apt-get install curl openssl iputils-ping iproute2

# Install on macOS
brew install curl openssl
```

### Script hangs or takes too long
- Tests have timeouts (10 seconds for most tests)
- If hanging, indicates severe connectivity issues
- Press Ctrl+C to cancel and review partial output

## Additional Resources

- **Claude Code Documentation:** https://docs.anthropic.com/claude/docs
- **Anthropic Status Page:** https://status.anthropic.com
- **VPN Troubleshooting:** Contact your IT helpdesk

## Report a Bug

If these scripts don't work correctly or you have suggestions:
1. Check that you're using the latest version
2. Note the error message
3. Share diagnostic output with your development team

---

*Last Updated: November 2025*
*Maintained by: NPDI Application Team*
