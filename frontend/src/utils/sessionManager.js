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

// Transfer anonymous sessions to authenticated user
export const transferAnonymousSessions = async (userId) => {
  try {
    // Get anonymous sessions from localStorage
    const anonymousSessionsData = localStorage.getItem('anonymous_sessions');
    if (!anonymousSessionsData) {
      return { success: true, transferredCount: 0 };
    }

    const anonymousSessions = JSON.parse(anonymousSessionsData);
    if (!Array.isArray(anonymousSessions) || anonymousSessions.length === 0) {
      return { success: true, transferredCount: 0 };
    }

    let transferredCount = 0;
    const transferErrors = [];
    const successfullyTransferredSessions = [];

    // Process each anonymous session
    for (const anonymousSession of anonymousSessions) {
      try {
        // Validate session data
        if (!anonymousSession.id || typeof anonymousSession.id !== 'string') {
          throw new Error('Invalid session ID');
        }

        // Create new session for authenticated user
        const newSessionData = {
          id: generateSessionId(),
          userId: userId,
          title: anonymousSession.title || 'Transferred Chat',
          lastMessage: anonymousSession.lastMessage || '',
          createdAt: anonymousSession.createdAt || new Date(),
          updatedAt: new Date(), // Use current time for updatedAt
          isActive: true,
          isTransferred: true, // Flag to indicate this was transferred
          originalAnonymousId: anonymousSession.id
        };

        // Add the session to Firestore
        const docRef = await addDoc(collection(db, 'sessions'), {
          ...newSessionData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const firestoreSessionId = docRef.id;
        successfullyTransferredSessions.push({
          anonymousId: anonymousSession.id,
          firestoreId: firestoreSessionId
        });

        // Transfer messages for this session
        const anonymousMessagesKey = `messages_${anonymousSession.id}`;
        const anonymousMessagesData = localStorage.getItem(anonymousMessagesKey);
        
        if (anonymousMessagesData) {
          try {
            const anonymousMessages = JSON.parse(anonymousMessagesData);
            if (Array.isArray(anonymousMessages) && anonymousMessages.length > 0) {
              // Save each message to the new Firestore session
              for (const message of anonymousMessages) {
                try {
                  const messageData = {
                    ...message,
                    sessionId: firestoreSessionId,
                    createdAt: message.createdAt || new Date()
                  };
                  await addDoc(collection(db, 'messages'), {
                    ...messageData,
                    createdAt: serverTimestamp()
                  });
                } catch (messageError) {
                  console.warn('Failed to transfer individual message:', messageError);
                  // Continue with other messages even if one fails
                }
              }
            }
          } catch (messagesParseError) {
            console.warn('Failed to parse messages for session:', anonymousSession.id, messagesParseError);
            // Continue with other sessions even if messages parsing fails
          }
        }

        transferredCount++;
      } catch (sessionError) {
        console.error('Error transferring session:', anonymousSession.id, sessionError);
        transferErrors.push({
          sessionId: anonymousSession.id,
          error: sessionError.message
        });
      }
    }

    // Only clear localStorage if we successfully transferred at least some sessions
    if (transferredCount > 0) {
      try {
        // Only clear the sessions that were successfully transferred
        localStorage.removeItem('anonymous_sessions');
        
        // Clean up anonymous message data for successfully transferred sessions
        for (const successfulTransfer of successfullyTransferredSessions) {
          localStorage.removeItem(`messages_${successfulTransfer.anonymousId}`);
        }
      } catch (cleanupError) {
        console.warn('Failed to clean up localStorage after transfer:', cleanupError);
        // Don't fail the entire operation if cleanup fails
      }
    }

    return {
      success: true,
      transferredCount,
      errors: transferErrors,
      totalSessions: anonymousSessions.length,
      successRate: transferredCount / anonymousSessions.length
    };

  } catch (error) {
    console.error('Error in transferAnonymousSessions:', error);
    return { 
      success: false, 
      error: error.message, 
      transferredCount: 0,
      totalSessions: 0,
      successRate: 0
    };
  }
};

// Check if user has anonymous sessions that can be transferred
export const hasAnonymousSessions = () => {
  try {
    const anonymousSessionsData = localStorage.getItem('anonymous_sessions');
    if (!anonymousSessionsData) return false;

    const anonymousSessions = JSON.parse(anonymousSessionsData);
    return Array.isArray(anonymousSessions) && anonymousSessions.length > 0;
  } catch (error) {
    console.error('Error checking anonymous sessions:', error);
    return false;
  }
};

// Get count of anonymous sessions
export const getAnonymousSessionsCount = () => {
  try {
    const anonymousSessionsData = localStorage.getItem('anonymous_sessions');
    if (!anonymousSessionsData) return 0;

    const anonymousSessions = JSON.parse(anonymousSessionsData);
    return Array.isArray(anonymousSessions) ? anonymousSessions.length : 0;
  } catch (error) {
    console.error('Error getting anonymous sessions count:', error);
    return 0;
  }
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

    const docRef = await addDoc(collection(db, 'sessions'), sessionData);
    // Return the Firestore document ID, not the custom ID
    return { success: true, session: { ...sessionData, id: docRef.id } };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
};

export const getUserSessions = async (userId, limitCount = 20) => {
  try {
    // Try the compound query first
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
        ...doc.data(),
        id: doc.id  // Firestore doc ID must come AFTER spread to override custom id field
      }));

      return { success: true, sessions };
    } catch (indexError) {
      // Fallback to simpler query if index doesn't exist
      console.warn('Compound index not found, falling back to simpler query:', indexError);
      
      const simpleQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        limit(limitCount)
      );

      const snapshot = await getDocs(simpleQuery);
      let sessions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id  // Firestore doc ID must come AFTER spread to override custom id field
      }));

      // Filter for active sessions and sort client-side
      sessions = sessions
        .filter(session => session.isActive !== false)
        .sort((a, b) => {
          const dateA = a.updatedAt?.toDate?.() || new Date(a.updatedAt || 0);
          const dateB = b.updatedAt?.toDate?.() || new Date(b.updatedAt || 0);
          return dateB - dateA;
        })
        .slice(0, limitCount);

      return { success: true, sessions };
    }
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
      return { success: true, session: { ...sessionSnap.data(), id: sessionSnap.id } };
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
    // Try the compound query first
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
    } catch (indexError) {
      // Fallback to simpler query if index doesn't exist
      console.warn('Messages index not found, falling back to simpler query:', indexError);
      
      const simpleQuery = query(
        collection(db, 'messages'),
        where('sessionId', '==', sessionId),
        limit(limitCount)
      );

      const snapshot = await getDocs(simpleQuery);
      let messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort messages by creation time client-side
      messages = messages
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateA - dateB; // ascending order
        })
        .slice(0, limitCount);

      return { success: true, messages };
    }
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

