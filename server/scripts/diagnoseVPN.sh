#!/bin/bash

###############################################################################
# Claude Code VPN Connectivity Diagnostic Script
#
# Purpose: Diagnose network connectivity issues when connected to VPN
# Usage: bash server/scripts/diagnoseVPN.sh
#
# This script tests:
# - DNS resolution for Anthropic domains
# - HTTPS connectivity to Claude API endpoints
# - Certificate validation
# - Proxy configuration
# - Firewall rules
# - Network latency
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# Report file
REPORT_FILE="VPN_DIAGNOSTIC_REPORT_$(date +%Y%m%d_%H%M%S).txt"

echo "================================================================================"
echo "Claude Code VPN Connectivity Diagnostic"
echo "================================================================================"
echo ""
echo "Date: $(date)"
echo "User: $(whoami)"
echo "Host: $(hostname)"
echo ""

# Function to log results
log_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"

    echo "[$status] $test_name" | tee -a "$REPORT_FILE"
    if [ -n "$details" ]; then
        echo "    $details" | tee -a "$REPORT_FILE"
    fi
    echo "" | tee -a "$REPORT_FILE"

    if [ "$status" = "PASS" ]; then
        ((PASSED++))
    elif [ "$status" = "FAIL" ]; then
        ((FAILED++))
    else
        ((WARNINGS++))
    fi
}

echo "================================================================================"
echo "1. NETWORK INTERFACE CHECK"
echo "================================================================================"
echo ""

# Check active network interfaces
echo "Active network interfaces:" | tee -a "$REPORT_FILE"
ip addr show | grep -E "^[0-9]+:|inet " | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Check VPN interface
if ip addr show | grep -qE "tun|tap|ppp|vpn"; then
    log_result "VPN Interface Detection" "PASS" "VPN interface detected"
    echo "VPN Interfaces:" | tee -a "$REPORT_FILE"
    ip addr show | grep -E "tun|tap|ppp|vpn" -A 5 | tee -a "$REPORT_FILE"
else
    log_result "VPN Interface Detection" "WARN" "No VPN interface detected - are you connected to VPN?"
fi

echo "================================================================================"
echo "2. DNS RESOLUTION TEST"
echo "================================================================================"
echo ""

# Test DNS resolution for Anthropic domains
DOMAINS=(
    "api.anthropic.com"
    "console.anthropic.com"
    "www.anthropic.com"
)

