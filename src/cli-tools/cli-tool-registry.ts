import { VeracodeClient } from "../veracode-rest-client.js";
import { logger } from "../utils/logger.js";

export interface ToolCall {
    tool: string;
    args?: Record<string, any>;
}

export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
}

export type ToolHandler = (args: any) => Promise<ToolResult>;

/**
 * Base class for organizing tool handlers by category
 */
export abstract class ToolCategory {
    protected client: VeracodeClient;

    constructor(client: VeracodeClient) {
        this.client = client;
    }

    abstract getHandlers(): Record<string, ToolHandler>;
}

/**
 * Application management tools
 */
export class ApplicationTools extends ToolCategory {
    getHandlers(): Record<string, ToolHandler> {
        return {
            "get-applications": this.getApplications.bind(this),
            "search-applications": this.searchApplications.bind(this),
            "get-application-details": this.getApplicationDetails.bind(this),
            "get-application-details-by-name": this.getApplicationDetailsByName.bind(this)
        };
    }

    private async getApplications(args: any): Promise<ToolResult> {
        const result = await this.client.getApplications();
        return {
            success: true,
            data: {
                count: result.length,
                applications: result.map((app: any) => ({
                    name: app.profile.name,
                    id: app.guid,
                    legacy_id: app.id,
                    business_criticality: app.profile.business_criticality,
                    teams: app.profile.teams?.map((team: any) => team.team_name) || [],
                    created_date: app.created,
                    modified_date: app.modified
                }))
            }
        };
    }

    private async searchApplications(args: any): Promise<ToolResult> {
        if (!args?.name) {
            return { success: false, error: "Missing required argument: name" };
        }

        const result = await this.client.searchApplications(args.name);
        return {
            success: true,
            data: {
                search_term: args.name,
                count: result.length,
                applications: result.map((app: any) => ({
                    name: app.profile.name,
                    id: app.guid,
                    legacy_id: app.id,
                    business_criticality: app.profile.business_criticality,
                    teams: app.profile.teams?.map((team: any) => team.team_name) || [],
                    created_date: app.created,
                    modified_date: app.modified
                }))
            }
        };
    }

    private async getApplicationDetails(args: any): Promise<ToolResult> {
        if (!args?.app_id) {
            return { success: false, error: "Missing required argument: app_id" };
        }

        const result = await this.client.getApplicationDetails(args.app_id);
        return {
            success: true,
            data: this.mapApplicationDetails(result)
        };
    }

    private async getApplicationDetailsByName(args: any): Promise<ToolResult> {
        if (!args?.name) {
            return { success: false, error: "Missing required argument: name" };
        }

        const result = await this.client.getApplicationDetailsByName(args.name);
        return {
            success: true,
            data: this.mapApplicationDetails(result)
        };
    }

    private mapApplicationDetails(result: any) {
        return {
            name: result.profile.name,
            id: result.guid,
            legacy_id: result.id,
            business_criticality: result.profile.business_criticality,
            teams: result.profile.teams?.map((team: any) => ({
                name: team.team_name,
                guid: team.guid,
                team_id: team.team_id
            })) || [],
            tags: result.profile.tags ? result.profile.tags.split(',').map((tag: string) => tag.trim()) : [],
            description: result.profile.description,
            created_date: result.created,
            modified_date: result.modified,
            last_completed_scan_date: result.last_completed_scan_date,
            business_unit: result.profile.business_unit ? {
                name: result.profile.business_unit.name,
                guid: result.profile.business_unit.guid,
                id: result.profile.business_unit.id
            } : null,
            business_owners: result.profile.business_owners?.map((owner: any) => ({
                name: owner.name,
                email: owner.email
            })) || [],
            settings: result.profile.settings ? {
                sca_enabled: result.profile.settings.sca_enabled,
                dynamic_scan_approval_not_required: result.profile.settings.dynamic_scan_approval_not_required,
                static_scan_dependencies_allowed: result.profile.settings.static_scan_dependencies_allowed,
                nextday_consultation_allowed: result.profile.settings.nextday_consultation_allowed
            } : null,
            custom_fields: result.profile.custom_fields?.map((field: any) => ({
                name: field.name,
                value: field.value
            })) || [],
            custom_field_values: result.profile.custom_field_values?.map((fieldValue: any) => ({
                field_name: fieldValue.app_custom_field_name?.name,
                value: fieldValue.value,
                id: fieldValue.id
            })) || [],
            policies: result.profile.policies?.map((policy: any) => ({
                name: policy.name,
                guid: policy.guid,
                is_default: policy.is_default,
                compliance_status: policy.policy_compliance_status
            })) || [],
            git_repo_url: result.profile.git_repo_url,
            archer_app_name: result.profile.archer_app_name,
            custom_kms_alias: result.profile.custom_kms_alias,
            app_profile_url: result.app_profile_url,
            results_url: result.results_url,
            scans: result.scans?.map((scan: any) => ({
                scan_type: scan.scan_type,
                status: scan.status,
                internal_status: scan.internal_status,
                modified_date: scan.modified_date,
                scan_url: scan.scan_url
            })) || []
        };
    }
}

