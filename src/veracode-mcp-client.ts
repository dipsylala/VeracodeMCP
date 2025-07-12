#!/usr/bin/env node

import { VeracodeClient } from "./veracode-rest-client.js";
import * as dotenv from "dotenv";

dotenv.config();

interface ToolCall {
    tool: string;
    args?: Record<string, any>;
}

interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
}

export class VeracodeMCPClient {
    private veracodeClient: VeracodeClient;

    constructor() {
        const apiId = process.env.VERACODE_API_ID;
        const apiKey = process.env.VERACODE_API_KEY;

        if (!apiId || !apiKey) {
            throw new Error("Missing Veracode API credentials");
        }

        this.veracodeClient = new VeracodeClient(apiId, apiKey);
    }

    async callTool(toolCall: ToolCall): Promise<ToolResult> {
        try {
            console.log(`🔧 Calling tool: ${toolCall.tool}`);
            if (toolCall.args) {
                console.log(`📋 Arguments:`, JSON.stringify(toolCall.args, null, 2));
            }
            console.log();

            let result: any;

            switch (toolCall.tool) {
                case "get-applications":
                    result = await this.veracodeClient.getApplications();
                    return {
                        success: true,
                        data: {
                            count: result.length,
                            applications: result.map((app: any) => ({
                                name: app.profile.name,
                                id: app.guid,
                                legacy_id: app.id,
                                business_criticality: app.profile.business_criticality,
                                teams: app.profile.teams?.map((team: any) => team.team_name) || [],
                                created_date: app.created,
                                modified_date: app.modified
                            }))
                        }
                    };

                case "search-applications":
                    if (!toolCall.args?.name) {
                        return { success: false, error: "Missing required argument: name" };
                    }
                    result = await this.veracodeClient.searchApplications(toolCall.args.name);
                    return {
                        success: true,
                        data: {
                            search_term: toolCall.args.name,
                            count: result.length,
                            applications: result.map((app: any) => ({
                                name: app.profile.name,
                                id: app.guid,
                                legacy_id: app.id,
                                business_criticality: app.profile.business_criticality,
                                teams: app.profile.teams?.map((team: any) => team.team_name) || [],
                                created_date: app.created,
                                modified_date: app.modified
                            }))
                        }
                    };

                case "get-application-details":
                    if (!toolCall.args?.app_id) {
                        return { success: false, error: "Missing required argument: app_id" };
                    }
                    result = await this.veracodeClient.getApplicationDetails(toolCall.args.app_id);
                    return {
                        success: true,
                        data: {
                            name: result.profile.name,
                            id: result.guid,
                            legacy_id: result.id,
                            business_criticality: result.profile.business_criticality,
                            teams: result.profile.teams?.map((team: any) => ({
                                name: team.team_name,
                                guid: team.guid,
                                team_id: team.team_id
                            })) || [],
                            tags: result.profile.tags ? result.profile.tags.split(',').map((tag: string) => tag.trim()) : [],
                            description: result.profile.description,
                            created_date: result.created,
                            modified_date: result.modified,
                            last_completed_scan_date: result.last_completed_scan_date,
                            business_unit: result.profile.business_unit ? {
                                name: result.profile.business_unit.name,
                                guid: result.profile.business_unit.guid,
                                id: result.profile.business_unit.id
                            } : null,
                            business_owners: result.profile.business_owners?.map((owner: any) => ({
                                name: owner.name,
                                email: owner.email
                            })) || [],
                            settings: result.profile.settings ? {
                                sca_enabled: result.profile.settings.sca_enabled,
                                dynamic_scan_approval_not_required: result.profile.settings.dynamic_scan_approval_not_required,
                                static_scan_dependencies_allowed: result.profile.settings.static_scan_dependencies_allowed,
                                nextday_consultation_allowed: result.profile.settings.nextday_consultation_allowed
                            } : null,
                            custom_fields: result.profile.custom_fields?.map((field: any) => ({
                                name: field.name,
                                value: field.value
                            })) || [],
                            custom_field_values: result.profile.custom_field_values?.map((fieldValue: any) => ({
                                field_name: fieldValue.app_custom_field_name?.name,
                                value: fieldValue.value,
                                id: fieldValue.id
                            })) || [],
                            policies: result.profile.policies?.map((policy: any) => ({
                                name: policy.name,
                                guid: policy.guid,
                                is_default: policy.is_default,
                                compliance_status: policy.policy_compliance_status
                            })) || [],
                            git_repo_url: result.profile.git_repo_url,
                            archer_app_name: result.profile.archer_app_name,
                            custom_kms_alias: result.profile.custom_kms_alias,
                            app_profile_url: result.app_profile_url,
                            results_url: result.results_url,
                            scans: result.scans?.map((scan: any) => ({
                                scan_type: scan.scan_type,
                                status: scan.status,
                                internal_status: scan.internal_status,
                                modified_date: scan.modified_date,
                                scan_url: scan.scan_url
                            })) || []
                        }
                    };

                case "get-application-details-by-name":
                    if (!toolCall.args?.name) {
                        return { success: false, error: "Missing required argument: name" };
                    }
                    result = await this.veracodeClient.getApplicationDetailsByName(toolCall.args.name);
                    return {
                        success: true,
                        data: {
                            name: result.profile.name,
                            id: result.guid,
                            legacy_id: result.id,
                            business_criticality: result.profile.business_criticality,
                            teams: result.profile.teams?.map((team: any) => ({
                                name: team.team_name,
                                guid: team.guid,
                                team_id: team.team_id
                            })) || [],
                            tags: result.profile.tags ? result.profile.tags.split(',').map((tag: string) => tag.trim()) : [],
                            description: result.profile.description,
                            created_date: result.created,
                            modified_date: result.modified,
                            last_completed_scan_date: result.last_completed_scan_date,
                            business_unit: result.profile.business_unit ? {
                                name: result.profile.business_unit.name,
                                guid: result.profile.business_unit.guid,
                                id: result.profile.business_unit.id
                            } : null,
                            business_owners: result.profile.business_owners?.map((owner: any) => ({
                                name: owner.name,
                                email: owner.email
                            })) || [],
                            settings: result.profile.settings ? {
                                sca_enabled: result.profile.settings.sca_enabled,
                                dynamic_scan_approval_not_required: result.profile.settings.dynamic_scan_approval_not_required,
                                static_scan_dependencies_allowed: result.profile.settings.static_scan_dependencies_allowed,
                                nextday_consultation_allowed: result.profile.settings.nextday_consultation_allowed
                            } : null,
                            custom_fields: result.profile.custom_fields?.map((field: any) => ({
                                name: field.name,
                                value: field.value
                            })) || [],
                            custom_field_values: result.profile.custom_field_values?.map((fieldValue: any) => ({
                                field_name: fieldValue.app_custom_field_name?.name,
                                value: fieldValue.value,
                                id: fieldValue.id
                            })) || [],
                            policies: result.profile.policies?.map((policy: any) => ({
                                name: policy.name,
                                guid: policy.guid,
                                is_default: policy.is_default,
                                compliance_status: policy.policy_compliance_status
                            })) || [],
                            git_repo_url: result.profile.git_repo_url,
                            archer_app_name: result.profile.archer_app_name,
                            custom_kms_alias: result.profile.custom_kms_alias,
                            app_profile_url: result.app_profile_url,
                            results_url: result.results_url,
                            scans: result.scans?.map((scan: any) => ({
                                scan_type: scan.scan_type,
                                status: scan.status,
                                internal_status: scan.internal_status,
                                modified_date: scan.modified_date,
                                scan_url: scan.scan_url
                            })) || []
                        }
                    };

                case "get-scan-results":
                    if (!toolCall.args?.app_id) {
                        return { success: false, error: "Missing required argument: app_id" };
                    }
                    result = await this.veracodeClient.getScanResults(
                        toolCall.args.app_id,
                        toolCall.args.scan_type
                    );
                    return {
                        success: true,
                        data: {
                            app_id: toolCall.args.app_id,
                            scan_type_filter: toolCall.args.scan_type,
                            count: result.length,
                            scans: result.map((scan: any) => ({
                                scan_id: scan.scan_id,
                                scan_type: scan.scan_type,
                                status: scan.status,
                                policy_compliance_status: scan.policy_compliance_status,
                                created_date: scan.created_date,
                                modified_date: scan.modified_date
                            }))
                        }
                    };

                case "get-scan-results-by-name":
                    if (!toolCall.args?.name) {
                        return { success: false, error: "Missing required argument: name" };
                    }
                    // First search for applications with this name
                    const searchResults = await this.veracodeClient.searchApplications(toolCall.args.name);
                    if (searchResults.length === 0) {
                        return { success: false, error: `No application found with name: ${toolCall.args.name}` };
                    }

                    // If multiple results, look for exact match first
                    let targetApp = searchResults.find((app: any) =>
                        app.profile.name.toLowerCase() === toolCall.args!.name.toLowerCase()
                    );

                    // If no exact match, use the first result but warn about it
                    if (!targetApp) {
                        targetApp = searchResults[0];
                        console.warn(`No exact match found for "${toolCall.args.name}". Using first result: "${targetApp.profile.name}"`);
                    }

                    result = await this.veracodeClient.getScanResults(
                        targetApp.guid,
                        toolCall.args.scan_type
                    );
                    return {
                        success: true,
                        data: {
                            application_name: toolCall.args.name,
                            app_id: targetApp.guid,
                            scan_type_filter: toolCall.args.scan_type,
                            count: result.length,
                            scans: result.map((scan: any) => ({
                                scan_id: scan.scan_id,
                                scan_type: scan.scan_type,
                                status: scan.status,
                                policy_compliance_status: scan.policy_compliance_status,
                                created_date: scan.created_date,
                                modified_date: scan.modified_date
                            }))
                        }
                    };

                case "get-findings":
                    if (!toolCall.args?.app_id) {
                        return { success: false, error: "Missing required argument: app_id" };
                    }
                    result = await this.veracodeClient.getFindingsById(
                        toolCall.args.app_id,
                        {
                            scanType: toolCall.args.scan_type,
                            severity: toolCall.args.severity,
                            severityGte: toolCall.args.severity_gte,
                            cwe: toolCall.args.cwe,
                            cvss: toolCall.args.cvss,
                            cvssGte: toolCall.args.cvss_gte,
                            cve: toolCall.args.cve,
                            context: toolCall.args.context,
                            includeAnnotations: toolCall.args.include_annotations ?? true, // Default to true to show comments
                            newFindingsOnly: toolCall.args.new_findings_only,
                            policyViolation: toolCall.args.violates_policy,
                            page: toolCall.args.page,
                            size: toolCall.args.size
                        }
                    );
                    return {
                        success: true,
                        data: {
                            app_id: toolCall.args.app_id,
                            filters: {
                                scan_type: toolCall.args.scan_type,
                                severity: toolCall.args.severity,
                                severity_gte: toolCall.args.severity_gte,
                                cwe: toolCall.args.cwe,
                                cvss: toolCall.args.cvss,
                                cvss_gte: toolCall.args.cvss_gte,
                                cve: toolCall.args.cve,
                                context: toolCall.args.context,
                                new_findings_only: toolCall.args.new_findings_only,
                                violates_policy: toolCall.args.violates_policy
                            },
                            count: result.length,
                            findings: (toolCall.args.size ? result.slice(0, parseInt(toolCall.args.size)) : result).map((finding: any) => {
                                const mappedFinding: any = {
                                    // Core finding identification - ensure flaw_id is always available
                                    flaw_id: finding.issue_id || finding.flaw_id || finding.id || 'N/A',
                                    scan_type: finding.scan_type,
                                    description: finding.description,
                                    build_id: finding.build_id,
                                    context_guid: finding.context_guid,
                                    context_type: finding.context_type,
                                    count: finding.count,
                                    violates_policy: finding.violates_policy,

                                    // Finding status information
                                    status: finding.finding_status?.status,
                                    resolution: finding.finding_status?.resolution,
                                    resolution_status: finding.finding_status?.resolution_status,
                                    mitigation_review_status: finding.finding_status?.mitigation_review_status,
                                    first_found_date: finding.finding_status?.first_found_date,
                                    last_seen_date: finding.finding_status?.last_seen_date,
                                    new: finding.finding_status?.new,
                                    grace_period_expires_date: finding.grace_period_expires_date,

                                    // CWE information
                                    cwe_id: finding.finding_details?.cwe?.id,
                                    cwe_name: finding.finding_details?.cwe?.name,
                                    cwe_href: finding.finding_details?.cwe?.href,

                                    // Severity and scoring
                                    severity: finding.finding_details?.severity,
                                    exploitability: finding.finding_details?.exploitability,

                                    // CVE and CVSS information
                                    cve: finding.finding_details?.cve?.name,
                                    cvss: finding.finding_details?.cve?.cvss || finding.finding_details?.cvss,
                                    cvss_vector: finding.finding_details?.cve?.vector,
                                    cvss3_score: finding.finding_details?.cve?.cvss3?.score,
                                    cvss3_severity: finding.finding_details?.cve?.cvss3?.severity,
                                    cvss3_vector: finding.finding_details?.cve?.cvss3?.vector,
                                    cve_href: finding.finding_details?.cve?.href,

                                    // Annotations (mitigations/comments)
                                    annotations: finding.annotations?.map((annotation: any) => ({
                                        action: annotation.action,
                                        comment: annotation.comment,
                                        created: annotation.created,
                                        user_name: annotation.user_name,
                                        remaining_risk: annotation.remaining_risk,
                                        specifics: annotation.specifics,
                                        technique: annotation.technique,
                                        verification: annotation.verification
                                    })) || []
                                };

                                // Scan type specific details
                                if (finding.scan_type === 'STATIC') {
                                    // Static Analysis specific fields
                                    mappedFinding.attack_vector = finding.finding_details?.attack_vector;
                                    mappedFinding.file_line_number = finding.finding_details?.file_line_number;
                                    mappedFinding.file_name = finding.finding_details?.file_name;
                                    mappedFinding.file_path = finding.finding_details?.file_path;
                                    mappedFinding.finding_category = finding.finding_details?.finding_category;
                                    mappedFinding.module = finding.finding_details?.module;
                                    mappedFinding.procedure = finding.finding_details?.procedure;
                                    mappedFinding.relative_location = finding.finding_details?.relative_location;
                                } else if (finding.scan_type === 'DYNAMIC') {
                                    // Dynamic Analysis specific fields
                                    mappedFinding.attack_vector = finding.finding_details?.attack_vector;
                                    mappedFinding.hostname = finding.finding_details?.hostname;
                                    mappedFinding.port = finding.finding_details?.port;
                                    mappedFinding.path = finding.finding_details?.path;
                                    mappedFinding.plugin = finding.finding_details?.plugin;
                                    mappedFinding.finding_category = finding.finding_details?.finding_category;
                                    mappedFinding.url = finding.finding_details?.URL;
                                    mappedFinding.vulnerable_parameter = finding.finding_details?.vulnerable_parameter;
                                    mappedFinding.discovered_by_vsa = finding.finding_details?.discovered_by_vsa;
                                } else if (finding.scan_type === 'MANUAL') {
                                    // Manual Testing specific fields
                                    mappedFinding.capec_id = finding.finding_details?.capec_id;
                                    mappedFinding.exploit_desc = finding.finding_details?.exploit_desc;
                                    mappedFinding.exploit_difficulty = finding.finding_details?.exploit_difficulty;
                                    mappedFinding.input_vector = finding.finding_details?.input_vector;
                                    mappedFinding.location = finding.finding_details?.location;
                                    mappedFinding.module = finding.finding_details?.module;
                                    mappedFinding.remediation_desc = finding.finding_details?.remediation_desc;
                                    mappedFinding.severity_desc = finding.finding_details?.severity_desc;
                                } else if (finding.scan_type === 'SCA') {
                                    // SCA specific fields
                                    mappedFinding.component_id = finding.finding_details?.component_id;
                                    mappedFinding.component_filename = finding.finding_details?.component_filename;
                                    mappedFinding.version = finding.finding_details?.version;
                                    mappedFinding.language = finding.finding_details?.language;
                                    mappedFinding.product_id = finding.finding_details?.product_id;
                                    mappedFinding.metadata = finding.finding_details?.metadata;

                                    // Component paths
                                    mappedFinding.component_paths = finding.finding_details?.["component_path(s)"]?.map((pathObj: any) => pathObj.path) ||
                                        finding.finding_details?.component_path?.map((pathObj: any) => pathObj.path) || [];

                                    // License information
                                    mappedFinding.licenses = finding.finding_details?.licenses?.map((license: any) => ({
                                        license_id: license.license_id,
                                        risk_rating: license.risk_rating
                                    })) || [];

                                    // Enhanced CVE exploitability data for SCA
                                    if (finding.finding_details?.cve?.exploitability) {
                                        const exploitability = finding.finding_details.cve.exploitability;
                                        mappedFinding.exploitability_data = {
                                            exploit_service_status: exploitability.exploit_service_status,
                                            cve_full: exploitability.cve_full,
                                            epss_status: exploitability.epss_status,
                                            epss_score: exploitability.epss_score,
                                            epss_percentile: exploitability.epss_percentile,
                                            epss_score_date: exploitability.epss_score_date,
                                            epss_model_version: exploitability.epss_model_version,
                                            epss_citation: exploitability.epss_citation,
                                            exploit_observed: exploitability.exploit_observed,
                                            exploit_source: exploitability.exploit_source,
                                            exploit_note: exploitability.exploit_note
                                        };
                                    }
                                }

                                return mappedFinding;
                            }),
                            total_findings: result.length,
                            showing: toolCall.args.size ? Math.min(parseInt(toolCall.args.size), result.length) : result.length
                        }
                    };

                case "get-findings-by-name":
                    if (!toolCall.args?.name) {
                        return { success: false, error: "Missing required argument: name" };
                    }
                    result = await this.veracodeClient.getFindingsByName(
                        toolCall.args.name,
                        {
                            scanType: toolCall.args.scan_type,
                            severity: toolCall.args.severity,
                            severityGte: toolCall.args.severity_gte,
                            cwe: toolCall.args.cwe,
                            cvss: toolCall.args.cvss,
                            cvssGte: toolCall.args.cvss_gte,
                            cve: toolCall.args.cve,
                            context: toolCall.args.context,
                            includeAnnotations: toolCall.args.include_annotations ?? true, // Default to true to show comments
                            newFindingsOnly: toolCall.args.new_findings_only,
                            policyViolation: toolCall.args.violates_policy,
                            page: toolCall.args.page,
                            size: toolCall.args.size
                        }
                    );
                    return {
                        success: true,
                        data: {
                            application_name: toolCall.args.name,
                            filters: {
                                scan_type: toolCall.args.scan_type,
                                severity: toolCall.args.severity,
                                severity_gte: toolCall.args.severity_gte,
                                cwe: toolCall.args.cwe,
                                cvss: toolCall.args.cvss,
                                cvss_gte: toolCall.args.cvss_gte,
                                cve: toolCall.args.cve,
                                context: toolCall.args.context,
                                new_findings_only: toolCall.args.new_findings_only,
                                violates_policy: toolCall.args.violates_policy
                            },
                            count: result.length,
                            findings: (toolCall.args.size ? result.slice(0, parseInt(toolCall.args.size)) : result).map((finding: any) => {
                                const mappedFinding: any = {
                                    // Core finding identification - ensure flaw_id is always available
                                    flaw_id: finding.issue_id || finding.flaw_id || finding.id || 'N/A',
                                    scan_type: finding.scan_type,
                                    description: finding.description,
                                    build_id: finding.build_id,
                                    context_guid: finding.context_guid,
                                    context_type: finding.context_type,
                                    count: finding.count,
                                    violates_policy: finding.violates_policy,

                                    // Finding status information
                                    status: finding.finding_status?.status,
                                    resolution: finding.finding_status?.resolution,
                                    resolution_status: finding.finding_status?.resolution_status,
                                    mitigation_review_status: finding.finding_status?.mitigation_review_status,
                                    first_found_date: finding.finding_status?.first_found_date,
                                    last_seen_date: finding.finding_status?.last_seen_date,
                                    new: finding.finding_status?.new,
                                    grace_period_expires_date: finding.grace_period_expires_date,

                                    // CWE information
                                    cwe_id: finding.finding_details?.cwe?.id,
                                    cwe_name: finding.finding_details?.cwe?.name,
                                    cwe_href: finding.finding_details?.cwe?.href,

                                    // Severity and scoring
                                    severity: finding.finding_details?.severity,
                                    exploitability: finding.finding_details?.exploitability,

                                    // CVE and CVSS information
                                    cve: finding.finding_details?.cve?.name,
                                    cvss: finding.finding_details?.cve?.cvss || finding.finding_details?.cvss,
                                    cvss_vector: finding.finding_details?.cve?.vector,
                                    cvss3_score: finding.finding_details?.cve?.cvss3?.score,
                                    cvss3_severity: finding.finding_details?.cve?.cvss3?.severity,
                                    cvss3_vector: finding.finding_details?.cve?.cvss3?.vector,
                                    cve_href: finding.finding_details?.cve?.href,

                                    // Annotations (mitigations/comments)
                                    annotations: finding.annotations?.map((annotation: any) => ({
                                        action: annotation.action,
                                        comment: annotation.comment,
                                        created: annotation.created,
                                        user_name: annotation.user_name,
                                        remaining_risk: annotation.remaining_risk,
                                        specifics: annotation.specifics,
                                        technique: annotation.technique,
                                        verification: annotation.verification
                                    })) || []
                                };

                                // Scan type specific details
                                if (finding.scan_type === 'STATIC') {
                                    // Static Analysis specific fields
                                    mappedFinding.attack_vector = finding.finding_details?.attack_vector;
                                    mappedFinding.file_line_number = finding.finding_details?.file_line_number;
                                    mappedFinding.file_name = finding.finding_details?.file_name;
                                    mappedFinding.file_path = finding.finding_details?.file_path;
                                    mappedFinding.finding_category = finding.finding_details?.finding_category;
                                    mappedFinding.module = finding.finding_details?.module;
                                    mappedFinding.procedure = finding.finding_details?.procedure;
                                    mappedFinding.relative_location = finding.finding_details?.relative_location;
                                } else if (finding.scan_type === 'DYNAMIC') {
                                    // Dynamic Analysis specific fields
                                    mappedFinding.attack_vector = finding.finding_details?.attack_vector;
                                    mappedFinding.hostname = finding.finding_details?.hostname;
                                    mappedFinding.port = finding.finding_details?.port;
                                    mappedFinding.path = finding.finding_details?.path;
                                    mappedFinding.plugin = finding.finding_details?.plugin;
                                    mappedFinding.finding_category = finding.finding_details?.finding_category;
                                    mappedFinding.url = finding.finding_details?.URL;
                                    mappedFinding.vulnerable_parameter = finding.finding_details?.vulnerable_parameter;
                                    mappedFinding.discovered_by_vsa = finding.finding_details?.discovered_by_vsa;
                                } else if (finding.scan_type === 'MANUAL') {
                                    // Manual Testing specific fields
                                    mappedFinding.capec_id = finding.finding_details?.capec_id;
                                    mappedFinding.exploit_desc = finding.finding_details?.exploit_desc;
                                    mappedFinding.exploit_difficulty = finding.finding_details?.exploit_difficulty;
                                    mappedFinding.input_vector = finding.finding_details?.input_vector;
                                    mappedFinding.location = finding.finding_details?.location;
                                    mappedFinding.module = finding.finding_details?.module;
                                    mappedFinding.remediation_desc = finding.finding_details?.remediation_desc;
                                    mappedFinding.severity_desc = finding.finding_details?.severity_desc;
                                } else if (finding.scan_type === 'SCA') {
                                    // SCA specific fields
                                    mappedFinding.component_id = finding.finding_details?.component_id;
                                    mappedFinding.component_filename = finding.finding_details?.component_filename;
                                    mappedFinding.version = finding.finding_details?.version;
                                    mappedFinding.language = finding.finding_details?.language;
                                    mappedFinding.product_id = finding.finding_details?.product_id;
                                    mappedFinding.metadata = finding.finding_details?.metadata;

                                    // Component paths
                                    mappedFinding.component_paths = finding.finding_details?.["component_path(s)"]?.map((pathObj: any) => pathObj.path) ||
                                        finding.finding_details?.component_path?.map((pathObj: any) => pathObj.path) || [];

                                    // License information
                                    mappedFinding.licenses = finding.finding_details?.licenses?.map((license: any) => ({
                                        license_id: license.license_id,
                                        risk_rating: license.risk_rating
                                    })) || [];

                                    // Enhanced CVE exploitability data for SCA
                                    if (finding.finding_details?.cve?.exploitability) {
                                        const exploitability = finding.finding_details.cve.exploitability;
                                        mappedFinding.exploitability_data = {
                                            exploit_service_status: exploitability.exploit_service_status,
                                            cve_full: exploitability.cve_full,
                                            epss_status: exploitability.epss_status,
                                            epss_score: exploitability.epss_score,
                                            epss_percentile: exploitability.epss_percentile,
                                            epss_score_date: exploitability.epss_score_date,
                                            epss_model_version: exploitability.epss_model_version,
                                            epss_citation: exploitability.epss_citation,
                                            exploit_observed: exploitability.exploit_observed,
                                            exploit_source: exploitability.exploit_source,
                                            exploit_note: exploitability.exploit_note
                                        };
                                    }
                                }

                                return mappedFinding;
                            }),
                            total_findings: result.length,
                            showing: toolCall.args.size ? Math.min(parseInt(toolCall.args.size), result.length) : result.length
                        }
                    };

                case "get-findings-paginated":
                    if (!toolCall.args?.app_id) {
                        return { success: false, error: "Missing required argument: app_id" };
                    }
                    const paginatedResult = await this.veracodeClient.getFindingsPaginated(
                        toolCall.args.app_id,
                        {
                            scanType: toolCall.args.scan_type,
                            severity: toolCall.args.severity,
                            severityGte: toolCall.args.severity_gte,
                            cwe: toolCall.args.cwe,
                            cvss: toolCall.args.cvss,
                            cvssGte: toolCall.args.cvss_gte,
                            cve: toolCall.args.cve,
                            context: toolCall.args.context,
                            includeAnnotations: toolCall.args.include_annotations ?? true,
                            newFindingsOnly: toolCall.args.new_findings_only,
                            policyViolation: toolCall.args.violates_policy,
                            page: toolCall.args.page || 0,
                            size: toolCall.args.size || 100
                        }
                    );
                    return {
                        success: true,
                        data: {
                            app_id: toolCall.args.app_id,
                            pagination: {
                                current_page: paginatedResult.pagination.current_page,
                                total_pages: paginatedResult.pagination.total_pages,
                                total_elements: paginatedResult.pagination.total_elements,
                                page_size: paginatedResult.pagination.page_size,
                                has_next: paginatedResult.pagination.has_next,
                                has_previous: paginatedResult.pagination.has_previous
                            },
                            filters: {
                                scan_type: toolCall.args.scan_type,
                                severity: toolCall.args.severity,
                                severity_gte: toolCall.args.severity_gte,
                                cwe: toolCall.args.cwe,
                                cvss: toolCall.args.cvss,
                                cvss_gte: toolCall.args.cvss_gte,
                                cve: toolCall.args.cve,
                                context: toolCall.args.context,
                                new_findings_only: toolCall.args.new_findings_only,
                                violates_policy: toolCall.args.violates_policy
                            },
                            findings: paginatedResult.findings.map((finding: any) => {
                                // Use the same mapping logic as the existing get-findings case
                                const mappedFinding: any = {
                                    flaw_id: finding.issue_id || finding.flaw_id || finding.id || 'N/A',
                                    scan_type: finding.scan_type,
                                    description: finding.description,
                                    build_id: finding.build_id,
                                    context_guid: finding.context_guid,
                                    context_type: finding.context_type,
                                    count: finding.count,
                                    violates_policy: finding.violates_policy,

                                    // Finding status information
                                    status: finding.finding_status?.status,
                                    resolution: finding.finding_status?.resolution,
                                    resolution_status: finding.finding_status?.resolution_status,
                                    mitigation_review_status: finding.finding_status?.mitigation_review_status,
                                    first_found_date: finding.finding_status?.first_found_date,
                                    last_seen_date: finding.finding_status?.last_seen_date,
                                    new: finding.finding_status?.new,
                                    grace_period_expires_date: finding.grace_period_expires_date,

                                    // CWE information
                                    cwe_id: finding.finding_details?.cwe?.id,
                                    cwe_name: finding.finding_details?.cwe?.name,
                                    cwe_href: finding.finding_details?.cwe?.href,

                                    // Severity and scoring
                                    severity: finding.finding_details?.severity,
                                    exploitability: finding.finding_details?.exploitability,

                                    // CVE and CVSS information
                                    cve: finding.finding_details?.cve?.name,
                                    cvss: finding.finding_details?.cve?.cvss || finding.finding_details?.cvss,
                                    cvss_vector: finding.finding_details?.cve?.vector,
                                    cvss3_score: finding.finding_details?.cve?.cvss3?.score,
                                    cvss3_severity: finding.finding_details?.cve?.cvss3?.severity,
                                    cvss3_vector: finding.finding_details?.cve?.cvss3?.vector,
                                    cve_href: finding.finding_details?.cve?.href,

                                    // Annotations
                                    annotations: finding.annotations?.map((annotation: any) => ({
                                        action: annotation.action,
                                        comment: annotation.comment,
                                        created: annotation.created,
                                        user_name: annotation.user_name,
                                        remaining_risk: annotation.remaining_risk,
                                        specifics: annotation.specifics,
                                        technique: annotation.technique,
                                        verification: annotation.verification
                                    })) || []
                                };

                                // Add scan type specific details
                                if (finding.scan_type === 'STATIC') {
                                    mappedFinding.attack_vector = finding.finding_details?.attack_vector;
                                    mappedFinding.file_line_number = finding.finding_details?.file_line_number;
                                    mappedFinding.file_name = finding.finding_details?.file_name;
                                    mappedFinding.file_path = finding.finding_details?.file_path;
                                    mappedFinding.finding_category = finding.finding_details?.finding_category;
                                    mappedFinding.module = finding.finding_details?.module;
                                    mappedFinding.procedure = finding.finding_details?.procedure;
                                    mappedFinding.relative_location = finding.finding_details?.relative_location;
                                } else if (finding.scan_type === 'DYNAMIC') {
                                    mappedFinding.attack_vector = finding.finding_details?.attack_vector;
                                    mappedFinding.hostname = finding.finding_details?.hostname;
                                    mappedFinding.port = finding.finding_details?.port;
                                    mappedFinding.path = finding.finding_details?.path;
                                    mappedFinding.plugin = finding.finding_details?.plugin;
                                    mappedFinding.finding_category = finding.finding_details?.finding_category;
                                    mappedFinding.url = finding.finding_details?.URL;
                                    mappedFinding.vulnerable_parameter = finding.finding_details?.vulnerable_parameter;
                                    mappedFinding.discovered_by_vsa = finding.finding_details?.discovered_by_vsa;
                                } else if (finding.scan_type === 'MANUAL') {
                                    mappedFinding.capec_id = finding.finding_details?.capec_id;
                                    mappedFinding.exploit_desc = finding.finding_details?.exploit_desc;
                                    mappedFinding.exploit_difficulty = finding.finding_details?.exploit_difficulty;
                                    mappedFinding.input_vector = finding.finding_details?.input_vector;
                                    mappedFinding.location = finding.finding_details?.location;
                                    mappedFinding.module = finding.finding_details?.module;
                                    mappedFinding.remediation_desc = finding.finding_details?.remediation_desc;
                                    mappedFinding.severity_desc = finding.finding_details?.severity_desc;
                                } else if (finding.scan_type === 'SCA') {
                                    mappedFinding.component_id = finding.finding_details?.component_id;
                                    mappedFinding.component_filename = finding.finding_details?.component_filename;
                                    mappedFinding.version = finding.finding_details?.version;
                                    mappedFinding.language = finding.finding_details?.language;
                                    mappedFinding.product_id = finding.finding_details?.product_id;
                                    mappedFinding.metadata = finding.finding_details?.metadata;
                                    mappedFinding.component_paths = finding.finding_details?.["component_path(s)"]?.map((pathObj: any) => pathObj.path) ||
                                        finding.finding_details?.component_path?.map((pathObj: any) => pathObj.path) || [];
                                    mappedFinding.licenses = finding.finding_details?.licenses?.map((license: any) => ({
                                        license_id: license.license_id,
                                        risk_rating: license.risk_rating
                                    })) || [];

                                    if (finding.finding_details?.cve?.exploitability) {
                                        const exploitability = finding.finding_details.cve.exploitability;
                                        mappedFinding.exploitability_data = {
                                            exploit_service_status: exploitability.exploit_service_status,
                                            cve_full: exploitability.cve_full,
                                            epss_status: exploitability.epss_status,
                                            epss_score: exploitability.epss_score,
                                            epss_percentile: exploitability.epss_percentile,
                                            epss_score_date: exploitability.epss_score_date,
                                            epss_model_version: exploitability.epss_model_version,
                                            epss_citation: exploitability.epss_citation,
                                            exploit_observed: exploitability.exploit_observed,
                                            exploit_source: exploitability.exploit_source,
                                            exploit_note: exploitability.exploit_note
                                        };
                                    }
                                }

                                return mappedFinding;
                            }),
                            count: paginatedResult.findings.length
                        }
                    };

                case "get-all-findings":
                    if (!toolCall.args?.app_id) {
                        return { success: false, error: "Missing required argument: app_id" };
                    }
                    const allFindingsResult = await this.veracodeClient.getAllFindings(
                        toolCall.args.app_id,
                        {
                            scanType: toolCall.args.scan_type,
                            severity: toolCall.args.severity,
                            severityGte: toolCall.args.severity_gte,
                            cwe: toolCall.args.cwe,
                            cvss: toolCall.args.cvss,
                            cvssGte: toolCall.args.cvss_gte,
                            cve: toolCall.args.cve,
                            context: toolCall.args.context,
                            includeAnnotations: toolCall.args.include_annotations ?? true,
                            newFindingsOnly: toolCall.args.new_findings_only,
                            policyViolation: toolCall.args.violates_policy
                        }
                    );
                    return {
                        success: true,
                        data: {
                            app_id: toolCall.args.app_id,
                            total_findings: allFindingsResult.totalElements,
                            total_pages_processed: allFindingsResult.totalPages,
                            filters: {
                                scan_type: toolCall.args.scan_type,
                                severity: toolCall.args.severity,
                                severity_gte: toolCall.args.severity_gte,
                                cwe: toolCall.args.cwe,
                                cvss: toolCall.args.cvss,
                                cvss_gte: toolCall.args.cvss_gte,
                                cve: toolCall.args.cve,
                                context: toolCall.args.context,
                                new_findings_only: toolCall.args.new_findings_only,
                                violates_policy: toolCall.args.violates_policy
                            },
                            findings: allFindingsResult.findings.map((finding: any) => {
                                // Same mapping logic as above
                                const mappedFinding: any = {
                                    flaw_id: finding.issue_id || finding.flaw_id || finding.id || 'N/A',
                                    scan_type: finding.scan_type,
                                    description: finding.description,
                                    build_id: finding.build_id,
                                    context_guid: finding.context_guid,
                                    context_type: finding.context_type,
                                    count: finding.count,
                                    violates_policy: finding.violates_policy,
                                    status: finding.finding_status?.status,
                                    resolution: finding.finding_status?.resolution,
                                    resolution_status: finding.finding_status?.resolution_status,
                                    mitigation_review_status: finding.finding_status?.mitigation_review_status,
                                    first_found_date: finding.finding_status?.first_found_date,
                                    last_seen_date: finding.finding_status?.last_seen_date,
                                    new: finding.finding_status?.new,
                                    grace_period_expires_date: finding.grace_period_expires_date,
                                    cwe_id: finding.finding_details?.cwe?.id,
                                    cwe_name: finding.finding_details?.cwe?.name,
                                    cwe_href: finding.finding_details?.cwe?.href,
                                    severity: finding.finding_details?.severity,
                                    exploitability: finding.finding_details?.exploitability,
                                    cve: finding.finding_details?.cve?.name,
                                    cvss: finding.finding_details?.cve?.cvss || finding.finding_details?.cvss,
                                    cvss_vector: finding.finding_details?.cve?.vector,
                                    cvss3_score: finding.finding_details?.cve?.cvss3?.score,
                                    cvss3_severity: finding.finding_details?.cve?.cvss3?.severity,
                                    cvss3_vector: finding.finding_details?.cve?.cvss3?.vector,
                                    cve_href: finding.finding_details?.cve?.href,
                                    annotations: finding.annotations?.map((annotation: any) => ({
                                        action: annotation.action,
                                        comment: annotation.comment,
                                        created: annotation.created,
                                        user_name: annotation.user_name,
                                        remaining_risk: annotation.remaining_risk,
                                        specifics: annotation.specifics,
                                        technique: annotation.technique,
                                        verification: annotation.verification
                                    })) || []
                                };

                                // Scan type specific mappings (same as above)
                                if (finding.scan_type === 'STATIC') {
                                    Object.assign(mappedFinding, {
                                        attack_vector: finding.finding_details?.attack_vector,
                                        file_line_number: finding.finding_details?.file_line_number,
                                        file_name: finding.finding_details?.file_name,
                                        file_path: finding.finding_details?.file_path,
                                        finding_category: finding.finding_details?.finding_category,
                                        module: finding.finding_details?.module,
                                        procedure: finding.finding_details?.procedure,
                                        relative_location: finding.finding_details?.relative_location
                                    });
                                } else if (finding.scan_type === 'SCA') {
                                    Object.assign(mappedFinding, {
                                        component_id: finding.finding_details?.component_id,
                                        component_filename: finding.finding_details?.component_filename,
                                        version: finding.finding_details?.version,
                                        language: finding.finding_details?.language,
                                        component_paths: finding.finding_details?.["component_path(s)"]?.map((pathObj: any) => pathObj.path) || [],
                                        licenses: finding.finding_details?.licenses?.map((license: any) => ({
                                            license_id: license.license_id,
                                            risk_rating: license.risk_rating
                                        })) || []
                                    });
                                }

                                return mappedFinding;
                            }),
                            count: allFindingsResult.findings.length
                        }
                    };

                case "get-policy-compliance":
                    if (!toolCall.args?.app_id) {
                        return { success: false, error: "Missing required argument: app_id" };
                    }
                    result = await this.veracodeClient.getPolicyCompliance(toolCall.args.app_id);
                    return {
                        success: true,
                        data: {
                            app_id: toolCall.args.app_id,
                            policy_compliance_status: result.policy_compliance_status,
                            total_findings: result.total_findings,
                            policy_violations: result.policy_violations,
                            compliance_percentage: result.summary.compliance_percentage,
                            has_critical_violations: result.summary.has_critical_violations,
                            has_high_violations: result.summary.has_high_violations,
                            total_open_violations: result.summary.total_open_violations,
                            findings_by_severity: result.findings_by_severity,
                            violations_by_severity: result.violations_by_severity
                        }
                    };

                case "get-static-flaw-info":
                    if (!toolCall.args?.app_id || !toolCall.args?.issue_id) {
                        return { success: false, error: "Missing required arguments: app_id and issue_id" };
                    }
                    result = await this.veracodeClient.getStaticFlawInfo(
                        toolCall.args.app_id,
                        toolCall.args.issue_id,
                        toolCall.args.context
                    );
                    return {
                        success: true,
                        data: {
                            app_id: toolCall.args.app_id,
                            issue_id: toolCall.args.issue_id,
                            context: toolCall.args.context,
                            issue_summary: result.issue_summary,
                            data_paths: result.data_paths,
                            total_data_paths: result.data_paths.length,
                            _links: result._links
                        }
                    };

                case "get-static-flaw-info-by-name":
                    if (!toolCall.args?.name || !toolCall.args?.issue_id) {
                        return { success: false, error: "Missing required arguments: name and issue_id" };
                    }
                    result = await this.veracodeClient.getStaticFlawInfoByName(
                        toolCall.args.name,
                        toolCall.args.issue_id,
                        toolCall.args.context
                    );
                    return {
                        success: true,
                        data: {
                            application_name: toolCall.args.name,
                            issue_id: toolCall.args.issue_id,
                            context: toolCall.args.context,
                            issue_summary: result.issue_summary,
                            data_paths: result.data_paths,
                            total_data_paths: result.data_paths.length,
                            _links: result._links
                        }
                    };

                default:
                    return {
                        success: false,
                        error: `Unknown tool: ${toolCall.tool}. Available tools: get-applications, search-applications, get-application-details-by-id, get-application-details-by-name, get-scan-results-by-id, get-scan-results-by-name, get-findings-by-id, get-findings-by-name, get-findings-paginated, get-all-findings, get-policy-compliance-by-id, get-static-flaw-info-by-id, get-static-flaw-info-by-name`
                    };
            }

        } catch (error: any) {
            return {
                success: false,
                error: `Tool execution failed: ${error.message}`
            };
        }
    }

