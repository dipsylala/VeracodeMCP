#!/usr/bin/env node

import { VeracodeClient } from '../build/veracode-client.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function findApplicationsWithSCA() {
    // Optional filter from command line arguments
    const nameFilter = process.argv[2];

    if (nameFilter) {
        console.log(`🔍 Finding applications with SCA scans matching "${nameFilter}"...\n`);
    } else {
        console.log('🔍 Finding all applications with SCA scans...\n');
        console.log('💡 Tip: You can filter by name using: node find-sca-apps.js "partial-name"\n');
    }

    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('❌ Missing API credentials in .env file');
        process.exit(1);
    }

    try {
        const client = new VeracodeClient(apiId, apiKey);

        console.log('📋 Getting applications...');
        let applications;

        if (nameFilter) {
            applications = await client.searchApplications(nameFilter);
            console.log(`✅ Found ${applications.length} applications matching "${nameFilter}"\n`);
        } else {
            applications = await client.getApplications();
            console.log(`✅ Found ${applications.length} applications total\n`);
        }

        console.log('🔍 Checking applications for SCA scans...\n');

        const appsWithSCA = [];

        for (const app of applications.slice(0, 20)) { // Check first 20 apps to avoid too many API calls
            try {
                console.log(`Checking: ${app.profile.name}...`);

                // Get all scans for this application
                const allScans = await client.getScanResults(app.guid);
                const scaScans = allScans.filter(scan => scan.scan_type === 'SCA');

                if (scaScans.length > 0) {
                    console.log(`  ✅ Found ${scaScans.length} SCA scan(s)`);
                    appsWithSCA.push({
                        app: app,
                        scaScans: scaScans
                    });
                } else {
                    console.log(`  ❌ No SCA scans`);
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.log(`  ⚠️  Error checking ${app.profile.name}: ${error.message}`);
            }
        }

        console.log(`\n📊 Summary: Found ${appsWithSCA.length} applications with SCA scans:\n`);

        if (appsWithSCA.length === 0) {
            console.log('❌ No applications found with SCA scans in the first 20 applications checked.');
            console.log('You may need to:');
            console.log('1. Run SCA scans on your applications first');
            console.log('2. Check more applications (modify the script to check more than 20)');
            console.log('3. Ensure your API credentials have access to SCA scan results');
        } else {
            for (const { app, scaScans } of appsWithSCA) {
                console.log(`🔹 ${app.profile.name} (ID: ${app.guid})`);
                console.log(`   Business Criticality: ${app.profile.business_criticality}`);
                console.log(`   SCA Scans: ${scaScans.length}`);
                console.log(`   Latest SCA Scan: ${scaScans[0].created_date} (${scaScans[0].status})`);
                console.log('');

                // Get SCA results for the first application found
                if (appsWithSCA.indexOf({ app, scaScans }) === 0) {
                    console.log(`🔍 Getting detailed SCA results for ${app.profile.name}...\n`);

                    try {
                        const latestResults = await client.getLatestSCAResults(app.guid);

                        if (latestResults.scan) {
                            console.log(`📊 Latest SCA Results:`);
                            console.log(`  • Scan ID: ${latestResults.scan.scan_id}`);
                            console.log(`  • Status: ${latestResults.scan.status}`);
                            console.log(`  • Created: ${latestResults.scan.created_date}`);
                            console.log(`  • Policy Compliance: ${latestResults.scan.policy_compliance_status || 'N/A'}`);

                            console.log('\n📈 SCA Summary:');
                            console.log(`  • Total Findings: ${latestResults.summary.totalFindings}`);
                            console.log(`  • Policy Violations: ${latestResults.summary.policyViolations}`);
                            console.log(`  • High Risk Components: ${latestResults.summary.highRiskComponents}`);

                            console.log('\n📊 Findings by Severity:');
                            Object.entries(latestResults.summary.severityBreakdown).forEach(([severity, count]) => {
                                console.log(`  • ${severity}: ${count} finding(s)`);
                            });

                            if (latestResults.findings.length > 0) {
                                console.log(`\n📋 Sample SCA Findings (first 5 of ${latestResults.findings.length}):`);

                                latestResults.findings.slice(0, 5).forEach((finding, index) => {
                                    console.log(`\n${index + 1}. Component: ${finding.finding_details.component_filename || 'Unknown'}`);
                                    console.log(`   Version: ${finding.finding_details.version || 'N/A'}`);
                                    console.log(`   Severity: ${finding.finding_details.severity} (${['Very Low', 'Low', 'Medium', 'High', 'Very High'][finding.finding_details.severity] || 'Unknown'})`);
                                    console.log(`   Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}`);

                                    if (finding.finding_details.cve) {
                                        console.log(`   CVE: ${finding.finding_details.cve.name}`);
                                        console.log(`   CVSS: ${finding.finding_details.cve.cvss} (${finding.finding_details.cve.severity})`);
                                    }
                                });
                            }
                        }
                    } catch (error) {
                        console.log(`❌ Error getting detailed SCA results: ${error.message}`);
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Error finding applications with SCA:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        }
    }
}

// Run the script
findApplicationsWithSCA().catch(console.error);
