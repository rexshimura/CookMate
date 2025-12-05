import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CollectionFormModal = ({
  isOpen,
  onClose,
  mode, // 'create' or 'edit'
  collection, // for edit mode
  onSubmit,
  colors,
  icons
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#FF6B6B',
    icon: 'folder'
  });

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && collection) {
        setFormData({
          name: collection.name || '',
          description: collection.description || '',
          color: collection.color || '#FF6B6B',
          icon: collection.icon || 'folder'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          color: '#FF6B6B',
          icon: 'folder'
        });
      }
    }
  }, [isOpen, mode, collection]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
      <div className="relative bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 backdrop-blur-xl max-w-md w-full max-h-[90vh] overflow-hidden transition-all duration-500 ease-out">
        <div className="flex items-center justify-between mb-4 p-6 pb-0">
          <h3 className="text-lg font-semibold text-stone-800">
            {mode === 'edit' ? 'Edit Collection' : 'Create New Collection'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Collection Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={mode === 'edit' ? undefined : "e.g., My Fried Recipes"}
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
              {colors.map(color => (
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
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-all duration-200 font-medium hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="relative flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-semibold hover:scale-105 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {mode === 'edit' ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionFormModal;