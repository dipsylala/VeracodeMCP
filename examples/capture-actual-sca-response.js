#!/usr/bin/env node

/**
 * Capture the ACTUAL raw REST API response for SCA query with proper authentication
 */

import { VeracodeClient } from '../build/veracode-rest-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function captureActualScaResponse() {
    const client = new VeracodeClient();
    const appName = 'VeraDemo-NET';
    
    console.log(`🔍 Capturing ACTUAL REST API response for SCA query`);
    console.log('=' .repeat(70));
    
    try {
        // 1. Find the application
        const searchResults = await client.applications.searchApplications(appName);
        const app = searchResults[0];
        
        console.log(`✅ Application: ${app.profile.name} (ID: ${app.guid})`);
        
        // 2. Intercept the actual HTTP request/response by adding an interceptor
        console.log('\n2. Setting up request/response interceptor...');
        
        const findingsService = client.findings;
        let interceptedRequest = null;
        let interceptedResponse = null;
        
        // Add request interceptor to capture outgoing request
        const requestInterceptor = findingsService.apiClient.interceptors.request.use(config => {
            if (config.url && config.url.includes('/findings') && config.params?.scan_type === 'SCA') {
                interceptedRequest = {
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    fullUrl: `${config.baseURL}${config.url}`,
                    params: config.params,
                    headers: { ...config.headers }
                };
                console.log('\n📡 INTERCEPTED REQUEST:');
                console.log('=' .repeat(50));
                console.log(`Method: ${interceptedRequest.method}`);
                console.log(`URL: ${interceptedRequest.url}`);
                console.log(`Full URL: ${interceptedRequest.fullUrl}`);
                console.log(`Query Params:`, JSON.stringify(interceptedRequest.params, null, 2));
                console.log(`Headers (auth removed):`, {
                    'Content-Type': config.headers['Content-Type'],
                    'User-Agent': config.headers['User-Agent']
                });
            }
            return config;
        });
        
        // Add response interceptor to capture incoming response
        const responseInterceptor = findingsService.apiClient.interceptors.response.use(response => {
            if (interceptedRequest && response.config.url?.includes('/findings')) {
                interceptedResponse = {
                    status: response.status,
                    statusText: response.statusText,
                    headers: { ...response.headers },
                    data: response.data
                };
                console.log('\n📨 INTERCEPTED RESPONSE:');
                console.log('=' .repeat(50));
                console.log(`Status: ${interceptedResponse.status} ${interceptedResponse.statusText}`);
                console.log(`Content-Type: ${interceptedResponse.headers['content-type']}`);
                console.log(`Response Size: ${JSON.stringify(interceptedResponse.data).length} characters`);
            }
            return response;
        }, error => {
            if (interceptedRequest && error.config?.url?.includes('/findings')) {
                console.log('\n❌ INTERCEPTED ERROR RESPONSE:');
                console.log('=' .repeat(50));
                console.log(`Status: ${error.response?.status}`);
                console.log(`Error Data:`, JSON.stringify(error.response?.data, null, 2));
            }
            throw error;
        });
        
        // 3. Make the SCA request and capture the response
        console.log('\n3. Making SCA findings request...');
        try {
            const result = await findingsService.getFindingsPaginated(app.guid, {
                scan_type: 'SCA',
                size: 10
            });
            
            // Clean up interceptors
            findingsService.apiClient.interceptors.request.eject(requestInterceptor);
            findingsService.apiClient.interceptors.response.eject(responseInterceptor);
            
            if (interceptedResponse) {
                console.log('\n📄 RAW RESPONSE BODY:');
                console.log('=' .repeat(70));
                console.log(JSON.stringify(interceptedResponse.data, null, 2));
                
                console.log('\n🔍 RESPONSE ANALYSIS:');
                console.log('-' .repeat(50));
                
                if (interceptedResponse.data._embedded?.findings) {
                    const findings = interceptedResponse.data._embedded.findings;
                    console.log(`Number of findings in raw response: ${findings.length}`);
                    
                    if (findings.length > 0) {
                        console.log('\n📋 RAW FIRST FINDING:');
                        console.log(JSON.stringify(findings[0], null, 2));
                        
                        console.log('\n🎯 SCAN TYPE ANALYSIS:');
                        const scanTypes = [...new Set(findings.map(f => f.scan_type))];
                        console.log(`Scan types in raw response: ${scanTypes.join(', ')}`);
                        
                        // Check if any findings actually have scan_type: "SCA"
                        const trueSCAFindings = findings.filter(f => f.scan_type === 'SCA');
                        const staticFindings = findings.filter(f => f.scan_type === 'STATIC');
                        
                        console.log(`TRUE SCA findings (scan_type: "SCA"): ${trueSCAFindings.length}`);
                        console.log(`STATIC findings returned: ${staticFindings.length}`);
                        
                        if (trueSCAFindings.length > 0) {
                            console.log('\n✅ ACTUAL SCA FINDING FOUND:');
                            console.log(JSON.stringify(trueSCAFindings[0], null, 2));
                        } else if (staticFindings.length > 0) {
                            console.log('\n⚠️  API RETURNED STATIC FINDINGS INSTEAD OF SCA:');
                            console.log('This confirms the API fallback behavior');
                        }
                    }
                }
                
                if (interceptedResponse.data.page) {
                    console.log('\n📃 PAGINATION FROM RAW RESPONSE:');
                    console.log(JSON.stringify(interceptedResponse.data.page, null, 2));
                }
            } else {
                console.log('\n❌ No response was intercepted');
            }
            
        } catch (error) {
            console.log(`\n❌ Request failed: ${error.message}`);
            
            // Clean up interceptors even on error
            findingsService.apiClient.interceptors.request.eject(requestInterceptor);
            findingsService.apiClient.interceptors.response.eject(responseInterceptor);
        }
        
        // 4. For comparison, also test with no scan_type filter
        console.log('\n\n4. COMPARISON: Request with no scan_type filter...');
        try {
            const allFindingsResult = await findingsService.getFindingsPaginated(app.guid, {
                size: 5
            });
            
            console.log(`All findings count: ${allFindingsResult.findings?.length || 0}`);
            if (allFindingsResult.findings?.length > 0) {
                const scanTypes = [...new Set(allFindingsResult.findings.map(f => f.scan_type))];
                console.log(`Scan types when no filter applied: ${scanTypes.join(', ')}`);
            }
            
        } catch (error) {
            console.log(`Error getting all findings: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the capture
captureActualScaResponse().catch(console.error);
