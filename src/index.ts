#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { VeracodeClient } from "./veracode-rest-client.js";
import { toolRegistry } from "./tools/tool.registry.js";
import { ToolContext } from "./types/tool.types.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["VERACODE_API_ID", "VERACODE_API_KEY"];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
  console.error("Please set these variables in your .env file or environment");
  process.exit(1);
}

// Create Veracode client instance
const veracodeClient = new VeracodeClient(
  process.env.VERACODE_API_ID!,
  process.env.VERACODE_API_KEY!
);

// Create tool context
const toolContext: ToolContext = {
  veracodeClient
};

// Create MCP server instance
const server = new McpServer({
  name: "veracode-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register all tools from the tool registry
const allTools = toolRegistry.getAllTools();
console.error(`Registering ${allTools.length} tools...`);

for (const tool of allTools) {
  server.tool(
    tool.name,
    tool.description,
    tool.schema,
    async (args: any) => {
      try {
        const result = await tool.handler(args, toolContext);
        
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: `Error executing ${tool.name}: ${errorMessage}`
              }, null, 2),
            },
          ],
        };
      }
    }
  );
}

// Log tool registration summary
const categorySummary = toolRegistry.getCategorySummary();
console.error('Tool registration summary:');
for (const [category, count] of Object.entries(categorySummary)) {
  console.error(`  ${category}: ${count} tools`);
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Veracode MCP Server is running...");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
