import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./css/ManageFAQs.css";

import { Check, X, FileText, Trash2, Eye } from "lucide-react";

export default function ManageFAQs() {
  const [submissions, setSubmissions] = useState([]);
  const [approvedFAQs, setApprovedFAQs] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "approved"

  // Modal states
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [answer, setAnswer] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      // Load pending submissions
      const { data: subData, error: subError } = await supabase
        .from("faq_submissions")
        .select(`
          *,
          user:profiles(id, full_name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (subError) throw subError;
      setSubmissions(subData || []);

      // Load approved FAQs (only user-submitted ones)
      const { data: faqData, error: faqError } = await supabase
        .from("faqs")
        .select(`
          *,
          category:faq_categories(name),
          creator:profiles(full_name)
        `)
        .not('created_by', 'is', null)  // Only show FAQs that have a creator (user-submitted)
        .order("created_at", { ascending: false });

      if (faqError) throw faqError;
      setApprovedFAQs(faqData || []);

      // Load categories
      const { data: catData, error: catError } = await supabase
        .from("faq_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (catError) throw catError;
      setCategories(catData || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  // Approve submission → insert into faqs table
  const approveSubmission = async () => {
    if (!selectedSubmission) return;

    if (!answer.trim()) {
      alert("Please provide an answer before approving.");
      return;
    }

    try {
      // Insert FAQ
      const { error: insertError } = await supabase.from("faqs").insert({
        question: selectedSubmission.question,
        answer: answer.trim(),
        category_id: categoryId || null,
        created_by: selectedSubmission.submitted_by,
        is_published: true,
        views_count: 0,
        helpful_count: 0,
        not_helpful_count: 0,
      });

      if (insertError) throw insertError;

      // Mark submission as approved
      await supabase
        .from("faq_submissions")
        .update({
          status: "approved",
          admin_notes: adminNotes || null,
        })
        .eq("id", selectedSubmission.id);

      alert("FAQ approved and published!");
      setSelectedSubmission(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to approve submission.");
    }
  };

  // Reject submission
  const rejectSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      await supabase
        .from("faq_submissions")
        .update({
          status: "rejected",
          admin_notes: adminNotes || null,
        })
        .eq("id", selectedSubmission.id);

      alert("Submission rejected.");
      setSelectedSubmission(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to reject submission.");
    }
  };

  // Delete approved FAQ
  const handleDeleteFAQ = (faq) => {
    setFaqToDelete(faq);
    setShowDeleteModal(true);
  };

  const confirmDeleteFAQ = async () => {
    if (!faqToDelete) return;

    try {
      const { error: deleteError } = await supabase
        .from("faqs")
        .delete()
        .eq("id", faqToDelete.id);

      if (deleteError) throw deleteError;

      alert("FAQ deleted successfully!");
      setShowDeleteModal(false);
      setFaqToDelete(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete FAQ: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="managefaqs-container">
        <div className="loading-center">
          <div className="spinner"></div>
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="managefaqs-container">
      <div className="managefaqs-header">
        <h1 className="page-title">Manage FAQ Submissions</h1>
        <p className="page-subtitle">Review and approve user-submitted questions</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <FileText size={18} />
          Pending ({submissions.length})
        </button>
        <button
          className={`tab-button ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          <Check size={18} />
          Approved ({approvedFAQs.length})
        </button>
      </div>

      {/* Pending Submissions */}
      {activeTab === "pending" && (
        <div className="submissions-list">
          {submissions.length === 0 ? (
            <div className="empty-state">
              <FileText size={50} className="empty-icon" />
              <p>No pending submissions</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="submission-card">
                <div className="submission-top">
                  <h3 className="submission-question">{sub.question}</h3>
                  <p className="submission-date">
                    {new Date(sub.created_at).toLocaleString()}
                  </p>
                </div>

                <button
                  className="review-btn"
                  onClick={() => {
                    setSelectedSubmission(sub);
                    setAnswer("");
                    setCategoryId("");
                    setAdminNotes("");
                  }}
                >
                  Review
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Approved FAQs */}
      {activeTab === "approved" && (
        <div className="submissions-list">
          {approvedFAQs.length === 0 ? (
            <div className="empty-state">
              <Check size={50} className="empty-icon" />
              <p>No approved FAQs yet</p>
            </div>
          ) : (
            approvedFAQs.map((faq) => (
              <div key={faq.id} className="submission-card">
                <div className="submission-top">
                  <h3 className="submission-question">{faq.question}</h3>
                  <p className="submission-date">
                    {new Date(faq.created_at).toLocaleString()}
                  </p>
                </div>

                <button
                  className="delete-btn"
                  onClick={() => handleDeleteFAQ(faq)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="faq-modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="faq-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Submission</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedSubmission(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-question">{selectedSubmission.question}</p>

              <label className="modal-label">Answer *</label>
              <textarea
                className="modal-textarea"
                rows="4"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />

              <label className="modal-label">Category</label>
              <select
                className="modal-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <label className="modal-label">Admin Notes</label>
              <textarea
                className="modal-textarea"
                rows="3"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Optional notes…"
              />
            </div>

            <div className="modal-footer">
              <button className="reject-btn" onClick={rejectSubmission}>
                <X size={18} /> Reject
              </button>
              <button className="approve-btn" onClick={approveSubmission}>
                <Check size={18} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete FAQ Confirmation Modal */}
      {showDeleteModal && faqToDelete && (
        <div className="faq-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="faq-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete FAQ</h2>
              <button
                className="close-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <Trash2 size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                  Are you sure you want to delete this FAQ?
                </p>
                <p style={{ color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {faqToDelete.question}
                </p>
                <p style={{ color: '#991b1b', fontSize: '0.875rem', marginTop: '1rem' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn" 
                onClick={confirmDeleteFAQ}
              >
                <Trash2 size={18} />
                Delete FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}