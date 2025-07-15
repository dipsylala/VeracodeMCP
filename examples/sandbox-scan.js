// Example: Working with sandbox scans
// This example demonstrates how to work with Veracode sandboxes and their scans

import { VeracodeClient } from '../build/veracode-rest-client.js';

async function demonstrateSandboxScans() {
    try {
        console.log('🏗️  Veracode Sandbox Scan Examples');
        console.log('==================================\n');

        const client = VeracodeClient.fromEnvironment();
        const appName = 'MCPVerademo-Net'; // Change this to your application name

        // Example 1: Discover application and its sandboxes
        console.log('📋 Example 1: Application and sandbox discovery');
        console.log('------------------------------------------------');

        console.log(`🔍 Finding application: ${appName}...`);
        const searchResults = await client.applications.searchApplications(appName);

        if (searchResults.length === 0) {
            console.log(`❌ No application found with name: ${appName}`);
            return;
        }

        const targetApp = searchResults[0];
        console.log(`✅ Found application: ${targetApp.profile.name} (${targetApp.guid})`);

        // Get sandboxes for this application
        console.log('\n🏗️  Discovering sandboxes...');
        const sandboxes = await client.sandboxes.getSandboxes(targetApp.guid);
        console.log(`✅ Found ${sandboxes.length} sandbox(es):`);

        if (sandboxes.length === 0) {
            console.log('   ℹ️  No sandboxes found - this application uses only the policy (main) branch');
            console.log('   💡 Tip: Create sandboxes to test development branches separately');
        } else {
            sandboxes.forEach((sandbox, index) => {
                console.log(`   ${index + 1}. 📦 ${sandbox.name} (${sandbox.guid})`);
                console.log(`      Created: ${sandbox.created_date}`);
                console.log(`      Modified: ${sandbox.modified_date}`);
            });
        }

        // Example 2: Compare policy vs sandbox scans
        console.log('\n📊 Example 2: Policy vs Sandbox scan comparison');
        console.log('------------------------------------------------');

        // Get policy (main branch) scans
        console.log('🏛️  Policy (main branch) scans:');
        const policyScans = await client.scans.getScans(targetApp.guid);
        console.log(`   ✅ Found ${policyScans.length} policy scan(s)`);

        if (policyScans.length > 0) {
            const policyTypes = [...new Set(policyScans.map(s => s.scan_type))];
            console.log(`   📋 Types: ${policyTypes.join(', ')}`);
        }

        // Get sandbox scans if sandboxes exist
        if (sandboxes.length > 0) {
            for (const sandbox of sandboxes.slice(0, 3)) { // Check first 3 sandboxes
                console.log(`\n🏗️  Sandbox "${sandbox.name}" scans:`);
                try {
                    const sandboxScans = await client.scans.getScans(targetApp.guid, undefined, sandbox.guid);
                    console.log(`   ✅ Found ${sandboxScans.length} sandbox scan(s)`);

                    if (sandboxScans.length > 0) {
                        const sandboxTypes = [...new Set(sandboxScans.map(s => s.scan_type))];
                        console.log(`   📋 Types: ${sandboxTypes.join(', ')}`);

                        // Show latest scan details
                        const latestScan = sandboxScans.sort((a, b) =>
                            new Date(b.created_date) - new Date(a.created_date))[0];
                        console.log(`   📅 Latest: ${latestScan.scan_type} - ${latestScan.status} (${latestScan.created_date})`);
                    }
                } catch (error) {
                    console.log(`   ❌ Error retrieving sandbox scans: ${error.message}`);
                }
            }
        }

        // Example 3: Scan type filtering in sandboxes
        console.log('\n🎯 Example 3: Filtered sandbox scanning');
        console.log('---------------------------------------');

        if (sandboxes.length > 0) {
            const firstSandbox = sandboxes[0];
            console.log(`🔍 Analyzing sandbox: ${firstSandbox.name}`);

            // Check for different scan types
            const scanTypes = ['STATIC', 'SCA', 'DYNAMIC'];

            for (const scanType of scanTypes) {
                try {
                    const filteredScans = await client.scans.getScans(
                        targetApp.guid,
                        scanType,
                        firstSandbox.guid
                    );
                    console.log(`   ${scanType}: ${filteredScans.length} scan(s)`);

                    if (filteredScans.length > 0) {
                        const statuses = [...new Set(filteredScans.map(s => s.status))];
                        console.log(`      Status(es): ${statuses.join(', ')}`);
                    }
                } catch (error) {
                    console.log(`   ${scanType}: Error - ${error.message}`);
                }
            }
        } else {
            console.log('   ℹ️  No sandboxes available for filtering example');
        }

        // Example 4: Sandbox scan availability check
        console.log('\n✅ Example 4: Quick sandbox scan checks');
        console.log('---------------------------------------');

        if (sandboxes.length > 0) {
            for (const sandbox of sandboxes.slice(0, 2)) {
                console.log(`\n📦 Checking sandbox: ${sandbox.name}`);
                try {
                    // Use hasScans with sandbox parameter
                    const scanCheck = await client.scans.hasScans(
                        targetApp.guid,
                        undefined,
                        sandbox.guid
                    );

                    console.log(`   Has scans: ${scanCheck.hasScans ? '✅ Yes' : '❌ No'}`);
                    console.log(`   Scan count: ${scanCheck.scanCount}`);
                    console.log(`   Types: ${scanCheck.scanTypes.join(', ') || 'None'}`);
                } catch (error) {
                    console.log(`   ❌ Error: ${error.message}`);
                }
            }
        }

        // Example 5: Using application name instead of GUID (auto-detection)
        console.log('\n🔑 Example 5: Auto-detection with application names');
        console.log('---------------------------------------------------');

        if (sandboxes.length > 0) {
            const firstSandbox = sandboxes[0];
            console.log(`🎯 Using application name "${appName}" instead of GUID...`);

            try {
                // The API auto-detects that this is a name, not a GUID
                const scansByName = await client.scans.getScans(
                    appName, // Using name instead of GUID
                    undefined,
                    firstSandbox.guid
                );
                console.log(`✅ Retrieved ${scansByName.length} scan(s) using name auto-detection`);
                console.log('   🔍 Auto-detection: Method recognized this was an app name');
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
            }
        }

        console.log('\n🎉 Sandbox scan examples completed!');
        console.log('\n💡 Key Takeaways:');
        console.log('   • Sandboxes allow isolated testing of development branches');
        console.log('   • Policy scans represent the main/production branch');
        console.log('   • Same scan API works for both policy and sandbox contexts');
        console.log('   • Auto-detection works with sandbox parameters too');
        console.log('   • Sandbox scans help with DevSecOps workflows');

        if (sandboxes.length === 0) {
            console.log('\n💡 To create sandboxes:');
            console.log('   • Use the Veracode Platform UI or API');
            console.log('   • Sandboxes are great for testing feature branches');
            console.log('   • Each sandbox can have independent scan results');
        }

    } catch (error) {
        console.error('💥 Example failed:', error);
        console.error('Make sure you have:');
        console.error('  1. VERACODE_API_ID and VERACODE_API_KEY in your .env file');
        console.error('  2. Proper permissions to access sandbox data');
        console.error('  3. An application with sandboxes (or change the appName variable)');
    }
}

// Run the examples
demonstrateSandboxScans();
