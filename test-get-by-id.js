#!/usr/bin/env node

import { VeracodeClient } from './build/veracode-rest-client.js';
import { config } from 'dotenv';

// Load environment variables from .env file if it exists
config();

async function testGetApplicationDetailsById() {
    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('❌ Error: VERACODE_API_ID and VERACODE_API_KEY environment variables must be set');
        process.exit(1);
    }

    const client = new VeracodeClient(apiId, apiKey);

    try {
        // RoboSAS GUID from our previous test
        const roboSASGuid = '2d8925b2-ce45-431a-8c0e-e94dd4376750';

        console.log(`🔍 Getting application details by ID for RoboSAS (${roboSASGuid})...\n`);

        // Get application details by ID/GUID
        const appDetails = await client.getApplicationDetails(roboSASGuid);

        console.log('📋 Application Details (by ID):');
        console.log('='.repeat(60));
        console.log(`Name: ${appDetails.profile.name}`);
        console.log(`GUID: ${appDetails.guid}`);
        console.log(`ID: ${appDetails.id}`);
        console.log(`Business Criticality: ${appDetails.profile.business_criticality}`);

        console.log('\n🔗 URLs Returned:');
        console.log('='.repeat(30));
        if (appDetails.app_profile_url) {
            console.log(`✅ App Profile URL: ${appDetails.app_profile_url}`);
        } else {
            console.log('❌ App Profile URL: NOT PRESENT');
        }

        if (appDetails.results_url) {
            console.log(`✅ Results URL: ${appDetails.results_url}`);
        } else {
            console.log('❌ Results URL: NOT PRESENT');
        }

        // Check if scan URLs are also provided
        if (appDetails.scans && appDetails.scans.length > 0) {
            console.log('\n🔍 Scan URLs:');
            appDetails.scans.forEach((scan, index) => {
                console.log(`  Scan ${index + 1} (${scan.scan_type}): ${scan.scan_url || 'No URL'}`);
            });
        }

        // Show the structure that would be returned by MCP
        console.log('\n📊 What MCP would return:');
        console.log('='.repeat(40));
        const mcpResponse = {
            success: true,
            data: {
                name: appDetails.profile.name,
                id: appDetails.guid,
                legacy_id: appDetails.id,
                business_criticality: appDetails.profile.business_criticality,
                app_profile_url: appDetails.app_profile_url,
                results_url: appDetails.results_url,
                scans: appDetails.scans?.map((scan) => ({
                    scan_type: scan.scan_type,
                    status: scan.status,
                    scan_url: scan.scan_url
                })) || []
            }
        };

        console.log(JSON.stringify(mcpResponse, null, 2));

        console.log('\n✅ Successfully retrieved application details by ID');

    } catch (error) {
        console.error('❌ Error getting application details:', error.message);
        process.exit(1);
    }
}

// Run the test
testGetApplicationDetailsById();
