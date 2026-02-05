// src/Admin/ManageFAQs.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./css/ManageFAQs.css";
import { Check, X, FileText, Trash2, Edit3 } from "lucide-react";

// ✅ Admin-only separated modals
import ReviewSubmissionModal from "./modals/ReviewSubmissionModal";
import EditFaqModal from "./modals/EditFaqModal";

/**
 * ManageFAQs (Admin)
 * - Pending tab: review user submissions (approve/reject)
 * - Approved tab: edit/delete approved user-submitted FAQs
 * - No inline styles (moved to CSS)
 */
export default function ManageFAQs() {
  const [submissions, setSubmissions] = useState([]);
  const [approvedFAQs, setApprovedFAQs] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "approved"

  // Review (pending) modal state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [answer, setAnswer] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Edit (approved) modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [faqToEdit, setFaqToEdit] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm modal state (kept in this file, no inline styles)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status modal (replaces browser alert)
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success", // "success" | "error"
    title: "",
    message: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const openStatus = ({ type = "success", title, message }) => {
    setStatusModal({
      open: true,
      type,
      title: title || (type === "error" ? "Error" : "Success"),
      message: message || "",
    });
  };

  const closeStatus = () => {
    setStatusModal((prev) => ({ ...prev, open: false }));
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      // Pending submissions
      const { data: subData, error: subError } = await supabase
        .from("faq_submissions")
        .select(
          `
          *,
          user:profiles(id, full_name)
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (subError) throw subError;
      setSubmissions(subData || []);

      // Approved FAQs (user-submitted only)
      const { data: faqData, error: faqError } = await supabase
        .from("faqs")
        .select(
          `
          *,
          category:faq_categories(id, name),
          creator:profiles(full_name)
        `
        )
        .not("created_by", "is", null)
        .order("created_at", { ascending: false });

      if (faqError) throw faqError;
      setApprovedFAQs(faqData || []);

      // Categories
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

  // ----------------------------
  // Pending: Approve / Reject
  // ----------------------------
  const approveSubmission = async () => {
    if (!selectedSubmission) return;

    if (!answer.trim()) {
      openStatus({
        type: "error",
        title: "Missing Answer",
        message: "Please provide an answer before approving.",
      });
      return;
    }

    try {
      // Insert new FAQ
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
      const { error: updateError } = await supabase
        .from("faq_submissions")
        .update({
          status: "approved",
          admin_notes: adminNotes || null,
        })
        .eq("id", selectedSubmission.id);

      if (updateError) throw updateError;

      openStatus({
        type: "success",
        title: "Approved",
        message: "FAQ approved and published!",
      });

      setSelectedSubmission(null);
      setAnswer("");
      setCategoryId("");
      setAdminNotes("");
      loadData();
    } catch (err) {
      console.error(err);
      openStatus({
        type: "error",
        title: "Approve Failed",
        message: "Failed to approve submission.",
      });
    }
  };

  const rejectSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      const { error: updateError } = await supabase
        .from("faq_submissions")
        .update({
          status: "rejected",
          admin_notes: adminNotes || null,
        })
        .eq("id", selectedSubmission.id);

      if (updateError) throw updateError;

      openStatus({
        type: "success",
        title: "Rejected",
        message: "Submission rejected.",
      });

      setSelectedSubmission(null);
      setAnswer("");
      setCategoryId("");
      setAdminNotes("");
      loadData();
    } catch (err) {
      console.error(err);
      openStatus({
        type: "error",
        title: "Reject Failed",
        message: "Failed to reject submission.",
      });
    }
  };

  // ----------------------------
  // Approved: Edit
  // ----------------------------
  const openEditFaq = (faq) => {
    setFaqToEdit(faq);
    setEditQuestion(faq.question || "");
    setEditAnswer(faq.answer || "");
    setEditCategoryId(faq.category_id || "");
    setShowEditModal(true);
  };

  const closeEditFaq = () => {
    if (editLoading) return;
    setShowEditModal(false);
    setFaqToEdit(null);
  };

  const saveEditFaq = async () => {
    if (!faqToEdit) return;

    if (!editQuestion.trim() || !editAnswer.trim()) {
      openStatus({
        type: "error",
        title: "Missing Fields",
        message: "Please fill in Question and Answer.",
      });
      return;
    }

    setEditLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("faqs")
        .update({
          question: editQuestion.trim(),
          answer: editAnswer.trim(),
          category_id: editCategoryId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", faqToEdit.id);

      if (updateError) throw updateError;

      openStatus({
        type: "success",
        title: "Updated",
        message: "FAQ updated successfully!",
      });

      closeEditFaq();
      loadData();
    } catch (err) {
      console.error(err);
      openStatus({
        type: "error",
        title: "Update Failed",
        message: "Failed to update FAQ: " + err.message,
      });
    } finally {
      setEditLoading(false);
    }
  };

  // ----------------------------
  // Approved: Delete
  // ----------------------------
  const openDeleteFaq = (faq) => {
    setFaqToDelete(faq);
    setShowDeleteModal(true);
  };

  const closeDeleteFaq = () => {
    if (deleteLoading) return;
    setShowDeleteModal(false);
    setFaqToDelete(null);
  };

  const confirmDeleteFaq = async () => {
    if (!faqToDelete) return;

    setDeleteLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("faqs")
        .delete()
        .eq("id", faqToDelete.id);

      if (deleteError) throw deleteError;

      openStatus({
        type: "success",
        title: "Deleted",
        message: "FAQ deleted successfully!",
      });

      closeDeleteFaq();
      loadData();
    } catch (err) {
      console.error(err);
      openStatus({
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete FAQ: " + err.message,
      });
    } finally {
      setDeleteLoading(false);
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
          type="button"
        >
          <FileText size={18} />
          Pending ({submissions.length})
        </button>

        <button
          className={`tab-button ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
          type="button"
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
                  type="button"
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

                <div className="admin-card-actions">
                  <button
                    className="review-btn"
                    onClick={() => openEditFaq(faq)}
                    type="button"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => openDeleteFaq(faq)}
                    type="button"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ✅ Pending Review Modal (separated) */}
      <ReviewSubmissionModal
        open={!!selectedSubmission}
        submission={selectedSubmission}
        categories={categories}
        answer={answer}
        categoryId={categoryId}
        adminNotes={adminNotes}
        onChangeAnswer={setAnswer}
        onChangeCategory={setCategoryId}
        onChangeNotes={setAdminNotes}
        onApprove={approveSubmission}
        onReject={rejectSubmission}
        onClose={() => setSelectedSubmission(null)}
      />

      {/* ✅ Edit FAQ Modal (separated) */}
      <EditFaqModal
        open={showEditModal}
        faq={faqToEdit}
        categories={categories}
        question={editQuestion}
        answer={editAnswer}
        categoryId={editCategoryId}
        onChangeQuestion={setEditQuestion}
        onChangeAnswer={setEditAnswer}
        onChangeCategory={setEditCategoryId}
        onSave={saveEditFaq}
        onClose={closeEditFaq}
        loading={editLoading}
      />

      {/* ✅ Delete FAQ Confirmation Modal (no inline styles) */}
      {showDeleteModal && faqToDelete && (
        <div className="faq-modal-overlay" onClick={closeDeleteFaq}>
          <div className="faq-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete FAQ</h2>
              <button
                className="close-btn"
                onClick={closeDeleteFaq}
                disabled={deleteLoading}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="confirm-modal-center">
                <Trash2 size={48} className="confirm-modal-icon danger" />
                <p className="confirm-modal-title">
                  Are you sure you want to delete this FAQ?
                </p>
                <p className="confirm-modal-question">{faqToDelete.question}</p>
                <p className="confirm-modal-warning">This action cannot be undone.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={closeDeleteFaq}
                disabled={deleteLoading}
                type="button"
              >
                Cancel
              </button>
              <button
                className="delete-confirm-btn"
                onClick={confirmDeleteFaq}
                disabled={deleteLoading}
                type="button"
              >
                <Trash2 size={18} />
                {deleteLoading ? "Deleting..." : "Delete FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Status Modal (replaces alerts) */}
      {statusModal.open && (
        <div className="faq-modal-overlay" onClick={closeStatus}>
          <div className="faq-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{statusModal.title}</h2>
              <button className="close-btn" onClick={closeStatus} type="button">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="status-message">{statusModal.message}</p>
            </div>

            <div className="modal-footer">
              <button className="approve-btn" onClick={closeStatus} type="button">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
