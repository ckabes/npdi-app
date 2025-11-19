#!/bin/bash

# Quick VPN Status Check
# Fast check to see if VPN is likely connected

echo "================================================================"
echo "Quick VPN Status Check"
echo "================================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for VPN interface
echo -n "VPN Interface: "
if ip addr 2>/dev/null | grep -qE "tun|tap|ppp"; then
    echo -e "${GREEN}✓ DETECTED${NC}"
    echo ""
    echo "VPN Interface Details:"
    ip addr 2>/dev/null | grep -E "tun|tap|ppp" -A 5
    VPN_UP=true
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    VPN_UP=false
fi

echo ""

# Test DNS resolution
ENV="${1:-prod}"
ENDPOINT="api.nlp.${ENV}.uptimize.merckgroup.com"

echo -n "DNS Resolution ($ENDPOINT): "
if nslookup "$ENDPOINT" > /dev/null 2>&1; then
    IP=$(nslookup "$ENDPOINT" 2>/dev/null | grep -A1 "Name:" | tail -n1 | awk '{print $2}')
    echo -e "${GREEN}✓ RESOLVES${NC}"
    if [ ! -z "$IP" ]; then
        echo "  → IP: $IP"
    fi
    DNS_OK=true
else
    echo -e "${RED}✗ FAILED${NC}"
    DNS_OK=false
fi

echo ""

# Test connectivity
echo -n "Network Connectivity (${ENDPOINT}:443): "
if timeout 3 bash -c "echo > /dev/tcp/${ENDPOINT}/443" 2>/dev/null; then
    echo -e "${GREEN}✓ CONNECTED${NC}"
    CONN_OK=true
else
    echo -e "${RED}✗ FAILED${NC}"
    CONN_OK=false
fi

echo ""
echo "================================================================"
echo "STATUS SUMMARY"
echo "================================================================"
echo ""

if [ "$VPN_UP" = true ] && [ "$DNS_OK" = true ] && [ "$CONN_OK" = true ]; then
    echo -e "${GREEN}✓✓✓ VPN IS CONNECTED AND WORKING${NC}"
    echo ""
    echo "You should be able to connect to Azure OpenAI API."
    echo ""
    echo "Next steps:"
    echo "  1. Configure API key in Admin Dashboard"
    echo "  2. Test connection from Admin Dashboard"
    echo ""
elif [ "$VPN_UP" = false ]; then
    echo -e "${RED}✗✗✗ VPN IS NOT CONNECTED${NC}"
    echo ""
    echo "Action required:"
    echo "  1. Connect to Merck VPN"
    echo "  2. Run this check again: ./check-vpn.sh"
    echo ""
elif [ "$DNS_OK" = false ]; then
    echo -e "${YELLOW}⚠ VPN DETECTED BUT DNS NOT WORKING${NC}"
    echo ""
    echo "Possible issues:"
    echo "  • VPN DNS not configured correctly"
    echo "  • Wrong environment specified"
    echo "  • Corporate DNS issue"
    echo ""
    echo "Try different environment:"
    echo "  ./check-vpn.sh dev"
    echo "  ./check-vpn.sh test"
    echo "  ./check-vpn.sh staging"
    echo "  ./check-vpn.sh prod"
    echo ""
else
    echo -e "${YELLOW}⚠ PARTIAL CONNECTIVITY${NC}"
    echo ""
    echo "DNS works but network connectivity failed."
    echo ""
    echo "Possible issues:"
    echo "  • Firewall blocking port 443"
    echo "  • Network routing issue"
    echo "  • Service temporarily down"
    echo ""
    echo "Run full diagnostics:"
    echo "  ./0-run-all-diagnostics.sh"
    echo ""
fi

echo "================================================================"
