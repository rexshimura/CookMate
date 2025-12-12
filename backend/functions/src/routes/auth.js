const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase'); // Import db

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // 1. Create User in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // 2. Create User Document in Firestore
    // We use .doc(uid).set() to specify the ID exactly matching the Auth UID
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: displayName || '',
      createdAt: new Date().toISOString(),
      dietaryPreferences: '', // Initialize dietary preferences
      
      // Personalization fields
      nationality: req.body.nationality || '',
      age: req.body.age || null,
      gender: req.body.gender || '',
      allergies: Array.isArray(req.body.allergies) ? req.body.allergies :
                 typeof req.body.allergies === 'string' ? [req.body.allergies] : [],
      dislikedIngredients: Array.isArray(req.body.dislikedIngredients) ? req.body.dislikedIngredients :
                           typeof req.body.dislikedIngredients === 'string' ? [req.body.dislikedIngredients] : [],
      
      // Dietary preferences (boolean fields)
      isVegan: req.body.isVegan === true || req.body.isVegan === 'true',
      isDiet: req.body.isDiet === true || req.body.isOnDiet === true || req.body.isDiet === 'true' || req.body.isOnDiet === 'true',
      isMuslim: req.body.isMuslim === true || req.body.isMuslim === 'true',
      isDiabetic: req.body.isDiabetic === true || req.body.isDiabetic === 'true',
      isLactoseFree: req.body.isLactoseFree === true || req.body.isLactoseFree === 'true',
      isHighCalorie: req.body.isHighCalorie === true || req.body.isHighCalorie === 'true',
      
      // Taste preferences (boolean fields)
      prefersSalty: req.body.prefersSalty === true || req.body.prefersSalty === 'true',
      prefersSpicy: req.body.prefersSpicy === true || req.body.prefersSpicy === 'true',
      prefersSweet: req.body.prefersSweet === true || req.body.prefersSweet === 'true',
      prefersSour: req.body.prefersSour === true || req.body.prefersSour === 'true'
    });

    // 3. Create Default "My Favorites" Collection
    const defaultFavoritesCollection = {
      name: 'My Favorites',
      description: 'Your favorite recipes',
      color: '#FF69B4', // Pink color for favorites
      icon: 'heart', // Heart icon for favorites
      userId: userRecord.uid,
      recipes: [], // Empty array of recipe IDs
      recipeCount: 0,
      isDefault: true, // Mark as default collection (cannot be deleted)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('collections').add(defaultFavoritesCollection);

    res.status(201).json({ message: 'User registered successfully', uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ... login and logout routes (Login is usually handled on Frontend)

module.exports = router;