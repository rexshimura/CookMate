const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Middleware to verify Firebase Auth tokens
const verifyAuthToken = async (req, res, next) => {
  try {
    console.log(' COLLECTIONS DEBUG - Request received:');
    console.log('- admin.apps.length:', admin.apps.length);
    console.log('- Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(' No authorization token provided');
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log(' Token extracted, length:', token ? token.length : 0);
    
    // In development mode, accept mock tokens
    if (process.env.NODE_ENV === 'development' || token === 'mock-token') {
      console.log(' Development mode: Using mock authentication');
      req.userId = 'mock-user-id';
      req.user = { uid: 'mock-user-id', email: 'test@example.com' };
      return next();
    }
    
    // For production mode, verify Firebase tokens
    if (admin.apps.length === 0) {
      console.warn(' Firebase not initialized in production mode, using mock auth');
      req.userId = 'mock-user-id';
      req.user = { uid: 'mock-user-id', email: 'test@example.com' };
      return next();
    }
    
    console.log(' Firebase Admin SDK is initialized, proceeding with token verification...');
    
    // For real Firebase authentication
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.userId = decodedToken.uid;
      req.user = decodedToken;
      next();
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Helper to merge nested recipe data into the top level for consistent clients
const normalizeRecipeData = (recipe) => {
  if (!recipe || typeof recipe !== 'object') {
    return recipe;
  }

  if (recipe.data && typeof recipe.data === 'object') {
    const mergedRecipe = { ...recipe, ...recipe.data };
    delete mergedRecipe.data;
    return mergedRecipe;
  }

  return recipe;
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
    console.log(' [BACKEND] Add recipe to collection request received');
    console.log(' [BACKEND] Collection ID:', req.params.id);
    console.log(' [BACKEND] Request body:', req.body);
    console.log(' [BACKEND] User ID:', req.userId);
    
    const { id } = req.params;
    const { recipeId, recipeData } = req.body;

    if (!recipeId) {
      console.error(' [BACKEND] No recipe ID provided');
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
    console.log(' [BACKEND] Current recipes in collection:', currentRecipes.length);
    const recipeExists = currentRecipes.some(recipe => recipe.id === recipeId);

    if (recipeExists) {
      console.log(' [BACKEND] Recipe already exists in collection');
      
      // For favorites collection, return 200 OK (idempotent success) instead of 400
      // This prevents UI/DB desync when users click favorite multiple times
      if (collectionData.isFavorites || collectionData.isDefault) {
        console.log(' [BACKEND] Idempotent success for favorites collection');
        return res.status(200).json({ 
          message: 'Recipe already in favorites (idempotent success)',
          recipeCount: currentRecipes.length,
          idempotent: true
        });
      }
      
      // For other collections, still return 400 to maintain existing behavior
      return res.status(400).json({ error: 'Recipe already exists in this collection' });
    }

    // Add recipe to collection
    const flattenedRecipeData = (recipeData && typeof recipeData === 'object')
      ? { ...recipeData }
      : {};

    // Ensure we don't duplicate ID fields coming from the client payload
    delete flattenedRecipeData.id;

    const newRecipe = {
      id: recipeId,
      addedAt: new Date().toISOString(),
      ...flattenedRecipeData
    };

    console.log(' [BACKEND] Adding new recipe:', newRecipe);

    const updatedRecipes = [...currentRecipes, newRecipe];
    console.log(' [BACKEND] Updated recipes count:', updatedRecipes.length);
    
    await db.collection('collections').doc(id).update({
      recipes: updatedRecipes,
      recipeCount: updatedRecipes.length,
      updatedAt: new Date().toISOString()
    });

    console.log(' [BACKEND] Successfully updated collection in database');
    const normalizedRecipes = (updatedRecipes).map(normalizeRecipeData);

    res.status(200).json({ 
      message: 'Recipe added to collection successfully',
      recipeCount: updatedRecipes.length,
      recipe: normalizedRecipes[normalizedRecipes.length - 1]
    });
  } catch (error) {
    console.error(' [BACKEND] Error adding recipe to collection:', error);
    console.error(' [BACKEND] Error details:', {
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

    const normalizedRecipes = updatedRecipes.map(normalizeRecipeData);

    res.status(200).json({ 
      message: 'Recipe removed from collection successfully',
      recipeCount: updatedRecipes.length,
      recipes: normalizedRecipes
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

    console.log(' [FAVORITES DEBUG] Favorites collection query result:', favoritesSnapshot.size);

    if (favoritesSnapshot.empty) {
      console.log(' [FAVORITES DEBUG] No favorites collection found for user:', req.userId);
      console.log(' [FAVORITES DEBUG] Auto-creating favorites collection...');
      
      // Auto-create favorites collection if it doesn't exist
      try {
        const favoritesCollection = {
          name: 'My Favorites',
          description: 'Your favorite recipes, all in one place',
          color: '#FF6B6B',
          icon: 'heart',
          userId: req.userId,
          recipes: [],
          recipeCount: 0,
          isDefault: true,
          isFavorites: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const docRef = await db.collection('collections').add(favoritesCollection);
        console.log(' [FAVORITES DEBUG] Auto-created favorites collection with ID:', docRef.id);
        
        // Return the newly created collection
        return res.status(200).json({ 
          collection: {
            id: docRef.id,
            name: favoritesCollection.name,
            description: favoritesCollection.description,
            color: favoritesCollection.color,
            icon: favoritesCollection.icon,
            isDefault: true
          },
          recipes: [],
          recipeCount: 0,
          autoCreated: true
        });
      } catch (createError) {
        console.error(' [FAVORITES DEBUG] Failed to auto-create favorites collection:', createError);
        return res.status(500).json({ error: 'Failed to create favorites collection' });
      }
    }

    const favoritesDoc = favoritesSnapshot.docs[0];
    const favoritesData = favoritesDoc.data();
    
    const normalizedRecipes = (favoritesData.recipes || []).map(normalizeRecipeData);

    res.status(200).json({ 
      collection: {
        id: favoritesDoc.id,
        name: favoritesData.name,
        description: favoritesData.description,
        color: favoritesData.color,
        icon: favoritesData.icon,
        isDefault: true
      },
      recipes: normalizedRecipes,
      recipeCount: normalizedRecipes.length
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

    const recipes = (collectionData.recipes || []).map(normalizeRecipeData);
    
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