// Firebase configuration and initialization
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

let db;

const initializeFirebase = () => {
  try {
    // 🔍 DEBUG: Log all environment variables for debugging
    console.log('🔍 FIREBASE DEBUG - Environment Variables:');
    console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING');
    console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING');
    console.log('- FIREBASE_PRIVATE_KEY_ID:', process.env.FIREBASE_PRIVATE_KEY_ID ? 'SET' : 'MISSING');
    console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING');
    console.log('- FIREBASE_CLIENT_ID:', process.env.FIREBASE_CLIENT_ID ? 'SET' : 'MISSING');
    console.log('- FIREBASE_CLIENT_X509_CERT_URL:', process.env.FIREBASE_CLIENT_X509_CERT_URL ? 'SET' : 'MISSING');
    console.log('- admin.apps.length:', admin.apps.length);
    
    // Check if we have Firebase credentials for real Firebase
    if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
      console.log('✅ Attempting to initialize REAL Firebase with credentials...');
      // Initialize Firebase Admin SDK with service account
      if (!admin.apps.length) {
        let serviceAccount;
        
        try {
          // Parse the JSON credentials
          serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
          
          // Fix the private key format
          if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }
          
          console.log('🔑 Service Account loaded:', {
            project_id: serviceAccount.project_id,
            client_email: serviceAccount.client_email,
            has_private_key: !!serviceAccount.private_key
          });
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
          });
          
          console.log('✅ Firebase Admin SDK initialized successfully with service account');
        } catch (parseError) {
          console.error('❌ Failed to parse FIREBASE_ADMIN_CREDENTIALS:', parseError);
          throw new Error('Invalid FIREBASE_ADMIN_CREDENTIALS JSON format');
        }
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
        where: (field, operator, value) => {
          const results = [];
          for (const [key, docData] of mockData.entries()) {
            if (key.startsWith(name + '/')) {
              const docValue = docData[field];
              
              if (operator === '==' && docValue === value) {
                results.push({
                  data: () => docData,
                  id: key.split('/')[1]
                });
              } else if (operator === 'in' && Array.isArray(value) && value.includes(docValue)) {
                results.push({
                  data: () => docData,
                  id: key.split('/')[1]
                });
              }
            }
          }
          return Promise.resolve({
            docs: results,
            map: (fn) => results.map(fn),
            empty: results.length === 0,
            size: results.length,
            limit: (n) => {
              const limited = results.slice(0, n);
              return Promise.resolve({
                docs: limited,
                map: (fn) => limited.map(fn),
                empty: limited.length === 0,
                size: limited.length
              });
            }
          });
        },
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