// Example: Advanced Sandbox-Aware Scan Operations
// This example demonstrates the enhanced ScanService with comprehensive sandbox functionality

import { VeracodeClient } from '../build/veracode-rest-client.js';

async function demonstrateAdvancedSandboxScans() {
    try {
        console.log('🏗️  Advanced Sandbox-Aware Scan Operations');
        console.log('===========================================\n');

        const client = VeracodeClient.fromEnvironment();
        const appName = 'MCPVerademo-Net'; // Change this to your application name

        // Example 1: Get all sandbox scans for an application
        console.log('📊 Example 1: Get all sandbox scans');
        console.log('-----------------------------------');
        try {
            const sandboxScansResult = await client.scans.getSandboxScans(appName);

            console.log(`Application: ${sandboxScansResult.application.name}`);
            console.log(`Found ${sandboxScansResult.sandboxes.length} sandbox(es)`);
            console.log(`Total sandbox scans: ${sandboxScansResult.totalSandboxScans}`);

            if (sandboxScansResult.sandboxes.length > 0) {
                console.log('\n📦 Sandbox Details:');
                sandboxScansResult.sandboxes.forEach((sbData, index) => {
                    console.log(`  ${index + 1}. ${sbData.sandbox.name}`);
                    console.log(`     Scans: ${sbData.scanCount}`);
                    console.log(`     Types: ${sbData.scanTypes.join(', ') || 'None'}`);
                });
            } else {
                console.log('   ℹ️  No sandboxes found for this application');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Example 2: Get scans for a specific sandbox by name
        console.log('\n🎯 Example 2: Get scans for specific sandbox');
        console.log('--------------------------------------------');
        try {
            // First check if sandboxes exist
            const allSandboxes = await client.sandboxes.getSandboxesByName(appName);

            if (allSandboxes.sandboxes.length > 0) {
                const firstSandboxName = allSandboxes.sandboxes[0].name;
                console.log(`Checking sandbox: "${firstSandboxName}"`);

                const sandboxScans = await client.scans.getScansBySandboxName(appName, firstSandboxName);

                console.log(`✅ Found ${sandboxScans.scanCount} scan(s) in sandbox "${sandboxScans.sandbox.name}"`);
                console.log(`   Scan types: ${sandboxScans.scanTypes.join(', ') || 'None'}`);

                if (sandboxScans.scans.length > 0) {
                    console.log('   📋 Recent scans:');
                    sandboxScans.scans.slice(0, 3).forEach((scan, index) => {
                        console.log(`     ${index + 1}. ${scan.scan_type} - ${scan.status} (${scan.created_date || 'No date'})`);
                    });
                }
            } else {
                console.log('   ℹ️  No sandboxes available for specific sandbox example');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Example 3: Compare policy vs sandbox scans
        console.log('\n⚖️  Example 3: Policy vs Sandbox comparison');
        console.log('-------------------------------------------');
        try {
            const comparison = await client.scans.comparePolicyVsSandboxScans(appName);

            console.log(`Application: ${comparison.application.name}`);
            console.log('\n📊 Scan Comparison:');
            console.log(`   Policy scans: ${comparison.summary.totalPolicyScans}`);
            console.log(`   Sandbox scans: ${comparison.summary.totalSandboxScans}`);
            console.log(`   Total scans: ${comparison.summary.totalScans}`);

            console.log('\n🎯 Scan Types Analysis:');
            console.log(`   Policy types: ${comparison.policyScans.scanTypes.join(', ') || 'None'}`);
            console.log(`   Common types: ${comparison.summary.commonTypes.join(', ') || 'None'}`);
            console.log(`   Policy-only types: ${comparison.summary.policyOnlyTypes.join(', ') || 'None'}`);
            console.log(`   Sandbox-only types: ${comparison.summary.sandboxOnlyTypes.join(', ') || 'None'}`);

            if (comparison.sandboxScans.sandboxes.length > 0) {
                console.log('\n📦 Sandbox Breakdown:');
                comparison.sandboxScans.sandboxes.forEach((sbData, index) => {
                    console.log(`   ${index + 1}. ${sbData.sandbox.name}: ${sbData.scanCount} scan(s) [${sbData.scanTypes.join(', ')}]`);
                });
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Example 4: Get comprehensive scan summary
        console.log('\n📈 Example 4: Comprehensive scan summary');
        console.log('---------------------------------------');
        try {
            const summary = await client.scans.getScanSummary(appName);

            console.log(`Application: ${summary.application.name}`);
            console.log('\n📊 Summary Overview:');
            console.log(`   Policy scans: ${summary.totals.policyScans}`);
            console.log(`   Sandbox scans: ${summary.totals.sandboxScans}`);
            console.log(`   Total scans: ${summary.totals.totalScans}`);
            console.log(`   All scan types: ${summary.totals.allScanTypes.join(', ')}`);

            // Policy scan details
            console.log('\n🏛️  Policy (Main Branch):');
            console.log(`   Scan count: ${summary.policy.scanCount}`);
            console.log(`   Types: ${summary.policy.scanTypes.join(', ') || 'None'}`);
            if (summary.policy.latestScan) {
                console.log(`   Latest: ${summary.policy.latestScan.scan_type} - ${summary.policy.latestScan.status} (${summary.policy.latestScan.created_date || 'No date'})`);
            }

            // Sandbox details
            if (summary.sandboxes.length > 0) {
                console.log('\n🏗️  Sandboxes:');
                summary.sandboxes.forEach((sb, index) => {
                    console.log(`   ${index + 1}. ${sb.sandbox.name}`);
                    console.log(`      Scans: ${sb.scanCount} [${sb.scanTypes.join(', ') || 'None'}]`);
                    if (sb.latestScan) {
                        console.log(`      Latest: ${sb.latestScan.scan_type} - ${sb.latestScan.status} (${sb.latestScan.created_date || 'No date'})`);
                    }
                });
            } else {
                console.log('\n🏗️  Sandboxes: None found');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Example 5: Filter sandbox scans by type
        console.log('\n🎯 Example 5: Filter sandbox scans by type');
        console.log('------------------------------------------');
        try {
            const scanTypes = ['STATIC', 'SCA', 'DYNAMIC'];

            for (const scanType of scanTypes) {
                console.log(`\n🔍 ${scanType} scans across all sandboxes:`);
                try {
                    const filteredSandboxScans = await client.scans.getSandboxScans(appName, scanType);

                    let totalFilteredScans = 0;
                    filteredSandboxScans.sandboxes.forEach(sbData => {
                        if (sbData.scanCount > 0) {
                            console.log(`   📦 ${sbData.sandbox.name}: ${sbData.scanCount} ${scanType} scan(s)`);
                            totalFilteredScans += sbData.scanCount;
                        }
                    });

                    if (totalFilteredScans === 0) {
                        console.log(`   ℹ️  No ${scanType} scans found in any sandbox`);
                    } else {
                        console.log(`   📊 Total ${scanType} sandbox scans: ${totalFilteredScans}`);
                    }
                } catch (error) {
                    console.log(`   ❌ Error filtering ${scanType} scans: ${error.message}`);
                }
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Example 6: Auto-detection with GUIDs
        console.log('\n🔑 Example 6: Auto-detection with GUID');
        console.log('--------------------------------------');
        try {
            const apps = await client.applications.searchApplications(appName);
            if (apps.length > 0) {
                const appGuid = apps[0].guid;
                console.log(`Using GUID: ${appGuid}`);

                // The same methods work with GUIDs due to auto-detection
                const guidSummary = await client.scans.getScanSummary(appGuid);
                console.log(`✅ Retrieved summary using GUID auto-detection`);
                console.log(`   Application: ${guidSummary.application.name}`);
                console.log(`   Total scans: ${guidSummary.totals.totalScans}`);
                console.log('   🔍 Auto-detection: Method recognized this was a GUID');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        console.log('\n🎉 Advanced sandbox scan examples completed!');
        console.log('\n💡 What we demonstrated:');
        console.log('   • 📊 Comprehensive sandbox scan retrieval');
        console.log('   • 🎯 Specific sandbox targeting by name');
        console.log('   • ⚖️  Policy vs sandbox comparison analysis');
        console.log('   • 📈 Complete scan summaries with latest scan info');
        console.log('   • 🎯 Scan type filtering across sandboxes');
        console.log('   • 🔑 Seamless GUID vs name auto-detection');
        console.log('   • 🏗️  DevSecOps-ready sandbox workflows');

        console.log('\n🚀 Use Cases:');
        console.log('   • Compare development branch scans vs production');
        console.log('   • Track scan coverage across feature branches');
        console.log('   • Analyze security posture by environment');
        console.log('   • Generate comprehensive security reports');
        console.log('   • Implement branch-specific security policies');

    } catch (error) {
        console.error('💥 Example failed:', error);
        console.error('Make sure you have:');
        console.error('  1. VERACODE_API_ID and VERACODE_API_KEY in your .env file');
        console.error('  2. Proper permissions to access sandbox and scan data');
        console.error('  3. An application with sandboxes (or change the appName variable)');
    }
}

// Run the advanced examples
demonstrateAdvancedSandboxScans();
