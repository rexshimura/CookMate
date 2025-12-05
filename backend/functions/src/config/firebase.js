// Firebase configuration and initialization
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

let db;

const initializeFirebase = () => {
  try {
    // 🔍 DEBUG: Log environment variables for debugging
    console.log('🔍 FIREBASE DEBUG - Environment Variables:');
    console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING');
    console.log('- admin.apps.length:', admin.apps.length);
    
    // Require Firebase credentials - no mock fallback allowed
    if (!process.env.FIREBASE_ADMIN_CREDENTIALS) {
      throw new Error('FIREBASE_ADMIN_CREDENTIALS environment variable is required. Please provide your Firebase service account credentials.');
    }

    console.log('✅ Initializing REAL Firebase with credentials...');
    if (!admin.apps.length) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        console.log('✅ Firebase Admin SDK initialized successfully');
      } catch (parseError) {
        console.error('❌ Failed to parse FIREBASE_ADMIN_CREDENTIALS:', parseError);
        throw new Error('Invalid FIREBASE_ADMIN_CREDENTIALS JSON format');
      }
    }
    db = admin.firestore();
    console.log('✅ Connected to real Firebase');

    return { admin, db };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// Initialize on module load
initializeFirebase();

module.exports = { admin, db, initializeFirebase };