import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';
import { logger } from './utils/logger.js';
import { loadVeracodeCredentials } from './utils/credentials.js';

export interface VeracodeApplication {
  guid: string;
  id: number;
  oid?: number;
  organization_id?: number;
  created: string;
  modified: string;
  last_completed_scan_date?: string;
  app_profile_url?: string;
  results_url?: string;
  scans?: VeracodeScan[];
  profile: {
    name: string;
    business_criticality: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
    description?: string;
    tags?: string;
    archer_app_name?: string;
    git_repo_url?: string;
    custom_kms_alias?: string;
    teams?: Array<{
      guid: string;
      team_id: number;
      team_name: string;
    }>;
    policies?: Array<{
      guid: string;
      name: string;
      is_default?: boolean;
      policy_compliance_status: 'DETERMINING' | 'NOT_ASSESSED' | 'DID_NOT_PASS' | 'CONDITIONAL_PASS' | 'PASSED' | 'VENDOR_REVIEW';
    }>;
    business_unit?: {
      guid: string;
      id: number;
      name: string;
    };
    business_owners?: Array<{
      name: string;
      email: string;
    }>;
    settings?: {
      sca_enabled: boolean;
      dynamic_scan_approval_not_required: boolean;
      static_scan_dependencies_allowed: boolean;
      nextday_consultation_allowed: boolean;
    };
    custom_fields?: Array<{
      name: string;
      value: string;
    }>;
    custom_field_values?: Array<{
      id: number;
      field_name_id: number;
      value: string;
      app_custom_field_name?: {
        id: number;
        name: string;
        organization_id: number;
        sort_order: number;
        created: string;
        modified: string;
      };
    }>;
  };
}

export interface VeracodeScan {
  scan_id?: string;
  scan_type: 'STATIC' | 'DYNAMIC' | 'MANUAL' | 'SCA';
  status: 'CREATED' | 'UNPUBLISHED' | 'DELETED' | 'PARTIAL_PUBLISH' | 'PARTIAL_UNPUBLISH' | 'INCOMPLETE' | 'SCAN_SUBMITTED' | 'IN_QUEUE' | 'STOPPING' | 'PAUSING' | 'IN_PROGRESS' | 'ANALYSIS_ERRORS' | 'SCAN_CANCELED' | 'INTERNAL_REVIEW' | 'VERIFYING_RESULTS' | 'SUBMITTED_FOR_NTO_PRE_SCAN' | 'SUBMITTED_FOR_DYNAMIC_PRE_SCAN' | 'PRE_SCAN_FAILED' | 'READY_TO_SUBMIT' | 'NTO_PENDING_SUBMISSION' | 'PRE_SCAN_COMPLETE' | 'MODULE_SELECTION_REQUIRED' | 'PENDING_VENDOR_ACCEPTANCE' | 'SHOW_OSRDB' | 'PUBLISHED' | 'PUBLISHED_TO_VENDOR' | 'PUBLISHED_TO_ENTERPRISE' | 'PENDING_ACCOUNT_APPROVAL' | 'PENDING_LEGAL_AGREEMENT' | 'SCAN_IN_PROGRESS' | 'SCAN_IN_PROGRESS_PARTIAL_RESULTS_READY' | 'PROMOTE_IN_PROGRESS' | 'PRE_SCAN_CANCELED' | 'NTO_PRE_SCAN_CANCELED' | 'SCAN_HELD_APPROVAL' | 'SCAN_HELD_LOGIN_INSTRUCTIONS' | 'SCAN_HELD_LOGIN' | 'SCAN_HELD_INSTRUCTIONS' | 'SCAN_HELD_HOLDS_FINISHED' | 'SCAN_REQUESTED' | 'TIMEFRAMEPENDING_ID' | 'PAUSED_ID' | 'STATIC_VALIDATING_UPLOAD' | 'PUBLISHED_TO_ENTERPRISEINT';
  internal_status?: string;
  created_date?: string;
  modified_date: string;
  policy_compliance_status?: string;
  scan_url?: string;
  app_profile_url?: string;
  results_url?: string;
}

// Query parameters for getApplications API
export interface ApplicationQueryParams {
  business_unit?: string;
  custom_field_names?: string[];
  custom_field_values?: string[];
  legacy_id?: number;
  modified_after?: string;
  name?: string;
  page?: number;
  size?: number;
  policy?: string;
  policy_compliance?: 'DETERMINING' | 'NOT_ASSESSED' | 'DID_NOT_PASS' | 'CONDITIONAL_PASS' | 'VENDOR_REVIEW' | 'PASSED';
  policy_compliance_checked_after?: string;
  policy_guid?: string;
  scan_status?: Array<'CREATED' | 'UNPUBLISHED' | 'DELETED' | 'PARTIAL_PUBLISH' | 'PARTIAL_UNPUBLISH' | 'INCOMPLETE' | 'SCAN_SUBMITTED' | 'IN_QUEUE' | 'STOPPING' | 'PAUSING' | 'IN_PROGRESS' | 'ANALYSIS_ERRORS' | 'SCAN_CANCELED' | 'INTERNAL_REVIEW' | 'VERIFYING_RESULTS' | 'SUBMITTED_FOR_NTO_PRE_SCAN' | 'SUBMITTED_FOR_DYNAMIC_PRE_SCAN' | 'PRE_SCAN_FAILED' | 'READY_TO_SUBMIT' | 'NTO_PENDING_SUBMISSION' | 'PRE_SCAN_COMPLETE' | 'MODULE_SELECTION_REQUIRED' | 'PENDING_VENDOR_ACCEPTANCE' | 'SHOW_OSRDB' | 'PUBLISHED' | 'PUBLISHED_TO_VENDOR' | 'PUBLISHED_TO_ENTERPRISE' | 'PENDING_ACCOUNT_APPROVAL' | 'PENDING_LEGAL_AGREEMENT' | 'SCAN_IN_PROGRESS' | 'SCAN_IN_PROGRESS_PARTIAL_RESULTS_READY' | 'PROMOTE_IN_PROGRESS' | 'PRE_SCAN_CANCELED' | 'NTO_PRE_SCAN_CANCELED' | 'SCAN_HELD_APPROVAL' | 'SCAN_HELD_LOGIN_INSTRUCTIONS' | 'SCAN_HELD_LOGIN' | 'SCAN_HELD_INSTRUCTIONS' | 'SCAN_HELD_HOLDS_FINISHED' | 'SCAN_REQUESTED' | 'TIMEFRAMEPENDING_ID' | 'PAUSED_ID' | 'STATIC_VALIDATING_UPLOAD' | 'PUBLISHED_TO_ENTERPRISEINT'>;
  scan_type?: 'STATIC' | 'DYNAMIC' | 'MANUAL';
  sort_by_custom_field_name?: string;
  tag?: string;
  team?: string;
}

