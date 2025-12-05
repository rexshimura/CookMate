// Favorites API
export const favoritesApi = {
  async get() {
    return await apiCall('/api/collections/favorites');
  },

  async add(recipeId, recipeData) {
    const favoritesResult = await this.get();
    if (favoritesResult.collection) {
      return await apiCall(`/api/collections/${favoritesResult.collection.id}/recipes`, {
        method: 'POST',
        body: JSON.stringify({ recipeId, recipeData }),
      });
    }
  },

  async remove(recipeId) {
    const favoritesResult = await this.get();
    if (favoritesResult.collection) {
      return await apiCall(`/api/collections/${favoritesResult.collection.id}/recipes/${recipeId}`, {
        method: 'DELETE',
      });
    }
  },
};

// Collections API
export const collectionsApi = {
  async getAll() {
    return await apiCall('/api/collections');
  },

  async create(collectionData) {
    return await apiCall('/api/collections', {
      method: 'POST',
      body: JSON.stringify(collectionData),
    });
  },

  async update(collectionId, collectionData) {
    return await apiCall(`/api/collections/${collectionId}`, {
      method: 'PUT',
      body: JSON.stringify(collectionData),
    });
  },

  async delete(collectionId) {
    return await apiCall(`/api/collections/${collectionId}`, {
      method: 'DELETE',
    });
  },

  async addRecipe(collectionId, recipe) {
    return await apiCall(`/api/collections/${collectionId}/recipes`, {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  },

  async removeRecipe(collectionId, recipeId) {
    return await apiCall(`/api/collections/${collectionId}/recipes/${recipeId}`, {
      method: 'DELETE',
    });
  },
};