import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as crypto from "crypto";

export interface VeracodeApplication {
  guid: string;
  id: number;
  created: string;
  modified: string;
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
}

export interface VeracodeFinding {
  scan_type: string;
  description: string;
  count: number;
  context_type: string;
  context_guid: string;
  violates_policy: boolean;
  issue_id?: number;
  build_id?: number;
  grace_period_expires_date?: string;
  annotations?: Array<{
    action: string;
    comment: string;
    created: string;
    user_name: string;
    remaining_risk?: string;
    specifics?: string;
    technique?: string;
    verification?: string;
  }>;
  finding_status: {
    first_found_date: string;
    last_seen_date?: string;
    status: string;
    resolution: string;
    resolution_status: string;
    new: boolean;
    mitigation_review_status?: string;
  };
  finding_details: {
    severity: number;
    cwe?: {
      id: number;
      name: string;
      href?: string;
    };
    cvss?: string;
    // Static Analysis findings
    exploitability?: number;
    attack_vector?: string;
    file_line_number?: string;
    file_name?: string;
    file_path?: string;
    finding_category?: string;
    module?: string;
    procedure?: string;
    relative_location?: string;
    // Dynamic Analysis findings
    hostname?: string;
    port?: string;
    path?: string;
    plugin?: string;
    URL?: string;
    vulnerable_parameter?: string;
    discovered_by_vsa?: string;
    // Manual findings
    capec_id?: string;
    exploit_desc?: string;
    exploit_difficulty?: string;
    input_vector?: string;
    location?: string;
    remediation_desc?: string;
    severity_desc?: string;
    // SCA findings
    component_id?: string;
    licenses?: Array<{
      license_id: string;
      risk_rating: string;
    }>;
    cve?: {
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
      exploitability?: {
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
      };
    };
    version?: string;
    product_id?: string;
    component_filename?: string;
    language?: string;
    component_path?: Array<{
      path: string;
    }>;
    metadata?: string;
  };
}

export interface VeracodePolicyCompliance {
  policy_compliance_status: string;
  policy_name: string;
  policy_version: string;
  policy_evaluation_date: string;
  grace_period_expired: boolean;
  scan_overdue: boolean;
}

export class VeracodeClient {
  private apiClient: AxiosInstance;
  private apiId: string;
  private apiKey: string;

  constructor(apiId: string, apiKey: string) {
    this.apiId = apiId;
    this.apiKey = apiKey;

    this.apiClient = axios.create({
      baseURL: "https://api.veracode.com/",
      timeout: 30000,
    });

    // Add request interceptor for HMAC authentication
    this.apiClient.interceptors.request.use((config) => {
      return this.addHMACAuthentication(config);
    });
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
  private async generateVeracodeAuthHeader(url: string, method: string): Promise<string> {
    const verStr = "vcode_request_version_1";
    const data = `id=${this.apiId}&host=api.veracode.com&url=${url}&method=${method}`;
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
      const authHeader = this.generateVeracodeAuthHeaderSync(url, method);
      config.headers.set("Authorization", authHeader);
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return config;
  }

  /**
   * Generate Veracode authentication header using the correct multi-step HMAC process (synchronous version)
   */
  private generateVeracodeAuthHeaderSync(url: string, method: string): string {
    const verStr = "vcode_request_version_1";
    const data = `id=${this.apiId}&host=api.veracode.com&url=${url}&method=${method}`;
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
   * Get list of all applications
   */
  async getApplications(): Promise<VeracodeApplication[]> {
    try {
      const response = await this.apiClient.get("appsec/v1/applications");
      return response.data._embedded?.applications || [];
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
      return response.data._embedded?.applications || [];
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
      return response.data;
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
   * Get findings for an application
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

      const response = await this.apiClient.get(url);
      return response.data._embedded?.findings || [];
    } catch (error) {
      throw new Error(`Failed to fetch findings: ${this.getErrorMessage(error)}`);
    }
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
   * Get policy compliance status for an application
   */
  async getPolicyCompliance(appId: string): Promise<VeracodePolicyCompliance> {
    try {
      const response = await this.apiClient.get(`appsec/v1/applications/${appId}/policy`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policy compliance: ${this.getErrorMessage(error)}`);
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
}
