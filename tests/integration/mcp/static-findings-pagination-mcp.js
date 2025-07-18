#!/usr/bin/env node

import { VeracodeDirectClient } from '../../../build/test-utils/veracode-direct-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPaginatedStaticFindings() {
    console.log('Testing Paginated Static Findings API...\n');

    // Initialize the MCP client
    const client = new VeracodeDirectClient();

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
                app_profile: app.guid,
                scan_type: 'STATIC',
                page: 0,
                size: 20,
                operation_mode: 'single_page'
            }
        });

        if (singlePageResult.success) {
            console.log(`Page ${(singlePageResult.data.pagination_info?.current_page || singlePageResult.data.current_page || 0) + 1} of ${singlePageResult.data.pagination_info?.total_pages || singlePageResult.data.total_pages || 'Unknown'}`);
            console.log(`Findings on page: ${singlePageResult.data.findings?.length || 0}`);
            console.log(`Total findings available: ${singlePageResult.data.pagination_info?.total_elements || singlePageResult.data.total_elements || singlePageResult.data.total_findings_count || 'Unknown'}`);
            console.log(`Has next page: ${singlePageResult.data.pagination_info?.has_next_page || singlePageResult.data.has_next ? 'Yes' : 'No'}`);
        }

        // Test 2: Get all STATIC findings with basic overview
        console.log('\n=== Test 2: All STATIC findings overview ===');
        const allFindingsResult = await client.callTool({
            tool: 'get-findings',
            args: {
                app_profile: app.guid,
                scan_type: 'STATIC',
                operation_mode: 'basic_overview'
            }
        });

        if (allFindingsResult.success) {
            console.log(`Total findings retrieved: ${allFindingsResult.data.findings?.length || 0}`);
            console.log(`Total findings available: ${allFindingsResult.data.total_findings_count || allFindingsResult.data.total_elements || 'Unknown'}`);
        }

        // Test 3: Basic overview with scan type filter (safer than severity filtering)
        console.log('\n=== Test 3: STATIC findings with basic overview ===');
        const staticOverviewResult = await client.callTool({
            tool: 'get-findings',
            args: {
                app_profile: app.guid,
                scan_type: 'STATIC',
                operation_mode: 'basic_overview'
            }
        });

        if (staticOverviewResult.success) {
            console.log(`STATIC findings (basic overview): ${staticOverviewResult.data.findings?.length || 0}`);
            if (staticOverviewResult.data.findings_summary) {
                console.log(`  Summary:`, staticOverviewResult.data.findings_summary);
            }
        } else {
            console.log(`Failed to get STATIC overview: ${staticOverviewResult.error || 'Unknown error'}`);
        }

        // Test 4: All findings (no status filtering)
        console.log('\n=== Test 4: All findings (no status filtering) ===');
        const allFindingsWithFilterResult = await client.callTool({
            tool: 'get-findings',
            args: {
                app_profile: app.guid,
                scan_type: 'STATIC',
                operation_mode: 'advanced_filtering'
            }
        });

        if (allFindingsWithFilterResult.success) {
            console.log(`All findings: ${allFindingsWithFilterResult.data.findings?.length || 0}`);

            // Show breakdown by status (try multiple field paths)
            if (allFindingsWithFilterResult.data.findings && allFindingsWithFilterResult.data.findings.length > 0) {
                const statusBreakdown = allFindingsWithFilterResult.data.findings.reduce((acc, f) => {
                    const status = f.status || f.remediation_status || f.finding_status?.status || 'Unknown';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});
                console.log(`  Status breakdown:`, statusBreakdown);

                // Also show severity breakdown
                const severityBreakdown = allFindingsWithFilterResult.data.findings.reduce((acc, f) => {
                    const severity = f.severity_text || f.severity || f.finding_details?.severity || 'Unknown';
                    acc[severity] = (acc[severity] || 0) + 1;
                    return acc;
                }, {});
                console.log(`  Severity breakdown:`, severityBreakdown);
            }
        }

        // Test 5: Test different page sizes
        console.log('\n=== Test 5: Different page sizes ===');

        // Small page size
        const smallPageResult = await client.callTool({
            tool: 'get-findings',
            args: {
                app_profile: app.guid,
                scan_type: 'STATIC',
                page: 0,
                size: 5,
                operation_mode: 'single_page'
            }
        });

        if (smallPageResult.success) {
            console.log(`Small page (5): ${smallPageResult.data.findings?.length || 0} findings, ${smallPageResult.data.pagination_info?.total_pages || smallPageResult.data.total_pages || 'Unknown'} total pages`);
        }

        // Large page size
        const largePageResult = await client.callTool({
            tool: 'get-findings',
            args: {
                app_profile: app.guid,
                scan_type: 'STATIC',
                page: 0,
                size: 500,
                operation_mode: 'single_page'
            }
        });

        if (largePageResult.success) {
            console.log(`Large page (500): ${largePageResult.data.findings?.length || 0} findings, ${largePageResult.data.pagination_info?.total_pages || largePageResult.data.total_pages || 'Unknown'} total pages`);
        }

        // Show example finding structure
        if (allFindingsResult.success && allFindingsResult.data.findings && allFindingsResult.data.findings.length > 0) {
            console.log('\n=== Example STATIC Finding Structure ===');
            const exampleFinding = allFindingsResult.data.findings[0];
            console.log('Finding properties:');
            console.log(`- Flaw ID: ${exampleFinding.flaw_id || exampleFinding.issue_id || 'N/A'}`);
            console.log(`- Scan Type: ${exampleFinding.scan_type || 'N/A'}`);
            console.log(`- Description: ${exampleFinding.description?.substring(0, 100) || exampleFinding.vulnerability_title?.substring(0, 100) || 'N/A'}...`);
            console.log(`- Severity: ${exampleFinding.severity || exampleFinding.severity_text || exampleFinding.severity_level || 'N/A'}`);
            console.log(`- CWE: ${exampleFinding.cwe_id || exampleFinding.weakness_type || 'N/A'}`);
            console.log(`- File: ${exampleFinding.file_path || exampleFinding.finding_details?.file_name || 'N/A'}`);
            console.log(`- Line: ${exampleFinding.line_number || exampleFinding.finding_details?.file_line_number || 'N/A'}`);
            console.log(`- Violates Policy: ${exampleFinding.violates_policy || 'N/A'}`);
            console.log(`- Status: ${exampleFinding.status || exampleFinding.remediation_status || 'N/A'}`);
            console.log(`- First Found: ${exampleFinding.first_found_date || 'N/A'}`);

            // Debug: Show all available fields
            console.log('\n=== All Available Fields (first 5) ===');
            console.log('Keys:', Object.keys(exampleFinding).slice(0, 10).join(', '));
        }

        // Test 6: Navigate through pages manually
        console.log('\n=== Test 6: Manual page navigation ===');
        const totalPages = singlePageResult.success ? Math.min(3, singlePageResult.data.total_pages || 1) : 1;

        for (let page = 0; page < totalPages; page++) {
            const pageResult = await client.callTool({
                tool: 'get-findings',
                args: {
                    app_profile: app.guid,
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
                        const sev = f.severity_text || f.severity || f.severity_level || 'Unknown';
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
