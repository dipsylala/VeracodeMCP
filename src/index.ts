#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { VeracodeClient } from './veracode-rest-client.js';
import { MCPToolRegistry } from './mcp-tools/mcp.tool.registry.js';
import { logger } from './utils/logger.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();
logger.reinitialize(); // Reinitialize after env is loaded

logger.info('Starting Veracode MCP Server', 'STARTUP');
logger.debug('Environment loaded', 'STARTUP', {
  hasApiId: !!process.env.VERACODE_API_ID,
  hasApiKey: !!process.env.VERACODE_API_KEY,
  logLevel: process.env.LOG_LEVEL || 'info',
  apiBaseUrl: process.env.VERACODE_API_BASE_URL || 'default'
});

// Validate required environment variables
const requiredEnvVars = ['VERACODE_API_ID', 'VERACODE_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`, 'STARTUP');
  logger.error('Please set these variables in your .env file or environment', 'STARTUP');
  process.exit(1);
}

logger.debug('Environment validation passed', 'STARTUP');

// Create Veracode client instance
logger.debug('Creating Veracode client', 'STARTUP');
const veracodeClient = new VeracodeClient(process.env.VERACODE_API_ID!, process.env.VERACODE_API_KEY!);

// Create tool registry instance (context managed internally)
const mcpToolRegistry = new MCPToolRegistry(veracodeClient);

logger.debug('Tool registry created', 'STARTUP');

// Create MCP server instance
logger.debug('Creating MCP server', 'STARTUP');
const server = new McpServer({
  name: 'veracode-mcp-server',
  version: '1.0.0',
  capabilities: {
    resources: {},
    tools: {}
  }
});

// Register all tools from the tool registry
const allTools = mcpToolRegistry.getAllTools();
logger.info(`Registering ${allTools.length} tools`, 'STARTUP');

for (const tool of allTools) {
  logger.debug(`Registering tool: ${tool.name}`, 'TOOL_REGISTRY', {
    description: tool.description,
    hasSchema: !!tool.schema
  });

  server.tool(tool.name, tool.description, tool.schema, async (args: any) => {
    const startTime = Date.now();
    logger.toolExecution(tool.name, args);

    try {
      const result = await mcpToolRegistry.executeTool({ tool: tool.name, args });
      const executionTime = Date.now() - startTime;

      logger.toolResult(
        tool.name,
        result.success,
        executionTime,
        result.data ? JSON.stringify(result.data).length : undefined
      );

      logger.debug(`Tool ${tool.name} result`, 'TOOL_RESULT', {
        success: result.success,
        hasData: !!result.data,
        hasError: !!result.error
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.toolError(tool.name, error);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: `Error executing ${tool.name}: ${errorMessage}`
              },
              null,
              2
            )
          }
        ]
      };
    }
  });
}

// Log tool registration summary
const categorySummary = mcpToolRegistry.getCategorySummary();
logger.info('Tool registration summary', 'STARTUP');
for (const [category, count] of Object.entries(categorySummary)) {
  logger.info(`  ${category}: ${count} tools`, 'STARTUP');
}

// Start the server
async function main() {
  logger.debug('Starting server transport', 'STARTUP');
  const transport = new StdioServerTransport();

  logger.debug('Connecting to MCP transport', 'STARTUP');
  await server.connect(transport);

  logger.info('Veracode MCP Server is running', 'STARTUP');
  logger.debug('Server ready to accept requests', 'STARTUP');
}

main().catch(error => {
  logger.error('Server startup failed', 'STARTUP', error);
  process.exit(1);
});
