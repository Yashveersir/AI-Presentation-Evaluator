import { useState, useEffect, useCallback, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Custom hook for polling/subscribing to analysis results.
 * Uses Firestore real-time listener with exponential backoff fallback.
 */
export function useAnalysis(videoId) {
  const [video, setVideo] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | pending | processing | done | failed
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const unsubscribeRef = useRef([]);

  // Subscribe to video document for status changes
  const subscribe = useCallback(() => {
    if (!videoId) return;

    setLoading(true);
    setError(null);

    // Subscribe to video document
    const videoUnsub = onSnapshot(
      doc(db, "videos", videoId),
      (snapshot) => {
        if (snapshot.exists()) {
          const videoData = { id: snapshot.id, ...snapshot.data() };
          setVideo(videoData);
          setStatus(videoData.status || "pending");

          if (videoData.status === "failed") {
            setError(videoData.errorMessage || "Analysis failed");
            setLoading(false);
          }

          if (videoData.status === "done") {
            setLoading(false);
          }
        } else {
          setError("Video not found");
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // Subscribe to analysis results
    const analysisUnsub = onSnapshot(
      doc(db, "analysis_results", videoId),
      (snapshot) => {
        if (snapshot.exists()) {
          setAnalysis({ id: snapshot.id, ...snapshot.data() });
        }
      },
      (err) => {
        console.warn("Analysis results listener error:", err.message);
      }
    );

    unsubscribeRef.current = [videoUnsub, analysisUnsub];
  }, [videoId]);

  // Auto-subscribe when videoId changes
  useEffect(() => {
    if (videoId) {
      subscribe();
    }

    return () => {
      unsubscribeRef.current.forEach((unsub) => unsub && unsub());
      unsubscribeRef.current = [];
    };
  }, [videoId, subscribe]);

  // Retry mechanism
  const retry = useCallback(() => {
    unsubscribeRef.current.forEach((unsub) => unsub && unsub());
    unsubscribeRef.current = [];
    subscribe();
  }, [subscribe]);

  return {
    video,
    analysis,
    status,
    error,
    loading,
    retry,
    isProcessing: status === "processing" || status === "pending",
    isDone: status === "done",
    isFailed: status === "failed",
  };
}

export default useAnalysis;
