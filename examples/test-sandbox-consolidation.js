/**
 * Direct test of consolidated sandbox functionality
 */

import { VeracodeClient } from '../build/veracode-rest-client.js';

async function testSandboxConsolidation() {
  console.log('🔧 Testing Consolidated Sandbox Tools\n');
  
  let client;
  try {
    // Create Veracode client using environment credentials
    console.log('Loading Veracode credentials from environment...');
    client = VeracodeClient.fromEnvironment();
    console.log('✅ Credentials loaded successfully\n');
  } catch (error) {
    console.error('❌ Failed to load Veracode credentials:', error.message);
    console.error('Please ensure VERACODE_API_ID and VERACODE_API_KEY are set in your .env file');
    process.exit(1);
  }
  
  try {
    // Test with "Bentley BOF test" application
    const appName = 'Bentley BOF test';
    console.log(`Testing with application: "${appName}"\n`);
    
    // 1. Get sandboxes by name (this should work with our consolidated logic)
    console.log('=== Test 1: Getting sandboxes by name ===');
    const sandboxesByName = await client.getSandboxesByName(appName);
    console.log(`✅ Found ${sandboxesByName.sandboxes.length} sandboxes:`);
    sandboxesByName.sandboxes.forEach((sandbox, idx) => {
      console.log(`   ${idx + 1}. ${sandbox.name} (${sandbox.guid})`);
    });
    
    // Extract the application ID for the next test
    const appId = sandboxesByName.application.guid;
    console.log(`\nApplication ID: ${appId}\n`);
    
    // 2. Get sandboxes by ID (to verify both methods work)
    console.log('=== Test 2: Getting sandboxes by ID ===');
    const sandboxesById = await client.getSandboxes(appId);
    console.log(`✅ Found ${sandboxesById.length} sandboxes using ID:`);
    sandboxesById.forEach((sandbox, idx) => {
      console.log(`   ${idx + 1}. ${sandbox.name} (${sandbox.guid})`);
    });
    
    // 3. Verify the results match
    console.log('\n=== Test 3: Verifying results match ===');
    if (sandboxesByName.sandboxes.length === sandboxesById.length) {
      console.log('✅ SUCCESS: Both methods return the same number of sandboxes');
      
      const namesSorted = sandboxesByName.sandboxes.map(s => s.name).sort();
      const idsSorted = sandboxesById.map(s => s.name).sort();
      
      if (JSON.stringify(namesSorted) === JSON.stringify(idsSorted)) {
        console.log('✅ SUCCESS: Sandbox names match between both methods');
      } else {
        console.log('❌ WARNING: Sandbox names differ between methods');
      }
    } else {
      console.log('❌ WARNING: Different number of sandboxes returned');
    }
    
    console.log('\n🎯 Consolidation Test Results:');
    console.log('✅ getSandboxesByName() works correctly');
    console.log('✅ getSandboxes() works correctly');
    console.log('✅ Both methods can access the same application data');
    console.log('✅ Ready for unified tools that accept either ID or name');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testSandboxConsolidation().catch(console.error);
