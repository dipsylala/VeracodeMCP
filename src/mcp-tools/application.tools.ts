import { z } from 'zod';
import { MCPToolHandler, ToolContext, ToolResponse } from './mcp-types.js';

/**
 * Create application tools for MCP
 */
export function createApplicationTools(): MCPToolHandler[] {
  return [
    {
      name: 'get-applications',
      description: 'List applications in Veracode account with optional filtering',
      schema: {
        business_unit: z.string().optional().describe('Filter by business unit name'),
        custom_field_names: z.array(z.string()).optional().describe('Custom field names to search'),
        custom_field_values: z.array(z.string()).optional().describe('Custom field values to search'),
        legacy_id: z.number().optional().describe('The unique identifier of the Veracode Platform application'),
        modified_after: z.string().optional().describe('Filter results to only those modified after this date (yyyy-MM-dd)'),
        name: z.string().optional().describe('Application name to search for (URL-encode special characters)'),
        page: z.number().optional().describe('Page number (defaults to 0)'),
        size: z.number().optional().describe('Page size, up to 500 (default is 50)'),
        policy: z.string().optional().describe('Policy name to filter by'),
        policy_compliance: z.enum(['DETERMINING', 'NOT_ASSESSED', 'DID_NOT_PASS', 'CONDITIONAL_PASS', 'VENDOR_REVIEW', 'PASSED']).optional().describe('Filter by policy compliance status'),
        policy_compliance_checked_after: z.string().optional().describe('Filter to only those with policy compliance checked after this date (yyyy-MM-dd)'),
        policy_guid: z.string().optional().describe('Policy GUID to filter by'),
        scan_status: z.array(z.enum(['CREATED', 'UNPUBLISHED', 'DELETED', 'PARTIAL_PUBLISH', 'PARTIAL_UNPUBLISH', 'INCOMPLETE', 'SCAN_SUBMITTED', 'IN_QUEUE', 'STOPPING', 'PAUSING', 'IN_PROGRESS', 'ANALYSIS_ERRORS', 'SCAN_CANCELED', 'INTERNAL_REVIEW', 'VERIFYING_RESULTS', 'SUBMITTED_FOR_NTO_PRE_SCAN', 'SUBMITTED_FOR_DYNAMIC_PRE_SCAN', 'PRE_SCAN_FAILED', 'READY_TO_SUBMIT', 'NTO_PENDING_SUBMISSION', 'PRE_SCAN_COMPLETE', 'MODULE_SELECTION_REQUIRED', 'PENDING_VENDOR_ACCEPTANCE', 'SHOW_OSRDB', 'PUBLISHED', 'PUBLISHED_TO_VENDOR', 'PUBLISHED_TO_ENTERPRISE', 'PENDING_ACCOUNT_APPROVAL', 'PENDING_LEGAL_AGREEMENT', 'SCAN_IN_PROGRESS', 'SCAN_IN_PROGRESS_PARTIAL_RESULTS_READY', 'PROMOTE_IN_PROGRESS', 'PRE_SCAN_CANCELED', 'NTO_PRE_SCAN_CANCELED', 'SCAN_HELD_APPROVAL', 'SCAN_HELD_LOGIN_INSTRUCTIONS', 'SCAN_HELD_LOGIN', 'SCAN_HELD_INSTRUCTIONS', 'SCAN_HELD_HOLDS_FINISHED', 'SCAN_REQUESTED', 'TIMEFRAMEPENDING_ID', 'PAUSED_ID', 'STATIC_VALIDATING_UPLOAD', 'PUBLISHED_TO_ENTERPRISEINT'])).optional().describe('Filter by scan status'),
        scan_type: z.enum(['STATIC', 'DYNAMIC', 'MANUAL']).optional().describe('Filter by scan type'),
        sort_by_custom_field_name: z.string().optional().describe('Custom field name to sort by'),
        tag: z.string().optional().describe('Filter by tag'),
        team: z.string().optional().describe('Filter by team name')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const applications = await context.veracodeClient.getApplications(args);
          return {
            success: true,
            data: {
              count: applications.length,
              applications: applications.map((app: any) => ({
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
      name: 'search-applications',
      description: 'Search for applications by name with optional additional filters',
      schema: {
        name: z.string().describe('Application name (or partial name) to search for'),
        business_unit: z.string().optional().describe('Filter by business unit name'),
        team: z.string().optional().describe('Filter by team name'),
        policy_compliance: z.enum(['DETERMINING', 'NOT_ASSESSED', 'DID_NOT_PASS', 'CONDITIONAL_PASS', 'VENDOR_REVIEW', 'PASSED']).optional().describe('Filter by policy compliance status'),
        tag: z.string().optional().describe('Filter by tag'),
        page: z.number().optional().describe('Page number (defaults to 0)'),
        size: z.number().optional().describe('Page size, up to 500 (default is 50)')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const searchResults = await context.veracodeClient.getApplications({
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
              applications: searchResults.map((app: any) => ({
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
      name: 'get-application-details-by-id',
      description: 'Get detailed application information by ID',
      schema: {
        app_id: z.string().describe('Application ID (GUID)')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.getApplicationDetails(args.app_id);
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
    },

    {
      name: 'get-application-details-by-name',
      description: 'Get detailed application information by name',
      schema: {
        name: z.string().describe('Application name to search for')
      },
      handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
        try {
          const result = await context.veracodeClient.getApplicationDetailsByName(args.name);
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
            error: `Error fetching application details by name: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    }
  ];
}
