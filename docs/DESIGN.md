# Veracode MCP Server Design Documentation

This document outlines the architecture, design decisions, and implementation details of the Veracode Model Context Protocol (MCP) Server.

## Overview

The Veracode MCP Server is a TypeScript-based server that implements the Model Context Protocol to provide seamless integration between AI assistants and the Veracode Application Security Platform. It enables AI systems to query Veracode data, analyze security findings, and provide intelligent insights about application security.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Assistant  │◄──►│   MCP Server     │◄──►│  Veracode API   │
│   (Claude, etc) │    │  (This Project)  │    │   Platform      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Local Cache    │
                       │  (In Memory)     │
                       └──────────────────┘
```
## MCP Query Flow Architecture

### Detailed Request Flow

Understanding how an MCP query flows through the system is crucial for maintaining and extending the codebase. Here's the complete flow from AI assistant request to Veracode API response:

```
┌─────────────────┐   1. MCP Request     ┌──────────────────┐
│   AI Assistant  │ ───────────────────► │   MCP Server     │
│   (Claude, etc) │                      │   (index.ts)     │
└─────────────────┘                      └──────────────────┘
                                                  │
                                         2. Tool Discovery
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │   Tool Registry  │
                                         │ (tool.registry)  │
                                         └──────────────────┘
                                                  │
                                         3. Route to Handler
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │   Tool Handler   │
                                         │ (*.tools.ts)     │
                                         └──────────────────┘
                                                  │
                                         4. Input Validation
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │   Zod Schema     │
                                         │   Validation     │
                                         └──────────────────┘
                                                  │
                                         5. Create Context
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │  ToolContext     │
                                         │ {veracodeClient} │
                                         └──────────────────┘
                                                  │
                                         6. Business Logic
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │ Veracode Client  │
                                         │ (veracode-rest-  │
                                         │    client.ts)    │
                                         └──────────────────┘
                                                  │
                                         7. API Authentication
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │ HMAC-SHA256      │
                                         │ Authentication   │
                                         └──────────────────┘
                                                  │
                                         8. HTTP Request
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │  Veracode API    │
                                         │   Platform       │
                                         └──────────────────┘
                                                  │
                                         9. API Response
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │ Response Parser  │
                                         │ & Type Mapping   │
                                         └──────────────────┘
                                                  │
                                         10. Data Processing
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │   Tool Handler   │
                                         │ Business Logic   │
                                         └──────────────────┘
                                                  │
                                         11. Format Response
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │   ToolResponse   │
                                         │   Interface      │
                                         └──────────────────┘
                                                  │
                                         12. MCP Response
                                                  │
                                                  ▼
