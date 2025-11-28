import React, { useState, useRef } from 'react';
import '../Css/DocumentsPortal.css';
import { Search, Upload, FileText, Download, Eye, Star } from 'lucide-react';

export default function DocumentsPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef(null);

  const [documents] = useState([
    {
      id: 1,
      name: 'Q4 Financial Report.pdf',
      category: 'Finance',
      size: '2.4 MB',
      uploadedBy: 'John Doe',
      uploadedDate: '2025-01-15',
      starred: true,
      views: 45
    },
    {
      id: 2,
      name: 'Employee Handbook 2025.docx',
      category: 'HR',
      size: '1.8 MB',
      uploadedBy: 'Sarah Smith',
      uploadedDate: '2025-01-10',
      starred: false,
      views: 123
    },
    {
      id: 3,
      name: 'Marketing Strategy.pptx',
      category: 'Marketing',
      size: '5.2 MB',
      uploadedBy: 'Mike Johnson',
      uploadedDate: '2025-01-08',
      starred: true,
      views: 67
    },
    {
      id: 4,
      name: 'Product Roadmap 2025.xlsx',
      category: 'Product',
      size: '890 KB',
      uploadedBy: 'Emily Davis',
      uploadedDate: '2025-01-05',
      starred: false,
      views: 89
    },
    {
      id: 5,
      name: 'IT Security Policy.pdf',
      category: 'IT',
      size: '1.2 MB',
      uploadedBy: 'David Lee',
      uploadedDate: '2025-01-03',
      starred: false,
      views: 156
    },
    {
      id: 6,
      name: 'Training Materials.zip',
      category: 'Training',
      size: '15.6 MB',
      uploadedBy: 'Lisa Chen',
      uploadedDate: '2024-12-28',
      starred: true,
      views: 234
    }
  ]);

  const categories = ['all', 'Finance', 'HR', 'Marketing', 'Product', 'IT', 'Training'];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      console.log('Selected files:', files);
      // Here you can handle the file upload logic
      Array.from(files).forEach(file => {
        console.log('File name:', file.name);
        console.log('File size:', file.size);
        console.log('File type:', file.type);
      });
      alert(`Selected ${files.length} file(s) for upload`);
      // Add your upload logic here (e.g., send to server)
    }
  };

  const handleView = (doc) => {
    console.log('View document:', doc);
    alert(`Viewing: ${doc.name}`);
    // Add your view logic here
  };

  const handleDownload = (doc) => {
    console.log('Download document:', doc);
    alert(`Downloading: ${doc.name}`);
    // Add your download logic here
  };

  return (
    <div className="documents-container">
      <div className="documents-header">
        <div className="header-content">
          <h1 className="documents-title">Documents Portal</h1>
          <p className="documents-subtitle">Access and manage your documents</p>
        </div>
      </div>

      <div className="main-content">
        <div className="content-wrapper">
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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
              accept="*/*"
            />
            <button className="upload-button" onClick={handleUpload}>
              <Upload size={18} />
              Upload
            </button>
          </div>

          <div className="filter-section">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`filter-button ${selectedCategory === cat ? 'filter-button-active' : ''}`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="documents-grid">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className="document-card">
                <div className="card-header">
                  <FileText size={24} className="file-icon" />
                  {doc.starred && <Star size={16} className="star-icon" fill="#fbbf24" stroke="#fbbf24" />}
                </div>
                <h3 className="document-name">{doc.name}</h3>
                <div className="document-meta">
                  <span className="meta-item">{doc.size}</span>
                  <span className="meta-divider">•</span>
                  <span className="meta-item">{doc.category}</span>
                </div>
                <div className="document-footer">
                  <div className="footer-left">
                    <span className="uploaded-by">{doc.uploadedBy}</span>
                    <span className="uploaded-date">{doc.uploadedDate}</span>
                  </div>
                  <div className="footer-right">
                    <div className="views">
                      <Eye size={14} />
                      <span>{doc.views}</span>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}