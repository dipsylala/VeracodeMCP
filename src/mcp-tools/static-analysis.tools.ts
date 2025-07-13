import { z } from "zod";
import { MCPToolHandler, ToolContext, ToolResponse } from "./mcp-types.js";

// Static analysis specific tools with detailed flaw information
export const staticAnalysisTools: MCPToolHandler[] = [
    {
        name: "get-static-flaw-info-by-id",
        description: "Get detailed static analysis flaw information by application ID and flaw ID. This tool provides comprehensive flaw details including data paths, call stack information, and remediation guidance. Use this tool when you need specific details about a particular flaw identified by its numeric ID within a specific application.",
        schema: {
            app_id: z.string().describe("Application ID (GUID) that contains the flaw"),
            issue_id: z.string().describe("Issue/Flaw ID to get detailed information for"),
            context: z.string().optional().describe("Optional context filter for the flaw information")
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                const result = await context.veracodeClient.getStaticFlawInfo(args.app_id, args.issue_id, args.context);
                return {
                    success: true,
                    data: result
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching static flaw info by ID: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    },

    {
        name: "get-static-flaw-info-by-name",
        description: "Get detailed static analysis flaw information for a specific flaw within an application by name. This tool provides comprehensive flaw details including data paths, call stack information, and remediation guidance. Use this tool when you need detailed static analysis findings for a specific flaw in an application identified by name.",
        schema: {
            name: z.string().describe("Application name that contains the flaw"),
            issue_id: z.string().describe("Issue/Flaw ID to get detailed information for"),
            context: z.string().optional().describe("Optional context filter for the flaw information")
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                const result = await context.veracodeClient.getStaticFlawInfoByName(args.name, args.issue_id, args.context);
                return {
                    success: true,
                    data: result
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching static flaw info by name: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    }
];
