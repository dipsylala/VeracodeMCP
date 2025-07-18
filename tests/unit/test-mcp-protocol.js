import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔍 Testing MCP server protocol directly...');

async function testMCPProtocol() {
  try {
    // Create the MCP request structure that would be sent to the server
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search-application-profiles",
        arguments: {
          name: "vera"
        }
      }
    };

    console.log('📤 MCP Request Structure:');
    console.log(JSON.stringify(mcpRequest, null, 2));

    // Test by sending the request to the MCP server via stdio
    console.log('\n🚀 Testing via MCP server...');

    const requestString = JSON.stringify(mcpRequest) + '\n';
    console.log('Request string:', requestString);

    // Create a simple test that pipes the request to the server
    try {
      const { stdout, stderr } = await execAsync(`echo '${requestString}' | node build/index.js`, {
        timeout: 10000,
        cwd: process.cwd()
      });

      console.log('📋 Server Response:');
      console.log('STDOUT:', stdout);
      if (stderr) {
        console.log('STDERR:', stderr);
      }
    } catch (execError) {
      console.log('❌ MCP server execution error:', execError.message);
      if (execError.stdout) {
        console.log('STDOUT:', execError.stdout);
      }
      if (execError.stderr) {
        console.log('STDERR:', execError.stderr);
      }
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Alternative test using direct import (if the server can be imported)
async function testDirectServerCall() {
  console.log('\n🧪 Testing alternative direct call...');

  try {
    // Test the tool registry directly
    const { ToolRegistry } = await import('../../build/tools/tool.registry.js');
    const { VeracodeClient } = await import('../../build/veracode/index.js');

    const client = new VeracodeClient(process.env.VERACODE_API_ID, process.env.VERACODE_API_KEY);
    const registry = new ToolRegistry(client);

    console.log('✅ Direct registry created');

    const toolCall = {
      tool: 'search-application-profiles',
      args: { name: 'vera' }
    };

    console.log('📤 Direct tool call:', JSON.stringify(toolCall, null, 2));

    const result = await registry.executeTool(toolCall);
    console.log('📋 Direct result:', result.success ? `Success! Found ${result.data?.count} items` : `Failed: ${result.error}`);

  } catch (importError) {
    console.log('❌ Direct import test failed:', importError.message);
  }
}

// Run both tests
testMCPProtocol().then(() => testDirectServerCall());
