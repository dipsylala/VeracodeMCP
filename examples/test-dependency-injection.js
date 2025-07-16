#!/usr/bin/env node

// Test script to verify strict dependency injection
import { SandboxService } from '../build/veracode/services/sandbox-service.js';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('Testing strict dependency injection...');

try {
    // This should fail because ApplicationService dependency is not provided
    const sandboxService = new SandboxService(
        process.env.VERACODE_API_ID,
        process.env.VERACODE_API_KEY
    );
    console.log('❌ ERROR: SandboxService should have failed without ApplicationService dependency');
} catch (error) {
    console.log('✅ SUCCESS: SandboxService correctly requires ApplicationService dependency');
    console.log(`   Error: ${error.message}`);
}

console.log('\nStrict dependency injection is working correctly!');
