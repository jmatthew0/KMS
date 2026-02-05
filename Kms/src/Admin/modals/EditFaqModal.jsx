import React from "react";
import { X, Save } from "lucide-react";

export default function EditFaqModal({
  open,
  faq,
  categories,
  question,
  answer,
  categoryId,
  onChangeQuestion,
  onChangeAnswer,
  onChangeCategory,
  onSave,
  onClose,
  loading,
}) {
  if (!open || !faq) return null;

  return (
    <div className="faq-modal-overlay" onClick={!loading ? onClose : undefined}>
      <div className="faq-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit FAQ</h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <label className="modal-label">Question *</label>
          <textarea
            className="modal-textarea"
            rows="3"
            value={question}
            onChange={(e) => onChangeQuestion(e.target.value)}
          />

          <label className="modal-label">Answer *</label>
          <textarea
            className="modal-textarea"
            rows="5"
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
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="approve-btn" onClick={onSave} disabled={loading}>
            <Save size={16} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