// Sandbox interface based on Veracode API specification
export interface VeracodeSandbox {
  guid: string;
  id: number;
  name: string;
  application_guid: string;
  organization_id: number;
  owner_username?: string;
  auto_recreate?: boolean;
  created: string;
  modified: string;
  custom_fields?: Array<{
    name: string;
    value: string;
  }>;
}

// Query parameters for getSandboxes API
export interface SandboxQueryParams {
  page?: number;
  size?: number;
}

// Response structure for paginated sandbox results
export interface SandboxPagedResponse {
  _embedded?: {
    sandboxes: VeracodeSandbox[];
  };
  page?: {
    number: number;
    size: number;
    total_elements: number;
    total_pages: number;
  };
  _links?: any;
}

// Base annotation interface
export interface VeracodeAnnotation {
  action: string;
  comment: string;
  created: string;
  user_name: string;
  remaining_risk?: string;
  specifics?: string;
  technique?: string;
  verification?: string;
}

// Base finding status interface
export interface VeracodeFindingStatus {
  first_found_date: string;
  last_seen_date?: string;
  status: string;
  resolution: string;
  resolution_status: string;
  new: boolean;
  mitigation_review_status?: string;
}

// Base CWE interface
export interface VeracodeCWE {
  id: number;
  name: string;
  href?: string;
}

// Static Analysis finding details
export interface VeracodeStaticFinding {
  severity: number;
  cwe?: VeracodeCWE;
  cvss?: string;
  exploitability?: number;
  attack_vector?: string;
  file_line_number?: string;
  file_name?: string;
  file_path?: string;
  finding_category?: string;
  module?: string;
  procedure?: string;
  relative_location?: string;
}

// Dynamic Analysis finding details
export interface VeracodeDynamicFinding {
  severity: number;
  cwe?: VeracodeCWE;
  cvss?: string;
  attack_vector?: string;
  hostname?: string;
  port?: string;
  path?: string;
  plugin?: string;
  URL?: string;
  vulnerable_parameter?: string;
  discovered_by_vsa?: string;
  finding_category?: string;
}

// Manual finding details
export interface VeracodeManualFinding {
  severity: number;
  cwe?: VeracodeCWE;
  cvss?: string;
  capec_id?: string;
  exploit_desc?: string;
  exploit_difficulty?: string;
  input_vector?: string;
  location?: string;
  module?: string;
  remediation_desc?: string;
  severity_desc?: string;
}

// SCA-specific interfaces
export interface VeracodeSCALicense {
  license_id: string;
  risk_rating: string;
}

export interface VeracodeSCAExploitability {
  exploit_service_status: string;
  cve_full?: string;
  epss_status?: string;
  epss_score?: number;
  epss_percentile?: number;
  epss_score_date?: string;
  epss_model_version?: string;
  epss_citation?: string;
  exploit_observed?: boolean;
  exploit_source?: string;
  exploit_note?: string;
}

export interface VeracodeSCACVE {
  name: string;
  cvss: number;
  href: string;
  severity: string;
  vector: string;
  cvss3?: {
    score: number;
    severity: string;
    vector: string;
  };
  exploitability?: VeracodeSCAExploitability;
}

export interface VeracodeSCAComponentPath {
  path: string;
}

// SCA finding details
export interface VeracodeSCAFinding {
  severity: number;
  cwe?: VeracodeCWE;
  component_id?: string;
  licenses?: VeracodeSCALicense[];
  cve?: VeracodeSCACVE;
  version?: string;
  product_id?: string;
  component_filename?: string;
  language?: string;
  component_path?: VeracodeSCAComponentPath[];
  metadata?: string;
}

// Union type for all finding details
export type VeracodeFindingDetails =
  | VeracodeStaticFinding
  | VeracodeDynamicFinding
  | VeracodeManualFinding
  | VeracodeSCAFinding;

// Main finding interface
export interface VeracodeFinding {
  issue_id?: number;
  scan_type: 'STATIC' | 'DYNAMIC' | 'MANUAL' | 'SCA';
  description: string;
  count: number;
  context_type: 'APPLICATION' | 'SANDBOX';
  context_guid: string;
  violates_policy: boolean;
  build_id?: number;
  grace_period_expires_date?: string;
  annotations?: VeracodeAnnotation[];
  finding_status: VeracodeFindingStatus;
  finding_details: VeracodeFindingDetails;
}

export interface VeracodePolicyCompliance {
  policy_compliance_status: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' | 'NOT_ASSESSED';
  total_findings: number;
  policy_violations: number;
  findings_by_severity: Record<string, number>;
  violations_by_severity: Record<string, number>;
  summary: {
    has_critical_violations: boolean;
    has_high_violations: boolean;
    total_open_violations: number;
  };
}

// Policy management interfaces
export interface VeracodeCustomSeverity {
  cwe: number;
  severity: number;
}

export interface VeracodeScaLicenseSummary {
  full_name?: string;
  name?: string;
  risk?: 'Low' | 'Medium' | 'High' | 'Unknown';
  spdx_id: string;
  url?: string;
}

export interface VeracodeFindingRuleAdvancedOptions {
  all_licenses_must_meet_requirement?: boolean;
  allowed_nonoss_licenses?: boolean;
  is_blocklist?: boolean;
  selected_licenses?: VeracodeScaLicenseSummary[];
}

export interface VeracodeCoordinate {
  coordinate1?: string;
  coordinate2?: string;
  created_by?: string;
  created_date?: string;
  repo_type?: string;
  version?: string;
}

