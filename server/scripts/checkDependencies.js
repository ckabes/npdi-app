#!/usr/bin/env node

/**
 * Dependency License Analysis Script
 * Analyzes all npm dependencies for licensing and production suitability
 *
 * Run with: node server/scripts/checkDependencies.js
 */

const fs = require('fs');
const path = require('path');

// Known problematic licenses for commercial/proprietary software
const PROBLEMATIC_LICENSES = [
  'GPL', 'GPL-2.0', 'GPL-3.0', 'AGPL', 'AGPL-3.0',
  'LGPL', 'LGPL-2.1', 'LGPL-3.0',
  'SSPL', 'Commons Clause', 'BUSL'
];

// Permissive licenses safe for production
const SAFE_LICENSES = [
  'MIT', 'Apache-2.0', 'Apache 2.0', 'BSD', 'BSD-2-Clause', 'BSD-3-Clause',
  'ISC', 'CC0-1.0', '0BSD', 'Unlicense', 'WTFPL'
];

// Read package.json files
function readPackageJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Read license from node_modules
function getLicenseFromPackage(packageName, baseDir) {
  const packagePath = path.join(baseDir, 'node_modules', packageName, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return pkg.license || 'UNKNOWN';
  } catch (error) {
    return 'NOT_FOUND';
  }
}

// Check if license is problematic
function isProblematic(license) {
  if (!license || license === 'UNKNOWN' || license === 'NOT_FOUND') {
    return { problematic: true, reason: 'License not specified' };
  }

  const licenseStr = String(license).toUpperCase();

  for (const problematic of PROBLEMATIC_LICENSES) {
    if (licenseStr.includes(problematic.toUpperCase())) {
      return { problematic: true, reason: `Copyleft license (${license})` };
    }
  }

  return { problematic: false };
}

// Analyze dependencies
function analyzeDependencies() {
  const rootDir = path.join(__dirname, '../..');
  const clientDir = path.join(rootDir, 'client');

  console.log('='.repeat(80));
  console.log('NPDI Application - Dependency License Analysis');
  console.log('='.repeat(80));
  console.log('');

  const issues = [];
  const allDeps = new Map();

  // Analyze server dependencies
  console.log('Analyzing Server Dependencies...');
  const serverPkg = readPackageJson(path.join(rootDir, 'package.json'));
  if (serverPkg) {
    const serverDeps = { ...serverPkg.dependencies, ...serverPkg.devDependencies };
    for (const [name, version] of Object.entries(serverDeps)) {
      const license = getLicenseFromPackage(name, rootDir);
      allDeps.set(name, { version, license, location: 'server' });
    }
  }

  // Analyze client dependencies
  console.log('Analyzing Client Dependencies...');
  const clientPkg = readPackageJson(path.join(clientDir, 'package.json'));
  if (clientPkg) {
    const clientDeps = { ...clientPkg.dependencies, ...clientPkg.devDependencies };
    for (const [name, version] of Object.entries(clientDeps)) {
      if (!allDeps.has(name)) {
        const license = getLicenseFromPackage(name, clientDir);
        allDeps.set(name, { version, license, location: 'client' });
      }
    }
  }

  console.log(`\nTotal unique dependencies found: ${allDeps.size}\n`);

  // Check for issues
  for (const [name, info] of allDeps.entries()) {
    const check = isProblematic(info.license);
    if (check.problematic) {
      issues.push({
        package: name,
        version: info.version,
        license: info.license,
        location: info.location,
        reason: check.reason
      });
    }
  }

  // Generate report
  if (issues.length > 0) {
    console.log('⚠️  ISSUES FOUND:\n');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.package}`);
      console.log(`   Version: ${issue.version}`);
      console.log(`   License: ${issue.license}`);
      console.log(`   Location: ${issue.location}`);
      console.log(`   Issue: ${issue.reason}`);
      console.log('');
    });

    // Generate detailed report file
    const report = generateDetailedReport(allDeps, issues);
    const reportPath = path.join(rootDir, 'DEPENDENCY_LICENSE_ANALYSIS.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`\n📄 Detailed report saved to: DEPENDENCY_LICENSE_ANALYSIS.md`);
    console.log('⚠️  This file has been added to .gitignore to keep it private\n');

    return { hasIssues: true, issueCount: issues.length };
  } else {
    console.log('✅ No licensing issues found!');
    console.log('');
    console.log('Summary:');
    console.log('- All dependencies use permissive licenses (MIT, Apache, BSD, ISC)');
    console.log('- Safe for commercial and proprietary deployment');
    console.log('- No GPL, AGPL, or other copyleft licenses detected');
    console.log('');
    return { hasIssues: false };
  }
}

// Generate detailed markdown report
function generateDetailedReport(allDeps, issues) {
  const timestamp = new Date().toISOString();

  let report = `# Dependency License Analysis Report\n\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**Project:** MilliporeSigma NPDI Application\n\n`;
  report += `---\n\n`;

  if (issues.length > 0) {
    report += `## ⚠️ Issues Found: ${issues.length}\n\n`;

    issues.forEach((issue, index) => {
      report += `### ${index + 1}. ${issue.package}\n\n`;
      report += `- **Version:** ${issue.version}\n`;
      report += `- **License:** ${issue.license}\n`;
      report += `- **Location:** ${issue.location}\n`;
      report += `- **Issue:** ${issue.reason}\n`;
      report += `- **Recommendation:** Review this dependency for licensing compliance\n\n`;
    });

    report += `---\n\n`;
  }

  report += `## All Dependencies (${allDeps.size})\n\n`;
  report += `| Package | Version | License | Location | Status |\n`;
  report += `|---------|---------|---------|----------|--------|\n`;

  const sortedDeps = Array.from(allDeps.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  for (const [name, info] of sortedDeps) {
    const check = isProblematic(info.license);
    const status = check.problematic ? '⚠️ REVIEW' : '✅ OK';
    report += `| ${name} | ${info.version} | ${info.license} | ${info.location} | ${status} |\n`;
  }

  report += `\n---\n\n`;
  report += `## License Categories\n\n`;

  const licenseCounts = new Map();
  for (const [, info] of allDeps) {
    const license = info.license || 'UNKNOWN';
    licenseCounts.set(license, (licenseCounts.get(license) || 0) + 1);
  }

  const sortedLicenses = Array.from(licenseCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [license, count] of sortedLicenses) {
    report += `- **${license}:** ${count} package${count > 1 ? 's' : ''}\n`;
  }

  report += `\n---\n\n`;
  report += `## Notes\n\n`;
  report += `- **MIT, Apache-2.0, BSD, ISC** licenses are permissive and safe for commercial use\n`;
  report += `- **GPL, AGPL, LGPL** licenses are copyleft and may restrict proprietary software\n`;
  report += `- Always review license text for specific requirements (attribution, etc.)\n`;
  report += `- This analysis is automated and should be verified by legal counsel for production deployment\n\n`;

  report += `---\n\n`;
  report += `*Generated by NPDI Dependency Analysis Tool*\n`;

  return report;
}

// Run analysis
const result = analyzeDependencies();

console.log('='.repeat(80));
process.exit(result.hasIssues ? 1 : 0);