┌─────────────────┐                      ┌──────────────────┐
│   AI Assistant  │ ◄─────────────────── │   MCP Server     │
│    Response     │                      │   Response       │
└─────────────────┘                      └──────────────────┘
```

### Step-by-Step Flow Breakdown

#### 1. **MCP Request Initiation**
- AI assistant (Claude) sends MCP tool call request
- Request includes tool name and parameters
- MCP SDK handles protocol-level communication

#### 2. **Tool Discovery**
- `index.ts` receives the request via MCP SDK
- Tool Registry (`tool.registry.ts`) looks up the requested tool
- Registry returns tool handler and schema information

#### 3. **Route to Handler**
- Request is routed to appropriate tool handler in `*.tools.ts`
- Tool handler receives raw parameters from MCP request

#### 4. **Input Validation**
- Zod schema validates input parameters
- Type safety ensures parameters match expected format
- Validation errors return early with proper error response

#### 5. **Create Context**
- `ToolContext` object created with initialized `veracodeClient`
- Context provides access to all Veracode API methods
- Shared context ensures consistent authentication across tools

#### 6. **Business Logic Execution**
- Tool handler implements specific business logic
- May include multiple Veracode API calls
- Data processing, filtering, and analysis

#### 7. **API Authentication**
- Veracode client (`veracode-rest-client.ts`) handles HMAC-SHA256 auth
- Credentials loaded from environment variables
- Authentication headers automatically added to requests

#### 8. **HTTP Request to Veracode**
- Axios HTTP client sends authenticated requests
- Rate limiting and retry logic handled automatically
- Multiple API endpoints may be called (Applications, Findings, Scans)

#### 9. **API Response Processing**
- Raw API responses parsed and typed
- TypeScript interfaces ensure type safety
- Error handling for API failures

#### 10. **Data Processing**
- Business logic processes API data
- May include aggregation, filtering, risk analysis
- Additional API calls may be made based on initial results

#### 11. **Format Response**
- Results formatted into standardized `ToolResponse` interface
- Consistent structure: `{ success: boolean, data?: any, error?: string }`
- Rich metadata and analysis included in response

#### 12. **Return to AI Assistant**
- MCP server returns formatted response
- AI assistant receives structured data for analysis
- Response can be used for further queries or analysis

### Example: `get-sca-results` Flow

Let's trace through a specific example of how `get-sca-results` works:

```typescript
// 1. MCP Server Request (via Claude, VS Code, etc.)
{
  "tool": "get-sca-results",
  "arguments": {
    "application": "MyApp",
    "severity_gte": 4,
    "only_exploitable": true
  }
}

// 1b. Direct Client Request (via VeracodeMCPClient)
{
  "tool": "get-sca-results",
  "args": {
    "application": "MyApp",
    "severity_gte": 4,
    "only_exploitable": true
  }
}

// 2. Tool Discovery (tool.registry.ts)
const scaTools = createSCATools();
const handler = scaTools.find(t => t.name === 'get-sca-results');

// 3. Input Validation (sca.tools.ts)
const validatedArgs = GetSCAResultsSchema.parse(request.arguments);

// 4. Context Creation
const context = { veracodeClient: new VeracodeClient() };

// 5. Business Logic
// - Resolve application name to GUID
// - Fetch SCA findings with severity >= 4
// - Filter for exploitable vulnerabilities only
// - Perform risk analysis

// 6. Veracode API Calls
const searchResults = await veracodeClient.applications.searchApplications("MyApp");
// Get findings for an application (tools handle application resolution)
const appResolution = await validateAndResolveApplication(appIdentifier, veracodeClient);
const findings = await veracodeClient.findings.getFindingsPaginated(appResolution.guid, {
  scanType: 'SCA',
  severityGte: 4
});

// 7. Data Processing
const filteredFindings = findings.filter(f => 
  f.finding_details?.cve?.exploitability?.exploit_observed === true
);

