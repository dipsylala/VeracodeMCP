// Application management service for Veracode API

import { BaseVeracodeClient } from '../client/base-client.js';
import { VeracodeApplication, ApplicationQueryParams } from '../types/application.js';
import { logger } from '../../utils/logger.js';

export class ApplicationService extends BaseVeracodeClient {
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
}
