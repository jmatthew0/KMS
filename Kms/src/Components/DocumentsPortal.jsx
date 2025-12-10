import React, { useState, useRef, useEffect } from 'react';
import '../Css/DocumentsPortal.css';
import { 
  Search, Upload, FileText, Download, Eye, 
  Edit3, Trash2, X
} from 'lucide-react';
import { 
  getPublishedDocuments,
  getPendingDocuments,
  deleteDocument,
  getDocumentById,
  trackDocumentDownload,
  createDocument,
  approveDocument,
  rejectDocument
} from '../api/documentsService';
import { getAllCategories } from '../api/categoriesService';
import { uploadFile as uploadFileToStorage } from '../api/fileUploadService';
import { supabase } from '../lib/supabaseClient';

export default function DocumentsPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [publishedDocuments, setPublishedDocuments] = useState([]);
  const [rejectedDocuments, setRejectedDocuments] = useState([]);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Approve / Reject modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [documentToReview, setDocumentToReview] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Upload form states
  const [selectedFile, setSelectedFile] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocSummary, setNewDocSummary] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole'); // 'admin' or 'user'

  useEffect(() => {
    loadDocuments();
    loadCategories();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (userRole === 'admin') {
        // Admin: load pending, published, and rejected
        const [{ data: pendingData, error: pendingError }, 
               { data: publishedData, error: publishedError }] = await Promise.all([
          getPendingDocuments(),
          getPublishedDocuments()
        ]);

        if (pendingError) throw pendingError;
        if (publishedError) throw publishedError;

        // Rejected docs (direct query)
        const { data: rejectedData, error: rejectedError } = await supabase
          .from('documents')
          .select(`
            *,
            category:categories(id, name, color),
            creator:profiles!documents_created_by_fkey(id, full_name, email)
          `)
          .eq('status', 'rejected')
          .order('created_at', { ascending: false });

        if (rejectedError) throw rejectedError;

        setPendingDocuments(pendingData || []);
        setPublishedDocuments(publishedData || []);
        setRejectedDocuments(rejectedData || []);
      } else {
        // Regular user: only published docs
        const { data, error: fetchError } = await getPublishedDocuments();
        if (fetchError) throw fetchError;
        setPublishedDocuments(data || []);
        setPendingDocuments([]);
        setRejectedDocuments([]);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error: fetchError } = await getAllCategories();
      if (fetchError) throw fetchError;
      
      setCategories(data || []);
      if (data && data.length > 0) {
        setNewDocCategory(data[0].id);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
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
      // Ensure new docs go to pending approval
      const newDoc = {
        title: newDocTitle,
        content: newDocContent,
        summary: newDocSummary || null,
        category_id: newDocCategory,
        status: 'pending_approval',
        is_published: false,
        created_by: userId
      };

      const { data: createdDoc, error: createError } = await createDocument(newDoc);
      if (createError) {
        throw new Error(createError.message || 'Failed to create document');
      }

      // Upload file if provided
      if (selectedFile && createdDoc?.id) {
        const fileResult = await uploadFileToStorage(selectedFile, userId, createdDoc.id);
        if (fileResult.error) {
          console.error('File upload failed:', fileResult.error);
          alert('Document created but file upload failed: ' + fileResult.error.message);
        }
      }

      await loadDocuments();

      setShowUploadModal(false);
      setSelectedFile(null);
      setNewDocTitle('');
      setNewDocContent('');
      setNewDocSummary('');
      
      alert('Document submitted successfully! It will be visible once approved by an administrator.');

    } catch (err) {
      console.error('Upload error:', err);
      setError(`Failed to upload: ${err.message}`);
      alert(`Failed to upload document: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (doc) => {
    try {
      const { data, error } = await getDocumentById(doc.id, userId);
      
      if (error) {
        console.error('Error fetching document:', error);
        setSelectedDocument(doc);
      } else {
        setSelectedDocument(data || doc);
      }
      
      setShowViewModal(true);
    } catch (err) {
      console.error('Error viewing document:', err);
      setSelectedDocument(doc);
      setShowViewModal(true);
    }
  };

  const handleDownload = async (doc) => {
    try {
      await trackDocumentDownload(doc.id, userId);
      
      if (doc.attachments && doc.attachments.length > 0) {
        const attachment = doc.attachments[0];
        
        const supabaseModule = await import('../lib/supabaseClient');
        const supabaseClient = supabaseModule.supabase;
        
        const { data: fileData, error } = await supabaseClient.storage
          .from('document-attachments')
          .download(attachment.file_path);
        
        if (error) throw error;
        
        const url = URL.createObjectURL(fileData);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([doc.content || ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${doc.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
  
      await loadDocuments();
      alert('Download complete!');
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download document: ' + err.message);
    }
  };

  const handleDelete = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      setError('');
      
      const { error: deleteError } = await deleteDocument(documentToDelete.id);
      if (deleteError) {
        throw new Error(deleteError.message || 'Failed to delete document');
      }

      await loadDocuments();
      
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      
      alert('Document deleted successfully!');
      
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete document: ${err.message}`);
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filterDocuments = (docs) => {
    return (docs || []).filter(doc => {
      const matchesSearch =
        doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' ||
        (doc.category && doc.category.id === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  };

  const filteredPending = filterDocuments(pendingDocuments);
  const filteredPublished = filterDocuments(publishedDocuments);
  const filteredRejected = filterDocuments(rejectedDocuments);

  // Approve / Reject handlers
  const openApproveModal = (doc) => {
    setDocumentToReview(doc);
    setShowApproveModal(true);
  };

  const openRejectModal = (doc) => {
    setDocumentToReview(doc);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmApprove = async () => {
    if (!documentToReview) return;

    try {
      const { error } = await approveDocument(documentToReview.id, userId);
      if (error) throw error;

      await loadDocuments();
      setShowApproveModal(false);
      setDocumentToReview(null);
      alert('Document approved and published successfully!');
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve document: ' + err.message);
    }
  };

  const confirmReject = async () => {
    if (!documentToReview) return;

    try {
      const { error } = await rejectDocument(documentToReview.id, rejectReason || null);
      if (error) throw error;

      await loadDocuments();
      setShowRejectModal(false);
      setDocumentToReview(null);
      setRejectReason('');
      alert('Document rejected.');
    } catch (err) {
      console.error('Reject error:', err);
      alert('Failed to reject document: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="documents-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="documents-container">
      <div className="documents-header">
        <div className="header-content">
          <h1 className="documents-title">Documents Portal</h1>
          <p className="documents-subtitle">
            {userRole === 'admin'
              ? 'Review, approve, and manage all knowledge assets.'
              : 'Access and manage your documents.'}
          </p>
        </div>
      </div>

      <div className="main-content">
        <div className="content-wrapper">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Search & Upload */}
          <div className="search-section">
            <div className="search-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="upload-button" onClick={handleUploadClick}>
              <Upload size={18} />
              Upload
            </button>
          </div>

          {/* Category Filter */}
          <div className="filter-section">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`filter-button ${selectedCategory === 'all' ? 'filter-button-active' : ''}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`filter-button ${selectedCategory === cat.id ? 'filter-button-active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Admin: Pending for Approval */}
          {userRole === 'admin' && (
            <section className="documents-section">
              <div className="section-header">
                <h2 className="section-title">Pending for Approval</h2>
                <p className="section-subtitle">
                  Documents submitted by users that need your review.
                </p>
              </div>

              <div className="documents-grid">
                {filteredPending.length > 0 ? (
                  filteredPending.map(doc => (
                    <div key={doc.id} className="document-card pending-card">
                      <div className="card-header">
                        <FileText size={24} className="file-icon" />
                        <span className={`status-badge ${doc.status || 'pending_approval'}`}>
                          {doc.status ? doc.status.replace('_', ' ') : 'pending approval'}
                        </span>
                      </div>
                      <h3 className="document-name">{doc.title}</h3>
                      <div className="document-meta">
                        <span className="meta-item">{doc.category?.name || 'Uncategorized'}</span>
                      </div>
                      {doc.summary && (
                        <p className="document-summary">{doc.summary.substring(0, 100)}...</p>
                      )}
                      <div className="document-footer">
                        <div className="footer-left">
                          <span className="uploaded-by">
                            {doc.creator?.full_name || 'Unknown'}
                          </span>
                          <span className="uploaded-date">{formatDate(doc.created_at)}</span>
                        </div>
                        <div className="footer-right">
                          <div className="views">
                            <Eye size={14} />
                            <span>{doc.views_count || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button className="action-button" onClick={() => handleView(doc)}>
                          <Eye size={18} />
                          View
                        </button>
                        <button className="action-button" onClick={() => handleDownload(doc)}>
                          <Download size={18} />
                          Download
                        </button>
                        <button 
                          className="action-button approve-button" 
                          onClick={() => openApproveModal(doc)}
                        >
                          Approve
                        </button>
                        <button 
                          className="action-button reject-button" 
                          onClick={() => openRejectModal(doc)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-documents subtle">
                    <FileText size={32} />
                    <p>No documents awaiting approval.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Published Documents */}
          <section className="documents-section">
            <div className="section-header">
              <h2 className="section-title">Published Documents</h2>
            </div>

            <div className="documents-grid">
              {filteredPublished.length > 0 ? (
                filteredPublished.map(doc => (
                  <div key={doc.id} className="document-card">
                    <div className="card-header">
                      <FileText size={24} className="file-icon" />
                      {userRole === 'admin' && (
                        <span className={`status-badge ${doc.status || 'approved'}`}>
                          {(doc.status || 'approved').replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <h3 className="document-name">{doc.title}</h3>
                    <div className="document-meta">
                      <span className="meta-item">{doc.category?.name || 'Uncategorized'}</span>
                    </div>
                    {doc.summary && (
                      <p className="document-summary">{doc.summary.substring(0, 100)}...</p>
                    )}
                    <div className="document-footer">
                      <div className="footer-left">
                        <span className="uploaded-by">
                          {doc.creator?.full_name || 'Unknown'}
                        </span>
                        <span className="uploaded-date">{formatDate(doc.created_at)}</span>
                      </div>
                      <div className="footer-right">
                        <div className="views">
                          <Eye size={14} />
                          <span>{doc.views_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button className="action-button" onClick={() => handleView(doc)}>
                        <Eye size={18} />
                        View
                      </button>
                      <button className="action-button" onClick={() => handleDownload(doc)}>
                        <Download size={18} />
                        Download
                      </button>
                      {(userRole === 'admin' || doc.created_by === userId) && (
                        <button 
                          className="action-button delete-button" 
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-documents">
                  <FileText size={48} />
                  <p>No published documents found.</p>
                </div>
              )}
            </div>
          </section>

          {/* Admin: Rejected Documents */}
          {userRole === 'admin' && (
            <section className="documents-section">
              <div className="section-header">
                <h2 className="section-title">Rejected Documents</h2>
                <p className="section-subtitle">
                  Documents that were reviewed and not approved.
                </p>
              </div>

              <div className="documents-grid">
                {filteredRejected.length > 0 ? (
                  filteredRejected.map(doc => (
                    <div key={doc.id} className="document-card rejected-card">
                      <div className="card-header">
                        <FileText size={24} className="file-icon" />
                        <span className={`status-badge ${doc.status || 'rejected'}`}>
                          {(doc.status || 'rejected').replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="document-name">{doc.title}</h3>
                      <div className="document-meta">
                        <span className="meta-item">{doc.category?.name || 'Uncategorized'}</span>
                      </div>
                      {doc.summary && (
                        <p className="document-summary">{doc.summary.substring(0, 100)}...</p>
                      )}
                      <div className="document-footer">
                        <div className="footer-left">
                          <span className="uploaded-by">
                            {doc.creator?.full_name || 'Unknown'}
                          </span>
                          <span className="uploaded-date">{formatDate(doc.created_at)}</span>
                        </div>
                        <div className="footer-right">
                          <div className="views">
                            <Eye size={14} />
                            <span>{doc.views_count || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button className="action-button" onClick={() => handleView(doc)}>
                          <Eye size={18} />
                          View
                        </button>
                        <button className="action-button" onClick={() => handleDownload(doc)}>
                          <Download size={18} />
                          Download
                        </button>
                        {(userRole === 'admin' || doc.created_by === userId) && (
                          <button 
                            className="action-button delete-button" 
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-documents subtle">
                    <FileText size={32} />
                    <p>No rejected documents.</p>
                  </div>
                )}
              </div>
            </section>
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
            <form onSubmit={handleUploadSubmit}>
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
                <label className="form-label">Category *</label>
                <select 
                  value={newDocCategory} 
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className="form-select"
                  required
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
                  onChange={handleFileSelect}
                  className="file-input"
                  ref={fileInputRef}
                />
                {selectedFile && (
                  <p className="file-selected">Selected: {selectedFile.name}</p>
                )}
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

      {/* View Modal */}
      {showViewModal && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setShowViewModal(false)}
          onDownload={handleDownload}
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

      {/* Approve Modal (Admin) */}
      {showApproveModal && documentToReview && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Approve Document
              </h2>
              <button className="modal-close" onClick={() => setShowApproveModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="delete-modal-body">
              <p className="delete-message">
                Are you sure you want to approve and publish <strong>"{documentToReview.title}"</strong>?
              </p>
              <p className="delete-warning">
                This will make the document visible to all users.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-submit" 
                onClick={confirmApprove}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal (Admin) */}
      {showRejectModal && documentToReview && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Reject Document
              </h2>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="delete-modal-body">
              <p className="delete-message">
                Are you sure you want to reject <strong>"{documentToReview.title}"</strong>?
              </p>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Rejection Reason (optional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-delete" 
                onClick={confirmReject}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Document Viewer Component
function DocumentViewer({ document, onClose, onDownload }) {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    if (document.attachments && document.attachments.length > 0) {
      loadAttachmentsUrls(document.attachments);
    }
  }, [document.id]);

  const loadAttachmentsUrls = async (attachmentsData) => {
    setLoadingAttachments(true);
    try {
      const supabaseModule = await import('../lib/supabaseClient');
      const supabaseClient = supabaseModule.supabase;
      
      const attachmentsWithUrls = attachmentsData.map(attachment => {
        const { data: urlData } = supabaseClient.storage
          .from('document-attachments')
          .getPublicUrl(attachment.file_path);

        return {
          ...attachment,
          url: urlData.publicUrl
        };
      });

      setAttachments(attachmentsWithUrls);
    } catch (err) {
      console.error('Error loading attachments:', err);
    } finally {
      setLoadingAttachments(false);
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
    
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📽️';
    if (['txt'].includes(ext)) return '📃';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) return '🎬';
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return '🎵';
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(ext)) return '💻';
    
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

                    {isPDF && attachment.url && (
                      <div className="file-preview">
                        <iframe
                          src={attachment.url}
                          className="pdf-viewer"
                          title={attachment.file_name}
                        />
                      </div>
                    )}

                    {isImage && attachment.url && (
                      <div className="file-preview image-preview">
                        <img 
                          src={attachment.url} 
                          alt={attachment.file_name}
                          className="image-viewer"
                        />
                      </div>
                    )}

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

          <div className="viewer-body">
            <h3>Content:</h3>
            <p>{document.content}</p>
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
