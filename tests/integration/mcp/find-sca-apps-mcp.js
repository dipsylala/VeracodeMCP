#!/usr/bin/env node

import { VeracodeDirectClient } from '../../../build/test-utils/veracode-direct-client.js';
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
        console.log('💡 Tip: You can filter by name using: node find-sca-apps-mcp.js "partial-name"\n');
    }

    try {
        const client = new VeracodeDirectClient();

        console.log('📋 Getting applications with SCA scans...');
        
        // Use the MCP client to get all applications with SCA scans
        const scaAppsResult = await client.callTool({
            tool: 'get-sca-apps',
            args: {
                include_risk_analysis: true,
                include_recent_only: false  // Get all SCA apps, not just recent ones
            }
        });

        if (!scaAppsResult.success || !scaAppsResult.data?.applications) {
            console.log('❌ Error getting SCA applications:', scaAppsResult.error || 'Unknown error');
            return;
        }

        let scaApps = scaAppsResult.data.applications;

        // Filter by name if provided
        if (nameFilter) {
            scaApps = scaApps.filter(app => 
                app.name.toLowerCase().includes(nameFilter.toLowerCase())
            );
            console.log(`✅ Found ${scaApps.length} SCA applications matching "${nameFilter}"\n`);
        } else {
            console.log(`✅ Found ${scaApps.length} applications with SCA scans total\n`);
        }

        if (scaApps.length === 0) {
            console.log('❌ No applications with SCA scans found matching your criteria');
            return;
        }

        console.log('📊 Summary of SCA Applications:');
        console.log(`  • Total SCA-enabled applications: ${scaAppsResult.data.summary.sca_enabled_applications}`);
        console.log(`  • High Risk applications: ${scaAppsResult.data.summary.high_risk_applications}`);
        console.log(`  • Medium Risk applications: ${scaAppsResult.data.summary.medium_risk_applications}`);
        console.log(`  • Low Risk applications: ${scaAppsResult.data.summary.low_risk_applications}`);

        console.log(`\n📋 Applications with SCA Scans (showing first 20):\n`);

        scaApps.slice(0, 20).forEach((app, index) => {
            console.log(`${index + 1}. ${app.name}`);
            console.log(`   ID: ${app.id}`);
            console.log(`   Business Criticality: ${app.business_criticality}`);
            console.log(`   Total SCA Scans: ${app.total_sca_scans}`);
            console.log(`   Latest Scan: ${app.latest_sca_scan.created_date} (${app.latest_sca_scan.status})`);
            
            if (app.risk_assessment) {
                console.log(`   Risk Level: ${app.risk_assessment.risk_level}`);
                console.log(`   Total Findings: ${app.risk_assessment.total_findings}`);
                console.log(`   High Risk Components: ${app.risk_assessment.high_risk_components}`);
                console.log(`   Policy Violations: ${app.risk_assessment.policy_violations}`);
            }
            
            console.log(`   Results URL: ${app.results_url || 'Not available'}`);
            console.log();
        });

        if (scaApps.length > 20) {
            console.log(`... and ${scaApps.length - 20} more applications with SCA scans`);
        }

        console.log('\n✅ SCA application discovery completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

findApplicationsWithSCA();
