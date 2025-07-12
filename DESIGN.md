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
├── index.ts                 # MCP Server Entry Point
├── veracode-rest-client.ts       # Veracode API Client
└── veracode-mcp-client.ts    # Command-Line Client

examples/
├── get-sca-results.js       # SCA Results Example
├── find-sca-apps.js         # SCA Discovery Example
├── query-apps.js            # Application Search Example
├── list-apps.js             # List All Apps Example
└── test-search.js           # Search Testing Example
```

## Core Components

### 1. MCP Server (`src/index.ts`)

**Purpose**: Main MCP server implementation that handles tool registration and execution.

**Key Responsibilities**:
- Tool registration with the MCP framework
- Request routing to appropriate handlers
- Response formatting and error handling
- Input validation using Zod schemas

**Tools Provided**:
- `get-applications`: List all accessible applications
- `search-applications`: Search applications by name pattern
- `get-application-details`: Get detailed application information
- `get-scan-results`: Retrieve scan results for an application
- `get-findings`: Get detailed findings from scans
- `get-latest-sca-results`: Get latest SCA scan results
- `get-sca-results-by-name`: Get SCA results by application name
- `get-comprehensive-sca-analysis`: Advanced SCA analysis with exploitability data

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

**Purpose**: Testing utility for validating MCP server functionality.

**Features**:
- Direct MCP server communication
- Tool discovery and execution
- Response validation
- Debugging utilities

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

### Environment Variables

```env
VERACODE_API_ID=           # Required: API credentials ID
VERACODE_API_KEY=          # Required: API credentials secret key
VERACODE_BASE_URL=         # Optional: Override default API base URL
MCP_LOG_LEVEL=             # Optional: Logging level (debug, info, warn, error)
```

### Configuration Hierarchy

1. Environment variables (highest priority)
2. Configuration files
3. Default values (lowest priority)

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

```json
{
  "tasks": [
    {
      "label": "Example: Get SCA Results (Custom App)",
      "type": "shell",
      "command": "node",
      "args": ["examples/get-sca-results.js", "${input:appName}"],
      "group": "test"
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
```

### Production Deployment

- Environment variable configuration
- Process management (PM2, systemd)
- Logging and monitoring setup
- Security hardening

## Extension Points

### Adding New Tools

1. Define input schema with Zod
2. Implement tool handler in `index.ts`
3. Add corresponding method to `veracode-rest-client.ts`
4. Create example usage script
5. Update documentation

### API Endpoint Extension

1. Add new interface definitions
2. Implement client methods with type safety
3. Add error handling patterns
4. Include comprehensive testing

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

- Structured logging with levels
- Request/response correlation
- Performance metrics
- Error tracking

### Health Checks

- API connectivity validation
- Authentication status
- Server responsiveness
- Resource utilization

## Future Enhancements

### Planned Features

1. **Results Caching**: Implement intelligent caching for scan results
2. **Batch Processing**: Support for bulk operations
3. **Webhook Integration**: Real-time notifications for scan completion
4. **Advanced Analytics**: Enhanced data analysis and reporting
5. **Multi-tenant Support**: Support for multiple Veracode accounts

### Extensibility

The architecture supports:
- Plugin-based tool additions
- Custom authentication providers
- Alternative API backends
- Enhanced data processing pipelines

## Dependencies

### Core Dependencies

- `@modelcontextprotocol/sdk`: MCP framework implementation
- `axios`: HTTP client for API requests
- `zod`: Schema validation and type safety
- `crypto`: VERACODE-HMAC-SHA-256 authentication implementation

### Development Dependencies

- `typescript`: Type system and compilation
- `@types/node`: Node.js type definitions
- Various TypeScript configuration utilities

## Documentation Standards

- Comprehensive inline code documentation
- Type annotations for all public APIs
- Usage examples for all major features
- Integration guides for common scenarios
- Testing documentation for validation procedures

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

### Implementation Impact

This design affects how the MCP server retrieves SCA data:
1. **Scan Retrieval**: Look for `STATIC` scans that may contain SCA findings
2. **Finding Filtering**: Use finding type to distinguish between SAST and SCA results
3. **Comprehensive Analysis**: Combine both finding types for complete security assessment
