import { z } from 'zod';
import { ToolHandler, ToolContext, ToolResponse } from './tool-types.js';
import { validateAndResolveApplication } from '../utils/application-resolver.js';

// Create sandbox tools for MCP
export function createSandboxTools(): ToolHandler[] {
  return [
    {
      name: 'get-sandboxes',
      description: 'Get all development/testing sandbox environments for a specific application profile. Sandboxes are isolated environments for testing security scans without affecting production results. Use this to discover available development environments, track feature branch scanning, or manage sandbox-specific security testing workflows.',
      schema: z.object({
        app_profile: z.string().describe('Application profile ID (GUID) or exact application name to get sandboxes for'),
        page: z.number().min(0).optional().describe('Page number for pagination (0-based)'),
        size: z.number().min(1).max(500).optional().describe('Number of results per page')
      }),
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          // Validate and resolve application identifier to GUID
          const appResolution = await validateAndResolveApplication(
            args.app_profile, 
            context.veracodeClient
          );

          // Get sandboxes using the resolved GUID
          const sandboxes = await context.veracodeClient.sandboxes.getSandboxes(appResolution.guid, {
            page: args.page,
            size: args.size
          });

          const result = {
            application_id: appResolution.guid,
            application_name: appResolution.details.profile?.name || null,
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

          // Add application details if resolved from name
          if (appResolution.resolvedFromName && appResolution.details.profile) {
            (result as any).application_details = {
              business_criticality: appResolution.details.profile.business_criticality,
              description: appResolution.details.profile.description,
              app_profile_url: appResolution.details.app_profile_url,
              results_url: appResolution.details.results_url,
              teams: appResolution.details.profile.teams?.map((team: any) => ({
                name: team.team_name,
                guid: team.guid,
                team_id: team.team_id
              })) || [],
              policies: appResolution.details.profile.policies?.map((policy: any) => ({
                name: policy.name,
                guid: policy.guid,
                is_default: policy.is_default,
                compliance_status: policy.policy_compliance_status
              })) || []
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
      schema: z.object({
        app_profile: z.string().describe('Application profile ID (GUID) or exact application name to get sandbox summary for')
      }),
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const appResolution = await validateAndResolveApplication(
            args.app_profile, 
            context.veracodeClient
          );

          // Get sandboxes using the resolved GUID
          const sandboxes = await context.veracodeClient.sandboxes.getSandboxes(appResolution.guid);

          const result = {
            application_id: appResolution.guid,
            application_name: appResolution.details.profile?.name || null,
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

          // Add application details if resolved from name
          if (appResolution.resolvedFromName && appResolution.details.profile) {
            (result as any).application_details = {
              business_criticality: appResolution.details.profile.business_criticality,
              description: appResolution.details.profile.description
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
