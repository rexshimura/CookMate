import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Folder, X, CheckCircle } from 'lucide-react';
import { 
  getCollections, 
  createCollection, 
  updateCollection, 
  deleteCollection 
} from '../../../utils/api.js';
import ConfirmationDialog from '../UI/ConfirmationDialog.jsx';

const CollectionManager = ({ onCollectionSelect, selectedCollectionId }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    isOpen: false,
    collectionId: null,
    collectionName: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#FF6B6B',
    icon: 'folder'
  });

  // Predefined colors and icons for collections
  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];

  const iconOptions = [
    'folder', 'heart', 'star', 'bookmark', 'tag', 'chef-hat', 'clock'
  ];

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

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#FF6B6B',
      icon: 'folder'
    });
  };

  // Create collection
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const result = await createCollection(formData);
      
      // Backend returns { message, collection } - check for collection field instead of success
      if (result && result.collection) {
        setCollections(prev => [result.collection, ...prev]);
        setShowCreateModal(false);
        resetForm();
        console.log('✅ Collection created successfully:', result.message);
      } else {
        console.error('❌ Unexpected response format:', result);
      }
    } catch (error) {
      console.error('❌ Failed to create collection:', error);
    }
  };

  // Update collection
  const handleUpdateCollection = async (e) => {
    e.preventDefault();
    if (!editingCollection || !formData.name.trim()) return;

    try {
      const result = await updateCollection(editingCollection.id, formData);
      
      // Backend returns { message, collection } - check for collection field
      if (result && result.collection) {
        setCollections(prev => prev.map(col => 
          col.id === editingCollection.id 
            ? { ...col, ...result.collection }
            : col
        ));
        setShowEditModal(false);
        setEditingCollection(null);
        resetForm();
        console.log('✅ Collection updated successfully:', result.message);
      } else {
        console.error('❌ Unexpected response format:', result);
      }
    } catch (error) {
      console.error('❌ Failed to update collection:', error);
    }
  };

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
        console.log('✅ Collection deleted successfully:', result.message);
      } else {
        console.error('❌ Unexpected response format:', result);
      }
    } catch (error) {
      console.error('❌ Failed to delete collection:', error);
      // Silent error handling
    } finally {
      setDeleteConfirmDialog({
        isOpen: false,
        collectionId: null,
        collectionName: ''
      });
    }
  };

  // Start editing
  const startEditing = (collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      color: collection.color,
      icon: collection.icon
    });
    setShowEditModal(true);
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
          onClick={() => setShowCreateModal(true)}
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

          {/* User collections */}
          {collections.map(collection => (
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(collection);
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => {
            setShowCreateModal(false);
            resetForm();
          }} />
          <div className="relative bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 backdrop-blur-xl max-w-md w-full p-6 transition-all duration-500 ease-out max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-800">Create New Collection</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-stone-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., My Fried Recipes"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-stone-400' : 'border-stone-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-all duration-200 font-medium hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="relative flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-semibold hover:scale-105 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      {showEditModal && editingCollection && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => {
            setShowEditModal(false);
            setEditingCollection(null);
            resetForm();
          }} />
          <div className="relative bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 backdrop-blur-xl max-w-md w-full p-6 transition-all duration-500 ease-out max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-800">Edit Collection</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCollection(null);
                  resetForm();
                }}
                className="p-1 hover:bg-stone-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCollection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-stone-400' : 'border-stone-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCollection(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-all duration-200 font-medium hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="relative flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-semibold hover:scale-105 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  Update
                </button>
              </div>
            </form>
          </div>
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