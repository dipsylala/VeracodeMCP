
# Quick Start: Visual Studio Code Integration

## 🚀 Prerequisites

- Visual Studio Code installed
- Node.js and npm installed
- Valid Veracode API credentials

## 1. Clone & Install

```powershell
git clone https://github.com/your-org/VeracodeMCP.git
cd VeracodeMCP
npm install
```

## 2. Configure Credentials

Copy `.env.example` to `.env` and fill in your Veracode API credentials:

```
VERACODE_API_ID=your_api_id
VERACODE_API_KEY=your_api_key
```

## 3. Build the Server

```powershell
npm run build
```

## 4. VS Code Integration Options

### A. Using the MCP Extension

1. Install the "Model Context Protocol" extension from the VS Code Marketplace.
2. Create `.vscode/mcp.json`:

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

3. The extension will auto-discover and connect to your MCP server.

### B. Using VS Code Tasks

- Use the built-in tasks:
    - **Build Veracode MCP Server**
    - **Start Veracode MCP Server**
    - **Test Veracode Connection**
    - **Test Veracode Search**

  Access via `Ctrl+Shift+P` → "Tasks: Run Task".

### C. Debugging

- Press `F5` to debug with breakpoints in TypeScript files.

## 5. Useful Scripts

```powershell
npm run build         # Build the project
npm start             # Start the server
node build/query-apps.js   # Test connectivity
node build/test-search.js  # Test search
```

## 6. Troubleshooting

- Ensure `.env` is present and correct.
- Check terminal output for errors.
- For extension issues, try restarting VS Code.

---

Your Veracode MCP server is now ready for use in Visual Studio Code!
