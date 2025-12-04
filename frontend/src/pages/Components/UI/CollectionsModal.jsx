import React, { useEffect, useRef, useState } from 'react';
import { Folder, Plus, CheckCircle } from 'lucide-react';

const CollectionsModal = ({ 
  isOpen, 
  onClose, 
  collections, 
  recipe,
  user,
  requireAuth,
  onAddToCollection,
  onCreateCollection,
  triggerRef 
}) => {
  const modalRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate optimal position to prevent cutoff
      let top = triggerRect.bottom + 8; // 8px gap below trigger
      let left = triggerRect.left;
      
      // If near right edge, position to the left
      if (triggerRect.left + 300 > viewportWidth) { // 300px = modal width
        left = triggerRect.right - 300;
      }
      
      // If near left edge, ensure minimum left position
      if (left < 8) {
        left = 8;
      }
      
      // If bottom would be cut off, position above
      if (top + 200 > viewportHeight) { // Approximate modal height
        top = triggerRect.top - 200 - 8; // 8px gap above trigger
      }
      
      setPosition({ top, left });
    }
  }, [isOpen, triggerRef]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && 
          triggerRef?.current && !triggerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, triggerRef]);

  const handleAddToCollection = async (collectionId) => {
    await onAddToCollection(collectionId);
    onClose();
  };

  const handleCreateCollection = () => {
    onClose();
    if (onCreateCollection) {
      onCreateCollection();
    }
  };

  const checkIfRecipeInCollection = (collectionId) => {
    if (!recipe || typeof recipe === 'string') return false;
    const recipeId = recipe.savedId || recipe.title?.toLowerCase().replace(/[^a-z0-9]/g, '_') || recipe.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const collection = collections.find(col => col.id === collectionId);
    return collection?.recipes?.some(r => r.id === recipeId);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[54] bg-transparent" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="fixed z-[55] bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 backdrop-blur-xl transition-all duration-300"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: '300px',
          maxHeight: '280px'
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/60">
          <h4 className="font-semibold text-stone-800 text-sm tracking-wide">
            {collections.length > 0 ? 'Add to Collection' : 'Create Collection'}
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            {collections.length > 0 
              ? `${collections.length} collection${collections.length !== 1 ? 's' : ''} available`
              : 'No collections yet'
            }
          </p>
        </div>
        
        {/* Content */}
        <div className="max-h-40 overflow-y-auto p-2">
          {collections.length > 0 ? (
            // Show existing collections (Favorites first if present)
            [...collections]
              .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)) // Sort to put favorites first
              .map(collection => (
                <button
                  key={collection.id}
                  onClick={() => handleAddToCollection(collection.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 text-left hover:scale-[1.02] group rounded-xl"
                >
                  <div 
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: collection.color }}
                  >
                    {collection.isDefault ? (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <Folder className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 text-sm truncate">
                      {collection.name}
                      {collection.isDefault && <span className="ml-1 text-xs text-pink-500">♥</span>}
                    </p>
                    <p className="text-xs text-stone-500">
                      {collection.recipeCount || 0} recipes
                    </p>
                  </div>
                  {checkIfRecipeInCollection(collection.id) && (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </button>
              ))
          ) : (
            // Show create new collection option
            <button
              onClick={handleCreateCollection}
              className="w-full flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 text-left hover:scale-[1.02] group rounded-xl"
            >
              <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                <Plus className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-800 text-sm">
                  Create New Collection
                </p>
                <p className="text-xs text-stone-500">
                  Organize your recipes
                </p>
              </div>
            </button>
          )}
        </div>
        
        {/* Footer */}
        {collections.length > 0 && (
          <div className="p-3 border-t border-stone-200/60">
            <button
              onClick={handleCreateCollection}
              className="w-full flex items-center justify-center gap-2 p-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-all duration-300 font-medium"
            >
              <Plus className="w-4 h-4" />
              Create New Collection
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CollectionsModal;