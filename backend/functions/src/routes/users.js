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
    
    // For real Firebase authentication
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}; 

// 1. Get User Profile
router.get('/profile', verifyAuthToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user: userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Update User Profile
router.put('/profile', verifyAuthToken, async (req, res) => {
  try {
    const updates = req.body; // e.g. { displayName: "Chef John" }

    // .update() only changes the fields provided, leaves others alone
    await db.collection('users').doc(req.userId).update(updates);

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Legacy favorites endpoints were removed in favor of the unified collections API.
// Favorites are now handled in backend/functions/src/routes/collections.js via
// /api/collections/favorites and related collection recipe endpoints to keep a
// single source of truth that matches the frontend useFavorites hook.

module.exports = router;