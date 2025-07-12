#!/usr/bin/env node

import axios from "axios";
import * as crypto from "crypto";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

class DirectAPIClient {
    constructor(apiId, apiKey) {
        this.apiId = apiId;
        this.apiKey = apiKey;
        this.apiClient = axios.create({
            baseURL: "https://api.veracode.com/",
            timeout: 30000,
        });
        this.apiClient.interceptors.request.use((config) => {
            return this.addHMACAuthentication(config);
        });
    }

    getByteArray(hex) {
        const bytes = [];
        for (let i = 0; i < hex.length - 1; i += 2) {
            bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return Buffer.from(bytes);
    }

    bufferToHex(buffer) {
        return buffer.toString('hex');
    }

    hmac256(data, key) {
        const hmac = crypto.createHmac('sha256', key);
        hmac.update(data);
        return hmac.digest();
    }

    generateVeracodeAuthHeaderSync(url, method) {
        const verStr = "vcode_request_version_1";
        const data = `id=${this.apiId}&host=api.veracode.com&url=${url}&method=${method}`;
        const timestamp = Date.now().toString();
        const nonce = crypto.randomBytes(16).toString('hex');

        const keyBytes = this.getByteArray(this.apiKey);
        const hashedNonce = this.hmac256(this.getByteArray(nonce), keyBytes);
        const hashedTimestamp = this.hmac256(Buffer.from(timestamp, 'utf8'), hashedNonce);
        const hashedVerStr = this.hmac256(Buffer.from(verStr, 'utf8'), hashedTimestamp);
        const signature = this.bufferToHex(this.hmac256(Buffer.from(data, 'utf8'), hashedVerStr));

        return `VERACODE-HMAC-SHA-256 id=${this.apiId},ts=${timestamp},nonce=${nonce},sig=${signature}`;
    }

    addHMACAuthentication(config) {
        const method = config.method?.toUpperCase() || "GET";
        const url = config.url?.startsWith('/') ? config.url : `/${config.url || ''}`;

        const authHeader = this.generateVeracodeAuthHeaderSync(url, method);
        config.headers.set("Authorization", authHeader);
        return config;
    }

    async getApplicationDetails(appId) {
        try {
            const response = await this.apiClient.get(`appsec/v1/applications/${appId}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch application details: ${error.message}`);
        }
    }
}

async function checkRawResponse() {
    try {
        const client = new DirectAPIClient(
            process.env.VERACODE_API_ID,
            process.env.VERACODE_API_KEY
        );

        console.log("Raw application details response:");
        const result = await client.getApplicationDetails("2d8925b2-ce45-431a-8c0e-e94dd4376750");

        console.log("app_profile_url:", result.app_profile_url);
        console.log("results_url:", result.results_url);

        if (result.scans && result.scans.length > 0) {
            console.log("First scan scan_url:", result.scans[0].scan_url);
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkRawResponse();
