import { ToolResponse, ToolCategory } from '../types/shared-types.js';

// Re-export shared types
export { ToolResponse, ToolCategory };

// Tool execution context
export interface ToolContext {
  veracodeClient: any; // Will be properly typed
}

// Tool handler interface for modular architecture
export interface MCPToolHandler {
  name: string;
  description: string;
  schema: any;
  handler: (args: any, context: ToolContext) => Promise<ToolResponse>;
}
