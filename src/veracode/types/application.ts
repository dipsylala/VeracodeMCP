// Application-related types for Veracode API

import { BusinessCriticality, PolicyComplianceStatus, ScanStatus, ScanType } from './common.js';

export interface VeracodeScan {
    scan_id?: string;
    scan_type: ScanType;
    status: ScanStatus;
    internal_status?: string;
    created_date?: string;
    modified_date: string;
    policy_compliance_status?: string;
    scan_url?: string;
    app_profile_url?: string;
    results_url?: string;
}

export interface VeracodeApplication {
    guid: string;
    id: number;
    oid?: number;
    organization_id?: number;
    created: string;
    modified: string;
    last_completed_scan_date?: string;
    app_profile_url?: string;
    results_url?: string;
    scans?: VeracodeScan[];
    profile: {
        name: string;
        business_criticality: BusinessCriticality;
        description?: string;
        tags?: string;
        archer_app_name?: string;
        git_repo_url?: string;
        custom_kms_alias?: string;
        teams?: Array<{
            guid: string;
            team_id: number;
            team_name: string;
        }>;
        policies?: Array<{
            guid: string;
            name: string;
            is_default?: boolean;
            policy_compliance_status: PolicyComplianceStatus;
        }>;
        business_unit?: {
            guid: string;
            id: number;
            name: string;
        };
        business_owners?: Array<{
            name: string;
            email: string;
        }>;
        settings?: {
            sca_enabled: boolean;
            dynamic_scan_approval_not_required: boolean;
            static_scan_dependencies_allowed: boolean;
            nextday_consultation_allowed: boolean;
        };
        custom_fields?: Array<{
            name: string;
            value: string;
        }>;
        custom_field_values?: Array<{
            id: number;
            field_name_id: number;
            value: string;
            app_custom_field_name?: {
                id: number;
                name: string;
                organization_id: number;
                sort_order: number;
                created: string;
                modified: string;
            };
        }>;
    };
}

// Query parameters for getApplications API
export interface ApplicationQueryParams {
    business_unit?: string;
    custom_field_names?: string[];
    custom_field_values?: string[];
    legacy_id?: number;
    modified_after?: string;
    name?: string;
    page?: number;
    size?: number;
    policy?: string;
    policy_compliance?: PolicyComplianceStatus;
    policy_compliance_checked_after?: string;
    policy_guid?: string;
    scan_status?: ScanStatus[];
    scan_type?: 'STATIC' | 'DYNAMIC' | 'MANUAL';
    sort_by_custom_field_name?: string;
    tag?: string;
    team?: string;
}
