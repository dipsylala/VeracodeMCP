// Tool handler interface for modular architecture
export interface ToolHandler {
    name: string;
    description: string;
    schema: any;
    handler: (args: any, context: ToolContext) => Promise<ToolResponse>;
}

// Tool categories for organization
export enum ToolCategory {
    APPLICATION = 'application',
    SCAN = 'scan',
    FINDINGS = 'findings',
    SCA = 'sca',
    STATIC_ANALYSIS = 'static-analysis',
    POLICY = 'policy'
}

// Base tool response interface
export interface ToolResponse {
    success: boolean;
    data?: any;
    error?: string;
}

// Tool execution context
export interface ToolContext {
    veracodeClient: any; // Will be properly typed
}
