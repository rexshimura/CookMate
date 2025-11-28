// Firebase configuration and initialization
const admin = require('firebase-admin');

let db;

const initializeFirebase = () => {
  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  
  // Initialize Firestore
  db = admin.firestore();
  
  return { admin, db };
};

// Initialize on module load
initializeFirebase();

module.exports = {
  admin,
  db,
  initializeFirebase
};