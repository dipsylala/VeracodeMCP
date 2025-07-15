import { VeracodeClient } from '../veracode-rest-client.js';
import { logger } from '../utils/logger.js';
import { ToolCall, ToolResponse, CLIToolHandler, CLIToolContext } from './cli-types.js';
import { ToolCategory } from '../types/shared-types.js';

// Import all tool creation functions
import { createApplicationTools } from './application.tools.js';
import { createScanTools } from './scan.tools.js';
import { createPolicyTools } from './policy.tools.js';
import { createStaticAnalysisTools } from './static-analysis.tools.js';
import { createSCATools } from './sca.tools.js';
import { createFindingsTools } from './findings.tools.js';
import { createSandboxTools } from './sandbox.tools.js';

export class CLIToolRegistry {
  private tools: Map<string, CLIToolHandler> = new Map();
  private allTools: CLIToolHandler[] = [];
  private context: CLIToolContext;

  constructor(client: VeracodeClient) {
    this.context = { veracodeClient: client };

    this.allTools = [
      ...createApplicationTools(),
      ...createScanTools(),
      ...createPolicyTools(),
      ...createStaticAnalysisTools(),
      ...createSCATools(),
      ...createFindingsTools(),
      ...createSandboxTools()
    ];

    for (const tool of this.allTools) {
      this.tools.set(tool.name, tool);
    }
  }

  getAllTools(): CLIToolHandler[] {
    return this.allTools;
  }

  async executeTool(toolCall: ToolCall): Promise<ToolResponse> {
    const tool = this.tools.get(toolCall.tool);
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${toolCall.tool}. Available tools: ${Array.from(this.tools.keys()).join(', ')}`
      };
    }

    logger.debug('Executing CLI tool', 'CLI_REGISTRY', {
      tool: toolCall.tool,
      hasArgs: !!toolCall.args
    });

    return await tool.handler(toolCall.args, this.context);
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys()).sort();
  }

  getToolsByCategory(category: ToolCategory): CLIToolHandler[] {
    return this.allTools.filter(tool => {
      const name = tool.name;
      switch (category) {
        case ToolCategory.APPLICATION:
          return name.includes('application') || name === 'get-applications' || name === 'search-applications';
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

  getAllToolsByCategory(): Record<string, string[]> {
    const categorization: Record<string, string[]> = {
      [ToolCategory.APPLICATION]: [],
      [ToolCategory.SCAN]: [],
      [ToolCategory.POLICY]: [],
      [ToolCategory.STATIC_ANALYSIS]: [],
      [ToolCategory.SCA]: [],
      [ToolCategory.FINDINGS]: []
    };

    for (const category of Object.values(ToolCategory)) {
      categorization[category] = this.getToolsByCategory(category).map(tool => tool.name);
    }

    return categorization;
  }
}
