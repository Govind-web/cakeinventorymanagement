import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import IngredientTable from '../components/IngredientTable';
import LoadingSpinner from '../components/LoadingSpinner';

const Ingredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'KG',
    quantity: '0',
    minimum_quantity: '10',
    cost_per_unit: '0',
    supplier_id: ''
  });

  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER']);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ingRes, supRes] = await Promise.all([
        api.get('/ingredients'),
        api.get('/suppliers')
      ]);
      setIngredients(ingRes.data);
      setSuppliers(supRes.data);
    } catch (err) {
      setError('Failed to fetch raw ingredients or suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      unit: 'KG',
      quantity: '0',
      minimum_quantity: '10',
      cost_per_unit: '0',
      supplier_id: suppliers.length > 0 ? suppliers[0].id : ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ing) => {
    setEditingId(ing.id);
    setFormData({
      name: ing.name,
      unit: ing.unit,
      quantity: ing.quantity,
      minimum_quantity: ing.minimum_quantity,
      cost_per_unit: ing.cost_per_unit,
      supplier_id: ing.supplier_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this raw ingredient?')) return;
    try {
      await api.delete(`/ingredients/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete ingredient.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        minimum_quantity: parseFloat(formData.minimum_quantity),
        cost_per_unit: parseFloat(formData.cost_per_unit),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id, 10) : null
      };

      if (editingId) {
        await api.put(`/ingredients/${editingId}`, payload);
      } else {
        await api.post('/ingredients', payload);
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving ingredient');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>🌾 Raw Ingredients</h2>
          <p>Track stock levels, minimum thresholds and raw material costs</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={handleOpenAdd}>
            + Add New Ingredient
          </button>
        )}
      </div>

      {error && <div className="alert-box error">{error}</div>}

      {loading ? (
        <LoadingSpinner message="Loading raw ingredients..." />
      ) : (
        <IngredientTable
          ingredients={ingredients}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          canManage={canManage}
        />
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Edit Ingredient' : 'Add New Raw Ingredient'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Ingredient Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Measurement Unit *</label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="KG">KG (Kilograms)</option>
                    <option value="GRAM">GRAM (Grams)</option>
                    <option value="LITER">LITER (Liters)</option>
                    <option value="ML">ML (Milliliters)</option>
                    <option value="PIECE">PIECE (Pieces / Units)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Current Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Minimum Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimum_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Cost Per Unit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Primary Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  >
                    <option value="">None / Multiple</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Ingredient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;
