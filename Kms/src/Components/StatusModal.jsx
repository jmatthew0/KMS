import React from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export default function StatusModal({
  open,
  type = "success", // "success" | "error"
  title,
  message,
  onClose,
}) {
  if (!open) return null;

  const Icon = type === "success" ? CheckCircle : XCircle;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content logout-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <div className="modal-header">
          <h2>{title || (type === "success" ? "Success" : "Error")}</h2>
          <button className="close-button" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="logout-modal-content">
            <Icon size={44} className="logout-icon" />
            <p className="logout-modal-title" style={{ lineHeight: 1.4 }}>
              {message}
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="save-button logout-confirm-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
