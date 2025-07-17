// Findings and scan management service for Veracode API

import { BaseVeracodeClient } from '../client/base-client.js';
import {
  VeracodeFinding,
  FindingsQueryOptions,
  PaginatedFindingsResult,
  PagedFindingsResponse,
  VeracodePolicyCompliance,
  VeracodeStaticFlawInfo
} from '../types/findings.js';
import { ApplicationService } from './application-service.js';
import { ScanService } from './scan-service.js';
import { logger } from '../../utils/logger.js';

export class FindingsService extends BaseVeracodeClient {
  private applicationService: ApplicationService;
  private scanService: ScanService;

  constructor(
    apiId?: string,
    apiKey?: string,
    options?: any,
    applicationService?: ApplicationService,
    scanService?: ScanService
  ) {
    super(apiId, apiKey, options);

    // Require dependencies to be explicitly injected
    if (!applicationService) {
      throw new Error('ApplicationService dependency is required for FindingsService');
    }
    if (!scanService) {
      throw new Error('ScanService dependency is required for FindingsService');
    }

    this.applicationService = applicationService;
    this.scanService = scanService;
  }

  // Get findings for an application with pagination metadata
  async getFindingsPaginated(appId: string, options?: FindingsQueryOptions): Promise<PaginatedFindingsResult> {
    try {
      // Check if the application has any scans first
      const scanCheck = await this.scanService.hasScans(appId, options?.scanType);

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

      // Let the API handle scan type validation - don't pre-filter
      // The API will return appropriate results for the requested scan type

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

  // Get findings for an application across multiple pages
  // Automatically handles pagination to retrieve all findings
  async getAllFindings(
    appId: string,
    options?: FindingsQueryOptions & {
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
      const application = await this.applicationService.getApplicationDetails(appId);

      // Get findings to calculate policy violations
      const result = await this.getFindingsPaginated(appId, { policyViolation: true });
      const findings = result.findings;

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

}
