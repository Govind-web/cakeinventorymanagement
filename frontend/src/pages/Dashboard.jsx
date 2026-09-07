import React, { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StockAlert from '../components/StockAlert';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading Bakery Dashboard..." />;
  if (error) return <div className="alert-box error">{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🧁 Bakery Overview Dashboard</h2>
        <button className="btn-secondary" onClick={fetchDashboardData}>Refresh Metrics</button>
      </div>

      {/* Stock Alert Banner */}
      <div className="alerts-row">
        <StockAlert type="out" count={data?.out_of_stock_products?.length || 0} label="Products Out of Stock" />
        <StockAlert type="low" count={data?.low_stock_products?.length || 0} label="Low Stock Products" />
        <StockAlert type="low" count={data?.low_stock_ingredients?.length || 0} label="Low Stock Ingredients" />
      </div>

      {/* Key Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">🍰</div>
          <div className="stat-info">
            <h3>{data?.total_products || 0}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">🌾</div>
          <div className="stat-info">
            <h3>{data?.total_ingredients || 0}</h3>
            <p>Raw Ingredients</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>₹{data?.total_sales_today?.toFixed(2) || '0.00'}</h3>
            <p>Today's Sales</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>₹{data?.total_sales_this_month?.toFixed(2) || '0.00'}</h3>
            <p>Sales This Month</p>
          </div>
        </div>

        <div className="stat-card teal">
          <div className="stat-icon">🏪</div>
          <div className="stat-info">
            <h3>₹{data?.total_inventory_value?.toFixed(2) || '0.00'}</h3>
            <p>Inventory Valuation</p>
          </div>
        </div>
      </div>

      {/* Section split: Recent Sales & Low Stock */}
      <div className="dashboard-grid-2">
        <div className="card">
          <div className="card-header">
            <h3>🛒 Recent Sales</h3>
          </div>
          <div className="card-body">
            {data?.recent_sales?.length === 0 ? (
              <p>No recent sales recorded.</p>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recent_sales?.map(s => (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td>{s.customer_name || 'Walk-in'}</td>
                      <td><strong>{s.total_amount.toFixed(2)}</strong></td>
                      <td>{new Date(s.sale_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>🔥 Top Selling Bakery Items</h3>
          </div>
          <div className="card-body">
            {data?.top_selling_products?.length === 0 ? (
              <p>No sales history yet.</p>
            ) : (
              <ul className="top-selling-list">
                {data?.top_selling_products?.map((item, idx) => (
                  <li key={item.product_id} className="top-item">
                    <span className="rank">#{idx + 1}</span>
                    <span className="item-name">{item.name}</span>
                    <span className="item-sold">{item.total_sold} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
