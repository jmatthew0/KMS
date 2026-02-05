import React from "react";
import { LogOut, X } from "lucide-react";

export default function LogoutModal({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content logout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Confirm Logout</h2>
          <button className="close-button" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="logout-modal-content">
            <LogOut size={40} className="logout-icon" />
            <p className="logout-modal-title">Are you sure you want to logout?</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="save-button logout-confirm-btn" onClick={onConfirm} type="button">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
