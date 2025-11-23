#!/usr/bin/env node

/**
 * Claude Code VPN Connectivity Diagnostic Script (Node.js Version)
 *
 * Purpose: Diagnose network connectivity issues when connected to VPN
 * Usage: node server/scripts/diagnoseVPN.js
 *
 * This script tests:
 * - DNS resolution for Anthropic domains
 * - HTTPS connectivity to Claude API endpoints
 * - Certificate validation
 * - Proxy configuration
 * - Network latency
 * - WebSocket connectivity
 */

const dns = require('dns').promises;
const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Test results
let passed = 0;
let failed = 0;
let warnings = 0;

const reportFile = `VPN_DIAGNOSTIC_REPORT_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
let reportContent = '';

// Helper functions
function log(message, toFile = true) {
  console.log(message);
  if (toFile) {
    reportContent += message + '\n';
  }
}

function logResult(testName, status, details = '') {
  const statusStr = `[${status}]`;
  log(`${statusStr} ${testName}`);
  if (details) {
    log(`    ${details}`);
  }
  log('');

  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else warnings++;
}

// Test functions
async function testDNS(domain) {
  try {
    const addresses = await dns.resolve4(domain);
    return { success: true, addresses };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testHTTPS(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = https.get(url, { timeout: 10000 }, (res) => {
      const duration = Date.now() - startTime;

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: true,
          statusCode: res.statusCode,
          duration,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        code: error.code
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        code: 'ETIMEDOUT'
      });
    });
  });
}

async function testCertificate(hostname, port = 443) {
  return new Promise((resolve) => {
    const options = {
      host: hostname,
      port: port,
      method: 'GET',
      rejectUnauthorized: false, // We want to see certificate issues
      agent: false
    };

    const req = https.get(options, (res) => {
      const cert = res.socket.getPeerCertificate();

      if (res.socket.authorized) {
        resolve({
          success: true,
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: cert.valid_from,
          validTo: cert.valid_to
        });
      } else {
        resolve({
          success: false,
          error: res.socket.authorizationError,
          cert: cert
        });
      }
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
  });
}

async function testPort(hostname, port) {
  return new Promise((resolve) => {
    const socket = new require('net').Socket();
    const timeout = 5000;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve({ success: true });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, error: 'Connection timeout' });
    });

    socket.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    socket.connect(port, hostname);
  });
}

// Main diagnostic function
async function runDiagnostics() {
  log('='.repeat(80));
  log('Claude Code VPN Connectivity Diagnostic (Node.js)');
  log('='.repeat(80));
  log('');
  log(`Date: ${new Date().toISOString()}`);
  log(`Node Version: ${process.version}`);
  log(`Platform: ${process.platform}`);
  log(`User: ${process.env.USER || process.env.USERNAME}`);
  log('');

  // Test 1: DNS Resolution
  log('='.repeat(80));
  log('1. DNS RESOLUTION TEST');
  log('='.repeat(80));
  log('');

  const domains = [
    'api.anthropic.com',
    'console.anthropic.com',
    'www.anthropic.com'
  ];

  for (const domain of domains) {
    const result = await testDNS(domain);

    if (result.success) {
      logResult(`DNS: ${domain}`, 'PASS', `Resolved to: ${result.addresses.join(', ')}`);
    } else {
      logResult(`DNS: ${domain}`, 'FAIL', `Error: ${result.error}`);
    }
  }

  // Test 2: HTTPS Connectivity
  log('='.repeat(80));
  log('2. HTTPS CONNECTIVITY TEST');
  log('='.repeat(80));
  log('');

  const endpoints = [
    'https://api.anthropic.com',
    'https://console.anthropic.com'
  ];

  for (const endpoint of endpoints) {
    const result = await testHTTPS(endpoint);

    if (result.success) {
      logResult(
        `HTTPS: ${endpoint}`,
        'PASS',
        `Status: ${result.statusCode}, Duration: ${result.duration}ms`
      );
    } else {
      logResult(
        `HTTPS: ${endpoint}`,
        'FAIL',
        `Error: ${result.error} (Code: ${result.code})`
      );
    }
  }

  // Test 3: SSL Certificate Validation
  log('='.repeat(80));
  log('3. SSL CERTIFICATE VALIDATION');
  log('='.repeat(80));
  log('');

  const certResult = await testCertificate('api.anthropic.com');

  if (certResult.success) {
    logResult(
      'SSL Certificate',
      'PASS',
      `Issuer: ${certResult.issuer.O}, Valid: ${certResult.validFrom} to ${certResult.validTo}`
    );
  } else {
    logResult(
      'SSL Certificate',
      'FAIL',
      `Error: ${certResult.error} - Corporate SSL inspection likely active`
    );
  }

  // Test 4: Proxy Configuration
  log('='.repeat(80));
  log('4. PROXY CONFIGURATION CHECK');
  log('='.repeat(80));
  log('');

  const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy'];
  let proxyFound = false;

  log('Environment proxy variables:');
  for (const varName of proxyVars) {
    if (process.env[varName]) {
      log(`  ${varName} = ${process.env[varName]}`);
      proxyFound = true;
    }
  }
  log('');

  if (proxyFound) {
    logResult('Proxy Configuration', 'WARN', 'Proxy environment variables detected');
  } else {
    logResult('Proxy Configuration', 'PASS', 'No proxy variables set');
  }

  // Test 5: Port Connectivity
  log('='.repeat(80));
  log('5. PORT CONNECTIVITY TEST');
  log('='.repeat(80));
  log('');

  const ports = [443, 80, 8080];

  for (const port of ports) {
    const result = await testPort('api.anthropic.com', port);

    if (result.success) {
      logResult(`Port ${port}`, 'PASS', 'Port is accessible');
    } else {
      logResult(`Port ${port}`, 'FAIL', `Error: ${result.error}`);
    }
  }

  // Test 6: Network Information
  log('='.repeat(80));
  log('6. NETWORK CONFIGURATION');
  log('='.repeat(80));
  log('');

  try {
    const { stdout: ipOutput } = await execAsync('ip addr show 2>/dev/null || ifconfig');
    log('Network Interfaces:');
    log(ipOutput);

    // Check for VPN interfaces
    if (ipOutput.match(/tun|tap|ppp|vpn/i)) {
      logResult('VPN Interface', 'PASS', 'VPN interface detected');
    } else {
      logResult('VPN Interface', 'WARN', 'No VPN interface found - are you connected?');
    }
  } catch (error) {
    log(`Could not retrieve network info: ${error.message}`);
  }

  // Test 7: DNS Servers
  log('='.repeat(80));
  log('7. DNS CONFIGURATION');
  log('='.repeat(80));
  log('');

  try {
    const dnsServers = await dns.getServers();
    log(`DNS Servers: ${dnsServers.join(', ')}`);
    logResult('DNS Servers', 'PASS', `${dnsServers.length} DNS servers configured`);
  } catch (error) {
    logResult('DNS Servers', 'FAIL', `Error: ${error.message}`);
  }

  // Summary
  log('='.repeat(80));
  log('SUMMARY');
  log('='.repeat(80));
  log('');
  log('Test Results:');
  log(`  Passed:   ${passed}`);
  log(`  Failed:   ${failed}`);
  log(`  Warnings: ${warnings}`);
  log('');

  if (failed > 0) {
    log('⚠️  CONNECTION ISSUES DETECTED');
    log('');
    log('Common VPN Issues and Solutions:');
    log('');
    log('1. SSL Certificate Validation Failed:');
    log('   - Corporate firewall performing SSL inspection');
    log('   - Solution: Contact IT to whitelist *.anthropic.com');
    log('');
    log('2. DNS Resolution Failed:');
    log('   - VPN DNS blocking external domains');
    log('   - Solution: Use split-tunnel VPN or DNS exceptions');
    log('');
    log('3. Port 443 Blocked:');
    log('   - Outbound HTTPS restricted');
    log('   - Solution: Request firewall exception for api.anthropic.com:443');
    log('');
    log('4. Proxy Configuration:');
    log('   - Corporate proxy interfering');
    log('   - Solution: Configure Claude Code to use/bypass proxy');
    log('');
  } else {
    log('✅ All tests passed - network connectivity looks good');
    log('');
    log('If Claude Code still doesn\'t work:');
    log('- Check for DPI (Deep Packet Inspection) blocking');
    log('- Verify API key configuration');
    log('- Check Claude Code version compatibility');
    log('');
  }

  log('='.repeat(80));
  log(`Full report saved to: ${reportFile}`);
  log('='.repeat(80));
  log('');

  // Write report to file
  fs.writeFileSync(reportFile, reportContent, 'utf8');

  log('Next Steps:');
  log('1. Review the detailed report above');
  log('2. Share report with IT if firewall changes needed');
  log('3. Try Claude Code after addressing failed tests');
  log('4. Check Claude Code logs if issues persist');

  process.exit(failed);
}

// Run diagnostics
runDiagnostics().catch((error) => {
  console.error('Fatal error during diagnostics:', error);
  process.exit(1);
});
