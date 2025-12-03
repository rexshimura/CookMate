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
    
    // In development mode, accept mock tokens or any token
    if (process.env.NODE_ENV === 'development' || !admin.apps.length) {
      req.userId = 'mock-user-id';
      req.user = { uid: 'mock-user-id', email: 'test@example.com' };
      return next();
    }
    
    // For real Firebase authentication
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth token verification failed:', error);
    
    // In development mode, allow the request to proceed
    if (process.env.NODE_ENV === 'development') {
      req.userId = 'mock-user-id';
      req.user = { uid: 'mock-user-id', email: 'test@example.com' };
      return next();
    }
    
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

// 3. Add to Favorites
router.post('/favorites/:recipeId', verifyAuthToken, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { recipeData } = req.body; // Optional full recipe data

    const favoriteRecipe = {
      id: recipeId,
      addedAt: new Date().toISOString(),
      ...(recipeData && { data: recipeData })
    };

    // Get current user document
    const userDoc = await db.collection('users').doc(req.userId).get();
    const currentFavorites = userDoc.data()?.favorites || [];
    
    // Check if recipe already exists
    const recipeExists = currentFavorites.some(fav => fav.id === recipeId);
    
    if (recipeExists) {
      return res.status(400).json({ error: 'Recipe already exists in favorites' });
    }

    // Add new favorite recipe with full data
    const updatedFavorites = [...currentFavorites, favoriteRecipe];
    
    await db.collection('users').doc(req.userId).update({
      favorites: updatedFavorites
    });

    res.status(200).json({ 
      message: 'Recipe added to favorites successfully',
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Remove from Favorites
router.delete('/favorites/:recipeId', verifyAuthToken, async (req, res) => {
  try {
    const { recipeId } = req.params;

    // Get current user document
    const userDoc = await db.collection('users').doc(req.userId).get();
    const currentFavorites = userDoc.data()?.favorites || [];
    
    // Remove recipe by ID (handle both old string format and new object format)
    const updatedFavorites = currentFavorites.filter(fav => 
      (typeof fav === 'string' && fav !== recipeId) || 
      (typeof fav === 'object' && fav.id !== recipeId)
    );
    
    await db.collection('users').doc(req.userId).update({
      favorites: updatedFavorites
    });

    res.status(200).json({ 
      message: 'Recipe removed from favorites successfully',
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get All Favorite Recipes (Full Details)
router.get('/favorites', verifyAuthToken, async (req, res) => {
  try {
    // Get user doc to find favorites
    const userDoc = await db.collection('users').doc(req.userId).get();
    const favorites = userDoc.data()?.favorites || [];

    console.log('Favorites for user:', req.userId, 'Count:', favorites.length);

    if (favorites.length === 0) {
      return res.status(200).json({ favorites: [], success: true });
    }

    // Return favorites with full data if available, or generate from ID
    const processedFavorites = favorites.map(fav => {
      // Handle both old string format and new object format for backward compatibility
      if (typeof fav === 'string') {
        return {
          id: fav,
          title: fav.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        };
      } else if (typeof fav === 'object' && fav.data) {
        // New format with full recipe data
        return {
          ...fav.data,
          id: fav.id,
          savedId: fav.id
        };
      } else {
        // Object format without data (fallback)
        return fav;
      }
    });

    console.log('Returning favorites:', processedFavorites);

    res.status(200).json({ 
      favorites: processedFavorites,
      success: true 
    });
  } catch (error) {
    console.error('Favorites error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;