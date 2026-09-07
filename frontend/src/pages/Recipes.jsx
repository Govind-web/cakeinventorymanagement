import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form / Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [instructions, setInstructions] = useState('');
  const [recipeItems, setRecipeItems] = useState([]);
  const [editingRecipeId, setEditingRecipeId] = useState(null);

  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER']);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, prodRes, ingRes] = await Promise.all([
        api.get('/recipes'),
        api.get('/products'),
        api.get('/ingredients')
      ]);
      setRecipes(recRes.data);
      setProducts(prodRes.data);
      setIngredients(ingRes.data);
    } catch (err) {
      setError('Failed to load recipes data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingRecipeId(null);
    setSelectedProduct(products.length > 0 ? products[0].id : '');
    setInstructions('');
    setRecipeItems([
      { ingredient_id: ingredients.length > 0 ? ingredients[0].id : '', quantity_required: '1' }
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (recipe) => {
    setEditingRecipeId(recipe.id);
    setSelectedProduct(recipe.product_id);
    setInstructions(recipe.instructions || '');
    setRecipeItems(
      recipe.recipe_items.map((item) => ({
        ingredient_id: item.ingredient_id,
        quantity_required: item.quantity_required.toString()
      }))
    );
    setShowModal(true);
  };

  const handleAddItemRow = () => {
    setRecipeItems([
      ...recipeItems,
      { ingredient_id: ingredients.length > 0 ? ingredients[0].id : '', quantity_required: '1' }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    setRecipeItems(recipeItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...recipeItems];
    updated[index][field] = value;
    setRecipeItems(updated);
  };

  const handleDelete = async (recipeId) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await api.delete(`/recipes/${recipeId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete recipe');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (recipeItems.length === 0) {
      alert('Please add at least one ingredient to the recipe.');
      return;
    }

    try {
      const itemsPayload = recipeItems.map((i) => ({
        ingredient_id: parseInt(i.ingredient_id, 10),
        quantity_required: parseFloat(i.quantity_required)
      }));

      if (editingRecipeId) {
        await api.put(`/recipes/${editingRecipeId}`, {
          instructions,
          items: itemsPayload
        });
      } else {
        await api.post('/recipes', {
          product_id: parseInt(selectedProduct, 10),
          instructions,
          items: itemsPayload
        });
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving recipe');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>📖 Recipe Management</h2>
          <p>Define raw ingredient proportions required to produce 1 unit of product</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={handleOpenAdd}>
            + Create New Recipe
          </button>
        )}
      </div>

      {error && <div className="alert-box error">{error}</div>}

      {loading ? (
        <LoadingSpinner message="Loading recipes..." />
      ) : (
        <div className="recipe-grid">
          {recipes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', width: '100%' }}>
              <p>No recipes configured yet. Click <strong>+ Create New Recipe</strong> to build one.</p>
            </div>
          ) : (
            recipes.map((r) => (
              <div key={r.id} className="card recipe-card">
                <div className="card-header space-between">
                  <div>
                    <h3 style={{ margin: 0 }}>{r.product?.name || `Product #${r.product_id}`}</h3>
                    <small className="text-muted">Recipe #{r.id}</small>
                  </div>
                  {canManage && (
                    <div>
                      <button className="btn-action edit" onClick={() => handleOpenEdit(r)}>Edit</button>
                      <button className="btn-action delete" onClick={() => handleDelete(r.id)}>Delete</button>
                    </div>
                  )}
                </div>

                <div className="card-body">
                  {r.instructions && (
                    <p className="recipe-instructions">
                      <strong>Instructions:</strong> {r.instructions}
                    </p>
                  )}

                  <h4>Required Ingredients (per unit):</h4>
                  <ul className="recipe-items-list">
                    {r.recipe_items?.map((item) => (
                      <li key={item.id}>
                        <span className="ing-name">🌾 {item.ingredient?.name || `Ingredient #${item.ingredient_id}`}</span>
                        <span className="ing-qty">
                          <strong>{item.quantity_required}</strong> {item.ingredient?.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add / Edit Recipe Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>{editingRecipeId ? 'Edit Recipe' : 'Configure Product Recipe'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Target Product *</label>
                <select
                  disabled={!!editingRecipeId}
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Baking Instructions / Notes</label>
                <textarea
                  rows="2"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Mix dry ingredients first, bake at 180°C for 35 mins"
                />
              </div>

              <div className="recipe-items-builder">
                <div className="space-between" style={{ marginBottom: '0.5rem' }}>
                  <h4>Required Ingredients</h4>
                  <button type="button" className="btn-secondary btn-sm" onClick={handleAddItemRow}>
                    + Add Ingredient Line
                  </button>
                </div>

                {recipeItems.map((item, idx) => (
                  <div key={idx} className="recipe-builder-row">
                    <select
                      value={item.ingredient_id}
                      onChange={(e) => handleItemChange(idx, 'ingredient_id', e.target.value)}
                      required
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Qty required per unit"
                      value={item.quantity_required}
                      onChange={(e) => handleItemChange(idx, 'quantity_required', e.target.value)}
                      required
                    />

                    {recipeItems.length > 1 && (
                      <button
                        type="button"
                        className="btn-action delete"
                        onClick={() => handleRemoveItemRow(idx)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Recipe</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
