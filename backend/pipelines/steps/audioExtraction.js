const { extractAudio } = require("../../utils/ffmpegHelper");
const Logger = require("../../utils/logger");

const logger = new Logger("AudioExtraction");

/**
 * Pipeline Step: Audio Extraction
 * Extracts mono 16kHz WAV audio from the input video for Whisper processing.
 *
 * @param {Object} context - Shared pipeline context.
 * @param {string} context.videoPath - Path to the downloaded video file.
 * @returns {Object} Updated context with audioPath.
 */
module.exports = async function audioExtraction(context) {
  const stepName = "audioExtraction";
  const startTime = Date.now();
  logger.stepStart(stepName);

  try {
    if (!context.videoPath) {
      throw new Error("videoPath is required in context");
    }

    const audioPath = await extractAudio(context.videoPath);
    context.audioPath = audioPath;
    context.tempFiles.push(audioPath);

    logger.stepEnd(stepName, Date.now() - startTime);
    return context;
  } catch (error) {
    logger.stepFail(stepName, error);
    throw new Error(`[${stepName}] ${error.message}`);
  }
};
