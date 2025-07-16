#!/usr/bin/env node

/**
 * Simple direct API call to capture raw SCA response
 */

import axios from 'axios';
import { VeracodeHMACAuth } from '../build/veracode/auth/hmac-auth.js';
import dotenv from 'dotenv';

dotenv.config();

async function simpleDirectCall() {
    console.log('🔍 Simple direct SCA API call');
    console.log('=' .repeat(50));
    
    const appId = '71fe1fd2-0beb-4950-9ca5-e045da036687'; // VeraDemo-NET
    
    try {
        // Set up authentication
        const auth = new VeracodeHMACAuth(
            process.env.VERACODE_API_ID,
            process.env.VERACODE_API_KEY
        );
        
        const method = 'GET';
        const path = `/appsec/v2/applications/${appId}/findings?scan_type=SCA&size=5`;
        const host = 'api.veracode.com';
        
        console.log(`📡 ${method} ${path}`);
        
        // Generate auth header
        const authHeader = auth.generateAuthHeader(path, method, host);
        console.log('🔐 Auth header generated');
        
        // Make request with shorter timeout
        const response = await axios({
            method: method,
            url: `https://${host}${path}`,
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            },
            timeout: 10000  // 10 second timeout
        });
        
        console.log('✅ SUCCESS!');
        console.log(`Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers['content-type']}`);
        
        console.log('\n📄 RAW API RESPONSE:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Quick analysis
        if (response.data._embedded?.findings) {
            const findings = response.data._embedded.findings;
            console.log(`\n🔍 Found ${findings.length} findings`);
            
            const scanTypes = [...new Set(findings.map(f => f.scan_type))];
            console.log(`Scan types: ${scanTypes.join(', ')}`);
            
            const scaFindings = findings.filter(f => f.scan_type === 'SCA');
            console.log(`SCA findings: ${scaFindings.length}`);
            
            if (scaFindings.length > 0) {
                console.log('\n🎯 First SCA finding:');
                console.log(JSON.stringify(scaFindings[0], null, 2));
            }
        }
        
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
        } else if (error.request) {
            console.log('No response received');
        }
    }
}

simpleDirectCall();
