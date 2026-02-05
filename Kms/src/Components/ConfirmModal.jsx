import React from "react";
import { X, AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={loading ? undefined : onClose}>
      <div className="modal-content logout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="close-button"
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="logout-modal-content">
            <AlertTriangle size={44} className="logout-icon" />
            <p className="logout-modal-title" style={{ lineHeight: 1.4 }}>
              {message}
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="cancel-button"
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className="save-button logout-confirm-btn"
            onClick={onConfirm}
            type="button"
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
