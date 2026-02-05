import React from "react";
import { History, X } from "lucide-react";

export default function VersionHistoryModal({ open, document, onClose }) {
  if (!open || !document) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title version-title">
            <History size={20} className="version-title-icon" />
            Version History - {document.title}
          </h2>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="version-modal-body">
          <div className="version-empty">
            <History size={48} className="version-empty-icon" />
            <p>Version history feature coming soon!</p>
            <p className="version-empty-subtext">This will show all previous versions of this document.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
