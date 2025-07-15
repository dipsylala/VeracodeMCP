/**
 * Test script to validate consolidated tools (unified ID/name parameters)
 */

import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';

async function testConsolidatedTools() {
  const client = new VeracodeMCPClient();
  
  try {
    console.log('Testing consolidated tools with "Bentley BOF test"...\n');

    // Test 1: get-application-details (should work with name)
    console.log('=== Test 1: get-application-details with application name ===');
    const appDetailsResult = await client.callTool('get-application-details', {
      application: 'Bentley BOF test'
    });
    
    if (appDetailsResult.success) {
      console.log('✅ SUCCESS: Application details retrieved');
      console.log(`   App Name: ${appDetailsResult.data.name}`);
      console.log(`   App ID: ${appDetailsResult.data.id}`);
      const appId = appDetailsResult.data.id;

      // Test 2: get-application-details (should work with ID)
      console.log('\n=== Test 2: get-application-details with application ID ===');
      const appDetailsByIdResult = await client.callTool('get-application-details', {
        application: appId
      });
      
      if (appDetailsByIdResult.success) {
        console.log('✅ SUCCESS: Application details retrieved using ID');
        console.log(`   App Name: ${appDetailsByIdResult.data.name}`);
      } else {
        console.log('❌ FAILED: Application details by ID');
        console.log(`   Error: ${appDetailsByIdResult.error}`);
      }

      // Test 3: get-sandboxes (should work with name)
      console.log('\n=== Test 3: get-sandboxes with application name ===');
      const sandboxesResult = await client.callTool('get-sandboxes', {
        application: 'Bentley BOF test'
      });
      
      if (sandboxesResult.success) {
        console.log('✅ SUCCESS: Sandboxes retrieved using name');
        console.log(`   Found ${sandboxesResult.data.sandboxes?.length || 0} sandboxes`);
        sandboxesResult.data.sandboxes?.forEach((sandbox, idx) => {
          console.log(`   ${idx + 1}. ${sandbox.name} (${sandbox.id})`);
        });
      } else {
        console.log('❌ FAILED: Sandboxes by name');
        console.log(`   Error: ${sandboxesResult.error}`);
      }

      // Test 4: get-sandboxes (should work with ID)
      console.log('\n=== Test 4: get-sandboxes with application ID ===');
      const sandboxesByIdResult = await client.callTool('get-sandboxes', {
        application: appId
      });
      
      if (sandboxesByIdResult.success) {
        console.log('✅ SUCCESS: Sandboxes retrieved using ID');
        console.log(`   Found ${sandboxesByIdResult.data.sandboxes?.length || 0} sandboxes`);
      } else {
        console.log('❌ FAILED: Sandboxes by ID');
        console.log(`   Error: ${sandboxesByIdResult.error}`);
      }

      // Test 5: get-findings (should work with name)
      console.log('\n=== Test 5: get-findings with application name ===');
      const findingsResult = await client.callTool('get-findings', {
        application: 'Bentley BOF test'
      });
      
      if (findingsResult.success) {
        console.log('✅ SUCCESS: Findings retrieved using name');
        console.log(`   Has scans: ${findingsResult.data.scan_status?.has_scans}`);
        if (findingsResult.data.scan_status?.has_scans) {
          console.log(`   Scan types: ${findingsResult.data.scan_status.available_scan_types?.join(', ')}`);
        }
      } else {
        console.log('❌ FAILED: Findings by name');
        console.log(`   Error: ${findingsResult.error}`);
      }

    } else {
      console.log('❌ FAILED: Application details');
      console.log(`   Error: ${appDetailsResult.error}`);
    }

    console.log('\n=== Test Summary ===');
    console.log('All consolidated tools tested. Check results above.');
    console.log('These tools now accept either application ID (GUID) or application name.');

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    client.close();
  }
}

// Run the test
testConsolidatedTools().catch(console.error);
