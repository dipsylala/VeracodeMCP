# Integration Tests

This directory contains integration tests that make real API calls to the Veracode platform. These tests validate the complete functionality of the MCP server with live data.

## Directory Structure

### `mcp/` - MCP Protocol Integration Tests
Tests that communicate through the MCP protocol, testing the complete end-to-end flow from MCP client to Veracode API.

- `list-applications-mcp.js` - Test application listing via MCP
- `search-application-profiles-mcp.js` - Test application search via MCP
- `get-sca-results-mcp.js` - Test SCA analysis via MCP
- `static-findings-pagination-mcp.js` - Test static analysis pagination via MCP
- `sandbox-functionality-mcp.js` - Test sandbox workflows via MCP
- `policy-management-mcp.js` - Test policy compliance via MCP
- `policy-tools-mcp.js` - Test policy tools via MCP
- `test-verademo-net.js` - Test with known VeraDemo.NET application

### `api/` - Direct API Integration Tests
Tests that call the Veracode API directly, bypassing the MCP layer to test core functionality.

- `analyze-static-sca-findings.js` - Multi-finding type analysis
- `simple-direct-call.js` - Basic API connectivity test
- `direct-sca-api-call.js` - Direct SCA API testing
- `capture-actual-sca-response.js` - API response validation
- `capture-sca-rest-output.js` - REST API output validation
- `show-actual-sca-findings.js` - SCA findings validation
- `verify-swagger-compliance-rest.js` - API specification compliance

## Prerequisites

### 1. Valid Veracode API Credentials
```bash
# Windows PowerShell
$env:VERACODE_API_ID="your-api-id"
$env:VERACODE_API_KEY="your-api-key"

# Linux/Mac
export VERACODE_API_ID="your-api-id"
export VERACODE_API_KEY="your-api-key"
```

### 2. Test Data Requirements
- Applications with various scan types in your Veracode account
- Applications with SCA findings for comprehensive testing
- Applications with static analysis results
- Applications with policy configurations

### 3. Build the Project
```bash
npm run build
```

## Running Integration Tests

### Run All Tests via npm Scripts
```bash
# MCP integration tests
npm run test:integration:mcp

# API integration tests  
npm run test:integration:api
```

### Run Individual Tests
```bash
# Build first
npm run build

# Run specific MCP tests
node tests/integration/mcp/list-applications-mcp.js
node tests/integration/mcp/get-sca-results-mcp.js

# Run specific API tests
node tests/integration/api/simple-direct-call.js
node tests/integration/api/direct-sca-api-call.js
```

### Run Tests in VS Code
Use the VS Code command palette:
1. `Ctrl+Shift+P` → `Tasks: Run Task`
2. Select `Test: MCP Integration` or `Test: API Integration`

## Expected Behavior

### Success Criteria
- All tests complete without authentication errors
- API responses return expected data structures
- MCP protocol communication works correctly
- No network connectivity issues

### Common Issues and Solutions

#### Authentication Errors
```
❌ Error: Authentication failed
```
**Solution**: Verify your API credentials are correct and have proper permissions.

#### Application Not Found
```
❌ Error: Application not found
```
**Solution**: Ensure you have applications in your Veracode account, or modify test application names.

#### No Scan Data
```
❌ Error: No scan data available
```
**Solution**: Ensure your test applications have completed scans.

#### Rate Limiting
```
❌ Error: Rate limit exceeded
```
**Solution**: Wait and retry. Consider reducing concurrent test execution.

## Test Categories

### 🔄 **End-to-End Tests** (`mcp/`)
- Test complete MCP workflow
- Validate tool registration and discovery
- Test complex multi-step operations
- Validate response formatting

### 🔗 **API Connectivity Tests** (`api/`)
- Test direct API authentication
- Validate API response formats
- Test error handling scenarios
- Verify API specification compliance

## Recommended Test Applications

### VeraDemo.NET
A well-known test application that should be available in most Veracode accounts:
```bash
node tests/integration/mcp/test-verademo-net.js
```

### Custom Applications
For testing with your own applications, modify the application names in the test files or pass them as command-line arguments where supported.

## Debugging Integration Issues

### Enable Debug Logging
```bash
LOG_LEVEL=debug node tests/integration/mcp/list-applications-mcp.js
```

### Use Debug Tools
```bash
# Debug MCP protocol flow
npm run debug:mcp-flow

# Debug SCA client specifically
npm run debug:sca-client
```

### Check Network Connectivity
```bash
# Test basic API connection
npm run test:connection
```

## Contributing

When adding new integration tests:

1. **Place MCP tests in `mcp/`** - Tests that use the MCP protocol
2. **Place API tests in `api/`** - Tests that call APIs directly
3. **Include proper error handling** - Handle authentication, network, and data errors
4. **Add descriptive logging** - Help users understand test progress and issues
5. **Follow naming conventions** - Use descriptive filenames ending in appropriate suffixes

## Related Documentation

- [Testing Guide](../../docs/TESTING.md) - Complete testing strategy
- [Integration Guide](../../docs/INTEGRATION.md) - Setting up integrations
- [Design Documentation](../../docs/DESIGN.md) - Architecture overview
