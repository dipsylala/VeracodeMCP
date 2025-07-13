import { ToolHandler, ToolCategory } from "../types/tool.types.js";
import { applicationTools } from "./application.tools.js";
import { findingsTools } from "./findings.tools.js";
import { staticAnalysisTools } from "./static-analysis.tools.js";
import { scaTools } from "./sca.tools.js";
import { scanTools } from "./scan.tools.js";
import { policyTools } from "./policy.tools.js";

// Tool registry for organized tool management
export class ToolRegistry {
    private tools: Map<string, ToolHandler> = new Map();
    private toolsByCategory: Map<ToolCategory, ToolHandler[]> = new Map();

    constructor() {
        this.registerTools();
    }

    private registerTools(): void {
        // Register application tools
        this.registerToolCategory(ToolCategory.APPLICATION, applicationTools);

        // Register findings tools
        this.registerToolCategory(ToolCategory.FINDINGS, findingsTools);

        // Register static analysis tools
        this.registerToolCategory(ToolCategory.STATIC_ANALYSIS, staticAnalysisTools);

        // Register SCA tools
        this.registerToolCategory(ToolCategory.SCA, scaTools);

        // Register scan tools
        this.registerToolCategory(ToolCategory.SCAN, scanTools);

        // Register policy tools
        this.registerToolCategory(ToolCategory.POLICY, policyTools);
    }

    private registerToolCategory(category: ToolCategory, tools: ToolHandler[]): void {
        this.toolsByCategory.set(category, tools);
        tools.forEach(tool => {
            this.tools.set(tool.name, tool);
        });
    }

    // Get all tools
    getAllTools(): ToolHandler[] {
        return Array.from(this.tools.values());
    }

    // Get tool by name
    getTool(name: string): ToolHandler | undefined {
        return this.tools.get(name);
    }

    // Get tools by category
    getToolsByCategory(category: ToolCategory): ToolHandler[] {
        return this.toolsByCategory.get(category) || [];
    }

    // Get all tool names
    getToolNames(): string[] {
        return Array.from(this.tools.keys());
    }

    // Check if tool exists
    hasTool(name: string): boolean {
        return this.tools.has(name);
    }

    // Get tool count
    getToolCount(): number {
        return this.tools.size;
    }

    // Get categories with tool counts
    getCategorySummary(): { [key in ToolCategory]: number } {
        const summary = {} as { [key in ToolCategory]: number };
        for (const category of Object.values(ToolCategory)) {
            summary[category] = this.getToolsByCategory(category).length;
        }
        return summary;
    }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