export interface VeracodeFindingRule {
  coordinates?: VeracodeCoordinate[];
  scan_type?: ('STATIC' | 'DYNAMIC' | 'MANUAL' | 'SCA' | 'MOBILE' | 'ALL' | 'DYNAMICMP')[];
  type: 'FAIL_ALL' | 'CWE' | 'CATEGORY' | 'MAX_SEVERITY' | 'CVSS' | 'CVE' | 'BLACKLIST' | 'MIN_SCORE' | 'SECURITY_STANDARD' | 'LICENSE_RISK' | 'ALLOWLIST';
  advanced_options?: VeracodeFindingRuleAdvancedOptions;
  value?: string;
}

export interface VeracodeScanFrequency {
  frequency: 'NOT_REQUIRED' | 'ONCE' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY' | 'EVERY_18_MONTHS' | 'EVERY_2_YEARS' | 'EVERY_3_YEARS' | 'SET_BY_VL_POLICY' | 'SET_BY_POLICY_RULE';
  scan_type: 'STATIC' | 'DYNAMIC' | 'MANUAL' | 'SCA' | 'ANY';
}

export interface VeracodeCvssScoreGracePeriod {
  upper: number;
  lower: number;
  days: number;
}

export interface VeracodeSeverityGracePeriods {
  sev0_grace_period?: number;
  sev1_grace_period?: number;
  sev2_grace_period?: number;
  sev3_grace_period?: number;
  sev4_grace_period?: number;
}

export interface VeracodeScaGracePeriods {
  sca_blacklist_grace_period?: number;
  license_risk_grace_period?: number;
  severity_grace_period?: VeracodeSeverityGracePeriods;
  cvss_score_grace_period?: VeracodeCvssScoreGracePeriod[];
}

