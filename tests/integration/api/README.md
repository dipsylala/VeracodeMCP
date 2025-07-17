# API Integration Tests

This directory contains integration tests that call the Veracode API directly, bypassing the MCP layer. These tests validate core API functionality and client behavior.

## Test Files

### Basic API Connectivity
- `simple-direct-call.js` - Basic API connectivity and authentication test
- `direct-sca-api-call.js` - Direct SCA API endpoint testing

### SCA API Testing
- `capture-actual-sca-response.js` - Capture and validate SCA API responses
- `capture-sca-rest-output.js` - Test SCA REST API output format
- `show-actual-sca-findings.js` - Validate SCA findings data structure

### Multi-Finding Analysis
- `analyze-static-sca-findings.js` - Combined static and SCA findings analysis

### API Compliance Testing
- `verify-swagger-compliance-rest.js` - Validate API specification compliance

## Running API Tests

### All API Tests
```bash
npm run test:integration:api
```

### Individual Tests
```bash
# Build first
npm run build

# Run specific tests
node tests/integration/api/simple-direct-call.js
node tests/integration/api/direct-sca-api-call.js
node tests/integration/api/analyze-static-sca-findings.js
```

### In VS Code
1. `Ctrl+Shift+P` → `Tasks: Run Task`
2. Select `Test: API Integration`

## What These Tests Validate

### 🔗 **Direct API Connectivity**
- HMAC-SHA256 authentication
- API endpoint accessibility
- Request/response format compliance
- Error handling for API failures

### 📊 **API Response Validation**
- Response data structure accuracy
- Data type consistency
- Required field presence
- Optional field handling

### 🔧 **Client Implementation**
- BaseVeracodeClient functionality
- Service layer implementation
- Error handling and retry logic
- Authentication header generation

## Prerequisites

### 1. API Credentials
```bash
# Windows PowerShell
$env:VERACODE_API_ID="your-api-id"
$env:VERACODE_API_KEY="your-api-key"

# Linux/Mac
export VERACODE_API_ID="your-api-id"
export VERACODE_API_KEY="your-api-key"
```

### 2. Test Applications
- Applications with completed scans
- Applications with SCA findings
- Applications with static analysis results
- Various application states for comprehensive testing

### 3. Build Project
```bash
npm run build
```

## Expected Behavior

### ✅ Success Indicators
- API authentication succeeds
- Response data matches expected schema
- All required fields are present
- Error handling works correctly

### 🚨 Common Issues

#### Authentication Failures
```
❌ Error: 401 Unauthorized
```
**Solution**: Verify API credentials and account permissions.

#### API Endpoint Issues
```
❌ Error: 404 Not Found
```
**Solution**: Check API endpoint URLs and Veracode account setup.

#### Data Format Issues
```
❌ Error: Unexpected response format
```
**Solution**: Verify API version compatibility and response parsing.

## API Test Categories

### 🔐 **Authentication Tests**
Validate HMAC-SHA256 authentication:
```bash
node tests/integration/api/simple-direct-call.js
```

### 📋 **SCA API Tests**
Test Software Composition Analysis endpoints:
```bash
node tests/integration/api/direct-sca-api-call.js
node tests/integration/api/capture-actual-sca-response.js
```

### 🔍 **Findings API Tests**
Test findings and vulnerability data:
```bash
node tests/integration/api/show-actual-sca-findings.js
node tests/integration/api/analyze-static-sca-findings.js
```

### 📋 **Compliance Tests**
Validate API specification compliance:
```bash
node tests/integration/api/verify-swagger-compliance-rest.js
```

## Debugging API Tests

### Enable API Debug Logging
```bash
LOG_LEVEL=debug node tests/integration/api/simple-direct-call.js
```

### Inspect Raw API Responses
```bash
# Capture and analyze API responses
node tests/integration/api/capture-actual-sca-response.js

# Inspect response structure
node tools/inspect/inspect-findings-structure.js
```

### Debug Authentication
```bash
# Debug HMAC signature generation
node tools/debug/debug-client-sca.js
```

## Test Data Analysis

### Response Validation
Tests capture and validate:
- Response status codes
- Response headers
- Data structure compliance
- Field type validation
- Required vs optional fields

### Data Structure Testing
```javascript
// Example validation pattern
const response = await client.findings.getFindingsPaginated(appId);

// Validate structure
assert(Array.isArray(response.findings));
assert(typeof response.pagination === 'object');
assert(typeof response.findings[0].finding_details === 'object');
```

### Error Scenario Testing
```javascript
// Test authentication failure
try {
    await clientWithBadCredentials.applications.getApplications();
    assert.fail('Should have thrown authentication error');
} catch (error) {
    assert(error.status === 401);
}
```

## API Endpoints Tested

### Applications API (`/appsec/v1/applications`)
- Application listing and search
- Application profile details
- Application metadata validation

### Findings API (`/appsec/v2/applications/{id}/findings`)
- Findings retrieval and pagination
- SCA findings specific testing
- Static analysis findings validation

### Scans API (`/appsec/v1/applications/{id}/scans`)
- Scan information retrieval
- Scan status validation
- Scan metadata testing

## Adding New API Tests

### 1. Create Test File
```javascript
// tests/integration/api/new-endpoint-test.js
import { VeracodeClient } from '../../../build/veracode/client/veracode-client.js';

async function testNewEndpoint() {
    const client = new VeracodeClient();
    // Test implementation
}

testNewEndpoint();
```

### 2. Test Pattern
```javascript
async function testAPIEndpoint() {
    try {
        const response = await client.someService.someMethod();
        
        // Validate response structure
        validateResponseStructure(response);
        
        // Test data content
        validateDataContent(response);
        
        console.log('✅ API test passed');
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        process.exit(1);
    }
}
```

### 3. Add to Test Suite
Update npm scripts and VS Code tasks to include new tests.

## Performance Testing

### Response Time Monitoring
```javascript
const startTime = Date.now();
const response = await client.findingsService.getFindings(appId);
const responseTime = Date.now() - startTime;

console.log(`API response time: ${responseTime}ms`);
```

### Rate Limiting Testing
```javascript
// Test API rate limits
for (let i = 0; i < 10; i++) {
    try {
        await client.applications.getApplications();
        await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
        if (error.status === 429) {
            console.log('Rate limit detected');
            break;
        }
    }
}
```

## Related Documentation

- [Veracode API Documentation](https://docs.veracode.com/r/c_rest_api) - Official API reference
- [Testing Guide](../../../docs/TESTING.md) - Complete testing strategy
- [Design Documentation](../../../docs/DESIGN.md) - Client architecture details