/**
 * Scan results tools
 */
export class ScanTools extends ToolCategory {
    getHandlers(): Record<string, ToolHandler> {
        return {
            "get-scan-results": this.getScanResults.bind(this),
            "get-scan-results-by-name": this.getScanResultsByName.bind(this)
        };
    }

    private async getScanResults(args: any): Promise<ToolResult> {
        if (!args?.app_id) {
            return { success: false, error: "Missing required argument: app_id" };
        }

        const result = await this.client.getScanResults(args.app_id, args.scan_type);
        return {
            success: true,
            data: {
                app_id: args.app_id,
                scan_type_filter: args.scan_type,
                count: result.length,
                scans: result.map((scan: any) => ({
                    scan_id: scan.scan_id,
                    scan_type: scan.scan_type,
                    status: scan.status,
                    policy_compliance_status: scan.policy_compliance_status,
                    created_date: scan.created_date,
                    modified_date: scan.modified_date
                }))
            }
        };
    }

    private async getScanResultsByName(args: any): Promise<ToolResult> {
        if (!args?.name) {
            return { success: false, error: "Missing required argument: name" };
        }

        // First search for applications with this name
        const searchResults = await this.client.searchApplications(args.name);
        if (searchResults.length === 0) {
            return { success: false, error: `No application found with name: ${args.name}` };
        }

        // If multiple results, look for exact match first
        let targetApp = searchResults.find((app: any) =>
            app.profile.name.toLowerCase() === args.name.toLowerCase()
        );

        // If no exact match, use the first result but warn about it
        if (!targetApp) {
            targetApp = searchResults[0];
            console.warn(`No exact match found for "${args.name}". Using first result: "${targetApp.profile.name}"`);
        }

        const result = await this.client.getScanResults(targetApp.guid, args.scan_type);
        return {
            success: true,
            data: {
                application_name: args.name,
                app_id: targetApp.guid,
                scan_type_filter: args.scan_type,
                count: result.length,
                scans: result.map((scan: any) => ({
                    scan_id: scan.scan_id,
                    scan_type: scan.scan_type,
                    status: scan.status,
                    policy_compliance_status: scan.policy_compliance_status,
                    created_date: scan.created_date,
                    modified_date: scan.modified_date
                }))
            }
        };
    }
}

/**
 * Policy compliance tools
 */
export class PolicyTools extends ToolCategory {
    getHandlers(): Record<string, ToolHandler> {
        return {
            "get-policy-compliance": this.getPolicyCompliance.bind(this)
        };
    }

    private async getPolicyCompliance(args: any): Promise<ToolResult> {
        if (!args?.app_id) {
            return { success: false, error: "Missing required argument: app_id" };
        }

        const result = await this.client.getPolicyCompliance(args.app_id);
        return {
            success: true,
            data: result
        };
    }
}

/**
 * Static analysis tools
 */
