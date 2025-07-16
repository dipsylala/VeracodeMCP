import { VeracodeClient } from '../build/veracode-rest-client.js';

async function inspectStaticForSCA() {
    console.log('🔍 Checking MCPVerademo-Net STATIC scan for SCA findings...');
    
    try {
        const client = new VeracodeClient();
        
        // Get the app
        const apps = await client.applications.getApplications({ name: 'MCPVerademo-Net' });
        const app = apps.find(a => a.profile?.name === 'MCPVerademo-Net');
        
        if (!app) {
            console.log('❌ MCPVerademo-Net not found');
            return;
        }
        
        const appGuid = app.guid;
        console.log(`✅ Found app: ${app.profile?.name} (${appGuid})`);
        
        // Get ALL findings from STATIC scan (no scan_type filter, larger sample)
        console.log('\n📋 Getting all STATIC findings to check for SCA...');
        const result = await client.findings.getFindingsPaginated(appGuid, { 
            size: 100,  // Get more findings to see variety
            scanType: 'STATIC'
        });
        
        console.log(`✅ Retrieved ${result.findings.length} findings from ${result.pagination.total_elements} total`);
        
        if (result.findings.length > 0) {
            // Analyze for SCA characteristics based on Swagger example
            const scaFindings = result.findings.filter(finding => {
                const details = finding.finding_details;
                return (
                    // Has SCA-specific properties from Swagger spec
                    details?.component_id ||
                    details?.component_filename ||
                    details?.version ||
                    details?.licenses ||
                    details?.cve ||
                    details?.product_id ||
                    details?.language ||
                    details?.metadata?.sca_scan_mode ||
                    details?.metadata?.sca_dep_mode ||
                    // Description suggests dependency/component issue
                    finding.description?.toLowerCase().includes('component') ||
                    finding.description?.toLowerCase().includes('library') ||
                    finding.description?.toLowerCase().includes('dependency') ||
                    finding.description?.toLowerCase().includes('package') ||
                    finding.description?.toLowerCase().includes('npm') ||
                    finding.description?.toLowerCase().includes('.dll') ||
                    finding.description?.toLowerCase().includes('nuget')
                );
            });
            
            console.log(`\n📋 SCA findings detected: ${scaFindings.length}`);
            
            if (scaFindings.length > 0) {
                console.log('\n🎯 SCA Finding Details:');
                scaFindings.forEach((finding, index) => {
                    console.log(`\n${index + 1}. Finding ID: ${finding.issue_id}`);
                    console.log(`   Scan Type: ${finding.scan_type}`);
                    console.log(`   Description: ${finding.description?.substring(0, 150)}...`);
                    
                    const details = finding.finding_details;
                    if (details) {
                        console.log(`   Component ID: ${details.component_id || 'N/A'}`);
                        console.log(`   Component Filename: ${details.component_filename || 'N/A'}`);
                        console.log(`   Version: ${details.version || 'N/A'}`);
                        console.log(`   Language: ${details.language || 'N/A'}`);
                        console.log(`   CVE: ${details.cve?.name || 'N/A'}`);
                        console.log(`   CVSS: ${details.cve?.cvss || 'N/A'}`);
                        console.log(`   Severity: ${details.severity || 'N/A'}`);
                        
                        if (details.licenses?.length > 0) {
                            console.log(`   Licenses: ${details.licenses.map(l => l.license_id).join(', ')}`);
                        }
                        
                        if (details.metadata) {
                            console.log(`   SCA Scan Mode: ${details.metadata.sca_scan_mode || 'N/A'}`);
                            console.log(`   SCA Dependency Mode: ${details.metadata.sca_dep_mode || 'N/A'}`);
                        }
                        
                        // Check for system.drawing.common specifically
                        if (details.component_filename?.toLowerCase().includes('system.drawing.common')) {
                            console.log(`   🎯 FOUND system.drawing.common dependency!`);
                        }
                    }
                });
            }
            
            // Also analyze all finding details structures to see what we have
            console.log('\n📊 Analysis of all finding structures:');
            const detailsKeys = new Set();
            const hasComponentInfo = [];
            
            result.findings.forEach(finding => {
                if (finding.finding_details) {
                    Object.keys(finding.finding_details).forEach(key => detailsKeys.add(key));
                    
                    // Track findings with any component-like properties
                    const details = finding.finding_details;
                    if (details.component_id || details.component_filename || details.version || 
                        details.cve || details.licenses || details.product_id) {
                        hasComponentInfo.push(finding.issue_id);
                    }
                }
            });
            
            console.log(`All finding_details keys found: ${Array.from(detailsKeys).sort().join(', ')}`);
            console.log(`Findings with component-like properties: ${hasComponentInfo.length}`);
            
            if (hasComponentInfo.length > 0) {
                console.log(`Component findings IDs: ${hasComponentInfo.slice(0, 5).join(', ')}${hasComponentInfo.length > 5 ? '...' : ''}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error inspecting for SCA findings:', error);
    }
}

inspectStaticForSCA();
