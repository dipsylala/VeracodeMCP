// Findings and scan-related types for Veracode API

import { VeracodeMitigation, VeracodeCWE, ScanType, PageMetadata } from './common.js';

// Base finding status interface
export interface VeracodeFindingStatus {
    first_found_date: string;
    last_seen_date?: string;
    status: string;
    resolution: string;
    resolution_status: string;
    new: boolean;
    mitigation_review_status?: string;
}

// Static Analysis finding details
export interface VeracodeStaticFinding {
    severity: number;
    cwe?: VeracodeCWE;
    cvss?: string;
    exploitability?: number;
    attack_vector?: string;
    file_line_number?: string;
    file_name?: string;
    file_path?: string;
    finding_category?: string;
    module?: string;
    procedure?: string;
    relative_location?: string;
}

// Dynamic Analysis finding details
export interface VeracodeDynamicFinding {
    severity: number;
    cwe?: VeracodeCWE;
    cvss?: string;
    attack_vector?: string;
    hostname?: string;
    port?: string;
    path?: string;
    plugin?: string;
    URL?: string;
    vulnerable_parameter?: string;
    discovered_by_vsa?: string;
    finding_category?: string;
}

// Manual finding details
export interface VeracodeManualFinding {
    severity: number;
    cwe?: VeracodeCWE;
    cvss?: string;
    capec_id?: string;
    exploit_desc?: string;
    exploit_difficulty?: string;
    input_vector?: string;
    location?: string;
    module?: string;
    remediation_desc?: string;
    severity_desc?: string;
}

// SCA-specific interfaces
export interface VeracodeSCALicense {
    license_id: string;
    risk_rating: string;
}

export interface VeracodeSCAExploitability {
    exploit_service_status: string;
    cve_full?: string;
    epss_status?: string;
    epss_score?: number;
    epss_percentile?: number;
    epss_score_date?: string;
    epss_model_version?: string;
    epss_citation?: string;
    exploit_observed?: boolean;
    exploit_source?: string;
    exploit_note?: string;
}

export interface VeracodeSCACVE {
    name: string;
    cvss: number;
    href: string;
    severity: string;
    vector: string;
    cvss3?: {
        score: number;
        severity: string;
        vector: string;
    };
    exploitability?: VeracodeSCAExploitability;
}

export interface VeracodeSCAComponentPath {
    path: string;
}

// SCA finding details
export interface VeracodeSCAFinding {
    severity: number;
    cwe?: VeracodeCWE;
    component_id?: string;
    licenses?: VeracodeSCALicense[];
    cve?: VeracodeSCACVE;
    version?: string;
    product_id?: string;
    component_filename?: string;
    language?: string;
    component_path?: VeracodeSCAComponentPath[];
    metadata?: string;
}

// Union type for all finding details
export type VeracodeFindingDetails =
    | VeracodeStaticFinding
    | VeracodeDynamicFinding
    | VeracodeManualFinding
    | VeracodeSCAFinding;

// Main finding interface
export interface VeracodeFinding {
    issue_id?: number;
    scan_type: ScanType;
    description: string;
    count: number;
    context_type: 'APPLICATION' | 'SANDBOX';
    context_guid: string;
    violates_policy: boolean;
    build_id?: number;
    grace_period_expires_date?: string;
    mitigations?: VeracodeMitigation[];
    finding_status: VeracodeFindingStatus;
    finding_details: VeracodeFindingDetails;
}

export interface VeracodePolicyCompliance {
    policy_compliance_status: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' | 'NOT_ASSESSED';
    total_findings: number;
    policy_violations: number;
    findings_by_severity: Record<string, number>;
    violations_by_severity: Record<string, number>;
    summary: {
        has_critical_violations: boolean;
        has_high_violations: boolean;
        total_open_violations: number;
    };
}

// Static flaw data path interfaces
export interface VeracodeStaticFlawCall {
    data_path: number;
    file_name: string;
    file_path: string;
    function_name: string;
    line_number: number;
}

export interface VeracodeStaticFlawDataPath {
    module_name: string;
    steps: number;
    local_path: string;
    function_name: string;
    line_number: number;
    calls: VeracodeStaticFlawCall[];
}

export interface VeracodeStaticFlawIssueSummary {
    app_guid: string;
    name: number;
    build_id: number;
    issue_id: number;
    sandbox_id?: string;
}

export interface VeracodeStaticFlawInfo {
    issue_summary: VeracodeStaticFlawIssueSummary;
    data_paths: VeracodeStaticFlawDataPath[];
    _links?: Array<{
        href: string;
        name?: string;
        templated?: boolean;
    }>;
}

export interface PagedFindingsResponse {
    _embedded?: {
        findings: VeracodeFinding[];
    };
    page: PageMetadata;
    _links?: {
        self?: { href: string };
        first?: { href: string };
        last?: { href: string };
        next?: { href: string };
        prev?: { href: string };
    };
}

export interface PaginatedFindingsResult {
    findings: VeracodeFinding[];
    pagination: {
        current_page: number;
        page_size: number;
        total_pages: number;
        total_elements: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

// Findings query options
export interface FindingsQueryOptions {
    scanType?: string;
    severity?: number;
    severityGte?: number;
    cwe?: number[];
    cvss?: number;
    cvssGte?: number;
    cve?: string;
    sandbox_id?: string;
    findingCategory?: number[];
    includeMitigations?: boolean;
    includeExpirationDate?: boolean;
    mitigatedAfter?: string;
    newFindingsOnly?: boolean;
    scaDependencyMode?: 'UNKNOWN' | 'DIRECT' | 'TRANSITIVE' | 'BOTH';
    scaScanMode?: 'UPLOAD' | 'AGENT' | 'BOTH';
    policyViolation?: boolean;
    page?: number;
    size?: number;
}
