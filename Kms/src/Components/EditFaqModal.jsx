import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function EditFaqModal({
  open,
  onClose,
  onUpdate,
  submitting,
  categories,
  faq, // the FAQ being edited
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    if (!open || !faq) return;
    setQuestion(faq.question || "");
    setAnswer(faq.answer || "");
    setCategoryId(faq.category_id || "");
  }, [open, faq]);

  if (!open || !faq) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      id: faq.id,
      question,
      answer,
      categoryId,
      resetForm: () => {
        setQuestion("");
        setAnswer("");
        setCategoryId("");
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit FAQ</h2>
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
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Answer *</label>
            <textarea
              className="form-textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
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
              {submitting ? "Updating..." : "Update FAQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
