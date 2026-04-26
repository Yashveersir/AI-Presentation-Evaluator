import { useParams, useNavigate } from "react-router-dom";
import { useAnalysis } from "../hooks/useAnalysis";
import Dashboard from "../components/Dashboard";
import { ArrowLeft, Loader, AlertCircle, RefreshCw } from "lucide-react";

export default function Results() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { video, analysis, status, error, loading, retry, isProcessing, isDone, isFailed } = useAnalysis(videoId);

  return (
    <div style={{ minHeight: "100vh", background: "var(--gradient-hero)" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 2rem", borderBottom: "1px solid var(--glass-border)" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--surface-700)", display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem" }} id="back-btn">
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ flex: 1 }} />
        {status && (
          <span className={`status-badge status-${status}`}>
            {status === "processing" && <span className="animate-spin-slow" style={{ display: "inline-block" }}>⟳</span>}
            {status}
          </span>
        )}
      </nav>

      {/* Loading / Processing State */}
      {(isProcessing || loading) && !isDone && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1.5rem", padding: "2rem" }}>
          <div className="animate-pulse-glow" style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader size={32} color="white" className="animate-spin-slow" style={{ animation: "spin-slow 2s linear infinite" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--surface-900)", marginBottom: 8 }}>
              Analyzing Your Presentation
            </h2>
            <p style={{ color: "var(--surface-600)", maxWidth: 400, lineHeight: 1.6 }}>
              Our AI is processing your video — extracting audio, analyzing speech patterns, detecting facial expressions, and generating personalized feedback. This may take a few minutes.
            </p>
          </div>

          {/* Processing steps indicator */}
          <div className="glass-card" style={{ padding: "1.5rem 2rem", marginTop: "1rem", minWidth: 300 }}>
            {["Extracting audio", "Transcribing speech", "Analyzing expressions", "Calculating scores", "Generating feedback"].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < 4 ? "1px solid var(--glass-border)" : "none" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--surface-300)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="animate-shimmer" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary-500)" }} />
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--surface-700)" }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {isFailed && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1.5rem", padding: "2rem" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={36} color="var(--danger-400)" />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--surface-900)", marginBottom: 8 }}>
              Analysis Failed
            </h2>
            <p style={{ color: "var(--surface-600)", maxWidth: 400, marginBottom: "1rem" }}>
              {error || "An unexpected error occurred during processing."}
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button className="btn-secondary" onClick={() => navigate("/")} id="go-home">
                Upload New Video
              </button>
              <button className="btn-primary" onClick={retry} id="retry-btn">
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Dashboard */}
      {isDone && analysis && <Dashboard analysis={analysis} video={video} />}
    </div>
  );
}
