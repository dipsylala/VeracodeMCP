import { ToolResponse, ToolCategory } from '../types/shared-types.js';
import { VeracodeClient } from '../veracode-rest-client.js';

// Re-export shared types
export { ToolResponse, ToolCategory };

// Tool execution context
export interface ToolContext {
  veracodeClient: VeracodeClient;
}

// Tool handler interface for modular architecture
export interface ToolHandler {
  name: string;
  description: string;
  schema: any;
  handler: (args: any, context: ToolContext) => Promise<ToolResponse>;
}
