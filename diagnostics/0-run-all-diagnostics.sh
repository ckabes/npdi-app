#!/bin/bash

# Comprehensive Azure OpenAI Diagnostics
# Runs all diagnostic tests and generates a complete report

echo "################################################################"
echo "#                                                              #"
echo "#     Azure OpenAI Connection Diagnostics - Full Suite        #"
echo "#                                                              #"
echo "################################################################"
echo ""

# Configuration
DIAGNOSTICS_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="${DIAGNOSTICS_DIR}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${LOG_DIR}/diagnostic_report_${TIMESTAMP}.log"

# Create logs directory
mkdir -p "$LOG_DIR"

# Ask for environment
echo "Which environment do you want to test?"
echo "  1) dev"
echo "  2) test"
echo "  3) staging"
echo "  4) prod (default)"
echo ""
read -p "Enter choice [1-4]: " ENV_CHOICE

case $ENV_CHOICE in
    1) ENV="dev" ;;
    2) ENV="test" ;;
    3) ENV="staging" ;;
    *) ENV="prod" ;;
esac

export AZURE_OPENAI_ENV="$ENV"

echo ""
echo "Testing environment: $ENV"
echo "Report will be saved to: $REPORT_FILE"
echo ""
echo "Starting diagnostics in 3 seconds..."
sleep 3
echo ""

# Start logging
{
    echo "################################################################"
    echo "# Azure OpenAI Diagnostic Report"
    echo "# Generated: $(date)"
    echo "# Environment: $ENV"
    echo "# Hostname: $(hostname)"
    echo "################################################################"
    echo ""

    # System Information
    echo "=== SYSTEM INFORMATION ==="
    echo ""
    echo "Operating System:"
    uname -a
    echo ""
    echo "WSL Version:"
    if [ -f /proc/version ]; then
        cat /proc/version
    fi
    echo ""
    echo "Network Interfaces:"
    ip addr show | grep -E "^[0-9]+:|inet " | head -n 20
    echo ""
    echo ""

    # Test 1: DNS Resolution
    echo "################################################################"
    echo "# TEST 1: DNS RESOLUTION"
    echo "################################################################"
    echo ""
    bash "${DIAGNOSTICS_DIR}/1-test-dns.sh"
    echo ""
    echo ""

    # Test 2: Network Connectivity
    echo "################################################################"
    echo "# TEST 2: NETWORK CONNECTIVITY"
    echo "################################################################"
    echo ""
    bash "${DIAGNOSTICS_DIR}/2-test-network.sh" "$ENV"
    echo ""
    echo ""

    # Test 3: API Test (with curl)
    echo "################################################################"
    echo "# TEST 3: API TEST (CURL)"
    echo "################################################################"
    echo ""

    # Check if API key is set
    if [ -z "$AZURE_OPENAI_API_KEY" ]; then
        echo "Note: AZURE_OPENAI_API_KEY not set"
        echo "The curl API test will prompt for the API key"
        echo "or you can skip it by pressing Ctrl+C"
        echo ""
        sleep 2
    fi

    bash "${DIAGNOSTICS_DIR}/3-test-api-curl.sh"
    echo ""
    echo ""

    # Summary
    echo "################################################################"
    echo "# DIAGNOSTIC SUMMARY"
    echo "################################################################"
    echo ""

    # Check key indicators
    ENDPOINT="api.nlp.${ENV}.uptimize.merckgroup.com"

    echo "Target Endpoint: $ENDPOINT"
    echo ""

    echo "Quick Checks:"
    echo ""

    # DNS Check
    echo -n "  [1] DNS Resolution:    "
    if nslookup "$ENDPOINT" > /dev/null 2>&1; then
        echo "✓ PASS"
    else
        echo "✗ FAIL - VPN Required!"
    fi

    # Connectivity Check
    echo -n "  [2] TCP Connection:    "
    if timeout 3 bash -c "echo > /dev/tcp/${ENDPOINT}/443" 2>/dev/null; then
        echo "✓ PASS"
    else
        echo "✗ FAIL"
    fi

    # VPN Check
    echo -n "  [3] VPN Interface:     "
    if ip addr 2>/dev/null | grep -qE "tun|tap|ppp"; then
        echo "✓ DETECTED"
    else
        echo "✗ NOT FOUND"
    fi

    echo ""
    echo "################################################################"
    echo ""

    echo "RECOMMENDATIONS:"
    echo ""

    # Provide recommendations based on results
    if ! nslookup "$ENDPOINT" > /dev/null 2>&1; then
        echo "  ⚠ DNS resolution failed"
        echo "    → Connect to Merck VPN"
        echo "    → Verify VPN connection: ip addr | grep tun"
        echo "    → Check DNS settings in /etc/resolv.conf"
        echo ""
    else
        echo "  ✓ DNS resolution working"
        echo ""
    fi

    if ! timeout 3 bash -c "echo > /dev/tcp/${ENDPOINT}/443" 2>/dev/null; then
        echo "  ⚠ Cannot connect to Azure OpenAI endpoint"
        echo "    → Verify VPN is connected"
        echo "    → Check firewall settings"
        echo "    → Test from different network"
        echo ""
    else
        echo "  ✓ Network connectivity working"
        echo ""
    fi

    if ! ip addr 2>/dev/null | grep -qE "tun|tap|ppp"; then
        echo "  ⚠ No VPN interface detected"
        echo "    → This is the most likely cause of connection issues"
        echo "    → Connect to Merck VPN and run diagnostics again"
        echo ""
    else
        echo "  ✓ VPN interface found"
        echo ""
    fi

    echo "################################################################"
    echo "# Report saved to: $REPORT_FILE"
    echo "################################################################"

} 2>&1 | tee "$REPORT_FILE"

echo ""
echo "Diagnostics complete!"
echo ""
echo "Report saved to:"
echo "  $REPORT_FILE"
echo ""
echo "To view the report:"
echo "  cat $REPORT_FILE"
echo ""
echo "To share with support:"
echo "  1. Review the report and remove any sensitive information"
echo "  2. Send the file: $REPORT_FILE"
echo ""
