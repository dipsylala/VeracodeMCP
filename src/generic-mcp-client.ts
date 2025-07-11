#!/usr/bin/env node

import { VeracodeClient } from "./veracode-client.js";
import * as dotenv from "dotenv";

dotenv.config();

interface ToolCall {
    tool: string;
    args?: Record<string, any>;
}

interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
}

class GenericMCPClient {
    private veracodeClient: VeracodeClient;

    constructor() {
        const apiId = process.env.VERACODE_API_ID;
        const apiKey = process.env.VERACODE_API_KEY;

        if (!apiId || !apiKey) {
            throw new Error("Missing Veracode API credentials");
        }

        this.veracodeClient = new VeracodeClient(apiId, apiKey);
    }

    async callTool(toolCall: ToolCall): Promise<ToolResult> {
        try {
            console.log(`🔧 Calling tool: ${toolCall.tool}`);
            if (toolCall.args) {
                console.log(`📋 Arguments:`, JSON.stringify(toolCall.args, null, 2));
            }
            console.log();

            let result: any;

            switch (toolCall.tool) {
                case "get-applications":
                    result = await this.veracodeClient.getApplications();
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

                case "search-applications":
                    if (!toolCall.args?.name) {
                        return { success: false, error: "Missing required argument: name" };
                    }
                    result = await this.veracodeClient.searchApplications(toolCall.args.name);
                    return {
                        success: true,
                        data: {
                            search_term: toolCall.args.name,
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

                case "get-application-details":
                    if (!toolCall.args?.app_id) {
                        return { success: false, error: "Missing required argument: app_id" };
                    }
                    result = await this.veracodeClient.getApplicationDetails(toolCall.args.app_id);
                    return {
                        success: true,
                        data: {
                            name: result.profile.name,
                            id: result.guid,
                            legacy_id: result.id,
                            business_criticality: result.profile.business_criticality,
                            teams: result.profile.teams?.map((team: any) => team.team_name) || [],
                            tags: result.profile.tags ? result.profile.tags.split(',').map((tag: string) => tag.trim()) : [],
                            description: result.profile.description,
                            created_date: result.created,
                            modified_date: result.modified
                        }
                    };

                case "get-application-details-by-name":
                    if (!toolCall.args?.name) {
                        return { success: false, error: "Missing required argument: name" };
                    }
                    result = await this.veracodeClient.getApplicationDetailsByName(toolCall.args.name);
                    return {
                        success: true,
                        data: {
                            name: result.profile.name,
                            id: result.guid,
                            legacy_id: result.id,
                            business_criticality: result.profile.business_criticality,
                            teams: result.profile.teams?.map((team: any) => team.team_name) || [],
                            tags: result.profile.tags ? result.profile.tags.split(',').map((tag: string) => tag.trim()) : [],
                            description: result.profile.description,
                            created_date: result.created,
                            modified_date: result.modified,
                            policies: result.profile.policies?.map((policy: any) => ({
                                name: policy.name,
                                compliance_status: policy.policy_compliance_status
                            })) || []
                        }
                    };

                case "get-scan-results":
                    if (!toolCall.args?.app_id) {
                        return { success: false, error: "Missing required argument: app_id" };
                    }
                    result = await this.veracodeClient.getScanResults(
                        toolCall.args.app_id,
                        toolCall.args.scan_type
                    );
                    return {
                        success: true,
                        data: {
                            app_id: toolCall.args.app_id,
                            scan_type_filter: toolCall.args.scan_type,
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

                case "get-findings":
                    if (!toolCall.args?.app_id) {
                        return { success: false, error: "Missing required argument: app_id" };
                    }
                    result = await this.veracodeClient.getFindings(
                        toolCall.args.app_id,
                        {
                            scanType: toolCall.args.scan_type,
                            severity: toolCall.args.severity,
                            severityGte: toolCall.args.severity_gte,
                            cwe: toolCall.args.cwe,
                            cvss: toolCall.args.cvss,
                            cvssGte: toolCall.args.cvss_gte,
                            cve: toolCall.args.cve,
                            context: toolCall.args.context,
                            includeAnnotations: toolCall.args.include_annotations,
                            newFindingsOnly: toolCall.args.new_findings_only,
                            policyViolation: toolCall.args.violates_policy,
                            page: toolCall.args.page,
                            size: toolCall.args.size
                        }
                    );
                    return {
                        success: true,
                        data: {
                            app_id: toolCall.args.app_id,
                            filters: {
                                scan_type: toolCall.args.scan_type,
                                severity: toolCall.args.severity,
                                severity_gte: toolCall.args.severity_gte,
                                cwe: toolCall.args.cwe,
                                cvss: toolCall.args.cvss,
                                cvss_gte: toolCall.args.cvss_gte,
                                cve: toolCall.args.cve,
                                context: toolCall.args.context,
                                new_findings_only: toolCall.args.new_findings_only,
                                violates_policy: toolCall.args.violates_policy
                            },
                            count: result.length,
                            findings: result.slice(0, 25).map((finding: any) => ({ // Limit to 25 for performance
                                scan_type: finding.scan_type,
                                description: finding.description.substring(0, 200) + (finding.description.length > 200 ? '...' : ''),
                                severity: finding.finding_details.severity,
                                cwe_id: finding.finding_details.cwe?.id,
                                cwe_name: finding.finding_details.cwe?.name,
                                cve: finding.finding_details.cve?.name,
                                cvss: finding.finding_details.cve?.cvss || finding.finding_details.cvss,
                                status: finding.finding_status.status,
                                resolution: finding.finding_status.resolution,
                                first_found_date: finding.finding_status.first_found_date,
                                last_seen_date: finding.finding_status.last_seen_date,
                                violates_policy: finding.violates_policy,
                                context_type: finding.context_type,
                                count: finding.count,
                                // Include specific details based on scan type
                                file_name: finding.finding_details.file_name,
                                file_path: finding.finding_details.file_path,
                                component_filename: finding.finding_details.component_filename,
                                version: finding.finding_details.version
                            })),
                            total_findings: result.length,
                            showing: Math.min(25, result.length)
                        }
                    };

                case "get-findings-by-name":
                    if (!toolCall.args?.name) {
                        return { success: false, error: "Missing required argument: name" };
                    }
                    result = await this.veracodeClient.getFindingsByName(
                        toolCall.args.name,
                        {
                            scanType: toolCall.args.scan_type,
                            severity: toolCall.args.severity,
                            severityGte: toolCall.args.severity_gte,
                            cwe: toolCall.args.cwe,
                            cvss: toolCall.args.cvss,
                            cvssGte: toolCall.args.cvss_gte,
                            cve: toolCall.args.cve,
                            context: toolCall.args.context,
                            includeAnnotations: toolCall.args.include_annotations,
                            newFindingsOnly: toolCall.args.new_findings_only,
                            policyViolation: toolCall.args.violates_policy,
                            page: toolCall.args.page,
                            size: toolCall.args.size
                        }
                    );
                    return {
                        success: true,
                        data: {
                            application_name: toolCall.args.name,
                            filters: {
                                scan_type: toolCall.args.scan_type,
                                severity: toolCall.args.severity,
                                severity_gte: toolCall.args.severity_gte,
                                cwe: toolCall.args.cwe,
                                cvss: toolCall.args.cvss,
                                cvss_gte: toolCall.args.cvss_gte,
                                cve: toolCall.args.cve,
                                context: toolCall.args.context,
                                new_findings_only: toolCall.args.new_findings_only,
                                violates_policy: toolCall.args.violates_policy
                            },
                            count: result.length,
                            findings: result.slice(0, 25).map((finding: any) => ({ // Limit to 25 for performance
                                scan_type: finding.scan_type,
                                description: finding.description.substring(0, 200) + (finding.description.length > 200 ? '...' : ''),
                                severity: finding.finding_details.severity,
                                cwe_id: finding.finding_details.cwe?.id,
                                cwe_name: finding.finding_details.cwe?.name,
                                cve: finding.finding_details.cve?.name,
                                cvss: finding.finding_details.cve?.cvss || finding.finding_details.cvss,
                                status: finding.finding_status.status,
                                resolution: finding.finding_status.resolution,
                                first_found_date: finding.finding_status.first_found_date,
                                last_seen_date: finding.finding_status.last_seen_date,
                                violates_policy: finding.violates_policy,
                                context_type: finding.context_type,
                                count: finding.count,
                                // Include specific details based on scan type
                                file_name: finding.finding_details.file_name,
                                file_path: finding.finding_details.file_path,
                                component_filename: finding.finding_details.component_filename,
                                version: finding.finding_details.version
                            })),
                            total_findings: result.length,
                            showing: Math.min(25, result.length)
                        }
                    };

                case "get-policy-compliance":
                    if (!toolCall.args?.app_id) {
                        return { success: false, error: "Missing required argument: app_id" };
                    }
                    result = await this.veracodeClient.getPolicyCompliance(toolCall.args.app_id);
                    return {
                        success: true,
                        data: {
                            app_id: toolCall.args.app_id,
                            policy_compliance_status: result.policy_compliance_status,
                            policy_name: result.policy_name,
                            policy_version: result.policy_version,
                            evaluation_date: result.policy_evaluation_date,
                            grace_period_expired: result.grace_period_expired,
                            scan_overdue: result.scan_overdue
                        }
                    };

                default:
                    return {
                        success: false,
                        error: `Unknown tool: ${toolCall.tool}. Available tools: get-applications, search-applications, get-application-details, get-scan-results, get-findings, get-policy-compliance`
                    };
            }

        } catch (error: any) {
            return {
                success: false,
                error: `Tool execution failed: ${error.message}`
            };
        }
    }

    formatResult(result: ToolResult): string {
        if (!result.success) {
            return `❌ Error: ${result.error}`;
        }

        const data = result.data;
        let output = "✅ Success:\n\n";

        // Format based on the type of data returned
        if (data.applications) {
            output += `📊 Found ${data.count} application${data.count !== 1 ? 's' : ''}`;
            if (data.search_term) {
                output += ` matching "${data.search_term}"`;
            }
            output += ":\n\n";

            data.applications.forEach((app: any) => {
                output += `• ${app.name}\n`;
                output += `  ID: ${app.id}\n`;
                output += `  Business Criticality: ${app.business_criticality}\n`;
                output += `  Teams: ${app.teams.join(", ") || "None"}\n`;
                output += `  Created: ${app.created_date}\n\n`;
            });
        } else if (data.scans) {
            output += `📊 Found ${data.count} scan${data.count !== 1 ? 's' : ''} for application ${data.app_id}`;
            if (data.scan_type_filter) {
                output += ` (${data.scan_type_filter} scans only)`;
            }
            output += ":\n\n";

            data.scans.forEach((scan: any) => {
                output += `• Scan ${scan.scan_id}\n`;
                output += `  Type: ${scan.scan_type}\n`;
                output += `  Status: ${scan.status}\n`;
                output += `  Policy Compliance: ${scan.policy_compliance_status || "N/A"}\n`;
                output += `  Created: ${scan.created_date}\n\n`;
            });
        } else if (data.findings) {
            const appIdentifier = data.app_id || data.application_name || "unknown";
            output += `📊 Found ${data.total_findings} finding${data.total_findings !== 1 ? 's' : ''} for application ${appIdentifier}`;

            // Show active filters
            const filters = [];
            if (data.filters?.scan_type) filters.push(`${data.filters.scan_type} scans`);
            if (data.filters?.severity) filters.push(`severity ${data.filters.severity}`);
            if (data.filters?.severity_gte) filters.push(`severity ≥${data.filters.severity_gte}`);
            if (data.filters?.cwe) filters.push(`CWE ${data.filters.cwe.join(', ')}`);
            if (data.filters?.violates_policy !== undefined) filters.push(data.filters.violates_policy ? 'policy violations' : 'non-violations');

            if (filters.length > 0) output += ` (${filters.join(', ')})`;
            output += `\nShowing first ${data.showing}:\n\n`;

            data.findings.forEach((finding: any) => {
                output += `• ${finding.scan_type} Finding\n`;
                if (finding.cwe_id) {
                    output += `  CWE-${finding.cwe_id}: ${finding.cwe_name}\n`;
                }
                output += `  Severity: ${finding.severity}\n`;
                output += `  Status: ${finding.status}\n`;
                output += `  Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}\n`;
                if (finding.first_found_date) {
                    output += `  First Found: ${finding.first_found_date}\n`;
                }
                if (finding.file_name) {
                    output += `  File: ${finding.file_name}\n`;
                }
                if (finding.component_filename) {
                    output += `  Component: ${finding.component_filename} (v${finding.version || 'unknown'})\n`;
                }
                if (finding.cve) {
                    output += `  CVE: ${finding.cve}\n`;
                }
                if (finding.cvss) {
                    output += `  CVSS: ${finding.cvss}\n`;
                }
                output += `\n`;
            });
        } else if (data.name) {
            // Single application details
            output += `📋 Application Details:\n\n`;
            output += `Name: ${data.name}\n`;
            output += `ID: ${data.id}\n`;
            output += `Business Criticality: ${data.business_criticality}\n`;
            output += `Description: ${data.description || "No description"}\n`;
            output += `Teams: ${data.teams.join(", ") || "None"}\n`;
            output += `Tags: ${data.tags.join(", ") || "None"}\n`;
            output += `Created: ${data.created_date}\n`;
            output += `Modified: ${data.modified_date}\n`;
        } else if (data.policy_compliance_status) {
            // Policy compliance
            output += `📋 Policy Compliance for ${data.app_id}:\n\n`;
            output += `Status: ${data.policy_compliance_status}\n`;
            output += `Policy: ${data.policy_name} (v${data.policy_version})\n`;
            output += `Evaluation Date: ${data.evaluation_date}\n`;
            output += `Grace Period Expired: ${data.grace_period_expired ? "Yes" : "No"}\n`;
            output += `Scan Overdue: ${data.scan_overdue ? "Yes" : "No"}\n`;
        }

        return output;
    }
}

// Main function to handle command line arguments
async function main() {
    const client = new GenericMCPClient();

    // Parse command line arguments
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("📖 Usage: node generic-mcp-client.js <tool> [args...]");
        console.log("\nAvailable tools:");
        console.log("  get-applications");
        console.log("  search-applications --name <search_term>");
        console.log("  get-application-details --app_id <app_id>");
        console.log("  get-application-details-by-name --name <app_name>");
        console.log("  get-scan-results --app_id <app_id> [--scan_type <type>]");
        console.log("  get-findings --app_id <app_id> [--scan_type <type>] [--severity <severity>]");
        console.log("  get-policy-compliance --app_id <app_id>");
        console.log("\nExamples:");
        console.log("  node build/generic-mcp-client.js search-applications --name goat");
        console.log("  node build/generic-mcp-client.js get-applications");
        console.log("  node build/generic-mcp-client.js get-application-details --app_id 12345");
        return;
    }

    const toolName = args[0];
    const toolArgs: Record<string, any> = {};

    // Parse --key value pairs
    for (let i = 1; i < args.length; i += 2) {
        if (args[i].startsWith('--') && i + 1 < args.length) {
            const key = args[i].substring(2);
            const value = args[i + 1];
            toolArgs[key] = value;
        }
    }

    const toolCall: ToolCall = {
        tool: toolName,
        args: Object.keys(toolArgs).length > 0 ? toolArgs : undefined
    };

    const result = await client.callTool(toolCall);
    console.log(client.formatResult(result));
}

// Handle JSON input for programmatic usage
if (process.argv.includes('--json')) {
    const client = new GenericMCPClient();

    process.stdin.setEncoding('utf8');
    let input = '';

    process.stdin.on('readable', () => {
        let chunk;
        while (null !== (chunk = process.stdin.read())) {
            input += chunk;
        }
    });

    process.stdin.on('end', async () => {
        try {
            const toolCall: ToolCall = JSON.parse(input.trim());
            const result = await client.callTool(toolCall);
            console.log(JSON.stringify(result, null, 2));
        } catch (error: any) {
            console.log(JSON.stringify({ success: false, error: error.message }, null, 2));
        }
    });
} else {
    main().catch(error => {
        console.error("❌ Failed to execute:", error.message);
        process.exit(1);
    });
}
