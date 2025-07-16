# Tool Calling Patterns

The Veracode MCP Server supports two different calling patterns depending on how you're integrating with it.

## 1. MCP Server Integration (Standard MCP Protocol)

When calling tools through the Model Context Protocol (e.g., from Claude, VS Code with MCP, or other MCP clients), use the standard MCP format with `arguments`:

```typescript
{
  "tool": "search-application-profiles",
  "arguments": {
    "name": "MyApp"
  }
}
```

This is the format used by:
- Claude desktop with MCP
- VS Code extensions using MCP
- Other MCP-compliant AI tools

## 2. Direct Client Integration (VeracodeMCPClient)

When calling tools directly through the `VeracodeMCPClient` class in your own applications, use the `args` property:

```typescript
import { VeracodeMCPClient } from './veracode-mcp-client.js';

const client = new VeracodeMCPClient();
const result = await client.callTool({
  tool: "search-application-profiles",
  args: {
    name: "MyApp"
  }
});
```

This is the format used by:
- Direct JavaScript/TypeScript integration
- Custom applications using the client library
- Test scripts and examples in this repository

## Why Two Formats?

The difference exists because:

1. **MCP Protocol Standard**: The Model Context Protocol specification defines that tool parameters should be passed in a `arguments` property within the request structure.

2. **Internal Client Interface**: Our `VeracodeMCPClient` uses a simplified `ToolCall` interface with an `args` property for direct programmatic access.

## Environment Setup

Before using any of these patterns, ensure you have the required Veracode API credentials configured:

```bash
# Set environment variables
export VERACODE_API_ID="your-api-id"
export VERACODE_API_KEY="your-api-key"

# Or create a .env file:
VERACODE_API_ID=your-api-id
VERACODE_API_KEY=your-api-key
VERACODE_API_BASE_URL=https://api.veracode.com/  # Optional, defaults to US commercial
VERACODE_PLATFORM_URL=https://analysiscenter.veracode.com  # Optional, auto-derived
```

The client will automatically load credentials from environment variables or the `.env` file.

The MCP server automatically converts between these formats - it extracts parameters from `request.params.arguments` (MCP format) and passes them as `args` to the internal tool registry.

## Common Errors

### "Expected string, received undefined" for required parameters

This error typically means you're using the wrong parameter format:

❌ **Wrong - Using `arguments` with VeracodeMCPClient:**
```typescript
await client.callTool({
  tool: "search-application-profiles",
  arguments: { name: "MyApp" }  // Wrong property name
});
```

✅ **Correct - Using `args` with VeracodeMCPClient:**
```typescript
await client.callTool({
  tool: "search-application-profiles",
  args: { name: "MyApp" }  // Correct property name
});
```

### Missing required parameters

Ensure you're passing the required parameters for each tool. Check the tool's schema in the source code or use the examples provided.

❌ **Wrong - Missing required parameter:**
```typescript
await client.callTool({
  tool: "search-application-profiles",
  args: {}  // Missing required 'name' parameter
});
```

✅ **Correct - Including required parameter:**
```typescript
await client.callTool({
  tool: "search-application-profiles",
  args: { name: "MyApp" }  // Required 'name' parameter provided
});
```

## Testing Your Integration

Use the provided test scripts to verify your integration:

```bash
# Build the project first
npm run build

# Test MCP server (uses 'arguments' format)
node build/index.js

# Test direct client (uses 'args' format) - example scripts:
node examples/list-applications-mcp.js
node examples/search-application-profiles-mcp.js
node examples/get-sca-results-mcp.js
node examples/find-sca-apps-mcp.js
```

## Recent Updates

### Dependency Injection Architecture (v1.0+)

The client architecture now uses proper dependency injection for services:

```typescript
// Services are initialized with proper dependency chain:
// VeracodeClient → ApplicationService, PolicyService
//                → SandboxService (requires ApplicationService)  
//                → ScanService (requires ApplicationService, SandboxService)
//                → FindingsService (requires ApplicationService, ScanService)

const client = new VeracodeMCPClient();
// Clean initialization logging shows each service once:
// [CLIENT]: VeracodeClient initialized successfully
// [CLIENT]: ApplicationService initialized successfully  
// [CLIENT]: PolicyService initialized successfully
// [CLIENT]: SandboxService initialized successfully
// [CLIENT]: ScanService initialized successfully
// [CLIENT]: FindingsService initialized successfully
// [CLIENT]: VeracodeMCPClient initialized successfully
```

This eliminates duplicate service instances and provides clean, informative logging.

## Available Tools

The Veracode MCP Server provides the following tools organized by category:

### Application Management
- `get-application-profiles` - List all application profiles with filtering options
- `search-application-profiles` - Search for applications by name or criteria  
- `get-application-profile-details` - Get detailed information about a specific application

### Findings & Security Analysis
- `get-findings` - Get security findings for an application with extensive filtering
- `get-static-flaw-info` - Get detailed static analysis flaw information

### SCA (Software Composition Analysis)
- `get-sca-results` - Get comprehensive SCA results for applications
- `get-sca-summary` - Get summarized SCA information
- `get-sca-apps` - Find all applications with SCA scanning enabled

### Scan Management
- `get-scan-results` - Get scan results and status information
- `get-sandbox-scans` - Get scans for a specific sandbox environment
- `get-scans-by-sandbox` - Compare scans across sandbox environments
- `compare-policy-vs-sandbox-scans` - Compare policy scans vs sandbox scans

### Sandbox Management
- `get-sandboxes` - List sandboxes for applications
- `get-sandbox-summary` - Get summary information about sandboxes

### Policy Management
- `get-policies` - List available security policies
- `get-policy` - Get details about a specific policy
- `get-policy-versions` - Get versions of a policy
- `get-policy-version` - Get specific policy version details
- `get-policy-settings` - Get policy configuration settings
- `get-sca-licenses` - Get SCA license information

### Example Usage

```typescript
// Get all applications
const apps = await client.callTool({
  tool: 'get-application-profiles',
  args: { size: 50 }
});

// Search for specific applications  
const searchResults = await client.callTool({
  tool: 'search-application-profiles',
  args: { name: 'MyApp' }
});

// Get SCA results
const scaResults = await client.callTool({
  tool: 'get-sca-results', 
  args: { application: 'MyApp' }
});

// Get security findings
const findings = await client.callTool({
  tool: 'get-findings',
  args: { 
    application: 'MyApp',
    severity_gte: 3,
    size: 100
  }
});
```
