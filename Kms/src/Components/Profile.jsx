import React, { useState, useEffect } from 'react';
import "../Css/Profile.css";
import { FileText, Upload, Activity, Eye, EyeOff, Camera } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getRecentlyViewedDocuments, getUserDocuments } from '../api/documentsService';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // User data
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Activity data
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [activities, setActivities] = useState([]);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      loadProfileData();
      loadActivityData();
    }
  }, [userId]);

  const loadProfileData = async () => {
    setLoading(true);
    setError('');

    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setEmail(profileData.email || '');
      setAvatarUrl(profileData.avatar_url || '');
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadActivityData = async () => {
    try {
      // Get recently viewed documents
      const { data: viewedDocs } = await getRecentlyViewedDocuments(userId, 5);
      if (viewedDocs) {
        const formatted = viewedDocs.map(v => ({
          name: v.document?.title || 'Unknown',
          date: new Date(v.viewed_at).toLocaleDateString(),
          category: v.document?.category?.name || 'Uncategorized',
          id: v.document?.id
        }));
        setRecentlyViewed(formatted);
      }

      // Get user uploads
      const { data: userDocs } = await getUserDocuments(userId);
      if (userDocs) {
        const formatted = userDocs.slice(0, 5).map(doc => ({
          name: doc.title,
          date: new Date(doc.created_at).toLocaleDateString(),
          size: doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'N/A',
          id: doc.id
        }));
        setUploads(formatted);
      }

      // Get activity logs
      const { data: activityData } = await supabase
        .from('activity_logs')
        .select(`
          *,
          document:documents(title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityData) {
        const formatted = activityData.map(activity => ({
          action: activity.action,
          document: activity.entity_type === 'document' && activity.document?.title 
            ? activity.document.title 
            : activity.entity_type,
          date: new Date(activity.created_at).toLocaleDateString(),
          time: new Date(activity.created_at).toLocaleTimeString()
        }));
        setActivities(formatted);
      }
    } catch (err) {
      console.error('Error loading activity data:', err);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      alert('Avatar updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Failed to upload avatar: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    // Validate password if changing
    if (newPassword) {
      if (newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
      }
    }

    setUpdating(true);
    setError('');

    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update password if provided
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) throw passwordError;
      }

      // Update email if changed (requires re-authentication)
      if (email !== profile.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });

        if (emailError) throw emailError;
        
        alert('Profile updated! Please check your email to confirm the new email address.');
      } else {
        alert('Profile updated successfully!');
      }

      // Reload profile
      await loadProfileData();
      
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile: ' + err.message);
      alert('Failed to update profile: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFullName(profile?.full_name || '');
    setEmail(profile?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Manage your account and view your activity</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Account Information</h2>
            {!isEditing && (
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>

          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-container">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials(fullName)}
                </div>
              )}
              <label htmlFor="avatar-upload" className="avatar-upload-btn">
                <Camera size={16} />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            {uploadingAvatar && <p className="upload-text">Uploading...</p>}
          </div>

          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
                <p className="form-hint">Changing your email will require verification</p>
              </div>

              <div className="form-divider">
                <span>Change Password (Optional)</span>
              </div>

              <div className="form-group">
                <label htmlFor="new-password" className="form-label">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="password-toggle-btn"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {newPassword && (
                <div className="form-group">
                  <label htmlFor="confirm-password" className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    placeholder="Confirm new password"
                  />
                </div>
              )}

              <div className="form-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleCancel}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Name</span>
                <span className="info-value">{fullName || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Role</span>
                <span className="info-value">{profile?.role || 'user'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Account Status</span>
                <span className={`status-badge ${profile?.is_active ? 'active' : 'inactive'}`}>
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Member Since</span>
                <span className="info-value">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Recently Viewed Documents</h2>
          </div>
          <div className="activity-list">
            {recentlyViewed.length > 0 ? (
              recentlyViewed.map((doc, index) => (
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
              ))
            ) : (
              <p className="no-activity">No recently viewed documents</p>
            )}
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Your Uploads</h2>
          </div>
          <div className="activity-list">
            {uploads.length > 0 ? (
              uploads.map((doc, index) => (
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
              ))
            ) : (
              <p className="no-activity">No uploads yet</p>
            )}
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
          </div>
          <div className="activity-list">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
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
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-activity">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}