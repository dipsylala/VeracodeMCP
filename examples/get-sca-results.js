#!/usr/bin/env node

/**
 * Basic Example: Get SCA Results
 * 
 * This example demonstrates how to get Software Composition Analysis (SCA) results 
 * for an application using the Veracode MCP Server.
 * Usage: node get-sca-results.js <application-name>
 */

import { VeracodeDirectClient } from '../build/test-utils/veracode-direct-client.js';

async function getSCAResults(applicationName) {
    console.log(`🔍 Getting SCA results for application: "${applicationName}"...\n`);

    try {
        // Initialize the MCP client
        const client = new VeracodeDirectClient();

        // Call the get-sca-results tool
        const result = await client.callTool({
            tool: 'get-sca-results',
            args: {
                app_profile: applicationName,
                severity_gte: 3  // Get medium severity and above
            }
        });

        if (result.success && result.data) {
            const scaData = result.data;

            console.log(`✅ SCA Analysis for "${applicationName}":\n`);

            // Get findings array
            const findings = scaData.detailed_findings || [];

            // Display summary
            console.log('📊 Summary:');
            console.log(`   Total Findings: ${findings.length || 0}`);

            // Calculate severity counts
            const severityCounts = {};
            findings.forEach(finding => {
                const severity = finding.finding_details?.severity || 'Unknown';
                severityCounts[severity] = (severityCounts[severity] || 0) + 1;
            });

            console.log(`   High Severity (5): ${severityCounts[5] || 0}`);
            console.log(`   Medium Severity (4): ${severityCounts[4] || 0}`);
            console.log(`   Low Severity (3): ${severityCounts[3] || 0}`);

            // Count exploitable findings
            const exploitableCount = findings.filter(finding =>
                finding.finding_details?.cve?.exploitability?.exploit_observed ||
                finding.finding_details?.cve?.exploitability?.epss_score > 0.1
            ).length;
            console.log(`   Exploitable: ${exploitableCount}`);
            console.log('');

            // Display top vulnerabilities
            if (findings.length > 0) {
                console.log('🚨 Top Vulnerabilities:');
                findings.slice(0, 5).forEach((finding, index) => {
                    console.log(`   ${index + 1}. ${finding.finding_details?.cve?.name || 'Unknown CVE'}`);
                    console.log(`      Severity: ${finding.finding_details?.severity || 'Unknown'}`);
                    console.log(`      Component: ${finding.finding_details?.component_filename || 'Unknown'}`);
                    console.log(`      Version: ${finding.finding_details?.version || 'Unknown'}`);
                    if (finding.finding_details?.cve?.cvss3?.score) {
                        console.log(`      CVSS Score: ${finding.finding_details.cve.cvss3.score}`);
                    }
                    if (finding.finding_details?.cve?.exploitability?.epss_score) {
                        console.log(`      EPSS Score: ${finding.finding_details.cve.exploitability.epss_score}`);
                    }
                    console.log('');
                });

                if (findings.length > 5) {
                    console.log(`   ... and ${findings.length - 5} more vulnerabilities`);
                }
            } else {
                console.log('✅ No SCA vulnerabilities found at the specified severity level.');
            }

        } else {
            console.error('❌ Failed to get SCA results:', result.error || 'Unknown error');
            console.log('\nTips:');
            console.log('- Ensure the application name is correct');
            console.log('- Check that the application has SCA scans enabled');
            console.log('- Verify your Veracode API credentials have access to this application');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error getting SCA results:', error.message);
        process.exit(1);
    }
}

// Get application name from command line arguments
const applicationName = process.argv[2];

if (!applicationName) {
    console.error('❌ Please provide an application name.');
    console.log('Usage: node get-sca-results.js <application-name>');
    console.log('Example: node get-sca-results.js "MyApplication"');
    process.exit(1);
}

// Run the example
getSCAResults(applicationName);
