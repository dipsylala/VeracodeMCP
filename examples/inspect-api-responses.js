#!/usr/bin/env node

import { VeracodeClient } from '../build/veracode-rest-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function inspectApiResponses() {
    console.log('Inspecting raw Veracode API responses...\n');

    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('Error: VERACODE_API_ID and VERACODE_API_KEY environment variables must be set');
        process.exit(1);
    }

    const client = new VeracodeClient(apiId, apiKey);

    try {
        // Get an application with findings to inspect
        console.log('🔍 Finding application with findings...');
        const apps = await client.getApplications();

        if (apps.length === 0) {
            console.error('❌ No applications found');
            return;
        }

        // Try to find an app with findings
        let testApp = null;
        for (const app of apps.slice(0, 5)) { // Check first 5 apps
            try {
                const findings = await client.getFindingsPaginated(app.guid, {
                    page: 0,
                    size: 1
                });
                if (findings.findings.length > 0) {
                    testApp = app;
                    console.log(`✅ Using app: ${app.profile.name} (${app.guid})`);
                    console.log(`   Has ${findings.pagination.total_elements} findings\n`);
                    break;
                }
            } catch (error) {
                // Skip this app if no findings
                continue;
            }
        }

        if (!testApp) {
            console.error('❌ No applications with findings found in first 5 apps');
            return;
        }

        // Get a single finding to inspect
        console.log('📊 Getting raw finding data...');
        const findingsResult = await client.getFindingsPaginated(testApp.guid, {
            page: 0,
            size: 1
        });

        if (findingsResult.findings.length === 0) {
            console.error('❌ No findings returned');
            return;
        }

        const finding = findingsResult.findings[0];

        console.log('🔍 Raw Finding Structure:');
        console.log('=' * 60);
        console.log(JSON.stringify(finding, null, 2));

        console.log('\n🔍 Description Field Analysis:');
        console.log('=' * 60);
        console.log('Raw description:');
        console.log(finding.description);

        console.log('\nDescription type:', typeof finding.description);
        console.log('Description length:', finding.description?.length || 0);

        // Check if it contains HTML
        const hasHtmlTags = /<[^>]*>/g.test(finding.description || '');
        console.log('Contains HTML tags:', hasHtmlTags);

        if (hasHtmlTags) {
            console.log('\n⚠️  HTML DETECTED in description!');
            console.log('HTML tags found:', (finding.description || '').match(/<[^>]*>/g));

            // Try to strip HTML and see clean version
            const cleanDescription = (finding.description || '').replace(/<[^>]*>/g, '').trim();
            console.log('\nClean description (HTML stripped):');
            console.log(cleanDescription);
        } else {
            console.log('\n✅ No HTML tags detected');
        }

        // Check other potentially problematic fields
        console.log('\n🔍 Other Field Analysis:');
        console.log('=' * 60);

        const fieldsToCheck = [
            'finding_details.attack_vector',
            'finding_details.cwe.name',
            'finding_details.file_name',
            'finding_details.file_path'
        ];

        fieldsToCheck.forEach(fieldPath => {
            const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], finding);
            if (value) {
                const hasHtml = /<[^>]*>/g.test(value);
                console.log(`${fieldPath}: ${hasHtml ? '⚠️  Contains HTML' : '✅ Clean'}`);
                if (hasHtml) {
                    console.log(`  Raw: ${value}`);
                    console.log(`  Clean: ${value.replace(/<[^>]*>/g, '').trim()}`);
                }
            }
        });

        // Check the raw API endpoint being called
        console.log('\n🔍 API Endpoint Information:');
        console.log('=' * 60);
        console.log('Findings API endpoint: /appsec/v2/applications/{guid}/findings');
        console.log('API should return JSON, not HTML');
        console.log('If HTML is present, it might be:');
        console.log('1. Embedded HTML in the vulnerability description');
        console.log('2. Rich text formatting from Veracode');
        console.log('3. User-added comments with HTML');
        console.log('4. API response format issue');

        // Test if this is coming from specific scan types
        console.log('\n🔍 Scan Type Analysis:');
        console.log('=' * 60);
        console.log(`Finding scan type: ${finding.scan_type}`);
        console.log(`Finding issue ID: ${finding.issue_id}`);

        // Get a few more findings to see if this is consistent
        const moreFindingsResult = await client.getFindingsPaginated(testApp.guid, {
            page: 0,
            size: 5
        });

        let htmlCount = 0;
        let totalCount = moreFindingsResult.findings.length;

        moreFindingsResult.findings.forEach((f, index) => {
            const hasHtml = /<[^>]*>/g.test(f.description || '');
            if (hasHtml) {
                htmlCount++;
                console.log(`Finding ${index + 1}: Contains HTML (${f.scan_type})`);
            } else {
                console.log(`Finding ${index + 1}: Clean text (${f.scan_type})`);
            }
        });

        console.log(`\n📊 Summary: ${htmlCount}/${totalCount} findings contain HTML`);

        if (htmlCount > 0) {
            console.log('\n💡 Recommendation: Add HTML stripping to the MCP client response mapping');
            console.log('   This will ensure clean text is returned to users');
        }

    } catch (error) {
        console.error('❌ Error inspecting API responses:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the inspection
inspectApiResponses().catch(console.error);
