#!/usr/bin/env node

import { VeracodeMCPClient } from '../../../build/veracode-mcp-client.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function getSCAResults() {
    // Get application name from command line arguments
    const applicationName = process.argv[2];

    if (!applicationName) {
        console.error('❌ Please specify an application name as an argument');
        console.error('Usage: node get-sca-results-mcp.js <application-name>');
        console.error('Example: node get-sca-results-mcp.js "YourAppName"');
        process.exit(1);
    }

    console.log(`🔍 Getting SCA results for "${applicationName}"...\n`);

    try {
        const client = new VeracodeMCPClient();

        console.log(`📋 Step 1: Finding "${applicationName}" application...`);

        // First, search for the specified application using MCP client
        const appsResult = await client.callTool({
            tool: 'search-application-profiles',
            args: {
                name: applicationName
            }
        });

        if (!appsResult.success || !appsResult.data?.application_profiles?.length) {
            console.log(`❌ Could not find any applications matching "${applicationName}"`);
            console.log('Available applications (first 10):');
            const allAppsResult = await client.callTool({
                tool: 'search-application-profiles',
                args: {
                    name: ''  // Get all applications
                }
            });
            if (allAppsResult.success && allAppsResult.data?.application_profiles) {
                allAppsResult.data.application_profiles.slice(0, 10).forEach(app => {
                    console.log(`  • ${app.name} (ID: ${app.guid})`);
                });
            }
            return;
        }

        let targetApp = appsResult.data.application_profiles[0];

        if (appsResult.data.application_profiles.length > 1) {
            console.log(`✅ Found ${appsResult.data.application_profiles.length} matching applications:`);
            appsResult.data.application_profiles.forEach((app, index) => {
                console.log(`${index + 1}. ${app.name} (ID: ${app.guid})`);
            });
            console.log(`\n🎯 Using first match: ${targetApp.name}`);
        } else {
            console.log(`✅ Found: ${targetApp.name} (ID: ${targetApp.guid})`);
        }

        console.log(`   Business Criticality: ${targetApp.business_criticality}`);
        console.log(`   Created: ${targetApp.created_date}`);

        console.log('\n📊 Step 2: Getting latest SCA results...');

        // Get the latest SCA results using MCP client
        const scaResult = await client.callTool({
            tool: 'get-sca-results',
            args: {
                application: targetApp.name
            }
        });

        if (!scaResult.success || !scaResult.data) {
            console.log(`❌ No SCA findings found for ${targetApp.name}`);
            console.log('Error:', scaResult.error || 'Unknown error');
            return;
        }

        console.log(`✅ SCA Results Retrieved Successfully`);
        
        const findings = scaResult.data.detailed_findings || [];
        console.log(`\n📋 SCA Summary:`);
        console.log(`  • Total Findings: ${findings.length || 0}`);
        
        if (scaResult.data.analysis) {
            console.log(`  • Exploitable Findings: ${scaResult.data.analysis.exploitableFindings || 0}`);
            console.log(`  • High Risk Components: ${scaResult.data.analysis.highRiskComponents || 0}`);
            console.log(`  • Policy Violations: ${scaResult.data.analysis.severityBreakdown ? Object.values(scaResult.data.analysis.severityBreakdown).reduce((a, b) => a + b, 0) : 0}`);
        }
        
        // Group findings by severity
        const severityCounts = {};
        findings.forEach(finding => {
            const severity = finding.finding_details?.severity || 'Unknown';
            severityCounts[severity] = (severityCounts[severity] || 0) + 1;
        });
        
        console.log(`  • Severity Breakdown:`);
        Object.entries(severityCounts).forEach(([severity, count]) => {
            console.log(`    - ${severity}: ${count}`);
        });

        // Show first few findings with details
        if (findings.length > 0) {
            console.log(`\n🔍 Detailed SCA Findings (showing first 10):`);
            findings.slice(0, 10).forEach((finding, index) => {
                console.log(`\n${index + 1}. Component: ${finding.finding_details?.component_filename || 'Unknown'}`);
                console.log(`   Version: ${finding.finding_details?.version || 'N/A'}`);
                console.log(`   Severity: ${finding.finding_details?.severity || 'Unknown'}`);
                console.log(`   Status: ${finding.finding_status?.status || 'Unknown'}`);
                console.log(`   Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}`);
                
                if (finding.finding_details?.cve) {
                    console.log(`   CVE: ${finding.finding_details.cve.name || 'N/A'}`);
                    console.log(`   CVSS: ${finding.finding_details.cve.cvss || 'N/A'}`);
                }
            });
        }

        console.log(`\n✅ SCA analysis completed for "${targetApp.name}"`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

getSCAResults();
