import { VeracodeClient } from "../veracode-rest-client.js";
import { CLIToolHandler, ToolResponse } from "./cli-types.js";

/**
 * Create static analysis tools for CLI
 */
export function createStaticAnalysisTools(client: VeracodeClient): CLIToolHandler[] {
    return [
        {
            name: "get-static-flaw-info",
            handler: async (args: any): Promise<ToolResponse> => {
                if (!args?.app_id || !args?.issue_id) {
                    return { success: false, error: "Missing required arguments: app_id and issue_id" };
                }

                const result = await client.getStaticFlawInfo(args.app_id, args.issue_id, args.context);
                return {
                    success: true,
                    data: result
                };
            }
        },

        {
            name: "get-static-flaw-info-by-name",
            handler: async (args: any): Promise<ToolResponse> => {
                if (!args?.name || !args?.issue_id) {
                    return { success: false, error: "Missing required arguments: name and issue_id" };
                }

                const result = await client.getStaticFlawInfoByName(args.name, args.issue_id, args.context);
                return {
                    success: true,
                    data: result
                };
            }
        }
    ];
}
