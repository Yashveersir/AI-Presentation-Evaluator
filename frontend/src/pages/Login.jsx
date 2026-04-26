import { useState } from "react";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err) {
      const msg = err.code === "auth/invalid-credential" ? "Invalid email or password" :
                  err.code === "auth/email-already-in-use" ? "Email already registered" :
                  err.code === "auth/weak-password" ? "Password must be at least 6 characters" :
                  err.code === "auth/configuration-not-found" ? "Please enable Email/Password auth in Firebase Console" : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-50)", padding: "1rem", position: "relative", overflow: "hidden" }}>
      {/* Sentiment Orbs — ambient decorations */}
      <div className="sentiment-orb sentiment-orb-primary" style={{ top: "15%", left: "25%", width: 500, height: 500 }} />
      <div className="sentiment-orb sentiment-orb-secondary" style={{ bottom: "5%", right: "15%", width: 400, height: 400 }} />

      <div className="glass-card animate-fade-in-up" style={{ width: "100%", maxWidth: 420, padding: "3rem 2.5rem", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--gradient-primary-vivid)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", boxShadow: "0 12px 40px rgba(128, 131, 255, 0.2)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--surface-800)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Presentation AI
          </h1>
          <p style={{ color: "var(--surface-700)", fontSize: "0.875rem", marginTop: 8, letterSpacing: "0" }}>
            {isSignUp ? "Create your account" : "Sign in to analyze your presentations"}
          </p>
        </div>

        {/* Google Login */}
        <button onClick={handleGoogleLogin} disabled={loading} id="google-login"
          style={{ width: "100%", padding: "0.85rem", borderRadius: "1rem", border: "1px solid rgba(70, 69, 84, 0.2)", background: "var(--surface-0)", color: "var(--surface-800)", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.3s", marginBottom: "1.75rem" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(192, 193, 255, 0.3)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(128, 131, 255, 0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(70, 69, 84, 0.2)"; e.currentTarget.style.boxShadow = "none"; }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        {/* Divider — no hard lines, use tonal contrast */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--surface-500), transparent)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--surface-600)", letterSpacing: "0.1em", textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--surface-500), transparent)" }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--primary-100)" }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required id="email-input"
              style={{ width: "100%", padding: "0.85rem 0.85rem 0.85rem 2.75rem", borderRadius: "0.75rem", border: "1px solid rgba(70, 69, 84, 0.2)", background: "var(--surface-0)", color: "var(--surface-800)", fontSize: "0.875rem", outline: "none", transition: "all 0.3s", fontFamily: "var(--font-sans)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(192, 193, 255, 0.5)"; e.target.style.boxShadow = "0 0 16px rgba(221, 183, 255, 0.08)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(70, 69, 84, 0.2)"; e.target.style.boxShadow = "none"; }} />
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--primary-100)" }} />
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required id="password-input"
              style={{ width: "100%", padding: "0.85rem 2.75rem 0.85rem 2.75rem", borderRadius: "0.75rem", border: "1px solid rgba(70, 69, 84, 0.2)", background: "var(--surface-0)", color: "var(--surface-800)", fontSize: "0.875rem", outline: "none", transition: "all 0.3s", fontFamily: "var(--font-sans)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(192, 193, 255, 0.5)"; e.target.style.boxShadow = "0 0 16px rgba(221, 183, 255, 0.08)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(70, 69, 84, 0.2)"; e.target.style.boxShadow = "none"; }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--surface-600)", display: "flex", padding: 4 }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div style={{ padding: "0.6rem 0.85rem", background: "rgba(255, 180, 171, 0.08)", borderRadius: "0.5rem", color: "var(--danger-400)", fontSize: "0.825rem", lineHeight: 1.4 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} id="auth-submit"
            style={{ width: "100%", padding: "0.9rem", marginTop: 4 }}>
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Toggle */}
        <p style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.825rem", color: "var(--surface-700)" }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            style={{ background: "none", border: "none", color: "var(--primary-100)", cursor: "pointer", fontWeight: 600, fontSize: "0.825rem", textDecoration: "none" }}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