// 8. Response Formatting
return {
  success: true,
  data: {
    application: { name: "MyApp", id: "guid-123" },
    analysis: { totalFindings: 15, exploitableFindings: 3 },
    detailed_findings: filteredFindings,
    metadata: { execution_time_ms: 1250 }
  }
};
```

### Key Maintenance Points

Understanding this flow helps with:

1. **Adding New Tools**: Follow the same pattern in `*.tools.ts` files
   - Create tool handler functions with proper Zod schema validation
   - Add to the appropriate category file (application.tools.ts, sca.tools.ts, etc.)
   - The ToolRegistry automatically discovers and registers new tools
   - Ensure tools return consistent `ToolResponse` format from shared-types.ts

2. **Debugging Issues**: Trace through each step to isolate problems
   - Check tool registration in ToolRegistry.getAllTools()
   - Verify input validation in Zod schemas
   - Monitor API calls through structured logging
   - Use examples/ directory tests to isolate tool-specific issues

3. **Performance Optimization**: Identify bottlenecks in API calls or processing
   - Monitor execution times in structured logs
   - Check for excessive API calls in service layer
   - Optimize pagination and filtering logic
   - Use category-based tool organization for efficient discovery

4. **Error Handling**: Understand where failures can occur and how to handle them
   - Input validation errors (Zod schema failures)
   - API authentication and authorization errors
   - Network connectivity and timeout issues
   - Data processing and transformation errors
   - Consistent error response format through ToolResponse interface

5. **Testing**: Know which components to mock and test independently
   - Use VeracodeMCPClient for integration testing
   - Mock BaseVeracodeClient for unit testing service layer
   - Test tool handlers with sample data using examples/ scripts
   - Validate tool registration and categorization through ToolRegistry methods


### Component Architecture

```
src/
├── index.ts                     # MCP Server Entry Point  
├── veracode-rest-client.ts      # Backward compatibility exports
├── veracode-mcp-client.ts       # Direct MCP client for testing/examples
├── types/                       # Shared Type Definitions
│   └── shared-types.ts          # Common interfaces and enums (ToolResponse, ToolCategory, ToolCall)
├── tools/                       # MCP Protocol Tool Implementations
│   ├── tool-types.ts            # MCP-specific types (ToolHandler, ToolContext)
│   ├── tool.registry.ts         # MCP Tool Registration System
│   ├── application.tools.ts     # Application management tools
│   ├── findings.tools.ts        # Findings and vulnerability tools
│   ├── sca.tools.ts             # Software Composition Analysis tools
│   ├── static-analysis.tools.ts # Static analysis tools
│   ├── scan.tools.ts            # Scan management tools
│   ├── policy.tools.ts          # Policy management tools
│   └── sandbox.tools.ts         # Sandbox tools
├── veracode/                    # Veracode API Integration Layer
│   ├── client/                  # Client implementation
│   │   ├── base-client.ts       # Base authentication and HTTP client
│   │   └── veracode-client.ts   # Main composed client
│   ├── services/                # Individual API service modules
│   │   ├── application-service.ts
│   │   ├── findings-service.ts
│   │   ├── policy-service.ts
│   │   ├── sandbox-service.ts
│   │   └── scan-service.ts
│   └── types/                   # Service-specific type definitions
└── utils/
    └── logger.ts                # Structured Logging Utility

examples/                        # Usage Examples & Test Scripts
├── analyze-static-sca-findings.js  # SCA Analysis Example
├── capture-actual-sca-response.js  # SCA Response Capture
├── debug-client-sca.js         # SCA Client Debugging
├── find-sca-apps-mcp.js        # SCA Discovery Example  
├── get-sca-results-mcp.js      # SCA Results Example
├── list-applications-mcp.js    # Application List Example
├── policy-management-mcp.js    # Policy Management Example
├── policy-tools-mcp.js         # Policy Tools Example
├── sandbox-functionality-mcp.js # Sandbox Testing Example
├── search-application-profiles-mcp.js # Application Search Example
├── static-findings-pagination-mcp.js # Static Analysis Example
├── test-verademo-net.js        # VeraDemo.NET Testing
└── README.md                   # Examples Documentation

