import React, { useState, useEffect } from "react";
import "../Css/Home.css";
import "../Css/Modals.css"; // ✅ make sure Modals.css contains ALL modal styles

import {
  FileText,
  TrendingUp,
  Users,
  Clock,
  Upload,
  Eye,
  Edit3,
  Trash2,
  Search,
  Download,
} from "lucide-react";

import {
  getPublishedDocuments,
  deleteDocument,
  getDocumentById,
  trackDocumentDownload,
  createDocument,
  updateDocument,
  getPendingDocuments, // ✅ make sure this exists in documentsService
} from "../api/documentsService";

import { getAllCategories } from "../api/categoriesService";
import { uploadFile as uploadFileToStorage } from "../api/fileUploadService";
import { getDashboardOverview } from "../api/analyticsService";

// ✅ Separated modals
import UploadDocumentModal from "./modals/UploadDocumentModal";
import EditDocumentModal from "./modals/EditDocumentModal";
import DeleteDocumentModal from "./modals/DeleteDocumentModal";
import DocumentViewerModal from "./modals/DocumentViewerModal";
import VersionHistoryModal from "./modals/VersionHistoryModal";

export default function Home({ onNavigateToDocuments }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [newDocSummary, setNewDocSummary] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("");

  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [stats, setStats] = useState({
    totalDocuments: 0,
    activeUsers: 0,
    documentsThisMonth: 0,
    recentUploads: 0,
  });

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: statsData } = await getDashboardOverview();
      if (statsData) {
        setStats({
          totalDocuments: statsData.totalDocuments,
          activeUsers: statsData.totalUsers,
          documentsThisMonth: statsData.recentUploads,
          recentUploads: statsData.recentUploads,
        });
      }

      let docsData;
      if (userRole === "admin") {
        const { data } = await getPendingDocuments();
        docsData = data;
      } else {
        const { data } = await getPublishedDocuments();
        docsData = data;
      }
      setDocuments(docsData || []);

      const { data: categoriesData } = await getAllCategories();
      setCategories(categoriesData || []);
      if (categoriesData && categoriesData.length > 0) {
        setNewDocCategory(categoriesData[0].id);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setNewDocTitle("");
    setNewDocContent("");
    setNewDocSummary("");
    setNewDocCategory(categories?.[0]?.id || "");
  };

  // ✅ Upload handler
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!newDocTitle || !newDocContent) {
      alert("Please fill in title and content");
      return;
    }
    if (!userId) {
      alert("User not logged in. Please refresh and try again.");
      return;
    }
    if (!newDocCategory) {
      alert("Please select a category");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const newDoc = {
        title: newDocTitle,
        content: newDocContent,
        summary: newDocSummary || null,
        category_id: newDocCategory,
        status: "pending_approval",
        is_published: false,
        created_by: userId,
      };

      const { data: createdDoc, error: createError } = await createDocument(newDoc);
      if (createError) throw new Error(createError.message || "Failed to create document");
      if (!createdDoc) throw new Error("No document returned from creation");

      if (selectedFile) {
        const fileResult = await uploadFileToStorage(selectedFile, userId, createdDoc.id);
        if (fileResult?.error) {
          alert("Document created but file upload failed: " + fileResult.error.message);
        }
      }

      await loadInitialData();
      setShowUploadModal(false);
      resetForm();

      alert("Document submitted successfully! It will be visible once approved by an administrator.");
    } catch (err) {
      console.error("Upload error:", err);
      setError(`Failed to upload: ${err.message}`);
      alert(`Failed to upload document: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ✅ Edit open + submit
  const handleEditDocument = (doc) => {
    setEditingDocument(doc);
    setNewDocTitle(doc.title);
    setNewDocContent(doc.content);
    setNewDocSummary(doc.summary || "");
    setNewDocCategory(doc.category_id || "");
    setShowEditModal(true);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    if (!newDocTitle || !newDocContent) {
      alert("Please fill in title and content");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const updates = {
        title: newDocTitle,
        content: newDocContent,
        summary: newDocSummary || null,
        category_id: newDocCategory,
      };

      const { error: updateError } = await updateDocument(editingDocument.id, updates);
      if (updateError) throw new Error(updateError.message || "Failed to update document");

      await loadInitialData();
      setShowEditModal(false);
      setEditingDocument(null);
      resetForm();

      alert("Document updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      setError(`Failed to update: ${err.message}`);
      alert(`Failed to update document: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ✅ View
  const handleViewDocument = async (doc) => {
    try {
      const { data, error } = await getDocumentById(doc.id, userId);
      setSelectedDocument(error ? doc : data || doc);
      setShowDocumentViewer(true);
    } catch (err) {
      console.error("Error viewing document:", err);
      setSelectedDocument(doc);
      setShowDocumentViewer(true);
    }
  };

  // ✅ Delete
  const handleDeleteDocument = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      const { error } = await deleteDocument(documentToDelete.id);
      if (error) throw error;

      setDocuments(documents.filter((doc) => doc.id !== documentToDelete.id));
      setShowDeleteModal(false);
      setDocumentToDelete(null);

      alert("Document deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete document");
    }
  };

  // ✅ Download
  const handleDownloadDocument = async (doc) => {
    try {
      await trackDocumentDownload(doc.id, userId);

      if (doc.attachments && doc.attachments.length > 0) {
        const attachment = doc.attachments[0];
        const supabaseModule = await import("../lib/supabaseClient");
        const supabase = supabaseModule.supabase;

        const { data: fileData, error } = await supabase.storage
          .from("document-attachments")
          .download(attachment.file_path);

        if (error) throw error;

        const url = URL.createObjectURL(fileData);
        const link = document.createElement("a");
        link.href = url;
        link.download = attachment.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([doc.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${doc.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      await loadInitialData();
      alert("Download complete!");
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download document: " + err.message);
    }
  };

  const handleShowVersionHistory = (doc) => {
    setSelectedDocument(doc);
    setShowVersionHistory(true);
  };

  const handleAddComment = async (comment) => {
    console.log("Add comment:", comment);
    alert("Comment functionality needs to be implemented in your API service");
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.category && doc.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statsDisplay = [
    { icon: FileText, label: "Total Documents", value: stats.totalDocuments.toString(), theme: "blue" },
    { icon: Users, label: "Active Users", value: stats.activeUsers.toString(), theme: "green" },
    { icon: TrendingUp, label: "Documents This Month", value: stats.documentsThisMonth.toString(), theme: "amber" },
    { icon: Clock, label: "Recent Uploads", value: stats.recentUploads.toString(), theme: "purple" },
  ];

  if (loading) {
    return (
      <div className="home-container">
        <div className="home-content home-loading">
          <div className="home-loading-center">
            <div className="home-spinner" />
            <p className="home-loading-text">Loading...</p>
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
            <button className="action-btn primary" onClick={() => setShowUploadModal(true)} type="button">
              <Upload size={20} />
              Upload Document
            </button>
          </div>
        </div>

        {error && <div className="home-error">{error}</div>}

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
              <div className={`stat-icon stat-icon-${stat.theme}`}>
                <stat.icon size={24} className={`stat-icon-svg stat-icon-svg-${stat.theme}`} />
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
            <button className="view-all-button" onClick={onNavigateToDocuments} type="button">
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
                    <button className="icon-btn" onClick={() => handleViewDocument(doc)} title="View" type="button">
                      <Eye size={18} />
                    </button>

                    <button className="icon-btn" onClick={() => handleDownloadDocument(doc)} title="Download" type="button">
                      <Download size={18} />
                    </button>

                    {(userRole === "admin" || doc.created_by === userId) && (
                      <>
                        <button className="icon-btn" onClick={() => handleEditDocument(doc)} title="Edit" type="button">
                          <Edit3 size={18} />
                        </button>

                        <button className="icon-btn danger" onClick={() => handleDeleteDocument(doc)} title="Delete" type="button">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="home-empty">No documents found. Upload your first document to get started!</p>
            )}
          </div>
        </div>

        {/* ✅ Modals */}
        <UploadDocumentModal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSubmit={handleUpload}
          uploading={uploading}
          categories={categories}
          newDocTitle={newDocTitle}
          setNewDocTitle={setNewDocTitle}
          newDocContent={newDocContent}
          setNewDocContent={setNewDocContent}
          newDocSummary={newDocSummary}
          setNewDocSummary={setNewDocSummary}
          newDocCategory={newDocCategory}
          setNewDocCategory={setNewDocCategory}
          setSelectedFile={setSelectedFile}
        />

        <EditDocumentModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleSubmitEdit}
          uploading={uploading}
          categories={categories}
          newDocTitle={newDocTitle}
          setNewDocTitle={setNewDocTitle}
          newDocContent={newDocContent}
          setNewDocContent={setNewDocContent}
          newDocSummary={newDocSummary}
          setNewDocSummary={setNewDocSummary}
          newDocCategory={newDocCategory}
          setNewDocCategory={setNewDocCategory}
        />

        <DocumentViewerModal
          open={showDocumentViewer}
          document={selectedDocument}
          onClose={() => setShowDocumentViewer(false)}
          onAddComment={handleAddComment}
          onDownload={handleDownloadDocument}
        />

        <VersionHistoryModal
          open={showVersionHistory}
          document={selectedDocument}
          onClose={() => setShowVersionHistory(false)}
        />

        <DeleteDocumentModal
          open={showDeleteModal}
          documentToDelete={documentToDelete} // ✅ MUST MATCH
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />

      </div>
    </div>
  );
}
