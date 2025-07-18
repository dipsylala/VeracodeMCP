import * as dotenv from 'dotenv';
import { logger } from './logger.js';

export interface VeracodeCredentials {
  apiId: string;
  apiKey: string;
  apiBaseUrl?: string;
  platformBaseUrl?: string;
}

// Load Veracode credentials from environment variables
// Automatically loads .env file if not already loaded
export function loadVeracodeCredentials(): VeracodeCredentials {
  // Load environment variables from .env file
  dotenv.config();

  const apiId = process.env.VERACODE_API_ID;
  const apiKey = process.env.VERACODE_API_KEY;

  if (!apiId || !apiKey) {
    const missingVars = [];
    if (!apiId) missingVars.push('VERACODE_API_ID');
    if (!apiKey) missingVars.push('VERACODE_API_KEY');

    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`, 'CREDENTIALS');
    logger.error('Please set these variables in your .env file or environment', 'CREDENTIALS');
    throw new Error(`Missing required Veracode credentials: ${missingVars.join(', ')}`);
  }

  logger.debug('Veracode credentials loaded successfully', 'CREDENTIALS', {
    hasApiId: !!apiId,
    hasApiKey: !!apiKey,
    apiBaseUrl: process.env.VERACODE_API_BASE_URL || 'default',
    platformBaseUrl: process.env.VERACODE_PLATFORM_URL || 'auto-derived'
  });

  return {
    apiId,
    apiKey,
    apiBaseUrl: process.env.VERACODE_API_BASE_URL,
    platformBaseUrl: process.env.VERACODE_PLATFORM_URL
  };
}

// Check if Veracode credentials are available in environment
export function hasVeracodeCredentials(): boolean {
  dotenv.config();
  return !!(process.env.VERACODE_API_ID && process.env.VERACODE_API_KEY);
}

// Create a VeracodeClient with credentials from environment
// Throws an error if credentials are not available
export function createVeracodeClientFromEnv(): any {
  const credentials = loadVeracodeCredentials();

  // Dynamic import to avoid circular dependency
  return import('../veracode/index.js').then(module => {
    const { VeracodeClient } = module;
    return new VeracodeClient(credentials.apiId, credentials.apiKey, {
      apiBaseUrl: credentials.apiBaseUrl,
      platformBaseUrl: credentials.platformBaseUrl
    });
  });
}