docs/                            # Documentation
├── DESIGN.md                    # Architecture & Design
├── INTEGRATION.md               # Integration Guide
├── TESTING.md                   # Testing Guide
├── VSCODE_INTEGRATION.md        # VS Code Setup Guide
├── VSCODE_QUICK_START.md        # Quick Start Guide
├── VSCODE_CHAT_INTEGRATION.md   # Chat Integration Guide
├── PROJECT_STATUS.md            # Current Project Status
├── CONTRIBUTING.md              # Contribution Guidelines
├── CALL_VERIFICATION_REPORT.md  # API Call Analysis
└── HTML_ANALYSIS_REPORT.md      # API Response Analysis
```

## Core Components

### 1. MCP Server (`src/index.ts`)

**Purpose**: Main MCP server implementation that handles tool registration and execution.

**Key Responsibilities**:
- Tool registration with the MCP framework using tool registry
- Request routing to appropriate tool handlers
- Authentication and context management
- Response formatting and error handling
- Input validation using Zod schemas

**Tools Provided** (via MCP Server):
- `get-application-profiles`: List all accessible application profiles
- `search-application-profiles`: Search application profiles by name pattern
- `get-application-profile-details`: Get detailed application information by ID (GUID) or name
- `get-scan-results`: Retrieve scan results for an application by ID (GUID) or name  
- `get-findings`: **UNIFIED FINDINGS TOOL** - Get security findings with intelligent filtering and pagination. Two modes:
  - Basic Overview (no filters): Returns first 300 findings ordered by highest severity  
  - Filtered Mode (with filters/pagination): Applies filters and returns results with pagination support
- `get-sca-results`: **COMPREHENSIVE SCA** - Detailed SCA analysis including exploitability, licensing, and component risk assessment by application ID (GUID) or name
- `get-sca-summary`: High-level SCA overview with risk metrics and component statistics by application ID (GUID) or name
- `get-sca-apps`: List all applications with SCA scanning enabled, including risk analysis
- `get-sca-licenses`: Get SCA license information and risk analysis
- `get-static-flaw-info`: **RECOMMENDED for flaw analysis** - Detailed static flaw information including data paths and call stack by application ID (GUID) or name
- `get-sandbox-scans`: Get scan information for sandboxes
- `get-scans-by-sandbox`: Retrieve scans filtered by sandbox
- `compare-policy-vs-sandbox-scans`: Compare policy and sandbox scan results
- `get-policies`: List all accessible policies
- `get-policy`: Get detailed policy information
- `get-policy-versions`: Get policy version information
- `get-policy-version`: Get specific policy version details
- `get-policy-settings`: Get policy configuration settings
- `get-sandboxes`: List all sandboxes for an application by application ID (GUID) or name
- `get-sandbox-summary`: Get summary information for sandboxes by application ID (GUID) or name

### 2. Veracode API Client (Modular Architecture)

**Purpose**: Modular, service-based abstraction layer for Veracode API interactions with comprehensive type safety.

**Current Architecture**: The client has evolved from a monolithic `veracode-rest-client.ts` to a modular service-based architecture:

```
src/veracode/
├── client/
│   ├── base-client.ts           # Base authentication and HTTP client
│   └── veracode-client.ts       # Main composed client
├── services/                    # Individual API service modules
│   ├── application-service.ts   # Application management
│   ├── findings-service.ts      # Findings and vulnerability data
│   ├── policy-service.ts        # Policy management
│   ├── sandbox-service.ts       # Sandbox operations
│   └── scan-service.ts          # Scan operations
└── types/                       # Service-specific type definitions
```

**Key Features**:
- VERACODE-HMAC-SHA-256 authentication implementation via BaseVeracodeClient
- Type-safe API responses with comprehensive interfaces
- Service-based dependency injection for shared client instances
- Enhanced SCA analysis capabilities
- Error handling and retry logic
- Support for multiple Veracode API endpoints

**API Integration Points**:
- Applications API (REST v1) - via ApplicationService (`appsec/v1/applications`)
- Findings API (REST v2) - via FindingsService (`appsec/v2/applications/{id}/findings`)
- SCA Results API - via ScanService and FindingsService (REST v1/v2)
- Policy API (REST v1) - via PolicyService (`appsec/v1/policies`)
- Sandbox API (REST v1) - via SandboxService (`appsec/v1/applications/{id}/sandboxes`)
- Scan API (REST v1) - via ScanService (`appsec/v1/applications/{id}/scans`)

### 3. Tool Registry System

**MCP Tool Registry** (`src/tools/tool.registry.ts`):
**Purpose**: Centralized tool registration and management system for MCP server tools.

**Architecture Pattern**: Uses consistent factory function patterns:
- **Factory Functions**: Simple functions that return arrays of tool handlers
- **Shared Types**: Common interfaces and enums from `shared-types.ts`
- **Modular Organization**: Tools organized by category (Application, Scan, Policy, SCA, Findings, Static Analysis)
- **No Inheritance**: Simple function-based architecture for easy extension

**Features**:
- Dynamic tool registration by category
- Tool discovery and metadata management
- Category-based tool organization using shared `ToolCategory` enum
- Consistent error handling and response formatting using shared `ToolResponse` interface

**Tool Categories**:
- **Application Tools**: Application management and search
- **Findings Tools**: General findings and vulnerability data
- **Scan Tools**: Scan results and metadata
- **SCA Tools**: Software Composition Analysis
- **Static Analysis Tools**: Detailed flaw analysis and SAST data
- **Policy Tools**: Compliance and policy validation

### 4. Structured Logging (`src/utils/logger.ts`)

**Purpose**: Comprehensive logging system with structured output and multiple levels.

**Features**:
- Environment-configurable log levels (DEBUG, INFO, WARN, ERROR)
- Structured logging with context and metadata
- Tool execution tracking with timing
- Performance monitoring and debugging support
- Consistent log formatting across all components

## Type System Design

### Shared Type Architecture

The project uses a **two-tier type system** for maintainability and consistency:

```typescript
// 1. Shared Types (src/types/shared-types.ts)
export interface ToolResponse {
    success: boolean;
    data?: any;
    error?: string;
}

