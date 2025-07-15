import { VeracodeClient } from './veracode-rest-client.js';
import { logger } from './utils/logger.js';
import { ToolRegistry } from './tools/tool.registry.js';
import * as dotenv from 'dotenv';

dotenv.config();
logger.reinitialize(); // Reinitialize after env is loaded

interface ToolCall {
  tool: string;
  args?: Record<string, any>;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class VeracodeMCPClient {
  private veracodeClient: VeracodeClient;
  private toolRegistry: ToolRegistry;

  constructor() {
    logger.debug('Initializing VeracodeMCPClient', 'CLIENT');

    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    logger.debug('Environment check', 'CLIENT', {
      hasApiId: !!apiId,
      hasApiKey: !!apiKey,
      logLevel: process.env.LOG_LEVEL
    });

    if (!apiId || !apiKey) {
      logger.error('Missing Veracode API credentials', 'CLIENT');
      throw new Error('Missing Veracode API credentials');
    }

    logger.debug('Creating Veracode client instance', 'CLIENT');
    this.veracodeClient = new VeracodeClient(apiId, apiKey);
    logger.debug('Veracode client created', 'CLIENT');

    logger.debug('About to initialize tool registry', 'CLIENT');
    this.toolRegistry = new ToolRegistry(this.veracodeClient);
    logger.debug('Tool registry created', 'CLIENT');

    logger.info('VeracodeMCPClient initialized successfully', 'CLIENT');
  }

  async callTool(toolCall: ToolCall): Promise<ToolResult> {
    const startTime = Date.now();
    logger.debug('Tool call initiated', 'CLIENT', {
      tool: toolCall.tool,
      hasArgs: !!toolCall.args,
      argsCount: toolCall.args ? Object.keys(toolCall.args).length : 0
    });

    try {
      const result = await this.toolRegistry.executeTool(toolCall);

      const executionTime = Date.now() - startTime;
      logger.debug('Tool call completed', 'CLIENT', {
        tool: toolCall.tool,
        success: result.success,
        executionTime
      });

      return result;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      logger.error('Tool call failed', 'CLIENT', {
        tool: toolCall.tool,
        executionTime,
        error: error.message
      });
      return {
        success: false,
        error: `Error calling tool ${toolCall.tool}: ${error.message}`
      };
    }
  }

  getAvailableTools(): string[] {
    return this.toolRegistry.getToolNames();
  }

  getToolCount(): number {
    return this.toolRegistry.getToolCount();
  }

  getToolsByCategory(): Record<string, string[]> {
    return this.toolRegistry.getAllToolsByCategory();
  }

  hasTool(name: string): boolean {
    return this.toolRegistry.hasTool(name);
  }
}
