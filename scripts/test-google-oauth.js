#!/usr/bin/env node

/**
 * Google OAuth Test Script
 * 
 * This script helps test if Google OAuth is working after configuration changes
 */

console.log('🧪 Google OAuth Test Script\n');

console.log('📋 To test if your Google OAuth is working:\n');

console.log('1️⃣  Make sure you\'ve added these to Google Cloud Console:');
console.log('   Authorized JavaScript origins:');
console.log('   - http://localhost:3003');
console.log('   - http://127.0.0.1:3003');
console.log('   - https://foodfly.co');
console.log('   - http://localhost');
console.log('   - http://127.0.0.1\n');

console.log('2️⃣  Clear your browser cache completely:');
console.log('   - Press Ctrl+Shift+Delete');
console.log('   - Select "All time" and check all boxes');
console.log('   - Click "Clear data"\n');

console.log('3️⃣  Wait 10-15 minutes for Google changes to propagate\n');

console.log('4️⃣  Restart your development server:');
console.log('   npm run dev\n');

console.log('5️⃣  Test in browser:');
console.log('   - Open http://localhost:3003');
console.log('   - Go to login page');
console.log('   - Check browser console for errors');
console.log('   - Try clicking Google Sign-In button\n');

console.log('✅ If you still see 403 errors after 15 minutes:');
console.log('   - Double-check the exact URLs in Google Cloud Console');
console.log('   - Make sure there are no extra spaces or characters');
console.log('   - Try adding both http:// and https:// versions');
console.log('   - Verify you\'re editing the correct OAuth 2.0 Client ID\n');

console.log('🔍 Common issues:');
console.log('   - Forgetting to add http://localhost (without port)');
console.log('   - Adding https://localhost instead of http://localhost');
console.log('   - Not waiting long enough for changes to propagate');
console.log('   - Browser cache not cleared completely\n');

console.log('📞 If still not working after 15 minutes, check:');
console.log('   - Google Cloud Console project is correct');
console.log('   - OAuth consent screen is configured');
console.log('   - Billing is enabled on the project');
console.log('   - Google+ API is enabled (if required)\n');

console.log('🎯 Quick verification:');
console.log('   - The Google button should load without 403 errors');
console.log('   - No "origin is not allowed" errors in console');
console.log('   - Button should be clickable and functional'); 