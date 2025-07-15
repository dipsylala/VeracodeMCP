#!/usr/bin/env node

/**
 * Test script for Veracode Policy Management MCP Tools
 * This script demonstrates how to use the new policy MCP tools
 */

import { CLIToolRegistry } from '../build/cli-tools/cli-tool-registry.js';
import { VeracodeClient } from '../build/veracode-rest-client.js';

async function testPolicyMCPTools() {
  console.log('Testing Veracode Policy Management MCP Tools...\n');

  try {
    const client = new VeracodeClient();
    const registry = new CLIToolRegistry(client);

    // Test 1: List all policies
    console.log('1. Testing get-policies tool...');
    try {
      const result = await registry.executeTool({
        tool: 'get-policies',
        args: { size: 5 }
      });
      
      if (result.success) {
        const policies = result.data._embedded?.policy_versions || [];
        console.log(`✓ Found ${policies.length} policies`);
        
        if (policies.length > 0) {
          console.log('  Sample policies:');
          policies.slice(0, 3).forEach(policy => {
            console.log(`    - ${policy.name} (${policy.category})`);
          });
        }
      } else {
        console.log(`✗ Tool failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Tool execution failed: ${error.message}`);
    }

    // Test 2: Get specific policy
    console.log('\n2. Testing get-policy tool...');
    try {
      // First get policies to find a valid GUID
      const policiesResult = await registry.executeTool({
        tool: 'get-policies',
        args: { size: 1 }
      });
      
      if (policiesResult.success && policiesResult.data._embedded?.policy_versions?.length > 0) {
        const firstPolicy = policiesResult.data._embedded.policy_versions[0];
        
        const result = await registry.executeTool({
          tool: 'get-policy',
          args: { policy_guid: firstPolicy.guid }
        });
        
        if (result.success) {
          console.log(`✓ Retrieved policy: ${result.data.name}`);
          console.log(`  GUID: ${result.data.guid}`);
          console.log(`  Type: ${result.data.type}`);
          console.log(`  Finding rules: ${result.data.finding_rules?.length || 0}`);
        } else {
          console.log(`✗ Tool failed: ${result.error}`);
        }
      } else {
        console.log('✗ No policies found to test with');
      }
    } catch (error) {
      console.log(`✗ Tool execution failed: ${error.message}`);
    }

    // Test 3: Get policy settings
    console.log('\n3. Testing get-policy-settings tool...');
    try {
      const result = await registry.executeTool({
        tool: 'get-policy-settings',
        args: {}
      });
      
      if (result.success) {
        const settings = result.data._embedded?.policy_settings || [];
        console.log(`✓ Found ${settings.length} policy settings`);
        
        if (settings.length > 0) {
          console.log('  Business criticality mappings:');
          settings.forEach(setting => {
            console.log(`    ${setting.business_criticality}: ${setting.policy_guid}`);
          });
        }
      } else {
        console.log(`✗ Tool failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Tool execution failed: ${error.message}`);
    }

    // Test 4: Get application policies only
    console.log('\n4. Testing get-policies with APPLICATION category filter...');
    try {
      const result = await registry.executeTool({
        tool: 'get-policies',
        args: { 
          category: 'APPLICATION',
          size: 3
        }
      });
      
      if (result.success) {
        const policies = result.data._embedded?.policy_versions || [];
        console.log(`✓ Found ${policies.length} application policies`);
        
        policies.forEach(policy => {
          console.log(`  - ${policy.name} (Version: ${policy.version})`);
        });
      } else {
        console.log(`✗ Tool failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Tool execution failed: ${error.message}`);
    }

    // Test 5: Get SCA licenses
    console.log('\n5. Testing get-sca-licenses tool...');
    try {
      const result = await registry.executeTool({
        tool: 'get-sca-licenses',
        args: { 
          page: 0,
          size: 5
        }
      });
      
      if (result.success) {
        console.log(`✓ SCA licenses query completed`);
        
        if (result.data._embedded?.sca_license_summaries?.length > 0) {
          console.log(`  Found ${result.data._embedded.sca_license_summaries.length} licenses`);
          console.log('  Sample licenses:');
          result.data._embedded.sca_license_summaries.slice(0, 3).forEach(license => {
            console.log(`    - ${license.name || license.spdx_id} (Risk: ${license.risk})`);
          });
        }
      } else {
        console.log(`✗ Tool failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Tool execution failed: ${error.message}`);
    }

    // Test 6: Policy versions (if we found a policy)
    console.log('\n6. Testing get-policy-versions tool...');
    try {
      // Get a policy first
      const policiesResult = await registry.executeTool({
        tool: 'get-policies',
        args: { size: 1 }
      });
      
      if (policiesResult.success && policiesResult.data._embedded?.policy_versions?.length > 0) {
        const firstPolicy = policiesResult.data._embedded.policy_versions[0];
        
        const result = await registry.executeTool({
          tool: 'get-policy-versions',
          args: { 
            policy_guid: firstPolicy.guid,
            size: 3
          }
        });
        
        if (result.success) {
          const versions = result.data._embedded?.policy_versions || [];
          console.log(`✓ Found ${versions.length} versions for policy ${firstPolicy.name}`);
          
          versions.forEach(version => {
            console.log(`  - Version ${version.version} (Modified by: ${version.modified_by || 'Unknown'})`);
          });
        } else {
          console.log(`✗ Tool failed: ${result.error}`);
        }
      } else {
        console.log('✗ No policies found to test versions with');
      }
    } catch (error) {
      console.log(`✗ Tool execution failed: ${error.message}`);
    }

    // Test 7: Search by name
    console.log('\n7. Testing policy name search...');
    try {
      const result = await registry.executeTool({
        tool: 'get-policies',
        args: { 
          name: 'Veracode',
          size: 3
        }
      });
      
      if (result.success) {
        const policies = result.data._embedded?.policy_versions || [];
        console.log(`✓ Found ${policies.length} policies matching 'Veracode'`);
        
        policies.forEach(policy => {
          console.log(`  - ${policy.name} (${policy.type})`);
        });
      } else {
        console.log(`✗ Tool failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Tool execution failed: ${error.message}`);
    }

  } catch (error) {
    console.error('Failed to initialize client or registry:', error.message);
    process.exit(1);
  }

  console.log('\nPolicy management MCP tools testing completed!');
}

// Run the test
testPolicyMCPTools().catch(console.error);
