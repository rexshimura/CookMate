// Firebase configuration and initialization
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

let db;

const initializeFirebase = () => {
  try {
    // Initialize Firebase Admin SDK with service account
    if (!admin.apps.length) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }

    // Initialize Firestore
    db = admin.firestore();

    return { admin, db };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Fallback to default initialization if service account is not available
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
    return { admin, db };
  }
};

// Initialize on module load
initializeFirebase();

module.exports = {
  admin,
  db,
  initializeFirebase
};