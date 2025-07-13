import { ToolResponse, ToolCall } from '../types/shared-types.js';
import { VeracodeClient } from '../veracode-rest-client.js';

// Re-export shared types
export { ToolResponse, ToolCall };

// Tool execution context for CLI
export interface CLIToolContext {
  veracodeClient: VeracodeClient;
}

// CLI tool definition matching MCP pattern
export interface CLIToolHandler {
  name: string;
  handler: (args: any, context: CLIToolContext) => Promise<ToolResponse>;
}
