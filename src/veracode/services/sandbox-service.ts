// Sandbox management service for Veracode API

import { BaseVeracodeClient } from '../client/base-client.js';
import { VeracodeSandbox, SandboxQueryParams } from '../types/sandbox.js';
import { VeracodeApplication } from '../types/application.js';
import { ApplicationService } from './application-service.js';
import { logger } from '../../utils/logger.js';

export class SandboxService extends BaseVeracodeClient {
    private applicationService: ApplicationService;

    constructor(apiId?: string, apiKey?: string, options?: any) {
        super(apiId, apiKey, options);
        this.applicationService = new ApplicationService(apiId, apiKey, options);
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
            const searchResults = await this.applicationService.searchApplications(applicationName);

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
}