export enum ToolCategory {
    APPLICATION = 'application',
    SCAN = 'scan',
    FINDINGS = 'findings',
    SCA = 'sca',
    STATIC_ANALYSIS = 'static-analysis',
    POLICY = 'policy'
}

export interface ToolCall {
    tool: string;
    args?: Record<string, any>;
}

// 2. MCP-Specific Types (src/tools/tool-types.ts)
export interface ToolHandler {
    name: string;
    description: string;
    schema: any;
    handler: (args: any, context: ToolContext) => Promise<ToolResponse>;
}

export interface ToolContext {
    veracodeClient: any;
}
```

### Benefits of Shared Type System

- **Consistency**: All systems use the same response format (`ToolResponse`)
- **Single Source of Truth**: Common types defined once in `shared-types.ts`
- **No Duplication**: Eliminated redundant interfaces and type aliases
- **Clean Imports**: Simple re-exports without confusing workarounds
- **Maintainability**: Changes to shared concepts only need to be made in one place

### SCA Type System

The SCA type system provides comprehensive analysis capabilities:

```typescript
interface VeracodeSCAFinding {
  // Core vulnerability information
  vulnerability_id: string;
  cve_id?: string;
  severity: number;
  cvss_score?: number;
  
  // Component and library details
  component_id: string;
  component_filename: string;
  library: string;
  version: string;
  
  // Exploitability and risk assessment
  epss_score?: number;
  exploitability?: string;
  in_exploits?: boolean;
  
  // Licensing and compliance
  license_risk?: string;
  violated_policy_rules?: Array<{
    policy_name: string;
    rule_name: string;
    severity: string;
  }>;
}
```

## Authentication Design

### VERACODE-HMAC-SHA-256 Authentication Flow

```
1. API Request Preparation
   ├── Generate timestamp
   ├── Create request data string
   ├── Generate VERACODE-HMAC-SHA-256 signature
   └── Set Authorization header

2. Request Execution
   ├── Send authenticated request
   ├── Handle rate limiting
   └── Process response

3. Error Handling
   ├── Authentication failures
   ├── Permission errors
   └── Rate limit responses
