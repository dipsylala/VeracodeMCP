import { VeracodeClient } from '../build/veracode-rest-client.js';

async function inspectFindingsStructure() {
    console.log('🔍 Inspecting findings structure for MCPVerademo-Net...');
    
    try {
        const client = new VeracodeClient();
        
        // Get the app first
        const apps = await client.applications.getApplications({ name: 'MCPVerademo-Net' });
        const app = apps.find(a => a.profile?.name === 'MCPVerademo-Net');
        
        if (!app) {
            console.log('❌ MCPVerademo-Net not found');
            return;
        }
        
        const appGuid = app.guid;
        console.log(`✅ Found app: ${app.profile?.name} (${appGuid})`);
        
        // Get findings with debug - try different scan types
        console.log('\n📋 Getting STATIC findings...');
        const staticResult = await client.findings.getFindingsPaginated(appGuid, { 
            size: 10,
            scanType: 'STATIC'
        });
        
        console.log(`✅ STATIC findings:`, {
            count: staticResult.findings.length,
            totalElements: staticResult.pagination.total_elements
        });
        
        console.log('\n📋 Getting SCA findings...');
        const scaResult = await client.findings.getFindingsPaginated(appGuid, { 
            size: 10,
            scanType: 'SCA'
        });
        
        console.log(`✅ SCA findings:`, {
            count: scaResult.findings.length,
            totalElements: scaResult.pagination.total_elements
        });
        
        console.log('\n📋 Getting ALL findings (no scan type filter)...');
        const allResult = await client.findings.getFindingsPaginated(appGuid, { 
            size: 50  // Get more to see variety
        });
        
        console.log(`✅ ALL findings:`, {
            count: allResult.findings.length,
            totalElements: allResult.pagination.total_elements
        });
        
        // Analyze the findings from the "all" results
        if (allResult.findings.length > 0) {
            const scanTypes = [...new Set(allResult.findings.map(f => f.scan_type))];
            console.log('\n📋 All scan types found:', scanTypes);
            
            // Look for any findings with component information
            const withComponents = allResult.findings.filter(f => 
                f.finding_details?.component_filename || 
                f.finding_details?.component_id ||
                f.finding_details?.version ||
                f.finding_details?.licenses
            );
            console.log(`\n📋 Findings with component info: ${withComponents.length}`);
            
            if (withComponents.length > 0) {
                console.log('Sample component finding:');
                const componentFinding = withComponents[0];
                console.log({
                    scan_type: componentFinding.scan_type,
                    description: componentFinding.description?.substring(0, 100) + '...',
                    finding_details_keys: Object.keys(componentFinding.finding_details || {}),
                    component_filename: componentFinding.finding_details?.component_filename,
                    component_id: componentFinding.finding_details?.component_id
                });
            }
            
            // Check for SCA specifically
            const scaFindings = allResult.findings.filter(f => f.scan_type === 'SCA');
            console.log(`\n� SCA findings in all results: ${scaFindings.length}`);
            
            if (scaFindings.length > 0) {
                console.log('SCA Finding sample:');
                const scaFinding = scaFindings[0];
                console.log({
                    scan_type: scaFinding.scan_type,
                    description: scaFinding.description?.substring(0, 100) + '...',
                    finding_details_keys: Object.keys(scaFinding.finding_details || {}),
                    component: scaFinding.finding_details?.component_filename,
                    severity: scaFinding.finding_details?.severity,
                    cve: scaFinding.finding_details?.cve?.name
                });
            }
        }
        
        if (findings && findings.length > 0) {
            console.log('\n📋 First finding structure:');
            const firstFinding = findings[0];
            console.log('Finding keys:', Object.keys(firstFinding));
            console.log('Finding categories:', firstFinding.finding_category);
            console.log('Finding details:', {
                id: firstFinding.issue_id,
                categoryId: firstFinding.finding_category_id,
                categoryName: firstFinding.finding_category_name,
                severity: firstFinding.severity,
                exploitability: firstFinding.exploitability,
                description: firstFinding.description,
                componentPath: firstFinding.component_path,
                componentFilename: firstFinding.component_filename,
                finding_details: firstFinding.finding_details ? Object.keys(firstFinding.finding_details) : 'N/A'
            });
            
            // Check for SCA-specific findings
            const scaFindings = findings.filter(finding => 
                finding.finding_category_id === 18 || 
                finding.component_filename || 
                finding.finding_category_name?.toLowerCase().includes('sca') ||
                finding.finding_category_name?.toLowerCase().includes('component')
            );
            
            console.log(`\n📋 SCA findings (category_id=18 or has component): ${scaFindings.length}`);
            if (scaFindings.length > 0) {
                console.log('SCA Finding sample:');
                console.log({
                    categoryId: scaFindings[0].finding_category_id,
                    categoryName: scaFindings[0].finding_category_name,
                    component: scaFindings[0].component_filename,
                    description: scaFindings[0].description?.substring(0, 100)
                });
            }
            
            // Check all category IDs present
            const categories = [...new Set(findings.map(f => f.finding_category_id))];
            console.log('\n📋 All finding category IDs found:', categories);
            
            const categoryNames = [...new Set(findings.map(f => f.finding_category_name))];
            console.log('📋 All finding category names found:', categoryNames);
            
        } else {
            console.log('❌ No findings returned or findings array is empty');
        }
        
    } catch (error) {
        console.error('❌ Error inspecting findings:', error);
    }
}

inspectFindingsStructure();
