// Quick test to verify the improved tool registry
import { CLIToolRegistry } from './build/cli-tools/cli-tool-registry.js';
import { VeracodeClient } from './build/veracode-rest-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create client and registry
const veracodeClient = new VeracodeClient(
    process.env.VERACODE_API_ID,
    process.env.VERACODE_API_KEY
);

const registry = new CLIToolRegistry(veracodeClient);

console.log('\n🔧 Tool Registry Analysis');
console.log('========================');

console.log('\n📊 Total Tools:', registry.getAvailableTools().length);

console.log('\n📁 Tools by Category:');
const categorization = registry.getToolsByCategory();
Object.entries(categorization).forEach(([category, tools]) => {
    if (tools.length > 0) {
        console.log(`\n  ${category} (${tools.length} tools):`);
        tools.forEach(tool => console.log(`    • ${tool}`));
    }
});

console.log('\n✅ Registry improvement verification complete!');
