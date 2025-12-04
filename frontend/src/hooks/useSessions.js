// Custom hooks for session management
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth.jsx';
import {
  createSession,
  getUserSessions,
  updateSession,
  deleteSession,
  getSession,
  saveMessage,
  getSessionMessages,
  generateSessionTitle
} from '../utils/sessionManager';
import { chatWithAI } from '../utils/api';

// Hook for managing user sessions
export const useSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Listen for global session updates
  useEffect(() => {
    const handleSessionUpdate = (event) => {
      const { sessionId, updates } = event.detail;
      
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId ? { ...session, ...updates } : session
        )
      );
    };

    window.addEventListener('sessionUpdated', handleSessionUpdate);
    
    return () => {
      window.removeEventListener('sessionUpdated', handleSessionUpdate);
    };
  }, []);

  // Load user sessions
  const loadSessions = async () => {
    if (!user) {
      // For anonymous users, check for existing local sessions array
      console.log('🍳 [useSessions] Loading anonymous sessions from localStorage...');
      const localSessions = localStorage.getItem('anonymous_sessions');
      if (localSessions) {
        try {
          const parsedSessions = JSON.parse(localSessions);
          console.log('🍳 [useSessions] Found anonymous sessions:', parsedSessions);
          setSessions(parsedSessions || []);
        } catch (error) {
          console.error('🍳 [useSessions] Error parsing anonymous sessions:', error);
          localStorage.removeItem('anonymous_sessions');
          setSessions([]);
        }
      } else {
        console.log('🍳 [useSessions] No anonymous sessions found in localStorage');
        setSessions([]);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await getUserSessions(user.uid);
      if (result.success) {
        setSessions(result.sessions);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new session
  const createNewSession = async (title) => {
    try {
      setError(null);
      
      if (!user) {
        // Create anonymous session
        console.log('🍳 [useSessions] Creating new anonymous session...');
        const anonymousSession = {
          id: `anon_${Date.now()}`,
          title: title || 'Anonymous Chat',
          lastMessage: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isAnonymous: true
        };
        
        // Get existing sessions array or create new one
        const existingSessions = localStorage.getItem('anonymous_sessions');
        const sessionsArray = existingSessions ? JSON.parse(existingSessions) : [];
        
        // Add new session to the beginning of the array
        const updatedSessions = [anonymousSession, ...sessionsArray];
        
        // Store in localStorage
        localStorage.setItem('anonymous_sessions', JSON.stringify(updatedSessions));
        console.log('🍳 [useSessions] Anonymous session created and saved:', anonymousSession);
        console.log('🍳 [useSessions] Total sessions now:', updatedSessions.length);
        
        // Update local state
        setSessions(updatedSessions);
        return anonymousSession;
      }
      
      const result = await createSession(user.uid, title);
      if (result.success) {
        // Add to local state
        setSessions(prev => [result.session, ...prev]);
        return result.session;
      } else {
        setError(result.error);
        return null;
      }
    } catch (error) {
      setError(error.message);
      return null;
    }
  };

  // Update session
  const updateExistingSession = async (sessionId, updates) => {
    try {
      setError(null);
      
      const result = await updateSession(sessionId, updates);
      if (result.success) {
        // Update local state
        setSessions(prev => 
          prev.map(session => 
            session.id === sessionId ? { ...session, ...updates } : session
          )
        );
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

  // Delete session
  const deleteExistingSession = async (sessionId) => {
    try {
      setError(null);
      
      // Handle anonymous sessions locally
      if (sessionId.startsWith('anon_')) {
        console.log('🍳 [useSessions] Deleting anonymous session:', sessionId);
        
        // Remove from localStorage
        const existingSessions = localStorage.getItem('anonymous_sessions');
        const sessionsArray = existingSessions ? JSON.parse(existingSessions) : [];
        const updatedSessions = sessionsArray.filter(session => session.id !== sessionId);
        localStorage.setItem('anonymous_sessions', JSON.stringify(updatedSessions));
        
        // Remove from local state
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        console.log('🍳 [useSessions] Anonymous session deleted. Remaining sessions:', updatedSessions.length);
        return true;
      }
      
      const result = await deleteSession(sessionId);
      if (result.success) {
        // Remove from local state
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

  // Load sessions when user changes
  useEffect(() => {
    // Always call loadSessions - it handles both authenticated and anonymous users
    loadSessions();
  }, [user]);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    createNewSession,
    updateExistingSession,
    deleteExistingSession,
    refreshSessions: loadSessions
  };
};

// Hook for managing current session messages
export const useSessionChat = (sessionId) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Get sessions update function from useSessions context
  // This is a bit of a hack to avoid circular dependencies
  const [sessionsState, setSessionsState] = useState({ sessions: [], updateSession: null });

  // Listen for session updates from useSessions hook
  useEffect(() => {
    // This effect will be triggered when session updates happen
    // We can't directly access useSessions here due to circular dependencies
    // So we'll rely on the global session manager update
  }, []);

  // Load session messages
  const loadMessages = async (sessionIdToLoad = sessionId) => {
    if (!sessionIdToLoad) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // For anonymous sessions, load from localStorage
      if (!user || sessionIdToLoad.startsWith('anon_')) {
        console.log('🍳 [useSessionChat] Loading anonymous messages for session:', sessionIdToLoad);
        const localMessages = localStorage.getItem(`messages_${sessionIdToLoad}`);
        if (localMessages) {
          try {
            const parsedMessages = JSON.parse(localMessages);
            console.log('🍳 [useSessionChat] Loaded', parsedMessages.length, 'messages for anonymous session');
            setMessages(parsedMessages);
          } catch (error) {
            console.error('🍳 [useSessionChat] Error parsing local messages:', error);
            localStorage.removeItem(`messages_${sessionIdToLoad}`);
            setMessages([]);
          }
        } else {
          console.log('🍳 [useSessionChat] No messages found for anonymous session');
          setMessages([]);
        }
        return;
      }
      
      const result = await getSessionMessages(sessionIdToLoad);
      if (result.success) {
        setMessages(result.messages);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Send message and get AI response
  const sendMessage = async (messageText) => {
    if (!sessionId || !messageText.trim()) {
      return;
    }

    try {
      setSending(true);
      setError(null);

      // Create user message
      const userMessage = {
        id: `temp_${Date.now()}`,
        text: messageText,
        isUser: true,
        timestamp: new Date()
      };

      // Add user message to UI immediately
      setMessages(prev => [...prev, userMessage]);

      // Save user message (localStorage for anonymous users)
      if (!user || sessionId.startsWith('anon_')) {
        const localMessages = localStorage.getItem(`messages_${sessionId}`);
        const messagesArray = localMessages ? JSON.parse(localMessages) : [];
        messagesArray.push(userMessage);
        localStorage.setItem(`messages_${sessionId}`, JSON.stringify(messagesArray));
      } else {
        await saveMessage(sessionId, userMessage);
      }

      // Prepare short conversation history for context (last 10 messages)
      const history = [...messages, userMessage].slice(-10).map(m => ({
        role: m.isUser ? 'user' : 'assistant',
        content: m.text
      }));

      // Get AI response with conversation history for better context
      console.log('🍳 [FRONTEND] Sending message to AI:', messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''));
      const aiResponse = await chatWithAI(messageText, sessionId, history);
      console.log('🍳 [FRONTEND] AI response received:', aiResponse);
      
      if (aiResponse && aiResponse.response) {
        const detectedRecipes = aiResponse.response.detectedRecipes || [];
        console.log('🍳 [FRONTEND] Processing AI response with', detectedRecipes.length, 'detected recipes:', detectedRecipes);
        
        const aiMessage = {
          id: `ai_${Date.now()}`,
          text: aiResponse.response.message,
          isUser: false,
          timestamp: new Date(),
          detectedRecipes: detectedRecipes
        };

        // Add AI response to UI
        setMessages(prev => {
          console.log('🍳 [FRONTEND] Adding message to chat with', detectedRecipes.length, 'recipes');
          return [...prev, aiMessage];
        });

        // Save AI message (localStorage for anonymous users)
        if (!user || sessionId.startsWith('anon_')) {
          const localMessages = localStorage.getItem(`messages_${sessionId}`);
          const messagesArray = localMessages ? JSON.parse(localMessages) : [];
          messagesArray.push(aiMessage);
          localStorage.setItem(`messages_${sessionId}`, JSON.stringify(messagesArray));
          
          // Update anonymous session with last message
          const localSession = localStorage.getItem('anonymous_session');
          if (localSession) {
            const session = JSON.parse(localSession);
            session.lastMessage = messageText.substring(0, 100) + (messageText.length > 100 ? '...' : '');
            session.updatedAt = new Date();
            localStorage.setItem('anonymous_session', JSON.stringify(session));
          }
        } else {
          await saveMessage(sessionId, aiMessage);

          // Update session title if it's the first message
          if (messages.length === 0) {
            const sessionTitle = generateSessionTitle(messageText);
            const updateResult = await updateSession(sessionId, { title: sessionTitle });
            
            // Also trigger a global event to update sessions list
            window.dispatchEvent(new CustomEvent('sessionUpdated', { 
              detail: { sessionId, updates: { title: sessionTitle } }
            }));
          }
        }

        return aiMessage;
      } else {
        console.error('🍳 [FRONTEND] No response from AI or malformed response:', aiResponse);
        throw new Error('No response from AI');
      }
    } catch (error) {
      setError(error.message);
      
      // Add error message to chat
      const errorMessage = {
        id: `error_${Date.now()}`,
        text: "I'm sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message
      if (!user || sessionId.startsWith('anon_')) {
        const localMessages = localStorage.getItem(`messages_${sessionId}`);
        const messagesArray = localMessages ? JSON.parse(localMessages) : [];
        messagesArray.push(errorMessage);
        localStorage.setItem(`messages_${sessionId}`, JSON.stringify(messagesArray));
      } else {
        await saveMessage(sessionId, errorMessage);
      }
    } finally {
      setSending(false);
    }
  };

  // Clear messages
  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  // Load messages when session changes
  useEffect(() => {
    if (sessionId) {
      loadMessages(sessionId);
    } else {
      clearMessages();
    }
  }, [sessionId, user]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    loadMessages,
    clearMessages,
    refreshMessages: () => loadMessages(sessionId)
  };
};

// Hook for creating new chat sessions with initial messages
export const useNewChat = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createNewChat = async (initialMessage = '') => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Create new session
      const sessionResult = await createSession(user.uid, 'New Cooking Session');
      if (!sessionResult.success) {
        setError(sessionResult.error);
        return null;
      }

      const session = sessionResult.session;

      // Add initial message if provided
      if (initialMessage.trim()) {
        const initialUserMessage = {
          id: `initial_${Date.now()}`,
          text: initialMessage,
          isUser: true,
          timestamp: new Date()
        };

        await saveMessage(session.id, initialUserMessage);

        // Get AI response
        const aiResponse = await chatWithAI(initialMessage, session.id);
        
        if (aiResponse && aiResponse.response) {
          const aiMessage = {
            id: `ai_initial_${Date.now()}`,
            text: aiResponse.response.message,
            isUser: false,
            timestamp: new Date(),
            detectedRecipes: aiResponse.response.detectedRecipes || []
          };

          await saveMessage(session.id, aiMessage);

          // Update session title
          const sessionTitle = generateSessionTitle(initialMessage);
          await updateSession(session.id, { 
            title: sessionTitle,
            lastMessage: initialMessage.substring(0, 100) + (initialMessage.length > 100 ? '...' : '')
          });
        }
      }

      return session;
    } catch (error) {
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createNewChat,
    loading,
    error
  };
};

export default {
  useSessions,
  useSessionChat,
  useNewChat
};