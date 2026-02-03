import './css/Dashboard.css';
import { FileText, Users, TrendingUp, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDashboardOverview } from '../api/analyticsService';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalDocuments: 0,
    activeUsers: 0,
    documentsThisMonth: 0,
    pendingDocuments: 0
  });
  const [recentDocuments, setRecentDocuments] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load overview stats
      const { data: statsData, error: statsError } = await getDashboardOverview();
      
      if (statsError) throw statsError;

      setStats({
        totalDocuments: statsData.totalDocuments,
        activeUsers: statsData.activeUsers,
        documentsThisMonth: statsData.recentUploads,
        pendingDocuments: statsData.pendingDocuments
      });

      // Load recent documents
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          status,
          created_at,
          category:categories(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (docsError) throw docsError;

      setRecentDocuments(docsData || []);

    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (docId) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: 'approved',
          is_published: true,
          approved_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;

      // Reload data
      await loadDashboardData();
      alert('Document approved successfully!');
    } catch (err) {
      console.error('Error approving document:', err);
      alert('Failed to approve document');
    }
  };

  const handleReject = async (docId) => {
    const reason = prompt('Enter rejection reason (optional):');
    
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', docId);

      if (error) throw error;

      // Reload data
      await loadDashboardData();
      alert('Document rejected');
    } catch (err) {
      console.error('Error rejecting document:', err);
      alert('Failed to reject document');
    }
  };

  const statsDisplay = [
    {
      id: 1,
      label: 'Total Documents',
      value: stats.totalDocuments.toString(),
      icon: FileText,
      color: '#3b82f6'
    },
    {
      id: 2,
      label: 'Active Users',
      value: stats.activeUsers.toString(),
      icon: Users,
      color: '#10b981'
    },
    {
      id: 3,
      label: 'Documents This Month',
      value: stats.documentsThisMonth.toString(),
      icon: TrendingUp,
      color: '#f59e0b'
    },
    {
      id: 4,
      label: 'Pending Approvals',
      value: stats.pendingDocuments.toString(),
      icon: Clock,
      color: '#8b5cf6'
    }
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="dashboard-stats">
        {statsDisplay.map((stat) => {
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
          <button className="view-all-btn" onClick={loadDashboardData}>
            Refresh
          </button>

        </div>

        <div className="documents-table">
          {recentDocuments.length > 0 ? (
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
                    <td className="doc-name">{doc.title}</td>
                    <td>
                      <span className="category-badge">
                        {doc.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="doc-date">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`status-badge ${doc.status}`}>
                        {doc.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-documents">
              <FileText size={48} className="no-docs-icon" />
              <p>No recent documents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;