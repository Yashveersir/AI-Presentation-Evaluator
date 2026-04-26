const Logger = require("../../utils/logger");

const logger = new Logger("PauseDetection");

// Minimum pause duration in seconds to flag
const MIN_PAUSE_DURATION = 2.0;

/**
 * Pipeline Step: Pause Detection
 * Detects long pauses (>2 seconds) between spoken segments.
 *
 * @param {Object} context - Shared pipeline context.
 * @param {Array} context.segments - Transcript segments with timing data.
 * @param {Array} context.words - Word-level timestamps.
 * @returns {Object} Updated context with pauses array.
 */
module.exports = async function pauseDetection(context) {
  const stepName = "pauseDetection";
  const startTime = Date.now();
  logger.stepStart(stepName);

  try {
    const segments = context.segments || [];
    const words = context.words || [];
    const pauses = [];

    // Use word-level timestamps for more accurate pause detection
    if (words.length > 1) {
      for (let i = 1; i < words.length; i++) {
        const prevEnd = words[i - 1].end || words[i - 1].start || 0;
        const currStart = words[i].start || 0;
        const gap = currStart - prevEnd;

        if (gap >= MIN_PAUSE_DURATION) {
          pauses.push({
            start: parseFloat(prevEnd.toFixed(2)),
            end: parseFloat(currStart.toFixed(2)),
            duration: parseFloat(gap.toFixed(2)),
          });
        }
      }
    } else if (segments.length > 1) {
      // Fallback to segment-level detection
      for (let i = 1; i < segments.length; i++) {
        const prevEnd = segments[i - 1].end || 0;
        const currStart = segments[i].start || 0;
        const gap = currStart - prevEnd;

        if (gap >= MIN_PAUSE_DURATION) {
          pauses.push({
            start: parseFloat(prevEnd.toFixed(2)),
            end: parseFloat(currStart.toFixed(2)),
            duration: parseFloat(gap.toFixed(2)),
          });
        }
      }
    }

    context.pauses = pauses;

    logger.info(`Detected ${pauses.length} long pauses (≥${MIN_PAUSE_DURATION}s)`);

    if (pauses.length > 0) {
      const avgDuration =
        pauses.reduce((sum, p) => sum + p.duration, 0) / pauses.length;
      logger.info(`Average pause duration: ${avgDuration.toFixed(2)}s`);
    }

    logger.stepEnd(stepName, Date.now() - startTime);
    return context;
  } catch (error) {
    logger.stepFail(stepName, error);
    throw new Error(`[${stepName}] ${error.message}`);
  }
};
