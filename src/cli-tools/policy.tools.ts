import { CLIToolHandler, ToolResponse, CLIToolContext } from './cli-types.js';

/**
 * Create policy tools for CLI
 */
export function createPolicyTools(): CLIToolHandler[] {
  return [
    {
      name: 'get-policy-compliance',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        if (!args?.app_id) {
          return { success: false, error: 'Missing required argument: app_id' };
        }

        const result = await context.veracodeClient.getPolicyCompliance(args.app_id);
        return {
          success: true,
          data: result
        };
      }
    },

    {
      name: 'get-policy-compliance-by-name',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        if (!args?.name) {
          return { success: false, error: 'Missing required argument: name' };
        }

        const result = await context.veracodeClient.getPolicyComplianceByName(args.name);
        return {
          success: true,
          data: result
        };
      }
    }
  ];
}
