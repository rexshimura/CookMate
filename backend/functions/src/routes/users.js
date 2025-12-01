const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Middleware mock (Replace with actual auth middleware later)
const getUserId = (req) => req.headers.userid || 'test_user_id'; 

// 1. Get User Profile
router.get('/profile', async (req, res) => {
  try {
    const userId = getUserId(req);
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user: userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Update User Profile
router.put('/profile', async (req, res) => {
  try {
    const userId = getUserId(req);
    const updates = req.body; // e.g. { displayName: "Chef John" }

    // .update() only changes the fields provided, leaves others alone
    await db.collection('users').doc(userId).update(updates);

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Add to Favorites
router.post('/favorites/:recipeId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { recipeId } = req.params;

    // arrayUnion adds the item only if it doesn't already exist (no duplicates)
    await db.collection('users').doc(userId).update({
      favorites: admin.firestore.FieldValue.arrayUnion(recipeId)
    });

    res.status(200).json({ message: 'Recipe added to favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Remove from Favorites
router.delete('/favorites/:recipeId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { recipeId } = req.params;

    // arrayRemove deletes the specific item from the array
    await db.collection('users').doc(userId).update({
      favorites: admin.firestore.FieldValue.arrayRemove(recipeId)
    });

    res.status(200).json({ message: 'Recipe removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get All Favorite Recipes (Full Details)
router.get('/favorites', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    // 1. Get user doc to find favorite IDs
    const userDoc = await db.collection('users').doc(userId).get();
    const favIds = userDoc.data()?.favorites || [];

    if (favIds.length === 0) {
      return res.status(200).json({ favorites: [] });
    }

    // 2. Fetch all recipes that match these IDs
    // 'in' query allows fetching up to 10/30 items at once
    const recipesSnapshot = await db.collection('recipes')
      .where(admin.firestore.FieldPath.documentId(), 'in', favIds)
      .get();

    const favorites = recipesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ favorites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;