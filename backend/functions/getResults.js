const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getAnalysisResults, getVideoDoc } = require("../utils/firestoreHelper");
const Logger = require("../utils/logger");

const logger = new Logger("GetResults");

/**
 * HTTP endpoint to retrieve analysis results for a video.
 * GET /getResults?videoId={videoId}
 *
 * Returns:
 * - Video document (status, metadata)
 * - Analysis results (scores, transcript, feedback)
 *
 * Requires Firebase Auth token in Authorization header.
 */
const getResults = onRequest(
  {
    cors: true,
    region: "us-central1",
  },
  async (req, res) => {
    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: Missing auth token" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      let decodedToken;

      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (authError) {
        res.status(401).json({ error: "Unauthorized: Invalid auth token" });
        return;
      }

      const userId = decodedToken.uid;

      // Get video ID from query params
      const videoId = req.query.videoId;
      if (!videoId) {
        res.status(400).json({ error: "Missing required parameter: videoId" });
        return;
      }

      // Get video document
      const video = await getVideoDoc(videoId);
      if (!video) {
        res.status(404).json({ error: "Video not found" });
        return;
      }

      // Verify ownership
      if (video.userId !== userId) {
        res.status(403).json({ error: "Forbidden: You do not own this video" });
        return;
      }

      // Get analysis results if processing is done
      let analysis = null;
      if (video.status === "done") {
        analysis = await getAnalysisResults(videoId);
      }

      res.status(200).json({
        video,
        analysis,
        status: video.status,
      });
    } catch (error) {
      logger.error("Error fetching results", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = getResults;