export class StaticAnalysisTools extends ToolCategory {
    getHandlers(): Record<string, ToolHandler> {
        return {
            "get-static-flaw-info": this.getStaticFlawInfo.bind(this),
            "get-static-flaw-info-by-name": this.getStaticFlawInfoByName.bind(this)
        };
    }

    private async getStaticFlawInfo(args: any): Promise<ToolResult> {
        if (!args?.app_id || !args?.issue_id) {
            return { success: false, error: "Missing required arguments: app_id and issue_id" };
        }

        const result = await this.client.getStaticFlawInfo(args.app_id, args.issue_id, args.context);
        return {
            success: true,
            data: result
        };
    }

    private async getStaticFlawInfoByName(args: any): Promise<ToolResult> {
        if (!args?.name || !args?.issue_id) {
            return { success: false, error: "Missing required arguments: name and issue_id" };
        }

        const result = await this.client.getStaticFlawInfoByName(args.name, args.issue_id, args.context);
        return {
            success: true,
            data: result
        };
    }
}

/**
 * Tool registry that manages all tool categories
 */
export class CLIToolRegistry {
    private handlers: Map<string, ToolHandler> = new Map();

    constructor(client: VeracodeClient) {
        // Register all tool categories
        const categories = [
            new ApplicationTools(client),
            new ScanTools(client),
            new PolicyTools(client),
            new StaticAnalysisTools(client)
        ];

        // Collect all handlers from all categories
        for (const category of categories) {
            const categoryHandlers = category.getHandlers();
            for (const [toolName, handler] of Object.entries(categoryHandlers)) {
                this.handlers.set(toolName, handler);
            }
        }

        // Add SCA tool manually for now
        this.handlers.set("get-sca-results-by-name", this.createSCAHandler(client));
        this.handlers.set("find-findings-by-name", this.createFindingsHandler(client));

        logger.debug("CLI tool registry initialized", "CLI_REGISTRY", {
            toolCount: this.handlers.size,
            tools: Array.from(this.handlers.keys())
        });
    }

