#!/usr/bin/env node

/**
 * Capture raw REST API response for SCA scan type query against Findings endpoint
 */

import { VeracodeClient } from '../../../build/veracode/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function captureScaRestOutput() {
    const client = new VeracodeClient();
    const appName = 'MCPVerademo-Net'; // Using the app we know exists

    console.log(`🔍 Capturing REST API output for SCA query against ${appName}`);
    console.log('='.repeat(70));

    try {
        // 1. Find the application
        console.log('\n1. Finding application...');
        const searchResults = await client.applications.searchApplications(appName);
        const app = searchResults[0];

        console.log(`✅ Application: ${app.profile.name} (ID: ${app.guid})`);

        // 2. Capture raw REST API response for SCA query
        console.log('\n2. Making SCA Findings API request...');
        console.log(`📡 GET /appsec/v2/applications/${app.guid}/findings?scan_type=SCA&size=10`);
        console.log('-'.repeat(70));

        try {
            // Use the proper getFindingsPaginated method which handles authentication correctly
            // But capture the raw response by intercepting at a lower level
            const findingsService = client.findings;

            console.log(`🌐 API Base URL: ${findingsService.apiClient.defaults.baseURL}`);
            console.log(`📋 Request: GET /appsec/v2/applications/${app.guid}/findings?scan_type=SCA&size=10`);

            // Make the API call using our working method
            const response = await findingsService.getFindingsPaginated(app.guid, {
                scan_type: 'SCA',
                size: 10
            });

            console.log('\n📨 REST API RESPONSE (via getFindingsPaginated):');
            console.log('='.repeat(70));

            // Show the processed response structure
            console.log('\n📊 PROCESSED RESPONSE:');
            console.log(`Number of findings: ${response.findings?.length || 0}`);
            console.log(`Pagination:`, JSON.stringify(response.pagination, null, 2));

            if (response.findings && response.findings.length > 0) {
                console.log('\n📋 FIRST FINDING (COMPLETE STRUCTURE):');
                console.log(JSON.stringify(response.findings[0], null, 2));

                console.log('\n🔬 FINDING ANALYSIS:');
                const firstFinding = response.findings[0];
                console.log(`scan_type: "${firstFinding.scan_type}"`);
                console.log(`Has finding_details: ${!!firstFinding.finding_details}`);

                if (firstFinding.finding_details) {
                    console.log('\n🧬 FINDING_DETAILS STRUCTURE:');
                    console.log(`finding_details keys: ${Object.keys(firstFinding.finding_details).join(', ')}`);
                    console.log('\nComplete finding_details:');
                    console.log(JSON.stringify(firstFinding.finding_details, null, 2));

                    // Check for SCA-specific properties according to Swagger spec
                    const scaProps = ['component_id', 'component_filename', 'cve', 'licenses', 'version', 'product_id', 'language', 'component_path'];
                    console.log('\n🎯 SCA PROPERTY CHECK (per Swagger spec):');
                    scaProps.forEach(prop => {
                        const hasProperty = firstFinding.finding_details.hasOwnProperty(prop);
                        const value = firstFinding.finding_details[prop];
                        console.log(`  ${hasProperty ? '✅' : '❌'} ${prop}: ${hasProperty ? (value ? JSON.stringify(value) : 'null/empty') : 'missing'}`);
                    });
                }

                // Show all findings scan types
                console.log('\n📊 ALL FINDINGS SCAN TYPES:');
                const scanTypes = {};
                response.findings.forEach(f => {
                    scanTypes[f.scan_type] = (scanTypes[f.scan_type] || 0) + 1;
                });
                Object.entries(scanTypes).forEach(([type, count]) => {
                    console.log(`  ${type}: ${count} findings`);
                });
            } else {
                console.log('\n❌ NO FINDINGS RETURNED');
                console.log('This means the API request succeeded but no SCA findings exist for this application');
            }

        } catch (apiError) {
            console.log('\n❌ API ERROR RESPONSE:');
            console.log('='.repeat(70));
            console.log(`Status Code: ${apiError.response?.status || 'N/A'}`);
            console.log(`Status Text: ${apiError.response?.statusText || 'N/A'}`);

            if (apiError.response?.headers) {
                console.log('\n🔗 ERROR RESPONSE HEADERS:');
                console.log(JSON.stringify(apiError.response.headers, null, 2));
            }

            if (apiError.response?.data) {
                console.log('\n📄 ERROR RESPONSE BODY:');
                console.log(JSON.stringify(apiError.response.data, null, 2));
            }

            console.log(`\n📝 Error Message: ${apiError.message}`);
        }

        // 3. Also capture what happens when we request all findings (no scan_type filter)
        console.log('\n\n3. Comparing with ALL findings request (no scan_type filter)...');
        console.log(`📡 GET /appsec/v2/applications/${app.guid}/findings?size=5`);
        console.log('-'.repeat(70));

        try {
            const allFindingsResponse = await client.findings.getFindingsPaginated(app.guid, {
                size: 5
            });

            console.log('\n📨 ALL FINDINGS RESPONSE (FIRST 5):');
            console.log(`Number of findings: ${allFindingsResponse.findings?.length || 0}`);
            console.log(`Pagination:`, JSON.stringify(allFindingsResponse.pagination, null, 2));

            if (allFindingsResponse.findings?.length > 0) {
                console.log('\n📊 SCAN TYPE BREAKDOWN:');
                const scanTypes = {};
                allFindingsResponse.findings.forEach(f => {
                    scanTypes[f.scan_type] = (scanTypes[f.scan_type] || 0) + 1;
                });
                Object.entries(scanTypes).forEach(([type, count]) => {
                    console.log(`  ${type}: ${count} findings`);
                });

                console.log('\n📋 SAMPLE FINDING FROM ALL FINDINGS:');
                console.log(JSON.stringify(allFindingsResponse.findings[0], null, 2));
            }

        } catch (allFindingsError) {
            console.log(`❌ Error getting all findings: ${allFindingsError.message}`);
        }

    } catch (error) {
        console.error('❌ General Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run the capture
captureScaRestOutput().catch(console.error);
