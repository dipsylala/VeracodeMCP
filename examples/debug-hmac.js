#!/usr/bin/env node

// Debug script to test HMAC authentication with different URL encodings
import { VeracodeClient } from '../build/veracode-rest-client.js';

async function debugHMACAuthentication() {
  console.log('🔍 Debugging HMAC Authentication\n');

  let client;
  try {
    console.log('Loading Veracode credentials from environment...');
    client = VeracodeClient.fromEnvironment();
    console.log('✅ Credentials loaded successfully\n');
  } catch (error) {
    console.error('❌ Failed to load Veracode credentials:', error.message);
    process.exit(1);
  }

  try {
    // First try a simple request without query parameters
    console.log('=== Test 1: Simple request without query parameters ===');
    const allApps = await client.getApplications();
    console.log(`✅ Successfully retrieved ${allApps.length} applications`);
    
    if (allApps.length > 0) {
      console.log('Sample application names:');
      allApps.slice(0, 3).forEach((app, idx) => {
        console.log(`   ${idx + 1}. ${app.profile.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error with simple request:', error.message);
    return;
  }

  try {
    // Now try with query parameters using a simple search
    console.log('\n=== Test 2: Request with simple query parameter ===');
    const searchApps = await client.searchApplications('test');
    console.log(`✅ Successfully searched and found ${searchApps.length} applications with 'test'`);
    
  } catch (error) {
    console.error('❌ Error with search request:', error.message);
    return;
  }

  try {
    // Finally try the problematic "Bentley BOF test" search
    console.log('\n=== Test 3: Request with space in query parameter ===');
    const bentleyApps = await client.searchApplications('Bentley BOF test');
    console.log(`✅ Successfully searched and found ${bentleyApps.length} applications with 'Bentley BOF test'`);
    
    if (bentleyApps.length > 0) {
      console.log('Found applications:');
      bentleyApps.forEach((app, idx) => {
        console.log(`   ${idx + 1}. ${app.profile.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error with space in query parameter:', error.message);
    console.error('This suggests an issue with URL encoding in HMAC calculation');
  }
}

// Run the debug test
debugHMACAuthentication();
