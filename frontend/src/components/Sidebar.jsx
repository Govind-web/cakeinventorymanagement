import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { hasRole } = useAuth();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { label: 'Users & Staff', path: '/users', icon: '👥', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Products', path: '/products', icon: '🍰', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { label: 'Ingredients', path: '/ingredients', icon: '🌾', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Recipes', path: '/recipes', icon: '📖', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Suppliers', path: '/suppliers', icon: '🚚', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Purchases', path: '/purchases', icon: '🛒', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Production', path: '/production', icon: '🍳', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Sales', path: '/sales', icon: '💵', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { label: 'Inventory', path: '/inventory', icon: '📦', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  ];

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        {menuItems.map(item => {
          if (!hasRole(item.roles)) return null;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-text">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
