const { extractFrames, getVideoMetadata } = require("../../utils/ffmpegHelper");
const Logger = require("../../utils/logger");

const logger = new Logger("FrameSampling");

/**
 * Pipeline Step: Frame Sampling
 * Extracts 1 frame per second from the video for visual analysis.
 *
 * @param {Object} context - Shared pipeline context.
 * @param {string} context.videoPath - Path to the video file.
 * @returns {Object} Updated context with framesDir and frameCount.
 */
module.exports = async function frameSampling(context) {
  const stepName = "frameSampling";
  const startTime = Date.now();
  logger.stepStart(stepName);

  try {
    if (!context.videoPath) {
      throw new Error("videoPath is required in context");
    }

    // Get video metadata for duration info
    const metadata = await getVideoMetadata(context.videoPath);
    context.videoDuration = metadata.duration;
    context.videoMetadata = metadata;

    logger.info(`Video duration: ${metadata.duration}s`);

    // Extract 1 frame per second
    const { framesDir, frameCount } = await extractFrames(
      context.videoPath,
      1 // 1 FPS
    );

    context.framesDir = framesDir;
    context.frameCount = frameCount;
    context.tempDirs = context.tempDirs || [];
    context.tempDirs.push(framesDir);

    logger.info(`Sampled ${frameCount} frames at 1 FPS`);
    logger.stepEnd(stepName, Date.now() - startTime);
    return context;
  } catch (error) {
    logger.stepFail(stepName, error);
    throw new Error(`[${stepName}] ${error.message}`);
  }
};
