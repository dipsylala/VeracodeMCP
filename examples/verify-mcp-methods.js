#!/usr/bin/env node

import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function verifyMCPClientMethods() {
    console.log('Verifying MCP Client method support...\n');

    const client = new VeracodeMCPClient();

    // Test cases to verify which methods are supported
    const testCases = [
        { tool: "get-applications" },
        { tool: "get-findings", args: { app_id: "test" } },
        { tool: "get-findings-advanced-by-name", args: { name: "test" } },
        { tool: "get-findings-paginated", args: { name: "test" } },
        { tool: "get-all-findings", args: { app_id: "test" } },
        { tool: "unknown-method" }
    ];

    for (const testCase of testCases) {
        try {
            console.log(`🔍 Testing: ${testCase.tool}`);
            const result = await client.callTool(testCase);

            if (result.success) {
                console.log(`  ✅ Method supported`);
            } else {
                console.log(`  ❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.log(`  💥 Exception: ${error.message}`);
        }
        console.log('');
    }
}

// Run the verification
verifyMCPClientMethods().catch(console.error);
