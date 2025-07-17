import { VeracodeMCPClient } from '../../build/veracode-mcp-client.js';

console.log('🧪 Testing enhanced application service alignment with Swagger API...');

async function testApplicationService() {
  try {
    const client = new VeracodeMCPClient();
    console.log('✅ Client initialized successfully\n');

    // Test 1: Basic application search (equivalent to GET /appsec/v1/applications?name=Test)
    console.log('🔍 Test 1: Search applications by name');
    const searchResult = await client.callTool({
      tool: 'search-application-profiles',
      args: { name: 'Test' }
    });
    
    if (searchResult.success) {
      console.log(`✅ Found ${searchResult.data.count} applications with "Test" in name`);
      if (searchResult.data.application_profiles.length > 0) {
        const firstApp = searchResult.data.application_profiles[0];
        console.log(`📋 Sample application: "${firstApp.name}" (GUID: ${firstApp.guid})`);
      }
    } else {
      console.log('❌ Search failed:', searchResult.error);
    }

    // Test 2: Get all applications with specific parameters
    console.log('\n🔍 Test 2: Get applications with business criticality filter');
    const filteredResult = await client.callTool({
      tool: 'get-application-profiles',
      args: { 
        business_criticality: 'VERY_HIGH',
        size: 10  // Limit to 10 results for testing
      }
    });
    
    if (filteredResult.success) {
      console.log(`✅ Found ${filteredResult.data.count} VERY_HIGH criticality applications`);
    } else {
      console.log('❌ Filtered search failed:', filteredResult.error);
    }

    // Test 3: Get application details (equivalent to GET /appsec/v1/applications/{guid})
    if (searchResult.success && searchResult.data.application_profiles.length > 0) {
      console.log('\n🔍 Test 3: Get application details by GUID');
      const firstApp = searchResult.data.application_profiles[0];
      
      const detailsResult = await client.callTool({
        tool: 'get-application-profile-details',
        args: { app_profile: firstApp.guid }
      });
      
      if (detailsResult.success) {
        const app = detailsResult.data;
        console.log(`✅ Retrieved details for: "${app.name}"`);
        console.log(`📊 Business criticality: ${app.business_criticality}`);
        console.log(`🔗 Profile URL: ${app.app_profile_url ? 'Available' : 'Not available'}`);
        console.log(`📝 Description: ${app.description || 'No description'}`);
        console.log(`👥 Teams: ${app.teams?.length || 0} teams assigned`);
        console.log(`📋 Policies: ${app.policies?.length || 0} policies assigned`);
      } else {
        console.log('❌ Details retrieval failed:', detailsResult.error);
      }
    }

    // Test 4: Test parameter validation with various query parameters
    console.log('\n🔍 Test 4: Test advanced filtering (policy compliance)');
    const complianceResult = await client.callTool({
      tool: 'get-application-profiles',
      args: { 
        policy_compliance: 'DID_NOT_PASS',
        size: 5
      }
    });
    
    if (complianceResult.success) {
      console.log(`✅ Found ${complianceResult.data.count} applications that did not pass policy compliance`);
    } else {
      console.log('❌ Compliance filter failed:', complianceResult.error);
    }

    console.log('\n🎉 Application service testing completed!');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run the tests
testApplicationService();
