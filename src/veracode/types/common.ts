// Common types shared across Veracode API interfaces

// Base CWE interface
export interface VeracodeCWE {
    id: number;
    name: string;
    href?: string;
}

// Base annotation interface
export interface VeracodeAnnotation {
    action: string;
    comment: string;
    created: string;
    user_name: string;
    remaining_risk?: string;
    specifics?: string;
    technique?: string;
    verification?: string;
}

// Pagination interfaces
export interface PageMetadata {
    number: number;
    size: number;
    total_elements: number;
    total_pages: number;
}

// Business criticality levels used across multiple entities
export type BusinessCriticality = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';

// Common scan types
export type ScanType = 'STATIC' | 'DYNAMIC' | 'MANUAL' | 'SCA';

// Common scan statuses (aligned with Swagger API v1.0 specification)
export type ScanStatus =
    | 'CREATED' | 'UNPUBLISHED' | 'DELETED' | 'PARTIAL_PUBLISH' | 'PARTIAL_UNPUBLISH'
    | 'INCOMPLETE' | 'SCAN_SUBMITTED' | 'IN_QUEUE' | 'STOPPING' | 'PAUSING' | 'IN_PROGRESS'
    | 'ANALYSIS_ERRORS' | 'SCAN_CANCELED' | 'INTERNAL_REVIEW' | 'VERIFYING_RESULTS'
    | 'SUBMITTED_FOR_NTO_PRE_SCAN' | 'SUBMITTED_FOR_DYNAMIC_PRE_SCAN' | 'PRE_SCAN_FAILED'
    | 'READY_TO_SUBMIT' | 'NTO_PENDING_SUBMISSION' | 'PRE_SCAN_COMPLETE'
    | 'MODULE_SELECTION_REQUIRED' | 'PENDING_VENDOR_ACCEPTANCE' | 'SHOW_OSRDB'
    | 'PUBLISHED' | 'PUBLISHED_TO_VENDOR' | 'PUBLISHED_TO_ENTERPRISE'
    | 'PENDING_ACCOUNT_APPROVAL' | 'PENDING_LEGAL_AGREEMENT' | 'SCAN_IN_PROGRESS'
    | 'SCAN_IN_PROGRESS_PARTIAL_RESULTS_READY' | 'PROMOTE_IN_PROGRESS'
    | 'PRE_SCAN_CANCELED' | 'NTO_PRE_SCAN_CANCELED' | 'SCAN_HELD_APPROVAL'
    | 'SCAN_HELD_LOGIN_INSTRUCTIONS' | 'SCAN_HELD_LOGIN' | 'SCAN_HELD_INSTRUCTIONS'
    | 'SCAN_HELD_HOLDS_FINISHED' | 'SCAN_REQUESTED' | 'TIMEFRAMEPENDING_ID'
    | 'PAUSED_ID' | 'STATIC_VALIDATING_UPLOAD' | 'PUBLISHED_TO_ENTERPRISEINT';

// Policy compliance statuses
export type PolicyComplianceStatus =
    | 'DETERMINING' | 'NOT_ASSESSED' | 'DID_NOT_PASS'
    | 'CONDITIONAL_PASS' | 'PASSED' | 'VENDOR_REVIEW';
