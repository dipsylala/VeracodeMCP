#!/usr/bin/env node

/**
 * Test SCA functionality against verademo-net with updated API credentials
 */

import { VeracodeMCPClient } from '../../../build/veracode-mcp-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testVeraDemoNet() {
    const client = new VeracodeMCPClient();
    const appName = 'verademo-net';

    console.log(`🔍 Testing SCA functionality against ${appName}`);
    console.log('='.repeat(60));

    try {
        // 1. Find the application
        console.log('\n1. Searching for verademo-net application...');
        const searchResult = await client.callTool({
            tool: 'search-application-profiles',
            args: { name: appName }
        });

        if (!searchResult.success || !searchResult.data.application_profiles || searchResult.data.application_profiles.length === 0) {
            console.log(`❌ Application "${appName}" not found`);
            console.log('\nTrying case variations...');

            // Try different case variations
            const variations = ['VeraDemo-Net', 'VERADEMO-NET', 'verademo', 'VeraDemo'];
            for (const variation of variations) {
                console.log(`Trying: ${variation}`);
                const altResult = await client.callTool({
                    tool: 'search-application-profiles',
                    args: { name: variation }
                });
                if (altResult.success && altResult.data.application_profiles && altResult.data.application_profiles.length > 0) {
                    console.log(`✅ Found application with name variation: ${variation}`);
                    altResult.data.application_profiles.forEach((app, index) => {
                        console.log(`  ${index + 1}. ${app.name} (ID: ${app.guid})`);
                    });
                }
            }
            return;
        }

        console.log(`✅ Found ${searchResult.data.application_profiles.length} matching application(s):`);
        searchResult.data.application_profiles.forEach((app, index) => {
            console.log(`  ${index + 1}. ${app.name} (ID: ${app.guid})`);
        });

        const app = searchResult.data.application_profiles[0];
        console.log(`\nUsing: ${app.name} (ID: ${app.guid})`);

        // 2. Check available scan types via application details
        console.log('\n2. Getting application details...');
        const appDetailsResult = await client.callTool({
            tool: 'get-application-profile-details',
            args: { app_profile: app.guid }
        });

        if (appDetailsResult.success) {
            console.log(`Application details retrieved successfully`);
        }

        // 3. Test SCA findings specifically
        console.log('\n3. Testing SCA findings...');
        try {
            const scaResults = await client.callTool({
                tool: 'get-findings',
                args: {
                    application: app.guid,
                    scan_type: 'SCA',
                    size: 50,
                    operation_mode: 'single_page'
                }
            });

            console.log(`✅ SCA API call successful`);
            console.log(`Found ${scaResults?.findings?.length || 0} SCA findings`);

            if (scaResults?.findings && scaResults.findings.length > 0) {
                console.log('\n🎯 TRUE SCA FINDINGS DETECTED!');
                console.log('-'.repeat(40));

                scaResults.findings.slice(0, 3).forEach((finding, index) => {
                    console.log(`\nSCA Finding ${index + 1}:`);
                    console.log(`  Description: ${finding.description?.substring(0, 100)}...`);
                    console.log(`  Scan Type: ${finding.scan_type}`);
                    console.log(`  Severity: ${finding.finding_details?.severity || 'N/A'}`);

                    // Check SCA-specific properties
                    const details = finding.finding_details;
                    if (details) {
                        console.log(`  Component ID: ${details.component_id || 'N/A'}`);
                        console.log(`  Component Filename: ${details.component_filename || 'N/A'}`);
                        console.log(`  CVE: ${details.cve?.name || 'N/A'}`);
                        console.log(`  CVSS Score: ${details.cve?.cvss || 'N/A'}`);
                        console.log(`  Version: ${details.version || 'N/A'}`);
                        console.log(`  Language: ${details.language || 'N/A'}`);

                        if (details.licenses && details.licenses.length > 0) {
                            console.log(`  Licenses: ${details.licenses.map(l => l.license_id).join(', ')}`);
                        }

                        if (details.cve?.exploitability) {
                            console.log(`  Exploitability: ${JSON.stringify(details.cve.exploitability, null, 2)}`);
                        }
                    }
                });

                // Test our SCA tools
                console.log('\n4. Testing MCP SCA tools...');

                // Test get-sca-results
                console.log('\n4a. Testing get-sca-results tool...');
                const toolResponse = await testScaTool('get-sca-results', app.profile.name);
                console.log(`get-sca-results result: ${toolResponse ? 'SUCCESS' : 'FAILED'}`);

                // Test get-sca-summary
                console.log('\n4b. Testing get-sca-summary tool...');
                const summaryResponse = await testScaTool('get-sca-summary', app.profile.name);
                console.log(`get-sca-summary result: ${summaryResponse ? 'SUCCESS' : 'FAILED'}`);

            } else {
                console.log('❌ No SCA findings found');

                // Check if there are any findings at all
                console.log('\n3b. Checking for any findings (no scan type filter)...');
                const allFindings = await client.findings.getFindingsPaginated(app.guid, {
                    size: 50
                });

                if (allFindings?.findings) {
                    console.log(`Found ${allFindings.findings.length} total findings`);

                    const scanTypes = [...new Set(allFindings.findings.map(f => f.scan_type))];
                    console.log(`Scan types in findings: ${scanTypes.join(', ')}`);

                    // Look for any component-related findings
                    const componentFindings = allFindings.findings.filter(f => {
                        const desc = (f.description || '').toLowerCase();
                        return desc.includes('component') || desc.includes('library') ||
                            desc.includes('dependency') || desc.includes('cve') ||
                            f.finding_details?.component_id || f.finding_details?.cve;
                    });

                    console.log(`Component-related findings: ${componentFindings.length}`);
                } else {
                    console.log('No findings found at all');
                }
            }

        } catch (scaError) {
            console.log(`❌ SCA Error: ${scaError.message}`);
            if (scaError.response) {
                console.log(`Status: ${scaError.response.status}`);
                console.log(`Data: ${JSON.stringify(scaError.response.data, null, 2)}`);
            }
        }

    } catch (error) {
        console.error('❌ Error during test:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Helper function to test SCA tools
async function testScaTool(toolName, appName) {
    try {
        // Import the tool registry dynamically
        const { createSCATools } = await import('../build/tools/sca.tools.js');
        const { VeracodeClient } = await import('../build/veracode/index.js');

        const client = new VeracodeClient();
        const scaTools = createSCATools();
        const tool = scaTools.find(t => t.name === toolName);

        if (!tool) {
            console.log(`Tool ${toolName} not found`);
            return false;
        }

        const context = { veracodeClient: client };
        const result = await tool.handler({ application: appName }, context);

        console.log(`${toolName} response:`, {
            success: result.success,
            dataLength: result.data ? Object.keys(result.data).length : 0,
            error: result.error
        });

        return result.success;
    } catch (toolError) {
        console.log(`Error testing ${toolName}: ${toolError.message}`);
        return false;
    }
}

// Run the test
testVeraDemoNet().catch(console.error);
