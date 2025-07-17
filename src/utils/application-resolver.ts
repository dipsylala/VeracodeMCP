// Common utility for resolving application profile identifiers to GUIDs
// This utility handles the common pattern of accepting either a GUID or application name
// and resolving it to the application GUID and details.

import { isGuid } from './validation.js';
import { logger } from './logger.js';

export interface ApplicationResolutionResult {
  guid: string;
  details: any;
  resolvedFromName: boolean;
}

/**
 * Resolves an application identifier (GUID or name) to application GUID and details
 * @param identifier - Application GUID or name
 * @param veracodeClient - Veracode client instance
 * @returns Promise<ApplicationResolutionResult> - Resolved application info
 * @throws Error if application not found or multiple matches without exact name match
 */
export async function resolveApplicationIdentifier(
  identifier: string,
  veracodeClient: any
): Promise<ApplicationResolutionResult> {
  if (isGuid(identifier)) {
    // It's already a GUID, get the application details
    logger.debug('Resolving application by GUID', 'APP_RESOLVER', { guid: identifier });

    try {
      const details = await veracodeClient.applications.getApplicationDetails(identifier);
      return {
        guid: identifier,
        details,
        resolvedFromName: false
      };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      throw new Error(`Application not found with GUID: ${identifier}`);
    }
  } else {
    // It's a name, need to resolve to GUID
    logger.debug('Resolving application by name', 'APP_RESOLVER', { name: identifier });

    const searchResults = await veracodeClient.applications.searchApplications(identifier);

    if (searchResults.length === 0) {
      throw new Error(`No application found with name: ${identifier}`);
    }

    // Look for exact match first (case-insensitive), otherwise use first result
    let targetApp = searchResults.find((app: any) =>
      app.profile.name.toLowerCase() === identifier.toLowerCase()
    );

    if (!targetApp) {
      if (searchResults.length > 1) {
        logger.debug('Multiple applications found, using first result as no exact match found', 'APP_RESOLVER', {
          searchName: identifier,
          foundCount: searchResults.length,
          firstResult: searchResults[0].profile.name
        });
      }
      targetApp = searchResults[0];
    } else {
      logger.debug('Found exact application name match', 'APP_RESOLVER', {
        searchName: identifier,
        foundName: targetApp.profile.name
      });
    }

    return {
      guid: targetApp.guid,
      details: targetApp,
      resolvedFromName: true
    };
  }
}

/**
 * Validates that an application identifier is provided and returns a normalized error message
 * @param identifier - The identifier to validate
 * @returns string | null - Error message if invalid, null if valid
 */
export function validateApplicationIdentifier(
  identifier: string | undefined | null
): string | null {
  if (!identifier || identifier.trim() === '') {
    return 'Missing required application identifier (Application profile ID (GUID) or exact application name)';
  }
  return null;
}

/**
 * Convenience function that combines validation and resolution
 * @param identifier - Application GUID or name
 * @param veracodeClient - Veracode client instance
 * @returns Promise<ApplicationResolutionResult> - Resolved application info
 * @throws Error with user-friendly message if validation fails or application not found
 */
export async function validateAndResolveApplication(
  identifier: string | undefined | null,
  veracodeClient: any
): Promise<ApplicationResolutionResult> {
  const validationError = validateApplicationIdentifier(identifier);
  if (validationError) {
    throw new Error(validationError);
  }

  return await resolveApplicationIdentifier(identifier!, veracodeClient);
}
