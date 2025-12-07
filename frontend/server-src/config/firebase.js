const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let db;

const initializeFirebase = () => {
  try {
    if (!process.env.FIREBASE_ADMIN_CREDENTIALS) {
      throw new Error('FIREBASE_ADMIN_CREDENTIALS environment variable is required.');
    }

    console.log('🔍 Parsing Firebase Credentials...');
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    } catch (e) {
      throw new Error('Failed to parse FIREBASE_ADMIN_CREDENTIALS JSON. Check your Vercel env variable.');
    }

    // --- FIX: Robust Private Key Handling ---
    if (serviceAccount.private_key) {
      // 1. Replace literal "\n" characters with real newlines
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      
      // 2. Fix potential "quoted" keys (rare edge case)
      if (serviceAccount.private_key.startsWith('"') && serviceAccount.private_key.endsWith('"')) {
        serviceAccount.private_key = serviceAccount.private_key.slice(1, -1);
      }
    } else {
      console.error('❌ CRITICAL: "private_key" field is missing in the credentials JSON!');
    }
    // ----------------------------------------

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
    console.error('🚨 Firebase Initialization Error:', error.message);
    // Do not throw here, allow the app to start so we can see the logs
    return { admin: null, db: null };
  }
};

initializeFirebase();
module.exports = { admin, db, initializeFirebase };