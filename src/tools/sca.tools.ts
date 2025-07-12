import { z } from "zod";
import { ToolHandler, ToolContext, ToolResponse } from "../types/tool.types.js";

// Software Composition Analysis (SCA) tools
export const scaTools: ToolHandler[] = [
    {
        name: "get-sca-results",
        description: "Get comprehensive Software Composition Analysis (SCA) results for an application. Returns complete SCA scan results including all findings with detailed component analysis, vulnerability information, and exploitability data.",
        schema: {
            name: z.string().describe("Application name to get SCA results for"),
            include_transitive: z.boolean().optional().describe("Include transitive dependencies (default: true)"),
            include_direct: z.boolean().optional().describe("Include direct dependencies (default: true)"),
            severity_gte: z.number().optional().describe("Minimum severity level (0-5, default: all severities)"),
            cvss_gte: z.number().optional().describe("Minimum CVSS score (0-10)"),
            only_policy_violations: z.boolean().optional().describe("Only show policy violations (default: false)"),
            only_new_findings: z.boolean().optional().describe("Only show new findings (default: false)"),
            only_exploitable: z.boolean().optional().describe("Only show findings with known exploits (default: false)"),
            include_license_analysis: z.boolean().optional().describe("Include license risk analysis (default: true)"),
            max_results: z.number().optional().describe("Maximum number of findings to retrieve (default: unlimited)")
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                // First get the application to get its ID
                const searchResults = await context.veracodeClient.searchApplications(args.name);

                if (searchResults.length === 0) {
                    return {
                        success: false,
                        error: `No application found with name: ${args.name}`
                    };
                }

                // Find exact match or use first result
                let targetApp = searchResults.find((app: any) => app.profile.name.toLowerCase() === args.name.toLowerCase());
                if (!targetApp) {
                    targetApp = searchResults[0];
                    console.warn(`No exact match found for "${args.name}". Using first result: "${targetApp.profile.name}"`);
                }

                // Get SCA findings using the new paginated API
                const scaOptions = {
                    scanType: "SCA" as const,
                    severityGte: args.severity_gte,
                    cvssGte: args.cvss_gte,
                    newFindingsOnly: args.only_new_findings,
                    policyViolation: args.only_policy_violations,
                    scaDependencyMode: args.include_transitive && args.include_direct ? "BOTH" :
                        args.include_transitive ? "TRANSITIVE" :
                            args.include_direct ? "DIRECT" : "BOTH",
                    includeAnnotations: true,
                    pageSize: args.max_results ? Math.min(args.max_results, 500) : 500,
                    maxPages: args.max_results ? Math.ceil(args.max_results / 500) : 50
                };

                // Get all SCA findings with pagination
                const findingsResult = await context.veracodeClient.getAllFindings(targetApp.guid, scaOptions);

                // Filter findings for exploitability if requested
                let filteredFindings = findingsResult.findings;
                if (args.only_exploitable) {
                    filteredFindings = filteredFindings.filter((finding: any) => {
                        const exploitability = finding.finding_details?.cve?.exploitability;
                        return exploitability?.exploit_observed === true;
                    });
                }

                // Create comprehensive analysis from the findings
                const scaAnalysis = {
                    totalComponents: new Set(filteredFindings.map((f: any) => f.finding_details?.component_id)).size,
                    vulnerableComponents: new Set(filteredFindings.map((f: any) => f.finding_details?.component_id)).size,
                    totalFindings: filteredFindings.length,
                    exploitableFindings: filteredFindings.filter((f: any) => f.finding_details?.cve?.exploitability?.exploit_observed).length,
                    directDependencies: filteredFindings.filter((f: any) => f.finding_details?.metadata?.includes("DIRECT")).length,
                    transitiveDependencies: filteredFindings.filter((f: any) => f.finding_details?.metadata?.includes("TRANSITIVE")).length,
                    licensingIssues: filteredFindings.filter((f: any) => f.finding_details?.licenses?.some((l: any) => parseInt(l.risk_rating) > 2)).length,
                    highRiskComponents: filteredFindings.filter((f: any) => f.finding_details?.severity >= 4).length,
                    severityBreakdown: filteredFindings.reduce((acc: Record<string, number>, finding: any) => {
                        const severity = finding.finding_details?.severity || 0;
                        const label = severity === 5 ? "Very High" : severity === 4 ? "High" :
                            severity === 3 ? "Medium" : severity === 2 ? "Low" : "Very Low";
                        acc[label] = (acc[label] || 0) + 1;
                        return acc;
                    }, {}),
                    topVulnerabilities: filteredFindings
                        .filter((f: any) => f.finding_details?.cve?.cvss)
                        .map((f: any) => ({
                            cve: f.finding_details.cve.name,
                            cvss: f.finding_details.cve.cvss,
                            severity: f.finding_details.cve.severity,
                            component: f.finding_details.component_filename,
                            exploitable: f.finding_details.cve.exploitability?.exploit_observed || false
                        }))
                        .sort((a: any, b: any) => b.cvss - a.cvss)
                        .slice(0, 10)
                };

                // Get basic scan information (if available)
                let latestScanResults = null;
                try {
                    const scans = await context.veracodeClient.getScanResults(targetApp.guid, 'SCA');
                    if (scans.length > 0) {
                        const latestScan = scans.sort((a: any, b: any) =>
                            new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
                        )[0];
                        latestScanResults = {
                            scan: latestScan,
                            summary: {
                                totalFindings: filteredFindings.length,
                                policyViolations: filteredFindings.filter((f: any) => f.violates_policy).length,
                                highRiskComponents: scaAnalysis.highRiskComponents
                            }
                        };
                    }
                } catch (scanError) {
                    console.warn(`Could not retrieve scan information: ${scanError}`);
                }

                // Enhance the analysis with complete data
                const enhancedAnalysis = {
                    ...scaAnalysis,
                    totalFindingsRetrieved: filteredFindings.length,
                    paginationInfo: {
                        maxResultsRequested: args.max_results || "unlimited",
                        actualResultsRetrieved: filteredFindings.length,
                        truncated: findingsResult.truncated || (args.max_results && filteredFindings.length >= args.max_results)
                    }
                };

                return {
                    success: true,
                    data: {
                        application: {
                            name: targetApp.profile.name,
                            id: targetApp.guid,
                            business_criticality: targetApp.profile.business_criticality,
                            app_profile_url: targetApp.app_profile_url,
                            results_url: targetApp.results_url
                        },
                        scan_information: latestScanResults ? {
                            latest_scan: latestScanResults.scan,
                            scan_summary: latestScanResults.summary
                        } : {
                            latest_scan: null,
                            scan_summary: null,
                            note: "No SCA scan information available"
                        },
                        comprehensive_analysis: enhancedAnalysis,
                        detailed_findings: filteredFindings,
                        filters_applied: {
                            scan_type: "SCA",
                            include_transitive: args.include_transitive ?? true,
                            include_direct: args.include_direct ?? true,
                            severity_gte: args.severity_gte,
                            cvss_gte: args.cvss_gte,
                            only_policy_violations: args.only_policy_violations,
                            only_new_findings: args.only_new_findings,
                            only_exploitable: args.only_exploitable,
                            max_results: args.max_results
                        },
                        metadata: {
                            total_findings_analyzed: filteredFindings.length,
                            data_completeness: findingsResult.truncated ? "limited" : "complete",
                            analysis_timestamp: new Date().toISOString(),
                            pages_retrieved: findingsResult.pagesRetrieved,
                            total_pages_available: findingsResult.totalPages
                        }
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching comprehensive SCA results: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    },

    {
        name: "get-sca-summary",
        description: "Get a high-level SCA summary for an application including key metrics, risk assessment, and component overview without detailed findings.",
        schema: {
            name: z.string().describe("Application name to get SCA summary for")
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                // First get the application to get its ID
                const searchResults = await context.veracodeClient.searchApplications(args.name);

                if (searchResults.length === 0) {
                    return {
                        success: false,
                        error: `No application found with name: ${args.name}`
                    };
                }

                // Find exact match or use first result
                let targetApp = searchResults.find((app: any) => app.profile.name.toLowerCase() === args.name.toLowerCase());
                if (!targetApp) {
                    targetApp = searchResults[0];
                    console.warn(`No exact match found for "${args.name}". Using first result: "${targetApp.profile.name}"`);
                }

                // Get SCA findings for summary (limited to 1000 for performance)
                const summaryResult = await context.veracodeClient.getAllFindings(targetApp.guid, {
                    scanType: "SCA",
                    pageSize: 500,
                    maxPages: 2 // Max 1000 findings for summary
                });

                // Get latest scan information
                let latestScanResults = null;
                try {
                    const scans = await context.veracodeClient.getScanResults(targetApp.guid, 'SCA');
                    if (scans.length > 0) {
                        const latestScan = scans.sort((a: any, b: any) =>
                            new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
                        )[0];
                        latestScanResults = { scan: latestScan };
                    }
                } catch (scanError) {
                    console.warn(`Could not retrieve scan information: ${scanError}`);
                }

                // Create summary analysis from the findings
                const summaryFindings = summaryResult.findings;
                const summaryAnalysis = {
                    totalComponents: new Set(summaryFindings.map((f: any) => f.finding_details?.component_id)).size,
                    vulnerableComponents: new Set(summaryFindings.map((f: any) => f.finding_details?.component_id)).size,
                    totalFindings: summaryFindings.length,
                    exploitableFindings: summaryFindings.filter((f: any) => f.finding_details?.cve?.exploitability?.exploit_observed).length,
                    directDependencies: summaryFindings.filter((f: any) => f.finding_details?.metadata?.includes("DIRECT")).length,
                    transitiveDependencies: summaryFindings.filter((f: any) => f.finding_details?.metadata?.includes("TRANSITIVE")).length,
                    licensingIssues: summaryFindings.filter((f: any) => f.finding_details?.licenses?.some((l: any) => parseInt(l.risk_rating) > 2)).length,
                    highRiskComponents: summaryFindings.filter((f: any) => f.finding_details?.severity >= 4).length,
                    severityBreakdown: summaryFindings.reduce((acc: Record<string, number>, finding: any) => {
                        const severity = finding.finding_details?.severity || 0;
                        const label = severity === 5 ? "Very High" : severity === 4 ? "High" :
                            severity === 3 ? "Medium" : severity === 2 ? "Low" : "Very Low";
                        acc[label] = (acc[label] || 0) + 1;
                        return acc;
                    }, {}),
                    topVulnerabilities: summaryFindings
                        .filter((f: any) => f.finding_details?.cve?.cvss)
                        .map((f: any) => ({
                            cve: f.finding_details.cve.name,
                            cvss: f.finding_details.cve.cvss,
                            severity: f.finding_details.cve.severity,
                            component: f.finding_details.component_filename,
                            exploitable: f.finding_details.cve.exploitability?.exploit_observed || false
                        }))
                        .sort((a: any, b: any) => b.cvss - a.cvss)
                        .slice(0, 10)
                };

                // Calculate additional metrics
                const riskAssessment = {
                    overall_risk: summaryAnalysis.exploitableFindings > 0 ? "HIGH" :
                        summaryAnalysis.highRiskComponents > 5 ? "MEDIUM" : "LOW",
                    critical_components: summaryAnalysis.topVulnerabilities.filter((v: any) => v.cvss >= 9.0).length,
                    high_components: summaryAnalysis.topVulnerabilities.filter((v: any) => v.cvss >= 7.0 && v.cvss < 9.0).length,
                    medium_components: summaryAnalysis.topVulnerabilities.filter((v: any) => v.cvss >= 4.0 && v.cvss < 7.0).length,
                    needs_immediate_attention: summaryAnalysis.exploitableFindings > 0 ||
                        summaryAnalysis.topVulnerabilities.filter((v: any) => v.cvss >= 9.0).length > 0
                };

                return {
                    success: true,
                    data: {
                        application: {
                            name: targetApp.profile.name,
                            id: targetApp.guid,
                            business_criticality: targetApp.profile.business_criticality,
                            app_profile_url: targetApp.app_profile_url,
                            results_url: targetApp.results_url
                        },
                        scan_status: {
                            has_sca_scans: latestScanResults !== null,
                            latest_scan_date: latestScanResults?.scan?.created_date,
                            latest_scan_status: latestScanResults?.scan?.status,
                            policy_compliance: latestScanResults?.scan?.policy_compliance_status
                        },
                        risk_assessment: riskAssessment,
                        component_overview: {
                            total_components: summaryAnalysis.totalComponents,
                            vulnerable_components: summaryAnalysis.vulnerableComponents,
                            high_risk_components: summaryAnalysis.highRiskComponents,
                            direct_dependencies: summaryAnalysis.directDependencies,
                            transitive_dependencies: summaryAnalysis.transitiveDependencies
                        },
                        vulnerability_summary: {
                            total_findings: summaryAnalysis.totalFindings,
                            exploitable_findings: summaryAnalysis.exploitableFindings,
                            licensing_issues: summaryAnalysis.licensingIssues,
                            severity_breakdown: summaryAnalysis.severityBreakdown,
                            top_5_vulnerabilities: summaryAnalysis.topVulnerabilities.slice(0, 5)
                        },
                        recommendations: {
                            immediate_actions: riskAssessment.needs_immediate_attention ?
                                ["Review exploitable vulnerabilities", "Update critical components", "Apply security patches"] :
                                ["Continue monitoring", "Plan component updates"],
                            priority_focus: summaryAnalysis.exploitableFindings > 0 ? "exploitable_vulnerabilities" :
                                summaryAnalysis.highRiskComponents > 0 ? "high_risk_components" : "licensing_compliance"
                        },
                        metadata: {
                            summary_generated: new Date().toISOString(),
                            data_sample_size: summaryAnalysis.totalFindings,
                            complete_analysis_available: true,
                            pages_analyzed: summaryResult.pagesRetrieved,
                            data_truncated: summaryResult.truncated
                        }
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching SCA summary: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    },

    {
        name: "get-sca-apps",
        description: "Get all applications that have SCA scanning enabled with comprehensive analysis of their security posture",
        schema: {
            include_recent_only: z.boolean().optional().describe("Only include apps with recent SCA scans (last 30 days, default: false)"),
            include_risk_analysis: z.boolean().optional().describe("Include risk assessment for each app (default: true)"),
            min_business_criticality: z.string().optional().describe("Minimum business criticality (VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH)")
        },
        handler: async (args: any, context: ToolContext): Promise<ToolResponse> => {
            try {
                // Get all applications first
                const allApps = await context.veracodeClient.getApplications();

                const scaApps = [];
                let totalAppsProcessed = 0;

                // Filter by business criticality if specified
                const filteredApps = args.min_business_criticality ?
                    allApps.filter((app: any) => {
                        const criticalityLevels = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
                        const appLevel = criticalityLevels.indexOf(app.profile.business_criticality);
                        const minLevel = criticalityLevels.indexOf(args.min_business_criticality);
                        return appLevel >= minLevel;
                    }) : allApps;

                // Check each application for SCA scans
                for (const app of filteredApps) {
                    totalAppsProcessed++;
                    try {
                        const scaScans = await context.veracodeClient.getScanResults(app.guid, 'SCA');

                        if (scaScans.length > 0) {
                            // Filter for recent scans if requested
                            let relevantScans = scaScans;
                            if (args.include_recent_only) {
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                                relevantScans = scaScans.filter((scan: any) =>
                                    new Date(scan.created_date) > thirtyDaysAgo
                                );
                            }

                            if (relevantScans.length > 0) {
                                // Get the latest scan
                                const latestScan = relevantScans.sort((a: any, b: any) =>
                                    new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
                                )[0];

                                let riskAssessment = null;
                                if (args.include_risk_analysis !== false) {
                                    try {
                                        // Get basic risk metrics for the app using paginated findings
                                        const quickAnalysis = await context.veracodeClient.getAllFindings(app.guid, {
                                            scanType: "SCA",
                                            pageSize: 100, // Small sample for risk assessment
                                            maxPages: 1
                                        });

                                        const findings = quickAnalysis.findings;
                                        const hasHighRisk = findings.filter((f: any) => f.finding_details?.severity >= 4).length > 0;
                                        const hasPolicyViolations = findings.filter((f: any) => f.violates_policy).length > 0;

                                        riskAssessment = {
                                            total_findings: findings.length,
                                            high_risk_components: findings.filter((f: any) => f.finding_details?.severity >= 4).length,
                                            policy_violations: findings.filter((f: any) => f.violates_policy).length,
                                            risk_level: hasHighRisk && hasPolicyViolations ? "HIGH" :
                                                hasHighRisk || hasPolicyViolations ? "MEDIUM" : "LOW",
                                            severity_breakdown: findings.reduce((acc: Record<string, number>, finding: any) => {
                                                const severity = finding.finding_details?.severity || 0;
                                                const label = severity === 5 ? "Very High" : severity === 4 ? "High" :
                                                    severity === 3 ? "Medium" : severity === 2 ? "Low" : "Very Low";
                                                acc[label] = (acc[label] || 0) + 1;
                                                return acc;
                                            }, {})
                                        };
                                    } catch (riskError) {
                                        console.warn(`Failed to get risk assessment for ${app.profile.name}: ${riskError}`);
                                    }
                                }

                                scaApps.push({
                                    name: app.profile.name,
                                    id: app.guid,
                                    business_criticality: app.profile.business_criticality,
                                    total_sca_scans: scaScans.length,
                                    recent_sca_scans: relevantScans.length,
                                    latest_sca_scan: {
                                        scan_id: latestScan.scan_id,
                                        status: latestScan.status,
                                        created_date: latestScan.created_date,
                                        policy_compliance_status: latestScan.policy_compliance_status
                                    },
                                    risk_assessment: riskAssessment,
                                    app_profile_url: app.app_profile_url,
                                    results_url: app.results_url
                                });
                            }
                        }
                    } catch (scanError) {
                        // Skip apps that can't be accessed or have no scans
                        console.warn(`Failed to get SCA scans for app ${app.profile.name}: ${scanError}`);
                    }
                }

                // Sort by risk level and business criticality
                scaApps.sort((a: any, b: any) => {
                    const riskOrder: Record<string, number> = { "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
                    const criticalityOrder: Record<string, number> = { "VERY_HIGH": 5, "HIGH": 4, "MEDIUM": 3, "LOW": 2, "VERY_LOW": 1 };

                    const aRisk = riskOrder[a.risk_assessment?.risk_level as string] || 0;
                    const bRisk = riskOrder[b.risk_assessment?.risk_level as string] || 0;

                    if (aRisk !== bRisk) return bRisk - aRisk;

                    const aCrit = criticalityOrder[a.business_criticality as string] || 0;
                    const bCrit = criticalityOrder[b.business_criticality as string] || 0;
                    return bCrit - aCrit;
                });

                return {
                    success: true,
                    data: {
                        summary: {
                            total_applications_analyzed: totalAppsProcessed,
                            sca_enabled_applications: scaApps.length,
                            high_risk_applications: scaApps.filter((app: any) => app.risk_assessment?.risk_level === "HIGH").length,
                            medium_risk_applications: scaApps.filter((app: any) => app.risk_assessment?.risk_level === "MEDIUM").length,
                            low_risk_applications: scaApps.filter((app: any) => app.risk_assessment?.risk_level === "LOW").length
                        },
                        filters_applied: {
                            include_recent_only: args.include_recent_only || false,
                            include_risk_analysis: args.include_risk_analysis !== false,
                            min_business_criticality: args.min_business_criticality || "any"
                        },
                        applications: scaApps,
                        metadata: {
                            analysis_timestamp: new Date().toISOString(),
                            sorted_by: "risk_level_and_business_criticality"
                        }
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Error fetching SCA apps with analysis: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    }
];
