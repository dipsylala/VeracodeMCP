import { z } from 'zod';
import { ToolHandler, ToolContext, ToolResponse } from './tool-types.js';

// Create scan tools for MCP
export function createScanTools(): ToolHandler[] {
  return [
    {
      name: 'get-scan-results',
      description: 'Get comprehensive scan history and results for an application including all scan types (STATIC, DYNAMIC, MANUAL, SCA). Auto-detects whether input is an application name or GUID. Use this to understand scan coverage, track scan progress, review compliance status, and access scan reports. Essential for security program management and audit compliance.',
      schema: z.object({
        application: z.string().describe('Application GUID or name to get scan results for'),
        sandbox_identifier: z.string().optional().describe('Sandbox GUID or name to get scans from specific sandbox'),
        scan_type: z.enum(['STATIC', 'DYNAMIC', 'MANUAL', 'SCA']).optional().describe('Filter scans by type')
      }),
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          let sandboxId: string | undefined;
          let sandboxContext = 'policy';

          // If sandbox identifier is provided, resolve it to a GUID
          if (args.sandbox_identifier) {
            // Check if it's already a GUID (simple check for GUID format)
            const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.sandbox_identifier);

            if (isGuid) {
              sandboxId = args.sandbox_identifier;
              sandboxContext = `sandbox (${args.sandbox_identifier})`;
            } else {
              // It's a sandbox name, use getScansBySandboxName to resolve it
              try {
                const sandboxResult = await context.veracodeClient.scans.getScansBySandboxName(args.application, args.sandbox_identifier, args.scan_type);
                sandboxId = sandboxResult.sandbox.guid;
                sandboxContext = `sandbox (${sandboxResult.sandbox.name})`;
              } catch (error) {
                return {
                  success: false,
                  error: `Sandbox "${args.sandbox_identifier}" not found for application "${args.application}": ${error instanceof Error ? error.message : String(error)}`
                };
              }
            }
          }

          const result = await context.veracodeClient.scans.getScans(args.application, args.scan_type, sandboxId);

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
              application_identifier: args.identifier,
              context: sandboxContext,
              sandbox_identifier: args.sandbox_identifier,
              scan_type_filter: args.scan_type || 'all',
              count: formattedScans.length,
              has_scans: formattedScans.length > 0,
              available_scan_types: scanTypes,
              message: formattedScans.length === 0
                ? `No ${args.scan_type || ''} scans found for this application in ${sandboxContext} context. The application may not have been scanned yet, or you may not have permission to view scan results.`
                : `Found ${formattedScans.length} ${args.scan_type || ''} scan(s) of types: ${scanTypes.join(', ')} in ${sandboxContext} context`,
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
      name: 'get-sandbox-scans',
      description: 'Get all scans across all sandboxes for an application. Perfect for understanding sandbox testing coverage, comparing development vs staging environments, and tracking scan progress across different testing phases.',
      schema: z.object({}),
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.scans.getSandboxScans(args.identifier, args.scan_type);

          return {
            success: true,
            data: {
              application: result.application,
              total_sandbox_scans: result.totalSandboxScans,
              sandbox_count: result.sandboxes.length,
              scan_type_filter: args.scan_type || 'all',
              sandboxes: result.sandboxes.map(sb => ({
                sandbox_name: sb.sandbox.name,
                sandbox_id: sb.sandbox.guid,
                scan_count: sb.scanCount,
                scan_types: sb.scanTypes,
                scans: sb.scans.map((scan: any) => ({
                  scan_id: scan.scan_id,
                  scan_type: scan.scan_type,
                  status: scan.status,
                  created_date: scan.created_date,
                  modified_date: scan.modified_date
                }))
              }))
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching sandbox scans: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    },

    {
      name: 'get-scans-by-sandbox',
      description: 'Get scans from a specific sandbox by sandbox name. Useful when you want to focus on a particular development environment, staging area, or testing context.',
      schema: z.object({}),
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.scans.getScansBySandboxName(args.identifier, args.sandbox_name, args.scan_type);

          const formattedScans = result.scans.map((scan: any) => ({
            scan_id: scan.scan_id,
            scan_type: scan.scan_type,
            status: scan.status,
            created_date: scan.created_date,
            modified_date: scan.modified_date,
            policy_compliance_status: scan.policy_compliance_status
          }));

          return {
            success: true,
            data: {
              application: result.application,
              sandbox: {
                name: result.sandbox.name,
                id: result.sandbox.guid
              },
              scan_count: result.scanCount,
              scan_types: result.scanTypes,
              scan_type_filter: args.scan_type || 'all',
              scans: formattedScans
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching scans by sandbox: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    },

    {
      name: 'compare-policy-vs-sandbox-scans',
      description: 'Compare scan coverage between policy (main branch) and all sandboxes. Essential for understanding testing completeness, identifying coverage gaps, and ensuring proper scan distribution across environments.',
      schema: z.object({}),
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.scans.comparePolicyVsSandboxScans(args.identifier, args.scan_type);

          return {
            success: true,
            data: {
              application: result.application,
              scan_type_filter: args.scan_type || 'all',
              policy_scans: {
                count: result.policyScans.scanCount,
                types: result.policyScans.scanTypes
              },
              sandbox_scans: {
                total_count: result.sandboxScans.totalSandboxScans,
                sandbox_count: result.sandboxScans.sandboxes.length,
                sandboxes: result.sandboxScans.sandboxes.map(sb => ({
                  name: sb.sandbox.name,
                  scan_count: sb.scanCount,
                  types: sb.scanTypes
                }))
              },
              summary: result.summary,
              analysis: {
                policy_only_types: result.summary.policyOnlyTypes,
                sandbox_only_types: result.summary.sandboxOnlyTypes,
                common_types: result.summary.commonTypes,
                coverage_assessment: result.summary.commonTypes.length > 0
                  ? 'Good coverage - scans exist in both policy and sandbox contexts'
                  : 'Limited coverage - consider running similar scan types across environments'
              }
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error comparing policy vs sandbox scans: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    }
  ];
}
