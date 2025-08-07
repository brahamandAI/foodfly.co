#!/usr/bin/env node

/**
 * Google OAuth Configuration Checker
 * 
 * This script helps verify your Google OAuth setup
 * Run with: node scripts/check-google-oauth.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Google OAuth Configuration Checker\n');

// Check for environment files
const envFiles = ['.env.local', '.env', '.env.example'];
let envFile = null;

for (const file of envFiles) {
  if (fs.existsSync(file)) {
    envFile = file;
    break;
  }
}

if (!envFile) {
  console.log('❌ No environment file found!');
  console.log('Create a .env.local file with your Google OAuth credentials.');
  process.exit(1);
}

console.log(`📁 Found environment file: ${envFile}`);

// Read environment file
const envContent = fs.readFileSync(envFile, 'utf8');
const lines = envContent.split('\n');

let hasGoogleClientId = false;
let hasGoogleClientSecret = false;
let googleClientId = '';

for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_GOOGLE_CLIENT_ID=')) {
    hasGoogleClientId = true;
    googleClientId = line.split('=')[1]?.trim();
  }
  if (line.startsWith('GOOGLE_CLIENT_SECRET=')) {
    hasGoogleClientSecret = true;
  }
}

console.log('\n📋 Configuration Status:');
console.log(`✅ Google Client ID: ${hasGoogleClientId ? 'Found' : '❌ Missing'}`);
console.log(`✅ Google Client Secret: ${hasGoogleClientSecret ? 'Found' : '❌ Missing'}`);

if (hasGoogleClientId && googleClientId) {
  console.log(`🔑 Client ID: ${googleClientId.substring(0, 20)}...`);
  
  // Basic validation
  if (googleClientId.includes('googleusercontent.com')) {
    console.log('✅ Client ID format looks correct');
  } else {
    console.log('⚠️  Client ID format may be incorrect');
  }
}

console.log('\n🔧 Next Steps:');

if (!hasGoogleClientId || !hasGoogleClientSecret) {
  console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Create or select your project');
  console.log('3. Go to APIs & Services → Credentials');
  console.log('4. Create an OAuth 2.0 Client ID');
  console.log('5. Add these Authorized JavaScript origins:');
  console.log('   - http://localhost:3003');
  console.log('   - https://your-domain.com (replace with your domain)');
  console.log('6. Copy the Client ID and Client Secret to your .env.local file');
}

console.log('\n📖 For detailed setup instructions, see: GOOGLE_OAUTH_SETUP.md');
console.log('\n🚀 After configuration, restart your development server:');
console.log('   npm run dev');

if (!hasGoogleClientId || !hasGoogleClientSecret) {
  console.log('\n❌ Configuration incomplete. Please follow the steps above.');
  process.exit(1);
} else {
  console.log('\n✅ Configuration looks good!');
  console.log('If you still have issues, check the browser console for specific errors.');
} 