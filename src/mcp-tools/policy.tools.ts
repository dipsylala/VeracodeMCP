import { z } from 'zod';
import { MCPToolHandler, ToolContext, ToolResponse } from './mcp-types.js';

/**
 * Create policy tools for MCP
 */
export function createPolicyTools(): MCPToolHandler[] {
  return [
    {
      name: 'get-policies',
      description: 'Get a list of policies with optional filtering',
      schema: {
        category: z.enum(['APPLICATION', 'COMPONENT']).optional().describe('Filter by policy category'),
        legacy_policy_id: z.number().optional().describe('Filter by legacy policy ID from the Veracode Platform'),
        name: z.string().optional().describe('Filter by policy name (partial match)'),
        name_exact: z.boolean().optional().describe('Use exact name matching instead of partial match'),
        page: z.number().optional().describe('Page number (defaults to 0)'),
        public_policy: z.boolean().optional().describe('Include/exclude public Veracode policies (defaults to true)'),
        size: z.number().min(1).max(500).optional().describe('Page size (1-500, defaults to 50)'),
        vendor_policy: z.boolean().optional().describe('Filter by vendor policy flag')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
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

          const result = await context.veracodeClient.getPolicies(Object.keys(options).length > 0 ? options : undefined);
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
      description: 'Get the latest version of a specific policy by GUID',
      schema: {
        policy_guid: z.string().describe('The unique identifier (GUID) of the policy')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.getPolicy(args.policy_guid);
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
      description: 'Get all versions of a specific policy',
      schema: {
        policy_guid: z.string().describe('The unique identifier (GUID) of the policy'),
        page: z.number().optional().describe('Page number (defaults to 0)'),
        size: z.number().min(1).max(500).optional().describe('Page size (1-500, defaults to 50)')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.getPolicyVersions(
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
      schema: {
        policy_guid: z.string().describe('The unique identifier (GUID) of the policy'),
        version: z.number().describe('The specific version number of the policy')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.getPolicyVersion(
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
      schema: {},
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.getPolicySettings();
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
      schema: {
        page: z.number().optional().describe('Page number'),
        size: z.number().optional().describe('Page size'),
        sort: z.string().optional().describe('Sort order')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.getScaLicenses(
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
