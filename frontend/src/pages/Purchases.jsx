import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([]);

  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER']);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purRes, supRes, ingRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/ingredients')
      ]);
      setPurchases(purRes.data);
      setSuppliers(supRes.data);
      setIngredients(ingRes.data);
    } catch (err) {
      setError('Failed to fetch purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedSupplier(suppliers.length > 0 ? suppliers[0].id : '');
    setPurchaseItems([
      {
        ingredient_id: ingredients.length > 0 ? ingredients[0].id : '',
        quantity: '10',
        unit_price: ingredients.length > 0 ? ingredients[0].cost_per_unit.toString() : '1'
      }
    ]);
    setShowModal(true);
  };

  const handleAddItemRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      {
        ingredient_id: ingredients.length > 0 ? ingredients[0].id : '',
        quantity: '10',
        unit_price: ingredients.length > 0 ? ingredients[0].cost_per_unit.toString() : '1'
      }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    setPurchaseItems(purchaseItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;

    // Auto update default cost if ingredient changes
    if (field === 'ingredient_id') {
      const ing = ingredients.find(i => i.id === parseInt(value, 10));
      if (ing) {
        updated[index].unit_price = ing.cost_per_unit.toString();
      }
    }

    setPurchaseItems(updated);
  };

  const handleMarkReceived = async (purchaseId) => {
    if (!window.confirm('Receive this purchase order? This will increase raw ingredient stock levels.')) return;
    try {
      await api.post(`/purchases/${purchaseId}/receive`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to receive purchase.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    try {
      const payload = {
        supplier_id: parseInt(selectedSupplier, 10),
        items: purchaseItems.map(item => ({
          ingredient_id: parseInt(item.ingredient_id, 10),
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      };

      await api.post('/purchases', payload);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating purchase order');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>🛒 Raw Ingredient Purchases</h2>
          <p>Create purchase orders and receive ingredient deliveries into stock</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={handleOpenAdd}>
            + Create Purchase Order
          </button>
        )}
      </div>

      {error && <div className="alert-box error">{error}</div>}

      {loading ? (
        <LoadingSpinner message="Loading purchase orders..." />
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Items Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No purchase orders recorded.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td><strong>{p.supplier?.name || `Supplier #${p.supplier_id}`}</strong></td>
                    <td><strong>${p.total_amount.toFixed(2)}</strong></td>
                    <td>
                      <span className={`status-pill ${p.status === 'RECEIVED' ? 'available' : 'warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>{p.items?.length || 0} items</td>
                    <td>
                      {p.status === 'PENDING' && canManage && (
                        <button className="btn-action edit" onClick={() => handleMarkReceived(p.id)}>
                          Receive Order
                        </button>
                      )}
                      {p.status === 'RECEIVED' && <small className="text-muted">Completed</small>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add PO Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>Create Purchase Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Supplier *</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="recipe-items-builder">
                <div className="space-between" style={{ marginBottom: '0.5rem' }}>
                  <h4>Raw Ingredients to Order</h4>
                  <button type="button" className="btn-secondary btn-sm" onClick={handleAddItemRow}>
                    + Add Line Item
                  </button>
                </div>

                {purchaseItems.map((item, idx) => (
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
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                    />

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost ($)"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      required
                    />

                    {purchaseItems.length > 1 && (
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
                <button type="submit" className="btn-primary">Create Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
