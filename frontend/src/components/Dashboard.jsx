import ScoreCard from "./ScoreCard";
import MetricsChart from "./MetricsChart";
import TranscriptPanel from "./TranscriptPanel";
import FeedbackPanel from "./FeedbackPanel";
import VideoPreview from "./VideoPreview";
import { Download, RefreshCw, TrendingUp, Mic, Eye, Sparkles } from "lucide-react";
import { downloadPDFReport } from "../lib/api";

export default function Dashboard({ analysis, video }) {
  if (!analysis) return null;

  const { scores = {}, speechMetrics = {}, emotionData = [], eyeContactData = [], fillerWords = [], pauses = [], transcript = "", feedback = {} } = analysis;

  const handleExport = () => {
    downloadPDFReport(analysis, video?.fileName || "presentation");
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--surface-950)", marginBottom: 4 }}>
            Analysis Results
          </h1>
          <p style={{ color: "var(--surface-600)", fontSize: "0.9rem" }}>
            {video?.fileName || "Your Presentation"} • {new Date().toLocaleDateString()}
          </p>
        </div>
        <button className="btn-primary" onClick={handleExport} id="export-btn">
          <Download size={18} /> Export PDF
        </button>
      </div>

      {/* Top Row: Overall + Video */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="animate-fade-in-up">
          <ScoreCard score={scores.overall || 0} label="Overall Score" size={200} subtitle="Weighted composite" />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {video?.videoUrl || video?.downloadURL ? (
            <VideoPreview videoUrl={video.videoUrl || video.downloadURL} fileName={video.fileName} />
          ) : (
            <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--surface-500)", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              Video preview unavailable
            </div>
          )}
        </div>
      </div>

      {/* Score Breakdown Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { score: scores.confidence, label: "Confidence", icon: <TrendingUp size={18} color="#6366f1" />, sub: "Posture & tone" },
          { score: scores.speechClarity, label: "Speech Clarity", icon: <Mic size={18} color="#8b5cf6" />, sub: `${speechMetrics.wpm || 0} WPM` },
          { score: scores.eyeContact, label: "Eye Contact", icon: <Eye size={18} color="#22c55e" />, sub: "Gaze tracking" },
          { score: scores.engagement, label: "Engagement", icon: <Sparkles size={18} color="#f59e0b" />, sub: "Audience impact" },
        ].map((item, i) => (
          <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
            <ScoreCard score={item.score || 0} label={item.label} size={100} strokeWidth={7} subtitle={item.sub} icon={item.icon} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <MetricsChart emotionData={emotionData} eyeContactData={eyeContactData || []} fillerWords={fillerWords} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <TranscriptPanel transcript={transcript} fillerWords={fillerWords} pauses={pauses} />
          </div>
        </div>
      </div>

      {/* AI Feedback */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
        <FeedbackPanel feedback={feedback} />
      </div>
    </div>
  );
}
