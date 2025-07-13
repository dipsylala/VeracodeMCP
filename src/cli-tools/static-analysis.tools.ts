import { CLIToolHandler, ToolResponse, CLIToolContext } from './cli-types.js';

/**
 * Create static analysis tools for CLI
 */
export function createStaticAnalysisTools(): CLIToolHandler[] {
  return [
    {
      name: 'get-static-flaw-info',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        if (!args?.app_id || !args?.issue_id) {
          return { success: false, error: 'Missing required arguments: app_id and issue_id' };
        }

        const result = await context.veracodeClient.getStaticFlawInfo(args.app_id, args.issue_id, args.context);
        return {
          success: true,
          data: result
        };
      }
    },

    {
      name: 'get-static-flaw-info-by-name',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        if (!args?.name || !args?.issue_id) {
          return { success: false, error: 'Missing required arguments: name and issue_id' };
        }

        const result = await context.veracodeClient.getStaticFlawInfoByName(args.name, args.issue_id, args.context);
        return {
          success: true,
          data: result
        };
      }
    }
  ];
}
