#!/usr/bin/env node

import { VeracodeClient } from './build/veracode-rest-client.js';
import { config } from 'dotenv';

// Load environment variables from .env file if it exists
config();

async function testRoboSASDetails() {
    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('❌ Error: VERACODE_API_ID and VERACODE_API_KEY environment variables must be set');
        console.error('');
        console.error('Please either:');
        console.error('1. Create a .env file with your credentials (copy from .env.example)');
        console.error('2. Set environment variables:');
        console.error('   set VERACODE_API_ID=your-api-id');
        console.error('   set VERACODE_API_KEY=your-api-key');
        console.error('');
        console.error('You can get API credentials from your Veracode account settings.');
        process.exit(1);
    }

    const client = new VeracodeClient(apiId, apiKey);

    try {
        console.log('🔍 Getting application details for RoboSAS...\n');

        // Get application details by name
        const appDetails = await client.getApplicationDetailsByName('RoboSAS');

        console.log('📋 Application Details:');
        console.log('='.repeat(50));
        console.log(`Name: ${appDetails.profile.name}`);
        console.log(`GUID: ${appDetails.guid}`);
        console.log(`ID: ${appDetails.id}`);
        console.log(`Business Criticality: ${appDetails.profile.business_criticality}`);
        console.log(`Description: ${appDetails.profile.description || 'N/A'}`);
        console.log(`Created: ${appDetails.created}`);
        console.log(`Modified: ${appDetails.modified}`);

        if (appDetails.profile.tags) {
            console.log(`Tags: ${appDetails.profile.tags}`);
        }

        if (appDetails.profile.teams && appDetails.profile.teams.length > 0) {
            console.log('\n👥 Teams:');
            appDetails.profile.teams.forEach(team => {
                console.log(`  - ${team.team_name} (ID: ${team.team_id})`);
            });
        }

        if (appDetails.profile.policies && appDetails.profile.policies.length > 0) {
            console.log('\n📋 Policies:');
            appDetails.profile.policies.forEach(policy => {
                console.log(`  - ${policy.name}: ${policy.policy_compliance_status}`);
            });
        }

        if (appDetails.scans && appDetails.scans.length > 0) {
            console.log('\n🔍 Recent Scans:');
            const recentScans = appDetails.scans
                .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
                .slice(0, 5);

            recentScans.forEach(scan => {
                console.log(`  - ${scan.scan_type}: ${scan.status} (${scan.created_date})`);
                if (scan.policy_compliance_status) {
                    console.log(`    Policy Compliance: ${scan.policy_compliance_status}`);
                }
            });
        }

        if (appDetails.app_profile_url) {
            console.log(`\n🔗 App Profile URL: ${appDetails.app_profile_url}`);
        }

        if (appDetails.results_url) {
            console.log(`🔗 Results URL: ${appDetails.results_url}`);
        }

        console.log('\n✅ Successfully retrieved application details for RoboSAS');

    } catch (error) {
        console.error('❌ Error getting application details:', error.message);
        process.exit(1);
    }
}

// Run the test
testRoboSASDetails();
