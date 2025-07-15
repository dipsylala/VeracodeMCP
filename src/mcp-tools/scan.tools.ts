import { z } from 'zod';
import { MCPToolHandler, ToolContext, ToolResponse } from './mcp-types.js';

// Create scan tools for MCP
export function createScanTools(): MCPToolHandler[] {
  return [
    {
      name: 'get-scan-results',
      description: 'Get comprehensive scan history and results for an application including all scan types (STATIC, DYNAMIC, MANUAL, SCA). Use this to understand scan coverage, track scan progress, review compliance status, and access scan reports. Essential for security program management and audit compliance.',
      schema: {
        app_id: z.string().describe('Application profile ID (GUID like "a1b2c3d4-e5f6-7890-abcd-ef1234567890") to retrieve scan history for. Use get-application-profiles to find the correct ID.')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.scans.getScans(args.app_id);

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
      description: 'Get comprehensive scan history and results for an application by name, including all scan types and compliance status. More convenient than get-scan-results when you know the application name but not the ID. Perfect for reviewing scan coverage, tracking security testing progress, and accessing historical scan data.',
      schema: {
        name: z.string().describe('Application profile name to get scan results for (exact match, e.g., "MyWebApp-Production"). Case-sensitive - use search-application-profiles if unsure of exact name.')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.scans.getScans(args.name);

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

          const scanTypes = [...new Set(formattedScans.map(scan => scan.scan_type))];

          return {
            success: true,
            data: {
              application_name: args.name,
              count: formattedScans.length,
              has_scans: formattedScans.length > 0,
              available_scan_types: scanTypes,
              message: formattedScans.length === 0
                ? 'No scans found for this application. The application may not have been scanned yet, or you may not have permission to view scan results.'
                : `Found ${formattedScans.length} scan(s) of types: ${scanTypes.join(', ')}`,
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
}
