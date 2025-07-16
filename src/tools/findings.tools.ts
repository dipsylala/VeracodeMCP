import { z } from 'zod';
import { ToolHandler, ToolContext, ToolResponse } from './tool-types.js';
import { isGuid } from '../utils/validation.js';

// Schema for the unified get-findings tool
const GetFindingsSchema = z.object({
  application: z.string().describe('Application GUID or name to get findings for'),
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
    filters.scan_type = params.scan_type;
  }

  if (params.severity && params.severity.length > 0) {
    filters.severity = params.severity;
  }

  if (params.status && params.status.length > 0) {
    filters.status = params.status;
  }

  if (params.cwe_ids && params.cwe_ids.length > 0) {
    filters.cwe_id = params.cwe_ids;
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
    // Count by severity
    const severity = finding.severity || 'Unknown';
    stats.by_severity[severity] = (stats.by_severity[severity] || 0) + 1;

    // Count by status
    const status = finding.status || 'Unknown';
    stats.by_status[status] = (stats.by_status[status] || 0) + 1;

    // Count by scan type
    const scanType = finding.scan_type || 'Unknown';
    stats.by_scan_type[scanType] = (stats.by_scan_type[scanType] || 0) + 1;

    // Count by CWE
    const cweId = finding.cwe_id || 'Unknown';
    stats.by_cwe[cweId] = (stats.by_cwe[cweId] || 0) + 1;
  });

  return stats;
}

export function createFindingsTools(): ToolHandler[] {
  return [
    {
      name: 'get-findings',
      description: `Get security findings from Veracode scans with intelligent filtering and pagination.
      
This unified tool has two main modes:
- **Basic Overview** (no filters/pagination): Returns first 300 findings ordered by highest severity
- **Filtered Mode** (with filters and/or pagination): Applies filters and returns results with pagination support

The tool automatically handles application and sandbox resolution (GUID or name), scan validation, and provides comprehensive error handling. Perfect for security analysis, vulnerability management, and compliance reporting.

Examples:
- Get overview: {"application": "MyApp"}
- Get sandbox findings: {"application": "MyApp", "sandbox": "feature-branch-123"}
- Filter critical issues: {"application": "MyApp", "severity": ["Very High", "High"], "status": ["NEW", "OPEN"]}
- Paginate results: {"application": "MyApp", "page": 1, "size": 50}
- Sandbox with filters: {"application": "MyApp", "sandbox": "dev-env", "cwe_ids": ["79", "89"], "scan_type": "STATIC"}`,
      schema: GetFindingsSchema,

      handler: async (params: GetFindingsParams, context: ToolContext): Promise<ToolResponse> => {
        try {
          const client = context.veracodeClient;
          const mode = determineOperationMode(params);
          const includeDetails = params.include_details !== false;

          // Step 1: Resolve application (GUID or name)
          let applicationGuid = params.application;
          if (!isGuid(params.application)) {
            // It's a name, need to resolve to GUID
            const apps = await client.applications.getApplications();
            const matchingApp = apps.find((app: any) =>
              app.profile?.name?.toLowerCase() === params.application.toLowerCase()
            );

            if (!matchingApp) {
              return {
                success: false,
                error: `Application '${params.application}' not found`,
                data: {
                  available_applications: apps.slice(0, 5).map((app: any) => app.profile?.name).filter(Boolean)
                }
              };
            }

            applicationGuid = matchingApp.guid;
          }

          // Step 2: Resolve sandbox if specified (GUID or name)
          let sandboxGuid: string | undefined;
          if (params.sandbox) {
            if (isGuid(params.sandbox)) {
              // It's already a GUID
              sandboxGuid = params.sandbox;
            } else {
              // It's a name, need to resolve to GUID
              const sandboxes = await client.sandboxes.getSandboxes(applicationGuid);
              const matchingSandbox = sandboxes.find((sandbox: any) =>
                sandbox.name?.toLowerCase() === params.sandbox!.toLowerCase()
              );

              if (!matchingSandbox) {
                return {
                  success: false,
                  error: `Sandbox '${params.sandbox}' not found in application '${params.application}'`,
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
                message: `Application '${params.application}' has no scans available yet.`,
                application: {
                  name: appDetails.profile?.name,
                  guid: applicationGuid
                },
                sandbox: sandboxGuid ? { guid: sandboxGuid, name: params.sandbox } : null,
                suggestions: [
                  'Upload and scan code using Veracode Static Analysis',
                  'Configure Dynamic Analysis for runtime testing',
                  'Enable SCA scanning for open-source dependencies'
                ]
              }
            };
          }

          // Step 4: Get findings based on mode
          const filters = buildFilterParams(params);
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
                  name: params.sandbox,
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
                  issue_id: finding.issue_id,
                  severity: finding.severity,
                  cwe_id: finding.cwe_id,
                  description: finding.description,
                  status: finding.status,
                  scan_type: finding.scan_type,
                  file_path: finding.file_path,
                  line_number: finding.line_number
                })),
                note: `Showing first 300 findings ordered by highest severity. Total findings: ${totalCount}`
              }
            };
          }

          if (mode === 'filtered') {
            // Use filtering and/or pagination
            const pageSize = params.size || 300; // Default to 300 if not specified
            const pageNumber = params.page || 0;
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
                  name: params.sandbox,
                  guid: sandboxGuid
                } : null,
                filters_applied: filters,
                total_findings_count: totalElements,
                showing_count: findings.length,
                findings_summary: stats,
                findings: (includeDetails ? findings : findings.map((f: any) => ({
                  issue_id: f.issue_id,
                  severity: f.severity,
                  cwe_id: f.cwe_id,
                  description: f.description,
                  status: f.status,
                  scan_type: f.scan_type
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
