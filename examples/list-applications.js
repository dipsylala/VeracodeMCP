#!/usr/bin/env node

/**
 * Basic Example: List All Applications
 * 
 * This example demonstrates how to list all applications using the Veracode MCP Server.
 * This is a simple, well-commented example for learning purposes.
 */

import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';

async function listApplications() {
    console.log('📋 Listing all Veracode applications...\n');

    try {
        // Initialize the MCP client
        const client = new VeracodeMCPClient();

        // Call the search-application-profiles tool with empty name to get all applications
        const result = await client.callTool({
            tool: 'search-application-profiles',
            args: {
                name: ''  // Empty name to get all applications
            }
        });

        if (result.success && result.data) {
            const applications = result.data.application_profiles || result.data;
            
            console.log(`✅ Found ${applications.length} applications:\n`);
            
            // Display applications in a simple format
            applications.forEach((app, index) => {
                console.log(`${index + 1}. ${app.name}`);
                console.log(`   ID: ${app.guid}`);
                console.log(`   Business Unit: ${app.business_unit?.name || 'N/A'}`);
                console.log(`   Teams: ${app.teams?.map(t => t.team_name).join(', ') || 'None'}`);
                console.log('');
            });
            
            console.log(`📊 Summary: Listed ${applications.length} applications successfully`);
        } else {
            console.error('❌ Failed to retrieve applications:', result.error || 'Unknown error');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error listing applications:', error.message);
        process.exit(1);
    }
}

// Run the example
listApplications();
