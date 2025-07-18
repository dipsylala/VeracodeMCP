#!/usr/bin/env node

// Test script for Veracode Policy Management APIs using MCP tools
// This script demonstrates how to use the new policy management tools via MCP
import { VeracodeDirectClient } from '../../../build/test-utils/veracode-direct-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPolicyManagement() {
  console.log('Testing Veracode Policy Management APIs via MCP tools...\n');

  try {
    const client = new VeracodeDirectClient();

    // Test 1: Get all policies
    console.log('1. Getting all policies...');
    try {
      const policies = await client.callTool({
        tool: 'get-policies',
        args: { size: 10 }
      });

      if (policies.success && policies.data?._embedded?.policy_versions) {
        console.log(`✓ Found ${policies.data._embedded.policy_versions.length} policies`);

        if (policies.data._embedded.policy_versions.length > 0) {
          const firstPolicy = policies.data._embedded.policy_versions[0];
          console.log(`  Sample policy: ${firstPolicy.name} (GUID: ${firstPolicy.guid})`);
          console.log(`  Category: ${firstPolicy.category}, Type: ${firstPolicy.type}`);

          // Test 2: Get specific policy details
          if (firstPolicy.guid) {
            console.log('\n2. Getting specific policy details...');
            try {
              const policyDetails = await client.callTool({
                tool: 'get-policy',
                args: { policy_guid: firstPolicy.guid }
              });

              if (policyDetails.success && policyDetails.data) {
                console.log(`✓ Policy details retrieved for: ${policyDetails.data.name}`);
                console.log(`  Description: ${policyDetails.data.description || 'No description'}`);
                console.log(`  Finding rules: ${policyDetails.data.finding_rules?.length || 0}`);
              } else {
                console.log(`✗ Failed to get policy details: ${policyDetails.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.log(`✗ Failed to get policy details: ${error.message}`);
            }

            // Test 3: Get policy versions
            console.log('\n3. Getting policy versions...');
            try {
              const versions = await client.callTool({
                tool: 'get-policy-versions',
                args: {
                  policy_guid: firstPolicy.guid,
                  size: 5
                }
              });

              if (versions.success && versions.data?._embedded?.policy_versions) {
                console.log(`✓ Found ${versions.data._embedded.policy_versions.length} versions`);
              } else {
                console.log(`✗ Failed to get policy versions: ${versions.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.log(`✗ Failed to get policy versions: ${error.message}`);
            }
          }
        }
      } else {
        console.log(`✗ Failed to get policies: ${policies.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`✗ Failed to get policies: ${error.message}`);
    }

    // Test 4: Get application policies (filter by category)
    console.log('\n4. Getting application policies...');
    try {
      const appPolicies = await client.callTool({
        tool: 'get-policies',
        args: {
          category: 'APPLICATION',
          size: 5
        }
      });

      if (appPolicies.success && appPolicies.data?._embedded?.policy_versions) {
        console.log(`✓ Found ${appPolicies.data._embedded.policy_versions.length} application policies`);
      } else {
        console.log(`✗ Failed to get application policies: ${appPolicies.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`✗ Failed to get application policies: ${error.message}`);
    }

    // Test 5: Get component policies
    console.log('\n5. Getting component policies...');
    try {
      const componentPolicies = await client.callTool({
        tool: 'get-policies',
        args: {
          category: 'COMPONENT',
          size: 5
        }
      });

      if (componentPolicies.success) {
        const count = componentPolicies.data?._embedded?.policy_versions?.length || 0;
        console.log(`✓ Found ${count} component policies`);
      } else {
        console.log(`✗ Failed to get component policies: ${componentPolicies.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`✗ Failed to get component policies: ${error.message}`);
    }

    // Test 6: Get policy settings
    console.log('\n6. Getting policy settings...');
    try {
      const settings = await client.callTool({
        tool: 'get-policy-settings'
      });

      if (settings.success && settings.data?._embedded?.policy_settings) {
        console.log(`✓ Found ${settings.data._embedded.policy_settings.length} policy settings`);

        if (settings.data._embedded.policy_settings.length > 0) {
          console.log('  Business criticality mappings:');
          settings.data._embedded.policy_settings.forEach(setting => {
            console.log(`    ${setting.business_criticality || setting.agent_setting}: ${setting.policy_guid}`);
          });
        }
      } else {
        console.log(`✗ Failed to get policy settings: ${settings.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`✗ Failed to get policy settings: ${error.message}`);
    }

    // Test 7: Get SCA licenses
    console.log('\n7. Getting SCA licenses...');
    try {
      const licenses = await client.callTool({
        tool: 'get-sca-licenses',
        args: {
          page: 0,
          size: 10
        }
      });

      if (licenses.success) {
        console.log(`✓ SCA licenses query completed`);

        if (licenses.data?.licenses && licenses.data.licenses.length > 0) {
          console.log(`  Found ${licenses.data.licenses.length} licenses`);
          const sampleLicense = licenses.data.licenses[0];
          console.log(`  Sample: ${sampleLicense.name} (${sampleLicense.spdx_id}) - Risk: ${sampleLicense.risk}`);
        }
      } else {
        console.log(`✗ Failed to get SCA licenses: ${licenses.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`✗ Failed to get SCA licenses: ${error.message}`);
    }

    // Test 8: Search for specific policy by name
    console.log('\n8. Searching for Veracode default policies...');
    try {
      const veracodePolicies = await client.callTool({
        tool: 'get-policies',
        args: {
          name: 'Veracode',
          size: 10
        }
      });

      if (veracodePolicies.success && veracodePolicies.data?._embedded?.policy_versions) {
        console.log(`✓ Found ${veracodePolicies.data._embedded.policy_versions.length} policies matching 'Veracode'`);

        if (veracodePolicies.data._embedded.policy_versions.length > 0) {
          veracodePolicies.data._embedded.policy_versions.forEach(policy => {
            console.log(`  - ${policy.name} (${policy.type})`);
          });
        }
      } else {
        console.log(`✗ Failed to search policies: ${veracodePolicies.error || 'Unknown error'}`);
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
