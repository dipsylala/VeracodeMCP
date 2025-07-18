#!/usr/bin/env node

// Debug remaining unknown errors
import { VeracodeDirectClient } from './build/test-utils/veracode-direct-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugRemainingErrors() {
    console.log('🔍 Debugging remaining unknown errors...');

    try {
        const client = new VeracodeDirectClient();

        // Test 1: Policy versions
        console.log('1. Testing get-policy-versions...');
        const versionsResult = await client.callTool({
            tool: 'get-policy-versions',
            args: {
                policy_guid: '4215b456-7d6a-4ba9-8beb-7cd7b4dad88a',
                size: 5
            }
        });
        console.log('Policy versions result:');
        console.log(JSON.stringify(versionsResult, null, 2));

        // Test 2: Component policies
        console.log('\n2. Testing get-policies with COMPONENT category...');
        const componentResult = await client.callTool({
            tool: 'get-policies',
            args: {
                category: 'COMPONENT',
                size: 5
            }
        });
        console.log('Component policies result:');
        console.log(JSON.stringify(componentResult, null, 2));

    } catch (error) {
        console.log('❌ Caught exception:', error.message);
    }
}

debugRemainingErrors();
