#!/usr/bin/env node

import { VeracodeClient } from "./veracode-rest-client.js";
import { logger } from "./utils/logger.js";
import { CLIToolRegistry } from "./cli-tools/cli-tool-registry.js";
import * as dotenv from "dotenv";

dotenv.config();
logger.reinitialize(); // Reinitialize after env is loaded
logger.info("Veracode MCP Client starting", "CLIENT");

interface ToolCall {
    tool: string;
    args?: Record<string, any>;
}

interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
}

export class VeracodeMCPClient {
    private veracodeClient: VeracodeClient;
    private toolRegistry: CLIToolRegistry; constructor() {
        logger.debug("Initializing VeracodeMCPClient", "CLIENT");

        const apiId = process.env.VERACODE_API_ID;
        const apiKey = process.env.VERACODE_API_KEY;

        logger.debug("Environment check", "CLIENT", {
            hasApiId: !!apiId,
            hasApiKey: !!apiKey,
            logLevel: process.env.LOG_LEVEL
        });

        if (!apiId || !apiKey) {
            logger.error("Missing Veracode API credentials", "CLIENT");
            throw new Error("Missing Veracode API credentials");
        }

        logger.debug("Creating Veracode client instance", "CLIENT");
        this.veracodeClient = new VeracodeClient(apiId, apiKey);
        logger.debug("Veracode client created", "CLIENT");

        logger.debug("About to initialize CLI tool registry", "CLIENT");
        this.toolRegistry = new CLIToolRegistry(this.veracodeClient);
        logger.debug("CLI tool registry created", "CLIENT");

        logger.info("VeracodeMCPClient initialized successfully", "CLIENT");
    }

    async callTool(toolCall: ToolCall): Promise<ToolResult> {
        const startTime = Date.now();
        logger.debug("Tool call initiated", "CLIENT", {
            tool: toolCall.tool,
            hasArgs: !!toolCall.args,
            argsCount: toolCall.args ? Object.keys(toolCall.args).length : 0
        });

        try {
            console.log(`🔧 Calling tool: ${toolCall.tool}`);
            if (toolCall.args) {
                console.log(`📋 Arguments:`, JSON.stringify(toolCall.args, null, 2));
                logger.debug("Tool arguments", "CLIENT", toolCall.args);
            }
            console.log();

            const result = await this.toolRegistry.callTool(toolCall);

            const executionTime = Date.now() - startTime;
            logger.debug("Tool call completed", "CLIENT", {
                tool: toolCall.tool,
                success: result.success,
                executionTime
            });

            return result;

        } catch (error: any) {
            const executionTime = Date.now() - startTime;
            logger.error("Tool call failed", "CLIENT", {
                tool: toolCall.tool,
                executionTime,
                error: error.message
            });
            return {
                success: false,
                error: `Error calling tool ${toolCall.tool}: ${error.message}`
            };
        }
    }

    getAvailableTools(): string[] {
        return this.toolRegistry.getAvailableTools();
    }
}