```

### Security Considerations

- API credentials stored in environment variables
- No credential logging or exposure
- Secure VERACODE-HMAC-SHA-256 signature generation
- Proper error message sanitization

## Data Flow Design

### Application Query Flow

```
AI Request → MCP Server → Input Validation → Veracode Client → API Call → 
Response Processing → Type Conversion → MCP Response → AI Assistant
```

### SCA Analysis Flow

```
SCA Request → Application Lookup → Latest Scan Retrieval → 
Findings Processing → Exploitability Analysis → Risk Assessment → 
Policy Evaluation → Comprehensive Response
```

## Error Handling Strategy

### Error Categories

1. **Authentication Errors**: Invalid or missing API credentials
2. **Authorization Errors**: Insufficient permissions for requested data
3. **Network Errors**: API connectivity issues, timeouts
4. **Data Errors**: Invalid application IDs, missing scan data
5. **Validation Errors**: Invalid input parameters

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

## Performance Considerations

### Optimization Strategies

1. **Request Batching**: Combine multiple API calls where possible
2. **Response Caching**: Cache application metadata for repeated queries
3. **Pagination Handling**: Efficiently process large result sets
4. **Rate Limiting**: Respect Veracode API rate limits

### Memory Management

- Streaming large responses when possible
- Garbage collection of cached data
- Efficient data structures for findings processing

## Configuration Design

## Configuration Design

### Environment Variables

```env
# Required: API credentials
VERACODE_API_ID=           # Veracode API credentials ID
VERACODE_API_KEY=          # Veracode API credentials secret key

# Optional: Configuration overrides
VERACODE_API_BASE_URL=     # Override default API base URL
LOG_LEVEL=                 # Logging level (debug, info, warn, error) - default: info

# Optional: Performance tuning
MAX_RESULTS_PER_PAGE=      # Maximum results per API page (default: 500)
DEFAULT_TIMEOUT_MS=        # API request timeout in milliseconds (default: 30000)
```

### Configuration Hierarchy

1. **Environment variables** (highest priority)
2. **`.env` file** (local development)
3. **Default values** (lowest priority)

### Logging Configuration

The `LOG_LEVEL` environment variable controls logging verbosity:
- `debug`: All messages including detailed execution flow
- `info`: General information and tool execution summary (default)
- `warn`: Warning messages and non-critical issues
- `error`: Error messages only

## Integration Patterns

### MCP Client Integration

The server follows MCP specification patterns:

```typescript
// Tool registration pattern
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get-applications",
      description: "List all Veracode applications",
      inputSchema: GetApplicationsSchema
    }
    // ... more tools
  ]
}));

