#!/usr/bin/env node

import { VeracodeClient } from '../build/veracode-rest-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function getFirst5FlawsDemo() {
    console.log('Demonstrating: Getting first 5 flaws using paginated findings API...\n');

    // Initialize the client
    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('Error: VERACODE_API_ID and VERACODE_API_KEY environment variables must be set');
        process.exit(1);
    }

    const client = new VeracodeClient(apiId, apiKey);

    try {
        // Use command line argument - application name is required
        const appName = process.argv[2];
        if (!appName) {
            console.error('Usage: node get-first-5-flaws-demo.js <application_name>');
            console.error('Example: node get-first-5-flaws-demo.js "MyApp"');
            process.exit(1);
        }

        console.log(`🔍 Searching for ${appName} application...`);
        const apps = await client.searchApplications(appName);

        if (apps.length === 0) {
            console.error(`❌ No application found with name: ${appName}`);
            console.log('\n💡 Make sure the application name is correct and you have access to it');
            process.exit(1);
        }

        const app = apps[0];
        console.log(`✅ Found application: ${app.profile.name} (${app.guid})`);
        console.log(`   Business Criticality: ${app.profile.business_criticality}`);

        // Method 1: Get first 5 using small page size
        console.log('\n📊 Method 1: Getting exactly 5 findings using page size...');
        const method1Result = await client.getFindingsPaginated(app.guid, {
            page: 0,
            size: 5
        });

        console.log(`   Total findings available: ${method1Result.pagination.total_elements}`);
        console.log(`   Retrieved: ${method1Result.findings.length} findings`);

        // Method 2: Get first page with default size, then slice to 5
        console.log('\n📊 Method 2: Getting first page and taking first 5...');
        const method2Result = await client.getFindingsPaginated(app.guid, {
            page: 0,
            size: 100 // Get more, then we'll slice
        });

        const first5Method2 = method2Result.findings.slice(0, 5);
        console.log(`   Total findings available: ${method2Result.pagination.total_elements}`);
        console.log(`   Retrieved: ${first5Method2.length} findings (from ${method2Result.findings.length} on page)`);

        // Method 3: Get all findings with pagination, then take first 5
        console.log('\n📊 Method 3: Using getAllFindings with maxPages=1...');
        const method3Result = await client.getAllFindings(app.guid, {
            pageSize: 100,
            maxPages: 1
        });

        const first5Method3 = method3Result.findings.slice(0, 5);
        console.log(`   Total findings available: ${method3Result.totalElements}`);
        console.log(`   Retrieved: ${first5Method3.length} findings (from ${method3Result.findings.length} total)`);

        // Use Method 1 results for detailed display
        const first5Findings = method1Result.findings;

        if (first5Findings.length === 0) {
            console.log('\n⚠️  No findings found for this application');
            return;
        }

        console.log(`\n🔍 First ${first5Findings.length} Flaws from ${app.profile.name}:\n`);

        first5Findings.forEach((finding, index) => {
            console.log(`${index + 1}. ${'-'.repeat(60)}`);
            console.log(`   Issue ID: ${finding.issue_id}`);
            console.log(`   Scan Type: ${finding.scan_type}`);
            console.log(`   Severity: ${finding.finding_details?.severity || 'N/A'}`);
            console.log(`   Status: ${finding.finding_status?.status}`);
            console.log(`   Violates Policy: ${finding.violates_policy ? 'Yes' : 'No'}`);

            if (finding.finding_details?.cwe) {
                console.log(`   CWE: ${finding.finding_details.cwe.id} - ${finding.finding_details.cwe.name}`);
            }

            // Static analysis specific details
            if (finding.scan_type === 'STATIC' && finding.finding_details) {
                if (finding.finding_details.file_name) {
                    console.log(`   File: ${finding.finding_details.file_name}`);
                }
                if (finding.finding_details.file_line_number) {
                    console.log(`   Line: ${finding.finding_details.file_line_number}`);
                }
                if (finding.finding_details.procedure) {
                    console.log(`   Function: ${finding.finding_details.procedure}`);
                }
            }

            // SCA specific details
            if (finding.scan_type === 'SCA' && finding.finding_details) {
                if (finding.finding_details.component_filename) {
                    console.log(`   Component: ${finding.finding_details.component_filename}`);
                }
                if (finding.finding_details.version) {
                    console.log(`   Version: ${finding.finding_details.version}`);
                }
                if (finding.finding_details.cve?.name) {
                    console.log(`   CVE: ${finding.finding_details.cve.name}`);
                    if (finding.finding_details.cve.cvss) {
                        console.log(`   CVSS: ${finding.finding_details.cve.cvss}`);
                    }
                }
            }

            console.log(`   Description: ${finding.description?.substring(0, 150)}${finding.description?.length > 150 ? '...' : ''}`);

            if (finding.finding_status?.first_found_date) {
                console.log(`   First Found: ${new Date(finding.finding_status.first_found_date).toLocaleDateString()}`);
            }

            console.log('');
        });

        // Show how to get the next 5 flaws
        if (method1Result.pagination.has_next) {
            console.log(`\n➡️  Getting Next 5 Flaws:`);
            console.log(`   To get the next 5 flaws, use: page: ${method1Result.pagination.current_page + 1}, size: 5`);

            // Demonstrate getting the next 5
            console.log('\n📊 Demonstrating next 5 flaws...');
            const next5Result = await client.getFindingsPaginated(app.guid, {
                page: 1,
                size: 5
            });

            console.log(`   Next 5 findings (${next5Result.findings.length} retrieved):`);
            next5Result.findings.forEach((finding, index) => {
                console.log(`   ${index + 6}. Issue ${finding.issue_id} - ${finding.scan_type} - Severity ${finding.finding_details?.severity}`);
            });
        }

        // Show pagination summary
        console.log(`\n📄 Pagination Summary:`);
        console.log(`   Total findings: ${method1Result.pagination.total_elements}`);
        console.log(`   Total pages (with size=5): ${method1Result.pagination.total_pages}`);
        console.log(`   Current page: ${method1Result.pagination.current_page + 1}`);
        console.log(`   Findings per page: 5`);
        console.log(`   Has more pages: ${method1Result.pagination.has_next ? 'Yes' : 'No'}`);

        console.log('\n✅ Successfully demonstrated paginated flaw retrieval!');

    } catch (error) {
        console.error('❌ Error retrieving flaws:', error.message);
        if (error.message.includes('404')) {
            console.error('   This might mean the application has no scan results or findings.');
        }
        process.exit(1);
    }
}

// Run the function
getFirst5FlawsDemo().catch(console.error);
