#!/usr/bin/env node

// Debug script to see what's actually happening with policy calls
import { VeracodeDirectClient } from './build/test-utils/veracode-direct-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugPolicyCall() {
    console.log('🔍 Debugging policy call to see detailed response...');

    try {
        const client = new VeracodeDirectClient();

        console.log('1. Testing get-policies call...');
        const result = await client.callTool({
            tool: 'get-policies',
            args: { size: 10 }
        });

        console.log('Full result object:');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n2. Testing with no args...');
        const result2 = await client.callTool({
            tool: 'get-policies'
        });

        console.log('Full result object (no args):');
        console.log(JSON.stringify(result2, null, 2));

    } catch (error) {
        console.log('❌ Caught exception:', error.message);
        console.log('Full error:', error);
    }
}

debugPolicyCall();
