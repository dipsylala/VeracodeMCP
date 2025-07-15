import { CLIToolHandler, ToolResponse, CLIToolContext } from './cli-types.js';
import { logger } from '../utils/logger.js';

// Create findings tools for CLI
export function createFindingsTools(): CLIToolHandler[] {
  return [
    {
      name: 'get-findings-by-name',
      handler: async(args: any, context: CLIToolContext): Promise<ToolResponse> => {
        const startTime = Date.now();
        logger.debug('Starting findings search execution', 'FINDINGS_CLI', { args });

        try {
          if (!args?.name) {
            return { success: false, error: 'Missing required argument: name' };
          }

          const findings = await context.veracodeClient.getFindingsByName(args.name, {
            scanType: args.scan_type,
            severityGte: args.severity_gte,
            cvssGte: args.cvss_gte,
            policyViolation: args.only_policy_violations,
            newFindingsOnly: args.only_new_findings,
            size: args.max_results ? Math.min(args.max_results, 500) : 500
          });

          // Get application details for metadata
          const searchResults = await context.veracodeClient.searchApplications(args.name);
          if (searchResults.length === 0) {
            return {
              success: false,
              error: `No application found with name: ${args.name}`
            };
          }

          let targetApp = searchResults.find((app: any) => app.profile.name.toLowerCase() === args.name.toLowerCase());
          if (!targetApp) {
            targetApp = searchResults[0];
          }

          // Map findings based on scan type
          const mappedFindings = findings.map((finding: any) => {
            const baseFinding = {
              issue_id: finding.issue_id,
              scan_type: finding.scan_type,
              finding_status: finding.finding_status?.display_text || finding.finding_status?.name,
              severity: finding.finding_details?.severity,
              policy_rules_status: finding.violates_policy,
              first_found_date: finding.finding_status?.first_found_date,
              last_seen_date: finding.finding_status?.last_seen_date
            };

            switch (finding.scan_type) {
            case 'STATIC':
              return {
                ...baseFinding,
                flaw_id: finding.finding_details?.finding_id?.toString(),
                cwe_id: finding.finding_details?.cwe?.id,
                cwe_name: finding.finding_details?.cwe?.name,
                module: finding.finding_details?.module,
                function_name: finding.finding_details?.procedure,
                relative_location: finding.finding_details?.relative_location,
                line_number: finding.finding_details?.file_line_number,
                description: finding.finding_details?.description || finding.description
              };
            case 'SCA':
              return {
                ...baseFinding,
                component_id: finding.finding_details?.component_id,
                component_filename: finding.finding_details?.component_filename,
                component_version: finding.finding_details?.version,
                cve_id: finding.finding_details?.cve?.name,
                cvss: finding.finding_details?.cve?.cvss,
                exploitable: finding.finding_details?.cve?.exploitability?.exploit_observed,
                description: finding.finding_details?.description || finding.description
              };
            default:
              return baseFinding;
            }
          });

          const executionTime = Date.now() - startTime;

          return {
            success: true,
            data: {
              application: {
                name: targetApp.profile.name,
                id: targetApp.guid,
                business_criticality: targetApp.profile.business_criticality
              },
              findings: mappedFindings,
              filters_applied: {
                scan_type: args.scan_type,
                severity_gte: args.severity_gte,
                cvss_gte: args.cvss_gte,
                only_policy_violations: args.only_policy_violations,
                only_new_findings: args.only_new_findings,
                max_results: args.max_results
              },
              metadata: {
                total_findings: mappedFindings.length,
                analysis_timestamp: new Date().toISOString(),
                execution_time_ms: executionTime
              }
            }
          };
        } catch (error) {
          const executionTime = Date.now() - startTime;
          logger.error('Findings CLI tool execution failed', 'FINDINGS_CLI', {
            args,
            executionTime,
            error
          });
          return {
            success: false,
            error: `Error finding findings by name: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    }
  ];
}
