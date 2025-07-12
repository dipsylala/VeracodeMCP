#!/usr/bin/env node

import { VeracodeClient } from '../build/veracode-rest-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testFindingsAvailability() {
    console.log('Testing Findings Availability...\n');

    // Initialize the client
    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('Error: VERACODE_API_ID and VERACODE_API_KEY environment variables must be set');
        process.exit(1);
    }

    const client = new VeracodeClient(apiId, apiKey);

    try {
        // Get first few applications
        const apps = await client.getApplications();
        console.log(`Found ${apps.length} applications`);

        // Test each application for findings
        for (let i = 0; i < Math.min(5, apps.length); i++) {
            const app = apps[i];
            console.log(`\n=== Testing ${app.profile.name} (${app.guid}) ===`);

            try {
                // Test STATIC findings
                const staticResult = await client.getFindingsPaginated(app.guid, {
                    scanType: 'STATIC',
                    page: 0,
                    size: 10
                });
                console.log(`STATIC findings: ${staticResult.findings.length} on page, ${staticResult.pagination.total_elements} total`);

                // Test DYNAMIC findings
                const dynamicResult = await client.getFindingsPaginated(app.guid, {
                    scanType: 'DYNAMIC',
                    page: 0,
                    size: 10
                });
                console.log(`DYNAMIC findings: ${dynamicResult.findings.length} on page, ${dynamicResult.pagination.total_elements} total`);

                // Test SCA findings
                const scaResult = await client.getFindingsPaginated(app.guid, {
                    scanType: 'SCA',
                    page: 0,
                    size: 10
                });
                console.log(`SCA findings: ${scaResult.findings.length} on page, ${scaResult.pagination.total_elements} total`);

                // Test ALL findings
                const allResult = await client.getFindingsPaginated(app.guid, {
                    page: 0,
                    size: 10
                });
                console.log(`ALL findings: ${allResult.findings.length} on page, ${allResult.pagination.total_elements} total`);

                // If we found findings, demonstrate pagination
                if (allResult.pagination.total_elements > 0) {
                    console.log(`\n🎯 Found app with findings: ${app.profile.name}`);
                    console.log('Testing pagination with this app...');

                    const paginatedTest = await client.getAllFindings(app.guid, {
                        pageSize: 100,
                        maxPages: 3
                    });

                    console.log(`Retrieved ${paginatedTest.findings.length} findings across ${paginatedTest.pagesRetrieved} pages`);
                    console.log(`Total available: ${paginatedTest.totalElements}, Total pages: ${paginatedTest.totalPages}`);

                    if (paginatedTest.findings.length > 0) {
                        const finding = paginatedTest.findings[0];
                        console.log('\nExample finding:');
                        console.log(`- Scan type: ${finding.scan_type}`);
                        console.log(`- Description: ${finding.description?.substring(0, 100)}...`);
                        console.log(`- Severity: ${finding.finding_details?.severity}`);
                        console.log(`- Violates policy: ${finding.violates_policy}`);
                        console.log(`- Status: ${finding.finding_status?.status}`);
                    }

                    // Stop after finding a good example
                    break;
                }

            } catch (error) {
                console.log(`Error testing ${app.profile.name}: ${error.message}`);
            }
        }

        console.log('\n✅ Findings availability test completed!');

    } catch (error) {
        console.error('❌ Error during testing:', error.message);
        process.exit(1);
    }
}

// Run the test
testFindingsAvailability().catch(console.error);
