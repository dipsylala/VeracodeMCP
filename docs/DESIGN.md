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
├── index.ts                      # MCP Server Entry Point  
├── veracode-rest-client.ts       # Veracode API REST Client
├── veracode-mcp-client.ts        # MCP Client & CLI Interface
├── cli/                          # CLI-specific implementations
│   ├── tool-handlers.ts          # CLI Tool Registry and Handlers
│   ├── sca-tools.ts              # CLI SCA Tool Implementations
│   └── findings-tools.ts         # CLI Findings Tool Implementations
├── tools/                        # MCP Tool Implementations
│   ├── tool.registry.ts          # Tool Registration System
│   ├── application.tools.ts      # Application Management Tools
│   ├── findings.tools.ts         # Findings & Vulnerability Tools  
│   ├── scan.tools.ts             # Scan Management Tools
│   ├── sca.tools.ts              # Software Composition Analysis Tools
│   ├── static-analysis.tools.ts  # Static Analysis Tools
│   └── policy.tools.ts           # Policy Compliance Tools
├── types/
│   └── tool.types.ts             # TypeScript Type Definitions
└── utils/
    └── logger.ts                 # Structured Logging Utility

examples/                         # Usage Examples & Test Scripts
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
- `get-application-details-by-id`: Get detailed application information by ID
- `get-application-details-by-name`: Get detailed application information by name
- `get-scan-results`: Retrieve scan results for an application by ID
- `get-scan-results-by-name`: Retrieve scan results for an application by name
- `get-findings-by-id`: Get findings summary and metadata by application ID
- `get-findings-by-name`: Get findings summary and metadata by application name
- `get-findings-paginated`: Get paginated findings results with advanced filtering
- `get-sca-results-by-name`: **COMPREHENSIVE SCA** - Detailed SCA analysis including exploitability, licensing, and component risk assessment
- `get-sca-summary`: High-level SCA overview with risk metrics and component statistics
- `get-sca-apps`: List all applications with SCA scanning enabled, including risk analysis
- `get-static-flaw-info-by-id`: **RECOMMENDED for flaw analysis** - Detailed static flaw information including data paths and call stack
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
- Command-line tool execution via tool registry
- Direct tool execution without MCP protocol overhead
- Response validation and formatting
- Debugging utilities with structured logging
- Support for all MCP server tools via CLI interface

**CLI Tool Registry** (`src/cli/tool-handlers.ts`):
- Modular tool organization by category (Application, Scan, Policy, SCA, Findings, Static Analysis)
- Base `ToolCategory` class for organized tool management
- Dynamic tool registration and discovery
- Consistent error handling and response formatting

### 4. Tool Registry System (`src/tools/tool.registry.ts`)

**Purpose**: Centralized tool registration and management system for MCP server tools.

**Features**:
- Dynamic tool registration by category
- Tool discovery and metadata management
- Category-based tool organization
- Tool count and summary statistics
- Type-safe tool handler registration

**Tool Categories**:
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

### Core Types

```typescript
// Union type for different finding types
type VeracodeFindingDetails = VeracodeSCAFinding | VeracodeStaticFinding | 
                             VeracodeDynamicFinding | VeracodeManualFinding;

// Type guards for runtime safety
function isSCAFinding(finding: VeracodeFindingDetails): finding is VeracodeSCAFinding
function isStaticFinding(finding: VeracodeFindingDetails): finding is VeracodeStaticFinding
function isDynamicFinding(finding: VeracodeFindingDetails): finding is VeracodeDynamicFinding
function isManualFinding(finding: VeracodeFindingDetails): finding is VeracodeManualFinding
```

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
   - Create tool handler in appropriate `src/tools/*.tools.ts` file
   - Define input schema with Zod validation
   - Implement tool handler function
   - Add tool to tool array export
   - Tool registry automatically registers it

2. **For CLI Tools** (optional):
   - Add method to appropriate category in `src/cli/tool-handlers.ts`
   - Follow `ToolCategory` pattern for organization
   - CLI tool registry automatically discovers it

3. **Create Example Usage**:
   - Add example script in `examples/` directory
   - Update `examples/README.md` with usage instructions
   - Add npm script to `package.json` if needed

4. **Update Documentation**:
   - Add tool description to this design document
   - Update README.md with new tool information
   - Add testing instructions to TESTING.md

### API Endpoint Extension

1. **Add API Methods**:
   - Implement new methods in `src/veracode-rest-client.ts`
   - Add comprehensive TypeScript interfaces
   - Include proper authentication and error handling
   - Follow existing patterns for consistency

2. **Create Tool Handlers**:
   - Add tool implementations that use new API methods
   - Include input validation and response formatting
   - Add to appropriate tool category file

3. **Testing and Examples**:
   - Create example scripts demonstrating new functionality
   - Add comprehensive testing coverage
   - Update documentation with new capabilities

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
- **Modular Tool System**: Plugin-based tool additions through tool registry
- **Custom Authentication**: Support for alternative authentication providers
- **Multiple API Backends**: Support for different Veracode API versions and environments
- **Enhanced Data Processing**: Custom data transformation and analysis pipelines
- **CLI and MCP Dual Mode**: Tools available both via MCP protocol and direct CLI access
- **Structured Logging Integration**: Pluggable logging backends and formatters

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
