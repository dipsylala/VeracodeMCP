<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Veracode MCP Server

This is an MCP (Model Context Protocol) server project that integrates with the Veracode API to provide access to application details and scan results.

## Key Guidelines

- This project uses TypeScript with ES modules
- Follow the MCP SDK patterns for server implementation
- Use Zod for input validation and schema definition
- Implement proper error handling for API calls
- Use environment variables for sensitive configuration like API credentials
- Follow Veracode API documentation for proper endpoint usage

## API Integration Notes

- Veracode uses VERACODE-HMAC-SHA-256 authentication for API access
- API rate limiting should be considered
- Support both REST API v3 and Results API endpoints
- Handle both JSON and XML responses depending on the endpoint

## MCP Tools to Implement

1. `get-applications` - List all applications
2. `get-application-details` - Get detailed information about a specific application
3. `get-scan-results` - Get scan results for an application
4. `get-findings` - Get detailed findings from scans
5. `get-policy-compliance` - Check policy compliance status

You can find more info and examples at https://modelcontextprotocol.io/llms-full.txt
