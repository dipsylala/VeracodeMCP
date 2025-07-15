// Policy management service for Veracode API

import { BaseVeracodeClient } from '../client/base-client.js';
import {
  VeracodePolicyListOptions,
  VeracodePolicyListResponse,
  VeracodePolicyVersion,
  VeracodePolicySettingsResponse
} from '../types/policy.js';

export class PolicyService extends BaseVeracodeClient {
  // Get list of policies with optional filtering
  async getPolicies(options?: VeracodePolicyListOptions): Promise<VeracodePolicyListResponse> {
    try {
      const params = new URLSearchParams();

      if (options?.category) params.append('category', options.category);
      if (options?.legacy_policy_id !== undefined) params.append('legacy_policy_id', options.legacy_policy_id.toString());
      if (options?.name) params.append('name', options.name);
      if (options?.name_exact !== undefined) params.append('name_exact', options.name_exact.toString());
      if (options?.page !== undefined) params.append('page', options.page.toString());
      if (options?.public_policy !== undefined) params.append('public_policy', options.public_policy.toString());
      if (options?.size !== undefined) params.append('size', options.size.toString());
      if (options?.vendor_policy !== undefined) params.append('vendor_policy', options.vendor_policy.toString());

      const url = `appsec/v1/policies${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policies: ${this.getErrorMessage(error)}`);
    }
  }

  // Get specific policy by GUID (latest version)
  async getPolicy(policyGuid: string): Promise<VeracodePolicyVersion> {
    try {
      const url = `appsec/v1/policies/${policyGuid}`;
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policy ${policyGuid}: ${this.getErrorMessage(error)}`);
    }
  }

  // Get all versions of a specific policy
  async getPolicyVersions(policyGuid: string, page?: number, size?: number): Promise<VeracodePolicyListResponse> {
    try {
      const params = new URLSearchParams();
      if (page !== undefined) params.append('page', page.toString());
      if (size !== undefined) params.append('size', size.toString());

      const url = `appsec/v1/policies/${policyGuid}/versions${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policy versions for ${policyGuid}: ${this.getErrorMessage(error)}`);
    }
  }

  // Get specific version of a policy
  async getPolicyVersion(policyGuid: string, version: number): Promise<VeracodePolicyVersion> {
    try {
      const url = `appsec/v1/policies/${policyGuid}/versions/${version}`;
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policy ${policyGuid} version ${version}: ${this.getErrorMessage(error)}`);
    }
  }

  // Get policy settings (default policies for business criticality levels)
  async getPolicySettings(): Promise<VeracodePolicySettingsResponse> {
    try {
      const url = 'appsec/v1/policy_settings';
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch policy settings: ${this.getErrorMessage(error)}`);
    }
  }

  // Get SCA component licenses information
  async getScaLicenses(page?: number, size?: number, sort?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (page !== undefined) params.append('page', page.toString());
      if (size !== undefined) params.append('size', size.toString());
      if (sort) params.append('sort', sort);

      const url = `appsec/v1/policy_licenselist${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch SCA licenses: ${this.getErrorMessage(error)}`);
    }
  }
}
