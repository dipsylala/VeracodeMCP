import { ToolResponse, ToolCall } from '../types/shared-types.js';

// Re-export shared types
export { ToolResponse, ToolCall };

// CLI tool definition matching MCP pattern
export interface CLIToolHandler {
  name: string;
  handler: (args: any) => Promise<ToolResponse>;
}
