import { z } from "zod";
import { ToolHandler, ToolContext, ToolResponse } from "../types/tool.types.js";

// Policy compliance and management tools
export const policyTools: ToolHandler[] = [
    {
        name: "get-policy-compliance",
        description: "Get policy compliance status for an application",
        schema: {
            app_id: z.string().describe("Application ID (GUID) to check policy compliance for"),
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                const result = await context.veracodeClient.getPolicyCompliance(args.app_id);
                return {
                    success: true,
                    data: result
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching policy compliance: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    },

    {
        name: "get-policy-compliance-by-name",
        description: "Get policy compliance status for an application by name",
        schema: {
            name: z.string().describe("Application name to check policy compliance for"),
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                const result = await context.veracodeClient.getPolicyComplianceByName(args.name);
                return {
                    success: true,
                    data: result
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching policy compliance by name: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    }
];
