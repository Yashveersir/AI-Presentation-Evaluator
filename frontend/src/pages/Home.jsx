import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import { useUpload } from "../hooks/useUpload";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { BarChart3, Shield, Mic, Eye, Brain, LogOut, Sparkles, PlayCircle, Clock } from "lucide-react";

export default function Home() {
  const { uploadVideo, uploading, progress, error } = useUpload();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch user's video history
    const q = query(
      collection(db, "videos"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by uploadedAt descending locally to avoid Firestore missing index error
      docs.sort((a, b) => {
        const timeA = a.uploadedAt?.toMillis ? a.uploadedAt.toMillis() : 0;
        const timeB = b.uploadedAt?.toMillis ? b.uploadedAt.toMillis() : 0;
        return timeB - timeA;
      });
      setHistory(docs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpload = async (file) => {
    const id = await uploadVideo(file);
    if (id) {
      navigate(`/results/${id}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const features = [
    { icon: <Shield size={22} />, title: "Confidence Analysis", desc: "Voice tone and posture scoring with AI" },
    { icon: <Eye size={22} />, title: "Eye Contact Tracking", desc: "Gaze direction analysis via face landmarks" },
    { icon: <Mic size={22} />, title: "Speech Clarity", desc: "Pace, filler words, and pause detection" },
    { icon: <Brain size={22} />, title: "AI Coaching", desc: "Personalized feedback powered by Gemini" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-50)", position: "relative", overflow: "hidden" }}>
      {/* Sentiment Orbs */}
      <div className="sentiment-orb sentiment-orb-primary" style={{ top: "5%", right: "10%", width: 600, height: 600 }} />
      <div className="sentiment-orb sentiment-orb-secondary" style={{ bottom: "15%", left: "5%", width: 450, height: 450 }} />

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2rem", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--gradient-primary-vivid)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(128, 131, 255, 0.15)" }}>
            <BarChart3 size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--surface-800)", letterSpacing: "-0.02em" }}>PresentAI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user && (
            <>
              <span style={{ fontSize: "0.825rem", color: "var(--surface-700)" }}>
                {user.displayName || user.email}
              </span>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }} id="logout-btn">
                <LogOut size={14} /> Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero — Editorial asymmetric layout */}
      <div style={{ textAlign: "center", padding: "5rem 1rem 2.5rem", position: "relative", zIndex: 1 }}>
        <div className="animate-fade-in-up">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: "rgba(128, 131, 255, 0.08)", marginBottom: "2rem" }}>
            <Sparkles size={12} style={{ color: "var(--primary-100)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--primary-100)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI-Powered Analysis</span>
          </div>
        </div>

        <h1 className="animate-fade-in-up" style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.25rem", animationDelay: "0.1s", letterSpacing: "-0.02em" }}>
          <span style={{ color: "var(--surface-800)" }}>Master Your </span>
          <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Presentations</span>
        </h1>

        <p className="animate-fade-in-up" style={{ fontSize: "0.975rem", color: "var(--surface-700)", maxWidth: 520, margin: "0 auto 3rem", lineHeight: 1.8, animationDelay: "0.2s" }}>
          Upload your presentation video and receive comprehensive AI analysis — confidence scoring, speech clarity metrics, eye contact tracking, and personalized coaching feedback.
        </p>
      </div>

      {/* Upload Section */}
      <div className="animate-fade-in-up" style={{ padding: "0 1rem 2.5rem", position: "relative", zIndex: 1, animationDelay: "0.3s" }}>
        <UploadZone onUpload={handleUpload} uploading={uploading} progress={progress} error={error} />
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="animate-fade-in-up" style={{ maxWidth: 760, margin: "0 auto", padding: "0 1rem 4rem", position: "relative", zIndex: 1, animationDelay: "0.4s" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--surface-800)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={18} style={{ color: "var(--primary-100)" }} /> Recent Analyses
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {history.map((video) => (
              <div 
                key={video.id} 
                onClick={() => navigate(`/results/${video.id}`)}
                className="glass-card" 
                style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "transform 0.2s, background 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "var(--surface-100)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.background = "var(--surface-0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <PlayCircle size={20} style={{ color: "var(--primary-200)" }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--surface-800)", fontSize: "0.95rem" }}>{video.fileName || "Presentation Video"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--surface-600)", marginTop: 2 }}>
                      {video.uploadedAt?.toDate ? new Date(video.uploadedAt.toDate()).toLocaleDateString() : "Just now"} • {video.status === 'done' ? 'Analyzed' : 'Processing'}
                    </div>
                  </div>
                </div>
                {video.status === 'done' && (
                  <div style={{ padding: "4px 12px", borderRadius: 999, background: "rgba(128, 131, 255, 0.1)", color: "var(--primary-100)", fontSize: "0.75rem", fontWeight: 700 }}>
                    View Results
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features — Editorial card grid */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 1rem 5rem", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1.25rem" }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card animate-fade-in-up" style={{ padding: "1.75rem", textAlign: "center", animationDelay: `${0.4 + i * 0.1}s` }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(128, 131, 255, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: "var(--primary-100)" }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--surface-800)", marginBottom: 6, letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--surface-700)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
