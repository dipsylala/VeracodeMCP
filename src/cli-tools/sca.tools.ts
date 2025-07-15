import { CLIToolHandler, ToolResponse, CLIToolContext } from './cli-types.js';
import { logger } from '../utils/logger.js';

// Create SCA tools for CLI
export function createSCATools(): CLIToolHandler[] {
  return [
    {
      name: 'get-sca-results-by-name',
      handler: async (args: any, context: CLIToolContext): Promise<ToolResponse> => {
        const startTime = Date.now();
        logger.debug('Starting SCA analysis execution', 'SCA_CLI', { args });

        try {
          if (!args?.name) {
            return { success: false, error: 'Missing required argument: name' };
          }

          logger.debug('Executing SCA analysis', 'SCA_CLI', {
            name: args.name,
            severityGte: args.severity_gte,
            cvssGte: args.cvss_gte,
            size: args.max_results ? Math.min(args.max_results, 500) : 500
          });

          const findings = await context.veracodeClient.findings.getFindingsByName(args.name, {
            scanType: 'SCA',
            severityGte: args.severity_gte,
            cvssGte: args.cvss_gte,
            policyViolation: args.only_policy_violations,
            newFindingsOnly: args.only_new_findings,
            size: args.max_results ? Math.min(args.max_results, 500) : 500
          });

          logger.debug('SCA findings retrieved', 'SCA_CLI', {
            name: args.name,
            findingsCount: findings.length,
            hasFindings: findings.length > 0
          });

          let filteredFindings = findings;
          if (args.only_exploitable) {
            const beforeFilter = filteredFindings.length;
            filteredFindings = filteredFindings.filter((finding: any) => {
              const exploitability = finding.finding_details?.cve?.exploitability;
              return exploitability?.exploit_observed === true;
            });
            logger.debug('Applied exploitable filter', 'SCA_CLI', {
              beforeFilter,
              afterFilter: filteredFindings.length,
              removed: beforeFilter - filteredFindings.length
            });
          }

          // Get application details for metadata
          logger.debug('Searching for application details', 'SCA_CLI', { name: args.name });
          const searchResults = await context.veracodeClient.applications.searchApplications(args.name);
          if (searchResults.length === 0) {
            logger.warn('No application found for SCA results', 'SCA_CLI', { name: args.name });
            return {
              success: false,
              error: `No application found with name: ${args.name}`
            };
          }

          let targetApp = searchResults.find((app: any) => app.profile.name.toLowerCase() === args.name.toLowerCase());
          if (!targetApp) {
            targetApp = searchResults[0];
            logger.debug('Using first search result as no exact match found', 'SCA_CLI', {
              searchName: args.name,
              foundName: targetApp.profile.name
            });
          }

          // Create analysis summary
          logger.debug('Creating analysis summary', 'SCA_CLI', { findingsCount: filteredFindings.length });
          const analysis = {
            totalFindings: filteredFindings.length,
            exploitableFindings: filteredFindings.filter(
              (f: any) => f.finding_details?.cve?.exploitability?.exploit_observed
            ).length,
            highRiskComponents: filteredFindings.filter((f: any) => f.finding_details?.severity >= 4).length,
            severityBreakdown: calculateSeverityBreakdown(filteredFindings),
            topVulnerabilities: getTopVulnerabilities(filteredFindings)
          };

          const executionTime = Date.now() - startTime;
          logger.debug('SCA analysis completed', 'SCA_CLI', {
            appName: targetApp.profile.name,
            totalFindings: analysis.totalFindings,
            exploitableFindings: analysis.exploitableFindings,
            highRiskComponents: analysis.highRiskComponents,
            executionTime
          });

          return {
            success: true,
            data: {
              application: {
                name: targetApp.profile.name,
                id: targetApp.guid,
                business_criticality: targetApp.profile.business_criticality,
                app_profile_url: targetApp.app_profile_url,
                results_url: targetApp.results_url
              },
              analysis,
              detailed_findings: filteredFindings,
              filters_applied: {
                scan_type: 'SCA',
                severity_gte: args.severity_gte,
                cvss_gte: args.cvss_gte,
                only_policy_violations: args.only_policy_violations,
                only_new_findings: args.only_new_findings,
                only_exploitable: args.only_exploitable,
                max_results: args.max_results
              },
              metadata: {
                total_findings_analyzed: filteredFindings.length,
                analysis_timestamp: new Date().toISOString(),
                execution_time_ms: executionTime
              }
            }
          };
        } catch (error) {
          const executionTime = Date.now() - startTime;
          logger.error('SCA CLI tool execution failed', 'SCA_CLI', {
            args,
            executionTime,
            error
          });
          return {
            success: false,
            error: `Error fetching SCA results by name: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    }
  ];
}

function calculateSeverityBreakdown(findings: any[]): Record<string, number> {
  return findings.reduce((acc: Record<string, number>, finding: any) => {
    const severity = finding.finding_details?.severity || 0;
    const label =
      severity === 5
        ? 'Very High'
        : severity === 4
          ? 'High'
          : severity === 3
            ? 'Medium'
            : severity === 2
              ? 'Low'
              : 'Very Low';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function getTopVulnerabilities(findings: any[]): any[] {
  return findings
    .filter((f: any) => f.finding_details?.cve?.cvss)
    .map((f: any) => ({
      unique_id:
        f.issue_id ||
        f.finding_details?.component_filename ||
        f.finding_details?.cve?.name ||
        f.finding_details?.component_id ||
        'unknown',
      cve: f.finding_details.cve.name,
      cvss: f.finding_details.cve.cvss,
      severity: f.finding_details.cve.severity,
      component: f.finding_details.component_filename,
      component_version: f.finding_details.version,
      component_id: f.finding_details?.component_id,
      product_id: f.finding_details?.product_id,
      language: f.finding_details?.language,
      component_paths: f.finding_details?.['component_path(s)'] || f.finding_details?.component_paths,
      exploitable: f.finding_details.cve.exploitability?.exploit_observed || false
    }))
    .sort((a: any, b: any) => b.cvss - a.cvss)
    .slice(0, 10);
}
