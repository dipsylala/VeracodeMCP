# Integrating Veracode MCP Server with Claude for Desktop

This guide shows how to integrate your Veracode MCP server with Claude for Desktop to get real-time access to your Veracode applications and scan data.

## Prerequisites

1. **Claude for Desktop** installed on your machine
2. **Working Veracode MCP Server** (which we just built!)
3. **Valid Veracode API credentials**

## Step 1: Prepare the MCP Server

Make sure your server is built and ready:

```bash
npm run build
```

## Step 2: Configure Claude for Desktop

### Windows Configuration

Create or edit the Claude for Desktop configuration file:

**Location:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "veracode": {
      "command": "node",
      "args": ["E:\\Github\\VeracodeMCP\\build\\index.js"],
      "env": {
        "VERACODE_API_ID": "your_api_id_here",
        "VERACODE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### macOS Configuration

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "veracode": {
      "command": "node",
      "args": ["/path/to/your/VeracodeMCP/build/index.js"],
      "env": {
        "VERACODE_API_ID": "your_api_id_here", 
        "VERACODE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Linux Configuration

**Location:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "veracode": {
      "command": "node",
      "args": ["/path/to/your/VeracodeMCP/build/index.js"],
      "env": {
        "VERACODE_API_ID": "your_api_id_here",
        "VERACODE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Step 3: Alternative Configuration (Using .env file)

If you prefer to keep credentials in your `.env` file, use this configuration instead:

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

This will use the `.env` file in your project directory.

## Step 4: Restart Claude for Desktop

After updating the configuration:

1. **Close Claude for Desktop completely**
2. **Restart the application**
3. **Look for the MCP connection indicator** in the UI

## Step 5: Test the Integration

Once Claude restarts, you should be able to use these commands:

### Available Tools

- **`get-application-profiles`** - List all application profiles in your Veracode account
- **`search-application-profiles`** - Search for application profiles by name
- **`get-application-profile-details`** - Get detailed info about a specific application profile
- **`get-scan-results`** - Get scan results for an application
- **`get-findings`** - Get findings from scans
- **`get-policy-compliance`** - Check policy compliance status

### Example Prompts to Try

```
"Show me all my Veracode applications"

"Search for applications containing 'WebGoat'"

"Get details for application ID abc-123-def"

"Show me scan results for the DVWA application"

"What are the findings for application XYZ?"

"Check policy compliance for my banking applications"
```

## Troubleshooting

### Common Issues

1. **Server not connecting:**
   - Check that Node.js is in your PATH
   - Verify the file paths in the configuration
   - Ensure the server builds without errors

2. **Authentication failures:**
   - Verify your API credentials are correct
   - Check that credentials have proper permissions
   - Ensure no extra spaces in credential values

3. **MCP not loading:**
   - Restart Claude for Desktop completely
   - Check the configuration file syntax (valid JSON)
   - Look for error messages in Claude's developer console

### Testing MCP Server Manually

You can test the server directly:

```bash
# Test that the server starts
node build/index.js

# Test API connectivity
node build/query-apps.js
```

## Security Notes

- Keep your API credentials secure
- Consider using environment variables instead of hardcoding credentials
- The `.env` file should never be committed to version control

## Advanced Configuration

For production use, consider:

- Using a process manager like PM2
- Setting up logging and monitoring
- Adding error recovery mechanisms
- Implementing rate limiting

---

Once configured, you'll have seamless access to your Veracode data directly within Claude for Desktop! 🚀
