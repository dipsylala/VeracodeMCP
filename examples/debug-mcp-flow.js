import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';

console.log('🔍 Debugging MCP argument flow for search-application-profiles...');

async function debugMCPFlow() {
  try {
    const client = new VeracodeMCPClient();
    console.log('✅ Client initialized\n');

    // Test the exact input you provided
    console.log('📤 Testing with your exact input:');
    const testInput = {
      tool: 'search-application-profiles',
      args: {
        "name": "vera"
      }
    };
    
    console.log('Input structure:', JSON.stringify(testInput, null, 2));
    
    console.log('\n🚀 Executing tool call...');
    const result = await client.callTool(testInput);
    
    console.log('\n📋 Result:');
    if (result.success) {
      console.log('✅ Success! Found', result.data?.count || 0, 'applications');
      if (result.data?.application_profiles?.length > 0) {
        console.log('First result:', result.data.application_profiles[0].name);
      }
    } else {
      console.log('❌ Failed with error:', result.error);
      if (result.data?.details) {
        console.log('Details:', result.data.details);
      }
      if (result.data?.validation_errors) {
        console.log('Validation errors:', JSON.stringify(result.data.validation_errors, null, 2));
      }
    }

    // Test with alternative structures to see what works
    console.log('\n🧪 Testing alternative argument structures...');
    
    const alternatives = [
      {
        name: 'Direct name as string',
        input: { tool: 'search-application-profiles', args: { name: 'vera' } }
      },
      {
        name: 'With quotes around name',
        input: { tool: 'search-application-profiles', args: { "name": "vera" } }
      },
      {
        name: 'With additional parameters',
        input: { tool: 'search-application-profiles', args: { name: 'vera', size: 10 } }
      }
    ];

    for (const alt of alternatives) {
      console.log(`\n🔍 Testing: ${alt.name}`);
      console.log('Structure:', JSON.stringify(alt.input, null, 2));
      
      try {
        const altResult = await client.callTool(alt.input);
        if (altResult.success) {
          console.log(`✅ Success! Found ${altResult.data?.count || 0} applications`);
        } else {
          console.log(`❌ Failed: ${altResult.error}`);
        }
      } catch (error) {
        console.log(`💥 Exception: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug execution failed:', error.message);
  }
}

// Run the debug
debugMCPFlow();