    private createSCAHandler(client: VeracodeClient): ToolHandler {
        return async (args: any): Promise<ToolResult> => {
            const startTime = Date.now();
            logger.debug("Starting SCA analysis execution", "SCA_CLI", { args });

            try {
                if (!args?.name) {
                    return { success: false, error: "Missing required argument: name" };
                }

                logger.debug("Executing SCA analysis", "SCA_CLI", {
                    name: args.name,
                    severityGte: args.severity_gte,
                    cvssGte: args.cvss_gte,
                    size: args.max_results ? Math.min(args.max_results, 500) : 500
                });

                const findings = await client.getFindingsByName(args.name, {
                    scanType: "SCA",
                    severityGte: args.severity_gte,
                    cvssGte: args.cvss_gte,
                    policyViolation: args.only_policy_violations,
                    newFindingsOnly: args.only_new_findings,
                    size: args.max_results ? Math.min(args.max_results, 500) : 500
                });

                logger.debug("SCA findings retrieved", "SCA_CLI", {
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
                    logger.debug("Applied exploitable filter", "SCA_CLI", {
                        beforeFilter,
                        afterFilter: filteredFindings.length,
                        removed: beforeFilter - filteredFindings.length
                    });
                }

                // Get application details for metadata
                logger.debug("Searching for application details", "SCA_CLI", { name: args.name });
                const searchResults = await client.searchApplications(args.name);
                if (searchResults.length === 0) {
                    logger.warn("No application found for SCA results", "SCA_CLI", { name: args.name });
                    return {
                        success: false,
                        error: `No application found with name: ${args.name}`
                    };
                }

                let targetApp = searchResults.find((app: any) =>
                    app.profile.name.toLowerCase() === args.name.toLowerCase()
                );
                if (!targetApp) {
                    targetApp = searchResults[0];
                    logger.debug("Using first search result as no exact match found", "SCA_CLI", {
                        searchName: args.name,
                        foundName: targetApp.profile.name
                    });
                }

                // Create analysis summary
                logger.debug("Creating analysis summary", "SCA_CLI", { findingsCount: filteredFindings.length });
                const analysis = {
                    totalFindings: filteredFindings.length,
                    exploitableFindings: filteredFindings.filter((f: any) =>
                        f.finding_details?.cve?.exploitability?.exploit_observed).length,
                    highRiskComponents: filteredFindings.filter((f: any) =>
                        f.finding_details?.severity >= 4).length,
                    severityBreakdown: filteredFindings.reduce((acc: Record<string, number>, finding: any) => {
                        const severity = finding.finding_details?.severity || 0;
                        const label = severity === 5 ? "Very High" : severity === 4 ? "High" :
                            severity === 3 ? "Medium" : severity === 2 ? "Low" : "Very Low";
                        acc[label] = (acc[label] || 0) + 1;
                        return acc;
                    }, {}),
                    topVulnerabilities: filteredFindings
                        .filter((f: any) => f.finding_details?.cve?.cvss)
                        .map((f: any) => ({
                            unique_id: f.issue_id || f.finding_details?.component_filename || f.finding_details?.cve?.name || f.finding_details?.component_id || 'unknown',
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
                        .slice(0, 10)
                };

                const executionTime = Date.now() - startTime;
                logger.debug("SCA analysis completed", "SCA_CLI", {
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
                            scan_type: "SCA",
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
                logger.error("SCA CLI tool execution failed", "SCA_CLI", {
                    args,
                    executionTime,
                    error
                });
                return {
                    success: false,
                    error: `Error fetching SCA results by name: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        };
    }

    private createFindingsHandler(client: VeracodeClient): ToolHandler {
        return async (args: any): Promise<ToolResult> => {
            const startTime = Date.now();
            logger.debug("Starting findings search execution", "FINDINGS_CLI", { args });

            try {
                if (!args?.name) {
                    return { success: false, error: "Missing required argument: name" };
                }

                logger.debug("Executing findings search", "FINDINGS_CLI", {
                    name: args.name,
                    scanType: args.scan_type,
                    severityGte: args.severity_gte,
                    cvssGte: args.cvss_gte,
                    size: args.max_results ? Math.min(args.max_results, 500) : 500
                });

                const findings = await client.getFindingsByName(args.name, {
                    scanType: args.scan_type,
                    severityGte: args.severity_gte,
                    cvssGte: args.cvss_gte,
                    policyViolation: args.only_policy_violations,
                    newFindingsOnly: args.only_new_findings,
                    size: args.max_results ? Math.min(args.max_results, 500) : 500
                });

                logger.debug("Findings retrieved", "FINDINGS_CLI", {
                    name: args.name,
                    findingsCount: findings.length,
                    hasFindings: findings.length > 0
                });

                // Get application details for metadata
                logger.debug("Searching for application details", "FINDINGS_CLI", { name: args.name });
                const searchResults = await client.searchApplications(args.name);
                if (searchResults.length === 0) {
                    logger.warn("No application found for findings", "FINDINGS_CLI", { name: args.name });
                    return {
                        success: false,
                        error: `No application found with name: ${args.name}`
                    };
                }

                let targetApp = searchResults.find((app: any) =>
                    app.profile.name.toLowerCase() === args.name.toLowerCase()
                );
                if (!targetApp) {
                    targetApp = searchResults[0];
                    logger.debug("Using first search result as no exact match found", "FINDINGS_CLI", {
                        searchName: args.name,
                        foundName: targetApp.profile.name
                    });
                }

                // Map findings based on scan type
                logger.debug("Mapping findings by scan type", "FINDINGS_CLI", {
                    scanType: args.scan_type,
                    findingsCount: findings.length
                });

                const mappedFindings = findings.map((finding: any) => {
                    // Common fields for all findings
                    const baseFinding = {
                        scan_type: finding.scan_type,
                        finding_status: finding.finding_status?.display_text || finding.finding_status?.name,
                        severity: finding.finding_details?.severity,
                        policy_rules_status: finding.violates_policy
                    };

                    // Type-specific mapping
                    switch (finding.scan_type) {
                        case "STATIC":
                            return {
                                ...baseFinding,
                                issue_id: finding.issue_id,
                                flaw_id: finding.finding_details?.finding_id?.toString(),
                                cwe_id: finding.finding_details?.cwe?.id,
                                cwe_name: finding.finding_details?.cwe?.name,
                                module: finding.finding_details?.module,
                                function_name: finding.finding_details?.procedure,
                                relative_location: finding.finding_details?.relative_location,
                                line_number: finding.finding_details?.file_line_number,
                                description: finding.finding_details?.description || finding.description
                            };

                        case "DYNAMIC":
                            return {
                                ...baseFinding,
                                issue_id: finding.issue_id,
                                flaw_id: finding.finding_details?.finding_id?.toString(),
                                cwe_id: finding.finding_details?.cwe?.id,
                                cwe_name: finding.finding_details?.cwe?.name,
                                url: finding.finding_details?.url,
                                vulnerable_parameter: finding.finding_details?.vulnerable_parameter,
                                vulnerable_parameter_type: finding.finding_details?.vulnerable_parameter_type,
                                attack_vector: finding.finding_details?.attack_vector,
                                description: finding.finding_details?.description || finding.description
                            };

                        case "MANUAL":
                            return {
                                ...baseFinding,
                                issue_id: finding.issue_id,
                                flaw_id: finding.finding_details?.finding_id?.toString(),
                                cwe_id: finding.finding_details?.cwe?.id,
                                cwe_name: finding.finding_details?.cwe?.name,
                                category: finding.finding_details?.flaw_details?.category,
                                type: finding.finding_details?.flaw_details?.type,
                                location: finding.finding_details?.flaw_details?.location,
                                description: finding.finding_details?.description || finding.description
                            };

                        case "SCA":
                            return {
                                ...baseFinding,
                                issue_id: finding.issue_id,
                                component_id: finding.finding_details?.component_id,
                                component_filename: finding.finding_details?.component_filename,
                                component_version: finding.finding_details?.version,
                                component_paths: finding.finding_details?.['component_path(s)'] || finding.finding_details?.component_paths,
                                product_id: finding.finding_details?.product_id,
                                cve_id: finding.finding_details?.cve?.name,
                                cvss: finding.finding_details?.cve?.cvss,
                                vector: finding.finding_details?.cve?.vector,
                                exploitable: finding.finding_details?.cve?.exploitability?.exploit_observed,
                                license: finding.finding_details?.licenses?.[0]?.name,
                                language: finding.finding_details?.language,
                                description: finding.finding_details?.description || finding.description
                            };

                        default:
                            logger.warn("Unknown scan type encountered", "FINDINGS_CLI", {
                                scanType: finding.scan_type,
                                findingId: finding.finding_details?.finding_id
                            });
                            return baseFinding;
                    }
                });

                const executionTime = Date.now() - startTime;
                logger.debug("Findings search completed", "FINDINGS_CLI", {
                    appName: targetApp.profile.name,
                    totalFindings: mappedFindings.length,
                    scanType: args.scan_type,
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
                logger.error("Findings CLI tool execution failed", "FINDINGS_CLI", {
                    args,
                    executionTime,
                    error
                });
                return {
                    success: false,
                    error: `Error finding findings by name: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        };
    }

    async callTool(toolCall: ToolCall): Promise<ToolResult> {
        const handler = this.handlers.get(toolCall.tool);
        if (!handler) {
            return {
                success: false,
                error: `Unknown tool: ${toolCall.tool}. Available tools: ${Array.from(this.handlers.keys()).join(', ')}`
            };
        }

        logger.debug("Executing CLI tool", "CLI_REGISTRY", {
            tool: toolCall.tool,
            hasArgs: !!toolCall.args
        });

        return await handler(toolCall.args);
    }

    getAvailableTools(): string[] {
        return Array.from(this.handlers.keys()).sort();
    }
}
