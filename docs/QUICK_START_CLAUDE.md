# Quick Start: Claude Desktop Integration

## 🚀 Prerequisites

- Claude Desktop installed
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

## 4. Configure Claude Desktop

Edit your `claude_desktop_config.json` (see Claude docs for the path):

**Option 1: Use .env file (recommended)**
```json
{
  "mcpServers": {
    "veracode": {
      "command": "node",
      "args": ["E:\\Github\\VeracodeMCP\\build\\index.js"],
      "cwd": "E:\\Github\\VeracodeMCP"
    }
  }
}
```

**Option 2: Pass credentials directly**
```json
{
  "mcpServers": {
    "veracode": {
      "command": "node",
      "args": ["E:\\Github\\VeracodeMCP\\build\\index.js"],
      "env": {
        "VERACODE_API_ID": "your_api_id",
        "VERACODE_API_KEY": "your_api_key"
      }
    }
  }
}
```

## 5. Restart Claude Desktop

- Fully close and restart Claude Desktop after updating the config.

---

Your Veracode MCP server is now ready for use with Claude Desktop!
