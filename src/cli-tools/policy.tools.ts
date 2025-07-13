import { VeracodeClient } from '../veracode-rest-client.js';
import { CLIToolHandler, ToolResponse } from './cli-types.js';

/**
 * Create policy compliance tools for CLI
 */
export function createPolicyTools(client: VeracodeClient): CLIToolHandler[] {
  return [
    {
      name: 'get-policy-compliance',
      handler: async(args: any): Promise<ToolResponse> => {
        if (!args?.app_id) {
          return { success: false, error: 'Missing required argument: app_id' };
        }

        const result = await client.getPolicyCompliance(args.app_id);
        return {
          success: true,
          data: result
        };
      }
    }
  ];
}
