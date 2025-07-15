import { z } from 'zod';
import { MCPToolHandler, ToolContext, ToolResponse } from './mcp-types.js';
import { isGuid } from '../utils/validation.js';

// Create sandbox tools for MCP
export function createSandboxTools(): MCPToolHandler[] {
  return [
    {
      name: 'get-sandboxes',
      description: 'Get all sandboxes for a specific application. Accepts either application ID (GUID) or application name.',
      schema: {
        application: z.string().describe('Application ID (GUID) or application name to get sandboxes for'),
        page: z.number().optional().describe('Page number (defaults to 0)'),
        size: z.number().optional().describe('Page size, up to 500 (default is 50)')
      },
      handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          let result;

          if (isGuid(args.application)) {
            // Handle as application ID
            const sandboxes = await context.veracodeClient.getSandboxes(args.application, {
              page: args.page,
              size: args.size
            });

            result = {
              application_id: args.application,
              application_name: null, // Not available when using ID directly
              sandbox_count: sandboxes.length,
              sandboxes: sandboxes.map((sandbox: any) => ({
                name: sandbox.name,
                guid: sandbox.guid,
                id: sandbox.id,
                application_guid: sandbox.application_guid,
                organization_id: sandbox.organization_id,
                owner_username: sandbox.owner_username,
                auto_recreate: sandbox.auto_recreate,
                created: sandbox.created,
                modified: sandbox.modified,
                custom_fields: sandbox.custom_fields || []
              }))
            };
          } else {
            // Handle as application name
            const sandboxResult = await context.veracodeClient.getSandboxesByName(args.application, {
              page: args.page,
              size: args.size
            });

            result = {
              application_id: sandboxResult.application.guid,
              application_name: sandboxResult.application.profile.name,
              application_details: {
                business_criticality: sandboxResult.application.profile.business_criticality,
                description: sandboxResult.application.profile.description,
                app_profile_url: sandboxResult.application.app_profile_url,
                results_url: sandboxResult.application.results_url,
                teams: sandboxResult.application.profile.teams?.map((team: any) => ({
                  name: team.team_name,
                  guid: team.guid,
                  team_id: team.team_id
                })) || [],
                policies: sandboxResult.application.profile.policies?.map((policy: any) => ({
                  name: policy.name,
                  guid: policy.guid,
                  is_default: policy.is_default,
                  compliance_status: policy.policy_compliance_status
                })) || []
              },
              sandbox_count: sandboxResult.sandboxes.length,
              sandboxes: sandboxResult.sandboxes.map((sandbox: any) => ({
                name: sandbox.name,
                guid: sandbox.guid,
                id: sandbox.id,
                application_guid: sandbox.application_guid,
                organization_id: sandbox.organization_id,
                owner_username: sandbox.owner_username,
                auto_recreate: sandbox.auto_recreate,
                created: sandbox.created,
                modified: sandbox.modified,
                custom_fields: sandbox.custom_fields || []
              }))
            };
          }

          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching sandboxes: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    },

    {
      name: 'get-sandbox-summary',
      description: 'Get a summary of sandbox information for an application. Accepts either application ID (GUID) or application name.',
      schema: {
        application: z.string().describe('Application ID (GUID) or application name to get sandbox summary for')
      },
      handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          let result;

          if (isGuid(args.application)) {
            // Handle as application ID
            const sandboxes = await context.veracodeClient.getSandboxes(args.application);

            result = {
              application_id: args.application,
              application_name: null, // Not available when using ID directly
              sandbox_summary: {
                total_count: sandboxes.length,
                sandboxes: sandboxes.map((sandbox: any) => ({
                  name: sandbox.name,
                  guid: sandbox.guid,
                  owner: sandbox.owner_username,
                  auto_recreate: sandbox.auto_recreate,
                  created: sandbox.created,
                  modified: sandbox.modified
                }))
              }
            };
          } else {
            // Handle as application name
            const sandboxResult = await context.veracodeClient.getSandboxesByName(args.application);

            result = {
              application_id: sandboxResult.application.guid,
              application_name: sandboxResult.application.profile.name,
              application_details: {
                business_criticality: sandboxResult.application.profile.business_criticality,
                description: sandboxResult.application.profile.description
              },
              sandbox_summary: {
                total_count: sandboxResult.sandboxes.length,
                sandboxes: sandboxResult.sandboxes.map((sandbox: any) => ({
                  name: sandbox.name,
                  guid: sandbox.guid,
                  owner: sandbox.owner_username,
                  auto_recreate: sandbox.auto_recreate,
                  created: sandbox.created,
                  modified: sandbox.modified
                }))
              }
            };
          }

          if (result.sandbox_summary.total_count === 0) {
            (result.sandbox_summary as any).message = 'No sandboxes found for this application';
          }

          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching sandbox summary: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    }
  ];
}
