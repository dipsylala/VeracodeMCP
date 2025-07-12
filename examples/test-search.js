/**
 * Test the search applications functionality
 */
import { VeracodeClient } from "../build/veracode-rest-client.js";
import * as dotenv from "dotenv";

dotenv.config();

async function testSearchApplications() {
  console.log("🔍 Testing application search functionality...");

  const apiId = process.env.VERACODE_API_ID;
  const apiKey = process.env.VERACODE_API_KEY;

  if (!apiId || !apiKey) {
    console.error("❌ Missing credentials");
    return;
  }

  const client = new VeracodeClient(apiId, apiKey);

  // Test searches for various common application name patterns
  const searchTerms = ["Test", "App", "Service", "API", "Project"];

  for (const term of searchTerms) {
    try {
      console.log(`\n🔎 Searching for applications containing "${term}"...`);
      const results = await client.searchApplications(term);

      if (results.length > 0) {
        console.log(`✅ Found ${results.length} applications:`);
        results.forEach((app, i) => {
          console.log(`  ${i + 1}. ${app.profile.name} (GUID: ${app.guid}, ID: ${app.id})`);
          console.log(`     Criticality: ${app.profile.business_criticality}`);
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