// CLI Interface
function parseArguments(): { tool: string; args: Record<string, any> } | null {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        return null;
    }

    // Check for JSON input mode
    if (args[0] === '--json') {
        try {
            let input = '';
            process.stdin.setEncoding('utf8');
            process.stdin.on('readable', () => {
                const chunk = process.stdin.read();
                if (chunk !== null) {
                    input += chunk;
                }
            });
            process.stdin.on('end', async () => {
                try {
                    const parsed = JSON.parse(input.trim());
                    const client = new VeracodeMCPClient();
                    const result = await client.callTool({ tool: parsed.tool, args: parsed.args });

                    if (result.success) {
                        console.log("✅ Success:");
                        if (parsed.tool === 'get-sca-results-by-name') {
                            // Special formatting for SCA results
                            const data = result.data;
                            console.log(`📊 Found ${data.detailed_findings?.length || 0} findings for application ${data.application?.name} (SCA scans)`);
                            console.log(`Showing all ${data.detailed_findings?.length || 0} findings:`);
                            data.detailed_findings?.forEach((finding: any, index: number) => {
                                console.log(`• SCA Finding (Flaw ID: ${finding.flaw_id || 'N/A'})`);
                                if (finding.cwe_name) console.log(`  CWE: ${finding.cwe_id} - ${finding.cwe_name}`);
                                if (finding.severity) console.log(`  Severity: ${finding.severity}`);
                                if (finding.status) console.log(`  Status: ${finding.status}`);
                                if (finding.violates_policy !== undefined) console.log(`  Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}`);
                                if (finding.cve && finding.cvss) console.log(`  CVE: ${finding.cve} (CVSS: ${finding.cvss})`);
                                if (finding.component_filename && finding.version) console.log(`  Component: ${finding.component_filename} (v${finding.version})`);
                                if (finding.description) { console.log(`  Description: ${finding.description}`); }
                            });
                        } else {
                            console.log(JSON.stringify(result.data, null, 2));
                        }
                    } else {
                        console.error("❌ Error:", result.error);
                        process.exit(1);
                    }
                } catch (parseError) {
                    console.error("❌ Error parsing JSON input:", parseError);
                    process.exit(1);
                }
            });
            return null; // Async handling
        } catch (error) {
        }
    }

    const tool = args[0];
    const toolArgs: Record<string, any> = {};

    // Parse command line arguments
    for (let i = 1; i < args.length; i += 2) {
        const key = args[i]?.replace(/^--/, '');
        const value = args[i + 1];

        if (key && value !== undefined) {
            // Convert string "true"/"false" to boolean
            if (value === 'true') {
                toolArgs[key] = true;
            } else if (value === 'false') {
                toolArgs[key] = false;
            } else if (!isNaN(Number(value))) {
                // Convert numeric strings to numbers
                toolArgs[key] = Number(value);
            } else {
                toolArgs[key] = value;
            }
        }
    }

    return { tool, args: toolArgs };
}

function showUsage(client: VeracodeMCPClient) {
    const availableTools = client.getAvailableTools();

    console.log("📖 Usage: node veracode-mcp-client.js <tool> [args...]");
    console.log("Available tools:");
    availableTools.forEach(tool => {
        switch (tool) {
            case "get-applications":
                console.log("  get-applications");
                break;
            case "search-applications":
                console.log("  search-applications --name <search_term>");
                break;
            case "get-application-details":
                console.log("  get-application-details-by-id --app_id <app_id>");
                break;
            case "get-application-details-by-name":
                console.log("  get-application-details-by-name --name <app_name>");
                break;
            case "get-scan-results":
                console.log("  get-scan-results-by-id --app_id <app_id> [--scan_type <type>]");
                break;
            case "get-scan-results-by-name":
                console.log("  get-scan-results-by-name --name <app_name> [--scan_type <type>]");
                break;
            case "get-findings":
                console.log("  get-findings-by-id --app_id <app_id> [--scan_type <type>] [--severity <severity>]");
                break;
            case "get-findings-by-name":
                console.log("  get-findings-by-name --name <app_name> [--scan_type <type>] [--severity_gte <level>] [--cvss_gte <score>] [--only_policy_violations] [--only_new_findings] [--max_results <count>]");
                break;
            case "get-sca-results-by-name":
                console.log("  get-sca-results-by-name --name <app_name> [--severity_gte <level>] [--cvss_gte <score>] [--only_policy_violations] [--only_new_findings] [--only_exploitable] [--max_results <count>]");
                break;
            case "get-policy-compliance":
                console.log("  get-policy-compliance-by-id --app_id <app_id>");
                break;
            case "get-static-flaw-info":
                console.log("  get-static-flaw-info-by-id --app_id <app_id> --issue_id <issue_id> [--context <sandbox_guid>]");
                break;
            case "get-static-flaw-info-by-name":
                console.log("  get-static-flaw-info-by-name --name <app_name> --issue_id <issue_id> [--context <sandbox_guid>]");
                break;
        }
    });

    console.log("Examples:");
    console.log("  node build/veracode-mcp-client.js search-applications --name goat");
    console.log("  node build/veracode-mcp-client.js get-applications");
    console.log("  node build/veracode-mcp-client.js get-application-details-by-id --app_id 12345");
    console.log("  node build/veracode-mcp-client.js get-findings-by-name --name \"My App\" --scan_type SCA --severity_gte 3");
    console.log("  node build/veracode-mcp-client.js get-sca-results-by-name --name \"ASC-597\"");
    console.log("  node build/veracode-mcp-client.js get-static-flaw-info-by-id --app_id 12345 --issue_id 67890");
    console.log("  node build/veracode-mcp-client.js get-static-flaw-info-by-name --name \"My App\" --issue_id 67890");
    console.log("📝 For application names with special characters, use JSON input:");
    console.log("  echo '{\"tool\":\"search-applications\",\"args\":{\"name\":\"bob\\\" &&\"}}' | node build/veracode-mcp-client.js --json");
    console.log("  echo '{\"tool\":\"get-scan-results-by-name\",\"args\":{\"name\":\"& test\"}}' | node build/veracode-mcp-client.js --json");
}

