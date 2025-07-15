// Example: Demonstrate the new ScanService functionality
// This example shows how to use the new scan-focused API methods

import { VeracodeClient } from '../build/veracode-rest-client.js';

async function demonstrateScanService() {
    try {
        console.log('🔍 Veracode ScanService API Examples');
        console.log('=====================================\n');

        // Initialize client
        const client = new VeracodeClient();

        // Example 1: Get all scans for an application by name
        console.log('📋 Example 1: Get scans by application name');
        console.log('-------------------------------------------');
        try {
            const appName = 'MCPVerademo-Net'; // Change this to your application name
            const scansByName = await client.scans.getScans(appName);
            console.log(`✅ Found ${scansByName.length} scan(s) for "${appName}"`);

            if (scansByName.length > 0) {
                const scanTypes = [...new Set(scansByName.map(s => s.scan_type))];
                console.log(`   Available scan types: ${scanTypes.join(', ')}`);

                // Show details of the most recent scan
                const latestScan = scansByName.sort((a, b) =>
                    new Date(b.created_date) - new Date(a.created_date))[0];
                console.log(`   Latest scan: ${latestScan.scan_type} (${latestScan.status}) - ${latestScan.created_date}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Example 2: Filter scans by type
        console.log('\n🎯 Example 2: Get specific scan type');
        console.log('------------------------------------');
        try {
            const appName = 'MCPVerademo-Net';
            const scanType = 'SCA'; // or 'STATIC', 'DYNAMIC', etc.
            const scaScans = await client.scans.getScans(appName, scanType);
            console.log(`✅ Found ${scaScans.length} ${scanType} scan(s)`);

            if (scaScans.length > 0) {
                scaScans.forEach((scan, index) => {
                    console.log(`   ${index + 1}. ${scan.scan_type} - ${scan.status} (${scan.created_date})`);
                });
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Example 3: Check if application has scans
        console.log('\n✅ Example 3: Check scan availability');
        console.log('------------------------------------');
        try {
            const appName = 'MCPVerademo-Net';
            const scanCheck = await client.scans.hasScans(appName);

            console.log(`Has scans: ${scanCheck.hasScans}`);
            console.log(`Total scans: ${scanCheck.scanCount}`);
            console.log(`Scan types available: ${scanCheck.scanTypes.join(', ')}`);

            if (scanCheck.hasScans) {
                console.log('   ✅ Application has been scanned');
            } else {
                console.log('   ⚠️  Application has no scans yet');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Example 4: Using GUID instead of name (auto-detection)
        console.log('\n🔑 Example 4: Auto-detection of GUID vs Name');
        console.log('---------------------------------------------');
        try {
            // First get the application to demonstrate GUID usage
            const apps = await client.applications.searchApplications('MCPVerademo-Net');
            if (apps.length > 0) {
                const appGuid = apps[0].guid;
                console.log(`   Application GUID: ${appGuid}`);

                // The same method automatically detects GUID vs name
                const scansByGuid = await client.scans.getScans(appGuid);
                console.log(`✅ Retrieved ${scansByGuid.length} scan(s) using GUID`);
                console.log('   🔍 Auto-detection: Method recognized this was a GUID');
            } else {
                console.log('❌ No application found for GUID demonstration');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Example 5: Working with sandbox scans (if available)
        console.log('\n🏗️  Example 5: Sandbox scan support');
        console.log('-----------------------------------');
        try {
            const appName = 'MCPVerademo-Net';

            // First check if app has sandboxes
            const sandboxes = await client.sandboxes.getSandboxesByName(appName);
            if (sandboxes.length > 0) {
                const firstSandbox = sandboxes[0];
                console.log(`   Found sandbox: ${firstSandbox.name} (${firstSandbox.guid})`);

                // Get scans for specific sandbox
                const sandboxScans = await client.scans.getScans(appName, undefined, firstSandbox.guid);
                console.log(`✅ Found ${sandboxScans.length} scan(s) in sandbox "${firstSandbox.name}"`);
            } else {
                console.log('   ℹ️  No sandboxes found for this application');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        console.log('\n🎉 ScanService examples completed!');
        console.log('\n💡 Key Benefits:');
        console.log('   • Auto-detection of GUID vs name parameters');
        console.log('   • Consistent API across all scan operations');
        console.log('   • Support for scan type filtering');
        console.log('   • Sandbox-aware functionality');
        console.log('   • Clean separation from findings/vulnerability data');

    } catch (error) {
        console.error('💥 Example failed:', error);
    }
}

// Run the examples
demonstrateScanService();
