import React, { useState, useEffect } from "react";
import "../Css/FAQs.css";
import {
  ChevronDown,
  Search,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

import SubmitFaqModal from "./SubmitFaqModal";
import EditFaqModal from "./EditFaqModal";
import StatusModal from "./StatusModal";
import ConfirmModal from "./ConfirmModal";

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modals
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [editingFaq, setEditingFaq] = useState(null);

  // used for initial select on submit modal
  const [newCategoryId, setNewCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // status modal (replaces alert)
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  // delete confirm modal
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    faqId: null,
    question: "",
    loading: false,
  });

  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const openStatus = ({ type, title, message }) => {
    setStatusModal({
      open: true,
      type: type || "success",
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
      // FAQs
      const { data: faqsData, error: faqsError } = await supabase
        .from("faqs")
        .select(
          `
          *,
          category:faq_categories(id, name),
          creator:profiles!faqs_created_by_fkey(id, full_name)
        `
        )
        .eq("is_published", true)
        .order("views_count", { ascending: false });

      if (faqsError) throw faqsError;

      // categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("faq_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (categoriesError) throw categoriesError;

      // user submissions
      if (userId) {
        const { data: submissionsData, error: subErr } = await supabase
          .from("faq_submissions")
          .select("*")
          .eq("submitted_by", userId)
          .order("created_at", { ascending: false });

        if (subErr) console.error(subErr);
        setSubmissions(submissionsData || []);
      } else {
        setSubmissions([]);
      }

      setFaqs(faqsData || []);
      setCategories(categoriesData || []);

      if (categoriesData && categoriesData.length > 0) {
        setNewCategoryId(categoriesData[0].id);
      } else {
        setNewCategoryId("");
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = async (index, faq) => {
    setOpenIndex(openIndex === index ? null : index);

    if (openIndex !== index) {
      try {
        await supabase.rpc("increment_faq_views", { faq_id_param: faq.id });
      } catch (err) {
        console.error("Error updating view count:", err);
      }
    }
  };

  const handleRating = async (faq, isHelpful) => {
    if (!userId) {
      openStatus({
        type: "error",
        title: "Login required",
        message: "Please login to rate FAQs.",
      });
      return;
    }

    try {
      const { data: existingRating } = await supabase
        .from("faq_ratings")
        .select("*")
        .eq("faq_id", faq.id)
        .eq("user_id", userId)
        .single();

      if (existingRating) {
        await supabase
          .from("faq_ratings")
          .update({ is_helpful: isHelpful })
          .eq("id", existingRating.id);
      } else {
        await supabase.from("faq_ratings").insert({
          faq_id: faq.id,
          user_id: userId,
          is_helpful: isHelpful,
        });
      }

      // keeping your current behavior (increment per click)
      const field = isHelpful ? "helpful_count" : "not_helpful_count";
      await supabase
        .from("faqs")
        .update({ [field]: (faq[field] || 0) + 1 })
        .eq("id", faq.id);

      await loadData();

      openStatus({
        type: "success",
        title: "Thanks!",
        message: isHelpful
          ? "Thanks for your feedback!"
          : "Thanks for letting us know.",
      });
    } catch (err) {
      console.error("Error rating FAQ:", err);
      openStatus({
        type: "error",
        title: "Rating failed",
        message: "Failed to submit rating. Please try again.",
      });
    }
  };

  // called by SubmitFaqModal
  const handleSubmitQuestion = async ({ question, answer, categoryId, resetForm }) => {
    if (!question?.trim()) {
      openStatus({
        type: "error",
        title: "Missing question",
        message: "Please enter a question.",
      });
      return;
    }

    if (!userId) {
      openStatus({
        type: "error",
        title: "Login required",
        message: "Please login to submit questions.",
      });
      return;
    }

    setSubmitting(true);

    try {
      if (userRole === "admin") {
        if (!answer?.trim()) {
          openStatus({
            type: "error",
            title: "Missing answer",
            message: "Please provide an answer.",
          });
          setSubmitting(false);
          return;
        }

        const { error: insertError } = await supabase.from("faqs").insert({
          question: question.trim(),
          answer: answer.trim(),
          category_id: categoryId || null,
          is_published: true,
          created_by: userId,
          views_count: 0,
          helpful_count: 0,
          not_helpful_count: 0,
        });

        if (insertError) throw insertError;

        openStatus({
          type: "success",
          title: "FAQ Added",
          message: "FAQ added successfully!",
        });
      } else {
        const { error: insertError } = await supabase
          .from("faq_submissions")
          .insert({
            question: question.trim(),
            submitted_by: userId,
            status: "pending",
          });

        if (insertError) throw insertError;

        openStatus({
          type: "success",
          title: "Submitted",
          message: "Question submitted successfully! It will be reviewed by our team.",
        });
      }

      await loadData();
      setShowSubmitForm(false);
      resetForm?.();
    } catch (err) {
      console.error("Error submitting:", err);
      openStatus({
        type: "error",
        title: "Submit failed",
        message: `Failed to submit: ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (faq) => {
    setEditingFaq(faq);
    setShowEditForm(true);
  };

  // called by EditFaqModal
  const handleUpdateFaq = async ({ id, question, answer, categoryId }) => {
    if (!question?.trim() || !answer?.trim()) {
      openStatus({
        type: "error",
        title: "Missing fields",
        message: "Please fill in all fields.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from("faqs")
        .update({
          question: question.trim(),
          answer: answer.trim(),
          category_id: categoryId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      await loadData();
      setShowEditForm(false);
      setEditingFaq(null);

      openStatus({
        type: "success",
        title: "Updated",
        message: "FAQ updated successfully!",
      });
    } catch (err) {
      console.error("Error updating FAQ:", err);
      openStatus({
        type: "error",
        title: "Update failed",
        message: `Failed to update FAQ: ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // open delete modal (no window.confirm)
  const requestDeleteFaq = (faq) => {
    setDeleteModal({
      open: true,
      faqId: faq.id,
      question: faq.question || "",
      loading: false,
    });
  };

  const closeDeleteModal = () => {
    if (deleteModal.loading) return;
    setDeleteModal({ open: false, faqId: null, question: "", loading: false });
  };

  const confirmDeleteFaq = async () => {
    if (!deleteModal.faqId) return;

    setDeleteModal((prev) => ({ ...prev, loading: true }));

    try {
      const { error: deleteError } = await supabase
        .from("faqs")
        .delete()
        .eq("id", deleteModal.faqId);

      if (deleteError) throw deleteError;

      setFaqs((prev) => prev.filter((f) => f.id !== deleteModal.faqId));
      closeDeleteModal();

      openStatus({
        type: "success",
        title: "Deleted",
        message: "FAQ deleted successfully.",
      });
    } catch (err) {
      console.error("Error deleting FAQ:", err);
      setDeleteModal((prev) => ({ ...prev, loading: false }));
      openStatus({
        type: "error",
        title: "Delete failed",
        message: `Failed to delete FAQ: ${err.message}`,
      });
    }
  };

  const popularFaqs = faqs.filter((faq, index, arr) => {
    const threshold = Math.ceil(arr.length * 0.25);
    return index < threshold;
  });

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === "all") return matchesSearch;
    if (selectedCategory === "popular") return matchesSearch && popularFaqs.includes(faq);
    if (selectedCategory === "my-submissions") {
      return submissions.some((s) =>
        s.question.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return matchesSearch && faq.category_id === selectedCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="status-badge pending-badge">
            <Clock size={14} /> Pending Review
          </span>
        );
      case "approved":
        return (
          <span className="status-badge approved-badge">
            <CheckCircle size={14} /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="status-badge rejected-badge">
            <XCircle size={14} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="faqs-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="faqs-container">
      <div className="faqs-content">
        <div className="faqs-header">
          <div className="header-top">
            <div>
              <h1 className="faqs-title">Frequently Asked Questions</h1>
              <p className="faqs-subtitle">
                Find answers to common questions about the Knowledge Management System
              </p>
            </div>

            <button className="submit-question-btn" onClick={() => setShowSubmitForm(true)}>
              <Plus size={20} />
              {userRole === "admin" ? "Add FAQ" : "Submit Question"}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Submit/Add FAQ Modal */}
        <SubmitFaqModal
          open={showSubmitForm}
          onClose={() => setShowSubmitForm(false)}
          onSubmit={handleSubmitQuestion}
          submitting={submitting}
          userRole={userRole}
          categories={categories}
          initialCategoryId={newCategoryId}
        />

        {/* Edit Modal (Separated) */}
        <EditFaqModal
          open={showEditForm}
          onClose={() => {
            if (submitting) return;
            setShowEditForm(false);
            setEditingFaq(null);
          }}
          onUpdate={handleUpdateFaq}
          submitting={submitting}
          categories={categories}
          faq={editingFaq}
        />

        {/* Status Modal */}
        <StatusModal
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={closeStatus}
        />

        {/* Confirm Delete Modal */}
        <ConfirmModal
          open={deleteModal.open}
          title="Delete FAQ"
          message={
            deleteModal.question
              ? `Are you sure you want to delete this FAQ?\n\n"${deleteModal.question}"`
              : "Are you sure you want to delete this FAQ?"
          }
          confirmText="Delete"
          cancelText="Cancel"
          loading={deleteModal.loading}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteFaq}
        />

        {/* Search */}
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Category Filters */}
        <div className="category-filters">
          <button
            className={`category-btn ${selectedCategory === "all" ? "category-btn-active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            All Questions
          </button>

          <button
            className={`category-btn ${selectedCategory === "popular" ? "category-btn-active" : ""}`}
            onClick={() => setSelectedCategory("popular")}
          >
            Popular
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? "category-btn-active" : ""}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}

          {submissions.length > 0 && (
            <button
              className={`category-btn ${
                selectedCategory === "my-submissions" ? "category-btn-active" : ""
              }`}
              onClick={() => setSelectedCategory("my-submissions")}
            >
              My Submissions ({submissions.length})
            </button>
          )}
        </div>

        <div className="faqs-list">
          {/* My Submissions */}
          {selectedCategory === "my-submissions" && submissions.length > 0 && (
            <div className="submissions-grid">
              {submissions.map((submission) => (
                <div key={submission.id} className="submission-card-compact">
                  <div className="submission-header">
                    <h3 className="submission-question-compact">{submission.question}</h3>
                    {getStatusBadge(submission.status)}
                  </div>
                  <p className="submission-date-compact">
                    {new Date(submission.created_at).toLocaleString()}
                  </p>
                  {submission.status === "approved" && (
                    <p className="submission-message success-message">
                      Your question has been approved and published!
                    </p>
                  )}
                  {submission.status === "rejected" && submission.admin_notes && (
                    <p className="submission-message error-message">
                      Reason: {submission.admin_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* FAQs */}
          {selectedCategory !== "my-submissions" && filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <div key={faq.id} className="faq-item">
                <button className="faq-question" onClick={() => toggleFAQ(index, faq)}>
                  <span>
                    {faq.question}
                    {popularFaqs.includes(faq) && <span className="popular-badge">Popular</span>}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`chevron-icon ${openIndex === index ? "chevron-rotate" : ""}`}
                  />
                </button>

                {openIndex === index && (
                  <div className="faq-answer-container">
                    <div className="faq-answer">{faq.answer}</div>

                    {userRole === "admin" && (
                      <div className="faq-admin-actions">
                        <button
                          className="admin-action-btn"
                          onClick={() => handleEditClick(faq)}
                          type="button"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          className="admin-action-btn delete-btn"
                          onClick={() => requestDeleteFaq(faq)}
                          type="button"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}

                    <div className="faq-rating">
                      <span className="rating-text">Was this helpful?</span>
                      <div className="rating-buttons">
                        <button className="rating-btn" onClick={() => handleRating(faq, true)} type="button">
                          <ThumbsUp size={16} />
                          Yes {faq.helpful_count > 0 && `(${faq.helpful_count})`}
                        </button>
                        <button className="rating-btn" onClick={() => handleRating(faq, false)} type="button">
                          <ThumbsDown size={16} />
                          No {faq.not_helpful_count > 0 && `(${faq.not_helpful_count})`}
                        </button>
                      </div>
                    </div>

                    <div className="faq-meta">
                      <span className="meta-info">Views: {faq.views_count || 0}</span>
                      {faq.category && <span className="meta-info">Category: {faq.category.name}</span>}
                      {faq.creator && <span className="meta-info">Created by: {faq.creator.full_name}</span>}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            selectedCategory !== "my-submissions" && (
              <div className="no-results">
                <p>No FAQs found matching your search.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
