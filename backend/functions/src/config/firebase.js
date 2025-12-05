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
    console.log('- admin.apps.length:', admin.apps.length);
    
    // Check if we have Firebase credentials for real Firebase
    if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
      console.log('✅ Attempting to initialize REAL Firebase with credentials...');
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
    } else {
      // ---------------------------------------------------------
      // MOCK FIRESTORE IMPLEMENTATION (Improved for Chaining)
      // ---------------------------------------------------------
      console.log('🔧 Development mode: Using mock Firebase data with Chaining Support');
      
      global.mockFirestoreData = global.mockFirestoreData || new Map();
      global.mockFirestoreUserData = global.mockFirestoreUserData || {
        'mock-user-id': { favorites: [] }
      };
      const mockData = global.mockFirestoreData;
      
      const mockCollection = (name) => {
        // 1. Document Operations (get, set, update, delete)
        const docOperations = (id) => ({
          get: () => {
            const docId = `${name}/${id}`;
            let exists = mockData.has(docId);
            
            // Auto-create mock user if missing
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
            if (name === 'users') global.mockFirestoreUserData[id] = data;
            return Promise.resolve();
          },
          update: (updates) => {
            const docId = `${name}/${id}`;
            const existing = mockData.get(docId) || {};
            const updated = { ...existing };
            
            // Basic Array Union/Remove Mock Logic
            for (const [key, value] of Object.entries(updates)) {
              if (value && value._type === 'arrayUnion') {
                const currentArray = updated[key] || [];
                if (!currentArray.includes(value.item)) updated[key] = [...currentArray, value.item];
              } else if (value && value._type === 'arrayRemove') {
                const currentArray = updated[key] || [];
                updated[key] = currentArray.filter(item => item !== value.item);
              } else {
                updated[key] = value;
              }
            }
            
            mockData.set(docId, updated);
            return Promise.resolve();
          },
          delete: () => {
            mockData.delete(`${name}/${id}`);
            return Promise.resolve();
          }
        });

        // 2. Query Builder Logic (Supports .where().where().get())
        const createQuery = (filters = [], limitVal = null) => {
          return {
            where: (field, operator, value) => createQuery([...filters, { field, operator, value }], limitVal),
            orderBy: () => createQuery(filters, limitVal), // Ignore sort in mock
            limit: (n) => createQuery(filters, n),
            get: () => {
              const results = [];
              for (const [key, docData] of mockData.entries()) {
                if (!key.startsWith(name + '/')) continue;
                
                let match = true;
                for (const filter of filters) {
                  const docValue = docData[filter.field];
                  if (filter.operator === '==' && docValue !== filter.value) match = false;
                  if (filter.operator === 'in' && Array.isArray(filter.value) && !filter.value.includes(docValue)) match = false;
                }
                
                if (match) {
                  results.push({
                    id: key.split('/')[1],
                    data: () => docData,
                    exists: true
                  });
                }
              }
              
              const finalResults = limitVal ? results.slice(0, limitVal) : results;
              
              return Promise.resolve({
                docs: finalResults,
                empty: finalResults.length === 0,
                size: finalResults.length,
                forEach: (fn) => finalResults.forEach(fn),
                map: (fn) => finalResults.map(fn)
              });
            }
          };
        };

        // 3. Return Collection Interface
        const rootQuery = createQuery();
        return {
          doc: (id) => docOperations(id),
          add: (data) => {
            const id = 'mock-' + Date.now() + Math.random().toString(36).substr(2, 9);
            mockData.set(`${name}/${id}`, data);
            return Promise.resolve({ id: id });
          },
          // Expose Query methods directly on the collection
          where: rootQuery.where,
          orderBy: rootQuery.orderBy,
          limit: rootQuery.limit,
          get: rootQuery.get
        };
      };
      
      db = { collection: mockCollection };
      
      // Mock FieldValue
      admin.firestore = {
        FieldValue: {
          arrayUnion: (item) => ({ _type: 'arrayUnion', item }),
          arrayRemove: (item) => ({ _type: 'arrayRemove', item })
        }
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

module.exports = { admin, db, initializeFirebase };