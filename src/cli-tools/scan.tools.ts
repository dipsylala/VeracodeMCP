import { VeracodeClient } from '../veracode-rest-client.js';
import { CLIToolHandler, ToolResponse } from './cli-types.js';

/**
 * Create scan result tools for CLI
 */
export function createScanTools(client: VeracodeClient): CLIToolHandler[] {
  return [
    {
      name: 'get-scan-results',
      handler: async(args: any): Promise<ToolResponse> => {
        if (!args?.app_id) {
          return { success: false, error: 'Missing required argument: app_id' };
        }

        const result = await client.getScanResults(args.app_id, args.scan_type);
        return {
          success: true,
          data: {
            app_id: args.app_id,
            scan_type_filter: args.scan_type,
            count: result.length,
            scans: result.map((scan: any) => ({
              scan_id: scan.scan_id,
              scan_type: scan.scan_type,
              status: scan.status,
              policy_compliance_status: scan.policy_compliance_status,
              created_date: scan.created_date,
              modified_date: scan.modified_date
            }))
          }
        };
      }
    },

    {
      name: 'get-scan-results-by-name',
      handler: async(args: any): Promise<ToolResponse> => {
        if (!args?.name) {
          return { success: false, error: 'Missing required argument: name' };
        }

        // First search for applications with this name
        const searchResults = await client.searchApplications(args.name);
        if (searchResults.length === 0) {
          return { success: false, error: `No application found with name: ${args.name}` };
        }

        // If multiple results, look for exact match first
        let targetApp = searchResults.find((app: any) => app.profile.name.toLowerCase() === args.name.toLowerCase());

        // If no exact match, use the first result but warn about it
        if (!targetApp) {
          targetApp = searchResults[0];
          console.warn(`No exact match found for "${args.name}". Using first result: "${targetApp.profile.name}"`);
        }

        const result = await client.getScanResults(targetApp.guid, args.scan_type);
        return {
          success: true,
          data: {
            application_name: args.name,
            app_id: targetApp.guid,
            scan_type_filter: args.scan_type,
            count: result.length,
            scans: result.map((scan: any) => ({
              scan_id: scan.scan_id,
              scan_type: scan.scan_type,
              status: scan.status,
              policy_compliance_status: scan.policy_compliance_status,
              created_date: scan.created_date,
              modified_date: scan.modified_date
            }))
          }
        };
      }
    }
  ];
}
