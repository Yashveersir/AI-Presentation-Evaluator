import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import Home from "./pages/Home";
import Results from "./pages/Results";
import Login from "./pages/Login";

function ProtectedRoute({ children, user, loading }) {
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-0)" }}>
        <div className="animate-pulse-glow" style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--gradient-primary)" }} />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user && !loading ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute user={user} loading={loading}><Home /></ProtectedRoute>} />
        <Route path="/results/:videoId" element={<ProtectedRoute user={user} loading={loading}><Results /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
