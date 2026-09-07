import React from 'react';

const IngredientTable = ({ ingredients, onEdit, onDelete, canManage }) => {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ingredient</th>
            <th>Unit</th>
            <th>Quantity</th>
            <th>Min Qty</th>
            <th>Cost / Unit</th>
            <th>Supplier</th>
            <th>Status</th>
            {canManage && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {ingredients.length === 0 ? (
            <tr>
              <td colSpan={canManage ? 9 : 8} style={{ textAlign: 'center', padding: '2rem' }}>
                No ingredients found.
              </td>
            </tr>
          ) : (
            ingredients.map((ing) => {
              const isLow = ing.quantity <= ing.minimum_quantity;
              const isOut = ing.quantity <= 0;
              return (
                <tr key={ing.id} className={isOut ? 'row-out-stock' : isLow ? 'row-low-stock' : ''}>
                  <td>#{ing.id}</td>
                  <td><strong>{ing.name}</strong></td>
                  <td><span className="unit-badge">{ing.unit}</span></td>
                  <td>
                    <span className={`stock-badge ${isOut ? 'out' : isLow ? 'low' : 'normal'}`}>
                      {ing.quantity} {ing.unit}
                    </span>
                  </td>
                  <td>{ing.minimum_quantity} {ing.unit}</td>
                  <td>₹{ing.cost_per_unit.toFixed(2)}</td>
                  <td>{ing.supplier?.name || 'N/A'}</td>
                  <td>
                    <span className={`status-pill ${isOut ? 'unavailable' : isLow ? 'warning' : 'available'}`}>
                      {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Sufficient'}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <button className="btn-action edit" onClick={() => onEdit(ing)}>Edit</button>
                      <button className="btn-action delete" onClick={() => onDelete(ing.id)}>Delete</button>
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

export default IngredientTable;
