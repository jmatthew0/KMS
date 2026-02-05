import React, { useEffect, useState } from "react";
import { Download, FileText, X } from "lucide-react";

export default function DocumentViewerModal({
  open,
  document,
  onClose,
  onDownload,
}) {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    if (!open || !document) return;

    if (document.attachments && document.attachments.length > 0) {
      loadAttachmentsUrls(document.attachments);
    } else {
      setAttachments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, document?.id]);

  const loadAttachmentsUrls = async (attachmentsData) => {
    setLoadingAttachments(true);
    try {
      // ✅ path: modals is inside Components, so go up one to Components, then to lib
      const supabaseModule = await import("../../lib/supabaseClient");
      const supabaseClient = supabaseModule.supabase;

      const attachmentsWithUrls = attachmentsData.map((attachment) => {
        const { data: urlData } = supabaseClient.storage
          .from("document-attachments")
          .getPublicUrl(attachment.file_path);

        return { ...attachment, url: urlData.publicUrl };
      });

      setAttachments(attachmentsWithUrls);
    } catch (err) {
      console.error("Error loading attachments:", err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleOpenAttachment = (url) => window.open(url, "_blank");

  const getFileExtension = (fileName) => {
    if (!fileName) return "";
    return fileName.split(".").pop().toLowerCase();
  };

  const getFileIcon = (fileName) => {
    const ext = getFileExtension(fileName);

    if (["pdf"].includes(ext)) return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
    if (["ppt", "pptx"].includes(ext)) return "📽️";
    if (["txt"].includes(ext)) return "📃";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼️";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "🗜️";
    if (["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"].includes(ext)) return "🎬";
    if (["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)) return "🎵";
    if (["js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "html", "css"].includes(ext)) return "💻";

    return "📎";
  };

  if (!open || !document) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{document.title}</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="viewer-content">
          <div className="viewer-meta">
            {document.category && <span className="meta-badge">{document.category.name}</span>}
            <span className="meta-text">{new Date(document.created_at).toLocaleDateString()}</span>
            <span className="meta-text">{document.views_count || 0} views</span>
          </div>

          {document.summary && (
            <div className="document-summary">
              <strong>Summary:</strong> {document.summary}
            </div>
          )}

          {attachments.length > 0 && (
            <div className="attachments-section">
              <div className="attachments-header">
                <FileText size={20} />
                <strong>Attached Files ({attachments.length}):</strong>
              </div>

              {loadingAttachments && (
                <div className="loading-attachments">Loading attachments...</div>
              )}

              {!loadingAttachments &&
                attachments.map((attachment) => {
                  const fileExt = getFileExtension(attachment.file_name);
                  const isPDF = fileExt === "pdf";
                  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(fileExt);
                  const isVideo = ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"].includes(fileExt);
                  const isAudio = ["mp3", "wav", "ogg", "flac", "m4a"].includes(fileExt);
                  const fileIcon = getFileIcon(attachment.file_name);

                  return (
                    <div key={attachment.id} className="attachment-item">
                      <div className="attachment-info">
                        <div className="attachment-details">
                          <span className="file-icon">{fileIcon}</span>
                          <div>
                            <div className="file-name">{attachment.file_name}</div>
                            <div className="file-meta">
                              {fileExt.toUpperCase()} • {(attachment.file_size / 1024).toFixed(2)} KB
                            </div>
                          </div>
                        </div>

                        <button
                          className="action-btn-sm"
                          onClick={() => handleOpenAttachment(attachment.url)}
                          type="button"
                        >
                          <Download size={16} />
                          Open
                        </button>
                      </div>

                      {isPDF && attachment.url && (
                        <div className="file-preview">
                          <iframe
                            src={attachment.url}
                            className="pdf-viewer"
                            title={attachment.file_name}
                          />
                        </div>
                      )}

                      {isImage && attachment.url && (
                        <div className="file-preview image-preview">
                          <img
                            src={attachment.url}
                            alt={attachment.file_name}
                            className="image-viewer"
                          />
                        </div>
                      )}

                      {isVideo && attachment.url && (
                        <div className="file-preview">
                          <video controls className="video-viewer">
                            <source src={attachment.url} type={attachment.mime_type} />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}

                      {isAudio && attachment.url && (
                        <div className="file-preview">
                          <audio controls className="audio-viewer">
                            <source src={attachment.url} type={attachment.mime_type} />
                            Your browser does not support the audio tag.
                          </audio>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          <div className="viewer-body">
            <h3>Content:</h3>
            <p>{document.content}</p>
          </div>

          <div className="viewer-actions">
            <button className="action-btn-sm" onClick={() => onDownload(document)} type="button">
              <Download size={16} />
              Download Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
