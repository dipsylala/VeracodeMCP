import { VeracodeClient } from '../veracode-rest-client.js';
import { logger } from '../utils/logger.js';
import { ToolCall, ToolResponse, CLIToolHandler } from './cli-types.js';
import { ToolCategory } from '../types/shared-types.js';

// Import all tool creation functions
import { createApplicationTools } from './application.tools.js';
import { createScanTools } from './scan.tools.js';
import { createPolicyTools } from './policy.tools.js';
import { createStaticAnalysisTools } from './static-analysis.tools.js';
import { createSCATools } from './sca.tools.js';
import { createFindingsTools } from './findings.tools.js';

/**
 * Simplified CLI tool registry matching MCP pattern
 */
export class CLIToolRegistry {
  private handlers: Map<string, CLIToolHandler> = new Map();
  private allTools: CLIToolHandler[] = [];

  constructor(client: VeracodeClient) {
    // Create all tools using factory functions
    this.allTools = [
      ...createApplicationTools(client),
      ...createScanTools(client),
      ...createPolicyTools(client),
      ...createStaticAnalysisTools(client),
      ...createSCATools(client),
      ...createFindingsTools(client)
    ];

    // Build handler map
    for (const tool of this.allTools) {
      this.handlers.set(tool.name, tool);
    }

    logger.debug('CLI tool registry initialized', 'CLI_REGISTRY', {
      toolCount: this.handlers.size,
      tools: Array.from(this.handlers.keys())
    });
  }

  async callTool(toolCall: ToolCall): Promise<ToolResponse> {
    const tool = this.handlers.get(toolCall.tool);
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${toolCall.tool}. Available tools: ${Array.from(this.handlers.keys()).join(', ')}`
      };
    }

    logger.debug('Executing CLI tool', 'CLI_REGISTRY', {
      tool: toolCall.tool,
      hasArgs: !!toolCall.args
    });

    return await tool.handler(toolCall.args);
  }

  getAvailableTools(): string[] {
    return Array.from(this.handlers.keys()).sort();
  }

  getToolsByCategory(): Record<string, string[]> {
    const categorization: Record<string, string[]> = {
      [ToolCategory.APPLICATION]: [],
      [ToolCategory.SCAN]: [],
      [ToolCategory.POLICY]: [],
      [ToolCategory.STATIC_ANALYSIS]: [],
      [ToolCategory.SCA]: [],
      [ToolCategory.FINDINGS]: []
    };

    const tools = Array.from(this.handlers.keys());
    for (const tool of tools) {
      if (tool.includes('application') || tool === 'get-applications' || tool === 'search-applications') {
        categorization[ToolCategory.APPLICATION].push(tool);
      } else if (tool.includes('scan')) {
        categorization[ToolCategory.SCAN].push(tool);
      } else if (tool.includes('policy')) {
        categorization[ToolCategory.POLICY].push(tool);
      } else if (tool.includes('static-flaw')) {
        categorization[ToolCategory.STATIC_ANALYSIS].push(tool);
      } else if (tool.includes('sca')) {
        categorization[ToolCategory.SCA].push(tool);
      } else if (tool.includes('finding')) {
        categorization[ToolCategory.FINDINGS].push(tool);
      }
    }

    return categorization;
  }

  getAllTools(): CLIToolHandler[] {
    return this.allTools;
  }
}
