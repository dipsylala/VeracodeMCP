// Policy management types for Veracode API

import { BusinessCriticality, ScanType } from './common.js';

// Policy management interfaces
export interface VeracodeCustomSeverity {
    cwe: number;
    severity: number;
}

export interface VeracodeScaLicenseSummary {
    full_name?: string;
    name?: string;
    risk?: 'Low' | 'Medium' | 'High' | 'Unknown';
    spdx_id: string;
    url?: string;
}

export interface VeracodeFindingRuleAdvancedOptions {
    all_licenses_must_meet_requirement?: boolean;
    allowed_nonoss_licenses?: boolean;
    is_blocklist?: boolean;
    selected_licenses?: VeracodeScaLicenseSummary[];
}

export interface VeracodeCoordinate {
    coordinate1?: string;
    coordinate2?: string;
    created_by?: string;
    created_date?: string;
    repo_type?: string;
    version?: string;
}

export interface VeracodeFindingRule {
    coordinates?: VeracodeCoordinate[];
    scan_type?: (ScanType | 'MOBILE' | 'ALL' | 'DYNAMICMP')[];
    type: 'FAIL_ALL' | 'CWE' | 'CATEGORY' | 'MAX_SEVERITY' | 'CVSS' | 'CVE' | 'BLACKLIST' | 'MIN_SCORE' | 'SECURITY_STANDARD' | 'LICENSE_RISK' | 'ALLOWLIST';
    advanced_options?: VeracodeFindingRuleAdvancedOptions;
    value?: string;
}

export interface VeracodeScanFrequency {
    frequency: 'NOT_REQUIRED' | 'ONCE' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY' | 'EVERY_18_MONTHS' | 'EVERY_2_YEARS' | 'EVERY_3_YEARS' | 'SET_BY_VL_POLICY' | 'SET_BY_POLICY_RULE';
    scan_type: ScanType | 'ANY';
}

export interface VeracodeCvssScoreGracePeriod {
    upper: number;
    lower: number;
    days: number;
}

export interface VeracodeSeverityGracePeriods {
    sev0_grace_period?: number;
    sev1_grace_period?: number;
    sev2_grace_period?: number;
    sev3_grace_period?: number;
    sev4_grace_period?: number;
}

export interface VeracodeScaGracePeriods {
    sca_blacklist_grace_period?: number;
    license_risk_grace_period?: number;
    severity_grace_period?: VeracodeSeverityGracePeriods;
    cvss_score_grace_period?: VeracodeCvssScoreGracePeriod[];
}

export interface VeracodePolicyVersion {
    category?: 'APPLICATION' | 'COMPONENT';
    created?: string;
    custom_severities?: VeracodeCustomSeverity[];
    description?: string;
    evaluation_date?: string;
    evaluation_date_type?: 'BEFORE' | 'AFTER';
    finding_rules?: VeracodeFindingRule[];
    sca_grace_periods?: VeracodeScaGracePeriods;
    guid?: string;
    modified_by?: string;
    name?: string;
    organization_id?: number;
    sca_blacklist_grace_period?: number; // deprecated
    scan_frequency_rules?: VeracodeScanFrequency[];
    score_grace_period?: number;
    sev0_grace_period?: number;
    sev1_grace_period?: number;
    sev2_grace_period?: number;
    sev3_grace_period?: number;
    sev4_grace_period?: number;
    sev5_grace_period?: number;
    type?: 'BUILTIN' | 'VERACODELEVEL' | 'CUSTOMER' | 'STANDARD';
    vendor_policy?: boolean;
    version?: number;
}

export interface VeracodePolicyListOptions {
    category?: 'APPLICATION' | 'COMPONENT';
    legacy_policy_id?: number;
    name?: string;
    name_exact?: boolean;
    page?: number;
    public_policy?: boolean;
    size?: number;
    vendor_policy?: boolean;
}

export interface VeracodePolicyListResponse {
    _embedded?: {
        policy_versions?: VeracodePolicyVersion[];
    };
    _links?: any;
}

export interface VeracodePolicySetting {
    business_criticality: BusinessCriticality;
    modified?: string;
    policy_guid: string;
}

export interface VeracodePolicySettingsResponse {
    _embedded?: {
        policy_settings?: VeracodePolicySetting[];
    };
    _links?: any;
}
