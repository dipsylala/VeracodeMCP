#!/usr/bin/env node

import { VeracodeClient } from '../build/veracode-rest-client.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function listApplications() {
    console.log('📋 Listing all available Veracode applications...\n');

    const apiId = process.env.VERACODE_API_ID;
    const apiKey = process.env.VERACODE_API_KEY;

    if (!apiId || !apiKey) {
        console.error('❌ Missing API credentials in .env file');
        process.exit(1);
    }

    try {
        const client = new VeracodeClient(apiId, apiKey);
        const applications = await client.getApplications();

        console.log(`✅ Found ${applications.length} total applications:\n`);

        applications.forEach((app, index) => {
            console.log(`${index + 1}. ${app.profile.name}`);
            console.log(`   ID: ${app.guid}`);
            console.log(`   Business Criticality: ${app.profile.business_criticality}`);
            console.log(`   Teams: ${app.profile.teams?.map(team => team.team_name).join(', ') || 'None'}`);
            console.log(`   Created: ${app.created}`);
            console.log('');
        });

        console.log(`\n💡 To get SCA results for any application, use:`);
        console.log(`   node examples/get-sca-results.js "Application Name"`);
        console.log(`\n💡 To search for specific applications, use:`);
        console.log(`   node examples/query-apps.js "search term"`);

    } catch (error) {
        console.error('❌ Error fetching applications:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        }
    }
}

listApplications().catch(console.error);
