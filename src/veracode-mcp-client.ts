#!/usr/bin/env node

import { VeracodeClient } from './veracode-rest-client.js';
import { logger } from './utils/logger.js';
import { MCPToolRegistry } from './mcp-tools/mcp.tool.registry.js';
import * as dotenv from 'dotenv';

dotenv.config();
logger.reinitialize(); // Reinitialize after env is loaded
logger.info('Veracode MCP Client starting', 'CLIENT');

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
  private mcpToolRegistry: MCPToolRegistry;
  constructor() {
    logger.debug('Initializing VeracodeMCPClient', 'CLIENT');

    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    logger.debug('Environment check', 'CLIENT', {
      hasApiId: !!apiId,
      hasApiKey: !!apiKey,
      logLevel: process.env.LOG_LEVEL
    });

    if (!apiId || !apiKey) {
      logger.error('Missing Veracode API credentials', 'CLIENT');
      throw new Error('Missing Veracode API credentials');
    }

    logger.debug('Creating Veracode client instance', 'CLIENT');
    this.veracodeClient = new VeracodeClient(apiId, apiKey);
    logger.debug('Veracode client created', 'CLIENT');

    logger.debug('About to initialize MCP tool registry', 'CLIENT');
    this.mcpToolRegistry = new MCPToolRegistry(this.veracodeClient);
    logger.debug('MCP tool registry created', 'CLIENT');

    logger.info('VeracodeMCPClient initialized successfully', 'CLIENT');
  }

  async callTool(toolCall: ToolCall): Promise<ToolResult> {
    const startTime = Date.now();
    logger.debug('Tool call initiated', 'CLIENT', {
      tool: toolCall.tool,
      hasArgs: !!toolCall.args,
      argsCount: toolCall.args ? Object.keys(toolCall.args).length : 0
    });

    try {
      console.log(`🔧 Calling tool: ${toolCall.tool}`);
      if (toolCall.args) {
        console.log('📋 Arguments:', JSON.stringify(toolCall.args, null, 2));
        logger.debug('Tool arguments', 'CLIENT', toolCall.args);
      }
      console.log();

      const result = await this.mcpToolRegistry.executeTool(toolCall);

      const executionTime = Date.now() - startTime;
      logger.debug('Tool call completed', 'CLIENT', {
        tool: toolCall.tool,
        success: result.success,
        executionTime
      });

      return result;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      logger.error('Tool call failed', 'CLIENT', {
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
    return this.mcpToolRegistry.getToolNames();
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
            console.log('✅ Success:');
            if (parsed.tool === 'get-sca-results-by-name') {
              // Special formatting for SCA results
              const data = result.data;
              console.log(
                `📊 Found ${data.detailed_findings?.length || 0} findings for application ${data.application?.name} (SCA scans)`
              );
              console.log(`Showing all ${data.detailed_findings?.length || 0} findings:`);
              data.detailed_findings?.forEach((finding: any, index: number) => {
                console.log(`• SCA Finding (Flaw ID: ${finding.flaw_id || 'N/A'})`);
                if (finding.cwe_name) console.log(`  CWE: ${finding.cwe_id} - ${finding.cwe_name}`);
                if (finding.severity) console.log(`  Severity: ${finding.severity}`);
                if (finding.status) console.log(`  Status: ${finding.status}`);
                if (finding.violates_policy !== undefined)
                  console.log(`  Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}`);
                if (finding.cve && finding.cvss) console.log(`  CVE: ${finding.cve} (CVSS: ${finding.cvss})`);
                if (finding.component_filename && finding.version)
                  console.log(`  Component: ${finding.component_filename} (v${finding.version})`);
                if (finding.description) {
                  console.log(`  Description: ${finding.description}`);
                }
              });
            } else {
              console.log(JSON.stringify(result.data, null, 2));
            }
          } else {
            console.error('❌ Error:', result.error);
            process.exit(1);
          }
        } catch (parseError) {
          console.error('❌ Error parsing JSON input:', parseError);
          process.exit(1);
        }
      });
      return null; // Async handling
    } catch (error) { }
  }

  const tool = args[0];
  const toolArgs: Record<string, any> = {};

  // Parse command line arguments
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];

    if (key && value !== undefined) {
      // Convert kebab-case to snake_case for consistency with existing API
      const normalizedKey = key.replace(/-/g, '_');

      // Convert string "true"/"false" to boolean
      if (value === 'true') {
        toolArgs[normalizedKey] = true;
      } else if (value === 'false') {
        toolArgs[normalizedKey] = false;
      } else if (!isNaN(Number(value))) {
        // Convert numeric strings to numbers
        toolArgs[normalizedKey] = Number(value);
      } else {
        toolArgs[normalizedKey] = value;
      }
    }
  }

  return { tool, args: toolArgs };
}

