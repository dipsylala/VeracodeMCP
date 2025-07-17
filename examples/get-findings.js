#!/usr/bin/env node

/**
 * Basic Example: Get Findings
 * 
 * This example demonstrates how to get security findings for an application 
 * using the Veracode MCP Server.
 * Usage: node get-findings.js <application-name> [scan-type]
 */

import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';

async function getFindings(applicationName, scanType = 'ALL') {
    console.log(`🔍 Getting ${scanType} findings for application: "${applicationName}"...\n`);

    try {
        // Initialize the MCP client
        const client = new VeracodeMCPClient();

        // Prepare the arguments
        const args = {
            application: applicationName,
            severity_gte: 3  // Get medium severity and above
        };

        // Add scan type filter if specified
        if (scanType !== 'ALL') {
            args.scan_type = scanType;
        }

        // Call the get-findings tool
        const result = await client.callTool({
            tool: 'get-findings',
            args: args
        });

        if (result.success && result.data) {
            const findingsData = result.data;
            
            console.log(`✅ Findings Analysis for "${applicationName}":\n`);
            
            // Display summary
            console.log('📊 Summary:');
            console.log(`   Total Findings: ${findingsData.summary?.total_findings || 0}`);
            console.log(`   High Severity: ${findingsData.summary?.severity_counts?.['Very High'] || 0}`);
            console.log(`   Medium Severity: ${findingsData.summary?.severity_counts?.['Medium'] || 0}`);
            
            if (findingsData.summary?.scan_type_counts) {
                console.log('\n📈 Breakdown by Type:');
                Object.entries(findingsData.summary.scan_type_counts).forEach(([type, count]) => {
                    console.log(`   ${type}: ${count}`);
                });
            }
            console.log('');
            
            // Display top findings
            if (findingsData.findings && findingsData.findings.length > 0) {
                console.log('🚨 Recent Findings:');
                findingsData.findings.slice(0, 5).forEach((finding, index) => {
                    console.log(`   ${index + 1}. ${finding.finding_details?.finding_category?.name || 'Unknown Category'}`);
                    console.log(`      Type: ${finding.scan_type}`);
                    console.log(`      Severity: ${finding.finding_details?.severity || 'Unknown'}`);
                    if (finding.finding_details?.cwe?.id) {
                        console.log(`      CWE: ${finding.finding_details.cwe.id} - ${finding.finding_details.cwe.name}`);
                    }
                    console.log('');
                });
                
                if (findingsData.findings.length > 5) {
                    console.log(`   ... and ${findingsData.findings.length - 5} more findings`);
                }
            } else {
                console.log('✅ No findings found at the specified severity level.');
            }
            
        } else {
            console.error('❌ Failed to get findings:', result.error || 'Unknown error');
            console.log('\nTips:');
            console.log('- Ensure the application name is correct');
            console.log('- Check that the application has been scanned');
            console.log('- Verify your Veracode API credentials have access to this application');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error getting findings:', error.message);
        process.exit(1);
    }
}

// Get application name and scan type from command line arguments
const applicationName = process.argv[2];
const scanType = (process.argv[3] || 'ALL').toUpperCase();

if (!applicationName) {
    console.error('❌ Please provide an application name.');
    console.log('Usage: node get-findings.js <application-name> [scan-type]');
    console.log('Example: node get-findings.js "MyApplication" STATIC');
    console.log('Scan types: STATIC, DYNAMIC, SCA, ALL (default)');
    process.exit(1);
}

// Run the example
getFindings(applicationName, scanType);
