// Base HTTP client with Veracode authentication

import axios, { AxiosInstance } from 'axios';
import { VeracodeHMACAuth } from '../auth/hmac-auth.js';
import { logger } from '../../utils/logger.js';
import { loadVeracodeCredentials } from '../../utils/credentials.js';

export interface VeracodeClientOptions {
    apiBaseUrl?: string;
    platformBaseUrl?: string;
    timeout?: number;
}

export class BaseVeracodeClient {
    protected apiClient: AxiosInstance;
    protected platformBaseUrl: string;
    private auth: VeracodeHMACAuth;

    constructor(
        apiId?: string,
        apiKey?: string,
        options?: VeracodeClientOptions
    ) {
        // If no credentials provided, try to load from environment
        if (!apiId || !apiKey) {
            const credentials = loadVeracodeCredentials();
            apiId = credentials.apiId;
            apiKey = credentials.apiKey;
            options = {
                ...options,
                apiBaseUrl: options?.apiBaseUrl || credentials.apiBaseUrl,
                platformBaseUrl: options?.platformBaseUrl || credentials.platformBaseUrl
            };
        }

        logger.debug('Initializing BaseVeracodeClient', 'CLIENT', {
            hasApiId: !!apiId,
            hasApiKey: !!apiKey,
            options
        });

        this.auth = new VeracodeHMACAuth(apiId!, apiKey!);

        // Determine API base URL (region-specific)
        const apiBaseUrl = options?.apiBaseUrl || process.env.VERACODE_API_BASE_URL || 'https://api.veracode.com/';

        logger.debug('API base URL determined', 'CLIENT', { apiBaseUrl });

        // Auto-derive platform URL from API URL if not explicitly provided
        if (options?.platformBaseUrl) {
            this.platformBaseUrl = options.platformBaseUrl;
        } else if (process.env.VERACODE_PLATFORM_URL) {
            this.platformBaseUrl = process.env.VERACODE_PLATFORM_URL;
        } else {
            // Auto-derive platform URL from API base URL
            this.platformBaseUrl = this.derivePlatformUrl(apiBaseUrl);
        }

        logger.debug('Platform URL configured', 'CLIENT', { platformBaseUrl: this.platformBaseUrl });

        this.apiClient = axios.create({
            baseURL: apiBaseUrl,
            timeout: options?.timeout || 30000
        });

        logger.debug('Axios client created', 'CLIENT', {
            baseURL: apiBaseUrl,
            timeout: options?.timeout || 30000
        });

        // Add request interceptor for HMAC authentication
        this.apiClient.interceptors.request.use(config => {
            return this.auth.addAuthToConfig(config, apiBaseUrl);
        });

        // Add response interceptor for logging
        this.apiClient.interceptors.response.use(
            response => {
                logger.debug('API Response received', 'CLIENT', {
                    method: response.config.method?.toUpperCase(),
                    url: response.config.url,
                    status: response.status,
                    dataSize: response.data ? JSON.stringify(response.data).length : 0
                });
                return response;
            },
            error => {
                logger.error('API Request failed', 'CLIENT', {
                    method: error.config?.method?.toUpperCase(),
                    url: error.config?.url,
                    status: error.response?.status,
                    message: error.message,
                    data: error.response?.data
                });
                return Promise.reject(error);
            }
        );

        logger.info('BaseVeracodeClient initialized successfully', 'CLIENT');
    }

    // Create a client instance using credentials from environment variables
    static fromEnvironment(options?: VeracodeClientOptions): BaseVeracodeClient {
        const credentials = loadVeracodeCredentials();

        return new BaseVeracodeClient(credentials.apiId, credentials.apiKey, {
            apiBaseUrl: options?.apiBaseUrl || credentials.apiBaseUrl,
            platformBaseUrl: options?.platformBaseUrl || credentials.platformBaseUrl,
            timeout: options?.timeout
        });
    }

    // Derive platform URL from API base URL for different regions
    private derivePlatformUrl(apiBaseUrl: string): string {
        try {
            const apiUrl = new URL(apiBaseUrl);
            const apiHost = apiUrl.hostname;

            // Map API hostnames to platform hostnames
            const regionMap: Record<string, string> = {
                'api.veracode.com': 'analysiscenter.veracode.com', // Commercial US
                'api.veracode.eu': 'analysiscenter.veracode.eu', // European
                'api.veracode.us': 'analysiscenter.veracode.us' // US Federal
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

    // Utility method to convert relative platform URLs to full URLs
    protected convertToFullUrl(relativePath?: string): string | undefined {
        if (!relativePath) return undefined;

        // If already a full URL, return as-is
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath;
        }

        // Convert relative path to full platform URL. It's generally HomeAppProfile or similar
        return `${this.platformBaseUrl}/auth/index.jsp#${relativePath}`;
    }

    // Utility method to extract error messages from various error types
    protected getErrorMessage(error: any): string {
        if (error?.response?.data?.message) {
            return error.response.data.message;
        }
        if (error?.response?.data?.error) {
            return error.response.data.error;
        }
        if (error?.response?.data) {
            return JSON.stringify(error.response.data);
        }
        if (error?.message) {
            return error.message;
        }
        return String(error);
    }
}
