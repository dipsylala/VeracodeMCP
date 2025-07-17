#!/usr/bin/env node

/**
 * Deep analysis of the 71 findings returned when requesting SCA from STATIC scan
 * to understand if these are true SCA findings or misclassified SAST findings
 */

import { VeracodeClient } from '../../../build/veracode-rest-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeStaticScaFindings() {
    const client = new VeracodeClient();
    const appName = 'MCPVerademo-Net';
    
    console.log(`🔬 Deep Analysis: SCA Findings from STATIC Scan for ${appName}`);
    console.log('=' .repeat(70));
    
    try {
        // Find the application
        const searchResults = await client.applications.searchApplications(appName);
        const app = searchResults[0];
        
        console.log(`\n📱 Application: ${app.profile.name} (ID: ${app.guid})`);
        
        // Get the "SCA" findings from the STATIC scan
        console.log('\n🔍 Retrieving "SCA" findings from STATIC scan...');
        const findingsResponse = await client.findings.getFindingsPaginated(app.guid, {
            scan_type: 'SCA',
            size: 100
        });
        
        if (!findingsResponse?.findings || findingsResponse.findings.length === 0) {
            console.log('❌ No findings returned');
            return;
        }
        
        const findings = findingsResponse.findings;
        console.log(`✅ Retrieved ${findings.length} findings`);
        
        // Analyze the structure of these findings
        console.log('\n📊 Finding Structure Analysis:');
        console.log('-' .repeat(40));
        
        // Sample the first finding for structure analysis
        const sampleFinding = findings[0];
        console.log('\n🔬 Sample Finding Structure:');
        console.log('Keys:', Object.keys(sampleFinding).join(', '));
        
        // Check for SCA-specific properties
        const scaProperties = [
            'component_id', 'component_filename', 'component_path',
            'library', 'version', 'cve', 'cve_id', 'cvss_score',
            'license', 'license_risk', 'epss_score', 'exploitability'
        ];
        
        console.log('\n🧬 SCA Property Analysis:');
        scaProperties.forEach(prop => {
            const hasProperty = sampleFinding.hasOwnProperty(prop);
            const value = sampleFinding[prop];
            console.log(`  ${prop}: ${hasProperty ? (value || 'null/empty') : 'missing'}`);
        });
        
        // Analyze finding_details for SCA content
        console.log('\n🔍 Finding Details Analysis:');
        if (sampleFinding.finding_details) {
            console.log('  finding_details keys:', Object.keys(sampleFinding.finding_details).join(', '));
            
            // Check for nested SCA properties
            const details = sampleFinding.finding_details;
            scaProperties.forEach(prop => {
                if (details.hasOwnProperty(prop)) {
                    console.log(`  details.${prop}: ${details[prop] || 'null/empty'}`);
                }
            });
        } else {
            console.log('  No finding_details available');
        }
        
        // Categorize findings by type
        console.log('\n📈 Finding Categorization:');
        console.log('-' .repeat(40));
        
        const categories = {
            trueSCA: [],
            sastWithComponents: [],
            traditionalSast: []
        };
        
        findings.forEach((finding, index) => {
            const hasScaProps = scaProperties.some(prop => 
                finding[prop] || (finding.finding_details && finding.finding_details[prop])
            );
            
            const description = (finding.description || '').toLowerCase();
            const hasComponentMention = description.includes('component') || 
                                     description.includes('library') || 
                                     description.includes('dll') ||
                                     description.includes('dependency');
            
            const hasCve = description.includes('cve') || 
                          finding.cve_id || 
                          (finding.finding_details && finding.finding_details.cve);
            
            if (hasScaProps && hasCve) {
                categories.trueSCA.push(finding);
            } else if (hasComponentMention) {
                categories.sastWithComponents.push(finding);
            } else {
                categories.traditionalSast.push(finding);
            }
        });
        
        console.log(`🎯 True SCA findings: ${categories.trueSCA.length}`);
        console.log(`🔧 SAST with component mentions: ${categories.sastWithComponents.length}`);
        console.log(`📝 Traditional SAST findings: ${categories.traditionalSast.length}`);
        
        // Show examples from each category
        if (categories.trueSCA.length > 0) {
            console.log('\n🎯 TRUE SCA FINDING EXAMPLES:');
            categories.trueSCA.slice(0, 2).forEach((finding, index) => {
                console.log(`  ${index + 1}. ${finding.description?.substring(0, 100)}...`);
                console.log(`     CVE: ${finding.cve_id || finding.finding_details?.cve || 'N/A'}`);
                console.log(`     Component: ${finding.component_filename || finding.finding_details?.component_filename || 'N/A'}`);
            });
        }
        
        if (categories.sastWithComponents.length > 0) {
            console.log('\n🔧 SAST WITH COMPONENT MENTIONS:');
            categories.sastWithComponents.slice(0, 3).forEach((finding, index) => {
                console.log(`  ${index + 1}. ${finding.description?.substring(0, 100)}...`);
                console.log(`     File: ${finding.finding_details?.file_name || 'N/A'}`);
                console.log(`     Line: ${finding.finding_details?.file_line_number || 'N/A'}`);
            });
        }
        
        // Check scan metadata
        console.log('\n📋 Scan Metadata:');
        console.log('-' .repeat(40));
        const uniqueScanIds = [...new Set(findings.map(f => f.scan_id))];
        console.log(`Unique scan IDs: ${uniqueScanIds.join(', ')}`);
        
        const uniqueScanTypes = [...new Set(findings.map(f => f.scan_type))];
        console.log(`Scan types represented: ${uniqueScanTypes.join(', ')}`);
        
        // Final conclusion
        console.log('\n🎯 CONCLUSION:');
        console.log('=' .repeat(70));
        
        if (categories.trueSCA.length > 0) {
            console.log(`✅ Found ${categories.trueSCA.length} TRUE SCA findings embedded in STATIC scan`);
            console.log('   These findings have CVE data and component information');
        } else {
            console.log('❌ No TRUE SCA findings found');
            console.log('   The 71 findings appear to be SAST findings that mention components/DLLs');
        }
        
        console.log(`\n💡 Recommendation:`);
        if (categories.trueSCA.length > 0) {
            console.log('   - Update SCA tools to search within STATIC scans');
            console.log('   - Filter findings by SCA-specific properties rather than scan_type');
        } else {
            console.log('   - The UI may be showing different data than the API provides');
            console.log('   - Consider checking other applications or scan types');
            console.log('   - The "SCA results" in UI might be interpreted differently');
        }
        
    } catch (error) {
        console.error('❌ Error during analysis:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the analysis
analyzeStaticScaFindings().catch(console.error);
