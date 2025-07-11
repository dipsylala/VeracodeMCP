#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { VeracodeClient } from "./veracode-client.js";
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

// Tool: Get Application Details
server.tool(
  "get-application-details",
  "Get detailed information about a specific application",
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

// Tool: Get Scan Results
server.tool(
  "get-scan-results",
  "Get scan results for an application",
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

// Tool: Get Findings
server.tool(
  "get-findings",
  "Get detailed findings from scans",
  {
    app_id: z.string().describe("Application ID (GUID)"),
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
  async ({ app_id, scan_type, severity, severity_gte, cwe, cvss, cvss_gte, cve, context, include_annotations, new_findings_only, violates_policy, page, size }) => {
    try {
      const findings = await veracodeClient.getFindings(app_id, {
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
              text: `No findings found for application ${app_id} with the specified criteria`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Found ${findings.length} findings for Application ${app_id}:\n\n` +
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

// Tool: Get Policy Compliance
server.tool(
  "get-policy-compliance",
  "Check policy compliance status for an application",
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
              `Policy Name: ${compliance.policy_name}\n` +
              `Policy Version: ${compliance.policy_version}\n` +
              `Evaluation Date: ${compliance.policy_evaluation_date}\n` +
              `Grace Period Expired: ${compliance.grace_period_expired ? "Yes" : "No"}\n` +
              `Scan Overdue: ${compliance.scan_overdue ? "Yes" : "No"}`
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
