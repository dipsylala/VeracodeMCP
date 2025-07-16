#!/usr/bin/env node

/**
 * Debug what our client actually does when making SCA requests
 */

import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugClientBehavior() {
    console.log('🔍 Debugging client behavior for SCA requests');
    console.log('=' .repeat(60));
    
    try {
        const client = new VeracodeMCPClient({
            apiId: process.env.VERACODE_API_ID,
            apiKey: process.env.VERACODE_API_KEY
        });
        
        const appId = '71fe1fd2-0beb-4950-9ca5-e045da036687'; // VeraDemo-NET
        
        console.log(`📱 Testing SCA findings request for ${appId}...`);
        
        // Try to get SCA findings using the correct tool name
        const scaResult = await client.callTool({
            tool: 'get-sca-results',
            args: {
                application: appId,
                max_results: 5
            }
        });
        
        console.log('✅ Client call completed');
        console.log(`Success: ${scaResult.success}`);
        console.log(`Number of findings returned: ${scaResult.data?.findings?.length || 0}`);
        
        if (scaResult.data?.findings && scaResult.data.findings.length > 0) {
            console.log('\n📋 First finding details:');
            const first = scaResult.data.findings[0];
            console.log(`  Scan type: ${first.scan_type}`);
            console.log(`  Issue ID: ${first.issue_id}`);
            console.log(`  Severity: ${first.finding_details?.severity}`);
            
            // Check if this is truly SCA
            const scaProps = ['component_id', 'component_filename', 'cve', 'licenses'];
            const hasSCAProps = scaProps.some(prop => first.finding_details?.[prop]);
            
            console.log(`  Has SCA properties: ${hasSCAProps ? 'YES' : 'NO'}`);
            
            if (hasSCAProps) {
                console.log('  🎯 This appears to be a TRUE SCA finding');
            } else {
                console.log('  ⚠️  This appears to be a STATIC finding returned for SCA request');
            }
        } else {
            console.log('\n📭 No findings returned');
            if (scaResult.data) {
                console.log('Response data:', JSON.stringify(scaResult.data, null, 2));
            }
        }
        
        // Let's also check what scan types are actually available
        console.log('\n🔍 Checking available scan types via findings service...');
        
        // Try to get any findings to see what's actually available
        const anyResult = await client.callTool({
            tool: 'get-sca-results',
            args: {
                application: appId,
                max_results: 3
            }
        });
        
        if (anyResult.data?.findings && anyResult.data.findings.length > 0) {
            const actualScanTypes = [...new Set(anyResult.data.findings.map(f => f.scan_type))];
            console.log(`Actual scan types in findings: ${actualScanTypes.join(', ')}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.response) {
            console.log(`HTTP Status: ${error.response.status}`);
            console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

debugClientBehavior();
