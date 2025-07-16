#!/usr/bin/env node

import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';

async function testSearchApplicationProfiles() {
    console.log('🔍 Testing search-application-profiles tool...\n');
    
    const client = new VeracodeMCPClient();
    
    try {
        // Test 1: Search with just a name parameter
        console.log('Test 1: Basic search with name parameter...');
        const result1 = await client.callTool({
            tool: 'search-application-profiles',
            args: {
                name: 'Test'
            }
        });
        
        console.log('✅ Result 1:', JSON.stringify(result1, null, 2));
        
        // Test 2: Search with empty name (should fail)
        console.log('\nTest 2: Search with empty name (should fail)...');
        const result2 = await client.callTool({
            tool: 'search-application-profiles',
            args: {
                name: ''
            }
        });
        
        console.log('Result 2:', JSON.stringify(result2, null, 2));
        
        // Test 3: Search without name parameter (should fail)
        console.log('\nTest 3: Search without name parameter (should fail)...');
        const result3 = await client.callTool({
            tool: 'search-application-profiles',
            args: {}
        });
        
        console.log('Result 3:', JSON.stringify(result3, null, 2));
        
    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

testSearchApplicationProfiles().catch(console.error);
