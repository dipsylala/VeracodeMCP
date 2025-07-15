import { z } from 'zod';
import { ToolHandler, ToolContext, ToolResponse } from './tool-types.js';
import { isGuid } from '../utils/validation.js';

// Create application tools for MCP
export function createApplicationTools(): ToolHandler[] {
  return [
    {
      name: 'get-application-profiles',
      description: 'List all application profiles (security projects) in your Veracode account with powerful filtering options. An application profile represents a software project being scanned for security vulnerabilities. Use this when you need to discover available applications, find specific applications by name/tags, or get an overview of your security scanning portfolio. Perfect for reporting, application discovery, and initial security assessment setup.',
      schema: {
        business_unit: z.string().optional().describe('Filter by business unit name (exact match). Use when you need applications from a specific organizational division.'),
        custom_field_names: z.array(z.string()).optional().describe('Custom field names to search in. Combined with custom_field_values for targeted filtering based on your organization\'s metadata.'),
        custom_field_values: z.array(z.string()).optional().describe('Custom field values to match against. Use with custom_field_names to find applications with specific metadata tags or properties.'),
        legacy_id: z.number().optional().describe('The numeric Veracode Platform application ID. Use when you have the old-style numeric ID and need to find the modern GUID-based application profile.'),
        modified_after: z.string().optional().describe('Filter to applications modified after this date (yyyy-MM-dd format, e.g., "2024-01-15"). Useful for finding recently updated applications or tracking changes.'),
        name: z.string().optional().describe('Application profile name to search for (partial match supported, URL-encode special characters). Most common filter - use to find applications by name.'),
        page: z.number().optional().describe('Page number for pagination (starts at 0). Use with size parameter to navigate through large application lists.'),
        size: z.number().optional().describe('Number of results per page, maximum 500 (default 50). Use larger values (200-500) to reduce API calls for bulk operations.'),
        policy: z.string().optional().describe('Security policy name to filter by. Find applications using a specific security policy template.'),
        policy_compliance: z.enum(['DETERMINING', 'NOT_ASSESSED', 'DID_NOT_PASS', 'CONDITIONAL_PASS', 'VENDOR_REVIEW', 'PASSED']).optional().describe('Filter by policy compliance status. Use "DID_NOT_PASS" for failing applications, "PASSED" for compliant ones. Essential for compliance reporting.'),
        policy_compliance_checked_after: z.string().optional().describe('Filter to applications with policy compliance checked after this date (yyyy-MM-dd). Track recent compliance assessments.'),
        policy_guid: z.string().optional().describe('Security policy GUID to filter by (more precise than policy name). Use when you have the specific policy identifier.'),
        scan_status: z.array(z.enum(['CREATED', 'UNPUBLISHED', 'DELETED', 'PARTIAL_PUBLISH', 'PARTIAL_UNPUBLISH', 'INCOMPLETE', 'SCAN_SUBMITTED', 'IN_QUEUE', 'STOPPING', 'PAUSING', 'IN_PROGRESS', 'ANALYSIS_ERRORS', 'SCAN_CANCELED', 'INTERNAL_REVIEW', 'VERIFYING_RESULTS', 'SUBMITTED_FOR_NTO_PRE_SCAN', 'SUBMITTED_FOR_DYNAMIC_PRE_SCAN', 'PRE_SCAN_FAILED', 'READY_TO_SUBMIT', 'NTO_PENDING_SUBMISSION', 'PRE_SCAN_COMPLETE', 'MODULE_SELECTION_REQUIRED', 'PENDING_VENDOR_ACCEPTANCE', 'SHOW_OSRDB', 'PUBLISHED', 'PUBLISHED_TO_VENDOR', 'PUBLISHED_TO_ENTERPRISE', 'PENDING_ACCOUNT_APPROVAL', 'PENDING_LEGAL_AGREEMENT', 'SCAN_IN_PROGRESS', 'SCAN_IN_PROGRESS_PARTIAL_RESULTS_READY', 'PROMOTE_IN_PROGRESS', 'PRE_SCAN_CANCELED', 'NTO_PRE_SCAN_CANCELED', 'SCAN_HELD_APPROVAL', 'SCAN_HELD_LOGIN_INSTRUCTIONS', 'SCAN_HELD_LOGIN', 'SCAN_HELD_INSTRUCTIONS', 'SCAN_HELD_HOLDS_FINISHED', 'SCAN_REQUESTED', 'TIMEFRAMEPENDING_ID', 'PAUSED_ID', 'STATIC_VALIDATING_UPLOAD', 'PUBLISHED_TO_ENTERPRISEINT'])).optional().describe('Filter by current scan status. Use ["PUBLISHED"] for completed scans, ["IN_PROGRESS", "SCAN_IN_PROGRESS"] for active scans, ["ANALYSIS_ERRORS"] for failed scans.'),
        scan_type: z.enum(['STATIC', 'DYNAMIC', 'MANUAL']).optional().describe('Filter by scan type: STATIC (code analysis), DYNAMIC (runtime testing), MANUAL (penetration testing). Use to find applications with specific testing approaches.'),
        sort_by_custom_field_name: z.string().optional().describe('Custom field name to sort results by. Useful for organizing results by your organization\'s metadata.'),
        tag: z.string().optional().describe('Filter by application tag (exact match). Tags are used for categorization, environment marking (prod/dev), or team ownership.'),
        team: z.string().optional().describe('Filter by team name (exact match). Find applications owned or managed by a specific team.')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const applications = await context.veracodeClient.applications.getApplications(args);
          return {
            success: true,
            data: {
              count: applications.length,
              application_profiles: applications.map((app: any) => ({
                name: app.profile.name,
                guid: app.guid,
                id: app.id,
                legacy_id: app.id,
                business_criticality: app.profile.business_criticality,
                description: app.profile.description,
                tags: app.profile.tags ? app.profile.tags.split(',').map((tag: string) => tag.trim()) : [],
                teams: app.profile.teams?.map((team: any) => ({
                  name: team.team_name,
                  guid: team.guid,
                  team_id: team.team_id
                })) || [],
                business_unit: app.profile.business_unit ? {
                  name: app.profile.business_unit.name,
                  guid: app.profile.business_unit.guid,
                  id: app.profile.business_unit.id
                } : null,
                business_owners: app.profile.business_owners?.map((owner: any) => ({
                  name: owner.name,
                  email: owner.email
                })) || [],
                custom_fields: app.profile.custom_fields?.map((field: any) => ({
                  name: field.name,
                  value: field.value
                })) || [],
                custom_field_values: app.profile.custom_field_values?.map((fieldValue: any) => ({
                  field_name: fieldValue.app_custom_field_name?.name,
                  value: fieldValue.value,
                  id: fieldValue.id
                })) || [],
                policies: app.profile.policies?.map((policy: any) => ({
                  name: policy.name,
                  guid: policy.guid,
                  is_default: policy.is_default,
                  compliance_status: policy.policy_compliance_status
                })) || [],
                settings: app.profile.settings ? {
                  sca_enabled: app.profile.settings.sca_enabled,
                  dynamic_scan_approval_not_required: app.profile.settings.dynamic_scan_approval_not_required,
                  static_scan_dependencies_allowed: app.profile.settings.static_scan_dependencies_allowed,
                  nextday_consultation_allowed: app.profile.settings.nextday_consultation_allowed
                } : null,
                created_date: app.created,
                modified_date: app.modified,
                last_completed_scan_date: app.last_completed_scan_date,
                git_repo_url: app.profile.git_repo_url,
                archer_app_name: app.profile.archer_app_name,
                custom_kms_alias: app.profile.custom_kms_alias,
                // Veracode platform URLs for direct access
                app_profile_url: app.app_profile_url,
                results_url: app.results_url,
                scans: app.scans?.map((scan: any) => ({
                  scan_type: scan.scan_type,
                  status: scan.status,
                  internal_status: scan.internal_status,
                  modified_date: scan.modified_date,
                  scan_url: scan.scan_url
                })) || []
              }))
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching applications: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    },

    {
      name: 'search-application-profiles',
      description: 'Search for application profiles by name with smart matching and additional filters. This is the fastest way to find a specific application when you know its name (or part of it). Use this instead of get-application-profiles when you\'re looking for particular applications rather than browsing the full list. Supports partial name matching and key filtering options for refined results.',
      schema: {
        name: z.string().describe('Application profile name (or partial name) to search for. Supports fuzzy matching - e.g., "WebApp" will find "MyWebApp", "WebApp-Prod", etc. Case-insensitive search.'),
        business_unit: z.string().optional().describe('Filter results to specific business unit (exact match). Useful when multiple teams have similarly named applications.'),
        team: z.string().optional().describe('Filter by team name (exact match). Find applications owned by a specific development or security team.'),
        policy_compliance: z.enum(['DETERMINING', 'NOT_ASSESSED', 'DID_NOT_PASS', 'CONDITIONAL_PASS', 'VENDOR_REVIEW', 'PASSED']).optional().describe('Filter by security policy compliance status. Use "DID_NOT_PASS" to find failing applications, "PASSED" for compliant ones.'),
        tag: z.string().optional().describe('Filter by application tag (exact match). Tags often indicate environment (prod/dev), criticality, or ownership.'),
        page: z.number().optional().describe('Page number for pagination (starts at 0). Most searches return results on first page unless you have many similarly named applications.'),
        size: z.number().optional().describe('Number of results per page, maximum 500 (default 50). Use 10-20 for quick searches, larger values for comprehensive discovery.')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const searchResults = await context.veracodeClient.applications.getApplications({
            name: args.name,
            business_unit: args.business_unit,
            team: args.team,
            policy_compliance: args.policy_compliance,
            tag: args.tag,
            page: args.page,
            size: args.size
          });
          return {
            success: true,
            data: {
              query: args.name,
              count: searchResults.length,
              application_profiles: searchResults.map((app: any) => ({
                name: app.profile.name,
                guid: app.guid,
                id: app.id,
                legacy_id: app.id,
                business_criticality: app.profile.business_criticality,
                description: app.profile.description,
                tags: app.profile.tags ? app.profile.tags.split(',').map((tag: string) => tag.trim()) : [],
                teams: app.profile.teams?.map((team: any) => ({
                  name: team.team_name,
                  guid: team.guid,
                  team_id: team.team_id
                })) || [],
                business_unit: app.profile.business_unit ? {
                  name: app.profile.business_unit.name,
                  guid: app.profile.business_unit.guid,
                  id: app.profile.business_unit.id
                } : null,
                policies: app.profile.policies?.map((policy: any) => ({
                  name: policy.name,
                  guid: policy.guid,
                  is_default: policy.is_default,
                  compliance_status: policy.policy_compliance_status
                })) || [],
                created_date: app.created,
                modified_date: app.modified,
                last_completed_scan_date: app.last_completed_scan_date,
                // Veracode platform URLs for direct access
                app_profile_url: app.app_profile_url,
                results_url: app.results_url
              }))
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error searching applications: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    },

    {
      name: 'get-application-profile-details',
      description: 'Get comprehensive details for a specific application profile (security project) including configuration, policies, teams, and scan history. Use this when you need complete information about a single application for detailed analysis, security assessment, or configuration review. Essential for understanding application security posture and setup.',
      schema: {
        app_profile: z.string().describe('Application profile ID (GUID like "a1b2c3d4-e5f6-7890-abcd-ef1234567890") or exact application profile name (like "MyWebApp-Production"). Required to identify the specific application.')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          let result;

          if (isGuid(args.app_profile)) {
            // Handle as application ID
            result = await context.veracodeClient.applications.getApplicationDetails(args.app_profile);
          } else {
            // Handle as application name
            result = await context.veracodeClient.applications.getApplicationDetailsByName(args.app_profile);
          }

          return {
            success: true,
            data: {
              name: result.profile.name,
              id: result.guid,
              legacy_id: result.id,
              business_criticality: result.profile.business_criticality,
              teams:
                result.profile.teams?.map((team: any) => ({
                  name: team.team_name,
                  guid: team.guid,
                  team_id: team.team_id
                })) || [],
              tags: result.profile.tags ? result.profile.tags.split(',').map((tag: string) => tag.trim()) : [],
              description: result.profile.description,
              created_date: result.created,
              modified_date: result.modified,
              last_completed_scan_date: result.last_completed_scan_date,
              business_unit: result.profile.business_unit
                ? {
                  name: result.profile.business_unit.name,
                  guid: result.profile.business_unit.guid,
                  id: result.profile.business_unit.id
                }
                : null,
              business_owners:
                result.profile.business_owners?.map((owner: any) => ({
                  name: owner.name,
                  email: owner.email
                })) || [],
              settings: result.profile.settings
                ? {
                  sca_enabled: result.profile.settings.sca_enabled,
                  dynamic_scan_approval_not_required: result.profile.settings.dynamic_scan_approval_not_required,
                  static_scan_dependencies_allowed: result.profile.settings.static_scan_dependencies_allowed,
                  nextday_consultation_allowed: result.profile.settings.nextday_consultation_allowed
                }
                : null,
              custom_fields:
                result.profile.custom_fields?.map((field: any) => ({
                  name: field.name,
                  value: field.value
                })) || [],
              custom_field_values:
                result.profile.custom_field_values?.map((fieldValue: any) => ({
                  field_name: fieldValue.app_custom_field_name?.name,
                  value: fieldValue.value,
                  id: fieldValue.id
                })) || [],
              policies:
                result.profile.policies?.map((policy: any) => ({
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
              scans:
                result.scans?.map((scan: any) => ({
                  scan_type: scan.scan_type,
                  status: scan.status,
                  internal_status: scan.internal_status,
                  modified_date: scan.modified_date,
                  scan_url: scan.scan_url
                })) || []
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching application details: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    }
  ];
}
