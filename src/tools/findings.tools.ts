import { z } from 'zod';
import { ToolHandler, ToolContext, ToolResponse } from './tool-types.js';
import { validateAndResolveApplication } from '../utils/application-resolver.js';
import { isGuid } from '../utils/validation.js';

// Helper function to convert numeric severity to text
function severityToText(severity: number): string {
  switch (severity) {
    case 5: return 'Very High';
    case 4: return 'High';
    case 3: return 'Medium';
    case 2: return 'Low';
    case 1: return 'Very Low';
    case 0: return 'Informational';
    default: return 'Unknown';
  }
}

// Schema for the unified get-findings tool
const GetFindingsSchema = z.object({
  app_profile: z.string().describe('Application Profile GUID or name to get findings for'),
  sandbox: z.string().optional().describe('Sandbox GUID or name to get findings from. If not specified, returns findings from policy scan (production). Use this to get findings from development/testing sandbox environments'),
  scan_type: z.enum(['STATIC', 'DYNAMIC', 'SCA', 'MANUAL']).optional().describe('Type of scan to filter findings by. If not specified, returns all finding types'),
  severity: z.array(z.enum(['Very High', 'High', 'Medium', 'Low', 'Very Low', 'Informational'])).optional().describe('Filter findings by severity levels. Example: ["Very High", "High"] for critical findings only'),
  status: z.array(z.enum(['NEW', 'OPEN', 'FIXED', 'CANNOT_REPRODUCE', 'ACCEPTED', 'FALSE_POSITIVE', 'MITIGATED'])).optional().describe('Filter findings by remediation status. Example: ["NEW", "OPEN"] for unresolved findings'),
  cwe_ids: z.array(z.string()).optional().describe('Filter findings by specific CWE IDs. Example: ["79", "89"] for XSS and SQL injection'),
  page: z.number().min(0).optional().describe('Page number for pagination (0-based). Use for large result sets. Default is 0'),
  size: z.number().min(1).max(500).optional().describe('Number of findings per page (1-500). Default is 100. Use smaller values for faster responses'),
  include_details: z.boolean().optional().describe('Include detailed finding information (remediation advice, code context). Default is true'),
  operation_mode: z.enum(['basic_overview', 'advanced_filtering', 'single_page']).optional().describe('Controls response detail level: basic_overview=summary only, advanced_filtering=filtered results with metadata, single_page=specific page of results')
});

type GetFindingsParams = z.infer<typeof GetFindingsSchema>;

// Helper function to determine operation mode based on provided parameters
function determineOperationMode(params: GetFindingsParams): 'basic_overview' | 'filtered' {
  // If explicitly specified as basic_overview, use that
  if (params.operation_mode === 'basic_overview') {
    return 'basic_overview';
  }

  // If any filtering parameters are specified, or page/size specified, use filtered mode
  if (params.scan_type || params.severity || params.status || params.cwe_ids ||
    params.page !== undefined || params.size !== undefined) {
    return 'filtered';
  }

  // Default to basic overview
  return 'basic_overview';
}

// Helper function to build filter parameters for the API
function buildFilterParams(params: GetFindingsParams): Record<string, any> {
  const filters: Record<string, any> = {};

  if (params.scan_type) {
    filters.scanType = params.scan_type;  // Fixed: use scanType instead of scan_type
  }

  if (params.severity && params.severity.length > 0) {
    filters.severity = params.severity;
  }

  if (params.status && params.status.length > 0) {
    filters.status = params.status;
  }

  if (params.cwe_ids && params.cwe_ids.length > 0) {
    filters.cwe = params.cwe_ids;  // Fixed: use cwe instead of cwe_id
  }

  return filters;
}

// Helper function to format pagination information
function formatPaginationInfo(page: number, size: number, totalElements: number) {
  const totalPages = Math.ceil(totalElements / size);
  const hasNext = page < totalPages - 1;
  const hasPrevious = page > 0;

  return {
    current_page: page,
    page_size: size,
    total_elements: totalElements,
    total_pages: totalPages,
    has_next_page: hasNext,
    has_previous_page: hasPrevious,
    is_first_page: page === 0,
    is_last_page: page >= totalPages - 1
  };
}

