import { ToolCategory, ToolHandler, ToolResult } from "./tool-handlers.js";

/**
 * Findings analysis tools with comprehensive mapping
 */
export class FindingsTools extends ToolCategory {
    getHandlers(): Record<string, ToolHandler> {
        return {
            "get-findings": this.getFindings.bind(this),
            "get-findings-by-name": this.getFindingsByName.bind(this),
            "get-findings-paginated": this.getFindingsPaginated.bind(this),
            "get-all-findings": this.getAllFindings.bind(this)
        };
    }

    private async getFindings(args: any): Promise<ToolResult> {
        if (!args?.app_id) {
            return { success: false, error: "Missing required argument: app_id" };
        }

        const result = await this.client.getFindingsById(args.app_id, {
            scanType: args.scan_type,
            severity: args.severity,
            severityGte: args.severity_gte,
            cwe: args.cwe,
            cvss: args.cvss,
            cvssGte: args.cvss_gte,
            cve: args.cve,
            context: args.context,
            includeAnnotations: args.include_annotations ?? true,
            newFindingsOnly: args.new_findings_only,
            policyViolation: args.violates_policy,
            page: args.page,
            size: args.size
        });

        return {
            success: true,
            data: {
                app_id: args.app_id,
                filters: this.buildFiltersObject(args),
                count: result.length,
                findings: this.mapFindings(result, args.size),
                total_findings: result.length,
                showing: args.size ? Math.min(parseInt(args.size), result.length) : result.length
            }
        };
    }

    private async getFindingsByName(args: any): Promise<ToolResult> {
        if (!args?.name) {
            return { success: false, error: "Missing required argument: name" };
        }

        const result = await this.client.getFindingsByName(args.name, {
            scanType: args.scan_type,
            severity: args.severity,
            severityGte: args.severity_gte,
            cwe: args.cwe,
            cvss: args.cvss,
            cvssGte: args.cvss_gte,
            cve: args.cve,
            context: args.context,
            includeAnnotations: args.include_annotations ?? true,
            newFindingsOnly: args.new_findings_only,
            policyViolation: args.violates_policy,
            page: args.page,
            size: args.size
        });

        return {
            success: true,
            data: {
                application_name: args.name,
                filters: this.buildFiltersObject(args),
                count: result.length,
                findings: this.mapFindings(result, args.size),
                total_findings: result.length,
                showing: args.size ? Math.min(parseInt(args.size), result.length) : result.length
            }
        };
    }

    private async getFindingsPaginated(args: any): Promise<ToolResult> {
        if (!args?.app_id) {
            return { success: false, error: "Missing required argument: app_id" };
        }

        const paginatedResult = await this.client.getFindingsPaginated(args.app_id, {
            scanType: args.scan_type,
            severity: args.severity,
            severityGte: args.severity_gte,
            cwe: args.cwe,
            cvss: args.cvss,
            cvssGte: args.cvss_gte,
            cve: args.cve,
            context: args.context,
            includeAnnotations: args.include_annotations ?? true,
            newFindingsOnly: args.new_findings_only,
            policyViolation: args.violates_policy,
            page: args.page || 0,
            size: args.size || 100
        });

        return {
            success: true,
            data: {
                app_id: args.app_id,
                pagination: {
                    current_page: paginatedResult.pagination.current_page,
                    total_pages: paginatedResult.pagination.total_pages,
                    total_elements: paginatedResult.pagination.total_elements,
                    page_size: paginatedResult.pagination.page_size,
                    has_next: paginatedResult.pagination.has_next,
                    has_previous: paginatedResult.pagination.has_previous
                },
                filters: this.buildFiltersObject(args),
                findings: this.mapFindings(paginatedResult.findings),
                count: paginatedResult.findings.length
            }
        };
    }

