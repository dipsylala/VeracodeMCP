#!/usr/bin/env node

// Test script to demonstrate enhanced flaw ID display
import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testFlawIdDisplay() {
    console.log('🔍 Testing Enhanced Flaw ID Display...\n');
    
    try {
        const client = new VeracodeMCPClient();
        
        // Test get-findings with enhanced flaw ID display
        console.log('📋 Testing get-findings tool with flaw ID emphasis...');
        const result = await client.callTool({
            tool: 'get-findings',
            args: {
                application: 'WebGoat',  // Using a common demo app
                size: 5  // Just get a few for demonstration
            }
        });
        
        if (result.success && result.data.findings) {
            console.log('\n✅ Enhanced Findings Response:');
            console.log('=' .repeat(60));
            
            result.data.findings.forEach((finding, index) => {
                console.log(`\n${index + 1}. FLAW TRACKING INFORMATION:`);
                console.log(`   🆔 Primary Flaw ID: ${finding.flaw_id}`);
                console.log(`   🔢 Issue ID: ${finding.issue_id}`);
                console.log(`   📊 Severity: ${finding.severity_level}`);
                console.log(`   🐛 CWE ID: ${finding.weakness_type}`);
                console.log(`   📝 Description: ${finding.vulnerability_title}`);
                console.log(`   🔄 Status: ${finding.remediation_status}`);
                console.log(`   📡 Scan Type: ${finding.scan_type}`);
                
                if (finding.tracking_info) {
                    console.log(`   📋 Tracking References:`);
                    console.log(`      - Flaw ID: ${finding.tracking_info.flaw_id}`);
                    console.log(`      - Reference ID: ${finding.tracking_info.reference_id}`);
                    console.log(`      - Veracode Issue ID: ${finding.tracking_info.veracode_issue_id}`);
                }
                console.log('   ' + '-'.repeat(50));
            });
            
            console.log(`\n📊 Summary: Found ${result.data.findings.length} findings with prominent flaw IDs`);
        } else {
            console.log('❌ No findings returned or error occurred');
            console.log('Response:', JSON.stringify(result, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testFlawIdDisplay();
