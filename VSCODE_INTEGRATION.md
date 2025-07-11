# Integrating Veracode MCP Server with Visual Studio Code

This guide shows how to integrate your Veracode MCP server with Visual Studio Code to get real-time access to your Veracode applications and scan data directly in your editor.

## Prerequisites

1. **Visual Studio Code** installed
2. **Working Veracode MCP Server** (built and tested)
3. **Valid Veracode API credentials**

## Method 1: Using VS Code MCP Extension

### Step 1: Install MCP Extension

Install the Model Context Protocol extension for VS Code:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Model Context Protocol" or "MCP"
4. Install the official MCP extension

### Step 2: Configure MCP Server

Create or edit `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "veracode": {
      "command": "node",
      "args": ["./build/index.js"],
      "cwd": "${workspaceFolder}",
      "env": {
        "VERACODE_API_ID": "your_api_id_here",
        "VERACODE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Step 3: Alternative - Use .env File

If you prefer to keep credentials in `.env`:

```json
{
  "servers": {
    "veracode": {
      "command": "node",
      "args": ["./build/index.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

## Method 2: Using VS Code Tasks

### Step 1: Create Tasks Configuration

Create `.vscode/tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start Veracode MCP Server",
            "type": "shell",
            "command": "node",
            "args": ["build/index.js"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "new",
                "showReuseMessage": true,
                "clear": false
            },
            "isBackground": true,
            "problemMatcher": []
        },
        {
            "label": "Build Veracode MCP Server",
            "type": "shell",
            "command": "npm",
            "args": ["run", "build"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared",
                "showReuseMessage": true,
                "clear": false
            }
        }
    ]
}
```

### Step 2: Create Launch Configuration

Create `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Veracode MCP Server",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/build/index.js",
            "console": "integratedTerminal",
            "envFile": "${workspaceFolder}/.env"
        }
    ]
}
```

## Method 3: Using VS Code Terminal Integration

### Step 1: Add Scripts to package.json

We've already added these, but here they are:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js",
    "dev": "tsc --watch",
    "test": "npm run build && node build/test.js"
  }
}
```

### Step 2: Use VS Code Command Palette

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Tasks: Run Task"
3. Select "Build Veracode MCP Server" or "Start Veracode MCP Server"

## Method 4: Using VS Code Extensions API

### Step 1: Create VS Code Extension (Advanced)

If you want deep integration, you can create a VS Code extension that uses your MCP server.

Create `extension.js`:

```javascript
const vscode = require('vscode');
const { spawn } = require('child_process');

function activate(context) {
    let mcpServer;
    
    // Start MCP server
    const startServer = vscode.commands.registerCommand('veracode.startServer', () => {
        mcpServer = spawn('node', ['build/index.js'], {
            cwd: vscode.workspace.rootPath
        });
        
        mcpServer.stdout.on('data', (data) => {
            console.log(`MCP Server: ${data}`);
        });
        
        vscode.window.showInformationMessage('Veracode MCP Server started');
    });
    
    // Get applications command
    const getApps = vscode.commands.registerCommand('veracode.getApplications', async () => {
        // Call MCP server and display results
        vscode.window.showInformationMessage('Fetching Veracode applications...');
    });
    
    context.subscriptions.push(startServer, getApps);
}

exports.activate = activate;
```

## Quick Setup Commands

### For VS Code Workspace Integration:

```bash
# Build the server
npm run build

# Start the server manually
npm start

# Or run in development mode with auto-rebuild
npm run dev
```

## Using the MCP Server in VS Code

Once configured, you can:

### 1. Use Command Palette
- `Ctrl+Shift+P` → "Veracode: Get Applications"
- `Ctrl+Shift+P` → "Veracode: Search Applications"

### 2. Use Terminal
```bash
# Test the server
node build/query-apps.js

# Test search functionality
node build/test-search.js
```

### 3. Use as Development Tool
- Set breakpoints in your TypeScript source
- Debug with F5
- Use integrated terminal for testing

## VS Code Settings

Add to your `settings.json`:

```json
{
    "mcp.servers": {
        "veracode": {
            "enabled": true,
            "autoStart": true
        }
    }
}
```

## Example VS Code Workflow

1. **Open your workspace** with the Veracode MCP server
2. **Build the server**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Build Veracode MCP Server"
3. **Start the server**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Veracode MCP Server"
4. **Test functionality**: Use the terminal to run test scripts
5. **Integrate with your code**: Call the MCP server from your applications

## Troubleshooting

### Server not starting:
- Check that Node.js is available in VS Code's terminal
- Verify the build completed successfully
- Check the `.env` file exists and has correct credentials

### MCP extension not found:
- The MCP extension ecosystem is still developing
- Use the Task/Terminal methods as alternatives
- Consider building a custom extension for deep integration

---

This gives you multiple ways to integrate the Veracode MCP server with VS Code, from simple terminal usage to full extension development! 🚀
