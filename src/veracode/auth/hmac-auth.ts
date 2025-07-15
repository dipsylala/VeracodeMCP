// HMAC-SHA256 authentication for Veracode API

import * as crypto from 'crypto';
import { InternalAxiosRequestConfig } from 'axios';

export class VeracodeHMACAuth {
  private apiId: string;
  private apiKey: string;

  constructor(apiId: string, apiKey: string) {
    this.apiId = apiId;
    this.apiKey = apiKey;
  }

  // Convert hex string to byte array
  private getByteArray(hex: string): Buffer {
    const bytes = [];
    for (let i = 0; i < hex.length - 1; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return Buffer.from(bytes);
  }

  // Convert buffer to hex string
  private bufferToHex(buffer: Buffer): string {
    return buffer.toString('hex');
  }

  // HMAC-SHA256 function
  private hmac256(data: Buffer, key: Buffer): Buffer {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data);
    return hmac.digest();
  }

  // Generate Veracode authentication header using the correct multi-step HMAC process
  generateAuthHeader(url: string, method: string, apiHost: string): string {
    const verStr = 'vcode_request_version_1';
    const data = `id=${this.apiId}&host=${apiHost}&url=${url}&method=${method}`;
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    try {
      // Convert API key from hex to bytes
      const keyBytes = this.getByteArray(this.apiKey);

      // Step 1: HMAC the nonce with the key
      const hashedNonce = this.hmac256(this.getByteArray(nonce), keyBytes);

      // Step 2: HMAC the timestamp with the result from step 1
      const hashedTimestamp = this.hmac256(Buffer.from(timestamp, 'utf8'), hashedNonce);

      // Step 3: HMAC the version string with the result from step 2
      const hashedVerStr = this.hmac256(Buffer.from(verStr, 'utf8'), hashedTimestamp);

      // Step 4: HMAC the data with the result from step 3
      const signature = this.bufferToHex(this.hmac256(Buffer.from(data, 'utf8'), hashedVerStr));

      return `VERACODE-HMAC-SHA-256 id=${this.apiId},ts=${timestamp},nonce=${nonce},sig=${signature}`;
    } catch (error) {
      throw new Error(`Failed to generate auth header: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Add HMAC authentication headers to an Axios request config
  addAuthToConfig(config: InternalAxiosRequestConfig, baseURL: string): InternalAxiosRequestConfig {
    const method = config.method?.toUpperCase() || 'GET';
    // Ensure URL starts with / for the HMAC calculation
    const url = config.url?.startsWith('/') ? config.url : `/${config.url || ''}`;
    const apiHost = new URL(baseURL).hostname;

    try {
      const authHeader = this.generateAuthHeader(url, method, apiHost);
      config.headers.set('Authorization', authHeader);
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return config;
  }
}
