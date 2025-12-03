// Firebase configuration and initialization
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

let db;

const initializeFirebase = () => {
  try {
    // Check if we have Firebase credentials for real Firebase
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
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
      console.log('✅ Connected to real Firebase');
    } else {
      // Development mode: Use mock Firebase
      console.log('🔧 Development mode: Using mock Firebase data');
      
      // Mock Firestore with persistent in-memory storage
      global.mockFirestoreData = global.mockFirestoreData || new Map();
      global.mockFirestoreUserData = global.mockFirestoreUserData || {
        'mock-user-id': { favorites: [] }
      };
      const mockData = global.mockFirestoreData;
      
      const mockCollection = (name) => ({
        doc: (id) => ({
          get: () => {
            const docId = `${name}/${id}`;
            let exists = mockData.has(docId);
            
            // For users collection, ensure the user document exists
            if (name === 'users' && !exists) {
              const userData = { favorites: [], ...global.mockFirestoreUserData[id] };
              mockData.set(docId, userData);
              exists = true;
            }
            
            return Promise.resolve({
              exists: exists,
              data: () => mockData.get(docId) || null,
              id: id
            });
          },
          set: (data) => {
            const docId = `${name}/${id}`;
            mockData.set(docId, data);
            
            // Also update global user data for users
            if (name === 'users') {
              global.mockFirestoreUserData[id] = data;
            }
            return Promise.resolve();
          },
          update: (updates) => {
            const docId = `${name}/${id}`;
            const existing = mockData.get(docId) || {};
            const updated = { ...existing };
            
            // Handle array operations
            for (const [key, value] of Object.entries(updates)) {
              if (value && value._type === 'arrayUnion') {
                // Handle arrayUnion
                const currentArray = updated[key] || [];
                if (!currentArray.includes(value.item)) {
                  updated[key] = [...currentArray, value.item];
                }
              } else if (value && value._type === 'arrayRemove') {
                // Handle arrayRemove
                const currentArray = updated[key] || [];
                updated[key] = currentArray.filter(item => item !== value.item);
              } else {
                updated[key] = value;
              }
            }
            
            mockData.set(docId, updated);
            
            // Also update global user data for users
            if (name === 'users') {
              global.mockFirestoreUserData[id] = updated;
            }
            return Promise.resolve();
          },
          delete: () => {
            const docId = `${name}/${id}`;
            mockData.delete(docId);
            if (name === 'users') {
              delete global.mockFirestoreUserData[id];
            }
            return Promise.resolve();
          }
        }),
        add: (data) => {
          const id = 'mock-' + Date.now();
          mockData.set(`${name}/${id}`, data);
          return Promise.resolve({ id: id });
        },
        where: () => ({
          in: (field, ids) => {
            const results = [];
            for (const [key, value] of mockData.entries()) {
              if (key.startsWith(name + '/') && ids.includes(value[field])) {
                results.push({
                  data: () => value,
                  id: key.split('/')[1]
                });
              }
            }
            return Promise.resolve({
              docs: results,
              map: (fn) => results.map(fn)
            });
          },
          get: () => Promise.resolve({ docs: [] })
        }),
        orderBy: () => ({
          get: () => Promise.resolve({ docs: [] })
        })
      });
      
      db = {
        collection: mockCollection
      };
      
      // Mock FieldValue for array operations
      admin.firestore = {
        FieldValue: {
          arrayUnion: (item) => ({ _type: 'arrayUnion', item }),
          arrayRemove: (item) => ({ _type: 'arrayRemove', item })
        }
      };
      
      // Custom handler for array operations in mock mode
      const processArrayFieldUpdate = (updates) => {
        const processed = {};
        for (const [key, value] of Object.entries(updates)) {
          if (value && value._type === 'arrayUnion') {
            // For arrayUnion, we'll handle this in the update operation
            processed[key] = { __arrayUnion: value.item };
          } else if (value && value._type === 'arrayRemove') {
            // For arrayRemove, we'll handle this in the update operation
            processed[key] = { __arrayRemove: value.item };
          } else {
            processed[key] = value;
          }
        }
        return processed;
      };
    }

    return { admin, db };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// Initialize on module load
initializeFirebase();

module.exports = {
  admin,
  db,
  initializeFirebase
};