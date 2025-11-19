#!/bin/bash

# Network Connectivity Test Script
# Tests network connectivity to Merck Azure OpenAI endpoints

echo "============================================================"
echo "Network Connectivity Test for Azure OpenAI"
echo "============================================================"
echo ""

# Configuration
ENV="${1:-prod}"
BASE_DOMAIN="api.nlp"
FULL_DOMAIN="uptimize.merckgroup.com"
ENDPOINT="${BASE_DOMAIN}.${ENV}.${FULL_DOMAIN}"
HTTPS_PORT=443

echo "Testing endpoint: $ENDPOINT"
echo "Date: $(date)"
echo ""

# Check if endpoint resolves
echo "--- DNS Resolution Check ---"
echo -n "Resolving $ENDPOINT... "
if IP=$(nslookup $ENDPOINT 2>/dev/null | grep -A1 "Name:" | tail -n1 | awk '{print $2}'); then
    if [ ! -z "$IP" ]; then
        echo "✓ Resolved to: $IP"
    else
        echo "✗ Failed to resolve"
        echo ""
        echo "ERROR: Cannot resolve hostname. VPN connection required!"
        echo ""
        echo "Next steps:"
        echo "  1. Connect to Merck VPN"
        echo "  2. Verify VPN is active: ip addr | grep tun"
        echo "  3. Run this script again"
        exit 1
    fi
else
    echo "✗ Failed to resolve"
    echo ""
    echo "ERROR: DNS resolution failed. VPN may not be connected."
    exit 1
fi

echo ""
echo "--- ICMP Ping Test ---"
echo -n "Pinging $ENDPOINT... "
if ping -c 3 -W 2 $ENDPOINT > /dev/null 2>&1; then
    echo "✓ Host is reachable"
    ping -c 3 $ENDPOINT 2>&1 | tail -n 2
else
    echo "✗ Host unreachable or ICMP blocked (this may be normal)"
    echo "  Note: Many servers block ICMP, so this failure is not critical"
fi

echo ""
echo "--- TCP Port Test (HTTPS - Port 443) ---"
echo -n "Testing TCP connection to $ENDPOINT:$HTTPS_PORT... "

# Test with nc (netcat)
if command -v nc > /dev/null 2>&1; then
    if timeout 5 nc -zv $ENDPOINT $HTTPS_PORT 2>&1 | grep -q "succeeded\|open"; then
        echo "✓ Port is open and accepting connections"
    else
        echo "✗ Cannot connect to port $HTTPS_PORT"
        echo "  This indicates a network/firewall issue"
    fi
elif command -v telnet > /dev/null 2>&1; then
    # Fallback to telnet
    if timeout 5 bash -c "echo quit | telnet $ENDPOINT $HTTPS_PORT" 2>&1 | grep -q "Connected\|Escape"; then
        echo "✓ Port is open and accepting connections"
    else
        echo "✗ Cannot connect to port $HTTPS_PORT"
    fi
else
    echo "⊘ nc/telnet not available, cannot test port"
fi

echo ""
echo "--- Traceroute Test ---"
echo "Tracing route to $ENDPOINT (first 10 hops)..."
if command -v traceroute > /dev/null 2>&1; then
    traceroute -m 10 -w 2 $ENDPOINT 2>&1 | head -n 12
elif command -v tracepath > /dev/null 2>&1; then
    tracepath -m 10 $ENDPOINT 2>&1 | head -n 12
else
    echo "⊘ traceroute not available"
fi

echo ""
echo "--- Curl Connection Test ---"
echo "Testing HTTPS connection with curl..."

# Build test URL
TEST_URL="https://${ENDPOINT}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-10-21"

echo "URL: $TEST_URL"
echo ""

# Test with curl
if command -v curl > /dev/null 2>&1; then
    echo "Testing connection (no auth)..."
    CURL_OUTPUT=$(curl -v -X POST "$TEST_URL" \
        -H "Content-Type: application/json" \
        -H "api-key: test" \
        -d '{"messages":[{"role":"user","content":"test"}]}' \
        --connect-timeout 10 \
        --max-time 15 \
        2>&1)

    CURL_EXIT=$?

    echo "$CURL_OUTPUT" | head -n 30
    echo ""

    if echo "$CURL_OUTPUT" | grep -q "Connected to"; then
        echo "✓ Successfully connected to server"
    else
        echo "✗ Failed to connect"
    fi

    if echo "$CURL_OUTPUT" | grep -q "SSL connection"; then
        echo "✓ SSL/TLS handshake successful"
    fi

    if echo "$CURL_OUTPUT" | grep -q "401\|Unauthorized"; then
        echo "✓ Server responded (authentication required - this is expected)"
    elif echo "$CURL_OUTPUT" | grep -q "404"; then
        echo "⚠ 404 Not Found - Check model/deployment name"
    elif echo "$CURL_OUTPUT" | grep -q "200\|201"; then
        echo "✓ Server responded successfully"
    fi

    if [ $CURL_EXIT -eq 6 ]; then
        echo "✗ Could not resolve host"
    elif [ $CURL_EXIT -eq 7 ]; then
        echo "✗ Failed to connect to host"
    elif [ $CURL_EXIT -eq 28 ]; then
        echo "✗ Connection timeout"
    fi
else
    echo "⊘ curl not available"
fi

echo ""
echo "--- VPN Status Check ---"
echo "Checking for VPN interfaces..."
if ip addr 2>/dev/null | grep -E "tun|tap|ppp" > /dev/null; then
    echo "✓ VPN interface detected:"
    ip addr 2>/dev/null | grep -E "tun|tap|ppp" -A 5
else
    echo "✗ No VPN interface found"
    echo "  VPN may not be connected!"
fi

echo ""
echo "============================================================"
echo "Network Test Complete"
echo "============================================================"
echo ""
echo "SUMMARY:"
if [ ! -z "$IP" ]; then
    echo "  • DNS Resolution: ✓ Working"
else
    echo "  • DNS Resolution: ✗ Failed - VPN REQUIRED"
fi
echo ""
echo "If DNS resolution failed:"
echo "  1. Connect to Merck VPN"
echo "  2. Verify VPN: ip addr show | grep tun"
echo "  3. Test again"
echo ""
echo "If DNS works but connection fails:"
echo "  1. Check firewall settings"
echo "  2. Verify you have network access to Azure OpenAI"
echo "  3. Contact IT support"
echo ""
