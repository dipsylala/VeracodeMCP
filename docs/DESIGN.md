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

### Component Architecture

```
src/
├── index.ts                     # MCP Server Entry Point  
├── veracode-rest-client.ts      # Veracode API REST Client
├── veracode-mcp-client.ts       # MCP Client & CLI Interface
├── types/                       # Shared Type Definitions
│   └── shared-types.ts          # Common interfaces and enums (ToolResponse, ToolCategory, ToolCall)
├── cli-tools/                   # CLI-specific Tool System (Factory Pattern)
│   ├── cli-types.ts             # CLI-specific types (CLIToolHandler + re-exports)
│   ├── cli-tool-registry.ts     # CLI Tool Registry and Management
│   ├── *.tools.ts               # CLI tools broken up by category
├── mcp-tools/                   # MCP Protocol Tool Implementations
│   ├── mcp-types.ts             # MCP-specific types (ToolHandler, ToolContext + re-exports)
│   ├── mcp.tool.registry.ts     # MCP Tool Registration System
│   ├── *.tools.ts               # MCP tools broken up by category
└── utils/
    └── logger.ts                # Structured Logging Utility

examples/                        # Usage Examples & Test Scripts
├── get-sca-results.js           # SCA Results Example
├── find-sca-apps.js             # SCA Discovery Example  
├── query-apps.js                # Application Search Example
├── list-apps.js                 # List All Apps Example
├── test-search.js               # Search Testing Example
├── get-static-flaw-info.js      # Static Flaw Analysis Example
├── compare-analysis-approaches.js # Comparison Testing
├── inspect-api-responses.js     # API Response Analysis
└── README.md                    # Examples Documentation

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
- `get-applications`: List all accessible applications
- `search-applications`: Search applications by name pattern
- `get-application-details`: Get detailed application information by ID
- `get-application-details-by-name`: Get detailed application information by name
- `get-scan-results`: Retrieve scan results for an application by ID
- `get-scan-results-by-name`: Retrieve scan results for an application by name
- `get-findings`: Get findings summary and metadata by application ID
- `get-findings-by-name`: Get findings summary and metadata by application name (basic)
- `get-findings-advanced-by-name`: Get findings with comprehensive filtering and pagination support
- `get-findings-paginated`: Get paginated findings results with detailed pagination control
- `get-sca-results-by-name`: **COMPREHENSIVE SCA** - Detailed SCA analysis including exploitability, licensing, and component risk assessment
- `get-sca-summary-by-name`: High-level SCA overview with risk metrics and component statistics
- `get-sca-apps`: List all applications with SCA scanning enabled, including risk analysis
- `get-static-flaw-info`: **RECOMMENDED for flaw analysis** - Detailed static flaw information including data paths and call stack
- `get-static-flaw-info-by-name`: **RECOMMENDED for flaw analysis** - Detailed static flaw information by application name and flaw ID
- `get-policy-compliance`: Check policy compliance by application ID
- `get-policy-compliance-by-name`: Check policy compliance by application name

### 2. Veracode API Client (`src/veracode-rest-client.ts`)

**Purpose**: Abstraction layer for Veracode API interactions with comprehensive type safety.

**Key Features**:
- VERACODE-HMAC-SHA-256 authentication implementation
- Type-safe API responses with comprehensive interfaces
- Enhanced SCA analysis capabilities
- Error handling and retry logic
- Support for multiple Veracode API endpoints

**API Integration Points**:
- Applications API (REST v3)
- Findings API 
- SCA Results API
- Results API (XML-based legacy endpoints)

### 3. Veracode MCP Client (`src/veracode-mcp-client.ts`)

**Purpose**: Command-line interface and testing utility for validating MCP server functionality.

**Features**:
- Command-line tool execution via simplified CLI tool registry
- Direct tool execution without MCP protocol overhead using factory functions
- Response validation and formatting with shared `ToolResponse` interface
- Debugging utilities with structured logging
- Support for all MCP server tools via CLI interface

**CLI Tool Registry Architecture**:
- **Factory Function Pattern**: Each tool category exports a `createXXXTools(client)` function
- **Simplified Registration**: No complex inheritance - just arrays of `CLIToolHandler` objects
- **Shared Types**: Uses `ToolCategory` enum and `ToolResponse` interface from shared types
- **Consistent Error Handling**: All tools return `ToolResponse` format for consistency

### 4. Tool Registry System

**MCP Tool Registry** (`src/mcp-tools/mcp.tool.registry.ts`):
**Purpose**: Centralized tool registration and management system for MCP server tools.

**CLI Tool Registry** (`src/cli-tools/cli-tool-registry.ts`):
**Purpose**: Simplified factory-function based tool registry for CLI tools.

**Architecture Pattern**: Both systems now use consistent patterns:
- **Factory Functions**: Simple functions that return arrays of tool handlers
- **Shared Types**: Common interfaces and enums from `shared-types.ts`
- **Modular Organization**: Tools organized by category (Application, Scan, Policy, SCA, Findings, Static Analysis)
- **No Inheritance**: Eliminated complex class hierarchies in favor of simple functions

**Shared Features**:
- Dynamic tool registration by category
- Tool discovery and metadata management
- Category-based tool organization using shared `ToolCategory` enum
- Consistent error handling and response formatting using shared `ToolResponse` interface

**Tool Categories** (shared between CLI and MCP):
- **Application Tools**: Application management and search
- **Findings Tools**: General findings and vulnerability data
- **Scan Tools**: Scan results and metadata
- **SCA Tools**: Software Composition Analysis
- **Static Analysis Tools**: Detailed flaw analysis and SAST data
- **Policy Tools**: Compliance and policy validation

### 5. Structured Logging (`src/utils/logger.ts`)

**Purpose**: Comprehensive logging system with structured output and multiple levels.

**Features**:
- Environment-configurable log levels (DEBUG, INFO, WARN, ERROR)
- Structured logging with context and metadata
- Tool execution tracking with timing
- Performance monitoring and debugging support
- Consistent log formatting across all components

## Type System Design

### Shared Type Architecture

The project uses a **three-tier type system** for maintainability and consistency:

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

// 2. MCP-Specific Types (src/mcp-tools/mcp-types.ts)
export interface ToolHandler {
    name: string;
    description: string;
    schema: any;
    handler: (args: any, context: ToolContext) => Promise<ToolResponse>;
}

export interface ToolContext {
    veracodeClient: any;
}

// 3. CLI-Specific Types (src/cli-tools/cli-types.ts)
export interface CLIToolHandler {
    name: string;
    handler: (args: any) => Promise<ToolResponse>;
}
```

