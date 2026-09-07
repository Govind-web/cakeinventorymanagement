import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'STAFF',
    manager_id: '',
    is_active: true
  });

  const { user: currentUser, hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER']);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [usersRes, managersRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/managers')
      ]);
      setUsers(usersRes.data);
      setManagers(managersRes.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch user accounts. Make sure you have Admin or Manager privileges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'STAFF',
      manager_id: managers.length > 0 ? String(managers[0].id) : '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (userItem) => {
    setEditingUser(userItem);
    setFormData({
      username: userItem.username,
      email: userItem.email || '',
      password: '', // blank unless resetting
      role: userItem.role,
      manager_id: userItem.manager_id ? String(userItem.manager_id) : '',
      is_active: userItem.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (userItem) => {
    if (userItem.id === currentUser?.id) {
      alert("You cannot delete your own logged-in account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${userItem.username}"?`)) return;
    try {
      await api.delete(`/users/${userItem.id}`);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      let msg = 'Failed to delete user.';
      if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail);
      }
      alert(msg);
    }
  };

  const handleToggleStatus = async (userItem) => {
    if (userItem.id === currentUser?.id) {
      alert("You cannot deactivate your own account.");
      return;
    }
    try {
      await api.put(`/users/${userItem.id}`, {
        is_active: !userItem.is_active
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      alert('Username is required.');
      return;
    }

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
        role: formData.role,
        manager_id: formData.manager_id ? parseInt(formData.manager_id, 10) : null,
        is_active: formData.is_active
      };

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        if (!formData.password || !formData.password.trim()) {
          alert('Password is required when creating a new user.');
          return;
        }
        await api.post('/users', payload);
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving user:', err);
      let errorMsg = 'Error saving user details.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map(d => `${d.loc ? d.loc[d.loc.length - 1] : ''}: ${d.msg}`).join('\n');
        }
      }
      alert(errorMsg);
    }
  };

  // Filtered list
  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Calculate metrics
  const totalCount = users.length;
  const managerCount = users.filter(u => u.role === 'MANAGER').length;
  const staffCount = users.filter(u => u.role === 'STAFF').length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>👥 Staff & Manager Management</h2>
          <p>Manage bakery accounts, roles, assigned managers, and system permissions</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={handleOpenAdd}>
            + Add New User / Staff
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>👥</div>
          <div className="metric-info">
            <span className="metric-title">Total Users</span>
            <span className="metric-value">{totalCount}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>🧑‍🍳</div>
          <div className="metric-info">
            <span className="metric-title">Staff Members</span>
            <span className="metric-value">{staffCount}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>👔</div>
          <div className="metric-info">
            <span className="metric-title">Managers</span>
            <span className="metric-value">{managerCount}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>👑</div>
          <div className="metric-info">
            <span className="metric-title">Administrators</span>
            <span className="metric-value">{adminCount}</span>
          </div>
        </div>
      </div>

      {error && <div className="alert-box error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Search & Filter Toolbar */}
      <div className="table-controls" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div className="filter-tabs" style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'STAFF', 'MANAGER', 'ADMIN'].map(role => (
            <button
              key={role}
              className={`btn-secondary ${roleFilter === role ? 'active' : ''}`}
              style={{
                backgroundColor: roleFilter === role ? 'var(--primary-color, #4f46e5)' : 'white',
                color: roleFilter === role ? '#fff' : '#374151',
                border: '1px solid #d1d5db',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: roleFilter === role ? '600' : 'normal'
              }}
              onClick={() => setRoleFilter(role)}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </button>
          ))}
        </div>
        <div className="search-box" style={{ minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading user accounts..." />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Assigned Manager</th>
                <th>Status</th>
                <th>Created</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No user accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isSelf = u.id === currentUser?.id;
                  const roleBadgeClass =
                    u.role === 'ADMIN'
                      ? 'badge-danger'
                      : u.role === 'MANAGER'
                      ? 'badge-warning'
                      : 'badge-success';

                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '600' }}>
                        👤 {u.username} {isSelf && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>(You)</span>}
                      </td>
                      <td>{u.email || '-'}</td>
                      <td>
                        <span className={`badge ${roleBadgeClass}`} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.manager ? (
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>
                            👔 {u.manager.username}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', italic: 'true' }}>
                            {u.role === 'ADMIN' ? 'N/A (Admin)' : 'Unassigned'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}
                          style={{ cursor: canManage && !isSelf ? 'pointer' : 'default' }}
                          onClick={() => canManage && !isSelf && handleToggleStatus(u)}
                          title={canManage && !isSelf ? "Click to toggle active status" : ""}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      {canManage && (
                        <td>
                          <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn-icon edit"
                              onClick={() => handleOpenEdit(u)}
                              title="Edit User & Manager"
                            >
                              ✏️ Edit
                            </button>
                            {!isSelf && (
                              <button
                                className="btn-icon delete"
                                onClick={() => handleDelete(u)}
                                title="Delete User Account"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>{editingUser ? `Edit User (${editingUser.username})` : 'Add New Staff / Manager'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. john_doe"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. john@bakery.com (Auto-generated if empty)"
                  />
                </div>

                <div className="form-group">
                  <label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Enter new password if resetting" : "Enter password"}
                  />
                </div>

                <div className="form-group">
                  <label>System Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="STAFF">STAFF (Front desk & POS)</option>
                    <option value="MANAGER">MANAGER (Inventory & Production)</option>
                    <option value="ADMIN">ADMIN (Full Control)</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Assign Manager</label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    disabled={formData.role === 'ADMIN'}
                  >
                    <option value="">-- No Manager Assigned --</option>
                    {managers
                      .filter(m => !editingUser || m.id !== editingUser.id)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          👔 {m.username} ({m.role})
                        </option>
                      ))}
                  </select>
                  <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                    Select supervisor / manager responsible for this staff member.
                  </small>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="is_active_checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <label htmlFor="is_active_checkbox" style={{ margin: 0, cursor: 'pointer', fontWeight: '500' }}>
                    Account is Active and allowed to log in
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Save Changes' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
