#!/usr/bin/env node

/**
 * Diagnostic script to understand the difference between get-findings and get-sca-results
 */

import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function diagnoseScaVsFindings() {
    console.log('🔬 DIAGNOSTIC: SCA vs Findings Tool Behavior');
    console.log('=' .repeat(70));
    
    try {
        const client = new VeracodeMCPClient();
        const appId = '71fe1fd2-0beb-4950-9ca5-e045da036687'; // VeraDemo-NET
        
        console.log(`📱 Application: VeraDemo-NET (${appId})`);
        console.log();
        
        // Test 1: get-sca-results tool
        console.log('🧪 TEST 1: get-sca-results (simplified SCA tool)');
        console.log('-' .repeat(50));
        
        const scaToolResult = await client.callTool({
            tool: 'get-sca-results',
            args: {
                application: appId,
                max_results: 3
            }
        });
        
        console.log(`Success: ${scaToolResult.success}`);
        console.log(`Findings: ${scaToolResult.data?.detailed_findings?.length || 0}`);
        if (scaToolResult.data?.scan_information?.note) {
            console.log(`Note: ${scaToolResult.data.scan_information.note}`);
        }
        
        console.log();
        
        // Test 2: get-findings with SCA scan type
        console.log('🧪 TEST 2: get-findings with scan_type=SCA');
        console.log('-' .repeat(50));
        
        const findingsToolResult = await client.callTool({
            tool: 'get-findings',
            args: {
                application: appId,
                scan_type: 'SCA',
                size: 3
            }
        });
        
        console.log(`Success: ${findingsToolResult.success}`);
        console.log(`Findings: ${findingsToolResult.data?.findings?.length || 0}`);
        console.log(`Total: ${findingsToolResult.data?.total_findings_count || 0}`);
        
        if (findingsToolResult.data?.findings && findingsToolResult.data.findings.length > 0) {
            console.log(`First finding scan_type: ${findingsToolResult.data.findings[0].scan_type}`);
            console.log(`Scan types found: ${Object.keys(findingsToolResult.data.findings_summary?.by_scan_type || {}).join(', ')}`);
        }
        
        console.log();
        
        // Test 3: Compare behavior
        console.log('🎯 ANALYSIS');
        console.log('-' .repeat(50));
        
        const scaFindings = scaToolResult.data?.detailed_findings?.length || 0;
        const findingsToolFindings = findingsToolResult.data?.findings?.length || 0;
        
        if (scaFindings === 0 && findingsToolFindings > 0) {
            console.log('🚨 DISCREPANCY FOUND:');
            console.log(`   • get-sca-results: ${scaFindings} findings`);
            console.log(`   • get-findings(SCA): ${findingsToolFindings} findings`);
            console.log('   • The findings tool is NOT respecting scan type filtering');
            console.log('   • This suggests get-findings may have a bug or different behavior');
        } else if (scaFindings === 0 && findingsToolFindings === 0) {
            console.log('✅ CONSISTENT BEHAVIOR:');
            console.log('   • Both tools correctly return 0 SCA findings');
            console.log('   • The API behavior is consistent');
        } else {
            console.log('📊 BOTH TOOLS FOUND SCA FINDINGS:');
            console.log(`   • get-sca-results: ${scaFindings} findings`);
            console.log(`   • get-findings(SCA): ${findingsToolFindings} findings`);
        }
        
    } catch (error) {
        console.error('❌ Error during diagnostic:', error.message);
    }
}

diagnoseScaVsFindings();
