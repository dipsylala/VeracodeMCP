#!/usr/bin/env node

// Test script for Veracode Policy Management APIs using MCP tools
// This script demonstrates how to use the new policy management tools via MCP
import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPolicyManagement() {
  console.log('Testing Veracode Policy Management APIs via MCP tools...\n');

  try {
    const client = new VeracodeMCPClient();

    // Test 1: Get all policies
    console.log('1. Getting all policies...');
    try {
      const policies = await client.callTool({
        tool: 'get-policies',
        args: { size: 10 }
      });
      
      if (policies.success && policies.data?.policies) {
        console.log(`✓ Found ${policies.data.policies.length} policies`);
        
        if (policies.data.policies.length > 0) {
          const firstPolicy = policies.data.policies[0];
          console.log(`  Sample policy: ${firstPolicy.name} (GUID: ${firstPolicy.guid})`);
          console.log(`  Category: ${firstPolicy.category}, Type: ${firstPolicy.type}`);
          
          // Test 2: Get specific policy details
          if (firstPolicy.guid) {
            console.log('\n2. Getting specific policy details...');
            try {
              const policyDetails = await client.callTool({
                tool: 'get-policy',
                args: { policy: firstPolicy.guid }
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
                  policy: firstPolicy.guid,
                  size: 5
                }
              });
              
              if (versions.success && versions.data?.versions) {
                console.log(`✓ Found ${versions.data.versions.length} versions`);
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
      
      if (appPolicies.success && appPolicies.data?.policies) {
        console.log(`✓ Found ${appPolicies.data.policies.length} application policies`);
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
      
      if (componentPolicies.success && componentPolicies.data?.policies) {
        console.log(`✓ Found ${componentPolicies.data.policies.length} component policies`);
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
        tool: 'get-policy-settings',
        args: {}
      });
      
      if (settings.success && settings.data?.settings) {
        console.log(`✓ Found ${settings.data.settings.length} policy settings`);
        
        if (settings.data.settings.length > 0) {
          console.log('  Business criticality mappings:');
          settings.data.settings.forEach(setting => {
            console.log(`    ${setting.business_criticality}: ${setting.policy_guid}`);
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
      
      if (veracodePolicies.success && veracodePolicies.data?.policies) {
        console.log(`✓ Found ${veracodePolicies.data.policies.length} policies matching 'Veracode'`);
        
        if (veracodePolicies.data.policies.length > 0) {
          veracodePolicies.data.policies.forEach(policy => {
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
