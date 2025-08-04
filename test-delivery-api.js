#!/usr/bin/env node

/**
 * FoodFly Delivery API Test Script
 * 
 * This script helps test the delivery mechanism API endpoints
 * Run with: node test-delivery-api.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_DELIVERY_ID = `test_delivery_${Date.now()}`;
const TEST_ORDER_ID = `test_order_${Date.now()}`;

// Test data
const testLocation = {
  latitude: 28.6139,  // Delhi coordinates
  longitude: 77.2090,
  accuracy: 15,
  speed: 5.5,
  heading: 90,
  metadata: {
    batteryLevel: 85,
    networkType: '4g',
    deviceInfo: 'Test Device'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testEndpoint(name, testFn) {
  log(`\n${colors.bold}🧪 Testing: ${name}${colors.reset}`);
  try {
    const result = await testFn();
    if (result.success) {
      log(`✅ ${name}: PASSED`, 'green');
      if (result.data) {
        console.log('   Response:', JSON.stringify(result.data, null, 2));
      }
    } else {
      log(`❌ ${name}: FAILED`, 'red');
      console.log('   Error:', result.error);
    }
    return result.success;
  } catch (error) {
    log(`❌ ${name}: ERROR`, 'red');
    console.log('   Error:', error.message);
    return false;
  }
}

async function runTests() {
  log(`${colors.bold}🚚 FoodFly Delivery API Testing${colors.reset}`, 'blue');
  log(`Base URL: ${BASE_URL}`, 'yellow');
  log(`Test Delivery ID: ${TEST_DELIVERY_ID}`, 'yellow');
  log(`Test Order ID: ${TEST_ORDER_ID}`, 'yellow');

  const results = [];

  // Test 1: Health Check
  results.push(await testEndpoint('Health Check', async () => {
    const response = await makeRequest(`${BASE_URL}/health`);
    return {
      success: response.status === 200,
      data: response.data
    };
  }));

  // Test 2: Location Update (should fail without auth)
  results.push(await testEndpoint('Location Update (No Auth)', async () => {
    const response = await makeRequest(`${BASE_URL}/api/delivery/${TEST_DELIVERY_ID}/location`, {
      method: 'POST',
      body: testLocation
    });
    return {
      success: response.status === 401, // Should fail with 401
      data: response.data
    };
  }));

  // Test 3: Customer Tracking (should work without auth)
  results.push(await testEndpoint('Customer Tracking (No Auth)', async () => {
    const response = await makeRequest(`${BASE_URL}/api/delivery/customer-tracking/${TEST_ORDER_ID}`);
    return {
      success: response.status === 404, // Should return 404 for non-existent order
      data: response.data
    };
  }));

  // Test 4: Live Locations (should fail without auth)
  results.push(await testEndpoint('Live Locations (No Auth)', async () => {
    const response = await makeRequest(`${BASE_URL}/api/delivery/live-locations`);
    return {
      success: response.status === 401, // Should fail with 401
      data: response.data
    };
  }));

  // Test 5: Demo Delivery Page
  results.push(await testEndpoint('Demo Delivery Page', async () => {
    const response = await makeRequest(`${BASE_URL}/demo-delivery`);
    return {
      success: response.status === 200,
      data: { message: 'Page accessible' }
    };
  }));

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log(`\n${colors.bold}📊 Test Results:${colors.reset}`, 'blue');
  log(`Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('🎉 All tests passed! Your delivery API is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Check the errors above.', 'yellow');
  }

  log(`\n${colors.bold}📝 Next Steps:${colors.reset}`, 'blue');
  log('1. Test with authentication tokens', 'yellow');
  log('2. Test with real GPS location data', 'yellow');
  log('3. Test Google Maps integration', 'yellow');
  log('4. Test with actual MongoDB data', 'yellow');
}

// Run tests
runTests().catch(console.error); 