    private async getAllFindings(args: any): Promise<ToolResult> {
        if (!args?.app_id) {
            return { success: false, error: "Missing required argument: app_id" };
        }

        const allFindingsResult = await this.client.getAllFindings(args.app_id, {
            scanType: args.scan_type,
            severity: args.severity,
            severityGte: args.severity_gte,
            cwe: args.cwe,
            cvss: args.cvss,
            cvssGte: args.cvss_gte,
            cve: args.cve,
            context: args.context,
            includeAnnotations: args.include_annotations ?? true,
            newFindingsOnly: args.new_findings_only,
            policyViolation: args.violates_policy
        });

        return {
            success: true,
            data: {
                app_id: args.app_id,
                total_findings: allFindingsResult.totalElements,
                total_pages_processed: allFindingsResult.totalPages,
                filters: this.buildFiltersObject(args),
                findings: this.mapFindings(allFindingsResult.findings),
                count: allFindingsResult.findings.length
            }
        };
    }

    private buildFiltersObject(args: any) {
        return {
            scan_type: args.scan_type,
            severity: args.severity,
            severity_gte: args.severity_gte,
            cwe: args.cwe,
            cvss: args.cvss,
            cvss_gte: args.cvss_gte,
            cve: args.cve,
            context: args.context,
            new_findings_only: args.new_findings_only,
            violates_policy: args.violates_policy
        };
    }

    private mapFindings(findings: any[], limitSize?: string): any[] {
        const limitedFindings = limitSize ? findings.slice(0, parseInt(limitSize)) : findings;

        return limitedFindings.map((finding: any) => {
            const mappedFinding: any = {
                // Core finding identification
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

            // Add scan type specific details
            this.addScanTypeSpecificFields(mappedFinding, finding);

            return mappedFinding;
        });
    }

    private addScanTypeSpecificFields(mappedFinding: any, finding: any): void {
        switch (finding.scan_type) {
            case 'STATIC':
                this.addStaticAnalysisFields(mappedFinding, finding);
                break;
            case 'DYNAMIC':
                this.addDynamicAnalysisFields(mappedFinding, finding);
                break;
            case 'MANUAL':
                this.addManualTestingFields(mappedFinding, finding);
                break;
            case 'SCA':
                this.addSCAFields(mappedFinding, finding);
                break;
        }
    }

    private addStaticAnalysisFields(mappedFinding: any, finding: any): void {
        mappedFinding.attack_vector = finding.finding_details?.attack_vector;
        mappedFinding.file_line_number = finding.finding_details?.file_line_number;
        mappedFinding.file_name = finding.finding_details?.file_name;
        mappedFinding.file_path = finding.finding_details?.file_path;
        mappedFinding.finding_category = finding.finding_details?.finding_category;
        mappedFinding.module = finding.finding_details?.module;
        mappedFinding.procedure = finding.finding_details?.procedure;
        mappedFinding.relative_location = finding.finding_details?.relative_location;
    }

    private addDynamicAnalysisFields(mappedFinding: any, finding: any): void {
        mappedFinding.attack_vector = finding.finding_details?.attack_vector;
        mappedFinding.hostname = finding.finding_details?.hostname;
        mappedFinding.port = finding.finding_details?.port;
        mappedFinding.path = finding.finding_details?.path;
        mappedFinding.plugin = finding.finding_details?.plugin;
        mappedFinding.finding_category = finding.finding_details?.finding_category;
        mappedFinding.url = finding.finding_details?.URL;
        mappedFinding.vulnerable_parameter = finding.finding_details?.vulnerable_parameter;
        mappedFinding.discovered_by_vsa = finding.finding_details?.discovered_by_vsa;
    }

    private addManualTestingFields(mappedFinding: any, finding: any): void {
        mappedFinding.capec_id = finding.finding_details?.capec_id;
        mappedFinding.exploit_desc = finding.finding_details?.exploit_desc;
        mappedFinding.exploit_difficulty = finding.finding_details?.exploit_difficulty;
        mappedFinding.input_vector = finding.finding_details?.input_vector;
        mappedFinding.location = finding.finding_details?.location;
        mappedFinding.module = finding.finding_details?.module;
        mappedFinding.remediation_desc = finding.finding_details?.remediation_desc;
        mappedFinding.severity_desc = finding.finding_details?.severity_desc;
    }

    private addSCAFields(mappedFinding: any, finding: any): void {
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
}
