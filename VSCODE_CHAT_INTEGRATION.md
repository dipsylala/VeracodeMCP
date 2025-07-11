# VS Code Chat Integration Guide

## Overview

This guide explains how to use the Veracode MCP server directly from VS Code's chat interface using the Copilot MCP extension.

## Current Status ✅

✅ **MCP Server**: Built and tested - successfully retrieves 50+ applications  
✅ **Copilot MCP Extension**: Installed (`automatalabs.copilot-mcp`)  
✅ **Server Configuration**: Configured in `.vscode/settings.json`  
✅ **API Integration**: Working - can list, search, and get details on applications  
✅ **Interactive Testing**: CLI test harness confirms all tools work properly  

## Setup Steps

### 1. Prerequisites ✅
- VS Code with GitHub Copilot extension installed
- Copilot MCP extension installed (`automatalabs.copilot-mcp`)
- Veracode MCP server built and configured

### 2. Server Configuration ✅
The MCP server is configured in `.vscode/settings.json` under the `copilot-mcp.servers` section:

```json
{
  "copilot-mcp.servers": {
    "veracode": {
      "command": "node",
      "args": ["./build/index.js"],
      "cwd": "${workspaceFolder}",
      "env": {
        "VERACODE_API_ID": "your_api_id",
        "VERACODE_API_KEY": "your_api_key"
      },
      "enabled": true,
      "description": "Veracode API integration for application security scanning"
    }
  }
}
```

### 3. Restart VS Code 🔄
**IMPORTANT**: After configuration changes, restart VS Code to reload the MCP settings.

## Using the Chat Interface

Once configured and VS Code is restarted, you can interact with Veracode data directly from VS Code's chat:

### Available Commands

1. **List Applications**
   - "Show me all Veracode applications"
   - "List available applications in Veracode"

2. **Search Applications**
   - "Find applications with 'COBOL' in the name"
   - "Search for applications containing 'web'"
   - "Show me applications with 'webgoat'"

3. **Get Application Details**
   - "Show details for application ID 12345"
   - "Get information about the MyApp application"

4. **Scan Results**
   - "Get scan results for application ID 12345"
   - "Show recent scan data for MyApp"

5. **Security Findings**
   - "List findings for application ID 12345"
   - "Show security issues for MyApp"

6. **Policy Compliance**
   - "Check policy compliance for application ID 12345"
   - "Get compliance status for MyApp"

### Example Interactions

**User:** "Show me applications with COBOL in the name"

**Expected Response:** *Uses the search-applications tool to find applications containing "COBOL" and displays results like "COBOL Demo Reference App"*

**User:** "List all Veracode applications"

**Expected Response:** *Uses the get-applications tool to retrieve and display 50+ applications with their business criticality levels*

## Testing Before Chat Use

You can verify the server works using the CLI test harness:
```powershell
npm run interactive
```

Example test queries:
- "Search for webgoat applications"
- "List all applications"
- "Find apps with test in the name"

## Troubleshooting

### 1. Server Not Starting
- Check that the build is up to date: `npm run build`
- Verify environment variables are set correctly in `.env`
- Check VS Code Developer Console (Help > Toggle Developer Tools) for errors

### 2. Authentication Issues
- Verify VERACODE_API_ID and VERACODE_API_KEY are correct in `.env`
- Ensure API credentials have proper permissions
- Test connectivity with: `npm run test` or `node build/query-apps.js`

### 3. Extension Not Recognizing Server
- Restart VS Code after configuration changes
- Check that `copilot-mcp.servers` is properly configured in `.vscode/settings.json`
- Verify the Copilot MCP extension is enabled and up to date
- Check VS Code Command Palette for "MCP" related commands

### 4. Chat Not Using MCP Tools
- Ensure GitHub Copilot Chat extension is installed and active
- Try being explicit: "Use the Veracode MCP server to show me applications"
- Check that the server is listed in MCP server management (if available in extension)

## Verification Commands

Run these to verify everything is working:

```powershell
# Build the server
npm run build

# Test API connectivity
node build/query-apps.js

# Interactive testing
npm run interactive
```

## Next Steps

1. **Restart VS Code** to ensure MCP configuration is loaded
2. **Open VS Code Chat** (Ctrl+Shift+I or Cmd+Shift+I)
3. **Try your first query**: "Show me all Veracode applications"
4. **Test search functionality**: "Find applications with webgoat in the name"

If the chat integration works, you should see the assistant use the Veracode MCP tools to retrieve and display real application data from your Veracode account.
