import React from "react";
import { Trash2, X } from "lucide-react";

export default function DeleteDocumentModal({
  open,
  documentToDelete,
  onClose,
  onConfirm,
}) {
  if (!open || !documentToDelete) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title delete-title">
            <Trash2 size={20} />
            Delete Document
          </h2>

          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="delete-modal-body">
          <p className="delete-message">
            Are you sure you want to delete{" "}
            <strong>"{documentToDelete.title}"</strong>?
          </p>
          <p className="delete-warning">
            This action cannot be undone. The document and all its attachments will be permanently deleted.
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>

          <button type="button" className="btn-delete" onClick={onConfirm}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
