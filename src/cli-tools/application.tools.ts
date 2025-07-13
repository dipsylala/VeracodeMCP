import { VeracodeClient } from "../veracode-rest-client.js";
import { CLIToolHandler, ToolResponse } from "./cli-types.js";

/**
 * Create application management tools for CLI
 */
export function createApplicationTools(client: VeracodeClient): CLIToolHandler[] {
    return [
        {
            name: "get-applications",
            handler: async (args: any): Promise<ToolResponse> => {
                const result = await client.getApplications();
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
        },

        {
            name: "search-applications",
            handler: async (args: any): Promise<ToolResponse> => {
                if (!args?.name) {
                    return { success: false, error: "Missing required argument: name" };
                }

                const result = await client.searchApplications(args.name);
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
        },

        {
            name: "get-application-details",
            handler: async (args: any): Promise<ToolResponse> => {
                if (!args?.app_id) {
                    return { success: false, error: "Missing required argument: app_id" };
                }

                const result = await client.getApplicationDetails(args.app_id);
                return {
                    success: true,
                    data: mapApplicationDetails(result)
                };
            }
        },

        {
            name: "get-application-details-by-name",
            handler: async (args: any): Promise<ToolResponse> => {
                if (!args?.name) {
                    return { success: false, error: "Missing required argument: name" };
                }

                const result = await client.getApplicationDetailsByName(args.name);
                return {
                    success: true,
                    data: mapApplicationDetails(result)
                };
            }
        }
    ];
}

function mapApplicationDetails(result: any) {
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
