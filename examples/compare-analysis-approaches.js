#!/usr/bin/env node

// Example: Comparing general findings vs detailed flaw analysis
// Usage: node examples/compare-analysis-approaches.js [app_name] [flaw_id]
// This example demonstrates the difference between:
// 1. get-findings-by-name (general overview)
// 2. get-static-flaw-info-by-name (detailed technical analysis)

import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function demonstrateFlawAnalysis() {
    const client = new VeracodeMCPClient();

    console.log('🔍 Demonstration: General Findings vs Detailed Flaw Analysis\n');

    // Get parameters from command line or use defaults
    const args = process.argv.slice(2);
    const appName = args[0] || 'MyApplication';
    const flawId = args[1] || '1';

    if (args.length < 2) {
        console.log('💡 Usage: node examples/compare-analysis-approaches.js <app_name> <flaw_id>');
        console.log(`📋 Using defaults: Application: "${appName}", Flaw ID: "${flawId}"\n`);
    }

    console.log(`📋 Application: ${appName}`);
    console.log(`🎯 Target Flaw ID: ${flawId}\n`);

    try {
        console.log('='.repeat(60));
        console.log('1️⃣  GENERAL FINDINGS OVERVIEW (get-findings-by-name)');
        console.log('='.repeat(60));
        console.log('👀 Good for: Overall security posture, finding counts, basic metadata\n');

        const findingsResult = await client.callTool({
            tool: 'get-findings-by-name',
            args: {
                name: appName,
                scan_type: 'STATIC',
                size: '5' // Just show first 5 for comparison
            }
        });

        if (findingsResult.success) {
            console.log(client.formatResult(findingsResult));
        } else {
            console.log(`❌ Error: ${findingsResult.error}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('2️⃣  DETAILED FLAW ANALYSIS (get-static-flaw-info-by-name)');
        console.log('='.repeat(60));
        console.log('🎯 Perfect for: Specific flaw investigation, data flow analysis, debugging\n');

        const flawResult = await client.callTool({
            tool: 'get-static-flaw-info-by-name',
            args: {
                name: appName,
                issue_id: flawId
            }
        });

        if (flawResult.success) {
            console.log(client.formatResult(flawResult));
        } else {
            console.log(`❌ Error: ${flawResult.error}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('📚 KEY DIFFERENCES:');
        console.log('='.repeat(60));
        console.log('🔍 General Findings (get-findings-by-name):');
        console.log('  ✅ Overall vulnerability counts and summaries');
        console.log('  ✅ Severity levels and compliance status');
        console.log('  ✅ Basic file/line information');
        console.log('  ✅ Comments and annotations (mitigations)');
        console.log('  ❌ No detailed technical analysis');
        console.log('  ❌ No data flow paths or call stacks\n');

        console.log('🎯 Detailed Flaw Analysis (get-static-flaw-info-by-name):');
        console.log('  ✅ Complete data flow analysis');
        console.log('  ✅ Call stack traces for debugging');
        console.log('  ✅ Step-by-step vulnerability paths');
        console.log('  ✅ Detailed source code locations');
        console.log('  ✅ Technical implementation details');
        console.log('  ❌ Only works for specific static flaw IDs\n');

        console.log('🤖 For AI Agents:');
        console.log('  • Use get-findings-* for vulnerability overviews and general questions');
        console.log('  • Use get-static-flaw-info-* when users ask about specific flaw IDs');
        console.log('  • The detailed analysis helps with remediation and understanding root causes');

    } catch (error) {
        console.error('❌ Error running demonstration:', error.message);
    }
}

// Check for required environment variables
const apiId = process.env.VERACODE_API_ID;
const apiKey = process.env.VERACODE_API_KEY;

if (!apiId || !apiKey) {
    console.error('❌ Error: Missing Veracode API credentials');
    console.error('Please set VERACODE_API_ID and VERACODE_API_KEY environment variables');
    process.exit(1);
}

console.log('🚀 Starting Flaw Analysis Demonstration...\n');
demonstrateFlawAnalysis();
