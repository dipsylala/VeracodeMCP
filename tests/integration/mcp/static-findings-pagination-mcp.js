#!/usr/bin/env node

import { VeracodeMCPClient } from '../../../build/veracode-mcp-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPaginatedStaticFindings() {
    console.log('Testing Paginated Static Findings API...\n');

    // Initialize the MCP client
    const client = new VeracodeMCPClient();

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
        const appsResult = await client.callTool({
            tool: 'search-application-profiles',
            args: { name: appName }
        });
        
        if (!appsResult.success || !appsResult.data.application_profiles || appsResult.data.application_profiles.length === 0) {
            console.error(`No application found with name: ${appName}`);
            process.exit(1);
        }

        const app = appsResult.data.application_profiles[0];
        console.log(`Using application: ${app.name} (${app.guid})`);

        // Test 1: Get first page of STATIC findings
        console.log('\n=== Test 1: Single page of STATIC findings ===');
        const singlePageResult = await client.callTool({
            tool: 'get-findings',
            args: {
                application: app.guid,
                scan_type: 'STATIC',
                page: 0,
                size: 20,
                operation_mode: 'single_page'
            }
        });

        if (singlePageResult.success) {
            console.log(`Page ${(singlePageResult.data.current_page || 0) + 1} of ${singlePageResult.data.total_pages || 'Unknown'}`);
            console.log(`Findings on page: ${singlePageResult.data.findings?.length || 0}`);
            console.log(`Total findings available: ${singlePageResult.data.total_elements || 'Unknown'}`);
            console.log(`Has next page: ${singlePageResult.data.has_next ? 'Yes' : 'No'}`);
        }

        // Test 2: Get all STATIC findings with basic overview
        console.log('\n=== Test 2: All STATIC findings overview ===');
        const allFindingsResult = await client.callTool({
            tool: 'get-findings',
            args: {
                application: app.guid,
                scan_type: 'STATIC',
                operation_mode: 'basic_overview'
            }
        });

        if (allFindingsResult.success) {
            console.log(`Total findings retrieved: ${allFindingsResult.data.findings?.length || 0}`);
            console.log(`Total findings available: ${allFindingsResult.data.total_elements || 'Unknown'}`);
        }

        // Test 3: High severity findings only
        console.log('\n=== Test 3: High severity STATIC findings only ===');
        const highSeverityResult = await client.callTool({
            tool: 'get-findings',
            args: {
                application: app.guid,
                scan_type: 'STATIC',
                severity: ['Very High', 'High'],
                operation_mode: 'advanced_filtering'
            }
        });

        if (highSeverityResult.success) {
            console.log(`High severity findings: ${highSeverityResult.data.findings?.length || 0}`);
        }

        // Test 4: Policy violations only (using status filtering)
        console.log('\n=== Test 4: Open findings (unresolved) ===');
        const openFindingsResult = await client.callTool({
            tool: 'get-findings',
            args: {
                application: app.guid,
                scan_type: 'STATIC',
                status: ['NEW', 'OPEN'],
                operation_mode: 'advanced_filtering'
            }
        });

        if (openFindingsResult.success) {
            console.log(`Open findings: ${openFindingsResult.data.findings?.length || 0}`);
        }

        // Test 5: Test different page sizes
        console.log('\n=== Test 5: Different page sizes ===');

        // Small page size
        const smallPageResult = await client.callTool({
            tool: 'get-findings',
            args: {
                application: app.guid,
                scan_type: 'STATIC',
                page: 0,
                size: 5,
                operation_mode: 'single_page'
            }
        });
        
        if (smallPageResult.success) {
            console.log(`Small page (5): ${smallPageResult.data.findings?.length || 0} findings, ${smallPageResult.data.total_pages || 'Unknown'} total pages`);
        }

        // Large page size
        const largePageResult = await client.callTool({
            tool: 'get-findings',
            args: {
                application: app.guid,
                scan_type: 'STATIC',
                page: 0,
                size: 500,
                operation_mode: 'single_page'
            }
        });
        
        if (largePageResult.success) {
            console.log(`Large page (500): ${largePageResult.data.findings?.length || 0} findings, ${largePageResult.data.total_pages || 'Unknown'} total pages`);
        }

        // Show example finding structure
        if (allFindingsResult.success && allFindingsResult.data.findings && allFindingsResult.data.findings.length > 0) {
            console.log('\n=== Example STATIC Finding Structure ===');
            const exampleFinding = allFindingsResult.data.findings[0];
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
        const totalPages = singlePageResult.success ? Math.min(3, singlePageResult.data.total_pages || 1) : 1;
        
        for (let page = 0; page < totalPages; page++) {
            const pageResult = await client.callTool({
                tool: 'get-findings',
                args: {
                    application: app.guid,
                    scan_type: 'STATIC',
                    page: page,
                    size: 10,
                    operation_mode: 'single_page'
                }
            });
            
            if (pageResult.success) {
                console.log(`Page ${page + 1}: ${pageResult.data.findings?.length || 0} findings`);

                if (pageResult.data.findings && pageResult.data.findings.length > 0) {
                    const severityCount = pageResult.data.findings.reduce((acc, f) => {
                        const sev = f.finding_details?.severity || 'Unknown';
                        acc[sev] = (acc[sev] || 0) + 1;
                        return acc;
                    }, {});
                    console.log(`  Severity breakdown:`, severityCount);
                }
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
