import { VeracodeMCPClient } from '../../build/veracode-mcp-client.js';

console.log('🧪 Testing argument validation scenarios...');

try {
  const client = new VeracodeMCPClient();
  console.log('✅ Client initialized successfully');

  // Test scenarios that might cause validation errors
  const testCases = [
    {
      name: 'Valid call with args object',
      call: { tool: 'search-application-profiles', args: { name: 'Test' } }
    },
    {
      name: 'Missing args property entirely',
      call: { tool: 'search-application-profiles' }
    },
    {
      name: 'Empty args object',
      call: { tool: 'search-application-profiles', args: {} }
    },
    {
      name: 'Args with undefined name',
      call: { tool: 'search-application-profiles', args: { name: undefined } }
    },
    {
      name: 'Args with null name',
      call: { tool: 'search-application-profiles', args: { name: null } }
    },
    {
      name: 'Args with wrong parameter name (arguments instead of args)',
      call: { tool: 'search-application-profiles', arguments: { name: 'Test' } }
    },
    {
      name: 'Args with number instead of string',
      call: { tool: 'search-application-profiles', args: { name: 123 } }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log('📤 Call structure:', JSON.stringify(testCase.call, null, 2));
    
    try {
      const result = await client.callTool(testCase.call);
      if (result.success) {
        console.log('✅ Success - returned data count:', result.data?.count || 'no count');
      } else {
        console.log('❌ Failed:', result.error);
        if (result.data?.details) {
          console.log('📋 Details:', result.data.details);
        }
      }
    } catch (error) {
      console.log('💥 Exception:', error.message);
    }
  }

} catch (error) {
  console.error('❌ Failed to initialize client:', error.message);
}