    formatResult(result: ToolResult): string {
        if (!result.success) {
            return `❌ Error: ${result.error}`;
        }

        const data = result.data;
        let output = "✅ Success:\n\n";

        // Format based on the type of data returned
        if (data.applications) {
            output += `📊 Found ${data.count} application${data.count !== 1 ? 's' : ''}`;
            if (data.search_term) {
                output += ` matching "${data.search_term}"`;
            }
            output += ":\n\n";

            data.applications.forEach((app: any) => {
                output += `• ${app.name}\n`;
                output += `  ID: ${app.id}\n`;
                output += `  Business Criticality: ${app.business_criticality}\n`;
                output += `  Teams: ${app.teams.join(", ") || "None"}\n`;
                output += `  Created: ${app.created_date}\n\n`;
            });
        } else if (data.scans && data.count !== undefined) {
            // This is scan results data (has count property)
            output += `📊 Found ${data.count} scan${data.count !== 1 ? 's' : ''} for application ${data.app_id}`;
            if (data.scan_type_filter) {
                output += ` (${data.scan_type_filter} scans only)`;
            }
            output += ":\n\n";

            data.scans.forEach((scan: any) => {
                output += `• Scan ${scan.scan_id}\n`;
                output += `  Type: ${scan.scan_type}\n`;
                output += `  Status: ${scan.status}\n`;
                output += `  Policy Compliance: ${scan.policy_compliance_status || "N/A"}\n`;
                output += `  Created: ${scan.created_date}\n\n`;
            });
        } else if (data.findings) {
            const appIdentifier = data.app_id || data.application_name || "unknown";
            output += `📊 Found ${data.total_findings} finding${data.total_findings !== 1 ? 's' : ''} for application ${appIdentifier}`;

            // Show active filters
            const filters = [];
            if (data.filters?.scan_type) filters.push(`${data.filters.scan_type} scans`);
            if (data.filters?.severity) filters.push(`severity ${data.filters.severity}`);
            if (data.filters?.severity_gte) filters.push(`severity ≥${data.filters.severity_gte}`);
            if (data.filters?.cwe) filters.push(`CWE ${data.filters.cwe.join(', ')}`);
            if (data.filters?.violates_policy !== undefined) filters.push(data.filters.violates_policy ? 'policy violations' : 'non-violations');

            if (filters.length > 0) output += ` (${filters.join(', ')})`;

            // Clear information about what's being shown
            if (data.showing === data.total_findings) {
                output += `\nShowing all ${data.total_findings} findings:\n\n`;
            } else {
                output += `\nShowing ${data.showing} of ${data.total_findings} findings:\n\n`;
            }

            data.findings.forEach((finding: any) => {
                output += `• ${finding.scan_type} Finding`;
                // Always show flaw ID - ensure it's always displayed
                const flawIdValue = finding.flaw_id || 'N/A';
                output += ` (Flaw ID: ${flawIdValue})`;
                output += `\n`;

                // Core vulnerability information
                if (finding.cwe_id) {
                    output += `  CWE: ${finding.cwe_id} - ${finding.cwe_name}\n`;
                } else if (finding.cwe_name) {
                    output += `  CWE: ${finding.cwe_name}\n`;
                }
                output += `  Severity: ${finding.severity}`;
                if (finding.exploitability !== undefined) {
                    output += ` (Exploitability: ${finding.exploitability})`;
                }
                output += `\n`;

                output += `  Status: ${finding.status}`;
                if (finding.resolution && finding.resolution !== 'UNRESOLVED') {
                    output += ` (${finding.resolution})`;
                }
                output += `\n`;

                output += `  Policy Violation: ${finding.violates_policy ? 'Yes' : 'No'}\n`;

                // CVE and CVSS information
                if (finding.cve) {
                    output += `  CVE: ${finding.cve}`;
                    if (finding.cvss) {
                        output += ` (CVSS: ${finding.cvss}`;
                        if (finding.cvss3_score && finding.cvss3_score !== finding.cvss) {
                            output += `, v3: ${finding.cvss3_score}`;
                        }
                        output += `)`;
                    }
                    output += `\n`;
                } else if (finding.cvss) {
                    output += `  CVSS: ${finding.cvss}\n`;
                }

                // Dates
                if (finding.first_found_date) {
                    const firstFound = new Date(finding.first_found_date).toLocaleDateString();
                    output += `  First Found: ${firstFound}`;
                    if (finding.last_seen_date && finding.last_seen_date !== finding.first_found_date) {
                        const lastSeen = new Date(finding.last_seen_date).toLocaleDateString();
                        output += ` (Last Seen: ${lastSeen})`;
                    }
                    output += `\n`;
                }

                // Context information
                if (finding.context_type && finding.context_type !== 'APPLICATION') {
                    output += `  Context: ${finding.context_type}\n`;
                }
                if (finding.count && finding.count > 1) {
                    output += `  Occurrence Count: ${finding.count}\n`;
                }

                // Scan type specific information
                if (finding.scan_type === 'STATIC') {
                    if (finding.file_name) {
                        output += `  File: ${finding.file_name}`;
                        if (finding.file_line_number) {
                            output += `:${finding.file_line_number}`;
                        }
                        output += `\n`;
                    }
                    if (finding.file_path && finding.file_path !== finding.file_name) {
                        output += `  Path: ${finding.file_path}\n`;
                    }
                    if (finding.procedure) {
                        output += `  Procedure: ${finding.procedure}\n`;
                    }
                    if (finding.module) {
                        output += `  Module: ${finding.module}\n`;
                    }
                } else if (finding.scan_type === 'DYNAMIC') {
                    if (finding.url) {
                        output += `  URL: ${finding.url}\n`;
                    } else if (finding.hostname) {
                        output += `  Host: ${finding.hostname}`;
                        if (finding.port) {
                            output += `:${finding.port}`;
                        }
                        if (finding.path) {
                            output += `${finding.path}`;
                        }
                        output += `\n`;
                    }
                    if (finding.vulnerable_parameter) {
                        output += `  Vulnerable Parameter: ${finding.vulnerable_parameter}\n`;
                    }
                    if (finding.plugin) {
                        output += `  Plugin: ${finding.plugin}\n`;
                    }
                } else if (finding.scan_type === 'MANUAL') {
                    if (finding.location) {
                        output += `  Location: ${finding.location}\n`;
                    }
                    if (finding.input_vector) {
                        output += `  Input Vector: ${finding.input_vector}\n`;
                    }
                    if (finding.exploit_difficulty) {
                        output += `  Exploit Difficulty: ${finding.exploit_difficulty}\n`;
                    }
                } else if (finding.scan_type === 'SCA') {
                    if (finding.component_filename) {
                        output += `  Component: ${finding.component_filename}`;
                        if (finding.version) {
                            output += ` (v${finding.version})`;
                        }
                        output += `\n`;
                    }
                    if (finding.language) {
                        output += `  Language: ${finding.language}\n`;
                    }
                    if (finding.licenses && finding.licenses.length > 0) {
                        const licenseInfo = finding.licenses.map((l: any) => `${l.license_id} (risk: ${l.risk_rating})`).join(', ');
                        output += `  Licenses: ${licenseInfo}\n`;
                    }
                    if (finding.component_paths && finding.component_paths.length > 0) {
                        output += `  Paths:\n`;
                        finding.component_paths.forEach((path: string, index: number) => {
                            output += `    ${index + 1}. ${path}\n`;
                        });
                    }

                    // Exploitability data for SCA findings
                    if (finding.exploitability_data) {
                        const exp = finding.exploitability_data;
                        if (exp.exploit_observed !== undefined) {
                            output += `  Exploit Available: ${exp.exploit_observed ? 'Yes' : 'No'}`;
                            if (exp.exploit_source) {
                                output += ` (${exp.exploit_source})`;
                            }
                            output += `\n`;
                        }
                        if (exp.epss_score !== undefined) {
                            output += `  EPSS Score: ${exp.epss_score} (${(exp.epss_percentile * 100).toFixed(1)}th percentile)\n`;
                        }
                    }
                }

                // Annotations/mitigations
                if (finding.annotations && finding.annotations.length > 0) {
                    output += `  Actions/Mitigations:\n`;
                    finding.annotations.forEach((annotation: any, index: number) => {
                        output += `    ${index + 1}. ${annotation.action} by ${annotation.user_name}`;
                        if (annotation.created) {
                            const date = new Date(annotation.created).toLocaleDateString();
                            output += ` (${date})`;
                        }
                        if (annotation.comment) {
                            output += `\n       Comment: ${annotation.comment}`;
                        }
                        output += `\n`;
                    });
                }

                // Grace period information
                if (finding.grace_period_expires_date) {
                    const expiryDate = new Date(finding.grace_period_expires_date).toLocaleDateString();
                    output += `  Grace Period Expires: ${expiryDate}\n`;
                }

                // Description (full description)
                if (finding.description) {
                    output += `  Description: ${finding.description}\n`;
                }

                // Add annotations/comments if they exist
                if (finding.annotations && finding.annotations.length > 0) {
                    output += `  Comments:\n`;
                    finding.annotations.forEach((annotation: any, annotationIndex: number) => {
                        output += `    ${annotationIndex + 1}. ${annotation.action} by ${annotation.user_name} (${annotation.created})\n`;
                        output += `       Comment: ${annotation.comment}\n`;
                        if (annotation.remaining_risk) {
                            output += `       Remaining Risk: ${annotation.remaining_risk}\n`;
                        }
                        if (annotation.verification) {
                            output += `       Verification: ${annotation.verification}\n`;
                        }
                        if (annotation.technique) {
                            output += `       Technique: ${annotation.technique}\n`;
                        }
                        if (annotation.specifics) {
                            output += `       Specifics: ${annotation.specifics}\n`;
                        }
                    });
                }

                output += `\n`;
            });
        } else if (data.name && !data.applications) {
            // Single application details
            output += `📋 Application Details:\n\n`;
            output += `Name: ${data.name}\n`;
            output += `ID: ${data.id}\n`;
            output += `Legacy ID: ${data.legacy_id}\n`;
            output += `Business Criticality: ${data.business_criticality}\n`;
            output += `Description: ${data.description || "No description"}\n`;

            // Team information
            if (data.teams && data.teams.length > 0) {
                output += `Teams:\n`;
                data.teams.forEach((team: any) => {
                    output += `  • ${team.name || team} (${team.guid || 'N/A'})\n`;
                });
            } else {
                output += `Teams: None\n`;
            }

            output += `Tags: ${data.tags?.join(", ") || "None"}\n`;

            // Business unit and owners
            if (data.business_unit) {
                output += `Business Unit: ${data.business_unit.name} (${data.business_unit.guid})\n`;
            }

            if (data.business_owners && data.business_owners.length > 0) {
                output += `Business Owners:\n`;
                data.business_owners.forEach((owner: any) => {
                    output += `  • ${owner.name} (${owner.email})\n`;
                });
            }

            // Application settings
            if (data.settings) {
                output += `Settings:\n`;
                output += `  • SCA Enabled: ${data.settings.sca_enabled ? "Yes" : "No"}\n`;
                output += `  • Dynamic Scan Approval Required: ${data.settings.dynamic_scan_approval_not_required ? "No" : "Yes"}\n`;
                output += `  • Static Scan Dependencies Allowed: ${data.settings.static_scan_dependencies_allowed ? "Yes" : "No"}\n`;
                output += `  • Nextday Consultation Allowed: ${data.settings.nextday_consultation_allowed ? "Yes" : "No"}\n`;
            }

            // Policy information
            if (data.policies && data.policies.length > 0) {
                output += `Policies:\n`;
                data.policies.forEach((policy: any) => {
                    output += `  • ${policy.name} (${policy.compliance_status || 'N/A'})${policy.is_default ? ' [Default]' : ''}\n`;
                });
            }

            // Custom fields
            if (data.custom_fields && data.custom_fields.length > 0) {
                output += `Custom Fields:\n`;
                data.custom_fields.forEach((field: any) => {
                    output += `  • ${field.name}: ${field.value}\n`;
                });
            }

            if (data.custom_field_values && data.custom_field_values.length > 0) {
                output += `Custom Field Values:\n`;
                data.custom_field_values.forEach((fieldValue: any) => {
                    output += `  • ${fieldValue.field_name}: ${fieldValue.value}\n`;
                });
            }

            // All scans
            if (data.scans && data.scans.length > 0) {
                output += `All Scans:\n`;
                data.scans.forEach((scan: any) => {
                    output += `  • ${scan.scan_type}: ${scan.status} (${scan.modified_date})\n`;
                });
            }

            // Additional information
            if (data.git_repo_url) {
                output += `Git Repository: ${data.git_repo_url}\n`;
            }
            if (data.archer_app_name) {
                output += `Archer App Name: ${data.archer_app_name}\n`;
            }
            if (data.custom_kms_alias) {
                output += `KMS Alias: ${data.custom_kms_alias}\n`;
            }

            output += `Created: ${data.created_date}\n`;
            output += `Modified: ${data.modified_date}\n`;
            if (data.last_completed_scan_date) {
                output += `Last Completed Scan: ${data.last_completed_scan_date}\n`;
            }

            if (data.app_profile_url) {
                output += `Profile URL: ${data.app_profile_url}\n`;
            }
            if (data.results_url) {
                output += `Results URL: ${data.results_url}\n`;
            }
        } else if (data.policy_compliance_status) {
            // Policy compliance
            output += `📋 Policy Compliance for ${data.app_id}:\n\n`;
            output += `Status: ${data.policy_compliance_status}\n`;
            output += `Total Findings: ${data.total_findings}\n`;
            output += `Policy Violations: ${data.policy_violations}\n`;
            output += `Compliance Percentage: ${data.compliance_percentage}%\n\n`;
            output += `Summary:\n`;
            output += `• Critical Violations: ${data.has_critical_violations ? "Yes" : "No"}\n`;
            output += `• High Severity Violations: ${data.has_high_violations ? "Yes" : "No"}\n`;
            output += `• Total Open Violations: ${data.total_open_violations}\n\n`;

            if (data.findings_by_severity && Object.keys(data.findings_by_severity).length > 0) {
                output += `Findings by Severity:\n`;
                Object.entries(data.findings_by_severity).forEach(([severity, count]) => {
                    output += `• ${severity}: ${count}\n`;
                });
            }

            if (data.violations_by_severity && Object.keys(data.violations_by_severity).length > 0) {
                output += `\nPolicy Violations by Severity:\n`;
                Object.entries(data.violations_by_severity).forEach(([severity, count]) => {
                    output += `• ${severity}: ${count}\n`;
                });
            } else {
                output += `\nNo policy violations found\n`;
            }
        } else if (data.issue_summary && data.data_paths) {
            // Static flaw info with data paths
            const appIdentifier = data.app_id || data.application_name || "unknown";
            output += `🔍 Static Flaw Data Paths for application ${appIdentifier}:\n\n`;

            // Issue summary
            output += `Issue Summary:\n`;
            output += `  Application GUID: ${data.issue_summary.app_guid}\n`;
            output += `  Issue ID: ${data.issue_summary.issue_id}\n`;
            output += `  Build ID: ${data.issue_summary.build_id}\n`;
            output += `  Name: ${data.issue_summary.name}\n`;
            if (data.issue_summary.context) {
                output += `  Context (Sandbox): ${data.issue_summary.context}\n`;
            }
            output += `\n`;

            // Data paths
            output += `Data Paths (${data.total_data_paths} path${data.total_data_paths !== 1 ? 's' : ''}):\n\n`;

            data.data_paths.forEach((dataPath: any, pathIndex: number) => {
                output += `Path ${pathIndex + 1}:\n`;
                output += `  Module: ${dataPath.module_name}\n`;
                output += `  Function: ${dataPath.function_name}\n`;
                output += `  Local Path: ${dataPath.local_path}\n`;
                output += `  Line Number: ${dataPath.line_number}\n`;
                output += `  Steps: ${dataPath.steps}\n`;

                if (dataPath.calls && dataPath.calls.length > 0) {
                    output += `  Call Stack:\n`;
                    dataPath.calls.forEach((call: any, callIndex: number) => {
                        output += `    ${call.data_path}. ${call.function_name}() in ${call.file_name}:${call.line_number}\n`;
                        if (call.file_path !== call.file_name) {
                            output += `       Path: ${call.file_path}\n`;
                        }
                    });
                }
                output += `\n`;
            });
        }

        return output;
    }
}

