import React from "react";
import { Edit3, X } from "lucide-react";

export default function EditDocumentModal({
  open,
  onClose,
  onSubmit,
  uploading,
  categories,
  newDocTitle,
  setNewDocTitle,
  newDocContent,
  setNewDocContent,
  newDocSummary,
  setNewDocSummary,
  newDocCategory,
  setNewDocCategory,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* ✅ make it wide */}
      <div className="modal-content large form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Document</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {/* ✅ 2-column layout */}
          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Document Title *</label>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Enter document title"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value)}
                className="form-select"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full">
              <label className="form-label">Content *</label>
              <textarea
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                placeholder="Enter document content"
                className="form-textarea"
                rows={8}
                required
              />
            </div>

            <div className="form-group full">
              <label className="form-label">Summary</label>
              <textarea
                value={newDocSummary}
                onChange={(e) => setNewDocSummary(e.target.value)}
                placeholder="Brief summary of the document"
                className="form-textarea"
                rows={3}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={uploading}>
              <Edit3 size={16} />
              {uploading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
