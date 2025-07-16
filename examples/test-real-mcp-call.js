// Test script to simulate an external MCP client calling the server
import { spawn } from 'child_process';

console.log('🔍 Testing MCP server with realistic client calls...');

function testMCPServerCall() {
  return new Promise((resolve, reject) => {
    // Start the MCP server process
    const serverProcess = spawn('node', ['build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let responseData = '';
    let errorData = '';
    let requestSent = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      responseData += output;
      console.log('📥 Server response chunk:', output);
      
      // Parse JSON responses
      const lines = output.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === 1 && requestSent) {
            console.log('📋 Parsed response:', JSON.stringify(parsed, null, 2));
            serverProcess.kill();
            resolve(parsed);
            return;
          }
        } catch (e) {
          // Not JSON, continue
        }
      }
    });

    serverProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.log('📥 Server error chunk:', data.toString());
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      if (!requestSent) {
        reject(new Error(`Server closed before request could be sent. stderr: ${errorData}`));
      }
    });

    serverProcess.on('error', (err) => {
      reject(err);
    });

    // Wait a moment for server to start, then send the request
    setTimeout(() => {
      console.log('📤 Sending MCP request...');
      
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

      const requestLine = JSON.stringify(mcpRequest) + '\n';
      console.log('Request being sent:', requestLine);
      
      serverProcess.stdin.write(requestLine);
      requestSent = true;
      
      // Timeout after 10 seconds
      setTimeout(() => {
        console.log('⏰ Request timeout, killing server...');
        serverProcess.kill();
        reject(new Error('Request timeout'));
      }, 10000);
      
    }, 1000);
  });
}

async function runTest() {
  try {
    console.log('🚀 Starting MCP server test...');
    const result = await testMCPServerCall();
    
    if (result.error) {
      console.log('❌ MCP call failed:', result.error);
      if (result.error.data) {
        console.log('Error details:', JSON.stringify(result.error.data, null, 2));
      }
    } else if (result.result) {
      console.log('✅ MCP call succeeded!');
      console.log('Result:', JSON.stringify(result.result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTest();
