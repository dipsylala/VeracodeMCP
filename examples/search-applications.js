#!/usr/bin/env node

/**
 * Basic Example: Search Applications
 * 
 * This example demonstrates how to search for applications by name using the Veracode MCP Server.
 * Usage: node search-applications.js [search-term]
 */

import { VeracodeDirectClient } from '../build/test-utils/veracode-direct-client.js';

async function searchApplications(searchTerm = 'Demo') {
    console.log(`🔍 Searching for applications containing "${searchTerm}"...\n`);

    try {
        // Initialize the MCP client
        const client = new VeracodeDirectClient();

        // Call the search-application-profiles tool
        const result = await client.callTool({
            tool: 'search-application-profiles',
            args: {
                name: searchTerm
            }
        });

        if (result.success && result.data) {
            const applications = result.data.application_profiles || result.data;

            console.log(`✅ Found ${applications.length} applications matching "${searchTerm}":\n`);

            if (applications.length === 0) {
                console.log('No applications found matching your search criteria.');
                console.log('Try using a different search term or check application names in your Veracode account.');
                return;
            }

            // Display matching applications
            applications.forEach((app, index) => {
                console.log(`${index + 1}. ${app.name}`);
                console.log(`   ID: ${app.guid}`);
                console.log(`   Business Unit: ${app.business_unit?.name || 'N/A'}`);
                console.log(`   Last Scan: ${app.last_completed_scan_date || 'Never'}`);
                console.log('');
            });

            console.log(`📊 Summary: Found ${applications.length} applications matching "${searchTerm}"`);
        } else {
            console.error('❌ Failed to search applications:', result.error || 'Unknown error');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error searching applications:', error.message);
        process.exit(1);
    }
}

// Get search term from command line arguments
const searchTerm = process.argv[2] || 'Demo';

// Run the example
searchApplications(searchTerm);
