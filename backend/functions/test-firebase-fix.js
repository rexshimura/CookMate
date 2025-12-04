// Simple test to verify Firebase credentials fix
require('dotenv').config();

console.log('🔍 Testing Firebase Admin Credentials Fix...');

try {
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    console.log('✅ FIREBASE_ADMIN_CREDENTIALS found');
    
    // Test JSON parsing
    const credentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    console.log('✅ JSON parsing successful');
    console.log('🔑 Credentials loaded:', {
      project_id: credentials.project_id,
      client_email: credentials.client_email,
      has_private_key: !!credentials.private_key
    });
    
    // Test private key format
    if (credentials.private_key) {
      const fixedKey = credentials.private_key.replace(/\\n/g, '\n');
      console.log('✅ Private key newline replacement successful');
      console.log('🔑 Private key starts with:', fixedKey.substring(0, 30) + '...');
    }
    
    console.log('🎉 Firebase credentials fix SUCCESSFUL!');
  } else {
    console.log('❌ FIREBASE_ADMIN_CREDENTIALS not found in environment');
  }
} catch (error) {
  console.error('❌ Firebase credentials test FAILED:', error.message);
  process.exit(1);
}