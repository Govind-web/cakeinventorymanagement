import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="app-navbar">
      <div className="navbar-brand">
        <span className="brand-logo">🧁</span>
        <span className="brand-name">Pastry & Cake Inventory</span>
      </div>
      <div className="navbar-user">
        {user && (
          <>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span>
            </div>
            <button className="btn-logout" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