for domain in "${DOMAINS[@]}"; do
    echo "Testing DNS resolution for $domain..." | tee -a "$REPORT_FILE"

    if nslookup "$domain" >/dev/null 2>&1; then
        ip=$(nslookup "$domain" | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
        log_result "DNS: $domain" "PASS" "Resolved to: $ip"
    else
        log_result "DNS: $domain" "FAIL" "Failed to resolve DNS"
    fi
done

# Check current DNS servers
echo "Current DNS Configuration:" | tee -a "$REPORT_FILE"
if [ -f /etc/resolv.conf ]; then
    grep "nameserver" /etc/resolv.conf | tee -a "$REPORT_FILE"
else
    echo "Cannot read /etc/resolv.conf" | tee -a "$REPORT_FILE"
fi
echo "" | tee -a "$REPORT_FILE"

echo "================================================================================"
echo "3. HTTPS CONNECTIVITY TEST"
echo "================================================================================"
echo ""

# Test HTTPS connectivity to Anthropic API
API_ENDPOINTS=(
    "https://api.anthropic.com"
    "https://console.anthropic.com"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    echo "Testing HTTPS connectivity to $endpoint..." | tee -a "$REPORT_FILE"

    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$endpoint" 2>&1)

    if [ "$response" = "000" ]; then
        log_result "HTTPS: $endpoint" "FAIL" "Connection refused or timeout"
    elif [ "$response" -ge 200 ] && [ "$response" -lt 500 ]; then
        log_result "HTTPS: $endpoint" "PASS" "HTTP Status: $response"
    else
        log_result "HTTPS: $endpoint" "WARN" "HTTP Status: $response (unexpected)"
    fi
done

echo "================================================================================"
echo "4. SSL/TLS CERTIFICATE VALIDATION"
echo "================================================================================"
echo ""

# Test SSL certificate validation
echo "Testing SSL certificate for api.anthropic.com..." | tee -a "$REPORT_FILE"

if timeout 10 openssl s_client -connect api.anthropic.com:443 -servername api.anthropic.com </dev/null 2>&1 | grep -q "Verify return code: 0"; then
    log_result "SSL Certificate Validation" "PASS" "Certificate is valid"

    # Show certificate details
    echo "Certificate Details:" | tee -a "$REPORT_FILE"
    timeout 10 openssl s_client -connect api.anthropic.com:443 -servername api.anthropic.com </dev/null 2>&1 | grep -E "subject=|issuer=|verify return" | tee -a "$REPORT_FILE"
else
    log_result "SSL Certificate Validation" "FAIL" "Certificate validation failed - possible SSL inspection by corporate firewall"

    # Show error details
    timeout 10 openssl s_client -connect api.anthropic.com:443 -servername api.anthropic.com </dev/null 2>&1 | grep "verify return" | tee -a "$REPORT_FILE"
fi

echo ""

echo "================================================================================"
echo "5. PROXY CONFIGURATION CHECK"
echo "================================================================================"
echo ""

# Check proxy environment variables
echo "Checking proxy environment variables..." | tee -a "$REPORT_FILE"

proxy_vars=("HTTP_PROXY" "HTTPS_PROXY" "http_proxy" "https_proxy" "NO_PROXY" "no_proxy")
proxy_found=false

for var in "${proxy_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo "$var = ${!var}" | tee -a "$REPORT_FILE"
        proxy_found=true
    fi
done

if [ "$proxy_found" = true ]; then
    log_result "Proxy Configuration" "WARN" "Proxy environment variables detected - may affect Claude Code"
else
    log_result "Proxy Configuration" "PASS" "No proxy environment variables set"
fi

echo ""

echo "================================================================================"
echo "6. PORT CONNECTIVITY TEST"
echo "================================================================================"
echo ""

# Test common ports used by Claude Code
PORTS=(
    "443"   # HTTPS
    "80"    # HTTP
    "8080"  # Alternative HTTP
)

for port in "${PORTS[@]}"; do
    echo "Testing port $port connectivity to api.anthropic.com..." | tee -a "$REPORT_FILE"

    if timeout 5 bash -c "cat < /dev/null > /dev/tcp/api.anthropic.com/$port" 2>/dev/null; then
        log_result "Port $port" "PASS" "Port is open and accessible"
    else
        log_result "Port $port" "FAIL" "Port is blocked or unreachable"
    fi
done

echo "================================================================================"
echo "7. NETWORK LATENCY TEST"
echo "================================================================================"
echo ""

# Test latency to Anthropic API
echo "Testing network latency to api.anthropic.com..." | tee -a "$REPORT_FILE"

if ping -c 4 api.anthropic.com >/dev/null 2>&1; then
    avg_latency=$(ping -c 4 api.anthropic.com | tail -1 | awk -F'/' '{print $5}')

    if [ -n "$avg_latency" ]; then
        log_result "Network Latency" "PASS" "Average latency: ${avg_latency}ms"
    else
        log_result "Network Latency" "WARN" "Could not calculate latency"
    fi
else
    log_result "Network Latency" "FAIL" "ICMP (ping) blocked or host unreachable"
fi

echo "================================================================================"
echo "8. ROUTING TABLE CHECK"
echo "================================================================================"
echo ""

echo "Current routing table:" | tee -a "$REPORT_FILE"
ip route | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Check default gateway
default_gateway=$(ip route | grep default | awk '{print $3}')
if [ -n "$default_gateway" ]; then
    log_result "Default Gateway" "PASS" "Gateway: $default_gateway"
else
    log_result "Default Gateway" "FAIL" "No default gateway found"
fi

echo "================================================================================"
echo "9. FIREWALL RULES CHECK"
echo "================================================================================"
echo ""

# Check if iptables/ufw are active
echo "Checking firewall status..." | tee -a "$REPORT_FILE"

if command -v ufw &> /dev/null; then
    ufw_status=$(sudo ufw status 2>/dev/null || echo "Permission denied")
    echo "UFW Status: $ufw_status" | tee -a "$REPORT_FILE"
fi

if command -v iptables &> /dev/null; then
    iptable_count=$(sudo iptables -L -n 2>/dev/null | grep -c "^Chain" || echo "0")
    echo "IPTables Rules: $iptable_count chains found" | tee -a "$REPORT_FILE"
fi

echo "" | tee -a "$REPORT_FILE"

echo "================================================================================"
echo "10. CURL DETAILED TEST"
echo "================================================================================"
echo ""

# Detailed curl test with verbose output
echo "Performing detailed HTTPS request to Claude API..." | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

curl -v --connect-timeout 10 https://api.anthropic.com 2>&1 | tee -a "$REPORT_FILE"

echo ""
echo "================================================================================"
echo "SUMMARY"
echo "================================================================================"
echo ""

echo "Test Results:" | tee -a "$REPORT_FILE"
echo "  Passed:   $PASSED" | tee -a "$REPORT_FILE"
echo "  Failed:   $FAILED" | tee -a "$REPORT_FILE"
echo "  Warnings: $WARNINGS" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}⚠️  CONNECTION ISSUES DETECTED${NC}" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"
    echo "Common VPN Issues and Solutions:" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"
    echo "1. SSL Certificate Validation Failed:" | tee -a "$REPORT_FILE"
    echo "   - Corporate firewall may be performing SSL inspection" | tee -a "$REPORT_FILE"
    echo "   - Solution: Contact IT to whitelist *.anthropic.com domains" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"
    echo "2. DNS Resolution Failed:" | tee -a "$REPORT_FILE"
    echo "   - VPN DNS may be blocking external domains" | tee -a "$REPORT_FILE"
    echo "   - Solution: Use split-tunnel VPN or add DNS exceptions" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"
    echo "3. Port 443 Blocked:" | tee -a "$REPORT_FILE"
    echo "   - Outbound HTTPS may be restricted" | tee -a "$REPORT_FILE"
    echo "   - Solution: Request firewall exception for api.anthropic.com:443" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"
    echo "4. Proxy Configuration:" | tee -a "$REPORT_FILE"
    echo "   - Corporate proxy may be interfering" | tee -a "$REPORT_FILE"
    echo "   - Solution: Configure Claude Code to use proxy or bypass it" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"
else
    echo -e "${GREEN}✅ All tests passed - network connectivity looks good${NC}" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"
    echo "If Claude Code still doesn't work, the issue may be:" | tee -a "$REPORT_FILE"
    echo "- Application-level blocking (DPI/Deep Packet Inspection)" | tee -a "$REPORT_FILE"
    echo "- API key issues" | tee -a "$REPORT_FILE"
    echo "- Claude Code version compatibility" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"
fi

echo "================================================================================"
echo "Full diagnostic report saved to: $REPORT_FILE"
echo "================================================================================"
echo ""

echo "Next Steps:" | tee -a "$REPORT_FILE"
echo "1. Review the detailed report above" | tee -a "$REPORT_FILE"
echo "2. Share $REPORT_FILE with your IT team if firewall changes are needed" | tee -a "$REPORT_FILE"
echo "3. Try Claude Code again after addressing any failed tests" | tee -a "$REPORT_FILE"
echo "4. If issues persist, check Claude Code logs for additional errors" | tee -a "$REPORT_FILE"
echo ""

exit $FAILED
