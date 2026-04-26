const Logger = require("../utils/logger");

const logger = new Logger("PipelineOrchestrator");

// Import all pipeline steps
const audioExtraction = require("./steps/audioExtraction");
const speechToText = require("./steps/speechToText");
const fillerWordDetection = require("./steps/fillerWordDetection");
const pauseDetection = require("./steps/pauseDetection");
const frameSampling = require("./steps/frameSampling");
const faceDetection = require("./steps/faceDetection");
const eyeContactAnalysis = require("./steps/eyeContactAnalysis");
const emotionAnalysis = require("./steps/emotionAnalysis");
const scoringEngine = require("./steps/scoringEngine");
const feedbackGenerator = require("./feedbackGenerator");

/**
 * Pipeline execution order:
 * audioExtraction → speechToText → fillerWordDetection →
 * pauseDetection → frameSampling → faceDetection →
 * eyeContactAnalysis → emotionAnalysis → scoringEngine → feedbackGenerator
 */
const PIPELINE_STEPS = [
  { name: "audioExtraction", fn: audioExtraction },
  { name: "speechToText", fn: speechToText },
  { name: "fillerWordDetection", fn: fillerWordDetection },
  { name: "pauseDetection", fn: pauseDetection },
  { name: "frameSampling", fn: frameSampling },
  { name: "faceDetection", fn: faceDetection },
  { name: "eyeContactAnalysis", fn: eyeContactAnalysis },
  { name: "emotionAnalysis", fn: emotionAnalysis },
  { name: "scoringEngine", fn: scoringEngine },
  { name: "feedbackGenerator", fn: feedbackGenerator },
];

/**
 * Run the full analysis pipeline.
 *
 * @param {Object} initialContext - Initial pipeline context.
 * @param {string} initialContext.videoId - Video document ID.
 * @param {string} initialContext.userId - User ID.
 * @param {string} initialContext.videoPath - Local path to downloaded video.
 * @param {string} initialContext.storagePath - Firebase Storage path.
 * @returns {Object} Final pipeline context with all analysis results.
 */
async function runPipeline(initialContext) {
  const { videoId } = initialContext;
  const pipelineStart = Date.now();

  logger.pipelineStart(videoId);

  // Initialize shared context
  let context = {
    ...initialContext,
    tempFiles: [],
    tempDirs: [],
    transcript: "",
    words: [],
    segments: [],
    wordsPerMinute: 0,
    fillerWords: [],
    pauses: [],
    faceDetections: [],
    eyeContactScore: 0,
    eyeContactData: [],
    emotionData: [],
    emotionSummary: {},
    emotionStability: 0,
    speechMetrics: {},
    scores: {},
    feedback: {},
    videoDuration: 0,
    videoMetadata: null,
    volumeVariance: 0.15, // Default, would be computed from audio analysis
    completedSteps: [],
    failedStep: null,
  };

  // Execute each step sequentially
  for (const step of PIPELINE_STEPS) {
    try {
      logger.info(`Executing step: ${step.name}`);
      context = await step.fn(context);
      context.completedSteps.push(step.name);
    } catch (error) {
      context.failedStep = step.name;
      logger.pipelineFail(videoId, error);
      throw error;
    }
  }

  const totalDuration = Date.now() - pipelineStart;
  logger.pipelineEnd(videoId, totalDuration);

  return context;
}

/**
 * Extract final results from pipeline context for Firestore storage.
 *
 * @param {Object} context - Completed pipeline context.
 * @returns {Object} Cleaned results matching analysisSchema.
 */
function extractResults(context) {
  return {
    videoId: context.videoId,
    userId: context.userId,
    transcript: context.transcript || "",
    fillerWords: context.fillerWords || [],
    pauses: context.pauses || [],
    eyeContactScore: context.eyeContactScore || 0,
    eyeContactData: context.eyeContactData || [],
    emotionData: context.emotionData || [],
    speechMetrics: context.speechMetrics || {
      wpm: 0,
      clarityScore: 0,
      volumeVariance: 0,
    },
    scores: context.scores || {
      confidence: 0,
      speechClarity: 0,
      eyeContact: 0,
      engagement: 0,
      overall: 0,
    },
    feedback: context.feedback || {
      strengths: [],
      improvements: [],
      actionItems: [],
    },
  };
}

module.exports = {
  runPipeline,
  extractResults,
  PIPELINE_STEPS,
};
