// Scan management service for Veracode API
// Simplified - expects application GUIDs, tools handle resolution and add names

import { BaseVeracodeClient } from '../client/base-client.js';
import { VeracodeScan } from '../types/application.js';
import { VeracodeSandbox } from '../types/sandbox.js';
import { SandboxService } from './sandbox-service.js';
import { logger } from '../../utils/logger.js';

export class ScanService extends BaseVeracodeClient {
  private sandboxService: SandboxService;

  constructor(
    apiId?: string,
    apiKey?: string,
    options?: any,
    sandboxService?: SandboxService
  ) {
    super(apiId, apiKey, options);

    if (!sandboxService) {
      throw new Error('SandboxService dependency is required for ScanService');
    }

    this.sandboxService = sandboxService;
  }

  // Get scans for an application by GUID
  async getScans(applicationGuid: string, scanType?: string, sandboxId?: string): Promise<VeracodeScan[]> {
    try {
      logger.debug('Getting scans for application', 'API', {
        applicationGuid,
        scanType,
        sandboxId
      });

      let url = `appsec/v1/applications/${applicationGuid}/scans`;
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

      logger.debug('Raw HTTP Request for scans', 'API', {
        method: 'GET',
        url: url,
        params: Object.fromEntries(params),
        context: sandboxId ? 'sandbox' : 'policy',
        applicationGuid,
        scanType: scanType || 'all'
      });

      const response = await this.apiClient.get(url);
      const scans = response.data._embedded?.scans || [];

      logger.debug('Scans retrieved', 'API', {
        applicationGuid,
        scanType: scanType || 'all',
        sandboxId: sandboxId || 'policy (main branch)',
        scanCount: scans.length
      });

      return scans;
    } catch (error) {
      throw new Error(`Failed to fetch scans: ${this.getErrorMessage(error)}`);
    }
  }

  // Check if an application has any scans
  async hasScans(applicationGuid: string, scanType?: string, sandboxId?: string): Promise<{ hasScans: boolean; scanCount: number; scanTypes: string[] }> {
    try {
      const scans = await this.getScans(applicationGuid, scanType, sandboxId);
      const scanTypes = Array.from(new Set(scans.map((scan: any) => scan.scan_type))) as string[];

      return {
        hasScans: scans.length > 0,
        scanCount: scans.length,
        scanTypes
      };
    } catch (error) {
      logger.warn('Failed to check for scans', 'API', { applicationGuid, scanType, sandboxId, error });
      throw new Error(`Failed to check for scans: ${this.getErrorMessage(error)}`);
    }
  }

  // Get all sandbox scans for an application
  async getSandboxScans(applicationGuid: string, scanType?: string): Promise<{
        sandboxes: Array<{
            sandbox: VeracodeSandbox;
            scans: VeracodeScan[];
            scanCount: number;
            scanTypes: string[];
        }>;
        totalSandboxScans: number;
    }> {
    try {
      logger.debug('Getting sandbox scans for application', 'API', {
        applicationGuid,
        scanType
      });

      const sandboxes = await this.sandboxService.getSandboxes(applicationGuid);

      if (sandboxes.length === 0) {
        return {
          sandboxes: [],
          totalSandboxScans: 0
        };
      }

      const sandboxScansData = [];
      let totalSandboxScans = 0;

      for (const sandbox of sandboxes) {
        try {
          const scans = await this.getScans(applicationGuid, scanType, sandbox.guid);
          const scanTypes = Array.from(new Set(scans.map(scan => scan.scan_type))) as string[];

          sandboxScansData.push({
            sandbox,
            scans,
            scanCount: scans.length,
            scanTypes
          });

          totalSandboxScans += scans.length;
        } catch (error) {
          logger.warn('Failed to get scans for sandbox', 'API', {
            sandboxName: sandbox.name,
            sandboxId: sandbox.guid,
            error: error instanceof Error ? error.message : String(error)
          });
          sandboxScansData.push({
            sandbox,
            scans: [],
            scanCount: 0,
            scanTypes: []
          });
        }
      }

      return {
        sandboxes: sandboxScansData,
        totalSandboxScans
      };
    } catch (error) {
      throw new Error(`Failed to fetch sandbox scans: ${this.getErrorMessage(error)}`);
    }
  }

  // Get scans for a specific sandbox by sandbox name
  async getScansBySandboxName(applicationGuid: string, sandboxName: string, scanType?: string): Promise<{
        sandbox: VeracodeSandbox;
        scans: VeracodeScan[];
        scanCount: number;
        scanTypes: string[];
    }> {
    try {
      logger.debug('Getting scans for specific sandbox', 'API', {
        applicationGuid,
        sandboxName,
        scanType
      });

      const sandboxes = await this.sandboxService.getSandboxes(applicationGuid);
      const targetSandbox = sandboxes.find(sb =>
        sb.name.toLowerCase() === sandboxName.toLowerCase()
      );

      if (!targetSandbox) {
        throw new Error(`Sandbox "${sandboxName}" not found for application`);
      }

      const scans = await this.getScans(applicationGuid, scanType, targetSandbox.guid);
      const scanTypes = Array.from(new Set(scans.map(scan => scan.scan_type))) as string[];

      return {
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
  async comparePolicyVsSandboxScans(applicationGuid: string, scanType?: string): Promise<{
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
      logger.debug('Comparing policy vs sandbox scans', 'API', {
        applicationGuid,
        scanType
      });

      // Get policy scans (no sandbox context)
      const policyScans = await this.getScans(applicationGuid, scanType);
      const policyScanTypes = Array.from(new Set(policyScans.map(scan => scan.scan_type))) as string[];

      // Get all sandbox scans
      const sandboxScansResult = await this.getSandboxScans(applicationGuid, scanType);

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

      return {
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
    } catch (error) {
      throw new Error(`Failed to compare policy vs sandbox scans: ${this.getErrorMessage(error)}`);
    }
  }

  // Get scan summary across policy and all sandboxes
  async getScanSummary(applicationGuid: string): Promise<{
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
      logger.debug('Getting scan summary', 'API', { applicationGuid });

      // Get policy scans
      const policyScans = await this.getScans(applicationGuid);
      const policyScanTypes = Array.from(new Set(policyScans.map(scan => scan.scan_type))) as string[];
      const latestPolicyScans = policyScans.sort((a, b) => {
        const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
        const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
        return dateB - dateA;
      });

      // Get sandbox scans
      const sandboxScansResult = await this.getSandboxScans(applicationGuid);

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

      return {
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
    } catch (error) {
      throw new Error(`Failed to get scan summary: ${this.getErrorMessage(error)}`);
    }
  }
}
