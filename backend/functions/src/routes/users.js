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

// 3. Update User Personalization Survey
router.put('/personalization', verifyAuthToken, async (req, res) => {
  try {
    console.log('Received personalization update:', req.body);
    
    const {
      nationality,
      age,
      gender,
      allergies,
      isVegan,
      isDiabetic,
      isDiet, // Changed from isOnDiet to match frontend
      isMuslim,
      isLactoseFree,
      isHighCalorie,
      prefersSalty,
      prefersSpicy,
      prefersSweet,
      prefersSour,
      dislikedIngredients
    } = req.body;

    // Validation
    const updates = {};

    if (nationality && typeof nationality === 'string' && nationality.trim().length > 0) {
      updates.nationality = nationality.trim();
    }

    if (age !== undefined) {
      const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;
      if (typeof ageNum === 'number' && ageNum > 0 && ageNum < 150) {
        updates.age = ageNum;
      }
    }

    if (gender && typeof gender === 'string' && gender.trim().length > 0) {
      updates.gender = gender.trim();
    }

    // Robust parsing for allergies array
    if (allergies !== undefined) {
      if (Array.isArray(allergies)) {
        updates.allergies = allergies.filter(item => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
      } else if (typeof allergies === 'string') {
        // Handle comma-separated string
        updates.allergies = allergies.split(',').map(item => item.trim()).filter(item => item.length > 0);
      } else {
        updates.allergies = [];
      }
    }

    // Robust parsing for booleans
    updates.isVegan = req.body.isVegan === true || req.body.isVegan === 'true';
    updates.isDiabetic = req.body.isDiabetic === true || req.body.isDiabetic === 'true';
    updates.isDiet = req.body.isDiet === true || req.body.isDiet === 'true';
    updates.isMuslim = req.body.isMuslim === true || req.body.isMuslim === 'true';
    updates.isLactoseFree = req.body.isLactoseFree === true || req.body.isLactoseFree === 'true';
    updates.isHighCalorie = req.body.isHighCalorie === true || req.body.isHighCalorie === 'true';
    updates.prefersSalty = req.body.prefersSalty === true || req.body.prefersSalty === 'true';
    updates.prefersSpicy = req.body.prefersSpicy === true || req.body.prefersSpicy === 'true';
    updates.prefersSweet = req.body.prefersSweet === true || req.body.prefersSweet === 'true';
    updates.prefersSour = req.body.prefersSour === true || req.body.prefersSour === 'true';

    // Robust parsing for dislikedIngredients array
    if (dislikedIngredients !== undefined) {
      if (Array.isArray(dislikedIngredients)) {
        updates.dislikedIngredients = dislikedIngredients.filter(item => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
      } else if (typeof dislikedIngredients === 'string') {
        // Handle comma-separated string
        updates.dislikedIngredients = dislikedIngredients.split(',').map(item => item.trim()).filter(item => item.length > 0);
      } else {
        updates.dislikedIngredients = [];
      }
    }

    // Update the user document
    await db.collection('users').doc(req.userId).update(updates);

    res.status(200).json({
      message: 'Personalization survey updated successfully',
      updatedFields: Object.keys(updates)
    });
  } catch (error) {
    console.error('Personalization update error:', error);
    res.status(400).json({ error: error.message });
  }
});

// 4. Get User Personalization Data
router.get('/personalization', verifyAuthToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Return only personalization fields
    const personalizationData = {
      nationality: userData.nationality || '',
      age: userData.age || null,
      gender: userData.gender || '',
      allergies: userData.allergies || [],
      isVegan: userData.isVegan || false,
      isDiabetic: userData.isDiabetic || false,
      isDiet: userData.isDiet || false, // Changed from isOnDiet to match frontend
      isMuslim: userData.isMuslim || false,
      isLactoseFree: userData.isLactoseFree || false,
      isHighCalorie: userData.isHighCalorie || false,
      prefersSalty: userData.prefersSalty || false,
      prefersSpicy: userData.prefersSpicy || false,
      prefersSweet: userData.prefersSweet || false,
      prefersSour: userData.prefersSour || false,
      dislikedIngredients: userData.dislikedIngredients || []
    };

    res.status(200).json({ personalization: personalizationData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy favorites endpoints were removed in favor of the unified collections API.
// Favorites are now handled in backend/functions/src/routes/collections.js via
// /api/collections/favorites and related collection recipe endpoints to keep a
// single source of truth that matches the frontend useFavorites hook.

module.exports = router;