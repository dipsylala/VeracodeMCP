// Quick test to verify the MCP tool registry
import { VeracodeMCPClient } from '../../build/veracode-mcp-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create MCP client
const client = new VeracodeMCPClient();

console.log('\n🔧 MCP Tool Registry Analysis');
console.log('==============================');

console.log('\n📊 Total Tools:', client.getToolCount());

console.log('\n📁 Tools by Category:');
const categorization = client.getToolsByCategory();
Object.entries(categorization).forEach(([category, tools]) => {
    if (tools.length > 0) {
        console.log(`\n  ${category} (${tools.length} tools):`);
        tools.forEach(tool => console.log(`    • ${tool}`));
    }
});

console.log('\n✅ MCP Registry verification complete!');
