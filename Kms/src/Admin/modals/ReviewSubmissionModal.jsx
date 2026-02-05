import React from "react";
import { X, Check } from "lucide-react";

export default function ReviewSubmissionModal({
  open,
  submission,
  categories,
  answer,
  categoryId,
  adminNotes,
  onChangeAnswer,
  onChangeCategory,
  onChangeNotes,
  onApprove,
  onReject,
  onClose,
}) {
  if (!open || !submission) return null;

  return (
    <div className="faq-modal-overlay" onClick={onClose}>
      <div className="faq-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review Submission</h2>
          <button className="close-btn" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-question">{submission.question}</p>

          <label className="modal-label">Answer *</label>
          <textarea
            className="modal-textarea"
            rows="4"
            value={answer}
            onChange={(e) => onChangeAnswer(e.target.value)}
          />

          <label className="modal-label">Category</label>
          <select
            className="modal-select"
            value={categoryId}
            onChange={(e) => onChangeCategory(e.target.value)}
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
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="Optional notes…"
          />
        </div>

        <div className="modal-footer">
          <button className="reject-btn" onClick={onReject} type="button">
            <X size={18} /> Reject
          </button>
          <button className="approve-btn" onClick={onApprove} type="button">
            <Check size={18} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}
