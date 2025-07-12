#!/usr/bin/env node

import { VeracodeClient } from '../build/veracode-rest-client.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function getSCAResults() {
    // Get application name from command line arguments
    const applicationName = process.argv[2];

    if (!applicationName) {
        console.error('❌ Please specify an application name as an argument');
        console.error('Usage: node get-sca-results.js <application-name>');
        console.error('Example: node get-sca-results.js "YourAppName"');
        process.exit(1);
    }

    console.log(`🔍 Getting SCA results for "${applicationName}"...\n`);

    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('❌ Missing API credentials in .env file');
        process.exit(1);
    }

    try {
        const client = new VeracodeClient(apiId, apiKey);

        console.log(`📋 Step 1: Finding "${applicationName}" application...`);

        // First, search for the specified application
        const applications = await client.searchApplications(applicationName);

        if (applications.length === 0) {
            console.log(`❌ Could not find any applications matching "${applicationName}"`);
            console.log('Available applications (first 10):');
            const allApps = await client.getApplications();
            allApps.slice(0, 10).forEach(app => {
                console.log(`  • ${app.profile.name} (ID: ${app.guid})`);
            });
            return;
        }

        let targetApp = applications[0];

        if (applications.length > 1) {
            console.log(`✅ Found ${applications.length} matching applications:`);
            applications.forEach((app, index) => {
                console.log(`${index + 1}. ${app.profile.name} (ID: ${app.guid})`);
            });
            console.log(`\n🎯 Using first match: ${targetApp.profile.name}`);
        } else {
            console.log(`✅ Found: ${targetApp.profile.name} (ID: ${targetApp.guid})`);
        }

        console.log(`   Business Criticality: ${targetApp.profile.business_criticality}`);
        console.log(`   Created: ${targetApp.created}`);

        console.log('\n📊 Step 2: Getting latest SCA results...');

        // Get the latest SCA results with summary
        const latestResults = await client.getLatestSCAResults(targetApp.guid);

        if (!latestResults.scan) {
            console.log(`❌ No SCA scans found for ${targetApp.profile.name}`);
            console.log('Getting all scan types to see what\'s available...');
            const allScans = await client.getScanResults(targetApp.guid);
            if (allScans.length > 0) {
                console.log('Available scans:');
                allScans.forEach(scan => {
                    console.log(`  • ${scan.scan_type} - ${scan.status} (${scan.created_date})`);
                });
            } else {
                console.log('No scans found for this application.');
            }
            return;
        }

        console.log(`✅ Latest SCA Scan Details:`);
        console.log(`  • Scan ID: ${latestResults.scan.scan_id}`);
        console.log(`  • Status: ${latestResults.scan.status}`);
        console.log(`  • Created: ${latestResults.scan.created_date}`);
        console.log(`  • Policy Compliance: ${latestResults.scan.policy_compliance_status || 'N/A'}`);

        console.log('\n� SCA Summary:');
        console.log(`  • Total Findings: ${latestResults.summary.totalFindings}`);
        console.log(`  • Policy Violations: ${latestResults.summary.policyViolations}`);
        console.log(`  • High Risk Components: ${latestResults.summary.highRiskComponents}`);

        console.log('\n📊 Findings by Severity:');
        Object.entries(latestResults.summary.severityBreakdown).forEach(([severity, count]) => {
            console.log(`  • ${severity}: ${count} finding(s)`);
        });

        if (latestResults.findings.length > 0) {
            console.log('\n🔍 Step 3: Getting enhanced SCA findings...');

            // Get enhanced SCA findings with more details
            const enhancedFindings = await client.getSCAFindings(targetApp.guid, {
                includeTransitiveDependencies: true,
                includeDirectDependencies: true,
                severityGte: 0, // Get all severities
                size: 100
            });

            console.log(`\n📋 Detailed SCA Findings (showing first 20 of ${enhancedFindings.length}):`);

            enhancedFindings.slice(0, 20).forEach((finding, index) => {
                console.log(`\n${index + 1}. Component: ${finding.finding_details.component_filename || 'Unknown'}`);
                console.log(`   Version: ${finding.finding_details.version || 'N/A'}`);
                console.log(`   Severity: ${finding.finding_details.severity} (${['Very Low', 'Low', 'Medium', 'High', 'Very High'][finding.finding_details.severity] || 'Unknown'})`);
                console.log(`   Status: ${finding.finding_status.status}`);
                console.log(`   Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}`);
                console.log(`   New Finding: ${finding.finding_status.new ? 'Yes' : 'No'}`);
                console.log(`   First Found: ${finding.finding_status.first_found_date}`);

                if (finding.finding_details.cve) {
                    console.log(`   CVE: ${finding.finding_details.cve.name}`);
                    console.log(`   CVSS: ${finding.finding_details.cve.cvss} (${finding.finding_details.cve.severity})`);

                    if (finding.finding_details.cve.cvss3) {
                        console.log(`   CVSS v3: ${finding.finding_details.cve.cvss3.score} (${finding.finding_details.cve.cvss3.severity})`);
                    }

                    if (finding.finding_details.cve.exploitability) {
                        console.log(`   Exploitability: ${finding.finding_details.cve.exploitability.exploit_service_status}`);
                        if (finding.finding_details.cve.exploitability.epss_score) {
                            console.log(`   EPSS Score: ${finding.finding_details.cve.exploitability.epss_score} (${finding.finding_details.cve.exploitability.epss_percentile}th percentile)`);
                        }
                    }
                }

                if (finding.finding_details.licenses && finding.finding_details.licenses.length > 0) {
                    console.log(`   Licenses: ${finding.finding_details.licenses.map(l => `${l.license_id} (${l.risk_rating})`).join(', ')}`);
                }

                if (finding.finding_details.component_path && finding.finding_details.component_path.length > 0) {
                    console.log(`   Component Path: ${finding.finding_details.component_path.map(p => p.path).join(' → ')}`);
                }

                if (finding.description) {
                    console.log(`   Description: ${finding.description}`);
                }
            });

            if (enhancedFindings.length > 20) {
                console.log(`\n... and ${enhancedFindings.length - 20} more findings`);
            }

            // Show high-risk findings summary
            const highRiskFindings = enhancedFindings.filter(f => f.finding_details.severity >= 4);
            if (highRiskFindings.length > 0) {
                console.log(`\n🚨 High Risk Findings Summary (${highRiskFindings.length} findings):`);
                highRiskFindings.slice(0, 5).forEach((finding, index) => {
                    console.log(`${index + 1}. ${finding.finding_details.component_filename || 'Unknown'} v${finding.finding_details.version || 'N/A'}`);
                    if (finding.finding_details.cve) {
                        console.log(`   ${finding.finding_details.cve.name} - CVSS: ${finding.finding_details.cve.cvss}`);
                    }
                });
                if (highRiskFindings.length > 5) {
                    console.log(`   ... and ${highRiskFindings.length - 5} more high-risk findings`);
                }
            }

            // Show policy violations summary
            const policyViolations = enhancedFindings.filter(f => f.violates_policy);
            if (policyViolations.length > 0) {
                console.log(`\n⚠️  Policy Violations Summary (${policyViolations.length} violations):`);
                policyViolations.slice(0, 5).forEach((finding, index) => {
                    console.log(`${index + 1}. ${finding.finding_details.component_filename || 'Unknown'} v${finding.finding_details.version || 'N/A'}`);
                    console.log(`   Severity: ${['Very Low', 'Low', 'Medium', 'High', 'Very High'][finding.finding_details.severity] || 'Unknown'}`);
                });
                if (policyViolations.length > 5) {
                    console.log(`   ... and ${policyViolations.length - 5} more policy violations`);
                }
            }
        }

        console.log('\n✅ SCA analysis complete!');

    } catch (error) {
        console.error('❌ Error getting SCA results:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        }
    }
}

// Run the script
getSCAResults().catch(console.error);
