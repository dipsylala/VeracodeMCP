# Unit Tests

This directory contains unit tests that use mocked dependencies to test individual components in isolation. These tests run quickly and don't require external API access.

## Test Files

### Core Testing
- `test-registry.js` - Tool registry testing and tool discovery
- `test-argument-validation.js` - Input validation and Zod schema testing
- `test-mcp-protocol.js` - MCP protocol compliance testing

### MCP Protocol Testing
- `test-real-mcp-call.js` - MCP call validation with mocked responses
- `test-mcp-sca.js` - SCA-specific MCP protocol testing

### Data Processing Testing
- `test-consolidation-summary.js` - Data consolidation and summarization logic
- `test-dependency-injection.js` - Dependency injection and service composition
- `test-direct-sca-findings.js` - SCA findings processing logic
- `test-swagger-alignment.js` - API specification alignment testing

### Display and Formatting Testing
- `test-flaw-id-display.js` - Flaw ID formatting and display logic
- `test-sca-cve-display.js` - CVE display formatting for SCA results

## Running Unit Tests

### Via npm Scripts
```bash
# Run all unit tests
npm run test:unit

# This runs:
# - test-registry.js
# - test-argument-validation.js 
# - test-mcp-protocol.js
```

### Individual Test Execution
```bash
# Build first
npm run build

# Run specific tests
node tests/unit/test-registry.js
node tests/unit/test-argument-validation.js
node tests/unit/test-mcp-protocol.js
```

### In VS Code
Use the command palette:
1. `Ctrl+Shift+P` → `Tasks: Run Task`
2. Select `Test: Unit Tests`

## Test Characteristics

### ✅ **Fast Execution**
- No external API calls
- Mocked dependencies
- Quick feedback during development

### 🔒 **No Credentials Required**
- Uses mocked Veracode client responses
- No authentication needed
- Safe for CI/CD pipelines

### 🎯 **Focused Testing**
- Tests specific components in isolation
- Validates individual functions and logic
- Focuses on edge cases and error conditions

## Test Categories

### 🔧 **Component Testing**
Tests individual functions and classes with mocked dependencies.

### 📋 **Schema Validation Testing**
Validates Zod schemas and input validation logic.

### 🔄 **Protocol Testing**
Tests MCP protocol compliance and message handling.

### 📊 **Data Processing Testing**
Tests data transformation, aggregation, and formatting logic.

## Mocking Strategy

### Veracode Client Mocking
```javascript
// Mock the Veracode client responses
const mockVeracodeClient = {
    applications: {
        searchApplications: jest.fn().mockResolvedValue(mockAppData)
    },
    findings: {
        getFindingsPaginated: jest.fn().mockResolvedValue(mockFindingsData)
    }
};
```

### MCP Protocol Mocking
```javascript
// Mock MCP request/response cycle
const mockMCPRequest = {
    params: {
        name: 'get-application-profiles',
        arguments: {}
    }
};
```

## Expected Outcomes

### ✅ Success Criteria
- All tests pass without external dependencies
- Schema validation works correctly
- Protocol compliance is maintained
- Data processing logic functions properly

### 🚨 Common Test Failures

#### Schema Validation Failures
```
❌ Error: Invalid input schema
```
**Solution**: Check Zod schema definitions and test input data.

#### Mock Setup Issues
```
❌ Error: Mock function not found
```
**Solution**: Verify mock implementations match the actual API interfaces.

#### Protocol Compliance Issues
```
❌ Error: MCP protocol violation
```
**Solution**: Check MCP message format and response structure.

## Adding New Unit Tests

### 1. Choose the Right Category
- **Component testing**: Test individual functions or classes
- **Schema testing**: Test input validation and type safety
- **Protocol testing**: Test MCP communication patterns
- **Data testing**: Test data transformation and processing

### 2. Follow Naming Conventions
- Use descriptive filenames: `test-[component]-[aspect].js`
- Include the purpose in the filename
- Group related tests together

### 3. Include Proper Mocking
```javascript
// Mock external dependencies
const mockClient = {
    // Implement required methods
};

// Test the component in isolation
const result = await componentFunction(mockClient, testInput);
```

### 4. Test Edge Cases
- Invalid inputs
- Empty responses
- Error conditions
- Boundary conditions

## Best Practices

### ✅ **Good Unit Test Practices**
- Test one thing at a time
- Use descriptive test names
- Include both positive and negative test cases
- Mock all external dependencies
- Keep tests fast and deterministic

### ❌ **Avoid in Unit Tests**
- Real API calls
- External service dependencies
- File system operations
- Network operations
- Database operations

## Related Testing

### Integration Tests
For testing with real API calls, see:
- `tests/integration/` - Integration tests with live API calls

### Debug Tools
For troubleshooting and analysis, see:
- `tools/debug/` - Debugging utilities
- `tools/inspect/` - Data inspection tools

## Contributing

When adding unit tests:

1. **Focus on isolated functionality** - Mock external dependencies
2. **Test error conditions** - Don't just test the happy path
3. **Use meaningful assertions** - Test specific expected behaviors
4. **Keep tests fast** - No external calls or slow operations
5. **Document complex test logic** - Explain what edge cases you're testing

## Related Documentation

- [Testing Guide](../../docs/TESTING.md) - Complete testing strategy
- [Design Documentation](../../docs/DESIGN.md) - Architecture and component overview
- [Contributing Guide](../../docs/CONTRIBUTING.md) - Development guidelines
