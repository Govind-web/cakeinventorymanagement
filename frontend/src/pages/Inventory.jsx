import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, low_stock, out_stock, expiring, transactions
  const [inventoryData, setInventoryData] = useState(null);
  const [expiringData, setExpiringData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters for transactions
  const [txnFilterType, setTxnFilterType] = useState('');
  const [txnSearch, setTxnSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, expRes, txnRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/expiring-soon'),
        api.get('/inventory/transactions')
      ]);
      setInventoryData(invRes.data);
      setExpiringData(expRes.data);
      setTransactions(txnRes.data);
    } catch (err) {
      setError('Failed to fetch inventory reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = !txnFilterType || t.transaction_type === txnFilterType;
    const matchesSearch = !txnSearch || 
      t.item_type.toLowerCase().includes(txnSearch.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(txnSearch.toLowerCase())) ||
      (t.reference_id && t.reference_id.toLowerCase().includes(txnSearch.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>📦 Inventory Management & Audit Logs</h2>
          <p>Monitor stock levels, low-stock alerts and transaction audit history</p>
        </div>
        <button className="btn-secondary" onClick={fetchData}>Refresh Data</button>
      </div>

      {error && <div className="alert-box error">{error}</div>}

      {/* Tabs */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Stock Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'low_stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('low_stock')}
        >
          Low Stock ({inventoryData?.low_stock_products?.length + inventoryData?.low_stock_ingredients?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'out_stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('out_stock')}
        >
          Out of Stock ({inventoryData?.out_of_stock_products?.length + inventoryData?.out_of_stock_ingredients?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'expiring' ? 'active' : ''}`}
          onClick={() => setActiveTab('expiring')}
        >
          Expiring Soon
        </button>
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transaction History ({transactions.length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading inventory reports..." />
      ) : (
        <div className="tab-content" style={{ marginTop: '1.5rem' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="dashboard-grid-2">
              <div className="card">
                <div className="card-header">
                  <h3>🍰 Finished Products Stock</h3>
                </div>
                <div className="card-body">
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Stock</th>
                        <th>Min Stock</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData?.products?.map((p) => {
                        const isLow = p.quantity <= p.minimum_stock;
                        const isOut = p.quantity <= 0;
                        return (
                          <tr key={p.id}>
                            <td>{p.name}</td>
                            <td><strong>{p.quantity} units</strong></td>
                            <td>{p.minimum_stock}</td>
                            <td>
                              <span className={`status-pill ${isOut ? 'unavailable' : isLow ? 'warning' : 'available'}`}>
                                {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>🌾 Raw Ingredients Stock</h3>
                </div>
                <div className="card-body">
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Ingredient</th>
                        <th>Stock</th>
                        <th>Min Qty</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData?.ingredients?.map((ing) => {
                        const isLow = ing.quantity <= ing.minimum_quantity;
                        const isOut = ing.quantity <= 0;
                        return (
                          <tr key={ing.id}>
                            <td>{ing.name}</td>
                            <td><strong>{ing.quantity} {ing.unit}</strong></td>
                            <td>{ing.minimum_quantity} {ing.unit}</td>
                            <td>
                              <span className={`status-pill ${isOut ? 'unavailable' : isLow ? 'warning' : 'available'}`}>
                                {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOW STOCK */}
          {activeTab === 'low_stock' && (
            <div className="card">
              <div className="card-header">
                <h3>⚠️ Items Below Minimum Stock Level</h3>
              </div>
              <div className="card-body">
                <h4>Products:</h4>
                <ul>
                  {inventoryData?.low_stock_products?.length === 0 ? (
                    <li>No low stock products.</li>
                  ) : (
                    inventoryData?.low_stock_products?.map(p => (
                      <li key={p.id}>
                        {p.name}: Current <strong>{p.quantity}</strong> / Min <strong>{p.minimum_stock}</strong>
                      </li>
                    ))
                  )}
                </ul>
                <h4 style={{ marginTop: '1rem' }}>Raw Ingredients:</h4>
                <ul>
                  {inventoryData?.low_stock_ingredients?.length === 0 ? (
                    <li>No low stock raw ingredients.</li>
                  ) : (
                    inventoryData?.low_stock_ingredients?.map(ing => (
                      <li key={ing.id}>
                        {ing.name}: Current <strong>{ing.quantity} {ing.unit}</strong> / Min <strong>{ing.minimum_quantity} {ing.unit}</strong>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: OUT OF STOCK */}
          {activeTab === 'out_stock' && (
            <div className="card">
              <div className="card-header">
                <h3>🚫 Out of Stock Items</h3>
              </div>
              <div className="card-body">
                {inventoryData?.out_of_stock_products?.length === 0 && inventoryData?.out_of_stock_ingredients?.length === 0 ? (
                  <p>Great! No products or ingredients are currently out of stock.</p>
                ) : (
                  <div>
                    <h4>Products:</h4>
                    <ul>
                      {inventoryData?.out_of_stock_products?.map(p => (
                        <li key={p.id} style={{ color: 'red' }}>{p.name} (0 units)</li>
                      ))}
                    </ul>
                    <h4 style={{ marginTop: '1rem' }}>Ingredients:</h4>
                    <ul>
                      {inventoryData?.out_of_stock_ingredients?.map(ing => (
                        <li key={ing.id} style={{ color: 'red' }}>{ing.name} (0 {ing.unit})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXPIRING SOON */}
          {activeTab === 'expiring' && (
            <div className="card">
              <div className="card-header">
                <h3>⏰ Items Expiring Within 7 Days</h3>
              </div>
              <div className="card-body">
                <h4>Products:</h4>
                <ul>
                  {expiringData?.expiring_products?.length === 0 ? (
                    <li>No products expiring soon.</li>
                  ) : (
                    expiringData?.expiring_products?.map(p => (
                      <li key={p.id}>
                        {p.name} - Expiry: {new Date(p.expiry_date).toLocaleDateString()}
                      </li>
                    ))
                  )}
                </ul>
                <h4 style={{ marginTop: '1rem' }}>Raw Ingredients:</h4>
                <ul>
                  {expiringData?.expiring_ingredients?.length === 0 ? (
                    <li>No raw ingredients expiring soon.</li>
                  ) : (
                    expiringData?.expiring_ingredients?.map(i => (
                      <li key={i.id}>
                        {i.name} - Expiry: {new Date(i.expiry_date).toLocaleDateString()}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: TRANSACTIONS AUDIT TRAIL */}
          {activeTab === 'transactions' && (
            <div>
              <div className="filter-bar space-between">
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <select
                    value={txnFilterType}
                    onChange={(e) => setTxnFilterType(e.target.value)}
                    className="select-input"
                  >
                    <option value="">All Transaction Types</option>
                    <option value="PURCHASE">PURCHASE</option>
                    <option value="SALE">SALE</option>
                    <option value="PRODUCTION">PRODUCTION</option>
                    <option value="WASTAGE">WASTAGE</option>
                    <option value="ADJUSTMENT">ADJUSTMENT</option>
                    <option value="RETURN">RETURN</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Search notes or reference..."
                    value={txnSearch}
                    onChange={(e) => setTxnSearch(e.target.value)}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
              </div>

              <div className="table-responsive" style={{ marginTop: '1rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Txn ID</th>
                      <th>Item Type</th>
                      <th>Item ID</th>
                      <th>Type</th>
                      <th>Quantity Change</th>
                      <th>Reference ID</th>
                      <th>Note</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                          No transactions match the criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => (
                        <tr key={t.id}>
                          <td>#{t.id}</td>
                          <td><span className="unit-badge">{t.item_type}</span></td>
                          <td>#{t.item_id}</td>
                          <td>
                            <span className={`status-pill ${
                              t.transaction_type === 'PURCHASE' || t.transaction_type === 'PRODUCTION' ? 'available' :
                              t.transaction_type === 'SALE' ? 'warning' : 'unavailable'
                            }`}>
                              {t.transaction_type}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: t.quantity >= 0 ? '#2a9d8f' : '#e76f51' }}>
                              {t.quantity >= 0 ? `+${t.quantity}` : t.quantity}
                            </strong>
                          </td>
                          <td>{t.reference_id || '-'}</td>
                          <td>{t.note || '-'}</td>
                          <td>{new Date(t.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Inventory;
