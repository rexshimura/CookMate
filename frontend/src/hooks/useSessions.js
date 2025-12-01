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

  // Load user sessions
  const loadSessions = async () => {
    if (!user) {
      setSessions([]);
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
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setError(null);
      
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
    if (user) {
      loadSessions();
    } else {
      setSessions([]);
      setError(null);
    }
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

  // Load session messages
  const loadMessages = async (sessionIdToLoad = sessionId) => {
    if (!sessionIdToLoad || !user) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
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
    if (!sessionId || !user || !messageText.trim()) {
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

      // Save user message to database
      await saveMessage(sessionId, userMessage);

      // Get AI response
      const aiResponse = await chatWithAI(messageText, sessionId);
      
      if (aiResponse && aiResponse.response) {
        const aiMessage = {
          id: `ai_${Date.now()}`,
          text: aiResponse.response.message,
          isUser: false,
          timestamp: new Date()
        };

        // Add AI response to UI
        setMessages(prev => [...prev, aiMessage]);

        // Save AI message to database
        await saveMessage(sessionId, aiMessage);

        // Update session title if it's the first message
        if (messages.length === 0) {
          const sessionTitle = generateSessionTitle(messageText);
          await updateSession(sessionId, { title: sessionTitle });
        }

        return aiMessage;
      } else {
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
      await saveMessage(sessionId, errorMessage);
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
            timestamp: new Date()
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