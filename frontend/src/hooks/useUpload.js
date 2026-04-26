import { useState, useCallback } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

/**
 * Custom hook for handling video upload to local Express backend.
 * Bypasses Firebase Storage entirely to avoid paywalls.
 */
export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [videoId, setVideoId] = useState(null);

  const uploadVideo = useCallback(async (file) => {
    const user = auth.currentUser;
    if (!user) {
      setError("You must be signed in to upload");
      return null;
    }

    // Validate file
    if (!file.type.startsWith("video/")) {
      setError("Please upload a valid video file");
      return null;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setError("File size exceeds 500MB limit");
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // We will upload directly to our local Express server on port 3001
      const formData = new FormData();
      formData.append('video', file);
      formData.append('userId', user.uid);

      // Using XMLHttpRequest instead of fetch so we can track upload progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setProgress(pct);
          }
        });

        xhr.addEventListener("load", async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            setVideoId(response.videoId);
            setUploading(false);
            setProgress(100);
            resolve(response.videoId);
          } else {
            let errorMsg = 'Upload failed';
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.error) errorMsg = res.error;
            } catch (e) {}
            
            setError(errorMsg);
            setUploading(false);
            reject(new Error(errorMsg));
          }
        });

        xhr.addEventListener("error", () => {
          setError("Network error occurred while uploading. Is the backend server running?");
          setUploading(false);
          reject(new Error("Network error"));
        });

        // Pointing to our Express backend (uses environment variable for production deployment)
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
        xhr.open("POST", `${BACKEND_URL}/api/analyze`);
        xhr.send(formData);
      });

    } catch (err) {
      setError(err.message);
      setUploading(false);
      return null;
    }
  }, []);

  const resetUpload = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setVideoId(null);
  }, []);

  return {
    uploadVideo,
    resetUpload,
    uploading,
    progress,
    error,
    videoId,
  };
}

export default useUpload;
