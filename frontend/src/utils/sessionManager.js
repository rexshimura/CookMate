// Firestore utilities for session and message management
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Session Management
export const createSession = async (userId, title = 'New Cooking Session') => {
  try {
    const sessionId = generateSessionId();
    const sessionData = {
      id: sessionId,
      userId,
      title,
      lastMessage: 'Start by telling me what ingredients you have...',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
    };

    await addDoc(collection(db, 'sessions'), sessionData);
    return { success: true, session: sessionData };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
};

export const getUserSessions = async (userId, limitCount = 20) => {
  try {
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(sessionsQuery);
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, sessions };
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return { success: false, error: error.message };
  }
};

export const updateSession = async (sessionId, updates) => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating session:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSession = async (sessionId) => {
  try {
    // Soft delete by marking as inactive
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting session:', error);
    return { success: false, error: error.message };
  }
};

export const getSession = async (sessionId) => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (sessionSnap.exists()) {
      return { success: true, session: { id: sessionSnap.id, ...sessionSnap.data() } };
    } else {
      return { success: false, error: 'Session not found' };
    }
  } catch (error) {
    console.error('Error fetching session:', error);
    return { success: false, error: error.message };
  }
};

// Message Management
export const saveMessage = async (sessionId, message) => {
  try {
    const messageData = {
      ...message,
      sessionId,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'messages'), messageData);

    // Update session's last message and timestamp
    await updateSession(sessionId, {
      lastMessage: message.text.substring(0, 100) + (message.text.length > 100 ? '...' : ''),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving message:', error);
    return { success: false, error: error.message };
  }
};

export const getSessionMessages = async (sessionId, limitCount = 100) => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(messagesQuery);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, messages };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSessionMessages = async (sessionId) => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('sessionId', '==', sessionId)
    );

    const snapshot = await getDocs(messagesQuery);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    console.error('Error deleting messages:', error);
    return { success: false, error: error.message };
  }
};

// Generate session title from first message
export const generateSessionTitle = (firstMessage) => {
  const words = firstMessage.split(' ').slice(0, 4);
  return words.map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

export default {
  createSession,
  getUserSessions,
  updateSession,
  deleteSession,
  getSession,
  saveMessage,
  getSessionMessages,
  deleteSessionMessages,
  generateSessionTitle,
};