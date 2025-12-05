// Test script to verify Firestore composite indexes are working
import { initializeApp } from 'firebase/app';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs 
} from 'firebase/firestore';

// Test Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "test",
  authDomain: "cookmate-cc941.firebaseapp.com",
  projectId: "cookmate-cc941",
  storageBucket: "cookmate-cc941.appspot.com",
  messagingSenderId: "436913801412",
  appId: "1:436913801412:web:test"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function testCompositeIndexes() {
  console.log('🧪 Testing composite indexes...');
  
  // Test 1: Sessions compound query (userId + isActive + updatedAt)
  try {
    console.log('📊 Testing sessions query...');
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('userId', '==', 'test-user-id'),
      where('isActive', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    console.log(`✅ Sessions query successful! Found ${sessionsSnapshot.size} documents`);
    
  } catch (error) {
    console.error('❌ Sessions query failed:', error.message);
    return false;
  }
  
  // Test 2: Messages compound query (sessionId + createdAt)
  try {
    console.log('💬 Testing messages query...');
    const messagesQuery = query(
      collection(db, 'messages'),
      where('sessionId', '==', 'test-session-id'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    console.log(`✅ Messages query successful! Found ${messagesSnapshot.size} documents`);
    
  } catch (error) {
    console.error('❌ Messages query failed:', error.message);
    return false;
  }
  
  console.log('🎉 All composite indexes working correctly!');
  return true;
}

// Export for use in other files
export { db };