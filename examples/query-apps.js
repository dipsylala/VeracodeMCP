#!/usr/bin/env node

import { VeracodeClient } from "../build/veracode-rest-client.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testVeracodeConnection() {
  // Optional search term from command line arguments
  const searchTerm = process.argv[2];

  if (searchTerm) {
    console.log(`🔍 Testing Veracode API connection and searching for "${searchTerm}"...`);
  } else {
    console.log("🔍 Testing Veracode API connection...");
    console.log("💡 Tip: You can search for specific apps using: node query-apps.js \"search-term\"\n");
  }

  const apiId = process.env.VERACODE_API_ID;
  const apiKey = process.env.VERACODE_API_KEY;

  if (!apiId || !apiKey) {
    console.error("❌ Missing API credentials in .env file");
    process.exit(1);
  }

  console.log(`📡 Using API ID: ${apiId.substring(0, 8)}...`);

  try {
    const client = new VeracodeClient(apiId, apiKey);

    let applications;
    if (searchTerm) {
      console.log(`📱 Searching for applications matching "${searchTerm}"...`);
      applications = await client.searchApplications(searchTerm);
      console.log(`\n✅ Found ${applications.length} matching applications:\n`);
    } else {
      console.log("📱 Fetching applications from Veracode...");
      applications = await client.getApplications();
      console.log(`\n✅ Found ${applications.length} applications:\n`);
    }

    if (applications.length === 0) {
      console.log("No applications found in your Veracode account.");
      console.log("This could mean:");
      console.log("- Your API credentials don't have access to applications");
      console.log("- No applications have been created in your account");
      console.log("- The credentials may not have the necessary permissions");
    } else {
      applications.forEach((app, index) => {
        console.log(`${index + 1}. ${app.profile.name}`);
        console.log(`   GUID: ${app.guid}`);
        console.log(`   ID: ${app.id}`);
        console.log(`   Business Criticality: ${app.profile.business_criticality}`);
        console.log(`   Created: ${app.created}`);
        console.log(`   Teams: ${app.profile.teams?.map(t => t.team_name).join(", ") || "None"}`);
        console.log("");
      });
    }

  } catch (error) {
    console.error("❌ Error fetching applications:", error instanceof Error ? error.message : String(error));

    if (error instanceof Error) {
      if (error.message.includes("Authentication failed")) {
        console.log("\n💡 Troubleshooting tips:");
        console.log("- Verify your API ID and Key are correct");
        console.log("- Check if your API credentials are active");
        console.log("- Ensure the credentials have 'Applications' read permissions");
      } else if (error.message.includes("Access forbidden")) {
        console.log("\n💡 Your credentials are valid but don't have permission to access applications");
        console.log("- Contact your Veracode administrator to grant application access");
        console.log("- Verify the API credentials have the necessary roles");
      }
    }
  }
}

testVeracodeConnection();
