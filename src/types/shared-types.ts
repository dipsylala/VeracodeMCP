/**
 * Shared types used by both MCP and CLI systems
 */

/**
 * Standard tool response/result interface
 */
export interface ToolResponse {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Tool categories for organization - used by both MCP and CLI
 */
export enum ToolCategory {
    APPLICATION = 'application',
    SCAN = 'scan',
    FINDINGS = 'findings',
    SCA = 'sca',
    STATIC_ANALYSIS = 'static-analysis',
    POLICY = 'policy'
}

/**
 * Base tool call interface
 */
export interface ToolCall {
    tool: string;
    args?: Record<string, any>;
}