### Benefits of Shared Type System

- **Consistency**: Both CLI and MCP systems use the same response format (`ToolResponse`)
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

### CLI Usage

```bash
# Build and run CLI tools
npm run build
node build/veracode-mcp-client.js <tool-name> [args...]

# Available tools via CLI
node build/veracode-mcp-client.js get-applications
node build/veracode-mcp-client.js get-sca-results-by-name --name "MyApp"
node build/veracode-mcp-client.js get-static-flaw-info-by-name --name "MyApp" --issue_id "123"
```

### Example Scripts

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

1. **For MCP Server Tools**:
   - Create tool handler in appropriate `src/mcp-tools/*.tools.ts` file
   - Define input schema with Zod validation
   - Implement tool handler function that returns `ToolResponse`
   - Add tool to tool array export
   - Tool registry automatically registers it

2. **For CLI Tools** (optional):
   - Add tool to appropriate `src/cli-tools/*.tools.ts` file  
   - Follow factory function pattern: `createXXXTools(client: VeracodeClient)`
   - Return `CLIToolHandler` objects with `ToolResponse` format
   - CLI tool registry automatically discovers it via factory function

3. **Create Example Usage**:
   - Add example script in `examples/` directory
   - Update `examples/README.md` with usage instructions
   - Add npm script to `package.json` if needed

4. **Update Documentation**:
   - Add tool description to this design document
   - Update README.md with new tool information
   - Add testing instructions to TESTING.md

### Type System Extension

1. **Shared Types** (`src/types/shared-types.ts`):
   - Add new shared interfaces, enums, or types used by both systems
   - Extend `ToolCategory` enum for new tool categories
   - Extend `ToolCall` interface for new parameter patterns

2. **System-Specific Types**:
   - **MCP**: Add types to `src/mcp-tools/mcp-types.ts` for MCP-only concepts
   - **CLI**: Add types to `src/cli-tools/cli-types.ts` for CLI-only concepts

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
   - Add tool implementations that use new API methods in both MCP and CLI systems
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
- **Improved Consistency**: Both CLI and MCP systems now use the same simple pattern
- **Reduced Complexity**: Factory functions are easier to understand and maintain than inheritance hierarchies
- **Better Performance**: Direct function calls instead of class instantiation and method binding

**Implementation**:
```typescript
// Before: Complex inheritance
class ApplicationTools extends ToolCategory {
  getHandlers(): Record<string, ToolHandler> { ... }
}

// After: Simple factory function
export function createApplicationTools(client: VeracodeClient): CLIToolHandler[] {
  return [
    { name: "get-applications", handler: async (args) => { ... } }
  ];
}
```

### Shared Type System

**Decision**: Created a three-tier type system with shared common types.

**Rationale**:
- **Single Source of Truth**: Common concepts defined once
- **Eliminated Duplication**: No more redundant interfaces like `ToolResult` vs `ToolResponse`
- **Improved Consistency**: Both systems use exactly the same response format
- **Better Maintainability**: Changes to shared concepts only require one edit

**Implementation**:
```typescript
// Shared types for common concepts
src/types/shared-types.ts: ToolResponse, ToolCategory, ToolCall

// System-specific types with re-exports
src/mcp-tools/mcp-types.ts: ToolHandler, ToolContext + re-exports
src/cli-tools/cli-types.ts: CLIToolHandler + re-exports
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
- **Modular Tool System**: Factory-function based tool additions through simplified registries
- **Shared Type System**: Consistent interfaces and responses across CLI and MCP systems
- **Custom Authentication**: Support for alternative authentication providers
- **Multiple API Backends**: Support for different Veracode API versions and environments
- **Enhanced Data Processing**: Custom data transformation and analysis pipelines
- **CLI and MCP Dual Mode**: Tools available both via MCP protocol and direct CLI access with consistent interfaces
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
