// Migration Test Script
// This script helps test the migration functionality for existing users

import { migrateFavorites, getCollections } from './api.js';

export const testMigration = async () => {
  console.log('🧪 Testing favorites migration...');
  
  try {
    // First, check current collections
    console.log('📊 Checking current collections...');
    const currentCollections = await getCollections();
    console.log('Current collections:', currentCollections);
    
    // Check if user already has favorites collection
    const hasFavorites = currentCollections.collections?.some(col => col.isFavorites);
    console.log('Has favorites collection:', hasFavorites);
    
    if (hasFavorites) {
      console.log('✅ User already has favorites collection - migration not needed');
      return {
        success: true,
        message: 'User already has favorites collection',
        migrated: false
      };
    }
    
    // Run migration
    console.log('🔄 Running migration...');
    const migrationResult = await migrateFavorites();
    console.log('Migration result:', migrationResult);
    
    // Verify migration by checking collections again
    console.log('🔍 Verifying migration...');
    const updatedCollections = await getCollections();
    const newFavorites = updatedCollections.collections?.find(col => col.isFavorites);
    
    if (newFavorites) {
      console.log('✅ Migration successful!');
      console.log('New favorites collection:', newFavorites);
      
      return {
        success: true,
        message: 'Migration completed successfully',
        migrated: true,
        recipeCount: newFavorites.recipeCount || 0,
        collectionId: newFavorites.id
      };
    } else {
      throw new Error('Migration failed - no favorites collection found after migration');
    }
    
  } catch (error) {
    console.error('❌ Migration test failed:', error);
    return {
      success: false,
      message: error.message,
      migrated: false
    };
  }
};

export default testMigration;

// Make it available globally in browser
if (typeof window !== 'undefined') {
  window.testMigration = testMigration;
}