// Tool execution pattern
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // Route to appropriate handler
  // Validate inputs
  // Execute logic
  // Return formatted response
});
```

### VS Code Integration

**Task Configuration** (`.vscode/tasks.json`):
```json
{
  "tasks": [
    {
      "label": "Build Veracode MCP Server",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": "build"
    },
    {
      "label": "Start Veracode MCP Server",
      "type": "shell",
      "command": "node",
      "args": ["build/index.js"],
      "group": "build",
      "isBackground": true,
      "dependsOn": "Build Veracode MCP Server"
    },
    {
      "label": "Example: Get SCA Results (Custom App)",
      "type": "shell",
      "command": "node",
      "args": ["examples/get-sca-results.js", "${input:appName}"],
      "group": "test",
      "dependsOn": "Build Veracode MCP Server"
    }
  ],
  "inputs": [
    {
      "id": "appName",
      "description": "Application name for SCA analysis",
      "default": "YourAppName",
      "type": "promptString"
    }
  ]
}
```

**Claude Desktop Integration**:
```json
{
  "mcpServers": {
    "veracode": {
      "command": "node",
      "args": ["path/to/VeracodeMCP/build/index.js"],
      "env": {
        "VERACODE_API_ID": "your-api-id",
        "VERACODE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Testing Strategy

### Unit Testing Approach

- Type guard validation
- API client method testing
- Error handling verification
- Input validation testing

### Integration Testing

- End-to-end MCP communication
- Veracode API integration
- Authentication flow validation
- Error scenario testing

### Example Testing

- Parameterized example scripts
- Cross-platform compatibility
- User experience validation

## Deployment Considerations

### Development Setup

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run start        # Start MCP server
npm run dev          # Watch mode for development
```

### Testing MCP Tools

The MCP server tools can be tested using the example scripts provided:

```bash
# Pre-configured example scripts
npm run example:list-apps          # List all applications
npm run example:find-sca-apps      # Find SCA-enabled applications
npm run example:sca-results        # Get SCA results (with app name prompt)
npm run test:connection           # Test Veracode API connection
npm run test:search              # Test search functionality
```

## Extension Points

### Adding New Tools

1. **Create Tool Handler**:
   - Add tool handler in appropriate `src/tools/*.tools.ts` file
   - Define input schema with Zod validation
   - Implement tool handler function that returns `ToolResponse`
   - Add tool to tool array export
   - Tool registry automatically registers it

2. **Create Example Usage**:
   - Add example script in `examples/` directory
   - Update `examples/README.md` with usage instructions
   - Add npm script to `package.json` if needed

3. **Update Documentation**:
   - Add tool description to this design document
   - Update README.md with new tool information
   - Add testing instructions to TESTING.md

### Type System Extension

1. **Shared Types** (`src/types/shared-types.ts`):
   - Add new shared interfaces, enums, or types
   - Extend `ToolCategory` enum for new tool categories
   - Extend `ToolCall` interface for new parameter patterns

2. **MCP-Specific Types**:
   - Add types to `src/tools/tool-types.ts` for MCP-only concepts

3. **Consistency Guidelines**:
   - Use `ToolResponse` for all tool return values
   - Use shared `ToolCategory` for categorization
   - Re-export shared types from system-specific type files for convenience

### API Endpoint Extension

1. **Add API Methods**:
   - Implement new methods in `src/veracode-rest-client.ts`
   - Add comprehensive TypeScript interfaces
   - Include proper authentication and error handling
   - Follow existing patterns for consistency

2. **Create Tool Handlers**:
   - Add tool implementations that use new API methods
   - Include input validation and response formatting using shared `ToolResponse`
   - Add to appropriate tool category file using factory function pattern

3. **Testing and Examples**:
   - Create example scripts demonstrating new functionality
   - Add comprehensive testing coverage
   - Update documentation with new capabilities

## Architecture Decisions

### Simplified Tool Architecture

**Decision**: Replaced complex class-based inheritance with simple factory functions.

**Rationale**:
- **Eliminated Over-engineering**: The `ToolCategory` base classes provided no functional benefit
- **Improved Consistency**: The MCP system now uses a simple, maintainable pattern
- **Reduced Complexity**: Factory functions are easier to understand and maintain than inheritance hierarchies
- **Better Performance**: Direct function calls instead of class instantiation and method binding

**Implementation**:
```typescript
// Before: Complex inheritance
class ApplicationTools extends ToolCategory {
  getHandlers(): Record<string, ToolHandler> { ... }
}

// After: Simple factory function
export function createApplicationTools(client: VeracodeClient): ToolHandler[] {
  return [
    { name: "get-applications", handler: async (args) => { ... } }
  ];
}
```

### Shared Type System

**Decision**: Created a two-tier type system with shared common types.

**Rationale**:
- **Single Source of Truth**: Common concepts defined once
- **Eliminated Duplication**: No more redundant interfaces like `ToolResult` vs `ToolResponse`
- **Improved Consistency**: All systems use exactly the same response format
- **Better Maintainability**: Changes to shared concepts only require one edit

**Implementation**:
```typescript
// Shared types for common concepts
src/types/shared-types.ts: ToolResponse, ToolCategory, ToolCall

// MCP-specific types with re-exports
src/tools/tool-types.ts: ToolHandler, ToolContext + re-exports
```

## Security Design

### Data Protection

- No sensitive data persistence
- Secure credential handling
- Response data sanitization
- Audit trail capabilities

### Access Control

- Veracode platform permissions respected
- Role-based access through API credentials
- No privilege escalation
- Proper error message handling

## Monitoring and Observability

### Logging Strategy

- **Structured Logging**: Consistent format with context and metadata
- **Configurable Levels**: DEBUG, INFO, WARN, ERROR via `LOG_LEVEL` environment variable
- **Performance Metrics**: Tool execution timing and resource usage
- **Request/Response Correlation**: Track API calls and responses
- **Error Tracking**: Comprehensive error logging with stack traces
- **Tool Execution Logging**: Start/stop, arguments, results, and timing for all tools

### Health Checks

- **API Connectivity**: Automated validation of Veracode API accessibility
- **Authentication Status**: Verification of API credentials and permissions
- **Server Responsiveness**: MCP server startup and tool registration monitoring
- **Resource Utilization**: Memory and performance monitoring for large result sets
- **Tool Registry Health**: Verification of tool registration and discovery

## Extensibility

The architecture supports:
- **Modular Tool System**: Factory-function based tool additions through simplified registry
- **Shared Type System**: Consistent interfaces and responses across the system
- **Custom Authentication**: Support for alternative authentication providers
- **Multiple API Backends**: Support for different Veracode API versions and environments
- **Enhanced Data Processing**: Custom data transformation and analysis pipelines
- **MCP Integration**: Tools available via MCP protocol with consistent interfaces
- **Structured Logging Integration**: Pluggable logging backends and formatters
- **Zero Inheritance Overhead**: Simple function-based architecture for easy extension and testing

## Dependencies

### Core Dependencies

- `@modelcontextprotocol/sdk`: MCP framework implementation
- `axios`: HTTP client for API requests
- `zod`: Schema validation and type safety
- `crypto-js`: VERACODE-HMAC-SHA-256 authentication implementation
- `dotenv`: Environment variable management

### Development Dependencies

- `typescript`: Type system and compilation
- `@types/node`: Node.js type definitions
- `@types/crypto-js`: Crypto.js type definitions

### Build and Runtime

- **TypeScript Compilation**: ES modules with strict type checking
- **Node.js Runtime**: ES module support with import/export syntax
- **Environment Configuration**: `.env` file support for credentials and settings

## Documentation Standards

- **Comprehensive inline code documentation**: All public APIs and complex logic documented
- **Type annotations for all public APIs**: Full TypeScript type coverage with JSDoc
- **Usage examples for all major features**: Working examples in `examples/` directory
- **Integration guides for common scenarios**: Step-by-step setup and usage instructions
- **Testing documentation for validation procedures**: Comprehensive testing guide with troubleshooting
- **Architecture documentation**: This design document with implementation details
- **API response analysis**: Detailed documentation of Veracode API patterns and data structures

## Veracode Scan Type Integration

### Important: SCA and Static Analysis Relationship

**Key Understanding**: SCA (Software Composition Analysis) results are generated as part of Veracode's static analysis process, not as a separate scan type. This means:

- **Scan Type**: SCA findings are associated with `STATIC` scan types
- **Findings API**: SCA vulnerabilities are retrieved through the same findings endpoints as static analysis
- **Combined Results**: A single static scan can contain both SAST findings and SCA findings
- **Tool Design**: The MCP server tools account for this by filtering findings by type rather than scan type

### Scan Type Categories

```typescript
// Available scan types in Veracode
enum ScanType {
  STATIC = "STATIC",     // Includes both SAST and SCA findings
  DYNAMIC = "DYNAMIC",   // DAST findings only
  MANUAL = "MANUAL"      // Manual penetration testing findings
}

// Finding types within scans
enum FindingType {
  STATIC = "STATIC",     // Traditional SAST findings
  SCA = "SCA",          // Software Composition Analysis findings
  DYNAMIC = "DYNAMIC",   // DAST findings
  MANUAL = "MANUAL"      // Manual findings
}
```
