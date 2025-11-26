import { 
    LayoutDashboard, 
    BarChart3,
    Users,
    LogOut
  } from 'lucide-react';
  import './Sidebar.css';
  
  const Sidebar = ({ currentPage, onNavigate, onLogout }) => {
    return (
      <div className="admin-sidebar">
        <div className="sidebar-inner">
  
          <div className="sidebar-header">
            <div className="sidebar-logo">K</div>
            <h2 className="sidebar-title">KMS Admin</h2>
          </div>
  
          <nav className="sidebar-menu">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`menu-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>
  
            <button
              onClick={() => onNavigate('analytics')}
              className={`menu-item ${currentPage === 'analytics' ? 'active' : ''}`}
            >
              <BarChart3 size={20} />
              <span>Analytics</span>
            </button>
  
            <button
              onClick={() => onNavigate('users')}
              className={`menu-item ${currentPage === 'users' ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>User Management</span>
            </button>
          </nav>
  
          <div className="sidebar-footer">
            <button onClick={onLogout} className="menu-item logout">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
  
        </div>
      </div>
    );
  };
  
  export default Sidebar;
  