#!/usr/bin/env node

// Example script to get static flaw information with data paths
// Usage: node examples/get-static-flaw-info.js <app_id> <issue_id> [context]

import { VeracodeClient } from '../build/veracode-rest-client.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Usage: node examples/get-static-flaw-info.js <app_id> <issue_id> [context]');
        console.log('');
        console.log('Examples:');
        console.log('  node examples/get-static-flaw-info.js 12345678-abcd-1234-5678-123456789012 67890');
        console.log('  node examples/get-static-flaw-info.js 12345678-abcd-1234-5678-123456789012 67890 sandbox-guid-here');
        process.exit(1);
    }

    const appId = args[0];
    const issueId = args[1];
    const context = args[2];

    // Check for required environment variables
    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('❌ Error: Missing Veracode API credentials');
        console.error('Please set VERACODE_API_ID and VERACODE_API_KEY environment variables');
        process.exit(1);
    }

    try {
        console.log(`🔍 Getting static flaw information for issue ${issueId} in application ${appId}...`);
        if (context) {
            console.log(`📦 Context (Sandbox): ${context}`);
        }
        console.log();

        const client = new VeracodeClient(apiId, apiKey);
        const result = await client.getStaticFlawInfo(appId, issueId, context);

        console.log('✅ Static Flaw Information Retrieved:\n');

        // Display issue summary
        console.log('📋 Issue Summary:');
        console.log(`  Application GUID: ${result.issue_summary.app_guid}`);
        console.log(`  Issue ID: ${result.issue_summary.issue_id}`);
        console.log(`  Build ID: ${result.issue_summary.build_id}`);
        console.log(`  Name: ${result.issue_summary.name}`);
        if (result.issue_summary.context) {
            console.log(`  Context (Sandbox): ${result.issue_summary.context}`);
        }
        console.log();

        // Display data paths
        console.log(`🔍 Data Paths (${result.data_paths.length} path${result.data_paths.length !== 1 ? 's' : ''}):\n`);

        result.data_paths.forEach((dataPath, pathIndex) => {
            console.log(`Path ${pathIndex + 1}:`);
            console.log(`  Module: ${dataPath.module_name}`);
            console.log(`  Function: ${dataPath.function_name}`);
            console.log(`  Local Path: ${dataPath.local_path}`);
            console.log(`  Line Number: ${dataPath.line_number}`);
            console.log(`  Steps: ${dataPath.steps}`);

            if (dataPath.calls && dataPath.calls.length > 0) {
                console.log(`  Call Stack:`);
                dataPath.calls.forEach((call, callIndex) => {
                    console.log(`    ${call.data_path}. ${call.function_name}() in ${call.file_name}:${call.line_number}`);
                    if (call.file_path !== call.file_name) {
                        console.log(`       Path: ${call.file_path}`);
                    }
                });
            }
            console.log();
        });

        // Display links if available
        if (result._links && result._links.length > 0) {
            console.log('🔗 Related Links:');
            result._links.forEach(link => {
                console.log(`  ${link.name || 'Link'}: ${link.href}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
