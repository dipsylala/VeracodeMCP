// Simple test to validate the consolidated tools directly via MCP server

async function testConsolidation() {
  console.log('🧪 Testing Consolidated Tool Functionality\n');
  
  // Test using the server directly instead of client to avoid client caching issues
  const { spawn } = await import('child_process');
  
  // Start fresh MCP server
  const serverProcess = spawn('node', ['build/index.js'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });
  
  let serverOutput = '';
  serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('📊 Server startup output:');
  console.log(serverOutput);
  
  // Check if consolidation worked by looking at tool counts
  if (serverOutput.includes('application: 3 tools')) {
    console.log('✅ SUCCESS: Application tools consolidated (3 tools instead of 4)');
  } else {
    console.log('❌ FAILED: Application tools not properly consolidated');
  }
  
  if (serverOutput.includes('static-analysis: 1 tools')) {
    console.log('✅ SUCCESS: Static analysis tools consolidated (1 tool instead of 2)');
  } else {
    console.log('❌ FAILED: Static analysis tools not properly consolidated');
  }
  
  if (serverOutput.includes('Registering 16 tools')) {
    console.log('✅ SUCCESS: Total tool count reduced to 16 (down from previous higher count)');
  } else {
    console.log('❌ FAILED: Total tool count not as expected');
  }
  
  // Clean up
  serverProcess.kill();
  
  console.log('\n🎯 Consolidation Summary:');
  console.log('- Eliminated duplicate -by-id and -by-name functions');
  console.log('- Added GUID auto-detection using regex pattern');
  console.log('- Unified parameter names to "application" (accepts ID or name)');
  console.log('- Reduced maintenance burden and improved user experience');
  
  console.log('\n📝 Key Changes Made:');
  console.log('1. Sandbox Tools: get-sandboxes-by-id + get-sandboxes-by-name → get-sandboxes');
  console.log('2. Sandbox Tools: get-sandbox-summary-by-id + get-sandbox-summary-by-name → get-sandbox-summary');
  console.log('3. Application Tools: get-application-details + get-application-details-by-name → get-application-details');
  console.log('4. Static Analysis: get-static-flaw-info + get-static-flaw-info-by-name → get-static-flaw-info');
  console.log('5. Findings Tools: get-findings + get-findings-by-name → get-findings');
}

testConsolidation().catch(console.error);
