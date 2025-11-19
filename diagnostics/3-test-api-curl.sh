#!/bin/bash

# Azure OpenAI API Test with curl
# Tests the actual API endpoint with authentication

echo "============================================================"
echo "Azure OpenAI API Test (curl)"
echo "============================================================"
echo ""

# Configuration (you can pass these as arguments)
ENV="${AZURE_OPENAI_ENV:-prod}"
API_VERSION="${AZURE_OPENAI_API_VERSION:-2024-10-21}"
MODEL="${AZURE_OPENAI_MODEL:-gpt-4o-mini}"
API_KEY="${AZURE_OPENAI_API_KEY:-}"

# Prompt for API key if not set
if [ -z "$API_KEY" ]; then
    echo "API Key not found in environment variable."
    echo ""
    read -sp "Enter your Azure OpenAI API Key: " API_KEY
    echo ""
    echo ""
fi

if [ -z "$API_KEY" ]; then
    echo "ERROR: API key is required"
    echo ""
    echo "Usage:"
    echo "  export AZURE_OPENAI_API_KEY='your-key-here'"
    echo "  ./3-test-api-curl.sh"
    echo ""
    echo "Or:"
    echo "  AZURE_OPENAI_API_KEY='your-key-here' ./3-test-api-curl.sh"
    exit 1
fi

# Build URL
BASE_URL="https://api.nlp.${ENV}.uptimize.merckgroup.com"
ENDPOINT="/openai/deployments/${MODEL}/chat/completions"
FULL_URL="${BASE_URL}${ENDPOINT}?api-version=${API_VERSION}"

echo "Configuration:"
echo "  Environment:  $ENV"
echo "  API Version:  $API_VERSION"
echo "  Model:        $MODEL"
echo "  Base URL:     $BASE_URL"
echo "  API Key:      ${API_KEY:0:8}...${API_KEY: -8}"
echo ""
echo "Full URL:"
echo "  $FULL_URL"
echo ""

# Test payload
PAYLOAD='{
  "messages": [
    {
      "role": "user",
      "content": "Respond with \"Connection successful\" if you can read this message."
    }
  ],
  "temperature": 0,
  "max_tokens": 50
}'

echo "Request Payload:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""
echo "============================================================"
echo ""

# Save request details
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="./diagnostics/logs"
mkdir -p "$LOG_DIR"
REQUEST_LOG="${LOG_DIR}/api_request_${TIMESTAMP}.log"
RESPONSE_LOG="${LOG_DIR}/api_response_${TIMESTAMP}.json"
FULL_LOG="${LOG_DIR}/api_full_${TIMESTAMP}.log"

echo "Sending request to Azure OpenAI..."
echo "(Logs will be saved to: $LOG_DIR)"
echo ""

# Make the request
HTTP_CODE=$(curl -w "%{http_code}" -o "$RESPONSE_LOG" -X POST "$FULL_URL" \
    -H "Content-Type: application/json" \
    -H "api-key: $API_KEY" \
    -d "$PAYLOAD" \
    --connect-timeout 10 \
    --max-time 30 \
    -v 2>&1 | tee "$FULL_LOG" | tail -n 1)

CURL_EXIT=$?

echo ""
echo "============================================================"
echo "RESPONSE"
echo "============================================================"
echo ""

echo "HTTP Status Code: $HTTP_CODE"
echo "Curl Exit Code:   $CURL_EXIT"
echo ""

# Parse the response
if [ -f "$RESPONSE_LOG" ]; then
    echo "Response Body:"
    if command -v jq > /dev/null 2>&1; then
        cat "$RESPONSE_LOG" | jq '.' || cat "$RESPONSE_LOG"
    else
        cat "$RESPONSE_LOG"
    fi
    echo ""
else
    echo "No response body received"
    echo ""
fi

# Analyze the result
echo "============================================================"
echo "ANALYSIS"
echo "============================================================"
echo ""

if [ $CURL_EXIT -eq 0 ]; then
    echo "✓ Curl command executed successfully"

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ API request successful (HTTP 200)"

        # Extract the response content
        if [ -f "$RESPONSE_LOG" ]; then
            CONTENT=$(cat "$RESPONSE_LOG" | jq -r '.choices[0].message.content' 2>/dev/null)
            if [ ! -z "$CONTENT" ] && [ "$CONTENT" != "null" ]; then
                echo ""
                echo "AI Response:"
                echo "  \"$CONTENT\""
                echo ""
                echo "✓✓✓ AZURE OPENAI CONNECTION FULLY WORKING ✓✓✓"
            fi
        fi
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "✗ Authentication failed (HTTP 401)"
        echo "  → Check your API key"
        echo "  → Verify the API key has not expired"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "✗ Endpoint not found (HTTP 404)"
        echo "  → Check the model/deployment name: $MODEL"
        echo "  → Verify the environment: $ENV"
        echo "  → Check API version: $API_VERSION"
    elif [ "$HTTP_CODE" = "429" ]; then
        echo "✗ Rate limit exceeded (HTTP 429)"
        echo "  → Wait and try again"
        echo "  → Check your quota"
    elif [ "$HTTP_CODE" = "500" ] || [ "$HTTP_CODE" = "502" ] || [ "$HTTP_CODE" = "503" ]; then
        echo "✗ Server error (HTTP $HTTP_CODE)"
        echo "  → Azure OpenAI service may be down"
        echo "  → Try again later"
    else
        echo "⚠ Unexpected HTTP status: $HTTP_CODE"
    fi
else
    echo "✗ Curl command failed (exit code: $CURL_EXIT)"

    case $CURL_EXIT in
        6)
            echo "  → Could not resolve host"
            echo "  → VPN connection required!"
            ;;
        7)
            echo "  → Failed to connect to host"
            echo "  → Check network connectivity"
            echo "  → Verify VPN is connected"
            ;;
        28)
            echo "  → Connection timeout"
            echo "  → Network may be slow or blocked"
            ;;
        35)
            echo "  → SSL/TLS connection error"
            echo "  → Certificate verification issue"
            ;;
        *)
            echo "  → Unknown error"
            ;;
    esac
fi

echo ""
echo "============================================================"
echo "LOG FILES"
echo "============================================================"
echo ""
echo "Full verbose output: $FULL_LOG"
echo "Response body:       $RESPONSE_LOG"
echo ""
echo "To view logs:"
echo "  cat $FULL_LOG"
echo "  cat $RESPONSE_LOG | jq ."
echo ""

# Connection summary from verbose output
echo "============================================================"
echo "CONNECTION DETAILS"
echo "============================================================"
echo ""

if [ -f "$FULL_LOG" ]; then
    echo "DNS Resolution:"
    grep "Trying" "$FULL_LOG" | head -n 1

    echo ""
    echo "TCP Connection:"
    grep "Connected to" "$FULL_LOG" | head -n 1

    echo ""
    echo "SSL/TLS:"
    grep "SSL connection" "$FULL_LOG" | head -n 1

    echo ""
    echo "Server:"
    grep -i "< server:" "$FULL_LOG" | head -n 1
fi

echo ""
echo "============================================================"
echo "Test Complete"
echo "============================================================"