export interface VeracodePolicyVersion {
  category?: 'APPLICATION' | 'COMPONENT';
  created?: string;
  custom_severities?: VeracodeCustomSeverity[];
  description?: string;
  evaluation_date?: string;
  evaluation_date_type?: 'BEFORE' | 'AFTER';
  finding_rules?: VeracodeFindingRule[];
  sca_grace_periods?: VeracodeScaGracePeriods;
  guid?: string;
  modified_by?: string;
  name?: string;
  organization_id?: number;
  sca_blacklist_grace_period?: number; // deprecated
  scan_frequency_rules?: VeracodeScanFrequency[];
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

export interface VeracodePolicyListOptions {
  category?: 'APPLICATION' | 'COMPONENT';
  legacy_policy_id?: number;
  name?: string;
  name_exact?: boolean;
  page?: number;
  public_policy?: boolean;
  size?: number;
  vendor_policy?: boolean;
}

export interface VeracodePolicyListResponse {
  _embedded?: {
    policy_versions?: VeracodePolicyVersion[];
  };
  _links?: any;
}

export interface VeracodePolicySetting {
  business_criticality: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
  modified?: string;
  policy_guid: string;
}

export interface VeracodePolicySettingsResponse {
  _embedded?: {
    policy_settings?: VeracodePolicySetting[];
  };
  _links?: any;
}

// Static flaw data path interfaces
export interface VeracodeStaticFlawCall {
  data_path: number;
  file_name: string;
  file_path: string;
  function_name: string;
  line_number: number;
}

export interface VeracodeStaticFlawDataPath {
  module_name: string;
  steps: number;
  local_path: string;
  function_name: string;
  line_number: number;
  calls: VeracodeStaticFlawCall[];
}

export interface VeracodeStaticFlawIssueSummary {
  app_guid: string;
  name: number;
  build_id: number;
  issue_id: number;
  sandbox_id?: string;
}

export interface VeracodeStaticFlawInfo {
  issue_summary: VeracodeStaticFlawIssueSummary;
  data_paths: VeracodeStaticFlawDataPath[];
  _links?: Array<{
    href: string;
    name?: string;
    templated?: boolean;
  }>;
}

// Pagination interfaces
export interface PageMetadata {
  number: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

export interface PagedFindingsResponse {
  _embedded?: {
    findings: VeracodeFinding[];
  };
  page: PageMetadata;
  _links?: {
    self?: { href: string };
    first?: { href: string };
    last?: { href: string };
    next?: { href: string };
    prev?: { href: string };
  };
}

export interface PaginatedFindingsResult {
  findings: VeracodeFinding[];
  pagination: {
    current_page: number;
    page_size: number;
    total_pages: number;
    total_elements: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export class VeracodeClient {
  private apiClient: AxiosInstance;
  private apiId: string;
  private apiKey: string;
  private platformBaseUrl: string;

  constructor(
    apiId?: string,
    apiKey?: string,
    options?: {
      apiBaseUrl?: string;
      platformBaseUrl?: string;
    }
  ) {
    // If no credentials provided, try to load from environment
    if (!apiId || !apiKey) {
      const credentials = loadVeracodeCredentials();
      apiId = credentials.apiId;
      apiKey = credentials.apiKey;
      options = {
        ...options,
        apiBaseUrl: options?.apiBaseUrl || credentials.apiBaseUrl,
        platformBaseUrl: options?.platformBaseUrl || credentials.platformBaseUrl
      };
    }

    logger.debug('Initializing VeracodeClient', 'CLIENT', {
      hasApiId: !!apiId,
      hasApiKey: !!apiKey,
      options
    });

    this.apiId = apiId!;
    this.apiKey = apiKey!;

    // Determine API base URL (region-specific)
    const apiBaseUrl = options?.apiBaseUrl || process.env.VERACODE_API_BASE_URL || 'https://api.veracode.com/';

    logger.debug('API base URL determined', 'CLIENT', { apiBaseUrl });

    // Auto-derive platform URL from API URL if not explicitly provided
    if (options?.platformBaseUrl) {
      this.platformBaseUrl = options.platformBaseUrl;
    } else if (process.env.VERACODE_PLATFORM_URL) {
      this.platformBaseUrl = process.env.VERACODE_PLATFORM_URL;
    } else {
      // Auto-derive platform URL from API base URL
      this.platformBaseUrl = this.derivePlatformUrl(apiBaseUrl);
    }

    logger.debug('Platform URL configured', 'CLIENT', { platformBaseUrl: this.platformBaseUrl });

    this.apiClient = axios.create({
      baseURL: apiBaseUrl,
      timeout: 30000
    });

    logger.debug('Axios client created', 'CLIENT', {
      baseURL: apiBaseUrl,
      timeout: 30000
    });

    // Add request interceptor for HMAC authentication
    this.apiClient.interceptors.request.use(config => {
      return this.addHMACAuthentication(config);
    });

    // Add response interceptor for logging
    this.apiClient.interceptors.response.use(
      response => {
        logger.debug('API Response received', 'CLIENT', {
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
          dataSize: response.data ? JSON.stringify(response.data).length : 0
        });
        return response;
      },
      error => {
        logger.error('API Request failed', 'CLIENT', {
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );

    logger.info('VeracodeClient initialized successfully', 'CLIENT');
  }

  /**
   * Create a VeracodeClient instance using credentials from environment variables
   * This is the recommended way to create a client for testing and applications
   */
  static fromEnvironment(options?: {
    apiBaseUrl?: string;
    platformBaseUrl?: string;
  }): VeracodeClient {
    const credentials = loadVeracodeCredentials();
    
    return new VeracodeClient(credentials.apiId, credentials.apiKey, {
      apiBaseUrl: options?.apiBaseUrl || credentials.apiBaseUrl,
      platformBaseUrl: options?.platformBaseUrl || credentials.platformBaseUrl
    });
  }

  // Derive platform URL from API base URL for different regions
  private derivePlatformUrl(apiBaseUrl: string): string {
    try {
      const apiUrl = new URL(apiBaseUrl);
      const apiHost = apiUrl.hostname;

      // Map API hostnames to platform hostnames
      const regionMap: Record<string, string> = {
        'api.veracode.com': 'analysiscenter.veracode.com', // Commercial US
        'api.veracode.eu': 'analysiscenter.veracode.eu', // European
        'api.veracode.us': 'analysiscenter.veracode.us' // US Federal
      };

      const platformHost = regionMap[apiHost];
      if (platformHost) {
        return `https://${platformHost}`;
      }

      // Fallback: try to auto-derive by replacing 'api.' with 'analysiscenter.'
      if (apiHost.startsWith('api.veracode.')) {
        const domain = apiHost.substring('api.'.length);
        return `https://analysiscenter.${domain}`;
      }

      // Ultimate fallback to commercial region
      console.warn(`Unknown API host: ${apiHost}. Using commercial region platform URL.`);
      return 'https://analysiscenter.veracode.com';
    } catch (error) {
      console.warn(`Invalid API base URL: ${apiBaseUrl}. Using commercial region platform URL.`);
      return 'https://analysiscenter.veracode.com';
    }
  }

  // Convert hex string to byte array
  private getByteArray(hex: string): Buffer {
    const bytes = [];
    for (let i = 0; i < hex.length - 1; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return Buffer.from(bytes);
  }

  // Convert buffer to hex string
  private bufferToHex(buffer: Buffer): string {
    return buffer.toString('hex');
  }

  // HMAC-SHA256 function
  private hmac256(data: Buffer, key: Buffer): Buffer {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data);
    return hmac.digest();
  }

  // Generate Veracode authentication header using the correct multi-step HMAC process
  private generateVeracodeAuthHeader(url: string, method: string): string {
    const verStr = 'vcode_request_version_1';
    const apiHost = new URL(this.apiClient.defaults.baseURL || 'https://api.veracode.com/').hostname;
    const data = `id=${this.apiId}&host=${apiHost}&url=${url}&method=${method}`;
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    try {
      // Convert API key from hex to bytes
      const keyBytes = this.getByteArray(this.apiKey);

      // Step 1: HMAC the nonce with the key
      const hashedNonce = this.hmac256(this.getByteArray(nonce), keyBytes);

      // Step 2: HMAC the timestamp with the result from step 1
      const hashedTimestamp = this.hmac256(Buffer.from(timestamp, 'utf8'), hashedNonce);

      // Step 3: HMAC the version string with the result from step 2
      const hashedVerStr = this.hmac256(Buffer.from(verStr, 'utf8'), hashedTimestamp);

      // Step 4: HMAC the data with the result from step 3
      const signature = this.bufferToHex(this.hmac256(Buffer.from(data, 'utf8'), hashedVerStr));

      return `VERACODE-HMAC-SHA-256 id=${this.apiId},ts=${timestamp},nonce=${nonce},sig=${signature}`;
    } catch (error) {
      throw new Error(`Failed to generate auth header: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Add HMAC authentication headers to the request
  private addHMACAuthentication(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const method = config.method?.toUpperCase() || 'GET';
    // Ensure URL starts with / for the HMAC calculation
    const url = config.url?.startsWith('/') ? config.url : `/${config.url || ''}`;

    try {
      const authHeader = this.generateVeracodeAuthHeader(url, method);
      config.headers.set('Authorization', authHeader);
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return config;
  }

  // Get list of all applications
  async getApplications(params?: ApplicationQueryParams): Promise<VeracodeApplication[]> {
    const startTime = Date.now();
    logger.debug('Getting all applications', 'API', { params });

    try {
      // Build query string from parameters
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v.toString()));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      // For HMAC calculation, we need to use %20 for spaces, not +
      // URLSearchParams.toString() uses + for spaces, so we need to replace them
      const queryString = queryParams.toString().replace(/\+/g, '%20');
      const url = `appsec/v1/applications${queryString ? `?${queryString}` : ''}`;
      logger.apiRequest('GET', url);
      const response = await this.apiClient.get(url);
      const responseTime = Date.now() - startTime;

      const applications = response.data._embedded?.applications || [];
      logger.apiResponse('GET', url, response.status, responseTime, applications.length);

      logger.debug('Processing application data', 'API', {
        count: applications.length,
        hasEmbedded: !!response.data._embedded
      });

      // Convert relative URLs to full platform URLs
      const processedApps = applications.map((app: any) => ({
        ...app,
        app_profile_url: this.convertToFullUrl(app.app_profile_url),
        results_url: this.convertToFullUrl(app.results_url),
        scans: app.scans?.map((scan: any) => ({
          ...scan,
          scan_url: this.convertToFullUrl(scan.scan_url)
        }))
      }));

      logger.debug('Applications retrieved and processed', 'API', {
        totalCount: processedApps.length,
        executionTime: responseTime
      });

      return processedApps;
    } catch (error) {
      logger.apiError('GET', 'appsec/v1/applications', error);
      throw new Error(`Failed to fetch applications: ${this.getErrorMessage(error)}`);
    }
  }

  // Search applications by name
  async searchApplications(name: string): Promise<VeracodeApplication[]> {
    try {
      return await this.getApplications({ name });
    } catch (error) {
      throw new Error(`Failed to search applications: ${this.getErrorMessage(error)}`);
    }
  }

  // Get detailed information about a specific application
  async getApplicationDetails(appId: string): Promise<VeracodeApplication> {
    try {
      const response = await this.apiClient.get(`appsec/v1/applications/${appId}`);
      const application = response.data;

      // Convert relative URLs to full platform URLs
      return {
        ...application,
        app_profile_url: this.convertToFullUrl(application.app_profile_url),
        results_url: this.convertToFullUrl(application.results_url),
        scans: application.scans?.map((scan: any) => ({
          ...scan,
          scan_url: this.convertToFullUrl(scan.scan_url)
        }))
      };
    } catch (error) {
      throw new Error(`Failed to fetch application details: ${this.getErrorMessage(error)}`);
    }
  }

  // Get detailed information about an application by its name
  // First searches for the application, then retrieves full details
  async getApplicationDetailsByName(name: string): Promise<VeracodeApplication> {
    try {
      // First search for applications with this name
      const searchResults = await this.searchApplications(name);

      if (searchResults.length === 0) {
        throw new Error(`No application found with name: ${name}`);
      }

      // If multiple results, look for exact match first
      let targetApp = searchResults.find(app => app.profile.name.toLowerCase() === name.toLowerCase());

      // If no exact match, use the first result
      if (!targetApp) {
        targetApp = searchResults[0];
      }

      // Get the full details for the selected application
      return await this.getApplicationDetails(targetApp.guid);
    } catch (error) {
      throw new Error(`Failed to fetch application details by name: ${this.getErrorMessage(error)}`);
    }
  }

  // Get sandboxes for a specific application by application ID
  async getSandboxes(applicationGuid: string, params?: SandboxQueryParams): Promise<VeracodeSandbox[]> {
    const startTime = Date.now();
    logger.debug('Getting sandboxes for application', 'API', { applicationGuid, params });

    try {
      // Build query string from parameters
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `appsec/v1/applications/${applicationGuid}/sandboxes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      logger.apiRequest('GET', url);
      const response = await this.apiClient.get(url);
      const responseTime = Date.now() - startTime;

      const sandboxes = response.data._embedded?.sandboxes || [];
      logger.apiResponse('GET', url, response.status, responseTime, sandboxes.length);

      logger.debug('Sandboxes retrieved', 'API', {
        applicationGuid,
        sandboxCount: sandboxes.length,
        executionTime: responseTime
      });

      return sandboxes;
    } catch (error) {
      logger.apiError('GET', `appsec/v1/applications/${applicationGuid}/sandboxes`, error);
      throw new Error(`Failed to fetch sandboxes for application ${applicationGuid}: ${this.getErrorMessage(error)}`);
    }
  }

  // Get sandboxes for a specific application by application name
  async getSandboxesByName(applicationName: string, params?: SandboxQueryParams): Promise<{
    application: VeracodeApplication;
    sandboxes: VeracodeSandbox[];
  }> {
    try {
      // First search for applications with this name
      const searchResults = await this.searchApplications(applicationName);

      if (searchResults.length === 0) {
        throw new Error(`No application found with name: ${applicationName}`);
      }

      // If multiple results, look for exact match first
      let targetApp = searchResults.find(app => app.profile.name.toLowerCase() === applicationName.toLowerCase());

      // If no exact match, use the first result
      if (!targetApp) {
        targetApp = searchResults[0];
        logger.debug(`No exact match found for "${applicationName}". Using first result: "${targetApp.profile.name}"`);
      }

      // Get sandboxes for the selected application
      const sandboxes = await this.getSandboxes(targetApp.guid, params);

      return {
        application: targetApp,
        sandboxes
      };
    } catch (error) {
      throw new Error(`Failed to fetch sandboxes for application "${applicationName}": ${this.getErrorMessage(error)}`);
    }
  }

  // Get scan results for an application
  async getScanResults(appId: string, scanType?: string): Promise<VeracodeScan[]> {
    try {
      let url = `appsec/v1/applications/${appId}/scans`;
      if (scanType) {
        url += `?scan_type=${scanType}`;
      }

      const response = await this.apiClient.get(url);
      const scans = response.data._embedded?.scans || [];
      
      logger.debug('Scan results retrieved', 'API', {
        appId,
        scanType: scanType || 'all',
        scanCount: scans.length,
        scans: scans.map((scan: any) => ({ scan_id: scan.scan_id, scan_type: scan.scan_type, status: scan.status }))
      });
      
      return scans;
    } catch (error) {
      throw new Error(`Failed to fetch scan results: ${this.getErrorMessage(error)}`);
    }
  }

  // Get scan results for an application by name
  async getScanResultsByName(name: string, scanType?: string): Promise<VeracodeScan[]> {
    try {
      // First get the application details to get the app ID
      const application = await this.getApplicationDetailsByName(name);

      // Then get scan results using the app ID
      return await this.getScanResults(application.guid, scanType);
    } catch (error) {
      throw new Error(`Failed to fetch scan results by name: ${this.getErrorMessage(error)}`);
    }
  }

  // Check if an application has any scans
  async hasScans(appId: string, scanType?: string): Promise<{ hasScans: boolean; scanCount: number; scanTypes: string[] }> {
    try {
      const scans = await this.getScanResults(appId, scanType);
      const scanTypes = [...new Set(scans.map((scan: any) => scan.scan_type))];
      
      logger.debug('Scan existence check completed', 'API', {
        appId,
        requestedScanType: scanType,
        hasScans: scans.length > 0,
        scanCount: scans.length,
        availableScanTypes: scanTypes
      });
      
      return {
        hasScans: scans.length > 0,
        scanCount: scans.length,
        scanTypes
      };
    } catch (error) {
      logger.warn('Failed to check for scans', 'API', { appId, scanType, error });
      throw new Error(`Failed to check for scans: ${this.getErrorMessage(error)}`);
    }
  }

  // Check if an application has any scans by name
  async hasScansByName(name: string, scanType?: string): Promise<{ hasScans: boolean; scanCount: number; scanTypes: string[] }> {
    try {
      // First get the application details to get the app ID
      const application = await this.getApplicationDetailsByName(name);

      // Then check for scans using the app ID
      return await this.hasScans(application.guid, scanType);
    } catch (error) {
      throw new Error(`Failed to check for scans by name: ${this.getErrorMessage(error)}`);
    }
  }

  // Get findings for an application with pagination metadata
  async getFindingsPaginated(
    appId: string,
    options?: {
      scanType?: string;
      severity?: number;
      severityGte?: number;
      cwe?: number[];
      cvss?: number;
      cvssGte?: number;
      cve?: string;
      sandbox_id?: string;
      findingCategory?: number[];
      includeAnnotations?: boolean;
      includeExpirationDate?: boolean;
      mitigatedAfter?: string;
      newFindingsOnly?: boolean;
      scaDependencyMode?: 'UNKNOWN' | 'DIRECT' | 'TRANSITIVE' | 'BOTH';
      scaScanMode?: 'UPLOAD' | 'AGENT' | 'BOTH';
      policyViolation?: boolean;
      page?: number;
      size?: number;
    }
  ): Promise<PaginatedFindingsResult> {
    try {
      // Check if the application has any scans first
      const scanCheck = await this.hasScans(appId, options?.scanType);
      
      if (!scanCheck.hasScans) {
        logger.warn('No scans found for application', 'API', {
          appId,
          requestedScanType: options?.scanType || 'any'
        });
        
        return {
          findings: [],
          pagination: {
            current_page: 0,
            page_size: options?.size || 500,
            total_pages: 0,
            total_elements: 0,
            has_next: false,
            has_previous: false
          }
        };
      }
      
      // If a specific scan type was requested but not available, return empty results
      if (options?.scanType && !scanCheck.scanTypes.includes(options.scanType)) {
        logger.warn('Requested scan type not available for application', 'API', {
          appId,
          requestedScanType: options.scanType,
          availableScanTypes: scanCheck.scanTypes
        });
        
        return {
          findings: [],
          pagination: {
            current_page: 0,
            page_size: options?.size || 500,
            total_pages: 0,
            total_elements: 0,
            has_next: false,
            has_previous: false
          }
        };
      }

      let url = `appsec/v2/applications/${appId}/findings`;
      const params = new URLSearchParams();

      if (options) {
        if (options.scanType) params.append('scan_type', options.scanType);
        if (options.severity !== undefined) params.append('severity', options.severity.toString());
        if (options.severityGte !== undefined) params.append('severity_gte', options.severityGte.toString());
        if (options.cwe && options.cwe.length > 0) {
          options.cwe.forEach(cweId => params.append('cwe', cweId.toString()));
        }
        if (options.cvss !== undefined) params.append('cvss', options.cvss.toString());
        if (options.cvssGte !== undefined) params.append('cvss_gte', options.cvssGte.toString());
        if (options.cve) params.append('cve', options.cve);
        if (options.sandbox_id) params.append('context', options.sandbox_id);
        if (options.findingCategory && options.findingCategory.length > 0) {
          options.findingCategory.forEach(cat => params.append('finding_category', cat.toString()));
        }
        if (options.includeAnnotations !== undefined)
          params.append('include_annot', options.includeAnnotations.toString());
        if (options.includeExpirationDate !== undefined)
          params.append('include_exp_date', options.includeExpirationDate.toString());
        if (options.mitigatedAfter) params.append('mitigated_after', options.mitigatedAfter);
        if (options.newFindingsOnly !== undefined) params.append('new', options.newFindingsOnly.toString());
        if (options.scaDependencyMode) params.append('sca_dep_mode', options.scaDependencyMode);
        if (options.scaScanMode) params.append('sca_scan_mode', options.scaScanMode);
        if (options.policyViolation !== undefined) params.append('violates_policy', options.policyViolation.toString());
        if (options.page !== undefined) params.append('page', options.page.toString());
        if (options.size !== undefined) params.append('size', options.size.toString());
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await this.apiClient.get<PagedFindingsResponse>(url);
      const findings = response.data._embedded?.findings || [];
      const pageData = response.data.page;

      return {
        findings,
        pagination: {
          current_page: pageData.number,
          page_size: pageData.size,
          total_pages: pageData.total_pages,
          total_elements: pageData.total_elements,
          has_next: pageData.number < pageData.total_pages - 1,
          has_previous: pageData.number > 0
        }
      };
    } catch (error) {
      logger.apiError('GET', `appsec/v2/applications/${appId}/findings`, error);
      throw new Error(`Failed to fetch findings: ${this.getErrorMessage(error)}`);
    }
  }

  // Get findings for an application (backward compatibility)
  async getFindingsById(
    appId: string,
    options?: {
      scanType?: string;
      severity?: number;
      severityGte?: number;
      cwe?: number[];
      cvss?: number;
      cvssGte?: number;
      cve?: string;
      sandbox_id?: string;
      findingCategory?: number[];
      includeAnnotations?: boolean;
      includeExpirationDate?: boolean;
      mitigatedAfter?: string;
      newFindingsOnly?: boolean;
      scaDependencyMode?: 'UNKNOWN' | 'DIRECT' | 'TRANSITIVE' | 'BOTH';
      scaScanMode?: 'UPLOAD' | 'AGENT' | 'BOTH';
      policyViolation?: boolean;
      page?: number;
      size?: number;
    }
  ): Promise<VeracodeFinding[]> {
    const result = await this.getFindingsPaginated(appId, options);
    return result.findings;
  }

  // Get findings for an application by its name
  // First searches for the application, then retrieves findings
  async getFindingsByName(
    name: string,
    options?: {
      scanType?: string;
      severity?: number;
      severityGte?: number;
      cwe?: number[];
      cvss?: number;
      cvssGte?: number;
      cve?: string;
      sandbox_id?: string;
      findingCategory?: number[];
      includeAnnotations?: boolean;
      includeExpirationDate?: boolean;
      mitigatedAfter?: string;
      newFindingsOnly?: boolean;
      scaDependencyMode?: 'UNKNOWN' | 'DIRECT' | 'TRANSITIVE' | 'BOTH';
      scaScanMode?: 'UPLOAD' | 'AGENT' | 'BOTH';
      policyViolation?: boolean;
      page?: number;
      size?: number;
    }
  ): Promise<VeracodeFinding[]> {
    const startTime = Date.now();
    logger.debug('Getting findings by application name', 'API', {
      name,
      options: {
        scanType: options?.scanType,
        severityGte: options?.severityGte,
        cvssGte: options?.cvssGte,
        size: options?.size,
        newFindingsOnly: options?.newFindingsOnly,
        policyViolation: options?.policyViolation
      }
    });

    try {
      // First search for applications with this name
      logger.debug('Searching for application', 'API', { name });
      const searchResults = await this.searchApplications(name);

      if (searchResults.length === 0) {
        logger.warn('No application found with name', 'API', { name });
        throw new Error(`No application found with name: ${name}`);
      }

      logger.debug('Application search results', 'API', {
        name,
        resultsCount: searchResults.length,
        applications: searchResults.map(app => ({ name: app.profile.name, guid: app.guid }))
      });

      // If multiple results, look for exact match first
      let targetApp = searchResults.find(app => app.profile.name.toLowerCase() === name.toLowerCase());

      // If no exact match, use the first result but warn about it
      if (!targetApp) {
        targetApp = searchResults[0];
        logger.warn(`No exact match found for "${name}". Using first result: "${targetApp.profile.name}"`, 'API');
      } else {
        logger.debug('Exact application match found', 'API', {
          searchName: name,
          foundName: targetApp.profile.name,
          guid: targetApp.guid
        });
      }

      // Get findings using the GUID
      logger.debug('Fetching findings for application', 'API', {
        appName: targetApp.profile.name,
        appGuid: targetApp.guid,
        options
      });

      const findings = await this.getFindingsById(targetApp.guid, options);
      const executionTime = Date.now() - startTime;

      logger.debug('Findings retrieved successfully', 'API', {
        appName: targetApp.profile.name,
        findingsCount: findings.length,
        scanType: options?.scanType,
        executionTime
      });

      return findings;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to fetch findings by name', 'API', {
        name,
        options,
        executionTime,
        error
      });
      throw new Error(`Failed to fetch findings by name: ${this.getErrorMessage(error)}`);
    }
  }



  // Get findings for an application across multiple pages
  // Automatically handles pagination to retrieve all findings
  async getAllFindings(
    appId: string,
    options?: {
      scanType?: string;
      severity?: number;
      severityGte?: number;
      cwe?: number[];
      cvss?: number;
      cvssGte?: number;
      cve?: string;
      sandbox_id?: string;
      findingCategory?: number[];
      includeAnnotations?: boolean;
      includeExpirationDate?: boolean;
      mitigatedAfter?: string;
      newFindingsOnly?: boolean;
      scaDependencyMode?: 'UNKNOWN' | 'DIRECT' | 'TRANSITIVE' | 'BOTH';
      scaScanMode?: 'UPLOAD' | 'AGENT' | 'BOTH';
      policyViolation?: boolean;
      maxPages?: number; // Limit to prevent infinite loops
      pageSize?: number; // Override default page size (max 500)
    }
  ): Promise<{
    findings: VeracodeFinding[];
    totalPages: number;
    totalElements: number;
    pagesRetrieved: number;
    truncated: boolean;
  }> {
    try {
      const maxPages = options?.maxPages || 50; // Default to 50 pages max (25,000 findings at 500 per page)
      const pageSize = Math.min(options?.pageSize || 500, 500); // API max is 500

      let allFindings: VeracodeFinding[] = [];
      let currentPage = 0;
      let totalPages = 1;
      let totalElements = 0;
      let pagesRetrieved = 0;

      while (currentPage < totalPages && pagesRetrieved < maxPages) {
        const requestOptions = {
          ...options,
          page: currentPage,
          size: pageSize
        };

        const result = await this.getFindingsPaginated(appId, requestOptions);

        allFindings = allFindings.concat(result.findings);
        totalPages = result.pagination.total_pages;
        totalElements = result.pagination.total_elements;
        pagesRetrieved++;
        currentPage++;

        // If we got fewer findings than requested, we've reached the end
        if (result.findings.length < pageSize) {
          break;
        }
      }

      return {
        findings: allFindings,
        totalPages,
        totalElements,
        pagesRetrieved,
        truncated: pagesRetrieved >= maxPages && currentPage < totalPages
      };
    } catch (error) {
      throw new Error(`Failed to fetch all findings: ${this.getErrorMessage(error)}`);
    }
  }

  // Get policy compliance for an application
  async getPolicyCompliance(appId: string): Promise<VeracodePolicyCompliance> {
    try {
      // Get the application details which includes policy information
      const application = await this.getApplicationDetails(appId);

      // Get findings to calculate policy violations
      const findings = await this.getFindingsById(appId, { policyViolation: true });

      // Extract policy compliance from application details
      const policies = application.profile.policies || [];
      const primaryPolicy = policies.find(p => p.is_default) || policies[0];

      // Count findings by severity
      const findingsBySeverity: Record<string, number> = {
        '5': 0, // Very High
        '4': 0, // High  
        '3': 0, // Medium
        '2': 0, // Low
        '1': 0  // Very Low
      };

      const violationsBySeverity: Record<string, number> = {
        '5': 0, // Very High
        '4': 0, // High
        '3': 0, // Medium
        '2': 0, // Low
        '1': 0  // Very Low
      };

      let policyViolations = 0;

      findings.forEach(finding => {
        const severity = String(finding.finding_details.severity || 0);
        if (findingsBySeverity[severity] !== undefined) {
          findingsBySeverity[severity]++;
        }

        if (finding.violates_policy) {
          policyViolations++;
          if (violationsBySeverity[severity] !== undefined) {
            violationsBySeverity[severity]++;
          }
        }
      });

      const hasCriticalViolations = violationsBySeverity['5'] > 0;
      const hasHighViolations = violationsBySeverity['4'] > 0;
      const totalOpenViolations = policyViolations;

      // Determine compliance status
      let complianceStatus: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' = 'NOT_ASSESSED' as any;
      if (primaryPolicy) {
        const policyStatus = primaryPolicy.policy_compliance_status;
        switch (policyStatus) {
          case 'PASSED':
            complianceStatus = 'PASS';
            break;
          case 'DID_NOT_PASS':
            complianceStatus = 'FAIL';
            break;
          case 'CONDITIONAL_PASS':
            complianceStatus = 'CONDITIONAL_PASS';
            break;
          default:
            complianceStatus = totalOpenViolations === 0 ? 'PASS' : 'FAIL';
        }
      } else {
        complianceStatus = totalOpenViolations === 0 ? 'PASS' : 'FAIL';
      }

      return {
        policy_compliance_status: complianceStatus,
        total_findings: findings.length,
        policy_violations: policyViolations,
        findings_by_severity: findingsBySeverity,
        violations_by_severity: violationsBySeverity,
        summary: {
          has_critical_violations: hasCriticalViolations,
          has_high_violations: hasHighViolations,
          total_open_violations: totalOpenViolations
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch policy compliance: ${this.getErrorMessage(error)}`);
    }
  }

  // Get policy compliance for an application by name
  async getPolicyComplianceByName(name: string): Promise<VeracodePolicyCompliance> {
    try {
      // First get the application to get its ID
      const application = await this.getApplicationDetailsByName(name);

      // Then get policy compliance using the ID
      return await this.getPolicyCompliance(application.guid);
    } catch (error) {
      throw new Error(`Failed to fetch policy compliance by name: ${this.getErrorMessage(error)}`);
    }
  }

  // Get detailed static flaw information
  async getStaticFlawInfo(appId: string, issueId: string, sandbox_id?: string): Promise<VeracodeStaticFlawInfo> {
    try {
      let url = `appsec/v2/applications/${appId}/findings/${issueId}/static_flaw_info`;
      if (sandbox_id) {
        url += `?context=${encodeURIComponent(sandbox_id)}`;
      }

      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);

      // Check if this is a 404 error, which might indicate the endpoint is not available
      if (error?.response?.status === 404) {
        throw new Error(`Static flaw info not available for issue ID ${issueId}. This could mean:
1. The static_flaw_info endpoint is not available for this finding type
2. The finding is not a static analysis finding with data path information
3. The endpoint may be deprecated or require different permissions
4. Static flaw info is only available for certain types of vulnerabilities

For general flaw information, use get-findings-by-name, get-findings-advanced-by-name, or get-findings instead.
Original error: ${errorMessage}`);
      }

      throw new Error(`Failed to fetch static flaw info: ${errorMessage}`);
    }
  }

  // Get detailed static flaw information by application name
  async getStaticFlawInfoByName(name: string, issueId: string, sandbox_id?: string): Promise<VeracodeStaticFlawInfo> {
    try {
      // First get the application to get its ID
      const application = await this.getApplicationDetailsByName(name);

      // Then get static flaw info using the ID
      return await this.getStaticFlawInfo(application.guid, issueId, sandbox_id);
    } catch (error) {
      throw new Error(`Failed to fetch static flaw info by name: ${this.getErrorMessage(error)}`);
    }
  }

  // Policy Management Methods

  // Get list of policies with optional filtering
  async getPolicies(options?: VeracodePolicyListOptions): Promise<VeracodePolicyListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options?.category) params.append('category', options.category);
      if (options?.legacy_policy_id !== undefined) params.append('legacy_policy_id', options.legacy_policy_id.toString());
      if (options?.name) params.append('name', options.name);
      if (options?.name_exact !== undefined) params.append('name_exact', options.name_exact.toString());
      if (options?.page !== undefined) params.append('page', options.page.toString());
      if (options?.public_policy !== undefined) params.append('public_policy', options.public_policy.toString());
      if (options?.size !== undefined) params.append('size', options.size.toString());
      if (options?.vendor_policy !== undefined) params.append('vendor_policy', options.vendor_policy.toString());

      const url = `appsec/v1/policies${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policies: ${this.getErrorMessage(error)}`);
    }
  }

  // Get specific policy by GUID (latest version)
  async getPolicy(policyGuid: string): Promise<VeracodePolicyVersion> {
    try {
      const url = `appsec/v1/policies/${policyGuid}`;
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policy ${policyGuid}: ${this.getErrorMessage(error)}`);
    }
  }

  // Get all versions of a specific policy
  async getPolicyVersions(policyGuid: string, page?: number, size?: number): Promise<VeracodePolicyListResponse> {
    try {
      const params = new URLSearchParams();
      if (page !== undefined) params.append('page', page.toString());
      if (size !== undefined) params.append('size', size.toString());

      const url = `appsec/v1/policies/${policyGuid}/versions${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policy versions for ${policyGuid}: ${this.getErrorMessage(error)}`);
    }
  }

  // Get specific version of a policy
  async getPolicyVersion(policyGuid: string, version: number): Promise<VeracodePolicyVersion> {
    try {
      const url = `appsec/v1/policies/${policyGuid}/versions/${version}`;
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policy ${policyGuid} version ${version}: ${this.getErrorMessage(error)}`);
    }
  }

  // Get policy settings (default policies for business criticality levels)
  async getPolicySettings(): Promise<VeracodePolicySettingsResponse> {
    try {
      const url = 'appsec/v1/policy_settings';
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policy settings: ${this.getErrorMessage(error)}`);
    }
  }

  // Get SCA component licenses information
  async getScaLicenses(page?: number, size?: number, sort?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (page !== undefined) params.append('page', page.toString());
      if (size !== undefined) params.append('size', size.toString());
      if (sort) params.append('sort', sort);

      const url = `appsec/v1/policy_licenselist${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch SCA licenses: ${this.getErrorMessage(error)}`);
    }
  }

  // Utility method to convert relative platform URLs to full URLs
  private convertToFullUrl(relativePath?: string): string | undefined {
    if (!relativePath) return undefined;

    // If already a full URL, return as-is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }

    // Convert relative path to full platform URL. It's generally HomeAppProfile or similar
    return `${this.platformBaseUrl}/auth/index.jsp#${relativePath}`;
  }

  // Utility method to extract error messages from various error types
  private getErrorMessage(error: any): string {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    if (error?.response?.data) {
      return JSON.stringify(error.response.data);
    }
    if (error?.message) {
      return error.message;
    }
    return String(error);
  }
}
