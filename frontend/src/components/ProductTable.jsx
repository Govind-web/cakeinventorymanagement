import React from 'react';

const ProductTable = ({ products, onEdit, onDelete, canManage }) => {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Selling Price</th>
            <th>Cost Price</th>
            <th>Quantity</th>
            <th>Min Stock</th>
            <th>Status</th>
            {canManage && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={canManage ? 9 : 8} style={{ textAlign: 'center', padding: '2rem' }}>
                No products found.
              </td>
            </tr>
          ) : (
            products.map((p) => {
              const isLow = p.quantity <= p.minimum_stock;
              const isOut = p.quantity <= 0;
              return (
                <tr key={p.id} className={isOut ? 'row-out-stock' : isLow ? 'row-low-stock' : ''}>
                  <td>#{p.id}</td>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.category?.name || 'N/A'}</td>
                  <td>₹{p.selling_price.toFixed(2)}</td>
                  <td>₹{p.cost_price.toFixed(2)}</td>
                  <td>
                    <span className={`stock-badge ${isOut ? 'out' : isLow ? 'low' : 'normal'}`}>
                      {p.quantity} units
                    </span>
                  </td>
                  <td>{p.minimum_stock}</td>
                  <td>
                    <span className={`status-pill ${p.is_available ? 'available' : 'unavailable'}`}>
                      {p.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <button className="btn-action edit" onClick={() => onEdit(p)}>Edit</button>
                      <button className="btn-action delete" onClick={() => onDelete(p.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
