const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Middleware to verify Firebase Auth tokens
const verifyAuthToken = async (req, res, next) => {
  try {
    console.log('🔍 COLLECTIONS DEBUG - Request received:');
    console.log('- admin.apps.length:', admin.apps.length);
    console.log('- Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization token provided');
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log('🔑 Token extracted, length:', token ? token.length : 0);
    
    // In development mode, accept mock tokens or any token
    if (process.env.NODE_ENV === 'development' || !admin.apps.length || token === 'mock-token') {
      console.log('🔧 Development mode: Using mock authentication');
      req.userId = 'mock-user-id';
      req.user = { uid: 'mock-user-id', email: 'test@example.com' };
      return next();
    }
    
    // Always verify Firebase tokens - no development bypass
    if (!admin.apps.length) {
      console.warn('❌ Firebase not initialized - admin.apps.length =', admin.apps.length);
      console.warn('❌ This means Firebase Admin SDK is not properly initialized');
      return res.status(503).json({ error: 'Service unavailable - Firebase not configured' });
    }
    
    console.log('✅ Firebase Admin SDK is initialized, proceeding with token verification...');
    
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

// 1. Get All Collections for User
router.get('/', verifyAuthToken, async (req, res) => {
  try {
    // Simplified query without ordering to avoid Firestore index requirements in development
    const collectionsSnapshot = await db.collection('collections')
      .where('userId', '==', req.userId)
      .get();

    const collections = collectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by updatedAt descending on the client side to avoid Firestore index requirements
    collections.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

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

    // Verify ownership
    const collectionDoc = await db.collection('collections').doc(id).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collectionData = collectionDoc.data();
    if (collectionData.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to collection' });
    }

    // Prevent editing of default collections (like Favorites)
    if (collectionData.isDefault) {
      return res.status(400).json({ error: 'Default collections cannot be edited' });
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

    // Verify ownership
    const collectionDoc = await db.collection('collections').doc(id).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collectionData = collectionDoc.data();
    if (collectionData.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to collection' });
    }

    // Prevent deletion of default collections (like Favorites)
    if (collectionData.isDefault) {
      return res.status(400).json({ error: 'Default collections cannot be deleted' });
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
    console.log('🍳 [BACKEND] Add recipe to collection request received');
    console.log('🍳 [BACKEND] Collection ID:', req.params.id);
    console.log('🍳 [BACKEND] Request body:', req.body);
    console.log('🍳 [BACKEND] User ID:', req.userId);
    
    const { id } = req.params;
    const { recipeId, recipeData } = req.body;

    if (!recipeId) {
      console.error('❌ [BACKEND] No recipe ID provided');
      return res.status(400).json({ error: 'Recipe ID is required' });
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
    console.log('📋 [BACKEND] Current recipes in collection:', currentRecipes.length);
    const recipeExists = currentRecipes.some(recipe => recipe.id === recipeId);

    if (recipeExists) {
      console.log('⚠️ [BACKEND] Recipe already exists in collection');
      return res.status(400).json({ error: 'Recipe already exists in this collection' });
    }

    // Add recipe to collection
    const newRecipe = {
      id: recipeId,
      addedAt: new Date().toISOString(),
      ...(recipeData && { data: recipeData })
    };

    console.log('➕ [BACKEND] Adding new recipe:', newRecipe);

    const updatedRecipes = [...currentRecipes, newRecipe];
    console.log('📈 [BACKEND] Updated recipes count:', updatedRecipes.length);
    
    await db.collection('collections').doc(id).update({
      recipes: updatedRecipes,
      recipeCount: updatedRecipes.length,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ [BACKEND] Successfully updated collection in database');
    res.status(200).json({ 
      message: 'Recipe added to collection successfully',
      recipeCount: updatedRecipes.length
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error adding recipe to collection:', error);
    console.error('❌ [BACKEND] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: error.message });
  }
});

// 6. Remove Recipe from Collection
router.delete('/:id/recipes/:recipeId', verifyAuthToken, async (req, res) => {
  try {
    const { id, recipeId } = req.params;

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

// 7. Get User's Favorites Collection
router.get('/favorites', verifyAuthToken, async (req, res) => {
  try {
    // Find the user's default "My Favorites" collection
    const favoritesSnapshot = await db.collection('collections')
      .where('userId', '==', req.userId)
      .where('isDefault', '==', true)
      .limit(1)
      .get();

    if (favoritesSnapshot.empty) {
      return res.status(404).json({ error: 'Favorites collection not found' });
    }

    const favoritesDoc = favoritesSnapshot.docs[0];
    const favoritesData = favoritesDoc.data();
    
    res.status(200).json({ 
      collection: {
        id: favoritesDoc.id,
        name: favoritesData.name,
        description: favoritesData.description,
        color: favoritesData.color,
        icon: favoritesData.icon,
        isDefault: true
      },
      recipes: favoritesData.recipes || [],
      recipeCount: favoritesData.recipeCount || 0
    });
  } catch (error) {
    console.error('Error fetching favorites collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Get Recipes in Collection (with full recipe details)
router.get('/:id/recipes', verifyAuthToken, async (req, res) => {
  try {
    const { id } = req.params;

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
        icon: collectionData.icon,
        isDefault: collectionData.isDefault || false
      },
      recipes
    });
  } catch (error) {
    console.error('Error fetching collection recipes:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Migration endpoint for existing users - migrate old favorites to collections
router.post('/migrate-favorites', verifyAuthToken, async (req, res) => {
  try {
    console.log('🔄 [MIGRATION] Starting favorites migration for user:', req.userId);
    
    // Check if user already has a favorites collection (new system)
    const existingFavorites = await db.collection('collections')
      .where('userId', '==', req.userId)
      .where('isDefault', '==', true)
      .limit(1)
      .get();
    
    if (!existingFavorites.empty) {
      console.log('✅ [MIGRATION] User already has favorites collection, skipping migration');
      return res.status(200).json({ 
        message: 'Favorites collection already exists, migration not needed',
        migrated: false,
        existingFavorites: true
      });
    }
    
    // Check for old favorites (if any exist)
    const oldFavoritesRef = db.collection('favorites').doc(req.userId);
    const oldFavoritesDoc = await oldFavoritesRef.get();
    
    let oldFavorites = [];
    if (oldFavoritesDoc.exists) {
      const oldData = oldFavoritesDoc.data();
      oldFavorites = oldData.recipes || [];
      console.log(`📚 [MIGRATION] Found ${oldFavorites.length} old favorites to migrate`);
    } else {
      console.log('📚 [MIGRATION] No old favorites found, creating empty favorites collection');
    }
    
    // Create the new favorites collection
    const favoritesCollection = {
      name: 'My Favorites',
      description: 'Your favorite recipes, all in one place',
      color: '#FF6B6B',
      icon: 'heart',
      userId: req.userId,
      recipes: oldFavorites,
      recipeCount: oldFavorites.length,
      isDefault: true,
      isFavorites: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('collections').add(favoritesCollection);
    console.log(`✅ [MIGRATION] Created favorites collection with ${oldFavorites.length} recipes`);
    
    // Optionally clean up old favorites (uncomment if you want to remove the old data)
    // try {
    //   await oldFavoritesRef.delete();
    //   console.log('🗑️ [MIGRATION] Cleaned up old favorites collection');
    // } catch (cleanupError) {
    //   console.warn('⚠️ [MIGRATION] Failed to clean up old favorites:', cleanupError);
    // }
    
    res.status(200).json({ 
      message: 'Favorites migration completed successfully',
      migrated: true,
      recipeCount: oldFavorites.length,
      favoritesCollectionId: docRef.id
    });
  } catch (error) {
    console.error('❌ [MIGRATION] Error during favorites migration:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;