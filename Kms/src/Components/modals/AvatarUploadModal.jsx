import React from "react";
import { X, Camera, Loader2 } from "lucide-react";

export default function AvatarUploadModal({
  open,
  uploading,
  error,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Updating Profile Picture</h2>
          {!uploading && (
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        <div style={{ padding: "1.5rem", textAlign: "center" }}>
          {uploading ? (
            <>
              <Loader2 className="spin" size={32} />
              <p style={{ marginTop: "1rem" }}>Uploading avatar…</p>
            </>
          ) : error ? (
            <p style={{ color: "#dc2626" }}>{error}</p>
          ) : (
            <>
              <Camera size={32} />
              <p style={{ marginTop: "1rem" }}>
                Profile picture updated successfully!
              </p>
            </>
          )}
        </div>

        {!uploading && (
          <div className="modal-actions">
            <button className="btn-submit" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
