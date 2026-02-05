import React, { useRef } from "react";
import { Upload, X } from "lucide-react";

export default function UploadDocumentModal({
  open,
  uploading,
  onClose,
  onSubmit,
  categories,

  newDocTitle,
  setNewDocTitle,
  newDocContent,
  setNewDocContent,
  newDocSummary,
  setNewDocSummary,
  newDocCategory,
  setNewDocCategory,

  // ✅ DocumentsPortal uses these:
  selectedFile,
  onFileSelect,

  // ✅ Home (your current Home.jsx) passes this instead:
  setSelectedFile,
}) {
  const fileInputRef = useRef(null);

  if (!open) return null;

  const handleFileChange = (e) => {
    // Support BOTH calling styles (DocumentsPortal + Home)
    if (onFileSelect) return onFileSelect(e);

    const file = e.target.files?.[0];
    if (file && typeof setSelectedFile === "function") setSelectedFile(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Upload Document</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
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
            <label className="form-label">Content *</label>
            <textarea
              value={newDocContent}
              onChange={(e) => setNewDocContent(e.target.value)}
              placeholder="Enter document content"
              className="form-input"
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Summary</label>
            <textarea
              value={newDocSummary}
              onChange={(e) => setNewDocSummary(e.target.value)}
              placeholder="Brief summary of the document"
              className="form-input"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              value={newDocCategory}
              onChange={(e) => setNewDocCategory(e.target.value)}
              className="form-select"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Attach File (Optional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="file-input"
              ref={fileInputRef}
            />

            {/* show selected file name (supports both props) */}
            {selectedFile && <p className="file-selected">Selected: {selectedFile.name}</p>}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>

            <button type="submit" className="btn-submit" disabled={uploading}>
              <Upload size={16} />
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
