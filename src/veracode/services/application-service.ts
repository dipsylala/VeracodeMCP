// Application management service for Veracode API
// Aligned with Veracode Applications API Specification v1.0 (Swagger)
// Base endpoint: /appsec/v1/applications

import { BaseVeracodeClient } from '../client/base-client.js';
import { VeracodeApplication, ApplicationQueryParams } from '../types/application.js';
import { logger } from '../../utils/logger.js';

export class ApplicationService extends BaseVeracodeClient {
  // Get list of all applications with full parameter support per Swagger API v1.0
  async getApplications(params?: ApplicationQueryParams): Promise<VeracodeApplication[]> {
    const startTime = Date.now();
    logger.debug('Getting applications with parameters', 'API', { params });

    try {
      // Build query string from parameters according to Swagger API specification
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              // Handle array parameters (scan_status, custom_field_names, custom_field_values)
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
        hasEmbedded: !!response.data._embedded,
        pageInfo: response.data.page || null
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

  // Search applications by name (convenience method that uses getApplications with name filter)
  async searchApplications(name: string, additionalParams?: Omit<ApplicationQueryParams, 'name'>): Promise<VeracodeApplication[]> {
    try {
      return await this.getApplications({
        name,
        ...additionalParams
      });
    } catch (error) {
      throw new Error(`Failed to search applications by name "${name}": ${this.getErrorMessage(error)}`);
    }
  }

  // Get detailed information about a specific application by GUID (per Swagger API spec)
  async getApplicationDetails(applicationGuid: string): Promise<VeracodeApplication> {
    const startTime = Date.now();
    logger.debug('Getting application details', 'API', { applicationGuid });

    try {
      const url = `appsec/v1/applications/${applicationGuid}`;
      logger.apiRequest('GET', url);
      const response = await this.apiClient.get(url);
      const responseTime = Date.now() - startTime;

      const application = response.data;
      logger.apiResponse('GET', url, response.status, responseTime, 1);

      // Convert relative URLs to full platform URLs according to API response format
      const processedApp = {
        ...application,
        app_profile_url: this.convertToFullUrl(application.app_profile_url),
        results_url: this.convertToFullUrl(application.results_url),
        scans: application.scans?.map((scan: any) => ({
          ...scan,
          scan_url: this.convertToFullUrl(scan.scan_url)
        }))
      };

      logger.debug('Application details retrieved and processed', 'API', {
        applicationGuid,
        name: processedApp.profile?.name,
        executionTime: responseTime
      });

      return processedApp;
    } catch (error) {
      logger.apiError('GET', `appsec/v1/applications/${applicationGuid}`, error);
      throw new Error(`Failed to fetch application details for GUID "${applicationGuid}": ${this.getErrorMessage(error)}`);
    }
  }

  // Get detailed information about an application by its name
  // First searches for the application, then retrieves full details using the GUID
  async getApplicationDetailsByName(name: string): Promise<VeracodeApplication> {
    const startTime = Date.now();
    logger.debug('Getting application details by name', 'API', { name });

    try {
      // First search for applications with this name using exact parameter matching
      const searchResults = await this.searchApplications(name);

      if (searchResults.length === 0) {
        throw new Error(`No application found with name: "${name}"`);
      }

      // If multiple results, look for exact match first (case-insensitive)
      let targetApp = searchResults.find(app =>
        app.profile.name.toLowerCase() === name.toLowerCase()
      );

      // If no exact match, use the first result and log a warning
      if (!targetApp) {
        targetApp = searchResults[0];
        logger.debug('No exact name match found, using first result', 'API', {
          searchName: name,
          foundName: targetApp.profile.name,
          totalResults: searchResults.length
        });
      }

      // Get the full details for the selected application using its GUID
      const detailedApp = await this.getApplicationDetails(targetApp.guid);

      const executionTime = Date.now() - startTime;
      logger.debug('Application details by name completed', 'API', {
        searchName: name,
        foundName: detailedApp.profile.name,
        applicationGuid: detailedApp.guid,
        executionTime
      });

      return detailedApp;
    } catch (error) {
      logger.apiError('GET', `application-by-name/${name}`, error);
      throw new Error(`Failed to fetch application details by name "${name}": ${this.getErrorMessage(error)}`);
    }
  }
}
