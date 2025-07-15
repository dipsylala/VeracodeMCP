import { CLIToolHandler, ToolResponse, CLIToolContext } from './cli-types.js';

// Create policy tools for CLI
export function createPolicyTools(): CLIToolHandler[] {
  return [
    {
      name: 'get-policies',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        const options = {
          category: args?.category,
          legacy_policy_id: args?.legacy_policy_id,
          name: args?.name,
          name_exact: args?.name_exact,
          page: args?.page,
          public_policy: args?.public_policy,
          size: args?.size,
          vendor_policy: args?.vendor_policy
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
      }
    },

    {
      name: 'get-policy',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        if (!args?.policy_guid) {
          return { success: false, error: 'Missing required argument: policy_guid' };
        }

        const result = await context.veracodeClient.policies.getPolicy(args.policy_guid);
        return {
          success: true,
          data: result
        };
      }
    },

    {
      name: 'get-policy-versions',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        if (!args?.policy_guid) {
          return { success: false, error: 'Missing required argument: policy_guid' };
        }

        const result = await context.veracodeClient.policies.getPolicyVersions(
          args.policy_guid,
          args.page,
          args.size
        );
        return {
          success: true,
          data: result
        };
      }
    },

    {
      name: 'get-policy-version',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        if (!args?.policy_guid) {
          return { success: false, error: 'Missing required argument: policy_guid' };
        }
        if (!args?.version) {
          return { success: false, error: 'Missing required argument: version' };
        }

        const result = await context.veracodeClient.policies.getPolicyVersion(
          args.policy_guid,
          args.version
        );
        return {
          success: true,
          data: result
        };
      }
    },

    {
      name: 'get-policy-settings',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        const result = await context.veracodeClient.policies.getPolicySettings();
        return {
          success: true,
          data: result
        };
      }
    },

    {
      name: 'get-sca-licenses',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        const result = await context.veracodeClient.policies.getScaLicenses(
          args?.page,
          args?.size,
          args?.sort
        );
        return {
          success: true,
          data: result
        };
      }
    }
  ];
}