// Main execution
async function main() {
    try {
        const client = new VeracodeMCPClient();
        const parsed = parseArguments();

        if (!parsed) {
            showUsage(client);
            return;
        }

        const result = await client.callTool(parsed);

        if (result.success) {
            console.log("✅ Success:");

            // Special formatting for SCA results
            if (parsed.tool === 'get-sca-results-by-name') {
                const data = result.data;
                console.log(`📊 Found ${data.detailed_findings?.length || 0} findings for application ${data.application?.name} (SCA scans)`);
                console.log(`Showing all ${data.detailed_findings?.length || 0} findings:`);

                data.detailed_findings?.forEach((finding: any, index: number) => {

                    if (finding.finding_details.component_filename) {
                        console.log(`• SCA Finding in ${finding.finding_details.component_filename} (v ${finding.finding_details.version})`);
                    } else {
                        console.log('• SCA Finding ');
                    }


                    if (finding.finding_details.cve_id) console.log(`  CVE: ${finding.cve_id}${finding.cvss ? ` (CVSS: ${finding.cvss})` : ''}`);
                    if (finding.component_id) console.log(`  Component ID: ${finding.component_id}`);
                    if (finding.language) console.log(`  Language: ${finding.language}`);
                    if (finding.finding_details.component_path && finding.finding_details.component_path.length > 0) {
                        console.log(`  Component Paths: `);
                        finding.finding_details.component_path.forEach((pathObj: any, idx: number) => {
                            const path = pathObj.path || pathObj;
                            console.log(`    ${idx + 1}. ${path} `);
                        });
                    }
                    if (finding.severity) console.log(`  Severity: ${finding.severity} `);
                    if (finding?.finding_status?.first_found_date) console.log(`  First Found Date: ${finding?.finding_status?.first_found_date} `);
                    if (finding?.finding_status?.last_seen_date) console.log(`  Last Seen Date: ${finding?.finding_status?.last_seen_date} `);

                    if (finding.policy_rules_status !== undefined) console.log(`  Policy Violation: ${finding.policy_rules_status ? 'Yes' : 'No'} `);
                    if (finding.exploitable !== undefined) console.log(`  Exploitable: ${finding.exploitable ? 'Yes' : 'No'} `);
                    if (finding.license) console.log(`  License: ${finding.license} `);
                    if (finding.description) { console.log(`  Description: ${finding.description} `); }
                });
            } else {
                console.log(JSON.stringify(result.data, null, 2));
            }
        } else {
            console.error("❌ Error:", result.error);
            process.exit(1);
        }
    } catch (error: any) {
        logger.error("Fatal error in main", "MAIN", { error: error.message });
        console.error("❌ Fatal error:", error.message);
        process.exit(1);
    }
}

// Only run main if this file is executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    main();
}
