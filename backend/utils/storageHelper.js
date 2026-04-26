const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const os = require("os");
const Logger = require("./logger");

const logger = new Logger("StorageHelper");

/**
 * Download a file from Firebase Storage to a local temp path.
 * @param {string} storagePath - Path in Firebase Storage bucket.
 * @param {string} [localFileName] - Optional local file name.
 * @returns {string} Local file path.
 */
async function downloadToTemp(storagePath, localFileName = null) {
  const bucket = admin.storage().bucket();
  const fileName = localFileName || path.basename(storagePath);
  const tempPath = path.join(os.tmpdir(), fileName);

  logger.info(`Downloading ${storagePath} → ${tempPath}`);

  await bucket.file(storagePath).download({ destination: tempPath });

  const stats = fs.statSync(tempPath);
  logger.info(`Downloaded ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  return tempPath;
}

/**
 * Upload a local file to Firebase Storage.
 * @param {string} localPath - Local file path.
 * @param {string} storagePath - Destination path in Storage.
 * @returns {string} Public download URL.
 */
async function uploadFromTemp(localPath, storagePath) {
  const bucket = admin.storage().bucket();

  logger.info(`Uploading ${localPath} → ${storagePath}`);

  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  const file = bucket.file(storagePath);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2030",
  });

  logger.info(`Upload complete: ${storagePath}`);
  return url;
}

/**
 * Clean up temp files.
 * @param {string[]} filePaths - Array of file paths to delete.
 */
function cleanupTempFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up: ${filePath}`);
      }
    } catch (err) {
      logger.warn(`Failed to cleanup ${filePath}: ${err.message}`);
    }
  }
}

/**
 * Get a signed URL for a storage file.
 * @param {string} storagePath - Path in storage.
 * @returns {string} Signed URL.
 */
async function getSignedUrl(storagePath) {
  const bucket = admin.storage().bucket();
  const [url] = await bucket.file(storagePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  return url;
}

module.exports = {
  downloadToTemp,
  uploadFromTemp,
  cleanupTempFiles,
  getSignedUrl,
};
