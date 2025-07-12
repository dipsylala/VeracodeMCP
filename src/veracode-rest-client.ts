import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as crypto from "crypto";

export interface VeracodeApplication {
  guid: string;
  id: number;
  created: string;
  modified: string;
  app_profile_url?: string;
  results_url?: string;
  scans?: VeracodeScan[];
  profile: {
    name: string;
    business_criticality: string;
    description?: string;
    tags?: string;
    teams?: Array<{
      guid: string;
      team_id: number;
      team_name: string;
    }>;
    policies?: Array<{
      guid: string;
      name: string;
      policy_compliance_status: string;
    }>;
  };
}

export interface VeracodeScan {
  scan_id: string;
  scan_type: string;
  status: string;
  created_date: string;
  modified_date: string;
  policy_compliance_status?: string;
  scan_url?: string;
  app_profile_url?: string;
  results_url?: string;
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
  scan_type: 'STATIC' | 'DYNAMIC' | 'MANUAL' | 'SCA';
  description: string;
  count: number;
  context_type: 'APPLICATION' | 'SANDBOX';
  context_guid: string;
  violates_policy: boolean;
  issue_id?: number;
  build_id?: number;
  grace_period_expires_date?: string;
  annotations?: VeracodeAnnotation[];
  finding_status: VeracodeFindingStatus;
  finding_details: VeracodeFindingDetails;
}

export interface VeracodePolicyCompliance {
  policy_compliance_status: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS';
  total_findings: number;
  policy_violations: number;
  findings_by_severity: Record<string, number>;
  violations_by_severity: Record<string, number>;
  summary: {
    has_critical_violations: boolean;
    has_high_violations: boolean;
    total_open_violations: number;
    compliance_percentage: number;
  };
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
  context?: string;
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

  constructor(apiId: string, apiKey: string, options?: {
    apiBaseUrl?: string;
    platformBaseUrl?: string;
  }) {
    this.apiId = apiId;
    this.apiKey = apiKey;

    // Determine API base URL (region-specific)
    const apiBaseUrl = options?.apiBaseUrl ||
      process.env.VERACODE_API_BASE_URL ||
      "https://api.veracode.com/";

    // Auto-derive platform URL from API URL if not explicitly provided
    if (options?.platformBaseUrl) {
      this.platformBaseUrl = options.platformBaseUrl;
    } else if (process.env.VERACODE_PLATFORM_URL) {
      this.platformBaseUrl = process.env.VERACODE_PLATFORM_URL;
    } else {
      // Auto-derive platform URL from API base URL
      this.platformBaseUrl = this.derivePlatformUrl(apiBaseUrl);
    }

    this.apiClient = axios.create({
      baseURL: apiBaseUrl,
      timeout: 30000,
    });

    // Add request interceptor for HMAC authentication
    this.apiClient.interceptors.request.use((config) => {
      return this.addHMACAuthentication(config);
    });
  }

