const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let db;

const initializeFirebase = () => {
  try {
    console.log('🔍 FIREBASE INIT: Starting...');
    
    if (!process.env.FIREBASE_ADMIN_CREDENTIALS) {
      throw new Error('MISSING VAR: FIREBASE_ADMIN_CREDENTIALS is not set.');
    }

    // Parse the JSON
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    } catch (e) {
      throw new Error('JSON PARSE ERROR: Could not parse FIREBASE_ADMIN_CREDENTIALS. Is it valid JSON?');
    }

    // 🔍 DEBUG: Print the KEYS only (not values) to check for project_id
    console.log('🔍 CREDENTIAL KEYS FOUND:', Object.keys(serviceAccount));

    if (!serviceAccount.project_id) {
       console.error('❌ CRITICAL: "project_id" is missing from the credentials object!');
    }

    // Fix private key formatting if needed
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log('✅ Firebase Admin Initialized');
    }

    db = admin.firestore();
    return { admin, db };
  } catch (error) {
    console.error('🚨 FIREBASE INIT ERROR:', error.message);
    throw error;
  }
};

initializeFirebase();
module.exports = { admin, db, initializeFirebase };