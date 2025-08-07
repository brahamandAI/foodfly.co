#!/usr/bin/env node

/**
 * Google OAuth Quick Fix Script
 * 
 * This script provides step-by-step instructions to fix Google OAuth 403 errors
 */

console.log('🔧 Google OAuth Quick Fix\n');

console.log('🚨 You are experiencing a 403 error because your domain is not authorized in Google Cloud Console.\n');

console.log('📋 Follow these steps to fix it:\n');

console.log('1️⃣  Go to Google Cloud Console:');
console.log('   https://console.cloud.google.com/\n');

console.log('2️⃣  Navigate to:');
console.log('   APIs & Services → Credentials\n');

console.log('3️⃣  Find your OAuth 2.0 Client ID:');
console.log('   216865863676-ed9c4cpkav3lrk0f4apoh00ngstdf6aj.apps.googleusercontent.com\n');

console.log('4️⃣  Click on it to edit\n');

console.log('5️⃣  In "Authorized JavaScript origins", add:');
console.log('   http://localhost:3003');
console.log('   http://127.0.0.1:3003\n');

console.log('6️⃣  In "Authorized redirect URIs", add:');
console.log('   http://localhost:3003');
console.log('   http://localhost:3003/');
console.log('   http://127.0.0.1:3003');
console.log('   http://127.0.0.1:3003/\n');

console.log('7️⃣  Click "Save"\n');

console.log('8️⃣  Wait 5-10 minutes for changes to propagate\n');

console.log('9️⃣  Clear your browser cache (Ctrl+Shift+Delete)\n');

console.log('🔟  Restart your development server:');
console.log('    npm run dev\n');

console.log('✅ After following these steps, Google OAuth should work!\n');

console.log('💡 If you still have issues:');
console.log('   - Check the browser console for specific errors');
console.log('   - Make sure you\'re using the correct Google Cloud project');
console.log('   - Verify that the OAuth consent screen is configured\n');

console.log('🆘 For detailed instructions, see: GOOGLE_OAUTH_SETUP.md\n');

// Check if we're in development
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
if (isDev) {
  console.log('🎯 Quick Test:');
  console.log('   - Open your app in the browser');
  console.log('   - Go to the login page');
  console.log('   - Try clicking the Google Sign-In button');
  console.log('   - If it loads without 403 errors, you\'re good!');
} else {
  console.log('⚠️  Note: Make sure to add your production domain to the authorized origins as well.');
} 