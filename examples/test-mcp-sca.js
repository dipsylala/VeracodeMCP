#!/usr/bin/env node

import { VeracodeMCPClient } from "../build/veracode-mcp-client.js";
import * as dotenv from "dotenv";

dotenv.config();

async function testMCPSCATools() {
    console.log('🔍 Testing MCP SCA tools with MCPVerademo-Net...\n');

    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('❌ Missing API credentials in .env file');
        process.exit(1);
    }

    try {
        const client = new VeracodeMCPClient();

        console.log('📋 First, testing get-findings tool to see what\'s available...');
        const allFindings = await client.callTool({
            tool: 'get-findings',
            args: {
                application: 'MCPVerademo-Net',
                max_results: 50
            }
        });

        if (allFindings.success) {
            console.log(`✅ All findings: ${allFindings.data.analysis?.totalFindings || 0} total findings`);
            
            if (allFindings.data.findings?.length > 0) {
                console.log('\n📋 Sample findings:');
                allFindings.data.findings.slice(0, 3).forEach((finding, index) => {
                    console.log(`\n${index + 1}. Finding Category: ${finding.finding_category_name || 'Unknown'} (ID: ${finding.finding_category_id})`);
                    console.log(`   Type: ${finding.finding_source || 'Unknown'}`);
                    console.log(`   Severity: ${finding.severity}`);
                    console.log(`   Has Component: ${!!finding.finding_details?.component_filename}`);
                    console.log(`   Component: ${finding.finding_details?.component_filename || 'N/A'}`);
                });
            }
        } else {
            console.log('❌ Error getting all findings:', allFindings.error);
        }

        console.log('\n📋 Now testing get-sca-results tool...');
        const scaResults = await client.callTool({
            tool: 'get-sca-results',
            args: {
                application: 'MCPVerademo-Net',
                max_results: 10
            }
        });

        if (scaResults.success) {
            console.log('✅ SCA Results retrieved successfully!');
            console.log(`Total findings: ${scaResults.data.analysis?.totalFindings || 0}`);
            
            if (scaResults.data.detailed_findings?.length > 0) {
                console.log('\n📋 Sample SCA Findings:');
                scaResults.data.detailed_findings.slice(0, 5).forEach((finding, index) => {
                    console.log(`\n${index + 1}. Component: ${finding.finding_details?.component_filename || 'Unknown'}`);
                    console.log(`   Library: ${finding.finding_details?.library || 'Unknown'}`);
                    console.log(`   Version: ${finding.finding_details?.version || 'N/A'}`);
                    console.log(`   Severity: ${finding.severity}`);
                    console.log(`   CVE: ${finding.finding_details?.cve_id || 'N/A'}`);
                });
                
                // Look specifically for system.drawing.common.dll
                const drawingCommonFindings = scaResults.data.detailed_findings.filter(f => 
                    f.finding_details?.component_filename?.toLowerCase().includes('system.drawing.common')
                );
                
                if (drawingCommonFindings.length > 0) {
                    console.log(`\n🎯 Found ${drawingCommonFindings.length} findings related to system.drawing.common.dll:`);
                    drawingCommonFindings.forEach((finding, index) => {
                        console.log(`\n${index + 1}. ${finding.finding_details?.component_filename}`);
                        console.log(`   Vulnerability: ${finding.finding_details?.cve_id || finding.issue_id}`);
                        console.log(`   Severity: ${finding.severity}`);
                        console.log(`   Library: ${finding.finding_details?.library || 'Unknown'}`);
                        console.log(`   Version: ${finding.finding_details?.version || 'Unknown'}`);
                    });
                }
            } else {
                console.log('❌ No detailed findings found');
            }
        } else {
            console.log('❌ Error getting SCA results:', scaResults.error);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testMCPSCATools();
