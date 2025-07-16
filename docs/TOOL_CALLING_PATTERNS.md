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
# Test MCP server (uses 'arguments' format)
npm run build
node build/index.js

# Test direct client (uses 'args' format)  
node examples/test-search-application-profiles.js
```
