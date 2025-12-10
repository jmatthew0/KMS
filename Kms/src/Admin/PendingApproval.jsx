import React, { useState, useEffect } from "react";
import "./css/PendingApproval.css";
import { FileText, Check, X, Search } from "lucide-react";
import {
  getPendingDocuments,
  approveDocument,
  rejectDocument,
} from "../api/documentsService";

export default function PendingApproval() {
  const [pendingDocs, setPendingDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    loadPendingDocuments();
  }, []);

  const loadPendingDocuments = async () => {
    setLoading(true);
    const { data, error } = await getPendingDocuments();
    if (!error) {
      setPendingDocs(data);
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this document?")) return;
    await approveDocument(id);
    await loadPendingDocuments();
  };

  const handleReject = (doc) => {
    setSelectedDoc(doc);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () =>
  {
    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejection.");
      return;
    }

    await rejectDocument(selectedDoc.id, rejectReason);
    setShowRejectModal(false);
    setSelectedDoc(null);
    await loadPendingDocuments();
  };

  const filteredDocs = pendingDocs.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pending-approval-container">
      {/* Header */}
      <div className="pending-header">
        <h1 className="pending-title">Pending Document Approvals</h1>

        <div className="pending-search">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search documents..."
            className="pending-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="pending-section">
        {loading ? (
          <p className="no-data">Loading...</p>
        ) : filteredDocs.length === 0 ? (
          <p className="no-data">No pending documents.</p>
        ) : (
          <div className="pending-table">
            <table>
              <thead>
                <tr>
                  <th>DOCUMENT</th>
                  <th>CATEGORY</th>
                  <th>SUBMITTED BY</th>
                  <th>DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="doc-title-cell">
                        <FileText className="doc-icon" size={18} />
                        {doc.title}
                      </div>
                    </td>

                    <td>
                      <span className="category-badge">
                        {doc.category?.name || "Uncategorized"}
                      </span>
                    </td>

                    <td>{doc.creator?.full_name || "Unknown"}</td>

                    <td>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>

                    <td>
                      <div className="actions-wrapper">
                        <button
                          className="approve-btn"
                          onClick={() => handleApprove(doc.id)}
                        >
                          <Check size={16} /> Approve
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() => handleReject(doc)}
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="reject-modal-overlay"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="reject-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Reject Document</h2>
            <p>Enter a reason for rejecting <strong>{selectedDoc?.title}</strong>:</p>

            <textarea
              className="reject-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
            />

            <div className="reject-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>

              <button
                className="confirm-reject-btn"
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
