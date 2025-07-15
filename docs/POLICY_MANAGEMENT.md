# Veracode Policy Management API

This document describes the policy management functionality added to the Veracode MCP Server, which provides read-only access to Veracode policies, policy settings, and SCA license information.

## Overview

The policy management functionality is based on the Veracode Policy API v1 and provides access to:

- **Policies**: List and retrieve detailed information about security policies
- **Policy Versions**: Access historical versions of policies  
- **Policy Settings**: View default policy mappings for business criticality levels
- **SCA Licenses**: Retrieve information about component licenses for SCA policies

> **Note**: Policy compliance checking is handled by separate tools in the compliance category (`get-policy-compliance` and `get-policy-compliance-by-name`).

## Available Tools

### MCP Tools

#### `get-policies`
Get a list of policies with optional filtering.

**Parameters:**
- `category` (optional): Filter by policy category (`APPLICATION` or `COMPONENT`)
- `legacy_policy_id` (optional): Filter by legacy policy ID from the Veracode Platform
- `name` (optional): Filter by policy name (partial match)
- `name_exact` (optional): Use exact name matching instead of partial match
- `page` (optional): Page number (defaults to 0)
- `public_policy` (optional): Include/exclude public Veracode policies (defaults to true)
- `size` (optional): Page size (1-500, defaults to 50)
- `vendor_policy` (optional): Filter by vendor policy flag

**Example:**
```json
{
  "tool": "get-policies",
  "args": {
    "category": "APPLICATION",
    "size": 10
  }
}
```

#### `get-policy`
Get the latest version of a specific policy by GUID.

**Parameters:**
- `policy_guid` (required): The unique identifier (GUID) of the policy

**Example:**
```json
{
  "tool": "get-policy",
  "args": {
    "policy_guid": "12345678-1234-1234-1234-123456789abc"
  }
}
```

#### `get-policy-versions`
Get all versions of a specific policy.

**Parameters:**
- `policy_guid` (required): The unique identifier (GUID) of the policy
- `page` (optional): Page number (defaults to 0)
- `size` (optional): Page size (1-500, defaults to 50)

#### `get-policy-version`
Get a specific version of a policy.

**Parameters:**
- `policy_guid` (required): The unique identifier (GUID) of the policy
- `version` (required): The specific version number of the policy

#### `get-policy-settings`
Get policy settings (default policies for business criticality levels).

**Parameters:** None

#### `get-sca-licenses`
Get a list of component licenses for SCA policies.

**Parameters:**
- `page` (optional): Page number
- `size` (optional): Page size
- `sort` (optional): Sort order

### CLI Tools

All MCP tools have corresponding CLI tools with the same names and similar parameter structures.

## Policy Data Structure

### Policy Version (`VeracodePolicyVersion`)

```typescript
{
  category?: 'APPLICATION' | 'COMPONENT';
  created?: string;
  custom_severities?: CustomSeverity[];
  description?: string;
  evaluation_date?: string;
  evaluation_date_type?: 'BEFORE' | 'AFTER';
  finding_rules?: FindingRule[];
  sca_grace_periods?: ScaGracePeriods;
  guid?: string;
  modified_by?: string;
  name?: string;
  organization_id?: number;
  scan_frequency_rules?: ScanFrequency[];
  score_grace_period?: number;
  sev0_grace_period?: number;
  sev1_grace_period?: number;
  sev2_grace_period?: number;
  sev3_grace_period?: number;
  sev4_grace_period?: number;
  sev5_grace_period?: number;
  type?: 'BUILTIN' | 'VERACODELEVEL' | 'CUSTOMER' | 'STANDARD';
  vendor_policy?: boolean;
  version?: number;
}
```

### Policy Setting (`VeracodePolicySetting`)

```typescript
{
  business_criticality: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
  modified?: string;
  policy_guid: string;
}
```

### Finding Rule (`VeracodeFindingRule`)

```typescript
{
  coordinates?: Coordinate[];
  scan_type?: ('STATIC' | 'DYNAMIC' | 'MANUAL' | 'SCA' | 'MOBILE' | 'ALL' | 'DYNAMICMP')[];
  type: 'FAIL_ALL' | 'CWE' | 'CATEGORY' | 'MAX_SEVERITY' | 'CVSS' | 'CVE' | 'BLACKLIST' | 'MIN_SCORE' | 'SECURITY_STANDARD' | 'LICENSE_RISK' | 'ALLOWLIST';
  advanced_options?: FindingRuleAdvancedOptions;
  value?: string;
}
```

## Usage Examples

### Get All Application Policies

```javascript
const policies = await client.getPolicies({
  category: 'APPLICATION',
  size: 20
});

console.log(`Found ${policies._embedded?.policy_versions?.length} application policies`);
```

### Get Specific Policy Details

```javascript
const policy = await client.getPolicy('policy-guid-here');
console.log(`Policy: ${policy.name}`);
console.log(`Description: ${policy.description}`);
console.log(`Finding Rules: ${policy.finding_rules?.length || 0}`);
```

### Get Default Policy Settings

```javascript
const settings = await client.getPolicySettings();
settings._embedded?.policy_settings?.forEach(setting => {
  console.log(`${setting.business_criticality}: ${setting.policy_guid}`);
});
```

### Search Policies by Name

```javascript
const veracodePolicies = await client.getPolicies({
  name: 'Veracode',
  name_exact: false
});
```

## Testing

Two test scripts are provided to validate the policy functionality:

1. **test-policy-management.js**: Tests the direct API client methods
2. **test-policy-tools.js**: Tests the MCP tool implementations

Run these tests using the VS Code tasks:
- `Test Policy Management`
- `Test Policy Tools`

## Error Handling

All policy methods include proper error handling and will throw descriptive errors for:
- Invalid policy GUIDs
- Network connectivity issues
- Authentication failures
- API rate limiting
- Invalid parameters

## Limitations

This implementation provides **read-only** access to policy information. It does not include:
- Creating new policies
- Updating existing policies
- Deleting policies
- Modifying policy settings

These operations require additional permissions and are intentionally excluded for security purposes.

## API Reference

For complete API documentation, refer to the Veracode Policy API Specification at:
- https://api.veracode.com/ (Global Region)
- https://api.veracode.eu/ (European Region)
- https://api.veracode.us/ (US Federal Region)
