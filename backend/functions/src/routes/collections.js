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

// 1. Get All Collections for User
router.get('/', verifyAuthToken, async (req, res) => {
  try {
    // Check if we're in mock mode by testing if admin.apps is empty
    const isMockMode = !admin.apps || admin.apps.length === 0;
    
    if (isMockMode) {
      console.log('Mock mode: returning mock collections data');
      return res.status(200).json({ 
        collections: [
          {
            id: 'mock-collection-1',
            name: 'My Fried Recipes',
            description: 'Crispy and delicious fried dishes',
            color: '#FF6B6B',
            icon: 'folder',
            userId: req.userId,
            recipes: [],
            recipeCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'mock-collection-2',
            name: 'Quick Dinners',
            description: '30-minute meals for busy weekdays',
            color: '#4ECDC4',
            icon: 'folder',
            userId: req.userId,
            recipes: [],
            recipeCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      });
    }

    const collectionsSnapshot = await db.collection('collections')
      .where('userId', '==', req.userId)
      .orderBy('updatedAt', 'desc')
      .get();

    const collections = collectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Create New Collection
router.post('/', verifyAuthToken, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const newCollection = {
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#FF6B6B', // Default color
      icon: icon || 'folder', // Default icon
      userId: req.userId,
      recipes: [], // Array of recipe IDs
      recipeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In development mode, return mock response
    if (process.env.NODE_ENV === 'development' || !admin.apps.length) {
      console.log('Development mode: returning mock collection creation response');
      const mockId = `mock-collection-${Date.now()}`;
      return res.status(201).json({ 
        message: 'Collection created successfully', 
        collection: { id: mockId, ...newCollection }
      });
    }

    const docRef = await db.collection('collections').add(newCollection);
    
    res.status(201).json({ 
      message: 'Collection created successfully', 
      collection: { id: docRef.id, ...newCollection }
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Update Collection
router.put('/:id', verifyAuthToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    // In development mode, return mock response
    if (process.env.NODE_ENV === 'development' || !admin.apps.length) {
      console.log('Development mode: returning mock collection update response');
      return res.status(200).json({ 
        message: 'Collection updated successfully',
        collection: { 
          id, 
          name: name || 'Mock Collection',
          description: description || '',
          color: color || '#FF6B6B',
          icon: icon || 'folder',
          updatedAt: new Date().toISOString()
        }
      });
    }

    // Verify ownership
    const collectionDoc = await db.collection('collections').doc(id).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collectionData = collectionDoc.data();
    if (collectionData.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to collection' });
    }

    const updates = {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(color && { color }),
      ...(icon && { icon }),
      updatedAt: new Date().toISOString()
    };

    await db.collection('collections').doc(id).update(updates);
    
    res.status(200).json({ 
      message: 'Collection updated successfully',
      collection: { id, ...collectionData, ...updates }
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Delete Collection
router.delete('/:id', verifyAuthToken, async (req, res) => {
  try {
    const { id } = req.params;

    // In development mode, return mock response
    if (process.env.NODE_ENV === 'development' || !admin.apps.length) {
      console.log('Development mode: returning mock collection delete response');
      return res.status(200).json({ message: 'Collection deleted successfully' });
    }

    // Verify ownership
    const collectionDoc = await db.collection('collections').doc(id).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collectionData = collectionDoc.data();
    if (collectionData.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to collection' });
    }

    await db.collection('collections').doc(id).delete();
    
    res.status(200).json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Add Recipe to Collection
router.post('/:id/recipes', verifyAuthToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { recipeId, recipeData } = req.body;

    if (!recipeId) {
      return res.status(400).json({ error: 'Recipe ID is required' });
    }

    // In development mode, return mock response
    if (process.env.NODE_ENV === 'development' || !admin.apps.length) {
      console.log('Development mode: returning mock add recipe to collection response');
      return res.status(200).json({ 
        message: 'Recipe added to collection successfully',
        recipeCount: 1
      });
    }

    // Verify ownership
    const collectionDoc = await db.collection('collections').doc(id).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collectionData = collectionDoc.data();
    if (collectionData.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to collection' });
    }

    // Check if recipe already exists in collection
    const currentRecipes = collectionData.recipes || [];
    const recipeExists = currentRecipes.some(recipe => recipe.id === recipeId);

    if (recipeExists) {
      return res.status(400).json({ error: 'Recipe already exists in this collection' });
    }

    // Add recipe to collection
    const newRecipe = {
      id: recipeId,
      addedAt: new Date().toISOString(),
      ...(recipeData && { data: recipeData })
    };

    const updatedRecipes = [...currentRecipes, newRecipe];
    
    await db.collection('collections').doc(id).update({
      recipes: updatedRecipes,
      recipeCount: updatedRecipes.length,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ 
      message: 'Recipe added to collection successfully',
      recipeCount: updatedRecipes.length
    });
  } catch (error) {
    console.error('Error adding recipe to collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Remove Recipe from Collection
router.delete('/:id/recipes/:recipeId', verifyAuthToken, async (req, res) => {
  try {
    const { id, recipeId } = req.params;

    // In development mode, return mock response
    if (process.env.NODE_ENV === 'development' || !admin.apps.length) {
      console.log('Development mode: returning mock remove recipe from collection response');
      return res.status(200).json({ 
        message: 'Recipe removed from collection successfully',
        recipeCount: 0
      });
    }

    // Verify ownership
    const collectionDoc = await db.collection('collections').doc(id).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collectionData = collectionDoc.data();
    if (collectionData.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to collection' });
    }

    // Remove recipe from collection
    const currentRecipes = collectionData.recipes || [];
    const updatedRecipes = currentRecipes.filter(recipe => recipe.id !== recipeId);
    
    await db.collection('collections').doc(id).update({
      recipes: updatedRecipes,
      recipeCount: updatedRecipes.length,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ 
      message: 'Recipe removed from collection successfully',
      recipeCount: updatedRecipes.length
    });
  } catch (error) {
    console.error('Error removing recipe from collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Get Recipes in Collection (with full recipe details)
router.get('/:id/recipes', verifyAuthToken, async (req, res) => {
  try {
    const { id } = req.params;

    // In development mode, return mock response
    if (process.env.NODE_ENV === 'development' || !admin.apps.length) {
      console.log('Development mode: returning mock collection recipes response');
      return res.status(200).json({ 
        collection: {
          id,
          name: 'Mock Collection',
          description: 'Collection description',
          color: '#FF6B6B',
          icon: 'folder'
        },
        recipes: []
      });
    }

    // Verify ownership
    const collectionDoc = await db.collection('collections').doc(id).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collectionData = collectionDoc.data();
    if (collectionData.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to collection' });
    }

    const recipes = collectionData.recipes || [];
    
    res.status(200).json({ 
      collection: {
        id,
        name: collectionData.name,
        description: collectionData.description,
        color: collectionData.color,
        icon: collectionData.icon
      },
      recipes
    });
  } catch (error) {
    console.error('Error fetching collection recipes:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;