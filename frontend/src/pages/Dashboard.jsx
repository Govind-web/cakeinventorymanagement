import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StockAlert from '../components/StockAlert';

// Vibrant color palette for pie slices
const PIE_COLORS = ['#e07a5f', '#3d405b', '#2a9d8f', '#e9c46a', '#457b9d'];

// Custom tooltip for the pie chart
const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #e9ecef',
        borderRadius: 8,
        padding: '0.65rem 1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
        fontSize: '0.88rem',
      }}>
        <p style={{ fontWeight: 700, color: '#3d405b', marginBottom: 4 }}>{d.name}</p>
        <p style={{ color: '#6c757d' }}>Qty Sold: <strong>{d.total_sold}</strong></p>
        <p style={{ color: '#6c757d' }}>Revenue: <strong>₹{d.total_revenue?.toFixed(2)}</strong></p>
      </div>
    );
  }
  return null;
};

// Custom label on each pie slice
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: '0.78rem', fontWeight: 700 }}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pieMode, setPieMode] = useState('quantity'); // 'quantity' | 'revenue'

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

  // Build pie chart data
  const pieData = (data?.top_selling_products || []).map((item) => ({
    name: item.name,
    value: pieMode === 'quantity' ? item.total_sold : (item.total_revenue || 0),
    total_sold: item.total_sold,
    total_revenue: item.total_revenue,
  }));

  const profitTodayColor = (data?.profit_today || 0) >= 0 ? '#2a9d8f' : '#e76f51';
  const profitMonthColor = (data?.profit_this_month || 0) >= 0 ? '#2a9d8f' : '#e76f51';

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

      {/* Profit Cards */}
      <div className="profit-cards-row">
        <div className="profit-card" style={{ borderLeft: `4px solid ${profitTodayColor}` }}>
          <div className="profit-card-icon">📊</div>
          <div className="profit-card-body">
            <p className="profit-label">Today's Profit</p>
            <h3 className="profit-amount" style={{ color: profitTodayColor }}>
              ₹{(data?.profit_today || 0).toFixed(2)}
            </h3>
            <p className="profit-sub">Revenue − Cost of Goods Sold</p>
          </div>
          <div className={`profit-badge ${(data?.profit_today || 0) >= 0 ? 'profit-positive' : 'profit-negative'}`}>
            {(data?.profit_today || 0) >= 0 ? '▲ Profit' : '▼ Loss'}
          </div>
        </div>

        <div className="profit-card" style={{ borderLeft: `4px solid ${profitMonthColor}` }}>
          <div className="profit-card-icon">📅</div>
          <div className="profit-card-body">
            <p className="profit-label">Monthly Profit</p>
            <h3 className="profit-amount" style={{ color: profitMonthColor }}>
              ₹{(data?.profit_this_month || 0).toFixed(2)}
            </h3>
            <p className="profit-sub">Revenue − Cost of Goods Sold</p>
          </div>
          <div className={`profit-badge ${(data?.profit_this_month || 0) >= 0 ? 'profit-positive' : 'profit-negative'}`}>
            {(data?.profit_this_month || 0) >= 0 ? '▲ Profit' : '▼ Loss'}
          </div>
        </div>
      </div>

      {/* Section split: Recent Sales & Pie Chart */}
      <div className="dashboard-grid-2">
        {/* Pie Chart — Top Selling Products */}
        <div className="card">
          <div className="card-header space-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>🥧 Most Selling Products</h3>
            <div className="pie-toggle-group">
              <button
                id="pie-toggle-qty"
                className={`pie-toggle-btn ${pieMode === 'quantity' ? 'active' : ''}`}
                onClick={() => setPieMode('quantity')}
              >
                By Qty
              </button>
              <button
                id="pie-toggle-rev"
                className={`pie-toggle-btn ${pieMode === 'revenue' ? 'active' : ''}`}
                onClick={() => setPieMode('revenue')}
              >
                By Revenue
              </button>
            </div>
          </div>
          <div className="card-body">
            {pieData.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6c757d', padding: '2rem 0' }}>No sales data to display.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    innerRadius={42}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span style={{ fontSize: '0.82rem', color: '#3d405b', fontWeight: 600 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Sales */}
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
                      <td><strong>₹{s.total_amount.toFixed(2)}</strong></td>
                      <td>{new Date(s.sale_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Products list */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
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
                  <span className="item-revenue" style={{ color: '#2a9d8f', fontWeight: 700, fontSize: '0.88rem' }}>
                    ₹{(item.total_revenue || 0).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
