import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductTable from '../components/ProductTable';
import LoadingSpinner from '../components/LoadingSpinner';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    selling_price: '',
    cost_price: '',
    quantity: '0',
    minimum_stock: '5',
    is_available: true
  });

  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER']);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params: selectedCategory ? { category_id: selectedCategory } : {} }),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      setError('Failed to fetch products or categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      description: '',
      selling_price: '',
      cost_price: '',
      quantity: '0',
      minimum_stock: '5',
      is_available: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      description: product.description || '',
      selling_price: product.selling_price,
      cost_price: product.cost_price,
      quantity: product.quantity,
      minimum_stock: product.minimum_stock,
      is_available: product.is_available
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete product.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id, 10),
        selling_price: parseFloat(formData.selling_price),
        cost_price: parseFloat(formData.cost_price),
        quantity: parseFloat(formData.quantity),
        minimum_stock: parseFloat(formData.minimum_stock)
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving product');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>🍰 Product Catalog</h2>
          <p>Manage finished bakery products and stock levels</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={handleOpenAdd}>
            + Add New Product
          </button>
        )}
      </div>

      {error && <div className="alert-box error">{error}</div>}

      {/* Filter bar */}
      <div className="filter-bar">
        <label>Filter by Category: </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="select-input"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading products..." />
      ) : (
        <ProductTable
          products={products}
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
              <h3>{editingId ? 'Edit Product' : 'Add New Bakery Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Current Stock Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Minimum Stock Threshold</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
