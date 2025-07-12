import { z } from "zod";
import { ToolHandler, ToolContext, ToolResponse } from "../types/tool.types.js";

// Findings and vulnerability analysis tools
export const findingsTools: ToolHandler[] = [
    {
        name: "get-findings-by-name",
        description: "Get general findings and scan results for an application by name. For specific flaw ID analysis with call stack data, use get-static-flaw-info-by-id or get-static-flaw-info-by-name instead.",
        schema: {
            name: z.string().describe("Application name to get findings for"),
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                const result = await context.veracodeClient.getFindingsByName(args.name);
                return {
                    success: true,
                    data: result
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching findings by name: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    },

    {
        name: "get-findings-by-id",
        description: "Get general findings and scan results for an application by ID. For specific flaw ID analysis with call stack data, use get-static-flaw-info-by-id instead.",
        schema: {
            app_id: z.string().describe("Application ID (GUID) to get findings for"),
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                const result = await context.veracodeClient.getFindingsById(args.app_id);
                return {
                    success: true,
                    data: result
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching findings by ID: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    },

    {
        name: "get-findings",
        description: "Get application findings with comprehensive filtering and pagination support. Retrieves findings from Veracode scans (STATIC, DYNAMIC, MANUAL, SCA) with detailed filtering options and automatic pagination handling.",
        schema: {
            name: z.string().describe("Application name to get findings for"),
            scan_type: z.enum(["STATIC", "DYNAMIC", "MANUAL", "SCA"]).optional().describe("Type of scan findings to retrieve"),
            severity: z.number().min(0).max(5).optional().describe("Exact severity level (0-5)"),
            severity_gte: z.number().min(0).max(5).optional().describe("Minimum severity level (0-5)"),
            cwe: z.array(z.number()).optional().describe("CWE IDs to filter by"),
            cvss: z.number().min(0).max(10).optional().describe("Exact CVSS score (0-10)"),
            cvss_gte: z.number().min(0).max(10).optional().describe("Minimum CVSS score (0-10)"),
            cve: z.string().optional().describe("Specific CVE ID to filter by"),
            context: z.string().optional().describe("Context type (APPLICATION, SANDBOX)"),
            include_annotations: z.boolean().optional().describe("Include mitigation annotations (default: false)"),
            include_expiration_date: z.boolean().optional().describe("Include grace period expiration dates (default: false)"),
            new_findings_only: z.boolean().optional().describe("Only show new findings (default: false)"),
            sca_dependency_mode: z.enum(["UNKNOWN", "DIRECT", "TRANSITIVE", "BOTH"]).optional().describe("SCA dependency mode filter"),
            sca_scan_mode: z.enum(["UPLOAD", "AGENT", "BOTH"]).optional().describe("SCA scan mode filter"),
            policy_violations_only: z.boolean().optional().describe("Only show policy violations (default: false)"),
            page_size: z.number().min(1).max(500).optional().describe("Number of findings per page (max 500, default 500)"),
            max_pages: z.number().min(1).max(100).optional().describe("Maximum pages to retrieve (default: 50)"),
            single_page: z.boolean().optional().describe("Return only first page of results (default: false)")
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                // First get the application to get its ID
                const searchResults = await context.veracodeClient.searchApplications(args.name);

                if (searchResults.length === 0) {
                    return {
                        success: false,
                        error: `No application found with name: ${args.name}`
                    };
                }

                // Find exact match or use first result
                let targetApp = searchResults.find((app: any) => app.profile.name.toLowerCase() === args.name.toLowerCase());
                if (!targetApp) {
                    targetApp = searchResults[0];
                    console.warn(`No exact match found for "${args.name}". Using first result: "${targetApp.profile.name}"`);
                }

                // Build findings request options
                const findingsOptions = {
                    scanType: args.scan_type,
                    severity: args.severity,
                    severityGte: args.severity_gte,
                    cwe: args.cwe,
                    cvss: args.cvss,
                    cvssGte: args.cvss_gte,
                    cve: args.cve,
                    context: args.context,
                    includeAnnotations: args.include_annotations,
                    includeExpirationDate: args.include_expiration_date,
                    newFindingsOnly: args.new_findings_only,
                    scaDependencyMode: args.sca_dependency_mode,
                    scaScanMode: args.sca_scan_mode,
                    policyViolation: args.policy_violations_only,
                    pageSize: args.page_size || 500,
                    maxPages: args.max_pages || 50
                };

                let findingsResult;

                if (args.single_page) {
                    // Get single page with pagination metadata
                    const singlePageResult = await context.veracodeClient.getFindingsPaginated(targetApp.guid, {
                        ...findingsOptions,
                        page: 0,
                        size: findingsOptions.pageSize
                    });

                    findingsResult = {
                        findings: singlePageResult.findings,
                        totalPages: singlePageResult.pagination.total_pages,
                        totalElements: singlePageResult.pagination.total_elements,
                        pagesRetrieved: 1,
                        truncated: singlePageResult.pagination.total_pages > 1
                    };
                } else {
                    // Get all findings across pages
                    findingsResult = await context.veracodeClient.getAllFindings(targetApp.guid, findingsOptions);
                }

                // Calculate summary statistics
                const severityBreakdown = findingsResult.findings.reduce((acc: Record<string, number>, finding: any) => {
                    const severity = finding.finding_details?.severity || 0;
                    const severityLabel = severity === 5 ? "Very High" : severity === 4 ? "High" :
                        severity === 3 ? "Medium" : severity === 2 ? "Low" :
                            severity === 1 ? "Very Low" : "Informational";
                    acc[severityLabel] = (acc[severityLabel] || 0) + 1;
                    return acc;
                }, {});

                const scanTypeBreakdown = findingsResult.findings.reduce((acc: Record<string, number>, finding: any) => {
                    const scanType = finding.scan_type || "Unknown";
                    acc[scanType] = (acc[scanType] || 0) + 1;
                    return acc;
                }, {});

                const statusBreakdown = findingsResult.findings.reduce((acc: Record<string, number>, finding: any) => {
                    const status = finding.finding_status?.status || "Unknown";
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});

                const policyViolations = findingsResult.findings.filter((finding: any) => finding.violates_policy).length;

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
                        findings_summary: {
                            total_findings_retrieved: findingsResult.findings.length,
                            total_findings_available: findingsResult.totalElements,
                            pages_retrieved: findingsResult.pagesRetrieved,
                            total_pages_available: findingsResult.totalPages,
                            data_truncated: findingsResult.truncated,
                            policy_violations: policyViolations,
                            severity_breakdown: severityBreakdown,
                            scan_type_breakdown: scanTypeBreakdown,
                            status_breakdown: statusBreakdown
                        },
                        filters_applied: {
                            scan_type: args.scan_type || "all",
                            severity_filter: args.severity ? `exact: ${args.severity}` :
                                args.severity_gte ? `>= ${args.severity_gte}` : "all",
                            cvss_filter: args.cvss ? `exact: ${args.cvss}` :
                                args.cvss_gte ? `>= ${args.cvss_gte}` : "all",
                            cwe_filter: args.cwe ? args.cwe.join(", ") : "all",
                            context: args.context || "all",
                            new_findings_only: args.new_findings_only || false,
                            policy_violations_only: args.policy_violations_only || false
                        },
                        pagination_info: {
                            single_page_mode: args.single_page || false,
                            page_size: findingsOptions.pageSize,
                            max_pages_limit: findingsOptions.maxPages,
                            retrieval_complete: !findingsResult.truncated
                        },
                        findings: findingsResult.findings,
                        metadata: {
                            retrieval_timestamp: new Date().toISOString(),
                            api_endpoint: "appsec/v2/applications/{guid}/findings",
                            data_completeness: findingsResult.truncated ? "truncated" : "complete"
                        }
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching findings: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    },

    {
        name: "get-findings-paginated",
        description: "Get a specific page of findings with detailed pagination control. Useful for implementing custom pagination or when you need precise control over data retrieval.",
        schema: {
            name: z.string().describe("Application name to get findings for"),
            page: z.number().min(0).optional().describe("Page number (0-based, default: 0)"),
            page_size: z.number().min(1).max(500).optional().describe("Number of findings per page (max 500, default 100)"),
            scan_type: z.enum(["STATIC", "DYNAMIC", "MANUAL", "SCA"]).optional().describe("Type of scan findings to retrieve"),
            severity_gte: z.number().min(0).max(5).optional().describe("Minimum severity level (0-5)"),
            cvss_gte: z.number().min(0).max(10).optional().describe("Minimum CVSS score (0-10)"),
            include_annotations: z.boolean().optional().describe("Include mitigation annotations (default: false)"),
            new_findings_only: z.boolean().optional().describe("Only show new findings (default: false)"),
            policy_violations_only: z.boolean().optional().describe("Only show policy violations (default: false)")
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                // First get the application to get its ID
                const searchResults = await context.veracodeClient.searchApplications(args.name);

                if (searchResults.length === 0) {
                    return {
                        success: false,
                        error: `No application found with name: ${args.name}`
                    };
                }

                // Find exact match or use first result
                let targetApp = searchResults.find((app: any) => app.profile.name.toLowerCase() === args.name.toLowerCase());
                if (!targetApp) {
                    targetApp = searchResults[0];
                    console.warn(`No exact match found for "${args.name}". Using first result: "${targetApp.profile.name}"`);
                }

                // Get paginated findings
                const result = await context.veracodeClient.getFindingsPaginated(targetApp.guid, {
                    page: args.page || 0,
                    size: args.page_size || 100,
                    scanType: args.scan_type,
                    severityGte: args.severity_gte,
                    cvssGte: args.cvss_gte,
                    includeAnnotations: args.include_annotations,
                    newFindingsOnly: args.new_findings_only,
                    policyViolation: args.policy_violations_only
                });

                return {
                    success: true,
                    data: {
                        application: {
                            name: targetApp.profile.name,
                            id: targetApp.guid,
                            app_profile_url: targetApp.app_profile_url,
                            results_url: targetApp.results_url
                        },
                        pagination: result.pagination,
                        findings: result.findings,
                        page_info: {
                            current_page: result.pagination.current_page,
                            findings_on_page: result.findings.length,
                            has_next_page: result.pagination.has_next,
                            has_previous_page: result.pagination.has_previous,
                            total_pages: result.pagination.total_pages,
                            total_findings: result.pagination.total_elements
                        },
                        navigation: {
                            next_page: result.pagination.has_next ? result.pagination.current_page + 1 : null,
                            previous_page: result.pagination.has_previous ? result.pagination.current_page - 1 : null,
                            last_page: result.pagination.total_pages - 1
                        }
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching paginated findings: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    }
];
