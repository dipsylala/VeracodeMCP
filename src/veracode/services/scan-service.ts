// Scan management service for Veracode API
// Updated

import { BaseVeracodeClient } from '../client/base-client.js';
import { VeracodeScan } from '../types/application.js';
import { VeracodeSandbox } from '../types/sandbox.js';
import { ApplicationService } from './application-service.js';
import { SandboxService } from './sandbox-service.js';
import { isGuid } from '../../utils/validation.js';
import { logger } from '../../utils/logger.js';

export class ScanService extends BaseVeracodeClient {
    private applicationService: ApplicationService;
    private sandboxService: SandboxService;

    constructor(apiId?: string, apiKey?: string, options?: any) {
        super(apiId, apiKey, options);
        this.applicationService = new ApplicationService(apiId, apiKey, options);
        this.sandboxService = new SandboxService(apiId, apiKey, options);
    }

    // Get scans for an application (auto-detects GUID vs name)
    async getScans(identifier: string, scanType?: string, sandboxId?: string): Promise<VeracodeScan[]> {
        try {
            let appId: string;

            if (isGuid(identifier)) {
                // Use the GUID directly
                appId = identifier;
                logger.debug('Getting scans by application GUID', 'API', {
                    appId: identifier,
                    scanType,
                    sandboxId
                });
            } else {
                // Look up the application by name first
                logger.debug('Getting scans by application name', 'API', {
                    name: identifier,
                    scanType,
                    sandboxId
                });
                const application = await this.applicationService.getApplicationDetailsByName(identifier);
                appId = application.guid;
                logger.debug('Application found', 'API', {
                    name: identifier,
                    appId,
                    appName: application.profile.name
                });
            }

            // Get the actual scan data
            let url = `appsec/v1/applications/${appId}/scans`;
            const params = new URLSearchParams();

            if (scanType) {
                params.append('scan_type', scanType);
            }

            if (sandboxId) {
                params.append('context', sandboxId);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            // Log the raw HTTP request details
            logger.debug('Raw HTTP Request for scans', 'API', {
                method: 'GET',
                url: url,
                fullUrl: `${this.apiClient.defaults?.baseURL}/${url}`,
                headers: {
                    'Authorization': sandboxId ? `VERACODE-HMAC-SHA-256 (context: ${sandboxId})` : 'VERACODE-HMAC-SHA-256',
                    'Content-Type': 'application/json'
                },
                params: Object.fromEntries(params),
                context: sandboxId ? 'sandbox' : 'policy',
                appId,
                scanType: scanType || 'all'
            });

            const response = await this.apiClient.get(url);

            // Log the raw HTTP response details
            logger.debug('Raw HTTP Response for scans', 'API', {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                dataStructure: {
                    hasEmbedded: !!response.data._embedded,
                    hasScans: !!response.data._embedded?.scans,
                    scanCount: response.data._embedded?.scans?.length || 0,
                    topLevelKeys: Object.keys(response.data || {}),
                    embeddedKeys: response.data._embedded ? Object.keys(response.data._embedded) : []
                },
                rawResponseSize: JSON.stringify(response.data).length,
                url: url
            });
            const scans = response.data._embedded?.scans || [];

            logger.debug('Scans retrieved', 'API', {
                identifier,
                identifierType: isGuid(identifier) ? 'GUID' : 'name',
                appId,
                scanType: scanType || 'all',
                sandboxId: sandboxId || 'policy (main branch)',
                scanCount: scans.length,
                scans: scans.map((scan: any) => ({ scan_id: scan.scan_id, scan_type: scan.scan_type, status: scan.status }))
            });

            return scans;
        } catch (error) {
            throw new Error(`Failed to fetch scans: ${this.getErrorMessage(error)}`);
        }
    }

    // Check if an application has any scans (auto-detects GUID vs name)
    async hasScans(identifier: string, scanType?: string, sandboxId?: string): Promise<{ hasScans: boolean; scanCount: number; scanTypes: string[] }> {
        try {
            const scans = await this.getScans(identifier, scanType, sandboxId);
            const scanTypes = Array.from(new Set(scans.map((scan: any) => scan.scan_type))) as string[];

            logger.debug('Scan existence check completed', 'API', {
                identifier,
                identifierType: isGuid(identifier) ? 'GUID' : 'name',
                requestedScanType: scanType,
                sandboxId: sandboxId || 'policy (main branch)',
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
            logger.warn('Failed to check for scans', 'API', { identifier, scanType, sandboxId, error });
            throw new Error(`Failed to check for scans: ${this.getErrorMessage(error)}`);
        }
    }

    // Get all sandbox scans for an application (auto-detects GUID vs name)
    async getSandboxScans(identifier: string, scanType?: string): Promise<{
        application: { name: string; guid: string };
        sandboxes: Array<{
            sandbox: VeracodeSandbox;
            scans: VeracodeScan[];
            scanCount: number;
            scanTypes: string[];
        }>;
        totalSandboxScans: number;
    }> {
        try {
            let appId: string;
            let appName: string;

            if (isGuid(identifier)) {
                // Get application details to get the name
                const application = await this.applicationService.getApplicationDetails(identifier);
                appId = identifier;
                appName = application.profile.name;
                logger.debug('Getting sandbox scans by application GUID', 'API', {
                    appId: identifier,
                    appName,
                    scanType
                });
            } else {
                // Look up the application by name first
                logger.debug('Getting sandbox scans by application name', 'API', {
                    name: identifier,
                    scanType
                });
                const application = await this.applicationService.getApplicationDetailsByName(identifier);
                appId = application.guid;
                appName = application.profile.name;
                logger.debug('Application found', 'API', {
                    name: identifier,
                    appId,
                    appName
                });
            }

            // Get all sandboxes for the application
            const sandboxes = await this.sandboxService.getSandboxes(appId);

            if (sandboxes.length === 0) {
                logger.debug('No sandboxes found for application', 'API', { appId, appName });
                return {
                    application: { name: appName, guid: appId },
                    sandboxes: [],
                    totalSandboxScans: 0
                };
            }

            // Get scans for each sandbox
            const sandboxScansData = [];
            let totalSandboxScans = 0;

            for (const sandbox of sandboxes) {
                try {
                    const scans = await this.getScans(appId, scanType, sandbox.guid);
                    const scanTypes = Array.from(new Set(scans.map(scan => scan.scan_type))) as string[];

                    sandboxScansData.push({
                        sandbox,
                        scans,
                        scanCount: scans.length,
                        scanTypes
                    });

                    totalSandboxScans += scans.length;

                    logger.debug('Sandbox scans retrieved', 'API', {
                        sandboxName: sandbox.name,
                        sandboxId: sandbox.guid,
                        scanCount: scans.length,
                        scanTypes
                    });
                } catch (error) {
                    logger.warn('Failed to get scans for sandbox', 'API', {
                        sandboxName: sandbox.name,
                        sandboxId: sandbox.guid,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    // Continue with other sandboxes even if one fails
                    sandboxScansData.push({
                        sandbox,
                        scans: [],
                        scanCount: 0,
                        scanTypes: []
                    });
                }
            }

            logger.debug('All sandbox scans retrieved', 'API', {
                appName,
                appId,
                sandboxCount: sandboxes.length,
                totalSandboxScans,
                requestedScanType: scanType || 'all'
            });

            return {
                application: { name: appName, guid: appId },
                sandboxes: sandboxScansData,
                totalSandboxScans
            };
        } catch (error) {
            throw new Error(`Failed to fetch sandbox scans: ${this.getErrorMessage(error)}`);
        }
    }

    // Get scans for a specific sandbox by sandbox name
    async getScansBySandboxName(identifier: string, sandboxName: string, scanType?: string): Promise<{
        application: { name: string; guid: string };
        sandbox: VeracodeSandbox;
        scans: VeracodeScan[];
        scanCount: number;
        scanTypes: string[];
    }> {
        try {
            let appId: string;
            let appName: string;

            // Resolve application identifier
            if (isGuid(identifier)) {
                const application = await this.applicationService.getApplicationDetails(identifier);
                appId = identifier;
                appName = application.profile.name;
            } else {
                const application = await this.applicationService.getApplicationDetailsByName(identifier);
                appId = application.guid;
                appName = application.profile.name;
            }

            logger.debug('Getting scans for specific sandbox', 'API', {
                appName,
                appId,
                sandboxName,
                scanType
            });

            // Get sandboxes and find the one with matching name
            const sandboxes = await this.sandboxService.getSandboxes(appId);
            const targetSandbox = sandboxes.find(sb =>
                sb.name.toLowerCase() === sandboxName.toLowerCase()
            );

            if (!targetSandbox) {
                throw new Error(`Sandbox "${sandboxName}" not found for application "${appName}"`);
            }

            // Get scans for the specific sandbox
            const scans = await this.getScans(appId, scanType, targetSandbox.guid);
            const scanTypes = Array.from(new Set(scans.map(scan => scan.scan_type))) as string[];

            logger.debug('Sandbox scans retrieved by name', 'API', {
                appName,
                sandboxName,
                sandboxId: targetSandbox.guid,
                scanCount: scans.length,
                scanTypes
            });

            return {
                application: { name: appName, guid: appId },
                sandbox: targetSandbox,
                scans,
                scanCount: scans.length,
                scanTypes
            };
        } catch (error) {
            throw new Error(`Failed to fetch scans for sandbox "${sandboxName}": ${this.getErrorMessage(error)}`);
        }
    }

    // Compare policy scans vs sandbox scans
    async comparePolicyVsSandboxScans(identifier: string, scanType?: string): Promise<{
        application: { name: string; guid: string };
        policyScans: {
            scans: VeracodeScan[];
            scanCount: number;
            scanTypes: string[];
        };
        sandboxScans: {
            sandboxes: Array<{
                sandbox: VeracodeSandbox;
                scans: VeracodeScan[];
                scanCount: number;
                scanTypes: string[];
            }>;
            totalSandboxScans: number;
        };
        summary: {
            totalPolicyScans: number;
            totalSandboxScans: number;
            totalScans: number;
            policyOnlyTypes: string[];
            sandboxOnlyTypes: string[];
            commonTypes: string[];
        };
    }> {
        try {
            let appId: string;
            let appName: string;

            // Resolve application identifier
            if (isGuid(identifier)) {
                const application = await this.applicationService.getApplicationDetails(identifier);
                appId = identifier;
                appName = application.profile.name;
            } else {
                const application = await this.applicationService.getApplicationDetailsByName(identifier);
                appId = application.guid;
                appName = application.profile.name;
            }

            logger.debug('Comparing policy vs sandbox scans', 'API', {
                appName,
                appId,
                scanType
            });

            // Get policy scans (no sandbox context)
            const policyScans = await this.getScans(appId, scanType);
            const policyScanTypes = Array.from(new Set(policyScans.map(scan => scan.scan_type))) as string[];

            // Get all sandbox scans
            const sandboxScansResult = await this.getSandboxScans(appId, scanType);

            // Calculate summary statistics
            const allSandboxTypes = new Set<string>();
            sandboxScansResult.sandboxes.forEach(sbData => {
                sbData.scanTypes.forEach(type => allSandboxTypes.add(type));
            });

            const policyTypesSet = new Set(policyScanTypes);
            const sandboxTypesSet = allSandboxTypes;

            const policyOnlyTypes = policyScanTypes.filter(type => !sandboxTypesSet.has(type));
            const sandboxOnlyTypes = Array.from(sandboxTypesSet).filter(type => !policyTypesSet.has(type));
            const commonTypes = policyScanTypes.filter(type => sandboxTypesSet.has(type));

            const result = {
                application: { name: appName, guid: appId },
                policyScans: {
                    scans: policyScans,
                    scanCount: policyScans.length,
                    scanTypes: policyScanTypes
                },
                sandboxScans: {
                    sandboxes: sandboxScansResult.sandboxes,
                    totalSandboxScans: sandboxScansResult.totalSandboxScans
                },
                summary: {
                    totalPolicyScans: policyScans.length,
                    totalSandboxScans: sandboxScansResult.totalSandboxScans,
                    totalScans: policyScans.length + sandboxScansResult.totalSandboxScans,
                    policyOnlyTypes,
                    sandboxOnlyTypes,
                    commonTypes
                }
            };

            logger.debug('Policy vs sandbox comparison completed', 'API', {
                appName,
                totalPolicyScans: result.summary.totalPolicyScans,
                totalSandboxScans: result.summary.totalSandboxScans,
                totalScans: result.summary.totalScans,
                policyTypes: policyScanTypes,
                sandboxTypes: Array.from(sandboxTypesSet),
                commonTypes,
                policyOnlyTypes,
                sandboxOnlyTypes
            });

            return result;
        } catch (error) {
            throw new Error(`Failed to compare policy vs sandbox scans: ${this.getErrorMessage(error)}`);
        }
    }

    // Get scan summary across policy and all sandboxes
    async getScanSummary(identifier: string): Promise<{
        application: { name: string; guid: string };
        policy: {
            scanCount: number;
            scanTypes: string[];
            latestScan?: VeracodeScan;
        };
        sandboxes: Array<{
            sandbox: VeracodeSandbox;
            scanCount: number;
            scanTypes: string[];
            latestScan?: VeracodeScan;
        }>;
        totals: {
            policyScans: number;
            sandboxScans: number;
            totalScans: number;
            allScanTypes: string[];
        };
    }> {
        try {
            let appId: string;
            let appName: string;

            // Resolve application identifier
            if (isGuid(identifier)) {
                const application = await this.applicationService.getApplicationDetails(identifier);
                appId = identifier;
                appName = application.profile.name;
            } else {
                const application = await this.applicationService.getApplicationDetailsByName(identifier);
                appId = application.guid;
                appName = application.profile.name;
            }

            logger.debug('Getting scan summary', 'API', { appName, appId });

            // Get policy scans
            const policyScans = await this.getScans(appId);
            const policyScanTypes = Array.from(new Set(policyScans.map(scan => scan.scan_type))) as string[];
            const latestPolicyScans = policyScans.sort((a, b) => {
                const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
                const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
                return dateB - dateA;
            });

            // Get sandbox scans
            const sandboxScansResult = await this.getSandboxScans(appId);

            // Process sandbox data to include latest scan info
            const sandboxSummaries = sandboxScansResult.sandboxes.map(sbData => {
                const latestScan = sbData.scans.length > 0
                    ? sbData.scans.sort((a, b) => {
                        const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
                        const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
                        return dateB - dateA;
                    })[0]
                    : undefined;

                return {
                    sandbox: sbData.sandbox,
                    scanCount: sbData.scanCount,
                    scanTypes: sbData.scanTypes,
                    latestScan
                };
            });

            // Calculate totals
            const allScanTypesSet = new Set<string>();
            policyScanTypes.forEach(type => allScanTypesSet.add(type));
            sandboxSummaries.forEach(sb => {
                sb.scanTypes.forEach(type => allScanTypesSet.add(type));
            });

            const result = {
                application: { name: appName, guid: appId },
                policy: {
                    scanCount: policyScans.length,
                    scanTypes: policyScanTypes,
                    latestScan: latestPolicyScans[0]
                },
                sandboxes: sandboxSummaries,
                totals: {
                    policyScans: policyScans.length,
                    sandboxScans: sandboxScansResult.totalSandboxScans,
                    totalScans: policyScans.length + sandboxScansResult.totalSandboxScans,
                    allScanTypes: Array.from(allScanTypesSet)
                }
            };

            logger.debug('Scan summary completed', 'API', {
                appName,
                policyScans: result.totals.policyScans,
                sandboxScans: result.totals.sandboxScans,
                totalScans: result.totals.totalScans,
                sandboxCount: sandboxSummaries.length,
                allScanTypes: result.totals.allScanTypes
            });

            return result;
        } catch (error) {
            throw new Error(`Failed to get scan summary: ${this.getErrorMessage(error)}`);
        }
    }
}
