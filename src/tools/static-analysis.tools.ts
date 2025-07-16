import { z } from 'zod';
import { ToolHandler, ToolContext, ToolResponse } from './tool-types.js';
import { isGuid } from '../utils/validation.js';

// Create static analysis tools for MCP
export function createStaticAnalysisTools(): ToolHandler[] {
  return [
    {
      name: 'get-static-flaw-info',
      description:
        'Get comprehensive static analysis flaw details including data paths, call stack traces, and expert remediation guidance. Use this when you need deep technical information about a specific security vulnerability found during static code analysis. Essential for developers fixing security issues - provides exact source code locations, attack vectors, and detailed remediation steps. Requires the specific flaw ID from scan results.',
      schema: z.object({
        app_profile: z.string().optional().describe('Application profile ID (GUID like "a1b2c3d4-e5f6-7890-abcd-ef1234567890") or application profile name (like "MyWebApp"). Required to identify which application contains the flaw.'),
        application: z.string().optional().describe('⚠️ DEPRECATED: Use app_profile instead. Application ID (GUID) or application name that contains the flaw'),
        issue_id: z.string().describe('Static analysis flaw/issue ID (numeric string like "12345"). Get this from scan results or findings lists. Each flaw has a unique ID within the application.'),
        sandbox_id: z.string().optional().describe('Sandbox/development environment ID (GUID) to get flaw details from a specific environment. Leave empty for production/main branch flaws.')
      }),
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          let result;
          const profileId = args.app_profile || args.application;

          if (!profileId) {
            return {
              success: false,
              error: 'Missing required argument: app_profile (or legacy application parameter)'
            };
          }

          if (isGuid(profileId)) {
            // Handle as application ID
            result = await context.veracodeClient.findings.getStaticFlawInfo(profileId, args.issue_id, args.sandbox_id);
          } else {
            // Handle as application name
            result = await context.veracodeClient.findings.getStaticFlawInfoByName(profileId, args.issue_id, args.sandbox_id);
          }

          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching static flaw info: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    }
  ];
}
