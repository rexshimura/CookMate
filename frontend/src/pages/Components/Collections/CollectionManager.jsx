import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Folder, CheckCircle, Heart, Lock } from 'lucide-react';
import { getCollections, deleteCollection } from '../../../utils/api.js';
import ConfirmationDialog from '../UI/ConfirmationDialog.jsx';

const CollectionManager = ({ 
  onCollectionSelect, 
  selectedCollectionId,
  onCreateCollection,
  onEditCollection,
  onCollectionRefresh
}) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    isOpen: false,
    collectionId: null,
    collectionName: ''
  });



  // Load collections
  const loadCollections = async () => {
    setLoading(true);
    try {
      const result = await getCollections();
      
      // Backend returns { collections: [...] }
      if (result && result.collections) {
        setCollections(result.collections);
      } else {
        console.error('❌ Unexpected response format:', result);
        setCollections([]);
      }
    } catch (error) {
      console.error('❌ Failed to load collections:', error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  // Show delete confirmation
  const showDeleteConfirmation = (collection) => {
    setDeleteConfirmDialog({
      isOpen: true,
      collectionId: collection.id,
      collectionName: collection.name
    });
  };

  // Execute delete after confirmation
  const executeDelete = async () => {
    const { collectionId } = deleteConfirmDialog;
    if (!collectionId) return;

    try {
      const result = await deleteCollection(collectionId);
      
      // Backend returns { message } for successful deletion
      if (result && result.message) {
        setCollections(prev => prev.filter(col => col.id !== collectionId));
        // If the deleted collection was selected, clear selection
        if (selectedCollectionId === collectionId) {
          onCollectionSelect(null);
        }
        // Refresh collections data
        if (onCollectionRefresh) {
          onCollectionRefresh();
        }
      } else {
        console.error('Unexpected response format:', result);
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
      // Silent error handling
    } finally {
      setDeleteConfirmDialog({
        isOpen: false,
        collectionId: null,
        collectionName: ''
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl border border-stone-200/60 p-6 shadow-2xl shadow-stone-900/10 backdrop-blur-xl transition-all duration-500 ease-out">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-stone-200/70 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gradient-to-r from-stone-200/70 to-stone-100/70 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl border border-stone-200/60 p-6 shadow-2xl shadow-stone-900/10 backdrop-blur-xl transition-all duration-500 ease-out">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Folder className="w-5 h-5 text-orange-600" />
          My Collections
        </h3>
        <button
          onClick={onCreateCollection}
          className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 text-sm font-semibold overflow-hidden group hover:shadow-lg hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <Plus className="w-4 h-4 relative z-10" />
          New Collection
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-8">
          <Folder className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 mb-4">No collections yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Create your first collection
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* "All Collections" option */}
          <div
            onClick={() => onCollectionSelect(null)}
            className={`relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] group overflow-hidden ${
              selectedCollectionId === null 
                ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 shadow-md shadow-orange-200/30' 
                : 'border-stone-200 hover:border-stone-300 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
            }`}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#FF6B6B' }}
              >
                <Folder className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-stone-800">All Recipes</p>
                <p className="text-sm text-stone-500">View all saved recipes</p>
              </div>
            </div>
            {selectedCollectionId === null && (
              <CheckCircle className="w-5 h-5 text-orange-600" />
            )}
          </div>

          {/* Special "My Favorites" collection - always first */}
          {collections.find(col => col.isFavorites) && (
            <div
              onClick={() => onCollectionSelect(collections.find(col => col.isFavorites).id)}
              className={`relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] group overflow-hidden ${
                selectedCollectionId === collections.find(col => col.isFavorites).id
                  ? 'border-pink-300 bg-gradient-to-r from-pink-50 to-rose-50 shadow-md shadow-pink-200/30' 
                  : 'border-pink-200 hover:border-pink-300 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-100'
              }`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-200/50">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-stone-800 flex items-center gap-2">
                    My Favorites
                    <Lock className="w-3 h-3 text-stone-400" title="Default collection" />
                  </p>
                  <p className="text-sm text-stone-500">
                    {collections.find(col => col.isFavorites).recipeCount || 0} recipes • Quick access to loved recipes
                  </p>
                </div>
              </div>
              {selectedCollectionId === collections.find(col => col.isFavorites).id && (
                <CheckCircle className="w-5 h-5 text-pink-600" />
              )}
            </div>
          )}

          {/* User collections (excluding favorites which is shown above) */}
          {collections.filter(collection => !collection.isFavorites).map(collection => (
            <div
              key={collection.id}
              className={`relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:scale-[1.02] group overflow-hidden ${
                selectedCollectionId === collection.id 
                  ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 shadow-md shadow-orange-200/30' 
                  : 'border-stone-200 hover:border-stone-300 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
              }`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onCollectionSelect(collection.id)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: collection.color }}
                  >
                    <Folder className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">{collection.name}</p>
                    <p className="text-sm text-stone-500">
                      {collection.recipeCount || 0} recipes
                      {collection.description && ` • ${collection.description}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedCollectionId === collection.id && (
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                )}
                {/* Only show edit/delete buttons for non-favorites collections */}
                {!collection.isFavorites && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditCollection) {
                          onEditCollection(collection);
                        }
                      }}
                      className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110"
                      title="Edit collection"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteConfirmation(collection);
                      }}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                      title="Delete collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmDialog.isOpen}
        onClose={() => setDeleteConfirmDialog({
          isOpen: false,
          collectionId: null,
          collectionName: ''
        })}
        onConfirm={executeDelete}
        title="Delete Collection"
        message={`Are you sure you want to delete the collection "${deleteConfirmDialog.collectionName}"? This action cannot be undone and all recipes in this collection will be removed.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default CollectionManager;