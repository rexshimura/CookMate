const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET all recipes
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('recipes').orderBy('createdAt', 'desc').get();
    const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ recipes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE a new recipe
router.post('/', async (req, res) => {
  try {
    const { title, ingredients, instructions, userId, cookingTime, servings, difficulty } = req.body;
    
    // Create a clean recipe object
    const newRecipe = {
      title: title || "Untitled Recipe",
      ingredients: ingredients || [],
      instructions: instructions || [],
      userId: userId || 'anonymous',
      cookingTime: cookingTime || "Unknown",
      servings: servings || "Varies",
      difficulty: difficulty || "Medium",
      createdAt: new Date().toISOString(),
      likes: 0
    };

    // Save to Firestore
    const docRef = await db.collection('recipes').add(newRecipe);
    
    res.status(201).json({ 
      message: 'Recipe created successfully', 
      id: docRef.id, 
      ...newRecipe 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET a single recipe by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('recipes').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a recipe
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('recipes').doc(req.params.id).delete();
    res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;