  /**
   * Derive platform URL from API base URL for different regions
   */
  private derivePlatformUrl(apiBaseUrl: string): string {
    try {
      const apiUrl = new URL(apiBaseUrl);
      const apiHost = apiUrl.hostname;

      // Map API hostnames to platform hostnames
      const regionMap: Record<string, string> = {
        'api.veracode.com': 'analysiscenter.veracode.com',     // Commercial US
        'api.veracode.eu': 'analysiscenter.veracode.eu',       // European
        'api.veracode.us': 'analysiscenter.veracode.us',       // US Federal
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

  /**
   * Convert hex string to byte array
   */
  private getByteArray(hex: string): Buffer {
    const bytes = [];
    for (let i = 0; i < hex.length - 1; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return Buffer.from(bytes);
  }

  /**
   * Convert buffer to hex string
   */
  private bufferToHex(buffer: Buffer): string {
    return buffer.toString('hex');
  }

  /**
   * HMAC-SHA256 function
   */
  private hmac256(data: Buffer, key: Buffer): Buffer {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data);
    return hmac.digest();
  }

  /**
   * Generate Veracode authentication header using the correct multi-step HMAC process
   */
  private generateVeracodeAuthHeader(url: string, method: string): string {
    const verStr = "vcode_request_version_1";
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

  /**
   * Add HMAC authentication headers to the request
   */
  private addHMACAuthentication(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const method = config.method?.toUpperCase() || "GET";
    // Ensure URL starts with / for the HMAC calculation
    const url = config.url?.startsWith('/') ? config.url : `/${config.url || ''}`;

    try {
      const authHeader = this.generateVeracodeAuthHeader(url, method);
      config.headers.set("Authorization", authHeader);
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return config;
  }

  /**
   * Get list of all applications
   */
  async getApplications(): Promise<VeracodeApplication[]> {
    try {
      const response = await this.apiClient.get("appsec/v1/applications");
      const applications = response.data._embedded?.applications || [];

      // Convert relative URLs to full platform URLs
      return applications.map((app: any) => ({
        ...app,
        app_profile_url: this.convertToFullUrl(app.app_profile_url),
        results_url: this.convertToFullUrl(app.results_url),
        scans: app.scans?.map((scan: any) => ({
          ...scan,
          scan_url: this.convertToFullUrl(scan.scan_url)
        }))
      }));
    } catch (error) {
      throw new Error(`Failed to fetch applications: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Search applications by name
   */
  async searchApplications(name: string): Promise<VeracodeApplication[]> {
    try {
      const encodedName = encodeURIComponent(name);
      const response = await this.apiClient.get(`appsec/v1/applications/?name=${encodedName}`);
      const applications = response.data._embedded?.applications || [];

      // Convert relative URLs to full platform URLs
      return applications.map((app: any) => ({
        ...app,
        app_profile_url: this.convertToFullUrl(app.app_profile_url),
        results_url: this.convertToFullUrl(app.results_url),
        scans: app.scans?.map((scan: any) => ({
          ...scan,
          scan_url: this.convertToFullUrl(scan.scan_url)
        }))
      }));
    } catch (error) {
      throw new Error(`Failed to search applications: ${this.getErrorMessage(error)}`);
    }
  }
  /**
   * Get detailed information about a specific application
   */
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

  /**
   * Get detailed information about an application by its name
   * First searches for the application, then retrieves full details
   */
  async getApplicationDetailsByName(name: string): Promise<VeracodeApplication> {
    try {
      // First search for applications with this name
      const searchResults = await this.searchApplications(name);

      if (searchResults.length === 0) {
        throw new Error(`No application found with name: ${name}`);
      }

      // If multiple results, look for exact match first
      let targetApp = searchResults.find(app => app.profile.name.toLowerCase() === name.toLowerCase());

      // If no exact match, use the first result but warn about it
      if (!targetApp) {
        targetApp = searchResults[0];
        console.warn(`No exact match found for "${name}". Using first result: "${targetApp.profile.name}"`);
      }

      // Get full details using the GUID
      return await this.getApplicationDetails(targetApp.guid);
    } catch (error) {
      throw new Error(`Failed to fetch application details by name: ${this.getErrorMessage(error)}`);
    }
  }
  /**
   * Get scan results for an application
   */
  async getScanResults(appId: string, scanType?: string): Promise<VeracodeScan[]> {
    try {
      let url = `appsec/v1/applications/${appId}/scans`;
      if (scanType) {
        url += `?scan_type=${scanType}`;
      }

      const response = await this.apiClient.get(url);
      return response.data._embedded?.scans || [];
    } catch (error) {
      throw new Error(`Failed to fetch scan results: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get scan results for an application by name
   */
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

  /**
   * Get findings for an application with pagination metadata
   */
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
      context?: string;
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
      let url = `appsec/v2/applications/${appId}/findings`;
      const params = new URLSearchParams();

      if (options) {
        if (options.scanType) params.append("scan_type", options.scanType);
        if (options.severity !== undefined) params.append("severity", options.severity.toString());
        if (options.severityGte !== undefined) params.append("severity_gte", options.severityGte.toString());
        if (options.cwe && options.cwe.length > 0) {
          options.cwe.forEach(cweId => params.append("cwe", cweId.toString()));
        }
        if (options.cvss !== undefined) params.append("cvss", options.cvss.toString());
        if (options.cvssGte !== undefined) params.append("cvss_gte", options.cvssGte.toString());
        if (options.cve) params.append("cve", options.cve);
        if (options.context) params.append("context", options.context);
        if (options.findingCategory && options.findingCategory.length > 0) {
          options.findingCategory.forEach(cat => params.append("finding_category", cat.toString()));
        }
        if (options.includeAnnotations !== undefined) params.append("include_annot", options.includeAnnotations.toString());
        if (options.includeExpirationDate !== undefined) params.append("include_exp_date", options.includeExpirationDate.toString());
        if (options.mitigatedAfter) params.append("mitigated_after", options.mitigatedAfter);
        if (options.newFindingsOnly !== undefined) params.append("new", options.newFindingsOnly.toString());
        if (options.scaDependencyMode) params.append("sca_dep_mode", options.scaDependencyMode);
        if (options.scaScanMode) params.append("sca_scan_mode", options.scaScanMode);
        if (options.policyViolation !== undefined) params.append("violates_policy", options.policyViolation.toString());
        if (options.page !== undefined) params.append("page", options.page.toString());
        if (options.size !== undefined) params.append("size", options.size.toString());
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
      throw new Error(`Failed to fetch findings: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get findings for an application (backward compatibility)
   */
  async getFindings(
    appId: string,
    options?: {
      scanType?: string;
      severity?: number;
      severityGte?: number;
      cwe?: number[];
      cvss?: number;
      cvssGte?: number;
      cve?: string;
      context?: string;
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

  /**
   * Get findings for an application by its name
   * First searches for the application, then retrieves findings
   */
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
      context?: string;
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
    try {
      // First search for applications with this name
      const searchResults = await this.searchApplications(name);

      if (searchResults.length === 0) {
        throw new Error(`No application found with name: ${name}`);
      }

      // If multiple results, look for exact match first
      let targetApp = searchResults.find(app => app.profile.name.toLowerCase() === name.toLowerCase());

      // If no exact match, use the first result but warn about it
      if (!targetApp) {
        targetApp = searchResults[0];
        console.warn(`No exact match found for "${name}". Using first result: "${targetApp.profile.name}"`);
      }

      // Get findings using the GUID
      return await this.getFindings(targetApp.guid, options);
    } catch (error) {
      throw new Error(`Failed to fetch findings by name: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get policy compliance status for an application by analyzing findings
   * Policy compliance is determined by whether findings violate policy
   */
  async getPolicyCompliance(appId: string): Promise<{
    policy_compliance_status: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS';
    total_findings: number;
    policy_violations: number;
    findings_by_severity: Record<string, number>;
    violations_by_severity: Record<string, number>;
    summary: {
      has_critical_violations: boolean;
      has_high_violations: boolean;
      total_open_violations: number;
      compliance_percentage: number;
    };
  }> {
    try {
      // Get all findings for the application
      const findings = await this.getFindings(appId, {
        size: 500 // Get a large number of findings
      });

      let policyViolations = 0;
      const findingsBySeverity: Record<string, number> = {};
      const violationsBySeverity: Record<string, number> = {};
      let hasCriticalViolations = false;
      let hasHighViolations = false;

      findings.forEach(finding => {
        const severity = finding.finding_details.severity;
        const severityName = this.getSeverityName(severity);

        // Count all findings by severity
        findingsBySeverity[severityName] = (findingsBySeverity[severityName] || 0) + 1;

        // Count policy violations
        if (finding.violates_policy && finding.finding_status.status === 'OPEN') {
          policyViolations++;
          violationsBySeverity[severityName] = (violationsBySeverity[severityName] || 0) + 1;

          // Check for critical and high severity violations
          if (severity === 5) hasCriticalViolations = true;
          if (severity === 4) hasHighViolations = true;
        }
      });

      // Determine compliance status
      let complianceStatus: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS';
      if (policyViolations === 0) {
        complianceStatus = 'PASS';
      } else if (hasCriticalViolations || (hasHighViolations && policyViolations > 10)) {
        complianceStatus = 'FAIL';
      } else {
        complianceStatus = 'CONDITIONAL_PASS';
      }

      const compliancePercentage = findings.length > 0
        ? Math.round(((findings.length - policyViolations) / findings.length) * 100)
        : 100;

      return {
        policy_compliance_status: complianceStatus,
        total_findings: findings.length,
        policy_violations: policyViolations,
        findings_by_severity: findingsBySeverity,
        violations_by_severity: violationsBySeverity,
        summary: {
          has_critical_violations: hasCriticalViolations,
          has_high_violations: hasHighViolations,
          total_open_violations: policyViolations,
          compliance_percentage: compliancePercentage
        }
      };
    } catch (error) {
      throw new Error(`Failed to analyze policy compliance: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Helper method to get severity name from numeric value
   */
  private getSeverityName(severity: number): string {
    const severityNames = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
    return severityNames[severity] || `Level ${severity}`;
  }

  /**
   * Get the latest SCA scan results for an application
   */
  async getLatestSCAResults(appId: string): Promise<{
    scan: VeracodeScan | null;
    findings: VeracodeFinding[];
    summary: {
      totalFindings: number;
      severityBreakdown: Record<string, number>;
      policyViolations: number;
      highRiskComponents: number;
    };
  }> {
    try {
      // Get all SCA scans for the application
      const scaScans = await this.getScanResults(appId, 'SCA');

      if (scaScans.length === 0) {
        return {
          scan: null,
          findings: [],
          summary: {
            totalFindings: 0,
            severityBreakdown: {},
            policyViolations: 0,
            highRiskComponents: 0
          }
        };
      }

      // Sort by creation date to get the latest scan
      const latestScan = scaScans.sort((a, b) =>
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      )[0];

      // Get all SCA findings for the application
      const findings = await this.getFindings(appId, {
        scanType: 'SCA',
        size: 500  // Get a large number of findings
      });

      // Calculate summary statistics
      const severityBreakdown: Record<string, number> = {};
      let policyViolations = 0;
      let highRiskComponents = 0;

      findings.forEach(finding => {
        const severity = finding.finding_details.severity;
        const severityName = ['Very Low', 'Low', 'Medium', 'High', 'Very High'][severity] || `Level ${severity}`;

        severityBreakdown[severityName] = (severityBreakdown[severityName] || 0) + 1;

        if (finding.violates_policy) {
          policyViolations++;
        }

        if (severity >= 3) { // High and Very High severity
          highRiskComponents++;
        }
      });

      return {
        scan: latestScan,
        findings,
        summary: {
          totalFindings: findings.length,
          severityBreakdown,
          policyViolations,
          highRiskComponents
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch latest SCA results: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get SCA findings with enhanced filtering and details
   */
  async getSCAFindings(appId: string, options?: {
    includeTransitiveDependencies?: boolean;
    includeDirectDependencies?: boolean;
    severityGte?: number;
    cvssGte?: number;
    onlyPolicyViolations?: boolean;
    onlyNewFindings?: boolean;
    includeLicenseInfo?: boolean;
    page?: number;
    size?: number;
  }): Promise<VeracodeFinding[]> {
    try {
      const findingOptions: any = {
        scanType: 'SCA',
        includeAnnotations: true,
        includeExpirationDate: true,
        size: options?.size || 500,
        page: options?.page || 0
      };

      // Add SCA-specific filters
      if (options?.includeTransitiveDependencies && options?.includeDirectDependencies) {
        findingOptions.scaDependencyMode = 'BOTH';
      } else if (options?.includeTransitiveDependencies) {
        findingOptions.scaDependencyMode = 'TRANSITIVE';
      } else if (options?.includeDirectDependencies) {
        findingOptions.scaDependencyMode = 'DIRECT';
      }

      if (options?.severityGte !== undefined) {
        findingOptions.severityGte = options.severityGte;
      }

      if (options?.cvssGte !== undefined) {
        findingOptions.cvssGte = options.cvssGte;
      }

      if (options?.onlyPolicyViolations) {
        findingOptions.policyViolation = true;
      }

      if (options?.onlyNewFindings) {
        findingOptions.newFindingsOnly = true;
      }

      return await this.getFindings(appId, findingOptions);
    } catch (error) {
      throw new Error(`Failed to fetch SCA findings: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get SCA findings by application name with enhanced filtering
   */
  async getSCAFindingsByName(name: string, options?: {
    includeTransitiveDependencies?: boolean;
    includeDirectDependencies?: boolean;
    severityGte?: number;
    cvssGte?: number;
    onlyPolicyViolations?: boolean;
    onlyNewFindings?: boolean;
    includeLicenseInfo?: boolean;
    page?: number;
    size?: number;
  }): Promise<VeracodeFinding[]> {
    try {
      // First search for applications with this name
      const searchResults = await this.searchApplications(name);

      if (searchResults.length === 0) {
        throw new Error(`No application found with name: ${name}`);
      }

      // If multiple results, look for exact match first
      let targetApp = searchResults.find(app => app.profile.name.toLowerCase() === name.toLowerCase());

      // If no exact match, use the first result but warn about it
      if (!targetApp) {
        targetApp = searchResults[0];
        console.warn(`No exact match found for "${name}". Using first result: "${targetApp.profile.name}"`);
      }

      // Get SCA findings using the GUID
      return await this.getSCAFindings(targetApp.guid, options);
    } catch (error) {
      throw new Error(`Failed to fetch SCA findings by name: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get detailed static flaw information including data paths for a specific finding
   * Returns detailed data path information for static analysis findings
   */
  async getStaticFlawInfo(
    appId: string,
    issueId: string | number,
    context?: string
  ): Promise<VeracodeStaticFlawInfo> {
    try {
      let url = `appsec/v2/applications/${appId}/findings/${issueId}/static_flaw_info`;

      if (context) {
        url += `?context=${encodeURIComponent(context)}`;
      }

      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch static flaw info: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get detailed static flaw information by application name and issue ID
   * First searches for the application, then retrieves static flaw data paths
   */
  async getStaticFlawInfoByName(
    name: string,
    issueId: string | number,
    context?: string
  ): Promise<VeracodeStaticFlawInfo> {
    try {
      // First search for applications with this name
      const searchResults = await this.searchApplications(name);

      if (searchResults.length === 0) {
        throw new Error(`No application found with name: ${name}`);
      }

      // If multiple results, look for exact match first
      let targetApp = searchResults.find(app => app.profile.name.toLowerCase() === name.toLowerCase());

      // If no exact match, use the first result but warn about it
      if (!targetApp) {
        targetApp = searchResults[0];
        console.warn(`No exact match found for "${name}". Using first result: "${targetApp.profile.name}"`);
      }

      // Get static flaw info using the GUID
      return await this.getStaticFlawInfo(targetApp.guid, issueId, context);
    } catch (error) {
      throw new Error(`Failed to fetch static flaw info by name: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Convert relative Veracode platform URLs to full URLs
   * Platform URLs from the API are returned as relative paths like "HomeAppProfile:44841:806568"
   * This method converts them to full URLs like "https://web.analysiscenter.veracode.com/HomeAppProfile:44841:806568"
   */
  private convertToFullUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;

    // If already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Convert relative platform URL to full URL
    return `${this.platformBaseUrl}/auth/index.jsp#${url}`;
  }

  /**
   * Type guard to check if finding details are SCA-specific
   */
  isSCAFinding(finding: VeracodeFinding): finding is VeracodeFinding & { finding_details: VeracodeSCAFinding } {
    return finding.scan_type === 'SCA';
  }

  /**
   * Type guard to check if finding details are Static Analysis
   */
  isStaticFinding(finding: VeracodeFinding): finding is VeracodeFinding & { finding_details: VeracodeStaticFinding } {
    return finding.scan_type === 'STATIC';
  }

  /**
   * Type guard to check if finding details are Dynamic Analysis
   */
  isDynamicFinding(finding: VeracodeFinding): finding is VeracodeFinding & { finding_details: VeracodeDynamicFinding } {
    return finding.scan_type === 'DYNAMIC';
  }

  /**
   * Type guard to check if finding details are Manual
   */
  isManualFinding(finding: VeracodeFinding): finding is VeracodeFinding & { finding_details: VeracodeManualFinding } {
    return finding.scan_type === 'MANUAL';
  }

  /**
   * Enhanced findings retrieval with proper typing and detailed information
   */
  async getEnhancedFindings(
    appId: string,
    options?: {
      scanType?: 'STATIC' | 'DYNAMIC' | 'MANUAL' | 'SCA';
      severity?: number;
      severityGte?: number;
      cwe?: number[];
      cvss?: number;
      cvssGte?: number;
      cve?: string;
      context?: 'APPLICATION' | 'SANDBOX';
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
  ): Promise<{
    findings: VeracodeFinding[];
    summary: {
      totalFindings: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
      policyViolations: number;
      newFindings: number;
    };
  }> {
    try {
      const findings = await this.getFindings(appId, {
        scanType: options?.scanType,
        severity: options?.severity,
        severityGte: options?.severityGte,
        cwe: options?.cwe,
        cvss: options?.cvss,
        cvssGte: options?.cvssGte,
        cve: options?.cve,
        context: options?.context,
        findingCategory: options?.findingCategory,
        includeAnnotations: options?.includeAnnotations ?? true,
        includeExpirationDate: options?.includeExpirationDate ?? true,
        mitigatedAfter: options?.mitigatedAfter,
        newFindingsOnly: options?.newFindingsOnly,
        scaDependencyMode: options?.scaDependencyMode,
        scaScanMode: options?.scaScanMode,
        policyViolation: options?.policyViolation,
        page: options?.page,
        size: options?.size
      });

      // Generate summary statistics
      const byType: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      let policyViolations = 0;
      let newFindings = 0;

      findings.forEach(finding => {
        // Count by scan type
        byType[finding.scan_type] = (byType[finding.scan_type] || 0) + 1;

        // Count by severity
        const severity = finding.finding_details.severity;
        const severityName = ['Very Low', 'Low', 'Medium', 'High', 'Very High'][severity] || `Level ${severity}`;
        bySeverity[severityName] = (bySeverity[severityName] || 0) + 1;

        // Count policy violations
        if (finding.violates_policy) {
          policyViolations++;
        }

        // Count new findings
        if (finding.finding_status.new) {
          newFindings++;
        }
      });

      return {
        findings,
        summary: {
          totalFindings: findings.length,
          byType,
          bySeverity,
          policyViolations,
          newFindings
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch enhanced findings: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get SCA findings with comprehensive details including exploitability
   */
  async getComprehensiveSCAFindings(appId: string, options?: {
    includeTransitiveDependencies?: boolean;
    includeDirectDependencies?: boolean;
    severityGte?: number;
    cvssGte?: number;
    onlyPolicyViolations?: boolean;
    onlyNewFindings?: boolean;
    onlyWithExploits?: boolean;
    includeLicenseInfo?: boolean;
    page?: number;
    size?: number;
  }): Promise<{
    findings: VeracodeFinding[];
    scaAnalysis: {
      totalComponents: number;
      vulnerableComponents: number;
      highRiskComponents: number;
      exploitableFindings: number;
      licensingIssues: number;
      directDependencies: number;
      transitiveDependencies: number;
      severityBreakdown: Record<string, number>;
      topVulnerabilities: Array<{
        cve: string;
        component: string;
        version: string;
        cvss: number;
        exploitable: boolean;
      }>;
    };
  }> {
    try {
      const enhancedResult = await this.getEnhancedFindings(appId, {
        scanType: 'SCA',
        includeAnnotations: true,
        includeExpirationDate: true,
        severityGte: options?.severityGte,
        cvssGte: options?.cvssGte,
        policyViolation: options?.onlyPolicyViolations,
        newFindingsOnly: options?.onlyNewFindings,
        scaDependencyMode: options?.includeTransitiveDependencies && options?.includeDirectDependencies ? 'BOTH' :
          options?.includeTransitiveDependencies ? 'TRANSITIVE' :
            options?.includeDirectDependencies ? 'DIRECT' : undefined,
        page: options?.page,
        size: options?.size || 500
      });

      const findings = enhancedResult.findings;

      // Filter for exploitable findings if requested
      const filteredFindings = options?.onlyWithExploits ?
        findings.filter(f => this.isSCAFinding(f) && f.finding_details.cve?.exploitability?.exploit_observed) :
        findings;

      // Analyze SCA-specific data
      const componentMap = new Map<string, Set<string>>();
      let vulnerableComponents = 0;
      let highRiskComponents = 0;
      let exploitableFindings = 0;
      let licensingIssues = 0;
      let directDependencies = 0;
      let transitiveDependencies = 0;
      const topVulnerabilities: Array<{
        cve: string;
        component: string;
        version: string;
        cvss: number;
        exploitable: boolean;
      }> = [];

      filteredFindings.forEach(finding => {
        if (this.isSCAFinding(finding)) {
          const details = finding.finding_details;

          // Track unique components
          const componentKey = `${details.component_filename}:${details.version}`;
          if (!componentMap.has(componentKey)) {
            componentMap.set(componentKey, new Set());
          }

          // Count vulnerabilities per component
          if (details.cve) {
            componentMap.get(componentKey)!.add(details.cve.name);
            vulnerableComponents++;

            // Track top vulnerabilities
            topVulnerabilities.push({
              cve: details.cve.name,
              component: details.component_filename || 'Unknown',
              version: details.version || 'Unknown',
              cvss: details.cve.cvss,
              exploitable: details.cve.exploitability?.exploit_observed || false
            });
          }

          // Count high-risk components (severity 4-5)
          if (details.severity >= 4) {
            highRiskComponents++;
          }

          // Count exploitable findings
          if (details.cve?.exploitability?.exploit_observed) {
            exploitableFindings++;
          }

          // Count licensing issues
          if (details.licenses && details.licenses.some(l => parseInt(l.risk_rating) > 2)) {
            licensingIssues++;
          }

          // Count dependency types based on metadata
          if (details.metadata?.includes('DIRECT')) {
            directDependencies++;
          } else if (details.metadata?.includes('TRANSITIVE')) {
            transitiveDependencies++;
          }
        }
      });

      // Sort top vulnerabilities by CVSS score
      topVulnerabilities.sort((a, b) => b.cvss - a.cvss);

      return {
        findings: filteredFindings,
        scaAnalysis: {
          totalComponents: componentMap.size,
          vulnerableComponents,
          highRiskComponents,
          exploitableFindings,
          licensingIssues,
          directDependencies,
          transitiveDependencies,
          severityBreakdown: enhancedResult.summary.bySeverity,
          topVulnerabilities: topVulnerabilities.slice(0, 10) // Top 10 vulnerabilities
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch comprehensive SCA findings: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Extract error message from axios error
   */
  private getErrorMessage(error: any): string {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        return "Authentication failed. Please check your API credentials.";
      } else if (status === 403) {
        return "Access forbidden. You may not have permission to access this resource.";
      } else if (status === 404) {
        return "Resource not found.";
      } else if (status === 429) {
        return "Rate limit exceeded. Please try again later.";
      } else if (data && typeof data === "object") {
        return data.message || data.error || `HTTP ${status}`;
      } else {
        return `HTTP ${status}`;
      }
    } else if (error.request) {
      // Request made but no response received
      return "No response received from Veracode API. Please check your network connection.";
    } else {
      // Something else happened
      return error.message || "Unknown error occurred";
    }
  }

  /**
   * Get all findings for an application across multiple pages
   * Automatically handles pagination to retrieve all findings
   */
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
      context?: string;
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
}
