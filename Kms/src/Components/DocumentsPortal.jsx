import React, { useState, useRef, useEffect } from "react";
import "../Css/DocumentsPortal.css";
import { Search, Upload, FileText, Download, Eye, Trash2 } from "lucide-react";
import {
  getPublishedDocuments,
  getPendingDocuments,
  deleteDocument,
  getDocumentById,
  trackDocumentDownload,
  createDocument,
  approveDocument,
  rejectDocument,
} from "../api/documentsService";
import { getAllCategories } from "../api/categoriesService";
import { uploadFile as uploadFileToStorage } from "../api/fileUploadService";
import { supabase } from "../lib/supabaseClient";

// ✅ MODALS
import UploadDocumentModal from "./modals/UploadDocumentModal";
import DocumentViewerModal from "./modals/DocumentViewerModal";
import DeleteDocumentModal from "./modals/DeleteDocumentModal";
import ApproveDocumentModal from "./modals/ApproveDocumentModal";
import RejectDocumentModal from "./modals/RejectDocumentModal";

export default function DocumentsPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [publishedDocuments, setPublishedDocuments] = useState([]);
  const [rejectedDocuments, setRejectedDocuments] = useState([]);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [documentToReview, setDocumentToReview] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Upload form states
  const [selectedFile, setSelectedFile] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [newDocSummary, setNewDocSummary] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole"); // 'admin' or 'user'

  useEffect(() => {
    loadDocuments();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError("");

    try {
      if (userRole === "admin") {
        const [
          { data: pendingData, error: pendingError },
          { data: publishedData, error: publishedError },
        ] = await Promise.all([getPendingDocuments(), getPublishedDocuments()]);

        if (pendingError) throw pendingError;
        if (publishedError) throw publishedError;

        const { data: rejectedData, error: rejectedError } = await supabase
          .from("documents")
          .select(
            `
            *,
            category:categories(id, name, color),
            creator:profiles!documents_created_by_fkey(id, full_name, email)
          `
          )
          .eq("status", "rejected")
          .order("created_at", { ascending: false });

        if (rejectedError) throw rejectedError;

        setPendingDocuments(pendingData || []);
        setPublishedDocuments(publishedData || []);
        setRejectedDocuments(rejectedData || []);
      } else {
        const { data, error: fetchError } = await getPublishedDocuments();
        if (fetchError) throw fetchError;

        setPublishedDocuments(data || []);
        setPendingDocuments([]);
        setRejectedDocuments([]);
      }
    } catch (err) {
      console.error("Error loading documents:", err);
      setError("Failed to load documents");
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
      console.error("Error loading categories:", err);
    }
  };

  const handleUploadClick = () => setShowUploadModal(true);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUploadSubmit = async (e) => {
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

      if (selectedFile && createdDoc?.id) {
        const fileResult = await uploadFileToStorage(selectedFile, userId, createdDoc.id);
        if (fileResult.error) {
          console.error("File upload failed:", fileResult.error);
          alert("Document created but file upload failed: " + fileResult.error.message);
        }
      }

      await loadDocuments();

      setShowUploadModal(false);
      setSelectedFile(null);
      setNewDocTitle("");
      setNewDocContent("");
      setNewDocSummary("");

      if (fileInputRef.current) fileInputRef.current.value = "";

      alert("Document submitted successfully! It will be visible once approved by an administrator.");
    } catch (err) {
      console.error("Upload error:", err);
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
        console.error("Error fetching document:", error);
        setSelectedDocument(doc);
      } else {
        setSelectedDocument(data || doc);
      }
      setShowViewModal(true);
    } catch (err) {
      console.error("Error viewing document:", err);
      setSelectedDocument(doc);
      setShowViewModal(true);
    }
  };

  const handleDownload = async (doc) => {
    try {
      await trackDocumentDownload(doc.id, userId);

      if (doc.attachments && doc.attachments.length > 0) {
        const attachment = doc.attachments[0];

        const supabaseModule = await import("../lib/supabaseClient");
        const supabaseClient = supabaseModule.supabase;

        const { data: fileData, error } = await supabaseClient.storage
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
        const blob = new Blob([doc.content || ""], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${doc.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      await loadDocuments();
      alert("Download complete!");
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download document: " + err.message);
    }
  };

  const handleDelete = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      setError("");
      const { error: deleteError } = await deleteDocument(documentToDelete.id);
      if (deleteError) throw new Error(deleteError.message || "Failed to delete document");

      await loadDocuments();

      setShowDeleteModal(false);
      setDocumentToDelete(null);

      alert("Document deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      setError(`Failed to delete document: ${err.message}`);
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const filterDocuments = (docs) =>
    (docs || []).filter((doc) => {
      const matchesSearch =
        doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || (doc.category && doc.category.id === selectedCategory);

      return matchesSearch && matchesCategory;
    });

  const filteredPending = filterDocuments(pendingDocuments);
  const filteredPublished = filterDocuments(publishedDocuments);
  const filteredRejected = filterDocuments(rejectedDocuments);

  // Approve / Reject
  const openApproveModal = (doc) => {
    setDocumentToReview(doc);
    setShowApproveModal(true);
  };

  const openRejectModal = (doc) => {
    setDocumentToReview(doc);
    setRejectReason("");
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
      alert("Document approved and published successfully!");
    } catch (err) {
      console.error("Approve error:", err);
      alert("Failed to approve document: " + err.message);
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
      setRejectReason("");
      alert("Document rejected.");
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject document: " + err.message);
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
            {userRole === "admin"
              ? "Review, approve, and manage all knowledge assets."
              : "Access and manage your documents."}
          </p>
        </div>
      </div>

      <div className="main-content">
        <div className="content-wrapper">
          {error && <div className="error-message">{error}</div>}

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
            <button className="upload-button" onClick={handleUploadClick} type="button">
              <Upload size={18} />
              Upload
            </button>
          </div>

          {/* Category Filter */}
          <div className="filter-section">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`filter-button ${selectedCategory === "all" ? "filter-button-active" : ""}`}
              type="button"
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`filter-button ${selectedCategory === cat.id ? "filter-button-active" : ""}`}
                type="button"
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Admin: Pending */}
          {userRole === "admin" && (
            <section className="documents-section">
              <div className="section-header">
                <h2 className="section-title">Pending for Approval</h2>
                <p className="section-subtitle">Documents submitted by users that need your review.</p>
              </div>

              <div className="documents-grid">
                {filteredPending.length > 0 ? (
                  filteredPending.map((doc) => (
                    <div key={doc.id} className="document-card pending-card">
                      <div className="card-header">
                        <FileText size={24} className="file-icon" />
                        <span className={`status-badge ${doc.status || "pending_approval"}`}>
                          {doc.status ? doc.status.replace("_", " ") : "pending approval"}
                        </span>
                      </div>

                      <h3 className="document-name">{doc.title}</h3>

                      <div className="document-meta">
                        <span className="meta-item">{doc.category?.name || "Uncategorized"}</span>
                      </div>

                      {doc.summary && (
                        <p className="document-summary">{doc.summary.substring(0, 100)}...</p>
                      )}

                      <div className="document-footer">
                        <div className="footer-left">
                          <span className="uploaded-by">{doc.creator?.full_name || "Unknown"}</span>
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
                        <button className="action-button" onClick={() => handleView(doc)} type="button">
                          <Eye size={18} />
                          View
                        </button>
                        <button className="action-button" onClick={() => handleDownload(doc)} type="button">
                          <Download size={18} />
                          Download
                        </button>
                        <button className="action-button approve-button" onClick={() => openApproveModal(doc)} type="button">
                          Approve
                        </button>
                        <button className="action-button reject-button" onClick={() => openRejectModal(doc)} type="button">
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

          {/* Published */}
          <section className="documents-section">
            <div className="section-header">
              <h2 className="section-title">Published Documents</h2>
            </div>

            <div className="documents-grid">
              {filteredPublished.length > 0 ? (
                filteredPublished.map((doc) => (
                  <div key={doc.id} className="document-card">
                    <div className="card-header">
                      <FileText size={24} className="file-icon" />
                      {userRole === "admin" && (
                        <span className={`status-badge ${doc.status || "approved"}`}>
                          {(doc.status || "approved").replace("_", " ")}
                        </span>
                      )}
                    </div>

                    <h3 className="document-name">{doc.title}</h3>

                    <div className="document-meta">
                      <span className="meta-item">{doc.category?.name || "Uncategorized"}</span>
                    </div>

                    {doc.summary && <p className="document-summary">{doc.summary.substring(0, 100)}...</p>}

                    <div className="document-footer">
                      <div className="footer-left">
                        <span className="uploaded-by">{doc.creator?.full_name || "Unknown"}</span>
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
                      <button className="action-button" onClick={() => handleView(doc)} type="button">
                        <Eye size={18} />
                        View
                      </button>
                      <button className="action-button" onClick={() => handleDownload(doc)} type="button">
                        <Download size={18} />
                        Download
                      </button>
                      {(userRole === "admin" || doc.created_by === userId) && (
                        <button className="action-button delete-button" onClick={() => handleDelete(doc)} type="button">
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

          {/* Admin: Rejected */}
          {userRole === "admin" && (
            <section className="documents-section">
              <div className="section-header">
                <h2 className="section-title">Rejected Documents</h2>
                <p className="section-subtitle">Documents that were reviewed and not approved.</p>
              </div>

              <div className="documents-grid">
                {filteredRejected.length > 0 ? (
                  filteredRejected.map((doc) => (
                    <div key={doc.id} className="document-card rejected-card">
                      <div className="card-header">
                        <FileText size={24} className="file-icon" />
                        <span className={`status-badge ${doc.status || "rejected"}`}>
                          {(doc.status || "rejected").replace("_", " ")}
                        </span>
                      </div>

                      <h3 className="document-name">{doc.title}</h3>

                      <div className="document-meta">
                        <span className="meta-item">{doc.category?.name || "Uncategorized"}</span>
                      </div>

                      {doc.summary && <p className="document-summary">{doc.summary.substring(0, 100)}...</p>}

                      <div className="document-footer">
                        <div className="footer-left">
                          <span className="uploaded-by">{doc.creator?.full_name || "Unknown"}</span>
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
                        <button className="action-button" onClick={() => handleView(doc)} type="button">
                          <Eye size={18} />
                          View
                        </button>
                        <button className="action-button" onClick={() => handleDownload(doc)} type="button">
                          <Download size={18} />
                          Download
                        </button>
                        {(userRole === "admin" || doc.created_by === userId) && (
                          <button className="action-button delete-button" onClick={() => handleDelete(doc)} type="button">
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

      {/* ✅ MODALS RENDERED HERE */}
      <UploadDocumentModal
        open={showUploadModal}
        uploading={uploading}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleUploadSubmit}
        categories={categories}
        newDocTitle={newDocTitle}
        setNewDocTitle={setNewDocTitle}
        newDocContent={newDocContent}
        setNewDocContent={setNewDocContent}
        newDocSummary={newDocSummary}
        setNewDocSummary={setNewDocSummary}
        newDocCategory={newDocCategory}
        setNewDocCategory={setNewDocCategory}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
      />

      <DocumentViewerModal
        open={showViewModal}
        document={selectedDocument}
        onClose={() => setShowViewModal(false)}
        onDownload={handleDownload}
      />

      <DeleteDocumentModal
        open={showDeleteModal}
        documentToDelete={documentToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      <ApproveDocumentModal
        open={showApproveModal}
        documentToReview={documentToReview}
        onClose={() => setShowApproveModal(false)}
        onConfirm={confirmApprove}
      />

      <RejectDocumentModal
        open={showRejectModal}
        documentToReview={documentToReview}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        onClose={() => setShowRejectModal(false)}
        onConfirm={confirmReject}
      />
    </div>
  );
}
