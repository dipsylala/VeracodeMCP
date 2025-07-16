#!/usr/bin/env node

import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';

async function debugSearchApplicationProfiles() {
    console.log('🔍 Debugging search-application-profiles arguments...\n');
    
    const client = new VeracodeMCPClient();
    
    // Let's manually inspect what's happening in the tool registry
    console.log('📋 Available tools:', client.getAvailableTools());
    console.log('✅ Has search-application-profiles tool:', client.hasTool('search-application-profiles'));
    
    console.log('\n📤 Testing tool call structure...');
    
    const testToolCall = {
        tool: 'search-application-profiles',
        args: {
            name: 'Test'
        }
    };
    
    console.log('Tool call object:', JSON.stringify(testToolCall, null, 2));
    
    try {
        console.log('\n🚀 Executing tool call...');
        const result = await client.callTool(testToolCall);
        console.log('✅ Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugSearchApplicationProfiles().catch(console.error);