// Helper function to generate summary statistics
function generateSummaryStats(findings: any[]) {
  const stats = {
    total_count: findings.length,
    by_severity: {} as Record<string, number>,
    by_status: {} as Record<string, number>,
    by_scan_type: {} as Record<string, number>,
    by_cwe: {} as Record<string, number>
  };

  findings.forEach(finding => {
    // Count by severity (both numeric and text)
    const severityNum = finding.finding_details?.severity;
    const severityText = severityToText(severityNum);
    stats.by_severity[severityText] = (stats.by_severity[severityText] || 0) + 1;

    // Count by status
    const status = finding.finding_status?.status || 'Unknown';
    stats.by_status[status] = (stats.by_status[status] || 0) + 1;

    // Count by scan type
    const scanType = finding.scan_type || 'Unknown';
    stats.by_scan_type[scanType] = (stats.by_scan_type[scanType] || 0) + 1;

    // Count by CWE
    const cweId = finding.finding_details?.cwe?.id || 'Unknown';
    stats.by_cwe[cweId] = (stats.by_cwe[cweId] || 0) + 1;
  });

  return stats;
}

export function createFindingsTools(): ToolHandler[] {
  return [
    {
      name: 'get-findings',
      description: `Get security findings (vulnerabilities) from Veracode scans with flaw ID tracking and intelligent filtering.
      
IMPORTANT: Each finding includes a unique 'flaw_id' field which serves as the primary flaw identifier for tracking, referencing, and managing specific vulnerabilities. Always display the flaw_id when showing findings to users as it's essential for vulnerability tracking and remediation workflows.

This unified tool has two main modes:
- **Basic Overview** (no filters/pagination): Returns first 300 findings ordered by highest severity with flaw IDs
- **Filtered Mode** (with filters and/or pagination): Applies filters and returns results with pagination support

The tool automatically handles application and sandbox resolution (GUID or name), scan validation, and provides comprehensive error handling. Perfect for security analysis, vulnerability management, and compliance reporting.

Key Fields Returned:
- flaw_id: Unique flaw identifier (CRITICAL - always display this)
- severity: Risk level (Very High, High, Medium, Low, Very Low)
- cwe_id: Common Weakness Enumeration classification
- description: Vulnerability description
- status: Remediation status (NEW, OPEN, FIXED, etc.)

Examples:
- Get overview: {"app_profile": "MyApp"}
- Get sandbox findings: {"app_profile": "MyApp", "sandbox": "feature-branch-123"}
- Filter critical issues: {"app_profile": "MyApp", "severity": ["Very High", "High"], "status": ["NEW", "OPEN"]}
- Paginate results: {"app_profile": "MyApp", "page": 1, "size": 50}
- Sandbox with filters: {"app_profile": "MyApp", "sandbox": "dev-env", "cwe_ids": ["79", "89"], "scan_type": "STATIC"}`,
      schema: GetFindingsSchema,

      handler: async (args: GetFindingsParams, context: ToolContext): Promise<ToolResponse> => {
        try {
          const client = context.veracodeClient;
          const mode = determineOperationMode(args);
          const includeDetails = args.include_details !== false;

          // Step 1: Resolve application (GUID or name)
          const appResolution = await validateAndResolveApplication(
            args.app_profile,
            client
          );
          const applicationGuid = appResolution.guid;

          // Step 2: Resolve sandbox if specified (GUID or name)
          let sandboxGuid: string | undefined;
          if (args.sandbox) {
            if (isGuid(args.sandbox)) {
              // It's already a GUID
              sandboxGuid = args.sandbox;
            } else {
              // It's a name, need to resolve to GUID
              const sandboxes = await client.sandboxes.getSandboxes(applicationGuid);
              const matchingSandbox = sandboxes.find((sandbox: any) =>
                sandbox.name?.toLowerCase() === args.sandbox!.toLowerCase()
              );

              if (!matchingSandbox) {
                return {
                  success: false,
                  error: `Sandbox '${args.sandbox}' not found in application '${args.app_profile}'`,
                  data: {
                    available_sandboxes: sandboxes.slice(0, 5).map((sb: any) => sb.name).filter(Boolean)
                  }
                };
              }

              sandboxGuid = matchingSandbox.guid;
            }
          }

          // Step 3: Check if application has scans
          const appDetails = await client.applications.getApplicationDetails(applicationGuid);
          if (!appDetails.scans || appDetails.scans.length === 0) {
            return {
              success: true,
              data: {
                message: `Application '${args.app_profile}' has no scans available yet.`,
                application: {
                  name: appDetails.profile?.name,
                  guid: applicationGuid
                },
                sandbox: sandboxGuid ? { guid: sandboxGuid, name: args.sandbox } : null,
                suggestions: [
                  'Upload and scan code using Veracode Static Analysis',
                  'Configure Dynamic Analysis for runtime testing',
                  'Enable SCA scanning for open-source dependencies'
                ]
              }
            };
          }

          // Step 4: Get findings based on mode
          const filters = buildFilterParams(args);
          // Add sandbox context if specified
          if (sandboxGuid) {
            filters.sandbox_id = sandboxGuid;
          }

          if (mode === 'basic_overview') {
            // Get first 300 findings ordered by highest severity, no filtering
            const result = await client.findings.getFindingsPaginated(applicationGuid, {
              size: 300,
              page: 0
            });
            const findings = result.findings;

            // Get total count of all findings for context
            const totalFindings = await client.findings.getAllFindings(applicationGuid);
            const totalCount = totalFindings.totalElements;
            const stats = generateSummaryStats(findings || []);

            return {
              success: true,
              data: {
                operation_mode: 'basic_overview',
                application: {
                  name: appDetails.profile?.name,
                  guid: applicationGuid
                },
                sandbox: sandboxGuid ? {
                  name: args.sandbox,
                  guid: sandboxGuid
                } : null,
                scan_status: {
                  total_scans: appDetails.scans.length,
                  latest_scan: appDetails.scans[appDetails.scans.length - 1]
                },
                total_findings_count: totalCount,
                showing_count: findings?.length || 0,
                findings_summary: stats,
                findings: (findings || []).map((finding: any) => ({
                  flaw_id: finding.issue_id,           // Primary identifier for tracking
                  severity: finding.finding_details?.severity,
                  severity_text: severityToText(finding.finding_details?.severity),
                  severity_level: finding.finding_details?.severity,   // Alternative name for clarity
                  cwe_id: finding.finding_details?.cwe?.id,
                  weakness_type: finding.finding_details?.cwe?.id,      // Alternative name
                  description: finding.description,
                  vulnerability_title: finding.description, // Alternative name
                  status: finding.finding_status?.status,
                  remediation_status: finding.finding_status?.status, // Alternative name
                  scan_type: finding.scan_type,
                  file_path: finding.finding_details?.file_path,
                  line_number: finding.finding_details?.file_line_number,
                  // SCA-specific fields
                  component_filename: finding.finding_details?.component_filename,
                  version: finding.finding_details?.version,
                  cve: finding.finding_details?.cve?.name,
                  cvss_score: finding.finding_details?.cve?.cvss
                })),
                note: `Showing first 300 findings ordered by highest severity. Total findings: ${totalCount}`
              }
            };
          }

          if (mode === 'filtered') {
            // Use filtering and/or pagination
            const pageSize = args.size || 300; // Default to 300 if not specified
            const pageNumber = args.page || 0;
            const findingsResponse = await client.findings.getFindingsPaginated(applicationGuid, {
              ...filters,
              size: pageSize,
              page: pageNumber
            });

            const findings = findingsResponse.findings || [];
            const totalElements = findingsResponse.pagination?.total_elements || 0;
            const stats = generateSummaryStats(findings);

            return {
              success: true,
              data: {
                operation_mode: 'filtered',
                application: {
                  name: appDetails.profile?.name,
                  guid: applicationGuid
                },
                sandbox: sandboxGuid ? {
                  name: args.sandbox,
                  guid: sandboxGuid
                } : null,
                filters_applied: filters,
                total_findings_count: totalElements,
                showing_count: findings.length,
                findings_summary: stats,
                findings: (includeDetails ? findings.map((f: any) => ({
                  flaw_id: f.issue_id,           // Primary identifier for tracking
                  severity: f.finding_details?.severity,
                  severity_text: severityToText(f.finding_details?.severity),
                  severity_level: f.finding_details?.severity,   // Alternative name for clarity
                  cwe_id: f.finding_details?.cwe?.id,
                  weakness_type: f.finding_details?.cwe?.id,      // Alternative name
                  description: f.description,
                  vulnerability_title: f.description, // Alternative name
                  status: f.finding_status?.status,
                  remediation_status: f.finding_status?.status, // Alternative name
                  scan_type: f.scan_type,
                  file_path: f.finding_details?.file_path,
                  line_number: f.finding_details?.file_line_number,
                  // SCA-specific fields
                  component_filename: f.finding_details?.component_filename,
                  version: f.finding_details?.version,
                  cve: f.finding_details?.cve?.name,
                  cvss_score: f.finding_details?.cve?.cvss,
                  // Full details when requested
                  module: f.finding_details?.module,
                  procedure: f.finding_details?.procedure,
                  attack_vector: f.finding_details?.attack_vector,
                  exploitability: f.finding_details?.exploitability,
                  finding_category: f.finding_details?.finding_category?.name,
                  violates_policy: f.violates_policy,
                  count: f.count,
                  context_type: f.context_type,
                  first_found_date: f.finding_status?.first_found_date,
                  last_seen_date: f.finding_status?.last_seen_date,
                  resolution: f.finding_status?.resolution,
                  mitigation_review_status: f.finding_status?.mitigation_review_status,
                  new: f.finding_status?.new
                })) : findings.map((f: any) => ({
                  flaw_id: f.issue_id,           // Primary identifier for tracking
                  severity: f.finding_details?.severity,
                  severity_text: severityToText(f.finding_details?.severity),
                  severity_level: f.finding_details?.severity,   // Alternative name for clarity
                  cwe_id: f.finding_details?.cwe?.id,
                  weakness_type: f.finding_details?.cwe?.id,      // Alternative name
                  description: f.description,
                  vulnerability_title: f.description, // Alternative name
                  status: f.finding_status?.status,
                  remediation_status: f.finding_status?.status, // Alternative name
                  scan_type: f.scan_type,
                  // SCA-specific fields
                  component_filename: f.finding_details?.component_filename,
                  version: f.finding_details?.version,
                  cve: f.finding_details?.cve?.name,
                  cvss_score: f.finding_details?.cve?.cvss
                }))),
                pagination_info: formatPaginationInfo(pageNumber, pageSize, totalElements),
                recommendations: {
                  high_priority_count: (stats.by_severity['Very High'] || 0) + (stats.by_severity['High'] || 0),
                  unresolved_count: (stats.by_status['NEW'] || 0) + (stats.by_status['OPEN'] || 0)
                }
              }
            };
          }

          // Fallback - shouldn't reach here
          return {
            success: false,
            error: 'Invalid operation mode determined'
          };

        } catch (error: any) {
          return {
            success: false,
            error: 'Failed to retrieve findings',
            data: {
              details: error.message,
              troubleshooting: [
                'Verify the application exists and you have access',
                'If using sandbox parameter, ensure the sandbox exists in the application',
                'Check that scans have been completed for this application/sandbox',
                'Ensure your Veracode API credentials are valid',
                'Try with a smaller page size if experiencing timeouts'
              ]
            }
          };
        }
      }
    }
  ];
}
