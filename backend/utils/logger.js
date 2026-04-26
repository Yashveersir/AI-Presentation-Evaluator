const { logger: firebaseLogger } = require("firebase-functions");

/**
 * Structured logger utility for pipeline steps and functions.
 * Wraps Firebase Functions logger with step-aware context.
 */
class Logger {
  constructor(context = "General") {
    this.context = context;
  }

  _format(message) {
    return `[${this.context}] ${message}`;
  }

  info(message, data = {}) {
    firebaseLogger.info(this._format(message), data);
  }

  warn(message, data = {}) {
    firebaseLogger.warn(this._format(message), data);
  }

  error(message, error = null) {
    const payload = error
      ? { message: error.message, stack: error.stack }
      : {};
    firebaseLogger.error(this._format(message), payload);
  }

  debug(message, data = {}) {
    firebaseLogger.debug(this._format(message), data);
  }

  stepStart(stepName) {
    this.info(`▶ Step "${stepName}" started`);
  }

  stepEnd(stepName, durationMs = null) {
    const suffix = durationMs !== null ? ` (${durationMs}ms)` : "";
    this.info(`✔ Step "${stepName}" completed${suffix}`);
  }

  stepFail(stepName, error) {
    this.error(`✘ Step "${stepName}" failed`, error);
  }

  pipelineStart(videoId) {
    this.info(`🚀 Pipeline started for video: ${videoId}`);
  }

  pipelineEnd(videoId, durationMs) {
    this.info(`🏁 Pipeline completed for video: ${videoId} (${durationMs}ms)`);
  }

  pipelineFail(videoId, error) {
    this.error(`💥 Pipeline failed for video: ${videoId}`, error);
  }
}

module.exports = Logger;
