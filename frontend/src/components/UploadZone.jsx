import { useState, useRef, useCallback } from "react";
import { Upload, Film, X, AlertCircle } from "lucide-react";

export default function UploadZone({ onUpload, uploading, progress, error }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      selectFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      selectFile(file);
    }
  }, []);

  const selectFile = (file) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ width: "100%", maxWidth: 672, margin: "0 auto", textAlign: "center" }}>
      {!selectedFile ? (
        <div
          className={`upload-zone ${dragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          id="upload-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />

          <div className="animate-float" style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                boxShadow: "0 8px 24px rgba(99, 102, 241, 0.3)",
              }}
            >
              <Upload size={32} color="white" />
            </div>
          </div>

          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--surface-900)",
              marginBottom: "0.5rem",
            }}
          >
            Upload Your Presentation
          </h3>
          <p style={{ color: "var(--surface-600)", marginBottom: "1rem" }}>
            Drag & drop your video file here, or click to browse
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--surface-500)" }}>
            Supports MP4, MOV, AVI, WebM • Max 500MB
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: "1.5rem", textAlign: "left" }}>
          {/* File Preview */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <div
              style={{
                position: "relative",
                width: 200,
                minWidth: 200,
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--glass-border)",
              }}
            >
              {preview && (
                <video
                  src={preview}
                  style={{ width: "100%", height: 120, objectFit: "cover" }}
                  muted
                />
              )}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  background: "rgba(0,0,0,0.7)",
                  borderRadius: 8,
                  padding: "2px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Film size={12} color="white" />
                <span style={{ fontSize: "0.7rem", color: "white" }}>
                  {selectedFile.type.split("/")[1]?.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4
                    style={{
                      color: "var(--surface-900)",
                      fontWeight: 600,
                      marginBottom: 4,
                      wordBreak: "break-all",
                    }}
                  >
                    {selectedFile.name}
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--surface-600)" }}>
                    {formatSize(selectedFile.size)}
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={clearSelection}
                    style={{
                      background: "var(--surface-300)",
                      border: "none",
                      borderRadius: 8,
                      padding: 6,
                      cursor: "pointer",
                      color: "var(--surface-700)",
                      display: "flex",
                    }}
                    id="clear-selection"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div style={{ marginTop: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", color: "var(--primary-400)", fontWeight: 600 }}>
                      Uploading...
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--surface-600)" }}>
                      {progress}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "var(--surface-300)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: "var(--gradient-primary)",
                        borderRadius: 3,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    borderRadius: 8,
                    color: "var(--danger-400)",
                    fontSize: "0.85rem",
                  }}
                >
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Upload Button */}
              {!uploading && (
                <button
                  className="btn-primary"
                  onClick={handleUpload}
                  style={{ marginTop: "1rem", width: "100%" }}
                  id="upload-button"
                >
                  <Upload size={18} />
                  Analyze Presentation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
