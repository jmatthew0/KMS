import React, { useState } from 'react';
import '../Css/Home.css';
import { 
  FileText, TrendingUp, Users, Clock, Upload, Eye, 
  Edit3, Trash2, History, Search, MessageSquare, X, Download
} from 'lucide-react';

export default function Home({ onNavigateToDocuments }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [newDocCategory, setNewDocCategory] = useState('General');
  const [newDocTags, setNewDocTags] = useState('');

  const stats = [
    { icon: FileText, label: 'Total Documents', value: '1,234', color: '#2563eb' },
    { icon: Users, label: 'Active Users', value: '89', color: '#10b981' },
    { icon: TrendingUp, label: 'Documents This Month', value: '156', color: '#f59e0b' },
    { icon: Clock, label: 'Recent Uploads', value: '23', color: '#8b5cf6' }
  ];

  const [documents, setDocuments] = useState([
    { 
      id: 1,
      name: 'Q4 Financial Report.pdf', 
      date: '2025-01-15', 
      category: 'Finance',
      tags: ['quarterly', 'report'],
      content: 'Q4 Financial Report content...',
      versions: [
        { version: '1.0', date: '2025-01-15', author: 'John Doe' }
      ],
      comments: []
    },
    { 
      id: 2,
      name: 'Employee Handbook 2025.docx', 
      date: '2025-01-10', 
      category: 'HR',
      tags: ['handbook', 'policies'],
      content: 'Employee Handbook content...',
      versions: [
        { version: '1.0', date: '2025-01-10', author: 'Jane Smith' }
      ],
      comments: []
    },
    { 
      id: 3,
      name: 'Marketing Strategy.pptx', 
      date: '2025-01-08', 
      category: 'Marketing',
      tags: ['strategy', '2025'],
      content: 'Marketing Strategy content...',
      versions: [
        { version: '1.0', date: '2025-01-08', author: 'Mike Johnson' }
      ],
      comments: []
    }
  ]);

  const categories = ['General', 'Finance', 'HR', 'Marketing', 'Product', 'IT', 'Training'];

  const handleUpload = (e) => {
    e.preventDefault();
    if (uploadFile) {
      const newDoc = {
        id: documents.length + 1,
        name: uploadFile.name,
        date: new Date().toISOString().split('T')[0],
        category: newDocCategory,
        tags: newDocTags.split(',').map(tag => tag.trim()),
        content: `Uploaded file: ${uploadFile.name}`,
        versions: [
          { version: '1.0', date: new Date().toISOString().split('T')[0], author: 'Current User' }
        ],
        comments: []
      };
      setDocuments([newDoc, ...documents]);
      setShowUploadModal(false);
      setUploadFile(null);
      setNewDocCategory('General');
      setNewDocTags('');
    }
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowDocumentViewer(true);
  };

  const handleDeleteDocument = (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== docId));
    }
  };

  const handleAddComment = (comment) => {
    if (selectedDocument && comment.trim()) {
      const updatedDocs = documents.map(doc => {
        if (doc.id === selectedDocument.id) {
          return {
            ...doc,
            comments: [...doc.comments, {
              text: comment,
              author: 'Current User',
              date: new Date().toISOString()
            }]
          };
        }
        return doc;
      });
      setDocuments(updatedDocs);
      setSelectedDocument({
        ...selectedDocument,
        comments: [...selectedDocument.comments, {
          text: comment,
          author: 'Current User',
          date: new Date().toISOString()
        }]
      });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            {filteredDocuments.slice(0, 5).map((doc) => (
              <div key={doc.id} className="recent-doc-card">
                <div className="recent-doc-icon">
                  <FileText size={20} />
                </div>
                <div className="recent-doc-content">
                  <h4 className="recent-doc-name">{doc.name}</h4>
                  <div className="recent-doc-meta">
                    <span className="doc-category">{doc.category}</span>
                    <span>•</span>
                    <span>{doc.date}</span>
                    {doc.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="doc-tags">
                          {doc.tags.map((tag, idx) => (
                            <span key={idx} className="doc-tag">#{tag}</span>
                          ))}
                        </div>
                      </>
                    )}
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
                    onClick={() => {
                      setSelectedDocument(doc);
                      setShowVersionHistory(true);
                    }}
                    title="Version History"
                  >
                    <History size={18} />
                  </button>
                  <button className="icon-btn" title="Edit">
                    <Edit3 size={18} />
                  </button>
                  <button 
                    className="icon-btn danger" 
                    onClick={() => handleDeleteDocument(doc.id)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
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
                  <label className="form-label">Select File</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="file-input"
                    required
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
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newDocTags}
                    onChange={(e) => setNewDocTags(e.target.value)}
                    placeholder="e.g. report, quarterly, 2025"
                    className="form-input"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    <Upload size={16} />
                    Upload
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
          />
        )}

        {/* Version History Modal */}
        {showVersionHistory && selectedDocument && (
          <VersionHistory
            document={selectedDocument}
            onClose={() => setShowVersionHistory(false)}
          />
        )}
      </div>
    </div>
  );
}

function DocumentViewer({ document, onClose, onAddComment }) {
  const [comment, setComment] = useState('');

  const handleSubmitComment = (e) => {
    e.preventDefault();
    onAddComment(comment);
    setComment('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{document.name}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="viewer-content">
          <div className="viewer-meta">
            <span className="meta-badge">{document.category}</span>
            <span className="meta-text">{document.date}</span>
            <div className="doc-tags">
              {document.tags.map((tag, idx) => (
                <span key={idx} className="doc-tag">#{tag}</span>
              ))}
            </div>
          </div>
          <div className="viewer-body">
            <p>{document.content}</p>
          </div>
          <div className="viewer-actions">
            <button className="action-btn-sm">
              <Download size={16} />
              Download
            </button>
            <button className="action-btn-sm">
              <Edit3 size={16} />
              Edit
            </button>
          </div>
          
          <div className="comments-section">
            <h3 className="comments-title">Comments & Feedback</h3>
            <div className="comments-list">
              {document.comments.length > 0 ? (
                document.comments.map((comment, idx) => (
                  <div key={idx} className="comment-item">
                    <div className="comment-header">
                      <strong>{comment.author}</strong>
                      <span className="comment-date">{new Date(comment.date).toLocaleDateString()}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="no-comments">No comments yet. Be the first to comment!</p>
              )}
            </div>
            <form onSubmit={handleSubmitComment} className="comment-form">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="comment-input"
                rows="3"
              />
              <button type="submit" className="btn-submit">
                <MessageSquare size={16} />
                Post Comment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function VersionHistory({ document, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Version History</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="version-list">
          {document.versions.map((version, idx) => (
            <div key={idx} className="version-item">
              <div className="version-icon">
                <History size={18} />
              </div>
              <div className="version-info">
                <div className="version-number">Version {version.version}</div>
                <div className="version-meta">
                  <span>{version.author}</span>
                  <span>•</span>
                  <span>{version.date}</span>
                </div>
              </div>
              <button className="action-btn-sm">
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}