// Clean up orphaned localStorage data (for anonymous users)
export const cleanupOrphanedData = () => {
  try {
    // Get all localStorage keys
    const allKeys = Object.keys(localStorage);
    
    // Find all messages keys
    const messageKeys = allKeys.filter(key => key.startsWith('messages_'));
    
    // Get current sessions to check against
    const currentSessionsKey = localStorage.getItem('anonymous_sessions');
    const currentSessions = currentSessionsKey ? JSON.parse(currentSessionsKey) : [];
    const sessionIds = new Set(currentSessions.map(session => session.id));
    
    // Remove orphaned message entries
    let removedCount = 0;
    messageKeys.forEach(key => {
      const sessionId = key.replace('messages_', '');
      if (!sessionIds.has(sessionId)) {
        localStorage.removeItem(key);
        removedCount++;
      }
    });
    
    return { success: true, removedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Generate session title from first message
export const generateSessionTitle = (firstMessage) => {
  if (!firstMessage || firstMessage.trim().length === 0) {
    return 'New Cooking Session';
  }

  const cleanedMessage = firstMessage.trim();
  
  // Common patterns to look for at the beginning of messages
  const patterns = [
    /^i want to (cook|make|prepare) (.+)/i,
    /^help me (cook|make|prepare) (.+)/i,
    /^how to (cook|make|prepare) (.+)/i,
    /^can you help me (.+)/i,
    /^i have (.+) and want to (.+)/i,
    /^recipe for (.+)/i,
    /^what can i make with (.+)/i,
    /^cooking (.+)/i,
    /^make (.+)/i,
    /^cook (.+)/i,
    /^(.+?) recipe/i
  ];

  // Try to match patterns for better titles
  for (const pattern of patterns) {
    const match = cleanedMessage.match(pattern);
    if (match) {
      const title = match[2] || match[1];
      return title.trim().length > 0 ? 
        title.charAt(0).toUpperCase() + title.slice(1).toLowerCase() : 
        'New Cooking Session';
    }
  }

  // If no pattern matches, take first meaningful words but clean them up
  const words = cleanedMessage.split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) return 'New Cooking Session';
  
  // Remove common starting words that don't make good titles
  const skipWords = ['i', 'me', 'my', 'to', 'the', 'a', 'an', 'and', 'or', 'but', 'so', 'want', 'need', 'have'];
  const meaningfulWords = words.filter(word => !skipWords.includes(word.toLowerCase()));
  
  if (meaningfulWords.length === 0) {
    return words.slice(0, 3).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ') || 'New Cooking Session';
  }

  // Take up to 4 meaningful words
  const titleWords = meaningfulWords.slice(0, 4);
  const title = titleWords.map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');

  // Ensure title isn't too long
  return title.length > 50 ? title.substring(0, 47) + '...' : title;
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
  cleanupOrphanedData,
  transferAnonymousSessions,
  hasAnonymousSessions,
  getAnonymousSessionsCount,
};