import "./css/UserManagement.css";

import { Users, Search, Filter, MoreVertical, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);

  // Mock user data
  const [users, setUsers] = useState([
    { id: 1, name: 'John Smith', email: 'john.smith@company.com', role: 'admin', status: 'active', joined: '2024-01-15', lastActive: '2 hours ago' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah.j@company.com', role: 'user', status: 'active', joined: '2024-02-20', lastActive: '5 hours ago' },
    { id: 3, name: 'Mike Chen', email: 'mike.chen@company.com', role: 'user', status: 'active', joined: '2024-03-10', lastActive: '1 day ago' },
    { id: 4, name: 'Lisa Anderson', email: 'lisa.a@company.com', role: 'user', status: 'inactive', joined: '2024-01-05', lastActive: '2 weeks ago' },
    { id: 5, name: 'David Lee', email: 'david.lee@company.com', role: 'user', status: 'active', joined: '2024-04-01', lastActive: '3 hours ago' },
    { id: 6, name: 'Emily Brown', email: 'emily.b@company.com', role: 'admin', status: 'active', joined: '2024-02-14', lastActive: '1 hour ago' },
    { id: 7, name: 'James Wilson', email: 'james.w@company.com', role: 'user', status: 'suspended', joined: '2024-03-22', lastActive: '5 days ago' },
    { id: 8, name: 'Anna Martinez', email: 'anna.m@company.com', role: 'user', status: 'active', joined: '2024-04-15', lastActive: '30 min ago' }
  ]);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
      setShowActionMenu(null);
    }
  };

  const handleToggleStatus = (userId) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'active' ? 'inactive' : 'active' };
      }
      return u;
    }));
    setShowActionMenu(null);
  };

  const handleSuspendUser = (userId) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' };
      }
      return u;
    }));
    setShowActionMenu(null);
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1 className="user-management-title">User Management</h1>
        <p className="user-management-subtitle">Manage user accounts and permissions</p>
      </div>

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
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
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
                          <button className="action-item" onClick={() => setSelectedUser(user)}>
                            <Edit size={16} />
                            Edit User
                          </button>
                          <button 
                            className="action-item" 
                            onClick={() => handleToggleStatus(user.id)}
                          >
                            {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            className="action-item" 
                            onClick={() => handleSuspendUser(user.id)}
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

          {filteredUsers.length === 0 && (
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
                <label>Name</label>
                <input type="text" defaultValue={selectedUser.name} className="form-input" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" defaultValue={selectedUser.email} className="form-input" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select defaultValue={selectedUser.role} className="form-select">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select defaultValue={selectedUser.status} className="form-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setSelectedUser(null)}>
                Cancel
              </button>
              <button className="save-button" onClick={() => setSelectedUser(null)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;