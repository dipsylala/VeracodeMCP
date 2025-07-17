// Main Veracode client that composes all services

import { BaseVeracodeClient, VeracodeClientOptions } from './base-client.js';
import { ApplicationService } from '../services/application-service.js';
import { SandboxService } from '../services/sandbox-service.js';
import { FindingsService } from '../services/findings-service.js';
import { ScanService } from '../services/scan-service.js';
import { PolicyService } from '../services/policy-service.js';

export class VeracodeClient extends BaseVeracodeClient {
  public readonly applications: ApplicationService;
  public readonly sandboxes: SandboxService;
  public readonly findings: FindingsService;
  public readonly scans: ScanService;
  public readonly policies: PolicyService;

  constructor(
    apiId?: string,
    apiKey?: string,
    options?: VeracodeClientOptions
  ) {
    super(apiId, apiKey, options);

    // Initialize services with proper dependency injection to share instances
    this.applications = new ApplicationService(apiId, apiKey, options);
    this.policies = new PolicyService(apiId, apiKey, options);
    this.sandboxes = new SandboxService(apiId, apiKey, options);
    this.scans = new ScanService(apiId, apiKey, options, this.sandboxes);
    this.findings = new FindingsService(apiId, apiKey, options, this.applications, this.scans);
  }

  // Create a client instance using credentials from environment variables
  static fromEnvironment(options?: VeracodeClientOptions): VeracodeClient {
    return new VeracodeClient(undefined, undefined, options);
  }
}
