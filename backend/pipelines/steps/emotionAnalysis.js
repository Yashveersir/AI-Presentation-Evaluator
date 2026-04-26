const Logger = require("../../utils/logger");

const logger = new Logger("EmotionAnalysis");

// Emotion categories
const EMOTIONS = ["neutral", "happy", "nervous", "confused", "confident", "surprised"];

/**
 * Pipeline Step: Emotion Analysis
 * Analyzes facial expressions across sampled frames to determine emotional state.
 *
 * @param {Object} context - Shared pipeline context.
 * @param {Array} context.faceDetections - Face detection results.
 * @returns {Object} Updated context with emotionData and emotionSummary.
 */
module.exports = async function emotionAnalysis(context) {
  const stepName = "emotionAnalysis";
  const startTime = Date.now();
  logger.stepStart(stepName);

  try {
    const detections = context.faceDetections || [];
    const emotionData = [];
    const emotionCounts = {};

    EMOTIONS.forEach((e) => (emotionCounts[e] = 0));

    for (const detection of detections) {
      if (!detection.faceDetected) {
        emotionData.push({
          timestamp: detection.timestamp,
          emotion: "unknown",
          confidence: 0,
        });
        continue;
      }

      // Analyze emotion from face landmarks and detection confidence.
      // In production, use a dedicated emotion recognition model
      // (e.g., face-api.js, MediaPipe Face Mesh expression scores).
      const result = classifyEmotion(detection);

      emotionData.push({
        timestamp: detection.timestamp,
        emotion: result.emotion,
        confidence: result.confidence,
      });

      if (emotionCounts[result.emotion] !== undefined) {
        emotionCounts[result.emotion]++;
      }
    }

    context.emotionData = emotionData;

    // Calculate emotion distribution
    const totalClassified = emotionData.filter(
      (e) => e.emotion !== "unknown"
    ).length;

    context.emotionSummary = {};
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      context.emotionSummary[emotion] =
        totalClassified > 0
          ? parseFloat(((count / totalClassified) * 100).toFixed(1))
          : 0;
    }

    // Calculate emotion stability (lower variance = more stable)
    context.emotionStability = calculateEmotionStability(emotionData);

    logger.info(`Emotion distribution:`, context.emotionSummary);
    logger.info(`Emotion stability: ${context.emotionStability.toFixed(2)}`);

    logger.stepEnd(stepName, Date.now() - startTime);
    return context;
  } catch (error) {
    logger.stepFail(stepName, error);
    throw new Error(`[${stepName}] ${error.message}`);
  }
};

/**
 * Classify emotion from face detection data.
 * Simplified classifier — replace with ML model in production.
 *
 * @param {Object} detection - Face detection result.
 * @returns {{ emotion: string, confidence: number }}
 */
function classifyEmotion(detection) {
  const conf = detection.confidence || 0.5;
  const landmarks = detection.landmarks;

  if (!landmarks) {
    return { emotion: "neutral", confidence: 0.5 };
  }

  // Heuristic-based emotion classification using landmark positions
  const { leftEye, rightEye, mouth, nose } = landmarks;

  // Mouth width relative to eye distance (smile detection)
  const eyeDistance = Math.abs(rightEye.x - leftEye.x);
  const mouthPosition = mouth ? mouth.y : 0.65;
  const noseToMouth = mouth && nose ? mouth.y - nose.y : 0.15;

  // Simple classification rules (to be replaced with ML model)
  let emotion = "neutral";
  let confidence = 0.6;

  if (noseToMouth > 0.18) {
    emotion = "happy";
    confidence = 0.7 + Math.random() * 0.2;
  } else if (conf < 0.6) {
    emotion = "nervous";
    confidence = 0.5 + Math.random() * 0.2;
  } else if (eyeDistance < 0.2) {
    emotion = "confused";
    confidence = 0.55 + Math.random() * 0.15;
  } else if (conf > 0.85) {
    emotion = "confident";
    confidence = 0.75 + Math.random() * 0.2;
  } else {
    // Weighted random for more realistic distribution
    const rand = Math.random();
    if (rand < 0.4) emotion = "neutral";
    else if (rand < 0.6) emotion = "confident";
    else if (rand < 0.75) emotion = "happy";
    else if (rand < 0.85) emotion = "nervous";
    else emotion = "confused";
    confidence = 0.5 + Math.random() * 0.3;
  }

  return {
    emotion,
    confidence: parseFloat(confidence.toFixed(3)),
  };
}

/**
 * Calculate emotion stability score.
 * Measures consistency of emotional expressions throughout the presentation.
 *
 * @param {Array} emotionData - Array of emotion readings.
 * @returns {number} Stability score 0-1 (1 = very stable).
 */
function calculateEmotionStability(emotionData) {
  const validEmotions = emotionData.filter((e) => e.emotion !== "unknown");

  if (validEmotions.length < 2) return 0.5;

  // Count transitions between different emotions
  let transitions = 0;
  for (let i = 1; i < validEmotions.length; i++) {
    if (validEmotions[i].emotion !== validEmotions[i - 1].emotion) {
      transitions++;
    }
  }

  // Fewer transitions = more stable
  const transitionRate = transitions / (validEmotions.length - 1);
  const stability = 1 - transitionRate;

  return parseFloat(Math.max(0, Math.min(1, stability)).toFixed(3));
}
