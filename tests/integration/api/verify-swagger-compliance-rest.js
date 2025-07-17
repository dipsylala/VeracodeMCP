#!/usr/bin/env node

/**
 * Analysis script to verify our SCA implementation against the official Swagger spec
 * Based on the Veracode Findings API Specification v2.1
 */

import { VeracodeClient } from '../../../build/veracode-rest-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function verifySwaggerCompliance() {
    const client = new VeracodeClient();
    const appName = 'MCPVerademo-Net';
    
    console.log(`🔍 Swagger Compliance Verification for ${appName}`);
    console.log('=' .repeat(70));
    
    try {
        // 1. Find the application
        const searchResults = await client.applications.searchApplications(appName);
        const app = searchResults[0];
        
        console.log(`\n📱 Application: ${app.profile.name} (ID: ${app.guid})`);
        
        // 2. According to Swagger spec, SCA findings should be accessible via:
        // GET /appsec/v2/applications/{application_guid}/findings?scan_type=SCA
        console.log('\n🔧 Testing Swagger-compliant SCA endpoint...');
        
        // Test the exact endpoint from Swagger spec
        const swaggerEndpoint = `/appsec/v2/applications/${app.guid}/findings`;
        console.log(`Endpoint: ${swaggerEndpoint}`);
        
        try {
            // Use the findings service to make the exact Swagger v2 API call
            // This matches: GET /appsec/v2/applications/{application_guid}/findings?scan_type=SCA
            const findingsService = client.findings;
            
            // Make direct call using the exact Swagger spec endpoint
            const response = await findingsService.apiClient.get(`/appsec/v2/applications/${app.guid}/findings`, {
                params: {
                    scan_type: 'SCA',
                    size: 100
                }
            });
            
            console.log(`\n✅ API Response Status: ${response.status}`);
            
            if (response.data) {
                console.log(`\n📊 Response Structure Analysis:`);
                console.log(`Top-level keys: ${Object.keys(response.data).join(', ')}`);
                
                // Check for the _embedded structure from Swagger spec
                if (response.data._embedded) {
                    console.log(`_embedded keys: ${Object.keys(response.data._embedded).join(', ')}`);
                    
                    if (response.data._embedded.findings) {
                        const findings = response.data._embedded.findings;
                        console.log(`\n🎯 SCA Findings Found: ${findings.length}`);
                        
                        if (findings.length > 0) {
                            console.log('\n🔬 Sample SCA Finding Analysis (per Swagger spec):');
                            const sampleFinding = findings[0];
                            
                            // Verify Swagger spec compliance
                            const requiredScaProperties = [
                                'scan_type',
                                'description',
                                'finding_details'
                            ];
                            
                            console.log('\n📋 Required Properties Check:');
                            requiredScaProperties.forEach(prop => {
                                const hasProperty = sampleFinding.hasOwnProperty(prop);
                                const value = sampleFinding[prop];
                                console.log(`  ✓ ${prop}: ${hasProperty ? 'PRESENT' : 'MISSING'} ${hasProperty ? `(${typeof value})` : ''}`);
                            });
                            
                            // Check scan_type specifically
                            console.log(`\n🔍 Scan Type Verification:`);
                            console.log(`  scan_type value: "${sampleFinding.scan_type}"`);
                            console.log(`  Expected: "SCA"`);
                            console.log(`  Match: ${sampleFinding.scan_type === 'SCA' ? '✅ YES' : '❌ NO'}`);
                            
                            // Analyze finding_details for SCA-specific structure
                            if (sampleFinding.finding_details) {
                                console.log('\n🧬 SCA Finding Details (per Swagger ScaFinding schema):');
                                const scaProps = [
                                    'component_id',
                                    'component_filename', 
                                    'cve',
                                    'licenses',
                                    'version',
                                    'product_id',
                                    'language',
                                    'component_path',
                                    'metadata'
                                ];
                                
                                scaProps.forEach(prop => {
                                    const hasProperty = sampleFinding.finding_details.hasOwnProperty(prop);
                                    const value = sampleFinding.finding_details[prop];
                                    console.log(`  ${hasProperty ? '✅' : '❌'} ${prop}: ${hasProperty ? (value ? 'HAS_VALUE' : 'NULL/EMPTY') : 'MISSING'}`);
                                });
                                
                                // Check CVE structure specifically (critical for SCA)
                                if (sampleFinding.finding_details.cve) {
                                    console.log('\n🔒 CVE Structure Verification:');
                                    const cve = sampleFinding.finding_details.cve;
                                    const cveProps = ['name', 'cvss', 'href', 'severity', 'vector', 'cvss3', 'exploitability'];
                                    
                                    cveProps.forEach(prop => {
                                        const hasProperty = cve.hasOwnProperty(prop);
                                        console.log(`    ${hasProperty ? '✅' : '❌'} ${prop}: ${hasProperty ? 'PRESENT' : 'MISSING'}`);
                                    });
                                }
                            }
                            
                            // Show first few findings details
                            console.log('\n📝 Sample SCA Findings Summary:');
                            findings.slice(0, 3).forEach((finding, index) => {
                                console.log(`  ${index + 1}. ${finding.description?.substring(0, 80)}...`);
                                console.log(`     Scan Type: ${finding.scan_type}`);
                                console.log(`     Component: ${finding.finding_details?.component_filename || 'N/A'}`);
                                console.log(`     CVE: ${finding.finding_details?.cve?.name || 'N/A'}`);
                                console.log(`     Severity: ${finding.finding_details?.severity || 'N/A'}`);
                                console.log('');
                            });
                        }
                    }
                } else {
                    console.log('❌ Missing _embedded structure (required by Swagger spec)');
                }
                
                // Check pagination structure
                if (response.data.page) {
                    console.log(`\n📄 Pagination Info:`);
                    console.log(`  Current page: ${response.data.page.number}`);
                    console.log(`  Page size: ${response.data.page.size}`);
                    console.log(`  Total elements: ${response.data.page.total_elements}`);
                    console.log(`  Total pages: ${response.data.page.total_pages}`);
                }
            }
            
        } catch (apiError) {
            console.log(`❌ API Error: ${apiError.message}`);
            if (apiError.response) {
                console.log(`Status: ${apiError.response.status}`);
                console.log(`Data: ${JSON.stringify(apiError.response.data, null, 2)}`);
            }
        }
        
        // 3. Compare with our current implementation
        console.log('\n🔄 Comparing with Current Implementation...');
        try {
            const currentResults = await client.findings.getFindingsPaginated(app.guid, {
                scan_type: 'SCA',
                size: 100
            });
            
            console.log(`Current implementation found: ${currentResults?.findings?.length || 0} findings`);
            
            if (currentResults?.findings?.length > 0) {
                const sample = currentResults.findings[0];
                console.log(`Current scan_type: ${sample.scan_type}`);
                console.log(`Current has component_id: ${!!sample.finding_details?.component_id}`);
                console.log(`Current has CVE: ${!!sample.finding_details?.cve}`);
            }
        } catch (currentError) {
            console.log(`Current implementation error: ${currentError.message}`);
        }
        
        console.log('\n🎯 SWAGGER COMPLIANCE SUMMARY:');
        console.log('=' .repeat(70));
        console.log('Based on Swagger spec v2.1, true SCA findings should have:');
        console.log('✓ scan_type: "SCA"');
        console.log('✓ finding_details.component_id (UUID)'); 
        console.log('✓ finding_details.component_filename');
        console.log('✓ finding_details.cve.name (CVE ID)');
        console.log('✓ finding_details.cve.cvss (CVSS score)');
        console.log('✓ finding_details.licenses array');
        console.log('✓ finding_details.version');
        console.log('✓ finding_details.component_path array');
        
    } catch (error) {
        console.error('❌ Error during verification:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the verification
verifySwaggerCompliance().catch(console.error);
