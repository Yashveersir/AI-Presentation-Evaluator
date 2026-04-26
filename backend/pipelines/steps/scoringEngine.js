const Logger = require("../../utils/logger");

const logger = new Logger("ScoringEngine");

// Scoring weights
const WEIGHTS = {
  confidence: 0.30,
  speechClarity: 0.25,
  eyeContact: 0.25,
  engagement: 0.20,
};

// Ideal speech pace range (WPM)
const IDEAL_WPM_MIN = 120;
const IDEAL_WPM_MAX = 160;

// Penalty coefficients
const FILLER_WORD_PENALTY = 1.5;
const LONG_PAUSE_PENALTY = 3.0;
const VOLUME_VARIANCE_PENALTY = 0.5;

/**
 * Pipeline Step: Scoring Engine
 * Calculates all individual scores and the overall weighted presentation score.
 *
 * @param {Object} context - Shared pipeline context.
 * @returns {Object} Updated context with scores and speechMetrics.
 */
module.exports = async function scoringEngine(context) {
  const stepName = "scoringEngine";
  const startTime = Date.now();
  logger.stepStart(stepName);

  try {
    // Calculate Speech Clarity Score
    const speechClarityScore = calculateSpeechClarity(context);

    // Calculate Confidence Score
    const confidenceScore = calculateConfidence(context);

    // Eye Contact Score (already calculated)
    const eyeContactScore = context.eyeContactScore || 0;

    // Calculate Engagement Score
    const engagementScore = calculateEngagement(context);

    // Calculate Overall Score (weighted)
    const overallScore = Math.round(
      confidenceScore * WEIGHTS.confidence +
        speechClarityScore * WEIGHTS.speechClarity +
        eyeContactScore * WEIGHTS.eyeContact +
        engagementScore * WEIGHTS.engagement
    );

    // Speech metrics
    const speechMetrics = {
      wpm: context.wordsPerMinute || 0,
      clarityScore: speechClarityScore,
      volumeVariance: context.volumeVariance || 0.15,
    };

    context.speechMetrics = speechMetrics;
    context.scores = {
      confidence: clamp(confidenceScore),
      speechClarity: clamp(speechClarityScore),
      eyeContact: clamp(eyeContactScore),
      engagement: clamp(engagementScore),
      overall: clamp(overallScore),
    };

    logger.info("Scores calculated:", context.scores);
    logger.stepEnd(stepName, Date.now() - startTime);
    return context;
  } catch (error) {
    logger.stepFail(stepName, error);
    throw new Error(`[${stepName}] ${error.message}`);
  }
};

/**
 * Calculate speech clarity score based on WPM, articulation, and volume.
 */
function calculateSpeechClarity(context) {
  const wpm = context.wordsPerMinute || 0;

  // Normalize WPM to ideal range
  let wpmScore;
  if (wpm >= IDEAL_WPM_MIN && wpm <= IDEAL_WPM_MAX) {
    wpmScore = 100;
  } else if (wpm < IDEAL_WPM_MIN) {
    wpmScore = Math.max(0, 100 - (IDEAL_WPM_MIN - wpm) * 1.5);
  } else {
    wpmScore = Math.max(0, 100 - (wpm - IDEAL_WPM_MAX) * 1.5);
  }

  // Articulation score from transcript quality
  const transcript = context.transcript || "";
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  const avgWordLength =
    wordCount > 0
      ? transcript.replace(/\s+/g, "").length / wordCount
      : 0;
  const articulationScore = Math.min(100, avgWordLength * 20);

  // Volume variance penalty (lower variance = more consistent)
  const volumeVariance = context.volumeVariance || 0.15;
  const volumePenalty = volumeVariance > 0.3 ? (volumeVariance - 0.3) * VOLUME_VARIANCE_PENALTY * 100 : 0;

  const clarity = wpmScore * 0.5 + articulationScore * 0.3 + (100 - volumePenalty) * 0.2;

  return Math.round(clamp(clarity));
}

/**
 * Calculate confidence score based on filler words, pauses, and emotional stability.
 */
function calculateConfidence(context) {
  let baseScore = 75;

  // Filler word penalty
  const fillerWords = context.fillerWords || [];
  const totalFillers = fillerWords.reduce((sum, fw) => sum + fw.count, 0);
  const fillerPenalty = totalFillers * FILLER_WORD_PENALTY;

  // Long pause penalty
  const pauses = context.pauses || [];
  const pausePenalty = pauses.length * LONG_PAUSE_PENALTY;

  // Emotion stability bonus (stable = more confident)
  const emotionStability = context.emotionStability || 0.5;
  const stabilityBonus = emotionStability * 20;

  // Emotion composition bonus (more "confident" and "happy" emotions)
  const emotionSummary = context.emotionSummary || {};
  const positiveEmotionPct =
    (emotionSummary.confident || 0) + (emotionSummary.happy || 0);
  const positiveBonus = positiveEmotionPct * 0.15;

  const confidence =
    baseScore - fillerPenalty - pausePenalty + stabilityBonus + positiveBonus;

  return Math.round(clamp(confidence));
}

/**
 * Calculate engagement score from emotion variety, pace variation, and eye contact.
 */
function calculateEngagement(context) {
  let score = 60;

  // Emotion variety contributes to engagement
  const emotionSummary = context.emotionSummary || {};
  const emotionTypes = Object.values(emotionSummary).filter((v) => v > 5).length;
  score += emotionTypes * 5;

  // Good eye contact improves engagement
  const eyeContact = context.eyeContactScore || 0;
  score += eyeContact * 0.15;

  // Appropriate pace
  const wpm = context.wordsPerMinute || 0;
  if (wpm >= IDEAL_WPM_MIN && wpm <= IDEAL_WPM_MAX) {
    score += 10;
  }

  // Fewer filler words = better engagement
  const fillerWords = context.fillerWords || [];
  const totalFillers = fillerWords.reduce((sum, fw) => sum + fw.count, 0);
  if (totalFillers < 5) score += 10;
  else if (totalFillers < 15) score += 5;

  return Math.round(clamp(score));
}

/**
 * Clamp a value between 0 and 100.
 */
function clamp(value) {
  return Math.max(0, Math.min(100, value));
}
