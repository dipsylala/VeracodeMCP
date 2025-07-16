#!/usr/bin/env node

/**
 * Query and display Veracode applications using MCP tools
 */

import { VeracodeMCPClient } from '../build/veracode-mcp-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function queryApplications() {
    console.log('🔍 Querying Veracode Applications...');
    console.log('=' .repeat(50));
    
    try {
        const client = new VeracodeMCPClient();
        
        // Get all applications
        console.log('📋 Getting first 10 applications...');
        const appsResult = await client.callTool({
            tool: 'search-application-profiles',
            args: {
                name: ''  // Empty name to get all applications
            }
        });
        
        if (appsResult.success && appsResult.data) {
            // Handle MCP tool response structure
            let apps;
            if (appsResult.data.application_profiles && Array.isArray(appsResult.data.application_profiles)) {
                apps = appsResult.data.application_profiles.slice(0, 10);
            } else if (Array.isArray(appsResult.data)) {
                apps = appsResult.data.slice(0, 10);
            } else {
                console.log('❌ Unexpected data structure in response');
                console.log('Available keys:', Object.keys(appsResult.data));
                return;
            }
            
            console.log(`✅ Found ${appsResult.data.application_profiles?.length || appsResult.data.length || 0} total applications`);
            console.log(`📋 Showing first ${apps.length} applications:\n`);
            
            apps.forEach((app, index) => {
                console.log(`${index + 1}. ${app.name}`);
                console.log(`   ID: ${app.guid}`);
                console.log(`   Criticality: ${app.business_criticality || 'Not set'}`);
                console.log(`   Team: ${app.teams?.[0]?.team_name || 'No team assigned'}`);
                console.log();
            });
            
            // Get detailed information for the first application
            if (apps.length > 0) {
                const firstApp = apps[0];
                console.log(`🔍 Getting detailed information for: ${firstApp.name}`);
                console.log('-' .repeat(40));
                
                const detailResult = await client.callTool({
                    tool: 'get-application-profile-details',
                    args: {
                        app_profile: firstApp.guid
                    }
                });
                
                if (detailResult.success && detailResult.data) {
                    const app = detailResult.data;
                    console.log(`📋 Application: ${app.name}`);
                    console.log(`🆔 GUID: ${app.guid}`);
                    console.log(`📊 Business Criticality: ${app.business_criticality || 'Not set'}`);
                    console.log(`📅 Created: ${app.created_time ? new Date(app.created_time).toLocaleDateString() : 'Unknown'}`);
                    console.log(`👥 Teams: ${app.teams?.map(t => t.team_name).join(', ') || 'None'}`);
                    console.log(`🏷️ Tags: ${app.tags?.map(t => t.name).join(', ') || 'None'}`);
                    
                    if (app.policies && app.policies.length > 0) {
                        console.log(`📋 Policies: ${app.policies.map(p => p.name).join(', ')}`);
                    }
                } else {
                    console.log('❌ Failed to get application details');
                }
            }
        } else {
            console.log('❌ Failed to retrieve applications');
            if (appsResult.error) {
                console.log(`Error: ${appsResult.error}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error querying applications:', error.message);
    }
}

queryApplications();
