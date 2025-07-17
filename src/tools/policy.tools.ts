import { z } from 'zod';
import { ToolHandler, ToolContext, ToolResponse } from './tool-types.js';

// Create policy tools for MCP
export function createPolicyTools(): ToolHandler[] {
  return [
    {
      name: 'get-policies',
      description: 'Get security policies that define compliance rules and vulnerability thresholds for applications. Policies control what security findings will fail a build or deployment gate. Use this to discover available policies, understand security requirements, or manage compliance configurations across your organization.',
      schema: z.object({
        category: z.string().optional().describe('Filter policies by category'),
        legacy_policy_id: z.number().optional().describe('Filter by legacy policy ID (numeric)'),
        name: z.string().optional().describe('Filter policies by name (partial match)'),
        name_exact: z.string().optional().describe('Filter policies by exact name match'),
        page: z.number().min(0).optional().describe('Page number for pagination (0-based)'),
        public_policy: z.boolean().optional().describe('Filter for public policies only'),
        size: z.number().min(1).max(500).optional().describe('Number of results per page (1-500)'),
        vendor_policy: z.boolean().optional().describe('Filter for vendor policies only')
      }),
      handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const options = {
            category: args.category,
            legacy_policy_id: args.legacy_policy_id,
            name: args.name,
            name_exact: args.name_exact,
            page: args.page,
            public_policy: args.public_policy,
            size: args.size,
            vendor_policy: args.vendor_policy
          };

          // Remove undefined values
          Object.keys(options).forEach(key => {
            if (options[key as keyof typeof options] === undefined) {
              delete options[key as keyof typeof options];
            }
          });

          const result = await context.veracodeClient.policies.getPolicies(Object.keys(options).length > 0 ? options : undefined);
          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching policies: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    },

    {
      name: 'get-policy',
      description: 'Get detailed information about a specific security policy including its rules, thresholds, and compliance criteria. Use this to understand what security requirements an application must meet, review policy configurations, or troubleshoot compliance failures. Essential for security teams managing policy enforcement.',
      schema: z.object({
        policy_guid: z.string().describe('Policy GUID to retrieve details for')
      }),
      handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.policies.getPolicy(args.policy_guid);
          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching policy: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    },

    {
      name: 'get-policy-versions',
      description: 'Get all historical versions of a security policy to track changes, understand evolution, or access previous configurations. Useful for policy auditing, rollback planning, or understanding how security requirements have changed over time.',
      schema: z.object({
        policy_guid: z.string().describe('Policy GUID to get versions for'),
        page: z.number().min(0).optional().describe('Page number for pagination (0-based)'),
        size: z.number().min(1).max(500).optional().describe('Number of results per page (1-500)')
      }),
      handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.policies.getPolicyVersions(
            args.policy_guid,
            args.page,
            args.size
          );
          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching policy versions: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    },

    {
      name: 'get-policy-version',
      description: 'Get a specific version of a policy',
      schema: z.object({
        policy_guid: z.string().describe('Policy GUID to get specific version for'),
        version: z.number().describe('Version number to retrieve')
      }),
      handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.policies.getPolicyVersion(
            args.policy_guid,
            args.version
          );
          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching policy version: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    },

    {
      name: 'get-policy-settings',
      description: 'Get policy settings (default policies for business criticality levels)',
      schema: z.object({}),
      handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.policies.getPolicySettings();
          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching policy settings: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    },

    {
      name: 'get-sca-licenses',
      description: 'Get a list of component licenses for SCA policies',
      schema: z.object({
        page: z.number().min(0).optional().describe('Page number for pagination (0-based)'),
        size: z.number().min(1).max(500).optional().describe('Number of results per page (1-500)'),
        sort: z.string().optional().describe('Sort order for results')
      }),
      handler: async(args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.policies.getScaLicenses(
            args.page,
            args.size,
            args.sort
          );
          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching SCA licenses: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    }
  ];
}
