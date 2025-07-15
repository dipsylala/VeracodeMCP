// Sandbox-related types for Veracode API

export interface VeracodeSandbox {
    guid: string;
    id: number;
    name: string;
    application_guid: string;
    organization_id: number;
    owner_username?: string;
    auto_recreate?: boolean;
    created: string;
    modified: string;
    custom_fields?: Array<{
        name: string;
        value: string;
    }>;
}

// Query parameters for getSandboxes API
export interface SandboxQueryParams {
    page?: number;
    size?: number;
}

// Response structure for paginated sandbox results
export interface SandboxPagedResponse {
    _embedded?: {
        sandboxes: VeracodeSandbox[];
    };
    page?: {
        number: number;
        size: number;
        total_elements: number;
        total_pages: number;
    };
    _links?: any;
}
