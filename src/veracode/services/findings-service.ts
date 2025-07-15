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

    constructor(apiId?: string, apiKey?: string, options?: any) {
        super(apiId, apiKey, options);
        this.applicationService = new ApplicationService(apiId, apiKey, options);
        this.scanService = new ScanService(apiId, apiKey, options);
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

    // Get findings for an application by its name
    // First searches for the application, then retrieves findings
    async getFindingsByName(name: string, options?: FindingsQueryOptions): Promise<VeracodeFinding[]> {
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
            const searchResults = await this.applicationService.searchApplications(name);

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

            const result = await this.getFindingsPaginated(targetApp.guid, options);
            const findings = result.findings;
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

    // Get policy compliance for an application by name
    async getPolicyComplianceByName(name: string): Promise<VeracodePolicyCompliance> {
        try {
            // First get the application to get its ID
            const application = await this.applicationService.getApplicationDetailsByName(name);

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
            const application = await this.applicationService.getApplicationDetailsByName(name);

            // Then get static flaw info using the ID
            return await this.getStaticFlawInfo(application.guid, issueId, sandbox_id);
        } catch (error) {
            throw new Error(`Failed to fetch static flaw info by name: ${this.getErrorMessage(error)}`);
        }
    }
}
