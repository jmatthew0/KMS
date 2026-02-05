import React, { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";

export default function SubmitFaqModal({
  open,
  onClose,
  onSubmit,
  submitting,
  userRole,
  categories,
  initialCategoryId = "",
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [categoryId, setCategoryId] = useState(initialCategoryId);

  useEffect(() => {
    if (!open) return;

    // reset each time modal opens
    setQuestion("");
    setAnswer("");
    setCategoryId(initialCategoryId || categories?.[0]?.id || "");
  }, [open, initialCategoryId, categories]);

  if (!open) return null;

  const isAdmin = userRole === "admin";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      question,
      answer,
      categoryId,
      resetForm: () => {
        setQuestion("");
        setAnswer("");
        setCategoryId(initialCategoryId || categories?.[0]?.id || "");
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isAdmin ? "Add New FAQ" : "Submit a Question"}
          </h2>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Question *</label>
            <textarea
              className="form-textarea"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to know?"
              rows="3"
              required
            />
          </div>

          {isAdmin && (
            <>
              <div className="form-group">
                <label className="form-label">Answer *</label>
                <textarea
                  className="form-textarea"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Provide a detailed answer..."
                  rows="5"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={categoryId || ""}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">No Category</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting
                ? "Submitting..."
                : isAdmin
                ? "Add FAQ"
                : "Submit Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
