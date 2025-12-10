import "./css/UserManagement.css";
import { Users, Search, Filter, MoreVertical, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [users, setUsers] = useState([]);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    role: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [userToAction, setUserToAction] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedUsers = (data || []).map(user => ({
        id: user.id,
        name: user.full_name || user.email?.split('@')[0] || 'Unknown',
        email: user.email,
        role: user.role || 'user',
        status: user.is_active ? 'active' : 'inactive',
        joined: new Date(user.created_at).toLocaleDateString(),
        lastActive: user.updated_at ? formatTimeAgo(new Date(user.updated_at)) : 'Never'
      }));

      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
    return date.toLocaleDateString();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeleteUser = async (userId) => {
    setUserToAction(users.find(u => u.id === userId));
    setShowDeleteModal(true);
    setShowActionMenu(null);
  };

  const confirmDelete = async () => {
    if (!userToAction) return;

    try {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToAction.id);

      if (deleteError) throw deleteError;

      await loadUsers();
      setShowDeleteModal(false);
      setUserToAction(null);
      alert('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + err.message);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    setUserToAction({ ...users.find(u => u.id === userId), currentStatus });
    setShowDeactivateModal(true);
    setShowActionMenu(null);
  };

  const confirmToggleStatus = async () => {
    if (!userToAction) return;

    const newStatus = userToAction.currentStatus === 'active' ? false : true;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', userToAction.id);

      if (updateError) throw updateError;

      await loadUsers();
      setShowDeactivateModal(false);
      setUserToAction(null);
      alert(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status: ' + err.message);
    }
  };

  const handleSuspendUser = async (userId, currentStatus) => {
    setUserToAction({ ...users.find(u => u.id === userId), currentStatus });
    setShowSuspendModal(true);
    setShowActionMenu(null);
  };

  const confirmSuspend = async () => {
    if (!userToAction) return;

    const newStatus = userToAction.currentStatus === 'suspended' ? true : false;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', userToAction.id);

      if (updateError) throw updateError;

      await loadUsers();
      setShowSuspendModal(false);
      setUserToAction(null);
      alert(`User ${newStatus ? 'unsuspended' : 'suspended'} successfully`);
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status: ' + err.message);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.name,
      email: user.email,
      role: user.role
    });
    setShowActionMenu(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name,
          email: editFormData.email,
          role: editFormData.role
        })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      await loadUsers();
      setSelectedUser(null);
      alert('User updated successfully');
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #f3f4f6', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1 className="user-management-title">User Management</h1>
        <p className="user-management-subtitle">Manage user accounts and permissions</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="stat-icon active">
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{users.filter(u => u.status === 'active').length}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="stat-icon inactive">
            <UserX size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{users.filter(u => u.status === 'inactive').length}</div>
            <div className="stat-label">Inactive Users</div>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="stat-icon admin">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
            <div className="stat-label">Admins</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <section className="user-management-section">
        <div className="filters-container">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <Filter size={20} />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      {/* Users Table */}
      <section className="user-management-section">
        <div className="section-header">
          <div className="section-title-group">
            <Users size={20} />
            <h2>Users ({filteredUsers.length})</h2>
          </div>
        </div>

        <div className="users-table">
          {filteredUsers.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="user-name-cell">{user.name}</td>
                    <td className="user-email">{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="date-text">{user.joined}</td>
                    <td className="date-text">{user.lastActive}</td>
                    <td className="action-cell">
                      <div className="action-menu-wrapper">
                        <button
                          className="action-button"
                          onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {showActionMenu === user.id && (
                          <div className="action-dropdown">
                            <button className="action-item" onClick={() => handleEditUser(user)}>
                              <Edit size={16} />
                              Edit User
                            </button>
                            <button 
                              className="action-item" 
                              onClick={() => handleToggleStatus(user.id, user.status)}
                            >
                              {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                              {user.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              className="action-item" 
                              onClick={() => handleSuspendUser(user.id, user.status)}
                            >
                              <UserX size={16} />
                              {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                            </button>
                            <button 
                              className="action-item delete" 
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 size={16} />
                              Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-users">
              <Users size={48} />
              <p>No users found</p>
            </div>
          )}
        </div>
      </section>

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="close-button" onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className="form-select"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setSelectedUser(null)}>
                Cancel
              </button>
              <button className="save-button" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToAction && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} >
            <div className="modal-header">
              <h2>Delete User</h2>
              <button className="close-button" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <Trash2 size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Are you sure you want to delete this user?
                </p>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  <strong>{userToAction.name}</strong> ({userToAction.email})
                </p>
                <p style={{ color: '#991b1b', fontSize: '0.875rem' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                className="save-button" 
                onClick={confirmDelete}
                style={{ backgroundColor: '#ef4444' }}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate/Activate Confirmation Modal */}
      {showDeactivateModal && userToAction && (
        <div className="modal-overlay" onClick={() => setShowDeactivateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{userToAction.currentStatus === 'active' ? 'Deactivate' : 'Activate'} User</h2>
              <button className="close-button" onClick={() => setShowDeactivateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                {userToAction.currentStatus === 'active' ? (
                  <UserX size={48} style={{ color: '#f59e0b', margin: '0 auto 1rem' }} />
                ) : (
                  <UserCheck size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
                )}
                <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  {userToAction.currentStatus === 'active' ? 'Deactivate' : 'Activate'} this user?
                </p>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  <strong>{userToAction.name}</strong> ({userToAction.email})
                </p>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {userToAction.currentStatus === 'active' 
                    ? 'This user will no longer be able to access the system.' 
                    : 'This user will be able to access the system again.'}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowDeactivateModal(false)}>
                Cancel
              </button>
              <button 
                className="save-button" 
                onClick={confirmToggleStatus}
                style={{ backgroundColor: userToAction.currentStatus === 'active' ? '#f59e0b' : '#10b981' }}
              >
                {userToAction.currentStatus === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend/Unsuspend Confirmation Modal */}
      {showSuspendModal && userToAction && (
        <div className="modal-overlay" onClick={() => setShowSuspendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} >
            <div className="modal-header">
              <h2>{userToAction.currentStatus === 'suspended' ? 'Unsuspend' : 'Suspend'} User</h2>
              <button className="close-button" onClick={() => setShowSuspendModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <UserX size={48} style={{ color: '#8b5cf6', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  {userToAction.currentStatus === 'suspended' ? 'Unsuspend' : 'Suspend'} this user?
                </p>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  <strong>{userToAction.name}</strong> ({userToAction.email})
                </p>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {userToAction.currentStatus === 'suspended' 
                    ? 'This user will be able to access the system again.' 
                    : 'This user will be temporarily suspended from the system.'}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowSuspendModal(false)}>
                Cancel
              </button>
              <button 
                className="save-button" 
                onClick={confirmSuspend}
                style={{ backgroundColor: '#8b5cf6' }}
              >
                {userToAction.currentStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;