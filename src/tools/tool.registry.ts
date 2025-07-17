import { ToolHandler, ToolContext } from './tool-types.js';
import { ToolCategory, ToolCall } from '../types/shared-types.js';
import { VeracodeClient } from '../veracode-rest-client.js';
import { createApplicationTools } from './application.tools.js';
import { createFindingsTools } from './findings.tools.js';
import { createStaticAnalysisTools } from './static-analysis.tools.js';
import { createSCATools } from './sca.tools.js';
import { createScanTools } from './scan.tools.js';
import { createPolicyTools } from './policy.tools.js';
import { createSandboxTools } from './sandbox.tools.js';

export class ToolRegistry {
  private tools: Map<string, ToolHandler> = new Map();
  private allTools: ToolHandler[] = [];
  private context: ToolContext;

  constructor(client: VeracodeClient) {
    // Create context
    this.context = { veracodeClient: client };

    this.allTools = [
      ...createApplicationTools(),
      ...createFindingsTools(),
      ...createStaticAnalysisTools(),
      ...createSCATools(),
      ...createScanTools(),
      ...createPolicyTools(),
      ...createSandboxTools()
    ];

    // Build handler map
    for (const tool of this.allTools) {
      this.tools.set(tool.name, tool);
    }
  }

  // Get all tools
  getAllTools(): ToolHandler[] {
    return this.allTools;
  }

  // Execute tool with ToolCall - throws on error (like original executeTool)
  async executeTool(toolCall: ToolCall): Promise<any> {
    const tool = this.tools.get(toolCall.tool);
    if (!tool) {
      throw new Error(`Tool not found: ${toolCall.tool}`);
    }

    // Validate arguments using Zod schema if present
    if (tool.schema) {
      try {
        const validatedArgs = tool.schema.parse(toolCall.args || {});
        return await tool.handler(validatedArgs, this.context);
      } catch (error: any) {
        // Return a consistent error format for validation errors
        return {
          success: false,
          error: 'Invalid arguments provided',
          data: {
            details: error.message,
            validation_errors: error.errors || [],
            troubleshooting: [
              'Check that all required parameters are provided',
              'Verify parameter types match the expected schema',
              'Review the tool documentation for proper usage'
            ]
          }
        };
      }
    }

    return await tool.handler(toolCall.args || {}, this.context);
  }

  // Get tool by name
  getTool(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }

  // Get tools by category
  getToolsByCategory(category: ToolCategory): ToolHandler[] {
    return this.allTools.filter(tool => {
      const name = tool.name;
      switch (category) {
      case ToolCategory.APPLICATION:
        return name.includes('application') || name === 'get-application-profiles' || name === 'search-application-profiles';
      case ToolCategory.FINDINGS:
        return name.includes('finding');
      case ToolCategory.STATIC_ANALYSIS:
        return name.includes('static-flaw');
      case ToolCategory.SCA:
        return name.includes('sca');
      case ToolCategory.SCAN:
        return name.includes('scan');
      case ToolCategory.POLICY:
        return name.includes('policy');
      default:
        return false;
      }
    });
  }

  // Get all categories with tool names - for compatibility
  getAllToolsByCategory(): Record<string, string[]> {
    const categorization: Record<string, string[]> = {};
    for (const category of Object.values(ToolCategory)) {
      categorization[category] = this.getToolsByCategory(category).map(tool => tool.name);
    }
    return categorization;
  }

  // Get all tool names
  getToolNames(): string[] {
    return this.allTools.map(tool => tool.name);
  }

  // Check if tool exists
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  // Get tool count
  getToolCount(): number {
    return this.allTools.length;
  }

  // Get categories with tool counts
  getCategorySummary(): { [key in ToolCategory]: number } {
    const summary = {} as { [key in ToolCategory]: number };
    for (const category of Object.values(ToolCategory)) {
      summary[category] = this.getToolsByCategory(category).length;
    }
    return summary;
  }
}
