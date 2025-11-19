/**
 * Test Azure OpenAI Connection
 *
 * This script tests the connection to Merck's Azure OpenAI NLP API endpoint.
 *
 * IMPORTANT: VPN connection is required to access the API.
 *
 * Usage:
 *   node server/scripts/testAzureOpenAI.js
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const config = {
  // Azure OpenAI endpoint configuration
  environment: process.env.AZURE_OPENAI_ENV || 'prod', // dev, test, staging, prod
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-10-21',
  apiKey: process.env.AZURE_OPENAI_API_KEY || '',
  model: process.env.AZURE_OPENAI_MODEL || 'gpt-4o-mini', // Deployment name

  // Test parameters
  testPrompt: 'Respond with "Connection successful" if you can read this message.',
  maxTokens: 50,
  temperature: 0
};

/**
 * Test chat completion
 */
async function testChatCompletion() {
  try {
    console.log('='.repeat(70));
    console.log('Azure OpenAI Connection Test');
    console.log('='.repeat(70));
    console.log();

    // Validate API key
    if (!config.apiKey) {
      console.error('❌ Error: API key not configured');
      console.log('   Please set AZURE_OPENAI_API_KEY environment variable');
      console.log('   Or update the config.apiKey value in this script');
      return;
    }

    // Build endpoint URL
    const baseURL = 'https://api.nlp';
    const azureEndpoint = `${baseURL}.${config.environment}.uptimize.merckgroup.com`;
    const url = `${azureEndpoint}/openai/deployments/${config.model}/chat/completions?api-version=${config.apiVersion}`;

    console.log('Configuration:');
    console.log(`  Endpoint:     ${azureEndpoint}`);
    console.log(`  Environment:  ${config.environment}`);
    console.log(`  API Version:  ${config.apiVersion}`);
    console.log(`  Model:        ${config.model}`);
    console.log(`  API Key:      ${'*'.repeat(config.apiKey.length - 8)}${config.apiKey.slice(-8)}`);
    console.log();
    console.log('Request URL:');
    console.log(`  ${url}`);
    console.log();

    // Prepare request
    const payload = {
      messages: [
        {
          role: 'user',
          content: config.testPrompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens
    };

    console.log('Sending test request...');
    console.log();

    // Make API request
    const startTime = Date.now();
    const response = await axios.post(url, payload, {
      headers: {
        'api-key': config.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    const duration = Date.now() - startTime;

    // Parse response
    const content = response.data?.choices?.[0]?.message?.content;
    const usage = response.data?.usage;

    console.log('✅ Success!');
    console.log();
    console.log('Response:');
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    console.log();
    console.log('Generated Content:');
    console.log(`  "${content}"`);
    console.log();

    if (usage) {
      console.log('Token Usage:');
      console.log(`  Prompt tokens:     ${usage.prompt_tokens}`);
      console.log(`  Completion tokens: ${usage.completion_tokens}`);
      console.log(`  Total tokens:      ${usage.total_tokens}`);
      console.log();
    }

    console.log('='.repeat(70));
    console.log('Connection test completed successfully!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error();
    console.error('❌ Connection test failed!');
    console.error();

    // Enhanced error diagnostics
    console.error('Error Details:');
    console.error(`  Name:    ${error.name}`);
    console.error(`  Code:    ${error.code || 'N/A'}`);
    console.error(`  Message: ${error.message}`);
    console.error();

    if (error.response) {
      // API returned an error response
      console.error('API Error Response:');
      console.error(`  Status: ${error.response.status} ${error.response.statusText}`);
      console.error(`  Data:`, JSON.stringify(error.response.data, null, 2));
      console.error();

      if (error.response.status === 401) {
        console.error('⚠️  Authentication failed - Check your API key');
        console.error('   • Verify API key is correct');
        console.error('   • Check if API key has expired');
        console.error('   • Ensure you have permissions for this deployment');
      } else if (error.response.status === 404) {
        console.error('⚠️  Endpoint not found - Check configuration');
        console.error('   • Model/deployment name: ' + config.model);
        console.error('   • Environment: ' + config.environment);
        console.error('   • API version: ' + config.apiVersion);
        console.error('   • Verify the deployment exists in this environment');
      } else if (error.response.status === 429) {
        console.error('⚠️  Rate limit exceeded');
        console.error('   • Wait and try again');
        console.error('   • Check your quota usage');
      }
    } else if (error.code === 'ENOTFOUND') {
      console.error('DNS Resolution Error:');
      console.error(`  Hostname: ${azureEndpoint}`);
      console.error(`  Code:     ${error.code}`);
      console.error(`  Message:  ${error.message}`);
      console.error();
      console.error('⚠️  Cannot resolve hostname - VPN CONNECTION REQUIRED!');
      console.error();
      console.error('Troubleshooting steps:');
      console.error('  1. Connect to Merck VPN');
      console.error('  2. Verify VPN is active:');
      console.error('     • Run: ip addr show | grep tun');
      console.error('     • You should see a tun0 or similar interface');
      console.error('  3. Test DNS resolution:');
      console.error(`     • Run: nslookup ${azureEndpoint}`);
      console.error('  4. Check environment setting:');
      console.error(`     • Current: ${config.environment}`);
      console.error(`     • Try: dev, test, staging, or prod`);
      console.error('  5. Run diagnostics: cd diagnostics && ./0-run-all-diagnostics.sh');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection Refused Error:');
      console.error(`  Code: ${error.code}`);
      console.error(`  Message: ${error.message}`);
      console.error();
      console.error('⚠️  Connection refused');
      console.error();
      console.error('Possible causes:');
      console.error('  • Firewall blocking connection');
      console.error('  • Service is down');
      console.error('  • Wrong port or endpoint');
      console.error('  • VPN not properly configured');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Timeout Error:');
      console.error(`  Request timed out after 30 seconds`);
      console.error();
      console.error('Possible causes:');
      console.error('  • Slow network connection');
      console.error('  • Firewall blocking traffic');
      console.error('  • Service is slow or overloaded');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Connection Timeout:');
      console.error(`  Connection attempt timed out`);
      console.error();
      console.error('Possible causes:');
      console.error('  • Network routing issue');
      console.error('  • Firewall blocking traffic');
      console.error('  • VPN connection issue');
    } else {
      console.error('Unexpected Error:');
      console.error(`  Type: ${typeof error}`);
      console.error(`  Message: ${error.message}`);
      console.error();

      if (error.config) {
        console.error('Request Configuration:');
        console.error(`  URL: ${error.config.url}`);
        console.error(`  Method: ${error.config.method}`);
        console.error(`  Timeout: ${error.config.timeout}ms`);
        console.error();
      }

      if (error.stack) {
        console.error('Stack trace:');
        console.error(error.stack);
      }
    }

    console.error();
    console.error('='.repeat(70));
    console.error('For detailed diagnostics, run:');
    console.error('  cd diagnostics && bash 0-run-all-diagnostics.sh');
    console.error('='.repeat(70));
    process.exit(1);
  }
}

/**
 * Test embedding generation (optional)
 */
async function testEmbedding() {
  try {
    console.log();
    console.log('Testing embedding endpoint...');
    console.log();

    const baseURL = 'https://api.nlp';
    const azureEndpoint = `${baseURL}.${config.environment}.uptimize.merckgroup.com`;
    const embeddingModel = 'text-embedding-ada-002'; // Common embedding model
    const url = `${azureEndpoint}/openai/deployments/${embeddingModel}/embeddings?api-version=${config.apiVersion}`;

    const payload = {
      input: 'Once upon a time'
    };

    const response = await axios.post(url, payload, {
      headers: {
        'api-key': config.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Embedding test successful!');
    console.log(`  Vector dimensions: ${response.data?.data?.[0]?.embedding?.length || 'unknown'}`);
    console.log();

  } catch (error) {
    console.log('⚠️  Embedding test skipped or failed (this is optional)');
    console.log(`   Error: ${error.message}`);
    console.log();
  }
}

// Run tests
(async () => {
  await testChatCompletion();
  // Uncomment to test embeddings as well:
  // await testEmbedding();
})();