// Main function to handle command line arguments
async function main() {
    const client = new VeracodeMCPClient();

    // Parse command line arguments
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("📖 Usage: node veracode-mcp-client.js <tool> [args...]");
        console.log("\nAvailable tools:");
        console.log("  get-applications");
        console.log("  search-applications --name <search_term>");
        console.log("  get-application-details-by-id --app_id <app_id>");
        console.log("  get-application-details-by-name --name <app_name>");
        console.log("  get-scan-results-by-id --app_id <app_id> [--scan_type <type>]");
        console.log("  get-scan-results-by-name --name <app_name> [--scan_type <type>]");
        console.log("  get-findings-by-id --app_id <app_id> [--scan_type <type>] [--severity <severity>]");
        console.log("  get-findings-by-name --name <app_name> [--scan_type <type>] [--severity <severity>]");
        console.log("  get-policy-compliance-by-id --app_id <app_id>");
        console.log("  get-static-flaw-info-by-id --app_id <app_id> --issue_id <issue_id> [--context <sandbox_guid>]");
        console.log("  get-static-flaw-info-by-name --name <app_name> --issue_id <issue_id> [--context <sandbox_guid>]");
        console.log("\nExamples:");
        console.log("  node build/veracode-mcp-client.js search-applications --name goat");
        console.log("  node build/veracode-mcp-client.js get-applications");
        console.log("  node build/veracode-mcp-client.js get-application-details-by-id --app_id 12345");
        console.log("  node build/veracode-mcp-client.js get-static-flaw-info-by-id --app_id 12345 --issue_id 67890");
        console.log("  node build/veracode-mcp-client.js get-static-flaw-info-by-name --name \"My App\" --issue_id 67890");
        console.log("\n📝 For application names with special characters, use JSON input:");
        console.log("  echo '{\"tool\":\"search-applications\",\"args\":{\"name\":\"bob\\\" &&\"}}' | node build/veracode-mcp-client.js --json");
        console.log("  echo '{\"tool\":\"get-scan-results-by-name\",\"args\":{\"name\":\"& test\"}}' | node build/veracode-mcp-client.js --json");
        return;
    }

    const toolName = args[0];
    const toolArgs: Record<string, any> = {};

    // Parse --key value pairs
    for (let i = 1; i < args.length; i += 2) {
        if (args[i].startsWith('--') && i + 1 < args.length) {
            const key = args[i].substring(2);
            const value = args[i + 1];
            toolArgs[key] = value;
        }
    }

    const toolCall: ToolCall = {
        tool: toolName,
        args: Object.keys(toolArgs).length > 0 ? toolArgs : undefined
    };

    const result = await client.callTool(toolCall);
    console.log(client.formatResult(result));
}

// Handle JSON input for programmatic usage
if (process.argv.includes('--json')) {
    const client = new VeracodeMCPClient();

    process.stdin.setEncoding('utf8');
    let input = '';

    process.stdin.on('readable', () => {
        let chunk;
        while (null !== (chunk = process.stdin.read())) {
            input += chunk;
        }
    });

    process.stdin.on('end', async () => {
        try {
            const toolCall: ToolCall = JSON.parse(input.trim());
            const result = await client.callTool(toolCall);
            console.log(JSON.stringify(result, null, 2));
        } catch (error: any) {
            console.log(JSON.stringify({ success: false, error: error.message }, null, 2));
        }
    });
} else {
    main().catch(error => {
        console.error("❌ Failed to execute:", error.message);
        process.exit(1);
    });
}
