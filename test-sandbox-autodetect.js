import { createScanTools } from './build/mcp-tools/scan.tools.js';

async function testSandboxAutoDetection() {
    try {
        console.log('🧪 Testing Sandbox Auto-Detection in Scan Tools\n');

        // Mock context similar to the real MCP context
        const mockContext = {
            veracodeClient: {
                scans: {
                    getScans: async (identifier, scanType, sandboxId) => {
                        console.log(`📡 Mock getScans called with:`);
                        console.log(`   identifier: ${identifier}`);
                        console.log(`   scanType: ${scanType || 'all'}`);
                        console.log(`   sandboxId: ${sandboxId || 'none (policy)'}`);

                        // Return mock scan data
                        return [{
                            scan_id: '12345',
                            scan_type: 'STATIC',
                            status: 'PUBLISHED',
                            created_date: '2025-07-15',
                            modified_date: '2025-07-15',
                            policy_compliance_status: 'PASS'
                        }];
                    },
                    getScansBySandboxName: async (identifier, sandboxName, scanType) => {
                        console.log(`📡 Mock getScansBySandboxName called with:`);
                        console.log(`   identifier: ${identifier}`);
                        console.log(`   sandboxName: ${sandboxName}`);
                        console.log(`   scanType: ${scanType || 'all'}`);

                        if (sandboxName === 'Development Sandbox') {
                            return {
                                sandbox: {
                                    name: 'Development Sandbox',
                                    guid: 'd1e8b526-821a-46c7-8bb0-6426adc43213'
                                },
                                scans: [{
                                    scan_id: '67890',
                                    scan_type: 'STATIC',
                                    status: 'PUBLISHED'
                                }]
                            };
                        }
                        throw new Error(`Sandbox "${sandboxName}" not found`);
                    }
                }
            }
        };

        const scanTools = createScanTools();
        const getScanResults = scanTools.find(tool => tool.name === 'get-scan-results');

        if (!getScanResults) {
            throw new Error('get-scan-results tool not found');
        }

        // Test 1: Policy scans (no sandbox)
        console.log('🎯 Test 1: Policy scans (no sandbox identifier)');
        const result1 = await getScanResults.handler({
            identifier: 'MCPNotepad++'
        }, mockContext);
        console.log(`✅ Result 1 Context: ${result1.data?.context}\n`);

        // Test 2: Sandbox GUID
        console.log('🎯 Test 2: Using sandbox GUID');
        const result2 = await getScanResults.handler({
            identifier: 'MCPNotepad++',
            sandbox_identifier: 'd1e8b526-821a-46c7-8bb0-6426adc43213'
        }, mockContext);
        console.log(`✅ Result 2 Context: ${result2.data?.context}\n`);

        // Test 3: Sandbox name (should auto-resolve)
        console.log('🎯 Test 3: Using sandbox name (auto-resolve)');
        const result3 = await getScanResults.handler({
            identifier: 'MCPNotepad++',
            sandbox_identifier: 'Development Sandbox'
        }, mockContext);
        console.log(`✅ Result 3 Context: ${result3.data?.context}\n`);

        // Test 4: Invalid sandbox name
        console.log('🎯 Test 4: Invalid sandbox name');
        const result4 = await getScanResults.handler({
            identifier: 'MCPNotepad++',
            sandbox_identifier: 'NonExistent Sandbox'
        }, mockContext);
        console.log(`❌ Result 4: ${result4.success ? 'Success' : 'Error - ' + result4.error}\n`);

        console.log('🎉 Sandbox auto-detection tests completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSandboxAutoDetection();
