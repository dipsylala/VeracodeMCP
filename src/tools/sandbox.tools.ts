import { z } from 'zod';
import { ToolHandler, ToolContext, ToolResponse } from './tool-types.js';
import { isGuid } from '../utils/validation.js';

// Create sandbox tools for MCP
export function createSandboxTools(): ToolHandler[] {
  return [
    {
      name: 'get-sandboxes',
      description: 'Get all development/testing sandbox environments for a specific application profile. Sandboxes are isolated environments for testing security scans without affecting production results. Use this to discover available development environments, track feature branch scanning, or manage sandbox-specific security testing workflows.',
      schema: {
        app_profile: z.string().optional().describe('Application profile ID (GUID like "a1b2c3d4-e5f6-7890-abcd-ef1234567890") or application profile name (like "MyWebApp"). Required to identify which application\'s sandboxes to retrieve.'),
        application: z.string().optional().describe('⚠️ DEPRECATED: Use app_profile instead. Application ID (GUID) or application name to get sandboxes for'),
        page: z.number().optional().describe('Page number for pagination (starts at 0). Most applications have few sandboxes, so default page usually sufficient.'),
        size: z.number().optional().describe('Number of sandboxes per page, maximum 500 (default 50). Use larger values if you have many development environments.')
      },
      handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          let result;
          const profileId = args.app_profile || args.application;

          if (!profileId) {
            return {
              success: false,
              error: 'Missing required argument: app_profile (or legacy application parameter)'
            };
          }

          if (isGuid(profileId)) {
            // Handle as application ID
            const sandboxes = await context.veracodeClient.sandboxes.getSandboxes(profileId, {
              page: args.page,
              size: args.size
            });

            result = {
              application_id: profileId,
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
            const sandboxResult = await context.veracodeClient.sandboxes.getSandboxesByName(profileId, {
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
      description: 'Get a concise overview of sandbox environments for an application, including counts, ownership, and activity status. Perfect for quick assessment of development environment security testing coverage. Use this to understand how many sandbox environments exist, who owns them, and their current status without detailed information.',
      schema: {
        app_profile: z.string().optional().describe('Application profile ID (GUID like "a1b2c3d4-e5f6-7890-abcd-ef1234567890") or application profile name (like "MyWebApp"). Required to identify which application\'s sandbox summary to retrieve.'),
        application: z.string().optional().describe('⚠️ DEPRECATED: Use app_profile instead. Application ID (GUID) or application name to get sandbox summary for')
      },
      handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          let result;
          const profileId = args.app_profile || args.application;

          if (!profileId) {
            return {
              success: false,
              error: 'Missing required argument: app_profile (or legacy application parameter)'
            };
          }

          if (isGuid(profileId)) {
            // Handle as application ID
            const sandboxes = await context.veracodeClient.sandboxes.getSandboxes(profileId);

            result = {
              application_id: profileId,
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
            const sandboxResult = await context.veracodeClient.sandboxes.getSandboxesByName(profileId);

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
