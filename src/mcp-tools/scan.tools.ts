import { z } from 'zod';
import { MCPToolHandler, ToolContext, ToolResponse } from './mcp-types.js';

// Scan management and results tools
export const scanTools: MCPToolHandler[] = [
  {
    name: 'get-scan-results',
    description: 'Get scan results for an application by ID',
    schema: {
      app_id: z.string().describe('Application ID (GUID) to get scan results for')
    },
    handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
      try {
        const result = await context.veracodeClient.getScanResults(args.app_id);

        // Format scan results with essential fields
        const formattedScans = result.map((scan: any) => ({
          scan_id: scan.scan_id,
          scan_type: scan.scan_type,
          status: scan.status,
          created_date: scan.created_date,
          modified_date: scan.modified_date,
          policy_compliance_status: scan.policy_compliance_status,
          scan_url: scan.scan_url,
          app_profile_url: scan.app_profile_url,
          results_url: scan.results_url
        }));

        return {
          success: true,
          data: {
            count: formattedScans.length,
            scans: formattedScans
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Error fetching scan results: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },

  {
    name: 'get-scan-results-by-name',
    description: 'Get scan results for an application by name',
    schema: {
      name: z.string().describe('Application name to get scan results for')
    },
    handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
      try {
        const result = await context.veracodeClient.getScanResultsByName(args.name);

        // Format scan results with essential fields
        const formattedScans = result.map((scan: any) => ({
          scan_id: scan.scan_id,
          scan_type: scan.scan_type,
          status: scan.status,
          created_date: scan.created_date,
          modified_date: scan.modified_date,
          policy_compliance_status: scan.policy_compliance_status,
          scan_url: scan.scan_url,
          app_profile_url: scan.app_profile_url,
          results_url: scan.results_url
        }));

        return {
          success: true,
          data: {
            application_name: args.name,
            count: formattedScans.length,
            scans: formattedScans
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Error fetching scan results by name: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }
];
