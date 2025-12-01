const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Middleware to verify Firebase Auth tokens
const verifyAuthToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// 1. Save a new chat session
router.post('/sessions', verifyAuthToken, async (req, res) => {
  try {
    const { title, messages } = req.body;
    
    const newSession = {
      userId: req.userId,
      title: title || 'New Chat',
      messages: messages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: messages ? messages.length : 0
    };

    const docRef = await db.collection('sessions').add(newSession);
    
    res.status(201).json({ 
      message: 'Session saved successfully', 
      sessionId: docRef.id,
      ...newSession
    });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// 2. Get all user sessions
router.get('/sessions', verifyAuthToken, async (req, res) => {
  try {
    const snapshot = await db.collection('sessions')
      .where('userId', '==', req.userId)
      .orderBy('updatedAt', 'desc')
      .get();
    
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// 3. Get a specific session
router.get('/sessions/:sessionId', verifyAuthToken, async (req, res) => {
  try {
    const doc = await db.collection('sessions').doc(req.params.sessionId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = { id: doc.id, ...doc.data() };
    
    // Check if user owns this session
    if (session.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// 4. Update a session (e.g., add new messages)
router.put('/sessions/:sessionId', verifyAuthToken, async (req, res) => {
  try {
    const { title, messages } = req.body;
    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) updates.title = title;
    if (messages !== undefined) {
      updates.messages = messages;
      updates.messageCount = messages.length;
    }

    const docRef = db.collection('sessions').doc(req.params.sessionId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = { id: doc.id, ...doc.data() };
    
    // Check if user owns this session
    if (session.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await docRef.update(updates);

    res.status(200).json({ 
      message: 'Session updated successfully',
      sessionId: req.params.sessionId,
      ...updates
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// 5. Delete a session
router.delete('/sessions/:sessionId', verifyAuthToken, async (req, res) => {
  try {
    const docRef = db.collection('sessions').doc(req.params.sessionId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = { id: doc.id, ...doc.data() };
    
    // Check if user owns this session
    if (session.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await docRef.delete();

    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;