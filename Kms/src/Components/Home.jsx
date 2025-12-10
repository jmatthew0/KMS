import React, { useState, useEffect } from 'react';
import '../Css/Home.css';
import { 
  FileText, TrendingUp, Users, Clock, Upload, Eye, 
  Edit3, Trash2, History, Search, MessageSquare, X, Download
} from 'lucide-react';
import { 
  getPublishedDocuments, 
  getUserDocuments, 
  deleteDocument,
  getRecentlyViewedDocuments,
  getDocumentById,
  trackDocumentDownload
} from '../api/documentsService';
import { getAllCategories, getAllTags } from '../api/categoriesService';
import { uploadFile as uploadFileToStorage } from '../api/fileUploadService';
import { createDocument, updateDocument } from '../api/documentsService';
import { getDashboardOverview } from '../api/analyticsService';

export default function Home({ onNavigateToDocuments }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocSummary, setNewDocSummary] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('');
  const [newDocTags, setNewDocTags] = useState('');
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    activeUsers: 0,
    documentsThisMonth: 0,
    recentUploads: 0
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load dashboard stats
      const { data: statsData } = await getDashboardOverview();
      if (statsData) {
        setStats({
          totalDocuments: statsData.totalDocuments,
          activeUsers: statsData.totalUsers,
          documentsThisMonth: statsData.recentUploads,
          recentUploads: statsData.recentUploads
        });
      }

      // Load documents (published for users, all for admin)
      let docsData;

      if (userRole === 'admin') {
        const { data } = await getPendingDocuments();
        docsData = data;
      } else {
        const { data } = await getPublishedDocuments();
        docsData = data;
      }
      

      setDocuments(docsData || []);

      // Load categories
      const { data: categoriesData } = await getAllCategories();
      setCategories(categoriesData || []);
      if (categoriesData && categoriesData.length > 0) {
        setNewDocCategory(categoriesData[0].id);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    console.log('=== Upload Started ===');
    console.log('User ID:', userId);
    console.log('Title:', newDocTitle);
    console.log('Content:', newDocContent);
    console.log('Category:', newDocCategory);
    
    if (!newDocTitle || !newDocContent) {
      alert('Please fill in title and content');
      return;
    }

    if (!userId) {
      alert('User not logged in. Please refresh and try again.');
      return;
    }

    if (!newDocCategory) {
      alert('Please select a category');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Create document
      const newDoc = {
        title: newDocTitle,
        content: newDocContent,
        summary: newDocSummary || null,
        category_id: newDocCategory,
        status: 'pending_approval',
        is_published: false,
        created_by: userId
      };

      console.log('Creating document:', newDoc);

      const { data: createdDoc, error: createError } = await createDocument(newDoc);

      console.log('Create result:', { createdDoc, createError });

      if (createError) {
        console.error('Create error details:', createError);
        throw new Error(createError.message || 'Failed to create document');
      }

      if (!createdDoc) {
        throw new Error('No document returned from creation');
      }

      // Upload file if provided
      if (selectedFile) {
        console.log('Uploading file:', selectedFile.name);
        const fileResult = await uploadFileToStorage(selectedFile, userId, createdDoc.id);
        console.log('File upload result:', fileResult);
        
        if (fileResult.error) {
          console.error('File upload failed:', fileResult.error);
          // Document created but file upload failed
          alert('Document created but file upload failed: ' + fileResult.error.message);
        }
      }

      // Refresh documents
      console.log('Refreshing documents...');
      await loadInitialData();

      // Close modal and reset form
      setShowUploadModal(false);
      setSelectedFile(null);
      setNewDocTitle('');
      setNewDocContent('');
      setNewDocSummary('');
      setNewDocTags('');
      
      alert('Document submitted successfully! It will be visible once approved by an administrator.');

    } catch (err) {
      console.error('=== Upload Error ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError(`Failed to upload: ${err.message}`);
      alert(`Failed to upload document: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // NEW: Handle Edit Document
  const handleEditDocument = (doc) => {
    setEditingDocument(doc);
    setNewDocTitle(doc.title);
    setNewDocContent(doc.content);
    setNewDocSummary(doc.summary || '');
    setNewDocCategory(doc.category_id || '');
    setShowEditModal(true);
  };

  // NEW: Submit Edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    if (!newDocTitle || !newDocContent) {
      alert('Please fill in title and content');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const updates = {
        title: newDocTitle,
        content: newDocContent,
        summary: newDocSummary || null,
        category_id: newDocCategory,
      };

      const { data, error: updateError } = await updateDocument(editingDocument.id, updates);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update document');
      }

      // Refresh documents
      await loadInitialData();

      // Close modal and reset
      setShowEditModal(false);
      setEditingDocument(null);
      setNewDocTitle('');
      setNewDocContent('');
      setNewDocSummary('');
      
      alert('Document updated successfully!');

    } catch (err) {
      console.error('Update error:', err);
      setError(`Failed to update: ${err.message}`);
      alert(`Failed to update document: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (doc) => {
    try {
      // Get full document details with comments and attachments
      const { data, error } = await getDocumentById(doc.id, userId);
      
      if (error) {
        console.error('Error fetching document:', error);
        setSelectedDocument(doc);
      } else {
        console.log('Document data with attachments:', data);
        setSelectedDocument(data || doc);
      }
      
      setShowDocumentViewer(true);
    } catch (err) {
      console.error('Error viewing document:', err);
      setSelectedDocument(doc);
      setShowDocumentViewer(true);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const handleDeleteDocument = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      const { error } = await deleteDocument(documentToDelete.id);
      
      if (error) {
        throw error;
      }

      // Remove from local state
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      alert('Document deleted successfully');

    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete document');
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      // Track download
      await trackDocumentDownload(doc.id, userId);
      
      // Check if document has attachments
      if (doc.attachments && doc.attachments.length > 0) {
        // Download the first attachment
        const attachment = doc.attachments[0];
        
        const supabaseModule = await import('../lib/supabaseClient');
        const supabase = supabaseModule.supabase;
        
        // Get download URL
        const { data: fileData, error } = await supabase.storage
          .from('document-attachments')
          .download(attachment.file_path);
        
        if (error) throw error;
        
        // Create download link
        const url = URL.createObjectURL(fileData);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // No attachment, download content as text file
        const blob = new Blob([doc.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${doc.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
  
      // Refresh stats
      await loadInitialData();
      
      alert('Download complete!');
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download document: ' + err.message);
    }
  };

  // NEW: Show Version History
  const handleShowVersionHistory = (doc) => {
    setSelectedDocument(doc);
    setShowVersionHistory(true);
  };

  const handleAddComment = async (comment) => {
    // This would need a comment creation function
    // For now, we'll skip this since we need to add it to the service
    console.log('Add comment:', comment);
    alert('Comment functionality needs to be implemented in your API service');
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.category && doc.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statsDisplay = [
    { icon: FileText, label: 'Total Documents', value: stats.totalDocuments.toString(), color: '#2563eb' },
    { icon: Users, label: 'Active Users', value: stats.activeUsers.toString(), color: '#10b981' },
    { icon: TrendingUp, label: 'Documents This Month', value: stats.documentsThisMonth.toString(), color: '#f59e0b' },
    { icon: Clock, label: 'Recent Uploads', value: stats.recentUploads.toString(), color: '#8b5cf6' }
  ];

  if (loading) {
    return (
      <div className="home-container">
        <div className="home-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #f3f4f6', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <div>
            <h1 className="home-title">Welcome to KMS</h1>
            <p className="home-subtitle">Manage and access your documents efficiently</p>
          </div>
          <div className="header-actions">
            <button className="action-btn primary" onClick={() => setShowUploadModal(true)}>
              <Upload size={20} />
              Upload Document
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar">
            <Search className="search-icon-home" size={20} />
            <input
              type="text"
              placeholder="Search documents by name, category, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-home"
            />
          </div>
        </div>

        <div className="stats-grid">
          {statsDisplay.map((stat, index) => (
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
            {filteredDocuments.length > 0 ? (
              filteredDocuments.slice(0, 5).map((doc) => (
                <div key={doc.id} className="recent-doc-card">
                  <div className="recent-doc-icon">
                    <FileText size={20} />
                  </div>
                  <div className="recent-doc-content">
                    <h4 className="recent-doc-name">{doc.title}</h4>
                    <div className="recent-doc-meta">
                      {doc.category && <span className="doc-category">{doc.category.name}</span>}
                      <span>•</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{doc.views_count || 0} views</span>
                    </div>
                  </div>
                  <div className="doc-actions">
                    <button 
                      className="icon-btn" 
                      onClick={() => handleViewDocument(doc)}
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      className="icon-btn"
                      onClick={() => handleDownloadDocument(doc)}
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    {(userRole === 'admin' || doc.created_by === userId) && (
                      <>
                        <button 
                          className="icon-btn" 
                          onClick={() => handleEditDocument(doc)}
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          className="icon-btn danger" 
                          onClick={() => handleDeleteDocument(doc)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                No documents found. Upload your first document to get started!
              </p>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Upload Document</h2>
                <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Enter document title"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Content *</label>
                  <textarea
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Enter document content"
                    className="form-input"
                    rows="5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Summary</label>
                  <textarea
                    value={newDocSummary}
                    onChange={(e) => setNewDocSummary(e.target.value)}
                    placeholder="Brief summary of the document"
                    className="form-input"
                    rows="2"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    value={newDocCategory} 
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="form-select"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Attach File (Optional)</label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="file-input"
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={uploading}>
                    <Upload size={16} />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Edit Document</h2>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitEdit}>
                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Enter document title"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Content *</label>
                  <textarea
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Enter document content"
                    className="form-input"
                    rows="5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Summary</label>
                  <textarea
                    value={newDocSummary}
                    onChange={(e) => setNewDocSummary(e.target.value)}
                    placeholder="Brief summary of the document"
                    className="form-input"
                    rows="2"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    value={newDocCategory} 
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="form-select"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={() => setShowEditModal(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={uploading}>
                    <Edit3 size={16} />
                    {uploading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {showDocumentViewer && selectedDocument && (
          <DocumentViewer
            document={selectedDocument}
            onClose={() => setShowDocumentViewer(false)}
            onAddComment={handleAddComment}
            onDownload={handleDownloadDocument}
          />
        )}

        {/* Version History Modal */}
        {showVersionHistory && selectedDocument && (
          <VersionHistoryModal
            document={selectedDocument}
            onClose={() => setShowVersionHistory(false)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && documentToDelete && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title delete-title">
                  <Trash2 size={20} />
                  Delete Document
                </h2>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="delete-modal-body">
                <p className="delete-message">
                  Are you sure you want to delete <strong>"{documentToDelete.title}"</strong>?
                </p>
                <p className="delete-warning">
                  This action cannot be undone. The document and all its attachments will be permanently deleted.
                </p>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-delete" 
                  onClick={confirmDelete}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentViewer({ document, onClose, onAddComment, onDownload }) {
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    // Load attachments from the document data or fetch them
    if (document.attachments && document.attachments.length > 0) {
      loadAttachmentsUrls(document.attachments);
    }
  }, [document.id]);

  const loadAttachmentsUrls = async (attachmentsData) => {
    setLoadingAttachments(true);
    try {
      const supabaseModule = await import('../lib/supabaseClient');
      const supabase = supabaseModule.supabase;
      
      // Add public URLs to attachments
      const attachmentsWithUrls = attachmentsData.map(attachment => {
        const { data: urlData } = supabase.storage
          .from('document-attachments')
          .getPublicUrl(attachment.file_path);

        return {
          ...attachment,
          url: urlData.publicUrl
        };
      });

      setAttachments(attachmentsWithUrls);
      console.log('Attachments loaded:', attachmentsWithUrls);
    } catch (err) {
      console.error('Error loading attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(comment);
      setComment('');
    }
  };

  const handleOpenAttachment = (url) => {
    window.open(url, '_blank');
  };

  const getFileExtension = (fileName) => {
    if (!fileName) return '';
    return fileName.split('.').pop().toLowerCase();
  };

  const getFileIcon = (fileName) => {
    const ext = getFileExtension(fileName);
    
    // Document types
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📽️';
    if (['txt'].includes(ext)) return '📃';
    
    // Image types
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
    
    // Archive types
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️';
    
    // Video types
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) return '🎬';
    
    // Audio types
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return '🎵';
    
    // Code types
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(ext)) return '💻';
    
    // Default
    return '📎';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{document.title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="viewer-content">
          <div className="viewer-meta">
            {document.category && <span className="meta-badge">{document.category.name}</span>}
            <span className="meta-text">{new Date(document.created_at).toLocaleDateString()}</span>
            <span className="meta-text">{document.views_count || 0} views</span>
          </div>
          
          {document.summary && (
            <div className="document-summary">
              <strong>Summary:</strong> {document.summary}
            </div>
          )}

          {/* Attachments Section */}
          {attachments.length > 0 && (
            <div className="attachments-section">
              <div className="attachments-header">
                <FileText size={20} />
                <strong>Attached Files ({attachments.length}):</strong>
              </div>

              {loadingAttachments && (
                <div className="loading-attachments">
                  Loading attachments...
                </div>
              )}

              {!loadingAttachments && attachments.map((attachment) => {
                const fileExt = getFileExtension(attachment.file_name);
                const isPDF = fileExt === 'pdf';
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(fileExt);
                const isVideo = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(fileExt);
                const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(fileExt);
                const fileIcon = getFileIcon(attachment.file_name);

                return (
                  <div key={attachment.id} className="attachment-item">
                    <div className="attachment-info">
                      <div className="attachment-details">
                        <span className="file-icon">{fileIcon}</span>
                        <div>
                          <div className="file-name">{attachment.file_name}</div>
                          <div className="file-meta">
                            {fileExt.toUpperCase()} • {(attachment.file_size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>
                      <button 
                        className="action-btn-sm" 
                        onClick={() => handleOpenAttachment(attachment.url)}
                      >
                        <Download size={16} />
                        Open
                      </button>
                    </div>

                    {/* Display PDF inline */}
                    {isPDF && attachment.url && (
                      <div className="file-preview">
                        <iframe
                          src={attachment.url}
                          className="pdf-viewer"
                          title={attachment.file_name}
                        />
                      </div>
                    )}

                    {/* Display Image inline */}
                    {isImage && attachment.url && (
                      <div className="file-preview image-preview">
                        <img 
                          src={attachment.url} 
                          alt={attachment.file_name}
                          className="image-viewer"
                        />
                      </div>
                    )}

                    {/* Display Video inline */}
                    {isVideo && attachment.url && (
                      <div className="file-preview">
                        <video 
                          controls
                          className="video-viewer"
                        >
                          <source src={attachment.url} type={attachment.mime_type} />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {/* Display Audio inline */}
                    {isAudio && attachment.url && (
                      <div className="file-preview">
                        <audio 
                          controls
                          className="audio-viewer"
                        >
                          <source src={attachment.url} type={attachment.mime_type} />
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Text Content */}
          <div className="viewer-body">
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>Content:</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{document.content}</p>
          </div>

          <div className="viewer-actions">
            <button className="action-btn-sm" onClick={() => onDownload(document)}>
              <Download size={16} />
              Download Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VersionHistoryModal({ document, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <History size={20} style={{ marginRight: '0.5rem' }} />
            Version History - {document.title}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <History size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Version history feature coming soon!</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              This will show all previous versions of this document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}