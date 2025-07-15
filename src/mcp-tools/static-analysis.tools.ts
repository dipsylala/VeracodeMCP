import { z } from 'zod';
import { MCPToolHandler, ToolContext, ToolResponse } from './mcp-types.js';

/**
 * Helper function to detect if a string is a GUID format
 */
function isGuid(str: string): boolean {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(str);
}

/**
 * Create static analysis tools for MCP
 */
export function createStaticAnalysisTools(): MCPToolHandler[] {
  return [
    {
      name: 'get-static-flaw-info',
      description:
        'Get detailed static analysis flaw information by application (ID or name) and flaw ID. This tool provides comprehensive flaw details including data paths, call stack information, and remediation guidance. Use this tool when you need specific details about a particular flaw identified by its numeric ID within a specific application.',
      schema: {
        application: z.string().describe('Application ID (GUID) or application name that contains the flaw'),
        issue_id: z.string().describe('Issue/Flaw ID to get detailed information for'),
        sandbox_id: z.string().optional().describe('Optional sandbox ID to filter findings to a specific sandbox')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          let result;

          if (isGuid(args.application)) {
            // Handle as application ID
            result = await context.veracodeClient.getStaticFlawInfo(args.application, args.issue_id, args.sandbox_id);
          } else {
            // Handle as application name
            result = await context.veracodeClient.getStaticFlawInfoByName(args.application, args.issue_id, args.sandbox_id);
          }

          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching static flaw info: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    }
  ];
}
