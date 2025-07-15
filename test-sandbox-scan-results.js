import { createScanTools } from './build/mcp-tools/scan.tools.js';
import { VeracodeMCPClient } from './build/veracode-mcp-client.js';

async function testGetScanResultsWithSandbox() {
    try {
        console.log('🎯 Testing get-scan-results with Development Sandbox\n');

        // Create the real Veracode client
        const veracodeClient = new VeracodeMCPClient();

        // Create the context with the real client
        const context = {
            veracodeClient: veracodeClient
        };

        // Get the scan tools
        const scanTools = createScanTools();
        const getScanResults = scanTools.find(tool => tool.name === 'get-scan-results');

        if (!getScanResults) {
            throw new Error('get-scan-results tool not found');
        }

        console.log('📡 Calling get-scan-results with:');
        console.log('   identifier: "MCPNotepad++"');
        console.log('   sandbox_identifier: "Development Sandbox"\n');

        // Call the tool with the specified parameters
        const result = await getScanResults.handler({
            identifier: "MCPNotepad++",
            sandbox_identifier: "Development Sandbox"
        }, context);

        console.log('📊 Results:');
        console.log('='.repeat(50));

        if (result.success) {
            console.log('✅ Success: true\n');

            console.log('📋 Summary:');
            console.log(`   Application: ${result.data.application_identifier}`);
            console.log(`   Context: ${result.data.context}`);
            console.log(`   Sandbox ID Used: ${result.data.sandbox_identifier}`);
            console.log(`   Scan Type Filter: ${result.data.scan_type_filter}`);
            console.log(`   Total Scans Found: ${result.data.count}`);
            console.log(`   Has Scans: ${result.data.has_scans}`);
            console.log(`   Available Types: ${result.data.available_scan_types.join(', ')}`);
            console.log(`   Message: ${result.data.message}\n`);

            if (result.data.scans && result.data.scans.length > 0) {
                console.log('🔍 Detailed Scan Results:');
                result.data.scans.forEach((scan, index) => {
                    console.log(`   ${index + 1}. Scan ID: ${scan.scan_id}`);
                    console.log(`      Type: ${scan.scan_type}`);
                    console.log(`      Status: ${scan.status}`);
                    console.log(`      Created: ${scan.created_date || 'N/A'}`);
                    console.log(`      Modified: ${scan.modified_date || 'N/A'}`);
                    console.log(`      Compliance: ${scan.policy_compliance_status || 'N/A'}`);
                    if (scan.scan_url) console.log(`      Scan URL: ${scan.scan_url}`);
                    if (scan.results_url) console.log(`      Results URL: ${scan.results_url}`);
                    console.log('');
                });
            }
        } else {
            console.log('❌ Success: false');
            console.log(`   Error: ${result.error}`);
        }

    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }
}

testGetScanResultsWithSandbox();
