import React, { useState } from 'react';
import './Profile.css';
import { FileText, Upload, Activity, Eye, EyeOff } from 'lucide-react';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Matthew Faner');
  const [email, setEmail] = useState('matthew13@example.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const recentlyViewed = [
    { name: 'Q4 Financial Report.pdf', date: '2025-01-15', category: 'Finance' },
    { name: 'Employee Handbook 2025.docx', date: '2025-01-10', category: 'HR' },
    { name: 'Marketing Strategy.pptx', date: '2025-01-08', category: 'Marketing' }
  ];

  const uploads = [
    { name: 'Product Roadmap 2025.xlsx', date: '2025-01-05', size: '890 KB' },
    { name: 'IT Security Policy.pdf', date: '2025-01-03', size: '1.2 MB' }
  ];

  const activities = [
    { action: 'Uploaded', document: 'Product Roadmap 2025.xlsx', date: '2025-01-05' },
    { action: 'Viewed', document: 'Q4 Financial Report.pdf', date: '2025-01-15' },
    { action: 'Downloaded', document: 'Marketing Strategy.pptx', date: '2025-01-08' }
  ];

  const handleSave = () => {
    console.log('Profile updated:', { name, email, password });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPassword('');
  };

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Manage your account and view your activity</p>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Account Information</h2>
            {!isEditing && (
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">New Password (optional)</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Leave blank to keep current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Name</span>
                <span className="info-value">{name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{email}</span>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Recently Viewed Documents</h2>
          </div>
          <div className="activity-list">
            {recentlyViewed.map((doc, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <FileText size={20} />
                </div>
                <div className="activity-content">
                  <h4 className="activity-name">{doc.name}</h4>
                  <div className="activity-meta">
                    <span>{doc.category}</span>
                    <span>•</span>
                    <span>{doc.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Your Uploads</h2>
          </div>
          <div className="activity-list">
            {uploads.map((doc, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <Upload size={20} />
                </div>
                <div className="activity-content">
                  <h4 className="activity-name">{doc.name}</h4>
                  <div className="activity-meta">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Your Activity</h2>
          </div>
          <div className="activity-list">
            {activities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <Activity size={20} />
                </div>
                <div className="activity-content">
                  <h4 className="activity-name">
                    {activity.action} <span className="activity-doc">{activity.document}</span>
                  </h4>
                  <div className="activity-meta">
                    <span>{activity.date}</span>
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