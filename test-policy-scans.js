import { VeracodeMCPClient } from './build/veracode-mcp-client.js';

async function testPolicyScans() {
    try {
        console.log('🎯 Testing get-scan-results without sandbox (policy scans only)');

        const client = new VeracodeMCPClient();

        console.log('📡 Calling get-scan-results with:');
        console.log('   identifier: "MCPNotepad++"');
        console.log('   (no sandbox_identifier specified)');

        const result = await client.callTool({
            tool: 'get-scan-results',
            args: {
                identifier: 'MCPNotepad++'
                // No sandbox_identifier specified - should get policy scans
            }
        });

        console.log('📊 Results:');
        console.log('==================================================');

        if (result.success) {
            console.log('✅ Success:', result.success);
            console.log('📋 Raw Data Structure:');
            \


            console.log(JSON.stringify(result.data, null, 2));

            const data = result.data;

            // Application info
            console.log('\n🏢 Application:');
            console.log('   Name:', data.application?.name);
            console.log('   ID:', data.application?.id);
            console.log('   Business Criticality:', data.application?.business_criticality);

            // Scan information
            console.log('\n📊 Scan Information:');
            console.log('   Context:', data.context || 'Policy (main branch)');
            console.log('   Total Scans Found:', data.scan_information?.total_scans || 0);

            if (data.scan_information?.latest_scan) {
                const latest = data.scan_information.latest_scan;
                console.log('   Latest Scan:');
                console.log('     - Scan ID:', latest.scan_id);
                console.log('     - Type:', latest.scan_type);
                console.log('     - Status:', latest.status);
                console.log('     - Created:', latest.created_date);
                console.log('     - Modified:', latest.modified_date);
            }

            // Scan types
            if (data.scan_information?.scan_types?.length > 0) {
                console.log('   Available Scan Types:', data.scan_information.scan_types.join(', '));
            }

            // Analysis summary
            if (data.analysis) {
                console.log('\n📈 Analysis Summary:');
                console.log('   Total Findings:', data.analysis.totalFindings || 0);
                console.log('   Exploitable Findings:', data.analysis.exploitableFindings || 0);
                console.log('   High Risk Components:', data.analysis.highRiskComponents || 0);
            }

            // Execution metadata
            if (data.metadata) {
                console.log('\n⚡ Execution Info:');
                console.log('   Analysis Timestamp:', data.metadata.analysis_timestamp);
                console.log('   Execution Time:', data.metadata.execution_time_ms + 'ms');
            }

        } else {
            console.log('❌ Success:', result.success);
            console.log('   Error:', result.error);
        }

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

testPolicyScans();
