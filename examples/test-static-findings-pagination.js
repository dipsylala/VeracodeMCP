#!/usr/bin/env node

import { VeracodeClient } from '../build/veracode-rest-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPaginatedStaticFindings() {
    console.log('Testing Paginated Static Findings API...\n');

    // Initialize the client
    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('Error: VERACODE_API_ID and VERACODE_API_KEY environment variables must be set');
        process.exit(1);
    }

    const client = new VeracodeClient(apiId, apiKey);

    try {
        // Test with any application that has static findings
        const appName = process.argv[2];
        if (!appName) {
            console.error('Usage: node test-static-findings-pagination.js <application_name>');
            console.error('Example: node test-static-findings-pagination.js "MyApp"');
            process.exit(1);
        }
        console.log(`Testing paginated static findings for application: ${appName}`);

        // Search for the application
        const apps = await client.searchApplications(appName);
        if (apps.length === 0) {
            console.error(`No application found with name: ${appName}`);
            process.exit(1);
        }

        const app = apps[0];
        console.log(`Using application: ${app.profile.name} (${app.guid})`);

        // Test 1: Get first page of STATIC findings
        console.log('\n=== Test 1: Single page of STATIC findings ===');
        const singlePageResult = await client.getFindingsPaginated(app.guid, {
            scanType: 'STATIC',
            page: 0,
            size: 20
        });

        console.log(`Page ${singlePageResult.pagination.current_page + 1} of ${singlePageResult.pagination.total_pages}`);
        console.log(`Findings on page: ${singlePageResult.findings.length}`);
        console.log(`Total findings available: ${singlePageResult.pagination.total_elements}`);
        console.log(`Has next page: ${singlePageResult.pagination.has_next}`);

        // Test 2: Get all STATIC findings with automatic pagination
        console.log('\n=== Test 2: All STATIC findings with pagination ===');
        const allFindingsResult = await client.getAllFindings(app.guid, {
            scanType: 'STATIC',
            pageSize: 50,
            maxPages: 5 // Limit for testing
        });

        console.log(`Total findings retrieved: ${allFindingsResult.findings.length}`);
        console.log(`Total findings available: ${allFindingsResult.totalElements}`);
        console.log(`Pages retrieved: ${allFindingsResult.pagesRetrieved}`);
        console.log(`Total pages available: ${allFindingsResult.totalPages}`);
        console.log(`Data truncated: ${allFindingsResult.truncated}`);

        // Test 3: High severity findings only
        console.log('\n=== Test 3: High severity STATIC findings only ===');
        const highSeverityResult = await client.getAllFindings(app.guid, {
            scanType: 'STATIC',
            severityGte: 4,
            pageSize: 100,
            maxPages: 3
        });

        console.log(`High severity findings: ${highSeverityResult.findings.length}`);
        console.log(`Pages retrieved: ${highSeverityResult.pagesRetrieved}`);

        // Test 4: Policy violations only
        console.log('\n=== Test 4: Policy violations only ===');
        const policyViolationsResult = await client.getAllFindings(app.guid, {
            scanType: 'STATIC',
            policyViolation: true,
            pageSize: 100,
            maxPages: 3
        });

        console.log(`Policy violation findings: ${policyViolationsResult.findings.length}`);
        console.log(`Pages retrieved: ${policyViolationsResult.pagesRetrieved}`);

        // Test 5: Test different page sizes
        console.log('\n=== Test 5: Different page sizes ===');

        // Small page size
        const smallPageResult = await client.getFindingsPaginated(app.guid, {
            scanType: 'STATIC',
            page: 0,
            size: 5
        });
        console.log(`Small page (5): ${smallPageResult.findings.length} findings, ${smallPageResult.pagination.total_pages} total pages`);

        // Large page size
        const largePageResult = await client.getFindingsPaginated(app.guid, {
            scanType: 'STATIC',
            page: 0,
            size: 500
        });
        console.log(`Large page (500): ${largePageResult.findings.length} findings, ${largePageResult.pagination.total_pages} total pages`);

        // Show example finding structure
        if (allFindingsResult.findings.length > 0) {
            console.log('\n=== Example STATIC Finding Structure ===');
            const exampleFinding = allFindingsResult.findings[0];
            console.log('Finding properties:');
            console.log(`- ID: ${exampleFinding.issue_id}`);
            console.log(`- Scan Type: ${exampleFinding.scan_type}`);
            console.log(`- Description: ${exampleFinding.description?.substring(0, 100)}...`);
            console.log(`- Severity: ${exampleFinding.finding_details?.severity}`);
            console.log(`- CWE: ${exampleFinding.finding_details?.cwe?.id} - ${exampleFinding.finding_details?.cwe?.name}`);
            console.log(`- File: ${exampleFinding.finding_details?.file_name}`);
            console.log(`- Line: ${exampleFinding.finding_details?.file_line_number}`);
            console.log(`- Violates Policy: ${exampleFinding.violates_policy}`);
            console.log(`- Status: ${exampleFinding.finding_status?.status}`);
            console.log(`- First Found: ${exampleFinding.finding_status?.first_found_date}`);
        }

        // Test 6: Navigate through pages manually
        console.log('\n=== Test 6: Manual page navigation ===');
        for (let page = 0; page < Math.min(3, singlePageResult.pagination.total_pages); page++) {
            const pageResult = await client.getFindingsPaginated(app.guid, {
                scanType: 'STATIC',
                page: page,
                size: 10
            });
            console.log(`Page ${page + 1}: ${pageResult.findings.length} findings`);

            if (pageResult.findings.length > 0) {
                const severityCount = pageResult.findings.reduce((acc, f) => {
                    const sev = f.finding_details?.severity || 0;
                    acc[sev] = (acc[sev] || 0) + 1;
                    return acc;
                }, {});
                console.log(`  Severity breakdown:`, severityCount);
            }
        }

        console.log('\n✅ Paginated static findings test completed successfully!');

    } catch (error) {
        console.error('❌ Error during testing:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the test
testPaginatedStaticFindings().catch(console.error);
