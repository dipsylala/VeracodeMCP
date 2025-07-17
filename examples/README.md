# Basic Examples

This directory contains simple, well-commented examples for learning how to use the Veracode MCP Server. These examples are designed to be educational and demonstrate basic functionality.

## Available Examples

### 1. `list-applications.js`
Lists all applications in your Veracode account.

```bash
node examples/list-applications.js
```

**What it demonstrates:**
- Basic MCP client initialization
- Calling the `get-application-profiles` tool
- Processing and displaying application data

### 2. `search-applications.js`
Searches for applications by name pattern.

```bash
node examples/search-applications.js [search-term]
node examples/search-applications.js "Demo"
```

**What it demonstrates:**
- Using the `search-application-profiles` tool
- Passing parameters to MCP tools
- Handling search results

### 3. `get-sca-results.js`
Gets Software Composition Analysis (SCA) results for an application.

```bash
node examples/get-sca-results.js "MyApplication"
```

**What it demonstrates:**
- SCA analysis using the `get-sca-results` tool
- Filtering by severity levels
- Processing vulnerability data

### 4. `get-findings.js`
Gets security findings for an application.

```bash
node examples/get-findings.js "MyApplication"
node examples/get-findings.js "MyApplication" STATIC
```

**What it demonstrates:**
- Using the `get-findings` tool
- Optional scan type filtering
- Processing different types of security findings

## Prerequisites

1. **Build the project first:**
   ```bash
   npm run build
   ```

2. **Set up your Veracode API credentials:**
   ```bash
   # Windows
   $env:VERACODE_API_ID="your-api-id"
   $env:VERACODE_API_KEY="your-api-key"
   
   # Linux/Mac
   export VERACODE_API_ID="your-api-id"
   export VERACODE_API_KEY="your-api-key"
   ```

3. **Ensure you have applications in your Veracode account** that you can test with.

## Learning Path

We recommend running the examples in this order:

1. **Start with `list-applications.js`** to verify your setup and see available applications
2. **Try `search-applications.js`** to learn parameter passing
3. **Use `get-findings.js`** to see general security findings
4. **Explore `get-sca-results.js`** for specialized SCA analysis

## Code Structure

Each example follows a consistent pattern:

```javascript
import { VeracodeMCPClient } from '../../build/veracode-mcp-client.js';

async function exampleFunction() {
    try {
        const client = new VeracodeMCPClient();
        const result = await client.callTool('tool-name', { parameters });
        
        if (result.success) {
            // Process and display results
        } else {
            // Handle errors
        }
    } catch (error) {
        // Handle exceptions
    }
}
```

## Error Handling

All examples include comprehensive error handling and troubleshooting tips. Common issues:

- **Authentication errors**: Check your API credentials
- **Application not found**: Verify application names in your Veracode account
- **No scan data**: Ensure applications have been scanned

## Next Steps

After learning from these basic examples, explore:

- **Integration tests** in `tests/integration/` for more complex scenarios involving the MCP
- **Unit tests** in `tests/unit/` for testing individual components

## Related Documentation

- [Testing Guide](../docs/TESTING.md) - Running tests and validation
