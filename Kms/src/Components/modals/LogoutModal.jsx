import React from "react";
import { X, LogOut } from "lucide-react";

export default function LogoutModal({ open, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content-small"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Confirm Logout</h2>
          <button className="modal-close" onClick={onCancel} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p>Are you sure you want to logout?</p>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="btn-logout" onClick={onConfirm} type="button">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
