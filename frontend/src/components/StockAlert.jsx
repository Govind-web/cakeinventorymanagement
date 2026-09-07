import React from 'react';

const StockAlert = ({ type, count, label }) => {
  if (count <= 0) return null;

  const colorClass = type === 'out' ? 'alert-danger' : 'alert-warning';
  const icon = type === 'out' ? '🚫' : '⚠️';

  return (
    <div className={`stock-alert-card ${colorClass}`}>
      <span className="alert-icon">{icon}</span>
      <div>
        <h4 style={{ margin: 0 }}>{count} {label}</h4>
        <small>{type === 'out' ? 'Requires immediate action' : 'Below minimum stock threshold'}</small>
      </div>
    </div>
  );
};

export default StockAlert;
