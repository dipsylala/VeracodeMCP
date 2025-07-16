#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { VeracodeClient } from './veracode-rest-client.js';
import { ToolRegistry } from './tools/tool.registry.js';
import { logger } from './utils/logger.js';
import { loadVeracodeCredentials } from './utils/credentials.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();
logger.reinitialize(); // Reinitialize after env is loaded

logger.info('Starting Veracode MCP Server', 'STARTUP');

// Load and validate Veracode credentials
logger.debug('Loading Veracode credentials', 'STARTUP');
const credentials = loadVeracodeCredentials();

logger.debug('Environment loaded', 'STARTUP', {
  hasApiId: !!credentials.apiId,
  hasApiKey: !!credentials.apiKey,
  logLevel: process.env.LOG_LEVEL || 'info',
  apiBaseUrl: credentials.apiBaseUrl || 'default'
});

logger.debug('Environment validation passed', 'STARTUP');

// Create Veracode client instance
logger.debug('Creating Veracode client', 'STARTUP');
const veracodeClient = new VeracodeClient(credentials.apiId, credentials.apiKey, {
  apiBaseUrl: credentials.apiBaseUrl,
  platformBaseUrl: credentials.platformBaseUrl
});

// Create tool registry instance (context managed internally)
const toolRegistry = new ToolRegistry(veracodeClient);

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
const allTools = toolRegistry.getAllTools();
logger.info(`Registering ${allTools.length} tools`, 'STARTUP');

for (const tool of allTools) {
  logger.debug(`Registering tool: ${tool.name}`, 'TOOL_REGISTRY', {
    description: tool.description,
    hasSchema: !!tool.schema,
    schemaType: typeof tool.schema,
    hasZodDef: tool.schema?._def ? 'yes' : 'no'
  });

  // Validate that we have a proper Zod schema before converting
  let jsonSchema;
  if (tool.schema && tool.schema._def && tool.schema._def.typeName) {
    try {
      jsonSchema = zodToJsonSchema(tool.schema);
    } catch (error) {
      logger.error(`Failed to convert schema for tool ${tool.name}`, 'TOOL_REGISTRY', error);
      jsonSchema = {
        type: 'object',
        properties: {},
        additionalProperties: true
      };
    }
  } else {
    logger.warn(`Tool ${tool.name} has invalid or missing schema, using fallback`, 'TOOL_REGISTRY');
    jsonSchema = {
      type: 'object',
      properties: {},
      additionalProperties: true
    };
  }

  server.tool(tool.name, tool.description, jsonSchema, async (request) => {
    const startTime = Date.now();

    // Debug logging to see what we're receiving
    logger.debug(`Tool ${tool.name} received request`, 'TOOL_DEBUG', {
      requestType: typeof request,
      hasParams: 'params' in request,
      paramsKeys: request.params ? Object.keys(request.params) : [],
      hasArguments: request.params && 'arguments' in request.params,
      argumentsValue: request.params?.arguments,
      fullRequest: request
    });

    // Extract arguments from MCP request - correct MCP pattern
    let toolArguments: Record<string, any> = {};

    if (request && request.params && request.params.arguments) {
      toolArguments = request.params.arguments;
    }

    logger.toolExecution(tool.name, toolArguments);

    try {
      const result = await toolRegistry.executeTool({ tool: tool.name, args: toolArguments });
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
const categorySummary = toolRegistry.getCategorySummary();
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
