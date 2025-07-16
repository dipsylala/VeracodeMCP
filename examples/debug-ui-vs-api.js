#!/usr/bin/env node

/**
 * Debug script to investigate discrepancies between Veracode UI and API
 * for SCA findings in MCPVerademo-Net
 */

import { VeracodeClient } from '../build/veracode-rest-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugUIvsAPI() {
    const client = new VeracodeClient();
    const appName = 'MCPVerademo-Net';
    
    console.log(`🔍 Debugging UI vs API discrepancy for ${appName}`);
    console.log('=' .repeat(60));
    
    try {
        // 1. Find the application
        console.log('\n1. Finding application...');
        const searchResults = await client.applications.searchApplications(appName);
        
        if (!searchResults || searchResults.length === 0) {
            console.log(`❌ Application "${appName}" not found`);
            return;
        }
        
        const app = searchResults[0];
        console.log(`✅ Found application: ${app.profile.name} (ID: ${app.guid})`);
        
        // 2. Get all scans for this application
        console.log('\n2. Getting all scans...');
        const scans = await client.scans.getScans(app.guid);
        console.log(`Found ${scans?.length || 0} scans`);
        
        if (scans && scans.length > 0) {
            // Show scan details
            for (const scan of scans.slice(0, 5)) { // Show first 5 scans
                console.log(`  - Scan ID: ${scan.scan_id}`);
                console.log(`    Type: ${scan.scan_type}`);
                console.log(`    Status: ${scan.status}`);
                console.log(`    Date: ${scan.submitted_date}`);
                console.log(`    Analysis Unit: ${scan.analysis_unit?.name || 'N/A'}`);
                console.log('');
            }
        }
        
        // 3. Try different API endpoints for findings
        console.log('\n3. Checking different findings endpoints...');
        
        // 3a. Try findings by app name (our current approach)
        console.log('\n3a. Findings by app name:');
        try {
            const findingsByName = await client.findings.getFindingsByName(appName, {
                scanType: 'SCA',
                size: 100
            });
            console.log(`  Found ${findingsByName?.findings?.length || 0} SCA findings via app name`);
        } catch (error) {
            console.log(`  Error getting findings by name: ${error.message}`);
        }
        
        // 3b. Try findings by GUID
        console.log('\n3b. Findings by GUID:');
        try {
            const findingsByGuid = await client.findings.getFindings(app.guid, {
                scan_type: 'SCA',
                size: 100
            });
            console.log(`  Found ${findingsByGuid?.findings?.length || 0} SCA findings via GUID`);
        } catch (error) {
            console.log(`  Error getting findings by GUID: ${error.message}`);
        }
        
        // 3c. Try paginated findings approach
        console.log('\n3c. Paginated findings:');
        try {
            const paginatedFindings = await client.findings.getFindingsPaginated(app.guid, {
                scan_type: 'SCA',
                size: 100
            });
            console.log(`  Found ${paginatedFindings?.findings?.length || 0} SCA findings via pagination`);
        } catch (error) {
            console.log(`  Error getting paginated findings: ${error.message}`);
        }
        
        // 4. Check all findings (no SCA filter) to see what's available
        console.log('\n4. Checking all findings (no SCA filter)...');
        try {
            const allFindings = await client.findings.getFindingsPaginated(app.guid, {
                size: 100
            });
            
            if (allFindings?.findings) {
                console.log(`  Total findings: ${allFindings.findings.length}`);
                
                // Group by scan type
                const byType = {};
                allFindings.findings.forEach(finding => {
                    const type = finding.scan_type || 'UNKNOWN';
                    byType[type] = (byType[type] || 0) + 1;
                });
                
                console.log('  Breakdown by scan type:');
                Object.entries(byType).forEach(([type, count]) => {
                    console.log(`    ${type}: ${count} findings`);
                });
                
                // Look for any findings that might be SCA-related
                const potentialSCA = allFindings.findings.filter(finding => {
                    const description = (finding.description || '').toLowerCase();
                    const category = (finding.finding_category?.name || '').toLowerCase();
                    const details = JSON.stringify(finding.finding_details || {}).toLowerCase();
                    
                    return description.includes('component') ||
                           description.includes('dependency') ||
                           description.includes('library') ||
                           description.includes('cve') ||
                           category.includes('sca') ||
                           category.includes('component') ||
                           details.includes('component') ||
                           details.includes('cve');
                });
                
                console.log(`  Potential SCA-related findings: ${potentialSCA.length}`);
                
                if (potentialSCA.length > 0) {
                    console.log('\n  Sample potential SCA findings:');
                    potentialSCA.slice(0, 3).forEach((finding, index) => {
                        console.log(`    ${index + 1}. ${finding.description?.substring(0, 100)}...`);
                        console.log(`       Scan Type: ${finding.scan_type}`);
                        console.log(`       Category: ${finding.finding_category?.name || 'N/A'}`);
                        console.log(`       Severity: ${finding.severity}`);
                        console.log('');
                    });
                }
            }
        } catch (error) {
            console.log(`  Error getting all findings: ${error.message}`);
        }
        
        // 5. Check SCA-specific endpoint if available
        console.log('\n5. Checking SCA-specific endpoints...');
        try {
            // Try the SCA results endpoint directly
            const response = await client.makeRequest('GET', `/appsec/v1/applications/${app.guid}/findings?scan_type=SCA`);
            console.log(`  Direct SCA endpoint response status: ${response.status}`);
            console.log(`  Response data keys: ${Object.keys(response.data || {}).join(', ')}`);
            
            if (response.data?._embedded?.findings) {
                console.log(`  Direct SCA findings count: ${response.data._embedded.findings.length}`);
            }
        } catch (error) {
            console.log(`  Error with direct SCA endpoint: ${error.message}`);
        }
        
        console.log('\n' + '=' .repeat(60));
        console.log('🔍 Debug complete. Check above for discrepancies between UI and API.');
        
    } catch (error) {
        console.error('❌ Error during debug:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the debug
debugUIvsAPI().catch(console.error);
