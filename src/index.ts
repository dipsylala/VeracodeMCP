#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { VeracodeClient, VeracodeFinding, VeracodeSCAFinding, VeracodeStaticFinding, VeracodeDynamicFinding, VeracodeManualFinding } from "./veracode-rest-client.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["VERACODE_API_ID", "VERACODE_API_KEY"];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
  console.error("Please set these variables in your .env file or environment");
  process.exit(1);
}

// Create Veracode client instance
const veracodeClient = new VeracodeClient(
  process.env.VERACODE_API_ID!,
  process.env.VERACODE_API_KEY!
);

// Create MCP server instance
const server = new McpServer({
  name: "veracode-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Tool: Get Applications
server.tool(
  "get-applications",
  "List all applications in Veracode account",
  {},
  async () => {
    try {
      const applications = await veracodeClient.getApplications();

      return {
        content: [
          {
            type: "text",
            text: `Found ${applications.length} applications:\n\n` +
              applications.map(app =>
                `• ${app.profile.name} (ID: ${app.guid})\n` +
                `  Business Criticality: ${app.profile.business_criticality}\n` +
                `  Teams: ${app.profile.teams?.map(team => team.team_name).join(", ") || "None"}\n`
              ).join("\n")
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching applications: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Search Applications
server.tool(
  "search-applications",
  "Search applications by name",
  {
    name: z.string().describe("Application name to search for (partial matches supported)"),
  },
  async ({ name }) => {
    try {
      const applications = await veracodeClient.searchApplications(name);

      return {
        content: [
          {
            type: "text",
            text: `Found ${applications.length} applications matching "${name}":\n\n` +
              applications.map(app =>
                `• ${app.profile.name} (ID: ${app.guid})\n` +
                `  Business Criticality: ${app.profile.business_criticality}\n` +
                `  Teams: ${app.profile.teams?.map(team => team.team_name).join(", ") || "None"}\n`
              ).join("\n")
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching applications: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Application Details by ID
server.tool(
  "get-application-details-by-id",
  "Get detailed information about a specific application by ID",
  {
    app_id: z.string().describe("Application ID (GUID)"),
  },
  async ({ app_id }) => {
    try {
      const details = await veracodeClient.getApplicationDetails(app_id);

      return {
        content: [
          {
            type: "text",
            text: `Application Details:\n\n` +
              `Name: ${details.profile.name}\n` +
              `ID: ${details.guid}\n` +
              `Business Criticality: ${details.profile.business_criticality}\n` +
              `Created: ${details.created}\n` +
              `Modified: ${details.modified}\n` +
              `Teams: ${details.profile.teams?.map(team => team.team_name).join(", ") || "None"}\n` +
              `Tags: ${details.profile.tags || "None"}\n` +
              `Description: ${details.profile.description || "No description"}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching application details: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Application Details by Name
server.tool(
  "get-application-details-by-name",
  "Get detailed information about an application by its name",
  {
    name: z.string().describe("Application name to search for"),
  },
  async ({ name }) => {
    try {
      const details = await veracodeClient.getApplicationDetailsByName(name);

      return {
        content: [
          {
            type: "text",
            text: `Application Details:\n\n` +
              `Name: ${details.profile.name}\n` +
              `ID: ${details.guid}\n` +
              `Legacy ID: ${details.id}\n` +
              `Business Criticality: ${details.profile.business_criticality}\n` +
              `Created: ${details.created}\n` +
              `Modified: ${details.modified}\n` +
              `Teams: ${details.profile.teams?.map(team => team.team_name).join(", ") || "None"}\n` +
              `Tags: ${details.profile.tags || "None"}\n` +
              `Description: ${details.profile.description || "No description"}\n` +
              `Policies: ${details.profile.policies?.map(policy =>
                `${policy.name} (${policy.policy_compliance_status})`
              ).join(", ") || "None"}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching application details by name: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Scan Results by ID
server.tool(
  "get-scan-results-by-id",
  "Get scan results for an application by ID",
  {
    app_id: z.string().describe("Application ID (GUID)"),
    scan_type: z.enum(["STATIC", "DYNAMIC", "SCA", "MANUAL"]).optional().describe("Type of scan to filter by"),
  },
  async ({ app_id, scan_type }) => {
    try {
      const scans = await veracodeClient.getScanResults(app_id, scan_type);

      if (scans.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No scans found for application ${app_id}${scan_type ? ` with scan type ${scan_type}` : ""}`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Scan Results for Application ${app_id}:\n\n` +
              scans.map(scan =>
                `• Scan ID: ${scan.scan_id}\n` +
                `  Type: ${scan.scan_type}\n` +
                `  Status: ${scan.status}\n` +
                `  Created: ${scan.created_date}\n` +
                `  Modified: ${scan.modified_date}\n` +
                `  Policy Compliance: ${scan.policy_compliance_status || "N/A"}\n`
              ).join("\n")
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching scan results: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Findings by ID
server.tool(
  "get-findings-by-id",
  "Get detailed findings from scans with comprehensive details by application ID",
  {
    app_id: z.string().describe("Application ID (GUID)"),
    scan_type: z.enum(["STATIC", "DYNAMIC", "SCA", "MANUAL"]).optional().describe("Type of scan to filter by"),
    severity: z.number().min(0).max(5).optional().describe("Severity level (0-5, 5 being highest)"),
    severity_gte: z.number().min(0).max(5).optional().describe("Minimum severity level (0-5)"),
    cwe: z.array(z.number()).optional().describe("CWE IDs to filter by"),
    cvss: z.number().min(0).max(10).optional().describe("Exact CVSS score to filter by"),
    cvss_gte: z.number().min(0).max(10).optional().describe("Minimum CVSS score"),
    cve: z.string().optional().describe("CVE ID to filter by"),
    context: z.enum(["APPLICATION", "SANDBOX"]).optional().describe("Context type"),
    include_annotations: z.boolean().optional().describe("Include annotations in response"),
    new_findings_only: z.boolean().optional().describe("Only return new findings"),
    violates_policy: z.boolean().optional().describe("Filter by policy violations"),
    page: z.number().optional().describe("Page number (default 0)"),
    size: z.number().min(1).max(500).optional().describe("Page size (1-500, default 100)"),
  },
  async ({ app_id, scan_type, severity, severity_gte, cwe, cvss, cvss_gte, cve, context, include_annotations, new_findings_only, violates_policy, page, size }) => {
    try {
      const result = await veracodeClient.getEnhancedFindings(app_id, {
        scanType: scan_type as any,
        severity,
        severityGte: severity_gte,
        cwe,
        cvss,
        cvssGte: cvss_gte,
        cve,
        context: context as any,
        includeAnnotations: include_annotations,
        newFindingsOnly: new_findings_only,
        policyViolation: violates_policy,
        page,
        size
      });

      if (result.findings.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No findings found for application ${app_id} with the specified criteria`
            }
          ]
        };
      }

      // Generate detailed output based on scan types
      let detailedOutput = `Found ${result.findings.length} findings for Application ${app_id}:\n\n`;

      // Summary section
      detailedOutput += `📊 Summary:\n`;
      detailedOutput += `  • Total Findings: ${result.summary.totalFindings}\n`;
      detailedOutput += `  • Policy Violations: ${result.summary.policyViolations}\n`;
      detailedOutput += `  • New Findings: ${result.summary.newFindings}\n\n`;

      // By scan type
      detailedOutput += `📈 By Scan Type:\n`;
      Object.entries(result.summary.byType).forEach(([type, count]) => {
        detailedOutput += `  • ${type}: ${count} finding(s)\n`;
      });
      detailedOutput += '\n';

      // By severity
      detailedOutput += `📈 By Severity:\n`;
      Object.entries(result.summary.bySeverity).forEach(([severity, count]) => {
        detailedOutput += `  • ${severity}: ${count} finding(s)\n`;
      });
      detailedOutput += '\n';

      // Detailed findings (limit to first 15)
      detailedOutput += `📋 Detailed Findings (showing first 15):\n`;
      result.findings.slice(0, 15).forEach((finding, index) => {
        detailedOutput += `\n${index + 1}. ${finding.scan_type} Finding\n`;
        detailedOutput += `   Severity: ${finding.finding_details.severity} (${['Very Low', 'Low', 'Medium', 'High', 'Very High'][finding.finding_details.severity] || 'Unknown'})\n`;
        detailedOutput += `   Status: ${finding.finding_status.status}\n`;
        detailedOutput += `   Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}\n`;
        detailedOutput += `   New Finding: ${finding.finding_status.new ? 'Yes' : 'No'}\n`;
        detailedOutput += `   First Found: ${finding.finding_status.first_found_date}\n`;

        // Add scan-type specific details
        if (finding.scan_type === 'SCA') {
          const scaDetails = finding.finding_details as VeracodeSCAFinding;
          detailedOutput += `   Component: ${scaDetails.component_filename || 'Unknown'}\n`;
          detailedOutput += `   Version: ${scaDetails.version || 'N/A'}\n`;
          if (scaDetails.cve) {
            detailedOutput += `   CVE: ${scaDetails.cve.name}\n`;
            detailedOutput += `   CVSS: ${scaDetails.cve.cvss} (${scaDetails.cve.severity})\n`;
            if (scaDetails.cve.exploitability?.exploit_observed) {
              detailedOutput += `   ⚠️ EXPLOITABLE in the wild!\n`;
            }
          }
          if (scaDetails.licenses && scaDetails.licenses.length > 0) {
            detailedOutput += `   Licenses: ${scaDetails.licenses.map(l => `${l.license_id} (risk: ${l.risk_rating})`).join(', ')}\n`;
          }
        } else if (veracodeClient.isStaticFinding(finding)) {
          const staticDetails = finding.finding_details;
          detailedOutput += `   File: ${staticDetails.file_name || 'Unknown'}\n`;
          detailedOutput += `   Line: ${staticDetails.file_line_number || 'N/A'}\n`;
          detailedOutput += `   Module: ${staticDetails.module || 'N/A'}\n`;
        } else if (veracodeClient.isDynamicFinding(finding)) {
          const dynamicDetails = finding.finding_details;
          detailedOutput += `   URL: ${dynamicDetails.URL || 'Unknown'}\n`;
          detailedOutput += `   Host: ${dynamicDetails.hostname || 'N/A'}\n`;
          detailedOutput += `   Parameter: ${dynamicDetails.vulnerable_parameter || 'N/A'}\n`;
        } else if (veracodeClient.isManualFinding(finding)) {
          const manualDetails = finding.finding_details;
          detailedOutput += `   Location: ${manualDetails.location || 'Unknown'}\n`;
          detailedOutput += `   Module: ${manualDetails.module || 'N/A'}\n`;
        }

        if (finding.finding_details.cwe) {
          detailedOutput += `   CWE: ${finding.finding_details.cwe.id} - ${finding.finding_details.cwe.name}\n`;
        }

        if (finding.description) {
          detailedOutput += `   Description: ${finding.description.substring(0, 150)}${finding.description.length > 150 ? '...' : ''}\n`;
        }
      });

      if (result.findings.length > 15) {
        detailedOutput += `\n... and ${result.findings.length - 15} more findings`;
      }

      return {
        content: [
          {
            type: "text",
            text: detailedOutput
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching findings: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Findings by Name
server.tool(
  "get-findings-by-name",
  "Get detailed findings from scans by application name",
  {
    name: z.string().describe("Application name to search for"),
    scan_type: z.enum(["STATIC", "DYNAMIC", "SCA", "MANUAL"]).optional().describe("Type of scan to filter by"),
    severity: z.number().min(0).max(5).optional().describe("Severity level (0-5, 5 being highest)"),
    severity_gte: z.number().min(0).max(5).optional().describe("Minimum severity level (0-5)"),
    cwe: z.array(z.number()).optional().describe("CWE IDs to filter by"),
    cvss: z.number().min(0).max(10).optional().describe("Exact CVSS score to filter by"),
    cvss_gte: z.number().min(0).max(10).optional().describe("Minimum CVSS score"),
    cve: z.string().optional().describe("CVE ID to filter by"),
    context: z.string().optional().describe("Context type (APPLICATION or SANDBOX)"),
    include_annotations: z.boolean().optional().describe("Include annotations in response"),
    new_findings_only: z.boolean().optional().describe("Only return new findings"),
    violates_policy: z.boolean().optional().describe("Filter by policy violations"),
    page: z.number().optional().describe("Page number (default 0)"),
    size: z.number().min(1).max(500).optional().describe("Page size (1-500, default 100)"),
  },
  async ({ name, scan_type, severity, severity_gte, cwe, cvss, cvss_gte, cve, context, include_annotations, new_findings_only, violates_policy, page, size }) => {
    try {
      const findings = await veracodeClient.getFindingsByName(name, {
        scanType: scan_type,
        severity,
        severityGte: severity_gte,
        cwe,
        cvss,
        cvssGte: cvss_gte,
        cve,
        context,
        includeAnnotations: include_annotations,
        newFindingsOnly: new_findings_only,
        policyViolation: violates_policy,
        page,
        size
      });

      if (findings.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No findings found for application "${name}" with the specified criteria`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Found ${findings.length} findings for Application "${name}":\n\n` +
              findings.slice(0, 10).map(finding => // Limit to first 10 findings to avoid overwhelming output
                `• ${finding.scan_type} Finding\n` +
                `  CWE: ${finding.finding_details.cwe?.id || 'N/A'} - ${finding.finding_details.cwe?.name || 'Unknown'}\n` +
                `  Severity: ${finding.finding_details.severity}\n` +
                `  Status: ${finding.finding_status.status}\n` +
                `  Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}\n` +
                `  First Found: ${finding.finding_status.first_found_date}\n` +
                `  Description: ${finding.description.substring(0, 100)}${finding.description.length > 100 ? '...' : ''}\n`
              ).join("\n") +
              (findings.length > 10 ? `\n... and ${findings.length - 10} more findings` : "")
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching findings by name: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Policy Compliance by ID
server.tool(
  "get-policy-compliance-by-id",
  "Check policy compliance status for an application by ID",
  {
    app_id: z.string().describe("Application ID (GUID)"),
  },
  async ({ app_id }) => {
    try {
      const compliance = await veracodeClient.getPolicyCompliance(app_id);

      return {
        content: [
          {
            type: "text",
            text: `Policy Compliance for Application ${app_id}:\n\n` +
              `Overall Status: ${compliance.policy_compliance_status}\n` +
              `Total Findings: ${compliance.total_findings}\n` +
              `Policy Violations: ${compliance.policy_violations}\n` +
              `Compliance Percentage: ${compliance.summary.compliance_percentage}%\n\n` +
              `Summary:\n` +
              `• Critical Violations: ${compliance.summary.has_critical_violations ? "Yes" : "No"}\n` +
              `• High Severity Violations: ${compliance.summary.has_high_violations ? "Yes" : "No"}\n` +
              `• Total Open Violations: ${compliance.summary.total_open_violations}\n\n` +
              `Findings by Severity:\n` +
              Object.entries(compliance.findings_by_severity).map(([severity, count]) => `• ${severity}: ${count}`).join('\n') +
              (Object.keys(compliance.violations_by_severity).length > 0 ?
                `\n\nPolicy Violations by Severity:\n` +
                Object.entries(compliance.violations_by_severity).map(([severity, count]) => `• ${severity}: ${count}`).join('\n') :
                '\n\nNo policy violations found')
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching policy compliance: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Policy Compliance by Name
server.tool(
  "get-policy-compliance-by-name",
  "Check policy compliance status for an application by name",
  {
    name: z.string().describe("Application name to search for"),
  },
  async ({ name }) => {
    try {
      // First find the application
      const applications = await veracodeClient.searchApplications(name);

      if (applications.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No application found with name: ${name}`
            }
          ]
        };
      }

      const app = applications[0];
      const compliance = await veracodeClient.getPolicyCompliance(app.guid);

      return {
        content: [
          {
            type: "text",
            text: `Policy Compliance for Application ${app.profile.name}:\n\n` +
              `Overall Status: ${compliance.policy_compliance_status}\n` +
              `Total Findings: ${compliance.total_findings}\n` +
              `Policy Violations: ${compliance.policy_violations}\n` +
              `Compliance Percentage: ${compliance.summary.compliance_percentage}%\n\n` +
              `Summary:\n` +
              `• Critical Violations: ${compliance.summary.has_critical_violations ? "Yes" : "No"}\n` +
              `• High Severity Violations: ${compliance.summary.has_high_violations ? "Yes" : "No"}\n` +
              `• Total Open Violations: ${compliance.summary.total_open_violations}\n\n` +
              `Findings by Severity:\n` +
              Object.entries(compliance.findings_by_severity).map(([severity, count]) => `• ${severity}: ${count}`).join('\n') +
              (Object.keys(compliance.violations_by_severity).length > 0 ?
                `\n\nPolicy Violations by Severity:\n` +
                Object.entries(compliance.violations_by_severity).map(([severity, count]) => `• ${severity}: ${count}`).join('\n') :
                '\n\nNo policy violations found')
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching policy compliance by name: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Latest SCA Results by ID
server.tool(
  "get-latest-sca-results-by-id",
  "Get the latest SCA scan results and findings for an application by ID",
  {
    app_id: z.string().describe("Application ID (GUID)"),
  },
  async ({ app_id }) => {
    try {
      const results = await veracodeClient.getLatestSCAResults(app_id);

      if (!results.scan) {
        return {
          content: [
            {
              type: "text",
              text: `No SCA scans found for application ${app_id}`
            }
          ]
        };
      }

      const severityBreakdownText = Object.entries(results.summary.severityBreakdown)
        .map(([severity, count]) => `  • ${severity}: ${count}`)
        .join('\n');

      return {
        content: [
          {
            type: "text",
            text: `Latest SCA Results for Application ${app_id}:\n\n` +
              `🔍 Latest Scan:\n` +
              `  Scan ID: ${results.scan.scan_id}\n` +
              `  Status: ${results.scan.status}\n` +
              `  Created: ${results.scan.created_date}\n` +
              `  Policy Compliance: ${results.scan.policy_compliance_status || 'N/A'}\n\n` +
              `📊 Summary:\n` +
              `  Total Findings: ${results.summary.totalFindings}\n` +
              `  Policy Violations: ${results.summary.policyViolations}\n` +
              `  High Risk Components: ${results.summary.highRiskComponents}\n\n` +
              `📈 Findings by Severity:\n${severityBreakdownText}\n\n` +
              `📋 Recent Findings (first 10):\n` +
              results.findings.slice(0, 10).map((finding, index) => {
                if (finding.scan_type === 'SCA') {
                  const scaDetails = finding.finding_details as VeracodeSCAFinding;
                  return `${index + 1}. ${scaDetails.component_filename || 'Unknown Component'}\n` +
                    `   Version: ${scaDetails.version || 'N/A'}\n` +
                    `   Severity: ${scaDetails.severity} (${['Very Low', 'Low', 'Medium', 'High', 'Very High'][scaDetails.severity] || 'Unknown'})\n` +
                    `   CVE: ${scaDetails.cve?.name || 'N/A'}\n` +
                    `   Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}\n`;
                }
                return `${index + 1}. Non-SCA Finding\n`;
              }).join('\n') +
              (results.findings.length > 10 ? `\n... and ${results.findings.length - 10} more findings` : "")
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching latest SCA results: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Latest SCA Results by Name
server.tool(
  "get-latest-sca-results-by-name",
  "Get the latest SCA scan results and findings for an application by name",
  {
    name: z.string().describe("Application name to search for"),
  },
  async ({ name }) => {
    try {
      // First find the application
      const applications = await veracodeClient.searchApplications(name);

      if (applications.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No application found with name: ${name}`
            }
          ]
        };
      }

      const app = applications[0];
      const results = await veracodeClient.getLatestSCAResults(app.guid);

      if (!results.scan) {
        return {
          content: [
            {
              type: "text",
              text: `No SCA scans found for application ${app.profile.name}`
            }
          ]
        };
      }

      const severityBreakdownText = Object.entries(results.summary.severityBreakdown)
        .map(([severity, count]) => `  • ${severity}: ${count}`)
        .join('\n');

      return {
        content: [
          {
            type: "text",
            text: `Latest SCA Results for ${app.profile.name}:\n\n` +
              `🔍 Latest Scan:\n` +
              `  Scan ID: ${results.scan.scan_id}\n` +
              `  Status: ${results.scan.status}\n` +
              `  Created: ${results.scan.created_date}\n` +
              `  Policy Compliance: ${results.scan.policy_compliance_status || 'N/A'}\n\n` +
              `📊 Summary:\n` +
              `  Total Findings: ${results.summary.totalFindings}\n` +
              `  Policy Violations: ${results.summary.policyViolations}\n` +
              `  High Risk Components: ${results.summary.highRiskComponents}\n\n` +
              `📈 Findings by Severity:\n${severityBreakdownText}\n\n` +
              `📋 Recent Findings (first 10):\n` +
              results.findings.slice(0, 10).map((finding, index) => {
                if (finding.scan_type === 'SCA') {
                  const scaDetails = finding.finding_details as VeracodeSCAFinding;
                  return `${index + 1}. ${scaDetails.component_filename || 'Unknown Component'}\n` +
                    `   Version: ${scaDetails.version || 'N/A'}\n` +
                    `   Severity: ${scaDetails.severity} (${['Very Low', 'Low', 'Medium', 'High', 'Very High'][scaDetails.severity] || 'Unknown'})\n` +
                    `   CVE: ${scaDetails.cve?.name || 'N/A'}\n` +
                    `   Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}\n`;
                }
                return `${index + 1}. Non-SCA Finding\n`;
              }).join('\n') +
              (results.findings.length > 10 ? `\n... and ${results.findings.length - 10} more findings` : "")
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching latest SCA results by name: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Enhanced SCA Findings by ID
server.tool(
  "get-enhanced-sca-findings-by-id",
  "Get SCA findings with enhanced filtering options by application ID",
  {
    app_id: z.string().describe("Application ID (GUID)"),
    include_transitive: z.boolean().optional().describe("Include transitive dependencies"),
    include_direct: z.boolean().optional().describe("Include direct dependencies"),
    severity_gte: z.number().min(0).max(5).optional().describe("Minimum severity level (0-5)"),
    cvss_gte: z.number().min(0).max(10).optional().describe("Minimum CVSS score"),
    only_policy_violations: z.boolean().optional().describe("Only return policy violations"),
    only_new_findings: z.boolean().optional().describe("Only return new findings"),
    page: z.number().optional().describe("Page number (default 0)"),
    size: z.number().min(1).max(500).optional().describe("Page size (1-500, default 100)"),
  },
  async ({ app_id, include_transitive, include_direct, severity_gte, cvss_gte, only_policy_violations, only_new_findings, page, size }) => {
    try {
      const findings = await veracodeClient.getSCAFindings(app_id, {
        includeTransitiveDependencies: include_transitive,
        includeDirectDependencies: include_direct,
        severityGte: severity_gte,
        cvssGte: cvss_gte,
        onlyPolicyViolations: only_policy_violations,
        onlyNewFindings: only_new_findings,
        page,
        size
      });

      if (findings.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No SCA findings found for application ${app_id} with the specified criteria`
            }
          ]
        };
      }

      // Group findings by severity for summary
      const severityGroups: Record<number, VeracodeFinding[]> = {};
      findings.forEach(finding => {
        const severity = finding.finding_details.severity;
        if (!severityGroups[severity]) {
          severityGroups[severity] = [];
        }
        severityGroups[severity].push(finding);
      });

      const severitySummary = Object.keys(severityGroups)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .map(severity => {
          const count = severityGroups[parseInt(severity)].length;
          const severityName = ['Very Low', 'Low', 'Medium', 'High', 'Very High'][parseInt(severity)] || `Level ${severity}`;
          return `  • Severity ${severity} (${severityName}): ${count} finding(s)`;
        }).join('\n');

      return {
        content: [
          {
            type: "text",
            text: `Enhanced SCA Findings for Application ${app_id}:\n\n` +
              `📊 Found ${findings.length} SCA finding(s)\n\n` +
              `📈 Findings by Severity:\n${severitySummary}\n\n` +
              `📋 Detailed Findings (showing first 15):\n` +
              findings.slice(0, 15).map((finding, index) => {
                if (finding.scan_type === 'SCA') {
                  const scaDetails = finding.finding_details as VeracodeSCAFinding;
                  return `\n${index + 1}. Component: ${scaDetails.component_filename || 'Unknown'}\n` +
                    `   Version: ${scaDetails.version || 'N/A'}\n` +
                    `   Severity: ${scaDetails.severity} (${['Very Low', 'Low', 'Medium', 'High', 'Very High'][scaDetails.severity] || 'Unknown'})\n` +
                    `   Status: ${finding.finding_status.status}\n` +
                    `   Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}\n` +
                    `   First Found: ${finding.finding_status.first_found_date}\n` +
                    (scaDetails.cve ?
                      `   CVE: ${scaDetails.cve.name}\n` +
                      `   CVSS: ${scaDetails.cve.cvss} (${scaDetails.cve.severity})\n` : '') +
                    (scaDetails.licenses && scaDetails.licenses.length > 0 ?
                      `   Licenses: ${scaDetails.licenses.map((l: any) => `${l.license_id} (${l.risk_rating})`).join(', ')}\n` : '') +
                    (finding.description ?
                      `   Description: ${finding.description.substring(0, 100)}${finding.description.length > 100 ? '...' : ''}\n` : '');
                }
                return `\n${index + 1}. Non-SCA Finding\n`;
              }).join('') +
              (findings.length > 15 ? `\n... and ${findings.length - 15} more findings` : "")
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching enhanced SCA findings: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Comprehensive SCA Analysis by ID
server.tool(
  "get-comprehensive-sca-analysis-by-id",
  "Get comprehensive SCA analysis with detailed vulnerability and component information by application ID",
  {
    app_id: z.string().describe("Application ID (GUID)"),
    include_transitive: z.boolean().optional().describe("Include transitive dependencies"),
    include_direct: z.boolean().optional().describe("Include direct dependencies"),
    severity_gte: z.number().min(0).max(5).optional().describe("Minimum severity level (0-5)"),
    cvss_gte: z.number().min(0).max(10).optional().describe("Minimum CVSS score"),
    only_policy_violations: z.boolean().optional().describe("Only return policy violations"),
    only_new_findings: z.boolean().optional().describe("Only return new findings"),
    only_with_exploits: z.boolean().optional().describe("Only return findings with known exploits"),
    page: z.number().optional().describe("Page number (default 0)"),
    size: z.number().min(1).max(500).optional().describe("Page size (1-500, default 500)"),
  },
  async ({ app_id, include_transitive, include_direct, severity_gte, cvss_gte, only_policy_violations, only_new_findings, only_with_exploits, page, size }) => {
    try {
      const result = await veracodeClient.getComprehensiveSCAFindings(app_id, {
        includeTransitiveDependencies: include_transitive,
        includeDirectDependencies: include_direct,
        severityGte: severity_gte,
        cvssGte: cvss_gte,
        onlyPolicyViolations: only_policy_violations,
        onlyNewFindings: only_new_findings,
        onlyWithExploits: only_with_exploits,
        page,
        size
      });

      if (result.findings.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No SCA findings found for application ${app_id} with the specified criteria`
            }
          ]
        };
      }

      let output = `🔍 Comprehensive SCA Analysis for Application ${app_id}:\n\n`;

      // SCA Analysis Summary
      output += `📊 SCA Analysis Summary:\n`;
      output += `  • Total Components: ${result.scaAnalysis.totalComponents}\n`;
      output += `  • Vulnerable Components: ${result.scaAnalysis.vulnerableComponents}\n`;
      output += `  • High Risk Components: ${result.scaAnalysis.highRiskComponents}\n`;
      output += `  • Exploitable Findings: ${result.scaAnalysis.exploitableFindings}\n`;
      output += `  • Licensing Issues: ${result.scaAnalysis.licensingIssues}\n`;
      output += `  • Direct Dependencies: ${result.scaAnalysis.directDependencies}\n`;
      output += `  • Transitive Dependencies: ${result.scaAnalysis.transitiveDependencies}\n\n`;

      // Severity Breakdown
      output += `📈 Severity Breakdown:\n`;
      Object.entries(result.scaAnalysis.severityBreakdown).forEach(([severity, count]) => {
        output += `  • ${severity}: ${count} finding(s)\n`;
      });
      output += '\n';

      // Top Vulnerabilities
      if (result.scaAnalysis.topVulnerabilities.length > 0) {
        output += `🚨 Top Vulnerabilities (by CVSS score):\n`;
        result.scaAnalysis.topVulnerabilities.slice(0, 10).forEach((vuln, index) => {
          output += `${index + 1}. ${vuln.cve} - ${vuln.component} v${vuln.version}\n`;
          output += `   CVSS: ${vuln.cvss} ${vuln.exploitable ? '⚠️ EXPLOITABLE' : ''}\n`;
        });
        output += '\n';
      }

      // Detailed Findings
      output += `📋 Detailed SCA Findings (showing first 20 of ${result.findings.length}):\n`;
      result.findings.slice(0, 20).forEach((finding, index) => {
        if (finding.scan_type === 'SCA') {
          const scaDetails = finding.finding_details as VeracodeSCAFinding;
          output += `\n${index + 1}. Component: ${scaDetails.component_filename || 'Unknown'}\n`;
          output += `   Version: ${scaDetails.version || 'N/A'}\n`;
          output += `   Language: ${scaDetails.language || 'N/A'}\n`;
          output += `   Severity: ${scaDetails.severity} (${['Very Low', 'Low', 'Medium', 'High', 'Very High'][scaDetails.severity] || 'Unknown'})\n`;
          output += `   Status: ${finding.finding_status.status}\n`;
          output += `   Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}\n`;
          output += `   New Finding: ${finding.finding_status.new ? 'Yes' : 'No'}\n`;
          output += `   First Found: ${finding.finding_status.first_found_date}\n`;

          if (scaDetails.cve) {
            output += `   CVE: ${scaDetails.cve.name}\n`;
            output += `   CVSS v2: ${scaDetails.cve.cvss} (${scaDetails.cve.severity})\n`;
            output += `   Vector: ${scaDetails.cve.vector}\n`;

            if (scaDetails.cve.cvss3) {
              output += `   CVSS v3: ${scaDetails.cve.cvss3.score} (${scaDetails.cve.cvss3.severity})\n`;
              output += `   CVSS v3 Vector: ${scaDetails.cve.cvss3.vector}\n`;
            }

            if (scaDetails.cve.exploitability) {
              const exploit = scaDetails.cve.exploitability;
              output += `   Exploitability Status: ${exploit.exploit_service_status}\n`;
              if (exploit.exploit_observed) {
                output += `   ⚠️ EXPLOIT OBSERVED IN THE WILD!\n`;
                if (exploit.exploit_source) {
                  output += `   Exploit Source: ${exploit.exploit_source}\n`;
                }
                if (exploit.exploit_note) {
                  output += `   Exploit Note: ${exploit.exploit_note}\n`;
                }
              }
              if (exploit.epss_score !== undefined) {
                output += `   EPSS Score: ${exploit.epss_score} (${exploit.epss_percentile}th percentile)\n`;
                output += `   EPSS Date: ${exploit.epss_score_date}\n`;
              }
            }
          }

          if (scaDetails.licenses && scaDetails.licenses.length > 0) {
            output += `   Licenses: ${scaDetails.licenses.map(l => `${l.license_id} (risk: ${l.risk_rating})`).join(', ')}\n`;
          }

          if (scaDetails.component_path && scaDetails.component_path.length > 0) {
            output += `   Component Paths:\n`;
            scaDetails.component_path.slice(0, 3).forEach(path => {
              output += `     • ${path.path}\n`;
            });
            if (scaDetails.component_path.length > 3) {
              output += `     ... and ${scaDetails.component_path.length - 3} more paths\n`;
            }
          }

          if (scaDetails.metadata) {
            output += `   Metadata: ${scaDetails.metadata}\n`;
          }

          if (finding.description) {
            output += `   Description: ${finding.description.substring(0, 200)}${finding.description.length > 200 ? '...' : ''}\n`;
          }
        }
      });

      if (result.findings.length > 20) {
        output += `\n... and ${result.findings.length - 20} more findings`;
      }

      return {
        content: [
          {
            type: "text",
            text: output
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching comprehensive SCA analysis: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Tool: Get Scan Results by Name
server.tool(
  "get-scan-results-by-name",
  "Get scan results for an application by name",
  {
    name: z.string().describe("Application name to search for"),
    scan_type: z.enum(["STATIC", "DYNAMIC", "SCA", "MANUAL"]).optional().describe("Type of scan to filter by"),
  },
  async ({ name, scan_type }) => {
    try {
      // First find the application
      const applications = await veracodeClient.searchApplications(name);

      if (applications.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No application found with name: ${name}`
            }
          ]
        };
      }

      const app = applications[0];
      const scans = await veracodeClient.getScanResults(app.guid, scan_type);

      if (scans.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No scans found for application ${app.profile.name}${scan_type ? ` with scan type ${scan_type}` : ""}`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Scan Results for Application ${app.profile.name}:\n\n` +
              scans.map(scan =>
                `• Scan ID: ${scan.scan_id}\n` +
                `  Type: ${scan.scan_type}\n` +
                `  Status: ${scan.status}\n` +
                `  Created: ${scan.created_date}\n` +
                `  Modified: ${scan.modified_date}\n` +
                `  Policy Compliance: ${scan.policy_compliance_status || "N/A"}\n`
              ).join("\n")
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching scan results by name: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Main function to start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Veracode MCP Server running on stdio");
}

// Error handling
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
