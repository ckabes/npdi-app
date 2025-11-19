#!/bin/bash

# DNS Resolution Test Script
# Tests DNS resolution for Merck Azure OpenAI endpoints

echo "============================================================"
echo "DNS Resolution Test for Azure OpenAI"
echo "============================================================"
echo ""
echo "Testing DNS resolution for various environments..."
echo ""

# Test endpoints
ENVIRONMENTS=("dev" "test" "staging" "prod")
BASE_DOMAIN="api.nlp"
FULL_DOMAIN="uptimize.merckgroup.com"

echo "Date: $(date)"
echo "Hostname: $(hostname)"
echo ""

# Check if we can resolve external DNS first
echo "--- Testing External DNS Resolution ---"
echo -n "Google DNS (8.8.8.8): "
if ping -c 1 -W 2 8.8.8.8 > /dev/null 2>&1; then
    echo "✓ Reachable"
else
    echo "✗ Unreachable (network issue?)"
fi

echo -n "External DNS (google.com): "
if nslookup google.com > /dev/null 2>&1; then
    echo "✓ Can resolve"
else
    echo "✗ Cannot resolve"
fi
echo ""

# Test Merck endpoints
echo "--- Testing Merck Azure OpenAI Endpoints ---"
for env in "${ENVIRONMENTS[@]}"; do
    ENDPOINT="${BASE_DOMAIN}.${env}.${FULL_DOMAIN}"
    echo ""
    echo "Testing: $ENDPOINT"
    echo "---"

    # Test with nslookup
    echo -n "  nslookup: "
    if nslookup $ENDPOINT > /dev/null 2>&1; then
        echo "✓ Can resolve"
        IP=$(nslookup $ENDPOINT 2>/dev/null | grep -A1 "Name:" | tail -n1 | awk '{print $2}')
        if [ ! -z "$IP" ]; then
            echo "    IP: $IP"
        fi
    else
        echo "✗ Cannot resolve"
    fi

    # Test with host command
    echo -n "  host:     "
    if host $ENDPOINT > /dev/null 2>&1; then
        echo "✓ Can resolve"
    else
        echo "✗ Cannot resolve"
    fi

    # Test with dig
    echo -n "  dig:      "
    if command -v dig > /dev/null 2>&1; then
        if dig $ENDPOINT +short > /dev/null 2>&1; then
            DIG_IP=$(dig $ENDPOINT +short 2>/dev/null | head -n1)
            if [ ! -z "$DIG_IP" ]; then
                echo "✓ Can resolve → $DIG_IP"
            else
                echo "✗ Cannot resolve"
            fi
        else
            echo "✗ Cannot resolve"
        fi
    else
        echo "⊘ dig command not available"
    fi

    # Test with getent
    echo -n "  getent:   "
    if command -v getent > /dev/null 2>&1; then
        if getent hosts $ENDPOINT > /dev/null 2>&1; then
            GETENT_IP=$(getent hosts $ENDPOINT 2>/dev/null | awk '{print $1}')
            echo "✓ Can resolve → $GETENT_IP"
        else
            echo "✗ Cannot resolve"
        fi
    else
        echo "⊘ getent command not available"
    fi
done

echo ""
echo "--- DNS Server Information ---"
echo "Current DNS servers:"
if [ -f /etc/resolv.conf ]; then
    grep -E "^nameserver" /etc/resolv.conf | while read line; do
        echo "  $line"
    done
else
    echo "  Cannot read /etc/resolv.conf"
fi

echo ""
echo "--- Network Configuration ---"
echo "IP Configuration:"
ip addr show 2>/dev/null | grep -E "inet " | grep -v "127.0.0.1" | awk '{print "  " $2}' || echo "  Cannot get IP configuration"

echo ""
echo "Default Gateway:"
ip route show default 2>/dev/null | awk '{print "  " $0}' || echo "  Cannot get default gateway"

echo ""
echo "============================================================"
echo "DNS Test Complete"
echo "============================================================"
echo ""
echo "RECOMMENDATIONS:"
echo "  ✓ If all tests show '✗ Cannot resolve' → VPN is likely NOT connected"
echo "  ✓ If external DNS works but Merck endpoints fail → VPN required"
echo "  ✓ If some environments resolve → Try those environments in config"
echo ""
