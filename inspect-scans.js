#!/usr/bin/env node

import { VeracodeClient } from "./build/veracode-rest-client.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const veracodeClient = new VeracodeClient(
    process.env.VERACODE_API_ID,
    process.env.VERACODE_API_KEY
);

async function inspectScanResponse() {
    try {
        console.log("Raw API Response for getScanResults:");

        // Create a version of the client that doesn't modify URLs
        const originalGetScanResults = veracodeClient.getScanResults;
        veracodeClient.getScanResults = async function (appId, scanType) {
            try {
                let url = `appsec/v1/applications/${appId}/scans`;
                if (scanType) {
                    url += `?scan_type=${scanType}`;
                }
                const response = await this.apiClient.get(url);
                return response.data._embedded?.scans || [];
            } catch (error) {
                throw new Error(`Failed to fetch scan results: ${this.getErrorMessage(error)}`);
            }
        };

        const result = await veracodeClient.getScanResults("2d8925b2-ce45-431a-8c0e-e94dd4376750");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

inspectScanResponse();
