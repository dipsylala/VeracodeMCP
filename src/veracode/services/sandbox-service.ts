// Sandbox management service for Veracode API

import { BaseVeracodeClient } from '../client/base-client.js';
import { VeracodeSandbox, SandboxQueryParams } from '../types/sandbox.js';
import { logger } from '../../utils/logger.js';

export class SandboxService extends BaseVeracodeClient {

  constructor(
    apiId?: string,
    apiKey?: string,
    options?: any
  ) {
    super(apiId, apiKey, options);
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

}
