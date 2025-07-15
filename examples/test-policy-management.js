#!/usr/bin/env node

/**
 * Test script for Veracode Policy Management APIs
 * This script demonstrates how to use the new policy management tools
 */

import { VeracodeClient } from '../build/veracode-rest-client.js';

async function testPolicyManagement() {
  console.log('Testing Veracode Policy Management APIs...\n');

  try {
    const client = new VeracodeClient();

    // Test 1: Get all policies
    console.log('1. Getting all policies...');
    try {
      const policies = await client.getPolicies({ size: 10 });
      console.log(`✓ Found ${policies._embedded?.policy_versions?.length || 0} policies`);
      
      if (policies._embedded?.policy_versions?.length > 0) {
        const firstPolicy = policies._embedded.policy_versions[0];
        console.log(`  Sample policy: ${firstPolicy.name} (GUID: ${firstPolicy.guid})`);
        console.log(`  Category: ${firstPolicy.category}, Type: ${firstPolicy.type}`);
        
        // Test 2: Get specific policy details
        if (firstPolicy.guid) {
          console.log('\n2. Getting specific policy details...');
          try {
            const policyDetails = await client.getPolicy(firstPolicy.guid);
            console.log(`✓ Policy details retrieved for: ${policyDetails.name}`);
            console.log(`  Description: ${policyDetails.description || 'No description'}`);
            console.log(`  Finding rules: ${policyDetails.finding_rules?.length || 0}`);
          } catch (error) {
            console.log(`✗ Failed to get policy details: ${error.message}`);
          }

          // Test 3: Get policy versions
          console.log('\n3. Getting policy versions...');
          try {
            const versions = await client.getPolicyVersions(firstPolicy.guid);
            console.log(`✓ Found ${versions._embedded?.policy_versions?.length || 0} versions`);
          } catch (error) {
            console.log(`✗ Failed to get policy versions: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`✗ Failed to get policies: ${error.message}`);
    }

    // Test 4: Get application policies (filter by category)
    console.log('\n4. Getting application policies...');
    try {
      const appPolicies = await client.getPolicies({ 
        category: 'APPLICATION',
        size: 5
      });
      console.log(`✓ Found ${appPolicies._embedded?.policy_versions?.length || 0} application policies`);
    } catch (error) {
      console.log(`✗ Failed to get application policies: ${error.message}`);
    }

    // Test 5: Get component policies
    console.log('\n5. Getting component policies...');
    try {
      const componentPolicies = await client.getPolicies({ 
        category: 'COMPONENT',
        size: 5
      });
      console.log(`✓ Found ${componentPolicies._embedded?.policy_versions?.length || 0} component policies`);
    } catch (error) {
      console.log(`✗ Failed to get component policies: ${error.message}`);
    }

    // Test 6: Get policy settings
    console.log('\n6. Getting policy settings...');
    try {
      const settings = await client.getPolicySettings();
      console.log(`✓ Found ${settings._embedded?.policy_settings?.length || 0} policy settings`);
      
      if (settings._embedded?.policy_settings?.length > 0) {
        console.log('  Business criticality mappings:');
        settings._embedded.policy_settings.forEach(setting => {
          console.log(`    ${setting.business_criticality}: ${setting.policy_guid}`);
        });
      }
    } catch (error) {
      console.log(`✗ Failed to get policy settings: ${error.message}`);
    }

    // Test 7: Get SCA licenses
    console.log('\n7. Getting SCA licenses...');
    try {
      const licenses = await client.getScaLicenses(0, 10);
      console.log(`✓ SCA licenses query completed`);
      
      if (licenses._embedded?.sca_license_summaries?.length > 0) {
        console.log(`  Found ${licenses._embedded.sca_license_summaries.length} licenses`);
        const sampleLicense = licenses._embedded.sca_license_summaries[0];
        console.log(`  Sample: ${sampleLicense.name} (${sampleLicense.spdx_id}) - Risk: ${sampleLicense.risk}`);
      }
    } catch (error) {
      console.log(`✗ Failed to get SCA licenses: ${error.message}`);
    }

    // Test 8: Search for specific policy by name
    console.log('\n8. Searching for Veracode default policies...');
    try {
      const veracodePolicies = await client.getPolicies({ 
        name: 'Veracode',
        size: 10
      });
      console.log(`✓ Found ${veracodePolicies._embedded?.policy_versions?.length || 0} policies matching 'Veracode'`);
      
      if (veracodePolicies._embedded?.policy_versions?.length > 0) {
        veracodePolicies._embedded.policy_versions.forEach(policy => {
          console.log(`  - ${policy.name} (${policy.type})`);
        });
      }
    } catch (error) {
      console.log(`✗ Failed to search policies: ${error.message}`);
    }

  } catch (error) {
    console.error('Failed to initialize client:', error.message);
    process.exit(1);
  }

  console.log('\nPolicy management API testing completed!');
}

// Run the test
testPolicyManagement().catch(console.error);
