import React from 'react';
import './Home.css';
import { FileText, TrendingUp, Users, Clock } from 'lucide-react';

export default function Home({ onNavigateToDocuments }) {
  const stats = [
    { icon: FileText, label: 'Total Documents', value: '1,234', color: '#2563eb' },
    { icon: Users, label: 'Active Users', value: '89', color: '#10b981' },
    { icon: TrendingUp, label: 'Documents This Month', value: '156', color: '#f59e0b' },
    { icon: Clock, label: 'Recent Uploads', value: '23', color: '#8b5cf6' }
  ];

  const recentDocuments = [
    { name: 'Q4 Financial Report.pdf', date: '2025-01-15', category: 'Finance' },
    { name: 'Employee Handbook 2025.docx', date: '2025-01-10', category: 'HR' },
    { name: 'Marketing Strategy.pptx', date: '2025-01-08', category: 'Marketing' }
  ];

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <h1 className="home-title">Welcome to KMS</h1>
          <p className="home-subtitle">Manage and access your documents efficiently</p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon size={24} style={{ color: stat.color }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="recent-section">
          <div className="section-header">
            <h2 className="section-title">Recent Documents</h2>
            <button className="view-all-button" onClick={onNavigateToDocuments}>
              View All
            </button>
          </div>
          
          <div className="recent-documents">
            {recentDocuments.map((doc, index) => (
              <div key={index} className="recent-doc-card">
                <div className="recent-doc-icon">
                  <FileText size={20} />
                </div>
                <div className="recent-doc-content">
                  <h4 className="recent-doc-name">{doc.name}</h4>
                  <div className="recent-doc-meta">
                    <span>{doc.category}</span>
                    <span>•</span>
                    <span>{doc.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}