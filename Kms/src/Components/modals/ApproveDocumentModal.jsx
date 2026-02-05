import React from "react";
import { X } from "lucide-react";

export default function ApproveDocumentModal({
  open,
  documentToReview,
  onClose,
  onConfirm,
}) {
  if (!open || !documentToReview) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Approve Document</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="delete-modal-body">
          <p className="delete-message">
            Are you sure you want to approve and publish{" "}
            <strong>"{documentToReview.title}"</strong>?
          </p>
          <p className="delete-warning">
            This will make the document visible to all users.
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>

          <button type="button" className="btn-submit" onClick={onConfirm}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
