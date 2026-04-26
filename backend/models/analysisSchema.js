/**
 * Firestore data model schema definitions for the AI Presentation Evaluator.
 * These are reference schemas — Firestore is schemaless, but these
 * serve as documentation and validation references.
 */

const AnalysisSchema = {
  /**
   * /analysis_results/{videoId}
   */
  analysisResult: {
    videoId: "",              // string - Reference to video document
    userId: "",               // string - Reference to user document
    transcript: "",           // string - Full speech transcript

    fillerWords: [
      // { word: string, count: number, timestamps: number[] }
    ],

    pauses: [
      // { start: number, end: number, duration: number }
    ],

    eyeContactScore: 0,      // number (0–100)

    emotionData: [
      // { timestamp: number, emotion: string, confidence: number }
    ],

    speechMetrics: {
      wpm: 0,                // Words per minute
      clarityScore: 0,       // 0–100
      volumeVariance: 0,     // Standard deviation of volume
    },

    scores: {
      confidence: 0,         // 0–100
      speechClarity: 0,      // 0–100
      eyeContact: 0,         // 0–100
      engagement: 0,         // 0–100
      overall: 0,            // 0–100 (weighted composite)
    },

    feedback: {
      strengths: [],         // string[] - 3 specific strengths
      improvements: [],      // string[] - 3 areas to improve
      actionItems: [],       // string[] - 3 actionable steps
    },

    processedAt: null,       // Firestore Timestamp
  },

  /**
   * /videos/{videoId}
   */
  video: {
    userId: "",
    fileName: "",
    storageUrl: "",
    uploadedAt: null,        // Firestore Timestamp
    status: "pending",       // "pending" | "processing" | "done" | "failed"
    duration: 0,
    errorMessage: null,
  },

  /**
   * /users/{userId}
   */
  user: {
    email: "",
    displayName: "",
    createdAt: null,         // Firestore Timestamp
    totalAnalyses: 0,
  },
};

/**
 * Validate that analysis results contain all required fields.
 * @param {Object} results - Analysis results object.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateAnalysisResults(results) {
  const errors = [];

  if (!results.videoId) errors.push("Missing videoId");
  if (!results.userId) errors.push("Missing userId");
  if (typeof results.transcript !== "string") errors.push("Missing or invalid transcript");

  if (!Array.isArray(results.fillerWords)) {
    errors.push("fillerWords must be an array");
  }

  if (!Array.isArray(results.pauses)) {
    errors.push("pauses must be an array");
  }

  if (typeof results.eyeContactScore !== "number" || results.eyeContactScore < 0 || results.eyeContactScore > 100) {
    errors.push("eyeContactScore must be a number between 0 and 100");
  }

  if (!Array.isArray(results.emotionData)) {
    errors.push("emotionData must be an array");
  }

  if (!results.speechMetrics || typeof results.speechMetrics.wpm !== "number") {
    errors.push("speechMetrics.wpm is required");
  }

  if (!results.scores || typeof results.scores.overall !== "number") {
    errors.push("scores.overall is required");
  }

  if (!results.feedback || !Array.isArray(results.feedback.strengths)) {
    errors.push("feedback.strengths must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  AnalysisSchema,
  validateAnalysisResults,
};
