// Test the search applications functionality using MCP Client
import { VeracodeMCPClient } from "../build/veracode-mcp-client.js";
import * as dotenv from "dotenv";

dotenv.config();

async function testSearchApplications() {
  console.log("🔍 Testing application search functionality...");

  const client = new VeracodeMCPClient();

  // Test searches for various common application name patterns
  const searchTerms = ["Test", "App", "Service", "API", "Project"];

  for (const term of searchTerms) {
    try {
      console.log(`\n🔎 Searching for applications containing "${term}"...`);
      const result = await client.callTool({
        tool: 'search-application-profiles',
        args: {
          name: term
        }
      });

      if (result.success && result.data?.application_profiles?.length > 0) {
        console.log(`✅ Found ${result.data.application_profiles.length} applications:`);
        result.data.application_profiles.slice(0, 5).forEach((app, i) => {
          console.log(`  ${i + 1}. ${app.name} (GUID: ${app.guid}, ID: ${app.id})`);
          console.log(`     Criticality: ${app.business_criticality}`);
        });
      } else {
        console.log(`❌ No applications found matching "${term}"`);
      }
    } catch (error) {
      console.error(`❌ Error searching for "${term}":`, error);
    }
  }

  console.log("\n✅ Search functionality test completed!");
}

testSearchApplications();
