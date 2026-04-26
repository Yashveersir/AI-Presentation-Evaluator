const { onObjectFinalized } = require("firebase-functions/v2/storage");
const admin = require("firebase-admin");
const path = require("path");
const { runPipeline, extractResults } = require("../pipelines/orchestrator");
const { downloadToTemp, cleanupTempFiles } = require("../utils/storageHelper");
const {
  updateVideoStatus,
  writeAnalysisResults,
  incrementUserAnalyses,
  createVideoDoc,
} = require("../utils/firestoreHelper");
const Logger = require("../utils/logger");

const logger = new Logger("TriggerAnalysis");

/**
 * Firebase Storage trigger: onObjectFinalized
 * Fires when a new video is uploaded to videos/{userId}/{videoId}.
 *
 * Actions:
 * 1. Update Firestore video status → "processing"
 * 2. Download video to /tmp
 * 3. Run analysis pipeline
 * 4. Write results to Firestore
 * 5. Update video status → "done"
 * 6. Cleanup temp files
 */
const triggerAnalysis = onObjectFinalized(
  {
    bucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
    timeoutSeconds: 540,
    memory: "2GiB",
    region: "us-central1",
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    // Only process video files in the videos/ directory
    if (!filePath.startsWith("videos/")) {
      logger.info(`Ignoring non-video upload: ${filePath}`);
      return;
    }

    if (!contentType || !contentType.startsWith("video/")) {
      logger.info(`Ignoring non-video content type: ${contentType}`);
      return;
    }

    // Parse path: videos/{userId}/{videoId}
    const pathParts = filePath.split("/");
    if (pathParts.length < 3) {
      logger.error(`Invalid path format: ${filePath}`);
      return;
    }

    const userId = pathParts[1];
    const videoFileName = pathParts[2];
    const videoId = path.parse(videoFileName).name; // Remove extension for doc ID

    logger.info(`Processing video: ${videoId} for user: ${userId}`);

    const tempFiles = [];

    try {
      // 1. Create/update video document with processing status
      await createVideoDoc(videoId, {
        userId,
        fileName: videoFileName,
        storageUrl: filePath,
      });
      await updateVideoStatus(videoId, "processing");

      // 2. Download video to /tmp
      const videoPath = await downloadToTemp(filePath, `${videoId}_${videoFileName}`);
      tempFiles.push(videoPath);

      // 3. Run the analysis pipeline
      const pipelineContext = await runPipeline({
        videoId,
        userId,
        videoPath,
        storagePath: filePath,
      });

      // Collect all temp files from pipeline for cleanup
      tempFiles.push(...(pipelineContext.tempFiles || []));

      // 4. Extract and write results to Firestore
      const results = extractResults(pipelineContext);
      await writeAnalysisResults(videoId, results);

      // 5. Update video status to done
      await updateVideoStatus(videoId, "done");

      // Increment user's analysis count
      await incrementUserAnalyses(userId);

      logger.info(`✅ Analysis complete for video: ${videoId}`);
    } catch (error) {
      logger.error(`Pipeline failed for video: ${videoId}`, error);

      // Set video status to failed with error message
      try {
        await updateVideoStatus(
          videoId,
          "failed",
          error.message || "Unknown pipeline error"
        );
      } catch (statusError) {
        logger.error("Failed to update error status", statusError);
      }
    } finally {
      // 6. Cleanup temp files
      cleanupTempFiles(tempFiles);
    }
  }
);

module.exports = triggerAnalysis;
