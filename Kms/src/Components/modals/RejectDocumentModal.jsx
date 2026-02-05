import React from "react";
import { X } from "lucide-react";

export default function RejectDocumentModal({
  open,
  documentToReview,
  rejectReason,
  setRejectReason,
  onClose,
  onConfirm,
}) {
  if (!open || !documentToReview) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Reject Document</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="delete-modal-body">
          <p className="delete-message">
            Are you sure you want to reject{" "}
            <strong>"{documentToReview.title}"</strong>?
          </p>

          <div className="form-group" style={{ marginTop: "1rem", padding: "0 0" }}>
            <label className="form-label">Rejection Reason (optional)</label>
            <textarea
              className="form-input"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
            />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>

          <button type="button" className="btn-delete" onClick={onConfirm}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
