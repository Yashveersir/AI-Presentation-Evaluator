const Logger = require("../../utils/logger");

const logger = new Logger("EyeContactAnalysis");

/**
 * Pipeline Step: Eye Contact Analysis
 * Analyzes gaze direction from face landmarks to estimate eye contact percentage.
 *
 * @param {Object} context - Shared pipeline context.
 * @param {Array} context.faceDetections - Face detection results with landmarks.
 * @returns {Object} Updated context with eyeContactScore.
 */
module.exports = async function eyeContactAnalysis(context) {
  const stepName = "eyeContactAnalysis";
  const startTime = Date.now();
  logger.stepStart(stepName);

  try {
    const detections = context.faceDetections || [];

    if (detections.length === 0) {
      context.eyeContactScore = 0;
      context.eyeContactData = [];
      logger.warn("No face detections available for eye contact analysis");
      logger.stepEnd(stepName, Date.now() - startTime);
      return context;
    }

    let eyeContactFrames = 0;
    let totalFaceFrames = 0;
    const eyeContactData = [];

    for (const detection of detections) {
      if (!detection.faceDetected || !detection.landmarks) {
        eyeContactData.push({
          timestamp: detection.timestamp,
          hasEyeContact: false,
          gazeScore: 0,
        });
        continue;
      }

      totalFaceFrames++;

      // Calculate gaze direction from eye landmarks
      const gazeScore = calculateGazeScore(detection.landmarks);
      const hasEyeContact = gazeScore > 0.6; // Threshold for "looking at camera"

      if (hasEyeContact) {
        eyeContactFrames++;
      }

      eyeContactData.push({
        timestamp: detection.timestamp,
        hasEyeContact,
        gazeScore: parseFloat(gazeScore.toFixed(3)),
      });
    }

    // Calculate eye contact percentage
    context.eyeContactScore =
      totalFaceFrames > 0
        ? Math.round((eyeContactFrames / totalFaceFrames) * 100)
        : 0;

    context.eyeContactData = eyeContactData;

    logger.info(
      `Eye contact: ${context.eyeContactScore}% ` +
        `(${eyeContactFrames}/${totalFaceFrames} face frames)`
    );

    logger.stepEnd(stepName, Date.now() - startTime);
    return context;
  } catch (error) {
    logger.stepFail(stepName, error);
    throw new Error(`[${stepName}] ${error.message}`);
  }
};

/**
 * Calculate gaze score based on eye landmarks.
 * Estimates how directly the person is looking at the camera.
 *
 * @param {Object} landmarks - Face landmarks with eye positions.
 * @returns {number} Gaze score 0-1 (1 = direct eye contact).
 */
function calculateGazeScore(landmarks) {
  if (!landmarks.leftEye || !landmarks.rightEye) {
    return 0;
  }

  const { leftEye, rightEye, nose } = landmarks;

  // Calculate eye midpoint
  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeMidY = (leftEye.y + rightEye.y) / 2;

  // Check eye symmetry (both eyes should be roughly at same height)
  const eyeSymmetry = 1 - Math.abs(leftEye.y - rightEye.y) * 5;

  // Check if eyes are centered horizontally (looking at camera)
  const horizontalCenter = 1 - Math.abs(eyeMidX - 0.5) * 3;

  // Check vertical alignment with nose (head not tilted too much)
  const verticalAlignment = nose
    ? 1 - Math.abs(nose.x - eyeMidX) * 4
    : 0.7;

  // Composite gaze score
  const gazeScore = Math.max(
    0,
    Math.min(
      1,
      eyeSymmetry * 0.3 + horizontalCenter * 0.4 + verticalAlignment * 0.3
    )
  );

  return gazeScore;
}
