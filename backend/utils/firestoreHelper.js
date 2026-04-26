const admin = require("firebase-admin");
const Logger = require("./logger");

const logger = new Logger("FirestoreHelper");

/**
 * Get a Firestore reference.
 */
function getFirestore() {
  return admin.firestore();
}

/**
 * Create or update a user document.
 */
async function upsertUser(userId, data) {
  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      email: data.email || "",
      displayName: data.displayName || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      totalAnalyses: 0,
    });
    logger.info(`Created new user: ${userId}`);
  }

  return userRef;
}

/**
 * Create a video document with pending status.
 */
async function createVideoDoc(videoId, data) {
  const db = getFirestore();
  const videoRef = db.collection("videos").doc(videoId);

  await videoRef.set({
    userId: data.userId,
    fileName: data.fileName,
    storageUrl: data.storageUrl || "",
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "pending",
    duration: data.duration || 0,
    errorMessage: null,
  });

  logger.info(`Created video doc: ${videoId}`);
  return videoRef;
}

/**
 * Update video processing status.
 */
async function updateVideoStatus(videoId, status, errorMessage = null) {
  const db = getFirestore();
  const update = { status };

  if (errorMessage) {
    update.errorMessage = errorMessage;
  }

  if (status === "done") {
    update.processedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await db.collection("videos").doc(videoId).update(update);
  logger.info(`Video ${videoId} status → ${status}`);
}

/**
 * Write full analysis results to Firestore.
 */
async function writeAnalysisResults(videoId, results) {
  const db = getFirestore();
  const resultsRef = db.collection("analysis_results").doc(videoId);

  await resultsRef.set({
    videoId,
    userId: results.userId,
    transcript: results.transcript || "",
    fillerWords: results.fillerWords || [],
    pauses: results.pauses || [],
    eyeContactScore: results.eyeContactScore || 0,
    emotionData: results.emotionData || [],
    speechMetrics: results.speechMetrics || {
      wpm: 0,
      clarityScore: 0,
      volumeVariance: 0,
    },
    scores: results.scores || {
      confidence: 0,
      speechClarity: 0,
      eyeContact: 0,
      engagement: 0,
      overall: 0,
    },
    feedback: results.feedback || {
      strengths: [],
      improvements: [],
      actionItems: [],
    },
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info(`Analysis results written for video: ${videoId}`);
  return resultsRef;
}

/**
 * Get analysis results for a video.
 */
async function getAnalysisResults(videoId) {
  const db = getFirestore();
  const doc = await db.collection("analysis_results").doc(videoId).get();

  if (!doc.exists) {
    return null;
  }

  return { id: doc.id, ...doc.data() };
}

/**
 * Increment user's total analyses count.
 */
async function incrementUserAnalyses(userId) {
  const db = getFirestore();
  await db.collection("users").doc(userId).update({
    totalAnalyses: admin.firestore.FieldValue.increment(1),
  });
}

/**
 * Get video document.
 */
async function getVideoDoc(videoId) {
  const db = getFirestore();
  const doc = await db.collection("videos").doc(videoId).get();

  if (!doc.exists) {
    return null;
  }

  return { id: doc.id, ...doc.data() };
}

module.exports = {
  getFirestore,
  upsertUser,
  createVideoDoc,
  updateVideoStatus,
  writeAnalysisResults,
  getAnalysisResults,
  incrementUserAnalyses,
  getVideoDoc,
};
