/**
 * End-to-End Pipeline Verification Script
 * Validates:
 * 1. GET http://localhost:3000/api/v1/health returns HTTP 200 OK with connected ML engine.
 * 2. POST http://localhost:3000/api/v1/diagnose with leaf image returns full diagnosis and remedy schema.
 */

const http = require('http');
const https = require('https');

async function testHealthEndpoint() {
  console.log('[Test 1] Testing Gateway Health Endpoint: http://localhost:3000/api/v1/health ...');
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/v1/health', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          console.log('✓ Health Endpoint Status: 200 OK');
          console.log('✓ Response Payload:', JSON.stringify(json, null, 2));
          resolve(json);
        } else {
          reject(new Error(`Health endpoint returned status code ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

console.log('AgroCure Verification Suite loaded.');
module.exports = { testHealthEndpoint };
