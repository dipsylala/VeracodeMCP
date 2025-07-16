# Quick VS Code Setup Guide

## 🚀 **Getting Started with VS Code Integration**

Your Veracode MCP server is now configured for Visual Studio Code! Here's how to use it:

## ✅ **Available VS Code Tasks**

Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) and type "Tasks: Run Task", then choose:

### 1. **Build Veracode MCP Server**
- Compiles TypeScript to JavaScript
- Run this after making code changes

### 2. **Start Veracode MCP Server** 
- Starts the MCP server in the background
- Automatically builds first if needed

### 3. **Test Veracode Connection**
- Tests API connectivity and lists all applications
- Good for verifying credentials work

### 4. **Test Veracode Search**
- Tests the search functionality
- Shows examples of searching for different apps

## 🔧 **Debug Configurations**

Press `F5` or use the Debug panel to run:

### 1. **Debug Veracode MCP Server**
- Full debugging of the main MCP server
- Set breakpoints in TypeScript source files

### 2. **Debug Query Apps Script**
- Debug the application listing functionality

### 3. **Debug Search Test**
- Debug the search functionality

## 📋 **Quick Commands**

### Using Command Palette (`Ctrl+Shift+P`):

```
> Tasks: Run Task
  - Build Veracode MCP Server
  - Start Veracode MCP Server
  - Test Veracode Connection
  - Test Veracode Search

> Debug: Start Debugging
  - Debug Veracode MCP Server
  - Debug Query Apps Script
  - Debug Search Test
```

### Using Terminal:

```bash
# Build the project
npm run build

# Start the server
npm start

# Test connectivity
node build/query-apps.js

# Test search
node build/test-search.js
```

## 🛠️ **Development Workflow**

1. **Make changes** to TypeScript files in `src/`
2. **Build**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Build Veracode MCP Server"
3. **Test**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Test Veracode Connection"
4. **Debug**: Press `F5` to debug with breakpoints

## 🔍 **MCP Integration**

The MCP server configuration is in `.vscode/mcp.json`. This allows VS Code extensions to:

- Discover your MCP server automatically
- Connect to it for tooling
- Use it for AI/Copilot integration

## 🎯 **Available MCP Tools**

When the server is running, these tools are available:

- `get-application-profiles` - List all application profiles
- `search-application-profiles` - Search by name
- `get-application-details` - Get app details
- `get-scan-results` - Get scan results
- `get-findings` - **UNIFIED FINDINGS TOOL** - Get security findings with intelligent filtering and pagination
- `get-policy-compliance` - Check compliance

## ⚡ **Pro Tips**

1. **Auto-build**: Use `npm run dev` for automatic rebuilding on file changes
2. **Debugging**: Set breakpoints in TypeScript files, not JavaScript
3. **Testing**: Always test after making authentication changes
4. **Logs**: Check the terminal output for detailed error messages

---

Your Veracode MCP server is ready to use in VS Code! 🚀