function showUsage(client: VeracodeMCPClient) {
  const availableTools = client.getAvailableTools();
  console.log('📖 Usage: node veracode-mcp-client.js <tool> [args...]');
  console.log('Available tools:');
  availableTools.forEach(tool => {
    switch (tool) {
      case 'get-application-profiles':
        console.log('  get-application-profiles');
        break;
      case 'search-application-profiles':
        console.log('  search-application-profiles --name <search_term>');
        break;
      case 'get-application-profile-details':
        console.log('  get-application-profile-details --app-profile <profile_id_or_name>');
        break;
      case 'get-application-profile-details-by-name':
        console.log('  get-application-profile-details-by-name --name <profile_name>');
        break;
      case 'get-scan-results':
        console.log('  get-scan-results --app_id <app_id> [--scan_type <type>]');
        break;
      case 'get-scan-results-by-name':
        console.log('  get-scan-results-by-name --name <app_name> [--scan_type <type>]');
        break;
      case 'get-findings':
        console.log('  get-findings --app-profile <profile_id_or_name> [--scan_type <type>] [--severity <severity>]');
        break;
      case 'get-findings-advanced-by-name':
        console.log(
          '  get-findings-advanced-by-name --name <app_name> [--scan_type <type>] [--severity_gte <level>] [--cvss_gte <score>] [--only_policy_violations] [--only_new_findings] [--max_results <count>] [--single_page]'
        );
        break;
      case 'get-sca-results-by-name':
        console.log(
          '  get-sca-results-by-name --name <app_name> [--severity_gte <level>] [--cvss_gte <score>] [--only_policy_violations] [--only_new_findings] [--only_exploitable] [--max_results <count>]'
        );
        break;
      case 'get-policy-compliance':
        console.log('  get-policy-compliance --app_id <app_id>');
        break;
      case 'get-static-flaw-info':
        console.log('  get-static-flaw-info --app-profile <profile_id_or_name> --issue_id <issue_id> [--sandbox_id <sandbox_guid>]');
        break;
      case 'get-sandboxes':
        console.log('  get-sandboxes --app-profile <profile_id_or_name> [--page <page>] [--size <size>]');
        break;
      case 'get-sandbox-summary':
        console.log('  get-sandbox-summary --app-profile <profile_id_or_name>');
        break;
    }
  });

  console.log('Examples:');
  console.log('  node build/veracode-mcp-client.js search-application-profiles --name goat');
  console.log('  node build/veracode-mcp-client.js get-application-profiles');
  console.log('  node build/veracode-mcp-client.js get-application-profile-details --app-profile 12345');
  console.log('  node build/veracode-mcp-client.js get-findings --app-profile "My App" --scan_type SCA --severity_gte 3');
  console.log('  node build/veracode-mcp-client.js get-static-flaw-info --app-profile 12345 --issue_id 67890');
  console.log('  node build/veracode-mcp-client.js get-sandboxes --app-profile "VeraDemo"');
  console.log('  node build/veracode-mcp-client.js get-sandbox-summary --app-profile 12345');
  console.log('📝 For application profile names with special characters, use JSON input:');
  console.log('  # PowerShell:');
  console.log('  \'{"tool":"search-application-profiles","args":{"name":"bob\\" &&"}}\' | node build/veracode-mcp-client.js --json');
  console.log('  \'{"tool":"get-scan-results","args":{"app_profile":"& test"}}\' | node build/veracode-mcp-client.js --json');
  console.log('  # Bash/Linux:');
  console.log('  echo \'{"tool":"search-application-profiles","args":{"name":"bob\\" &&"}}\' | node build/veracode-mcp-client.js --json');
  console.log('  echo \'{"tool":"get-scan-results","args":{"app_profile":"& test"}}\' | node build/veracode-mcp-client.js --json');
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
      console.log('✅ Success:');

      // Special formatting for SCA results
      if (parsed.tool === 'get-sca-results-by-name') {
        const data = result.data;
        console.log(
          `📊 Found ${data.detailed_findings?.length || 0} findings for application ${data.application?.name} (SCA scans)`
        );
        console.log(`Showing all ${data.detailed_findings?.length || 0} findings:`);

        data.detailed_findings?.forEach((finding: any, index: number) => {
          if (finding.finding_details.component_filename) {
            console.log(
              `• SCA Finding in ${finding.finding_details.component_filename} (v ${finding.finding_details.version})`
            );
          } else {
            console.log('• SCA Finding ');
          }

          if (finding.finding_details.cve_id)
            console.log(`  CVE: ${finding.cve_id}${finding.cvss ? ` (CVSS: ${finding.cvss})` : ''}`);
          if (finding.component_id) console.log(`  Component ID: ${finding.component_id}`);
          if (finding.language) console.log(`  Language: ${finding.language}`);
          if (finding.finding_details.component_path && finding.finding_details.component_path.length > 0) {
            console.log('  Component Paths: ');
            finding.finding_details.component_path.forEach((pathObj: any, idx: number) => {
              const path = pathObj.path || pathObj;
              console.log(`    ${idx + 1}. ${path} `);
            });
          }
          if (finding.severity) console.log(`  Severity: ${finding.severity} `);
          if (finding?.finding_status?.first_found_date)
            console.log(`  First Found Date: ${finding?.finding_status?.first_found_date} `);
          if (finding?.finding_status?.last_seen_date)
            console.log(`  Last Seen Date: ${finding?.finding_status?.last_seen_date} `);

          if (finding.policy_rules_status !== undefined)
            console.log(`  Policy Violation: ${finding.policy_rules_status ? 'Yes' : 'No'} `);
          if (finding.exploitable !== undefined) console.log(`  Exploitable: ${finding.exploitable ? 'Yes' : 'No'} `);
          if (finding.license) console.log(`  License: ${finding.license} `);
          if (finding.description) {
            console.log(`  Description: ${finding.description} `);
          }
        });
      } else {
        console.log(JSON.stringify(result.data, null, 2));
      }
    } else {
      console.error('❌ Error:', result.error);
      process.exit(1);
    }
  } catch (error: any) {
    logger.error('Fatal error in main', 'MAIN', { error: error.message });
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}
