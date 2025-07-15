// Example: Comprehensive scan information retrieval
// This example shows how to get detailed scan information for applications

import { VeracodeClient } from '../build/veracode-rest-client.js';

async function demonstrateScanRetrieval() {
    try {
        console.log('🔍 Comprehensive Scan Information Examples');
        console.log('==========================================\n');

        const client = VeracodeClient.fromEnvironment();
        const appName = 'MCPVerademo-Net'; // Change this to your application name

        // Example 1: Find and get scan information for an application
        console.log('📋 Example 1: Application discovery and scan retrieval');
        console.log('-------------------------------------------------------');

        console.log(`🔍 Searching for application: ${appName}...`);
        const searchResults = await client.applications.searchApplications(appName);

        if (searchResults.length === 0) {
            console.log(`❌ No application found with name: ${appName}`);
            return;
        }

        console.log(`✅ Found ${searchResults.length} application(s):`);
        searchResults.forEach(app => {
            console.log(`   📱 ${app.profile.name} (${app.guid})`);
        });

        const targetApp = searchResults[0];

        // Example 2: Get all scans using new ScanService
        console.log(`\n📊 Example 2: All scans for ${targetApp.profile.name}`);
        console.log('---------------------------------------------------');

        const allScans = await client.scans.getScans(targetApp.guid);
        console.log(`✅ Retrieved ${allScans.length} total scan(s)`);

        if (allScans.length > 0) {
            console.log('\n📋 Scan Summary:');
            const scansByType = {};
            allScans.forEach(scan => {
                if (!scansByType[scan.scan_type]) {
                    scansByType[scan.scan_type] = [];
                }
                scansByType[scan.scan_type].push(scan);
            });

            Object.entries(scansByType).forEach(([type, scans]) => {
                console.log(`   ${type}: ${scans.length} scan(s)`);
                scans.forEach((scan, index) => {
                    console.log(`     ${index + 1}. Status: ${scan.status} | Created: ${scan.created_date}`);
                    if (scan.policy_compliance_status) {
                        console.log(`        Compliance: ${scan.policy_compliance_status}`);
                    }
                });
            });
        }

        // Example 3: Filter by scan type
        console.log('\n🎯 Example 3: Static Analysis scans only');
        console.log('----------------------------------------');

        const staticScans = await client.scans.getScans(targetApp.guid, 'STATIC');
        console.log(`✅ Found ${staticScans.length} STATIC scan(s)`);

        if (staticScans.length > 0) {
            const latestStatic = staticScans.sort((a, b) =>
                new Date(b.created_date) - new Date(a.created_date))[0];
            console.log(`   📅 Latest STATIC scan: ${latestStatic.status} (${latestStatic.created_date})`);
        }

        // Example 4: SCA scans
        console.log('\n🔍 Example 4: Software Composition Analysis (SCA) scans');
        console.log('--------------------------------------------------------');

        const scaScans = await client.scans.getScans(targetApp.guid, 'SCA');
        console.log(`✅ Found ${scaScans.length} SCA scan(s)`);

        if (scaScans.length > 0) {
            scaScans.forEach((scan, index) => {
                console.log(`   ${index + 1}. SCA Scan: ${scan.status} | ${scan.created_date}`);
            });
        } else {
            console.log('   ℹ️  No SCA scans found - this application may not have dependency scanning enabled');
        }

        // Example 5: Scan availability check using hasScans
        console.log('\n✅ Example 5: Quick scan availability check');
        console.log('-------------------------------------------');

        const scanCheck = await client.scans.hasScans(appName); // Using name instead of GUID
        console.log(`Application: ${appName}`);
        console.log(`Has scans: ${scanCheck.hasScans ? '✅ Yes' : '❌ No'}`);
        console.log(`Total scans: ${scanCheck.scanCount}`);
        console.log(`Available types: ${scanCheck.scanTypes.join(', ')}`);

        // Example 6: Sandbox scans (if available)
        console.log('\n🏗️  Example 6: Sandbox scan information');
        console.log('---------------------------------------');

        try {
            const sandboxes = await client.sandboxes.getSandboxesByName(appName);
            if (sandboxes.length > 0) {
                console.log(`✅ Found ${sandboxes.length} sandbox(es):`);

                for (const sandbox of sandboxes.slice(0, 2)) { // Check first 2 sandboxes
                    console.log(`\n   📦 Sandbox: ${sandbox.name}`);
                    const sandboxScans = await client.scans.getScans(appName, undefined, sandbox.guid);
                    console.log(`      Scans: ${sandboxScans.length}`);

                    if (sandboxScans.length > 0) {
                        const types = [...new Set(sandboxScans.map(s => s.scan_type))];
                        console.log(`      Types: ${types.join(', ')}`);
                    }
                }
            } else {
                console.log('   ℹ️  No sandboxes found for this application');
            }
        } catch (error) {
            console.log(`   ⚠️  Could not retrieve sandbox information: ${error.message}`);
        }

        console.log('\n🎉 Scan retrieval examples completed!');
        console.log('\n💡 What we learned:');
        console.log('   • How to discover applications by name');
        console.log('   • How to retrieve all scans for an application');
        console.log('   • How to filter scans by type (STATIC, SCA, etc.)');
        console.log('   • How to check scan availability quickly');
        console.log('   • How to work with sandbox scans');
        console.log('   • How the new API auto-detects GUID vs name parameters');

    } catch (error) {
        console.error('💥 Example failed:', error);
        console.error('Make sure you have:');
        console.error('  1. VERACODE_API_ID and VERACODE_API_KEY in your .env file');
        console.error('  2. Proper permissions to access scan data');
        console.error('  3. An application named "MCPVerademo-Net" (or change the appName variable)');
    }
}

// Run the examples
demonstrateScanRetrieval();
