import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Production = () => {
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastProduction, setLastProduction] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, recRes] = await Promise.all([
        api.get('/products'),
        api.get('/recipes')
      ]);
      setProducts(prodRes.data);
      setRecipes(recRes.data);
      if (prodRes.data.length > 0) {
        setSelectedProductId(prodRes.data[0].id.toString());
      }
    } catch (err) {
      setError('Failed to load products or recipes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentProduct = products.find(p => p.id === parseInt(selectedProductId, 10));
  const currentRecipe = recipes.find(r => r.product_id === parseInt(selectedProductId, 10));

  const numQty = parseFloat(quantity) || 0;

  const handleProduce = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLastProduction(null);

    if (numQty <= 0) {
      setError('Production quantity must be greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/production', {
        product_id: parseInt(selectedProductId, 10),
        quantity: numQty
      });
      setSuccessMsg(res.data.message);
      setLastProduction(res.data);
      fetchData(); // Refresh product quantities
    } catch (err) {
      const errDetail = err.response?.data?.detail;
      if (typeof errDetail === 'object' && errDetail.message) {
        setError(errDetail.message);
      } else {
        setError(errDetail || 'Production failed. Check raw ingredient stock.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>🍳 Bakery Production</h2>
          <p>Bake fresh products using raw ingredient inventory</p>
        </div>
      </div>

      {error && <div className="alert-box error">{error}</div>}
      {successMsg && <div className="alert-box success">{successMsg}</div>}

      {loading ? (
        <LoadingSpinner message="Loading production system..." />
      ) : (
        <div className="production-layout">
          {/* Form Card */}
          <div className="card production-form-card">
            <div className="card-header">
              <h3>Start Production Batch</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleProduce}>
                <div className="form-group">
                  <label>Select Bakery Product *</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="select-input"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current Stock: {p.quantity} units)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Batch Quantity to Produce *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary produce-btn"
                  disabled={submitting || !currentRecipe}
                >
                  {submitting ? 'Processing Batch...' : '🍳 Start Production Batch'}
                </button>

                {!currentRecipe && (
                  <p className="text-warning" style={{ marginTop: '0.5rem' }}>
                    ⚠️ No recipe configured for this product. Go to <strong>Recipes</strong> page to set it up.
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Recipe Requirements Preview */}
          <div className="card production-preview-card">
            <div className="card-header">
              <h3>Required Raw Ingredients Preview</h3>
            </div>
            <div className="card-body">
              {!currentRecipe ? (
                <p>No recipe details available.</p>
              ) : (
                <div>
                  <p>
                    Target: <strong>{numQty} x {currentProduct?.name}</strong>
                  </p>

                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Ingredient</th>
                        <th>Required for Batch</th>
                        <th>Available Stock</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecipe.recipe_items?.map((item) => {
                        const needed = item.quantity_required * numQty;
                        const available = item.ingredient?.quantity || 0;
                        const hasEnough = available >= needed;
                        return (
                          <tr key={item.id}>
                            <td>{item.ingredient?.name}</td>
                            <td>
                              <strong>{needed}</strong> {item.ingredient?.unit}
                            </td>
                            <td>{available} {item.ingredient?.unit}</td>
                            <td>
                              <span className={`status-pill ${hasEnough ? 'available' : 'unavailable'}`}>
                                {hasEnough ? 'Sufficient' : 'Insufficient'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Last Production Output Summary */}
      {lastProduction && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3>🎉 Production Execution Details</h3>
          </div>
          <div className="card-body">
            <p><strong>Product:</strong> {lastProduction.product_name}</p>
            <p><strong>Produced:</strong> {lastProduction.produced_quantity} units</p>
            <p><strong>New Product Stock Level:</strong> {lastProduction.new_product_stock} units</p>
            <h4>Raw Materials Deducted from Inventory:</h4>
            <ul>
              {lastProduction.consumed_ingredients?.map((c, i) => (
                <li key={i}>
                  {c.ingredient_name}: <strong>-{c.quantity_consumed} {c.unit}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
