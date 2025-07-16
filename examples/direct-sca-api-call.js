#!/usr/bin/env node

/**
 * Make direct raw API call for SCA bypassing our client's pre-checks
 */

import axios from 'axios';
import { VeracodeHMACAuth } from '../build/veracode/auth/hmac-auth.js';
import dotenv from 'dotenv';

dotenv.config();

async function makeDirectScaCall() {
    console.log(`🔍 Making DIRECT REST API call for SCA findings`);
    console.log('=' .repeat(70));
    
    const appId = '71fe1fd2-0beb-4950-9ca5-e045da036687'; // VeraDemo-NET
    const apiBaseUrl = 'https://api.veracode.com/';
    
    // Set up HMAC authentication
    const auth = new VeracodeHMACAuth(
        process.env.VERACODE_API_ID,
        process.env.VERACODE_API_KEY
    );
    
    console.log(`📡 Target URL: ${apiBaseUrl}appsec/v2/applications/${appId}/findings`);
    console.log(`📋 Query: scan_type=SCA&size=10`);
    
    try {
        // Create the URL and method for signing
        const method = 'GET';
        const url = `appsec/v2/applications/${appId}/findings?scan_type=SCA&size=10`;
        const fullUrl = `${apiBaseUrl}${url}`;
        
        console.log(`\n🔐 Generating HMAC-SHA256 signature...`);
        const authData = auth.generateAuthHeader(
            `/appsec/v2/applications/${appId}/findings?scan_type=SCA&size=10`, 
            method, 
            'api.veracode.com'
        );
        
        console.log(`📝 Authorization header generated (truncated): ${authData.substring(0, 50)}...`);
        
        // Make the direct HTTP request
        console.log(`\n📡 Making direct HTTP request...`);
        
        const response = await axios({
            method: method,
            url: fullUrl,
            headers: {
                'Authorization': authData,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        console.log('\n✅ SUCCESS - Raw API Response:');
        console.log('=' .repeat(70));
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers['content-type']}`);
        console.log(`Response Size: ${JSON.stringify(response.data).length} bytes`);
        
        console.log('\n📄 RAW RESPONSE BODY:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Analyze the response
        console.log('\n🔍 RESPONSE ANALYSIS:');
        console.log('-' .repeat(50));
        
        if (response.data._embedded?.findings) {
            const findings = response.data._embedded.findings;
            console.log(`Number of findings: ${findings.length}`);
            
            if (findings.length > 0) {
                // Check scan types
                const scanTypes = [...new Set(findings.map(f => f.scan_type))];
                console.log(`Scan types in response: ${scanTypes.join(', ')}`);
                
                const trueSCAFindings = findings.filter(f => f.scan_type === 'SCA');
                const staticFindings = findings.filter(f => f.scan_type === 'STATIC');
                
                console.log(`TRUE SCA findings (scan_type: "SCA"): ${trueSCAFindings.length}`);
                console.log(`STATIC findings: ${staticFindings.length}`);
                
                if (trueSCAFindings.length > 0) {
                    console.log('\n🎯 FIRST TRUE SCA FINDING:');
                    console.log(JSON.stringify(trueSCAFindings[0], null, 2));
                    
                    // Check for SCA properties
                    const details = trueSCAFindings[0].finding_details;
                    if (details) {
                        console.log('\n🧬 SCA PROPERTIES CHECK:');
                        const scaProps = ['component_id', 'component_filename', 'cve', 'licenses', 'version'];
                        scaProps.forEach(prop => {
                            console.log(`  ${details[prop] ? '✅' : '❌'} ${prop}: ${details[prop] || 'missing'}`);
                        });
                    }
                } else {
                    console.log('\n⚠️  All findings are STATIC, not SCA');
                    console.log('This suggests the API returns STATIC findings when SCA is requested but unavailable');
                }
                
                console.log('\n📋 FIRST FINDING (ANY TYPE):');
                console.log(JSON.stringify(findings[0], null, 2));
            }
        } else {
            console.log('No findings in response');
        }
        
        if (response.data.page) {
            console.log('\n📃 PAGINATION:');
            console.log(JSON.stringify(response.data.page, null, 2));
        }
        
    } catch (error) {
        console.log('\n❌ ERROR - Raw API Call Failed:');
        console.log('=' .repeat(70));
        console.log(`Error Type: ${error.constructor.name}`);
        console.log(`Message: ${error.message}`);
        
        if (error.response) {
            console.log(`\nHTTP Status: ${error.response.status} ${error.response.statusText}`);
            console.log(`Response Headers:`, JSON.stringify(error.response.headers, null, 2));
            console.log(`Response Body:`, JSON.stringify(error.response.data, null, 2));
            
            if (error.response.status === 401) {
                console.log('\n🔍 AUTHENTICATION ANALYSIS:');
                console.log('This confirms the API call is being made but authentication is failing');
                console.log('Possible causes:');
                console.log('- API credentials are invalid');
                console.log('- HMAC signature generation issue');
                console.log('- API permissions don\'t include SCA access');
            }
        } else if (error.request) {
            console.log('\nNo response received');
            console.log('Request details:', error.request);
        } else {
            console.log('\nRequest setup error');
        }
    }
}

// Run the direct call
makeDirectScaCall().catch(console.error);
