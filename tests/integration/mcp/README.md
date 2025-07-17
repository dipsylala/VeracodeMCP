# MCP Integration Tests

This directory contains integration tests that communicate through the MCP protocol. These tests validate complete end-to-end workflows from MCP client to Veracode API.

## Test Files

### Application Management Tests
- `list-applications-mcp.js` - Test application listing via MCP protocol
- `search-application-profiles-mcp.js` - Test application search via MCP protocol

### SCA Analysis Tests
- `get-sca-results-mcp.js` - Test SCA analysis via MCP protocol
- `find-sca-apps-mcp.js` - Test SCA application discovery via MCP protocol

### Static Analysis Tests
- `static-findings-pagination-mcp.js` - Test static analysis pagination via MCP protocol

### Sandbox and Policy Tests
- `sandbox-functionality-mcp.js` - Test sandbox workflows via MCP protocol
- `policy-management-mcp.js` - Test policy compliance via MCP protocol
- `policy-tools-mcp.js` - Test policy tools via MCP protocol

### Known Application Tests
- `test-verademo-net.js` - Test with known VeraDemo.NET application

## Running MCP Tests

### All MCP Tests
```bash
npm run test:integration:mcp
```

### Individual Tests
```bash
# Build first
npm run build

# Run specific tests
node tests/integration/mcp/list-applications-mcp.js
node tests/integration/mcp/get-sca-results-mcp.js
node tests/integration/mcp/search-application-profiles-mcp.js
```

### In VS Code
1. `Ctrl+Shift+P` → `Tasks: Run Task`
2. Select `Test: MCP Integration`

## What These Tests Validate

### 🔄 **Complete MCP Workflow**
- MCP client initialization
- Tool discovery and registration
- Request/response protocol compliance
- Error handling through MCP layer

### 📡 **End-to-End Communication**
- MCP client → MCP server → Veracode API → Response processing
- Authentication flow through MCP
- Data transformation and formatting
- Response validation

### 🛠️ **Tool Integration**
- All MCP tools are accessible and functional
- Parameter passing works correctly
- Response formatting is consistent
- Error messages are properly formatted

## Prerequisites

### 1. Environment Setup
```bash
# Required credentials
$env:VERACODE_API_ID="your-api-id"
$env:VERACODE_API_KEY="your-api-key"

# Optional debug logging
$env:LOG_LEVEL="debug"
```

### 2. Test Data
- Applications in your Veracode account
- Applications with SCA findings (for SCA tests)
- Applications with static analysis results
- VeraDemo.NET application (recommended)

### 3. Build Project
```bash
npm run build
```

## Expected Behavior

### ✅ Success Indicators
- Tests complete without MCP protocol errors
- API responses return through MCP correctly
- All tools are discoverable and callable
- Response data matches expected format

### 🚨 Common Issues

#### MCP Protocol Errors
```
❌ Error: MCP tool not found
```
**Solution**: Verify tool registration in tool registry.

#### Authentication Through MCP
```
❌ Error: Authentication failed
```
**Solution**: Check API credentials and MCP client configuration.

#### Tool Discovery Issues
```
❌ Error: Tool not registered
```
**Solution**: Verify tool is properly exported from tool modules.

## Debugging MCP Tests

### Enable MCP Debug Mode
```bash
LOG_LEVEL=debug node tests/integration/mcp/list-applications-mcp.js
```

### Use MCP Debug Tools
```bash
# Debug MCP protocol flow
npm run debug:mcp-flow

# Debug specific MCP client issues
node tools/debug/debug-client-sca.js
```

### Check Tool Registration
```bash
# Verify tools are properly registered
node tests/unit/test-registry.js
```

## Test Patterns

### Standard MCP Test Structure
```javascript
import { VeracodeMCPClient } from '../../../build/veracode-mcp-client.js';

async function testMCPTool() {
    try {
        const client = new VeracodeMCPClient();
        const result = await client.callTool('tool-name', parameters);
        
        if (result.success) {
            // Validate response structure
            // Test data content
            // Check execution metadata
        } else {
            // Handle and report errors
        }
    } catch (error) {
        // Handle MCP protocol errors
    }
}
```

### Error Handling Pattern
```javascript
if (!result.success) {
    console.error('❌ MCP Tool failed:', result.error);
    console.log('Troubleshooting tips:');
    console.log('- Check API credentials');
    console.log('- Verify application access');
    console.log('- Check tool registration');
    process.exit(1);
}
```

## Adding New MCP Tests

### 1. Create Test File
```javascript
// tests/integration/mcp/new-feature-mcp.js
import { VeracodeMCPClient } from '../../../build/veracode-mcp-client.js';

async function testNewFeature() {
    // Test implementation
}

testNewFeature();
```

### 2. Add to npm Scripts
```json
{
  "test:integration:mcp": "npm run build && node tests/integration/mcp/new-feature-mcp.js && ..."
}
```

### 3. Include in VS Code Tasks
Add task to `.vscode/tasks.json` for VS Code integration.

## Related Documentation

- [MCP Protocol Documentation](https://modelcontextprotocol.io/) - Official MCP specification
- [Testing Guide](../../../docs/TESTING.md) - Complete testing strategy
- [Integration Guide](../../../docs/INTEGRATION.md) - MCP integration setup
