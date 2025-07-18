#!/usr/bin/env node

import { VeracodeDirectClient } from './build/test-utils/veracode-direct-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPolicySettings() {
    console.log('🔍 Testing basic policy settings call...');

    try {
        const client = new VeracodeDirectClient();

        // First, let's see what tools are available
        console.log('Available tools:', client.getAvailableTools().filter(t => t.includes('policy')));

        const result = await client.callTool({
            tool: 'get-policy-settings'
            // explicitly no args property
        });
        console.log('✅ Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testPolicySettings();
