# Veracode MCP Server Examples

This directory contains example scripts that demonstrate how to use the Veracode MCP Server and client library.

## Available Examples

### Connection and Basic Operations

- **`query-apps.js`** - Test basic API connection and list applications
  - Usage: `node query-apps.js [search-term]`
  - Example: `node query-apps.js "Test"` (searches for applications containing "Test")
  
- **`test-search.js`** - Test application search functionality with various search terms

### SCA (Software Composition Analysis) Examples

- **`get-sca-results.js`** - Get comprehensive SCA results for any application
  - Usage: `node get-sca-results.js <application-name>`
  - Example: `node get-sca-results.js "YourAppName"`
  - **NEW CLI Tool**: Also available via `node build/veracode-mcp-client.js get-sca-results-by-name --name "YourAppName"`
  
- **`find-sca-apps.js`** - Find applications that have SCA scans available
  - Usage: `node find-sca-apps.js [name-filter]`
  - Example: `node find-sca-apps.js` (find all apps with SCA scans)
  - Example: `node find-sca-apps.js "Test"` (find apps containing "Test" with SCA scans)

### Static Analysis Examples

- **`get-static-flaw-info.js`** - Get detailed data path information for static analysis findings
  - Usage: `node get-static-flaw-info.js <app_id> <issue_id> [context]`
  - Example: `node get-static-flaw-info.js 12345678-abcd-1234-5678-123456789012 67890`
  - Example: `node get-static-flaw-info.js 12345678-abcd-1234-5678-123456789012 67890 sandbox-guid-here`
  - Shows call stacks, data paths, function names, file locations, and line numbers for static findings

### Analysis Comparison Examples

- **`compare-analysis-approaches.js`** - Demonstrates the differences between general findings overview and detailed flaw analysis
  - Usage: `node compare-analysis-approaches.js <app_name> <flaw_id>`
  - Example: `node compare-analysis-approaches.js "MyApplication" "123"`
  - Shows side-by-side comparison of:
    - General findings (get-findings-by-name) - good for overviews and summaries
    - Detailed flaw analysis (get-static-flaw-info-by-name) - good for technical investigation
  - Helps understand when to use each tool type

## Running Examples

### Using npm scripts:
```bash
# Test API connection
npm run test:connection

# Test search functionality  
npm run test:search

# Get SCA results for your application (requires app name parameter)
npm run example:sca-results

# Find applications with SCA scans
npm run example:find-sca-apps
```

### Using direct commands with parameters:
```bash
# Build first
npm run build

# Get comprehensive SCA analysis (CLI tool - RECOMMENDED)
node build/veracode-mcp-client.js get-sca-results-by-name --name "Your-App-Name"
node build/veracode-mcp-client.js get-sca-results-by-name --name "MyTestApp" --severity_gte 4 --only_exploitable true

# Get SCA results using example script (alternative approach)
node examples/get-sca-results.js "Your-App-Name"
node examples/get-sca-results.js "MyTestApp"

# Get static flaw data paths
node examples/get-static-flaw-info.js "app-guid-here" "issue-id-here"
node build/veracode-mcp-client.js get-static-flaw-info-by-name --name "MyApp" --issue_id "123"

# Search for specific applications
node examples/query-apps.js "Test"
node examples/query-apps.js "Production"
node build/veracode-mcp-client.js search-applications --name "Test"

# Find SCA apps with optional filtering
node examples/find-sca-apps.js
node examples/find-sca-apps.js "Test"

# Enable debug logging for any CLI command
LOG_LEVEL=debug node build/veracode-mcp-client.js get-sca-results-by-name --name "MyApp"
LOG_LEVEL=debug node examples/get-sca-results.js "MyApp"
```

### Using VS Code tasks:
- Open Command Palette (`Ctrl+Shift+P`)
- Type "Tasks: Run Task"
- Select the desired example task
- For custom app analysis, use "Example: Get SCA Results (Custom App)" and enter your application name when prompted

## Debug Logging

All examples and CLI tools support comprehensive debug logging to help troubleshoot issues and understand the tool's operation:

### Enable Debug Logging
```bash
# Set LOG_LEVEL environment variable
LOG_LEVEL=debug node examples/get-sca-results.js "MyApp"
LOG_LEVEL=debug node build/veracode-mcp-client.js get-sca-results-by-name --name "MyApp"

# Or add to your .env file
echo "LOG_LEVEL=debug" >> .env
```

### Debug Information Includes
- **API Calls**: Request URLs, response codes, data sizes, and timing
- **Application Search**: Search results and matching logic
- **Data Processing**: Findings count, filtering steps, and analysis metrics
- **Tool Execution**: Execution timing and performance data
- **Error Details**: Comprehensive error information for troubleshooting

### Log Levels Available
- `LOG_LEVEL=debug` - Shows all detailed debugging information
- `LOG_LEVEL=info` - Shows normal operational messages (default)
- `LOG_LEVEL=warn` - Shows warnings and errors only
- `LOG_LEVEL=error` - Shows only error messages

### Example Debug Output
```
[2025-07-12T21:10:09.259Z] DEBUG [API]: Getting findings by application name
  Data: { "name": "ASC-597", "options": { "scanType": "SCA" } }
[2025-07-12T21:10:09.648Z] DEBUG [CLIENT]: API Response received
  Data: { "method": "GET", "url": "appsec/v1/applications/?name=ASC-597", "status": 200, "dataSize": 2174 }
[2025-07-12T21:10:10.884Z] DEBUG [API]: Findings retrieved successfully
  Data: { "appName": "ASC-597", "findingsCount": 20, "scanType": "SCA", "executionTime": 1625 }
```

## Prerequisites

1. Create a `.env` file in the project root with your Veracode API credentials:
```
VERACODE_API_ID=your_api_id_here
VERACODE_API_KEY=your_api_key_here
```

2. Build the project:
```bash
npm run build
```

## Notes

- All examples require valid Veracode API credentials
- Application names are searched case-insensitively using partial matching
- If multiple applications match your search term, the first one will be used
- The TypeScript examples (`.ts`) are compiled to JavaScript in the `build/` directory
- The JavaScript examples (`.js`) run directly and import from the compiled `build/` directory
