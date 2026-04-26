const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const os = require("os");
const Logger = require("./logger");

const logger = new Logger("FFmpegHelper");

const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

// Set FFmpeg and FFprobe paths
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

/**
 * Extract audio from video file (mono, 16kHz WAV for Whisper).
 * @param {string} videoPath - Path to input video.
 * @param {string} [outputName] - Optional output filename.
 * @returns {Promise<string>} Path to extracted audio file.
 */
function extractAudio(videoPath, outputName = null) {
  const audioFileName = outputName || `audio_${Date.now()}.wav`;
  const audioPath = path.join(os.tmpdir(), audioFileName);

  return new Promise((resolve, reject) => {
    logger.info(`Extracting audio from: ${videoPath}`);

    ffmpeg(videoPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec("pcm_s16le")
      .format("wav")
      .on("start", (cmd) => {
        logger.debug("FFmpeg command:", { cmd });
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          logger.debug(`Audio extraction: ${Math.round(progress.percent)}%`);
        }
      })
      .on("end", () => {
        logger.info(`Audio extracted: ${audioPath}`);
        resolve(audioPath);
      })
      .on("error", (err) => {
        logger.error("Audio extraction failed", err);
        reject(new Error(`Audio extraction failed: ${err.message}`));
      })
      .save(audioPath);
  });
}

/**
 * Extract frames from video at a specified interval.
 * @param {string} videoPath - Path to input video.
 * @param {number} [fps=1] - Frames per second to extract.
 * @param {string} [outputDir] - Optional output directory.
 * @returns {Promise<{framesDir: string, frameCount: number}>}
 */
function extractFrames(videoPath, fps = 1, outputDir = null) {
  const framesDir = outputDir || path.join(os.tmpdir(), `frames_${Date.now()}`);
  const fs = require("fs");

  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  const outputPattern = path.join(framesDir, "frame_%04d.jpg");

  return new Promise((resolve, reject) => {
    logger.info(`Extracting frames at ${fps} FPS from: ${videoPath}`);

    ffmpeg(videoPath)
      .outputOptions([`-vf fps=${fps}`, "-q:v 2"])
      .on("start", (cmd) => {
        logger.debug("FFmpeg frames command:", { cmd });
      })
      .on("end", () => {
        const files = fs.readdirSync(framesDir).filter((f) => f.endsWith(".jpg"));
        logger.info(`Extracted ${files.length} frames to ${framesDir}`);
        resolve({ framesDir, frameCount: files.length });
      })
      .on("error", (err) => {
        logger.error("Frame extraction failed", err);
        reject(new Error(`Frame extraction failed: ${err.message}`));
      })
      .save(outputPattern);
  });
}

/**
 * Get video metadata (duration, resolution, etc.).
 * @param {string} videoPath - Path to video file.
 * @returns {Promise<Object>} Video metadata.
 */
function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        logger.error("Failed to get video metadata", err);
        reject(new Error(`Metadata extraction failed: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === "video");
      const audioStream = metadata.streams.find((s) => s.codec_type === "audio");

      const result = {
        duration: metadata.format.duration || 0,
        size: metadata.format.size || 0,
        bitrate: metadata.format.bit_rate || 0,
        video: videoStream
          ? {
              codec: videoStream.codec_name,
              width: videoStream.width,
              height: videoStream.height,
              fps: eval(videoStream.r_frame_rate) || 30,
            }
          : null,
        audio: audioStream
          ? {
              codec: audioStream.codec_name,
              sampleRate: audioStream.sample_rate,
              channels: audioStream.channels,
            }
          : null,
      };

      logger.info(`Video metadata: ${result.duration}s, ${result.video?.width}x${result.video?.height}`);
      resolve(result);
    });
  });
}

module.exports = {
  extractAudio,
  extractFrames,
  getVideoMetadata,
};
