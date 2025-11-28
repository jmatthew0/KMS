import './css/Dashboard.css';
import { FileText, Users, TrendingUp, Clock } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      id: 1,
      label: 'Total Documents',
      value: '1,234',
      icon: FileText,
      color: '#3b82f6'
    },
    {
      id: 2,
      label: 'Active Users',
      value: '89',
      icon: Users,
      color: '#10b981'
    },
    {
      id: 3,
      label: 'Documents This Month',
      value: '156',
      icon: TrendingUp,
      color: '#f59e0b'
    },
    {
      id: 4,
      label: 'Pending Approvals',
      value: '23',
      icon: Clock,
      color: '#8b5cf6'
    }
  ];

  const recentDocuments = [
    {
      id: 1,
      name: 'Q4 Financial Report.pdf',
      category: 'Finance',
      date: '2025-01-15',
      status: 'Approved'
    },
    {
      id: 2,
      name: 'Employee Handbook 2025.docx',
      category: 'HR',
      date: '2025-01-10',
      status: 'Pending'
    },
    {
      id: 3,
      name: 'Marketing Strategy.pptx',
      category: 'Marketing',
      date: '2025-01-08',
      status: 'Approved'
    }
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>
                <Icon size={24} style={{ color: stat.color }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent Documents</h2>
          <button className="view-all-btn">View All</button>
        </div>

        <div className="documents-table">
          <table>
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td className="doc-name">{doc.name}</td>
                  <td>
                    <span className="category-badge">{doc.category}</span>
                  </td>
                  <td className="doc-date">{doc.date}</td>
                  <td>
                    <span className={`status-badge ${doc.status.toLowerCase()}`}>
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;