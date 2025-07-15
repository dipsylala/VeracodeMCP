#!/usr/bin/env node

import { VeracodeClient } from "../build/veracode-rest-client.js";

async function testVeracodeConnection() {
  // Optional search term from command line arguments
  const searchTerm = process.argv[2];

  if (searchTerm) {
    console.log(`🔍 Testing Veracode API connection and searching for "${searchTerm}"...`);
  } else {
    console.log("🔍 Testing Veracode API connection...");
    console.log("💡 Tip: You can search for specific apps using: node query-apps.js \"search-term\"\n");
  }

  let client;
  try {
    console.log('Loading Veracode credentials from environment...');
    client = VeracodeClient.fromEnvironment();
    console.log('✅ Credentials loaded successfully\n');
  } catch (error) {
    console.error("❌ Failed to load Veracode credentials:", error.message);
    console.error("Please ensure VERACODE_API_ID and VERACODE_API_KEY are set in your .env file");
    process.exit(1);
  }

  try {
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

        // Display profile and results URLs if available
        if (app.app_profile_url) {
          console.log(`   📱 Profile URL: ${app.app_profile_url}`);
        }
        if (app.results_url) {
          console.log(`   📊 Results URL: ${app.results_url}`);
        }

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
