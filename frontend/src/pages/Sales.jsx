import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Sale Modal
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [saleItems, setSaleItems] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, prodRes] = await Promise.all([
        api.get('/sales'),
        api.get('/products')
      ]);
      setSales(salesRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      setError('Failed to fetch sales history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNewSale = () => {
    setError('');
    setSuccessMsg('');
    setCustomerName('Walk-in Customer');
    setSaleItems([
      {
        product_id: products.length > 0 ? products[0].id : '',
        quantity: '1',
        unit_price: products.length > 0 ? products[0].selling_price.toString() : '0'
      }
    ]);
    setShowModal(true);
  };

  const handleAddItemRow = () => {
    setSaleItems([
      ...saleItems,
      {
        product_id: products.length > 0 ? products[0].id : '',
        quantity: '1',
        unit_price: products.length > 0 ? products[0].selling_price.toString() : '0'
      }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    setSaleItems(saleItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...saleItems];
    updated[index][field] = value;

    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(value, 10));
      if (prod) {
        updated[index].unit_price = prod.selling_price.toString();
      }
    }

    setSaleItems(updated);
  };

  const calculateGrandTotal = () => {
    return saleItems.reduce((acc, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unit_price) || 0;
      return acc + (q * p);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (saleItems.length === 0) {
      alert('Please add at least one product line item.');
      return;
    }

    try {
      const payload = {
        customer_name: customerName,
        items: saleItems.map(i => ({
          product_id: parseInt(i.product_id, 10),
          quantity: parseFloat(i.quantity),
          unit_price: parseFloat(i.unit_price)
        }))
      };

      const res = await api.post('/sales', payload);
      setSuccessMsg(`Sale #${res.data.id} recorded successfully! Total: ₹${res.data.total_amount.toFixed(2)}`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      const errDetail = err.response?.data?.detail;
      if (typeof errDetail === 'object' && errDetail.message) {
        setError(errDetail.message);
      } else {
        setError(errDetail || 'Failed to complete sale transaction.');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>💵 POS & Sales Register</h2>
          <p>Record customer sales and automatically deduct finished product inventory</p>
        </div>
        <button className="btn-primary" onClick={handleOpenNewSale}>
          + New Customer Sale
        </button>
      </div>

      {error && <div className="alert-box error">{error}</div>}
      {successMsg && <div className="alert-box success">{successMsg}</div>}

      {loading ? (
        <LoadingSpinner message="Loading sales history..." />
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Customer Name</th>
                <th>Total Amount</th>
                <th>Items Count</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td><strong>{s.customer_name || 'Walk-in Customer'}</strong></td>
                    <td><strong>₹{s.total_amount.toFixed(2)}</strong></td>
                    <td>{s.items?.length || 0} items</td>
                    <td>{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Sale Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>Record New Bakery Sale</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Walk-in / John Doe"
                />
              </div>

              <div className="recipe-items-builder">
                <div className="space-between" style={{ marginBottom: '0.5rem' }}>
                  <h4>Sale Line Items</h4>
                  <button type="button" className="btn-secondary btn-sm" onClick={handleAddItemRow}>
                    + Add Product Item
                  </button>
                </div>

                {saleItems.map((item, idx) => (
                  <div key={idx} className="recipe-builder-row">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.selling_price.toFixed(2)} | Stock: {p.quantity})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                    />

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price (₹)"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      required
                    />

                    {saleItems.length > 1 && (
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

              <div className="sale-grand-total">
                <span>Grand Total:</span>
                <span className="total-amount">₹{calculateGrandTotal().toFixed(2)}</span>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Checkout Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
