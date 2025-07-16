// Simple MCP request sender to trigger debug logs
import { spawn } from 'child_process';

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

console.log('Sending MCP request to debug server...');
console.log('Request:', JSON.stringify(mcpRequest, null, 2));

// Use PowerShell to send the request
const psCommand = `echo '${JSON.stringify(mcpRequest)}' | node build/index.js`;

const child = spawn('pwsh.exe', ['-Command', psCommand], {
  stdio: ['ignore', 'pipe', 'pipe'],
  cwd: process.cwd()
});

child.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

child.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

child.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});
