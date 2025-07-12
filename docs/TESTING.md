# Veracode MCP Server Testing Guide

This document provides comprehensive testing procedures to verify that the Veracode MCP (Model Context Protocol) Server is working correctly in your environment.

## Prerequisites

### 1. Environment Setup
- Node.js 18+ installed
- Valid Veracode API credentials
- Access to at least one Veracode application

### 2. API Credentials Configuration
Create a `.env` file in the project root:
```env
VERACODE_API_ID=your_api_id_here
VERACODE_API_KEY=your_api_key_here
```

**Note**: Your API credentials must have appropriate permissions to access applications and scan results.

## Quick Verification Tests

### Test 1: Build and Basic Connection
```bash
# Build the project
npm run build

# Test API connection
npm run test:connection
```

**Expected Result**: 
- ✅ Build completes without errors
- ✅ Lists applications from your Veracode account
- ✅ Shows application details (GUID, business criticality, teams)

### Test 2: Application Search
```bash
# Search for applications (replace "Test" with a term that matches your apps)
node examples/query-apps.js "Test"
```

**Expected Result**:
- ✅ Finds and lists matching applications
- ✅ Shows application metadata
- ✅ No error messages

### Test 3: List All Available Applications
```bash
# Using the example script directly
node examples/list-apps.js
```

**Expected Result**:
- ✅ Lists all applications you have access to
- ✅ Provides guidance for running other examples
- ✅ Shows complete application metadata

## Comprehensive MCP Server Tests

### Test 4: Start MCP Server
```bash
npm run start
```

**Expected Result**:
- ✅ Server starts without errors
- ✅ Shows "Veracode MCP Server listening on stdio"
- ✅ No connection errors to Veracode API

**Note**: The MCP server runs in stdio mode for integration with MCP clients. Press Ctrl+C to stop.

### Test 5: MCP Tools Verification

The server provides these tools that can be tested via MCP clients:

1. **get-applications** - List all applications
2. **search-applications** - Search applications by name
3. **get-application-details** - Get detailed application information
4. **get-scan-results** - Get scan results for an application
5. **get-findings** - Get detailed findings from scans
6. **get-latest-sca-results** - Get latest SCA scan results
7. **get-sca-results-by-name** - Get SCA results by application name
8. **get-comprehensive-sca-analysis** - Detailed SCA analysis with exploitability data

## SCA-Specific Testing

### Test 6: Find Applications with SCA Scans
```bash
# Find all apps with SCA scans
node examples/find-sca-apps.js

# Find specific apps with SCA scans
node examples/find-sca-apps.js "YourAppFilter"
```

**Expected Result**:
- ✅ Lists applications that have SCA scans
- ✅ Shows SCA scan metadata
- ✅ Provides summary of findings

### Test 7: Get SCA Results (if you have apps with SCA scans)
```bash
# Replace "YourAppName" with an actual application name from your environment
node examples/get-sca-results.js "YourAppName"
```

**Expected Result**:
- ✅ Finds the specified application
- ✅ Retrieves SCA scan results
- ✅ Shows vulnerability details, severity breakdown, and policy violations
- ✅ Displays component information and licensing details

## Important Notes About SCA Integration

### SCA and Static Analysis Relationship
**Key Point**: SCA (Software Composition Analysis) results are generated as part of Veracode's static analysis process, not as separate scans.

**What This Means for Testing**:
- SCA findings appear in `STATIC` scan types
- Applications with static scans may contain both SAST and SCA findings
- The `get-scan-results` tool with `scan_type: "SCA"` filters findings, not scan types
- SCA-specific tools work by analyzing findings within static scans

**Testing Implications**:
- Look for applications with `STATIC` scans when testing SCA functionality
- SCA findings will be mixed with static analysis findings in the same scan
- Use SCA-specific tools to filter and analyze composition analysis results

## Troubleshooting Common Issues

### Issue 1: "Missing API credentials"
**Symptoms**: Error message about missing credentials
**Solution**: 
1. Verify `.env` file exists in project root
2. Check that `VERACODE_API_ID` and `VERACODE_API_KEY` are set
3. Ensure no extra spaces or quotes around values

### Issue 2: "No applications found"
**Symptoms**: Empty application list or search results
**Solution**:
1. Verify API credentials have correct permissions
2. Check if you're in the correct Veracode account/organization
3. Confirm applications exist in your account

### Issue 3: "No SCA scans found"
**Symptoms**: Applications listed but no SCA data
**Solution**:
1. Verify the application has completed SCA scans
2. Check that your API credentials have access to SCA results
3. Try with a different application that you know has SCA scans

### Issue 4: TypeScript compilation errors
**Symptoms**: Build fails with TypeScript errors
**Solution**:
1. Ensure Node.js 18+ is installed
2. Delete `node_modules` and `build` directories
3. Run `npm install` then `npm run build`

### Issue 5: Network connectivity issues
**Symptoms**: API timeout or connection errors
**Solution**:
1. Check internet connectivity
2. Verify you're not behind a restrictive firewall
3. Test API access directly via Veracode's web interface

## VS Code Integration Testing

### Test 8: VS Code Tasks
If using VS Code:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "Tasks: Run Task"
3. Test available tasks:
   - "Build Veracode MCP Server"
   - "Test Veracode Connection"
   - "Example: Get SCA Results (Custom App)"

**Expected Result**:
- ✅ All tasks execute without errors
- ✅ Custom app task prompts for application name
- ✅ Results display in integrated terminal

## Performance Verification

### Test 9: Large Dataset Handling
```bash
# Test with applications that have many findings
node examples/get-sca-results.js "AppWithManyFindings"
```

**Expected Result**:
- ✅ Handles large result sets gracefully
- ✅ Provides pagination or limits results appropriately
- ✅ Completes within reasonable time (< 30 seconds)

## Security Verification

### Test 10: Credential Security
1. Verify `.env` file is in `.gitignore`
2. Check that credentials don't appear in logs
3. Confirm API calls use VERACODE-HMAC-SHA-256 authentication

**Expected Result**:
- ✅ No credentials visible in terminal output
- ✅ Authentication headers properly formatted
- ✅ Secure credential handling

## Integration Testing with MCP Clients

### Test 11: Generic MCP Client (Advanced)
```bash
# Test with the generic MCP client
npm run build
node build/veracode-mcp-client.js
```

**Expected Result**:
- ✅ MCP client connects to server
- ✅ Lists available tools
- ✅ Can execute tool calls successfully

## Test Results Documentation

### Successful Test Checklist
Mark each completed test:
- [ ] Build and Basic Connection
- [ ] Application Search  
- [ ] List All Applications
- [ ] Start MCP Server
- [ ] Find Apps with SCA Scans
- [ ] Get SCA Results
- [ ] VS Code Tasks
- [ ] Performance Verification
- [ ] Security Verification
- [ ] Generic MCP Client

### Environment Information
Document your test environment:
- Node.js version: `node --version`
- npm version: `npm --version`
- Operating System: 
- Veracode account type: 
- Number of applications in account:
- Applications with SCA scans:

## Reporting Issues

If tests fail, please gather the following information:
1. Which test failed
2. Complete error message
3. Environment information (above)
4. Steps to reproduce
5. Expected vs. actual behavior

Submit issues with this information to help with debugging and resolution.

## Success Criteria

Your Veracode MCP Server installation is working correctly if:
✅ All basic connection tests pass
✅ Application data retrieval works
✅ MCP server starts without errors
✅ At least one SCA test completes (if you have SCA data)
✅ No security issues detected
✅ Performance is acceptable for your use case
