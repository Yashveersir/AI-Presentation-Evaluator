const Logger = require("../../utils/logger");

const logger = new Logger("FillerWordDetection");

// Filler words and phrases to detect
const FILLER_PATTERNS = [
  { pattern: /\bum\b/gi, word: "um" },
  { pattern: /\buh\b/gi, word: "uh" },
  { pattern: /\blike\b/gi, word: "like" },
  { pattern: /\byou know\b/gi, word: "you know" },
  { pattern: /\bbasically\b/gi, word: "basically" },
  { pattern: /\bactually\b/gi, word: "actually" },
  { pattern: /\bliterally\b/gi, word: "literally" },
  { pattern: /\bso\b/gi, word: "so" },
  { pattern: /\bkind of\b/gi, word: "kind of" },
  { pattern: /\bsort of\b/gi, word: "sort of" },
  { pattern: /\bright\b/gi, word: "right" },
  { pattern: /\bi mean\b/gi, word: "I mean" },
];

/**
 * Pipeline Step: Filler Word Detection
 * Detects filler words in the transcript and maps them to timestamps.
 *
 * @param {Object} context - Shared pipeline context.
 * @param {string} context.transcript - Full transcript text.
 * @param {Array} context.words - Word-level data with timestamps.
 * @returns {Object} Updated context with fillerWords array.
 */
module.exports = async function fillerWordDetection(context) {
  const stepName = "fillerWordDetection";
  const startTime = Date.now();
  logger.stepStart(stepName);

  try {
    if (!context.transcript) {
      throw new Error("transcript is required in context");
    }

    const fillerWordMap = new Map();
    const words = context.words || [];

    // Scan word-level data for filler words
    for (const wordData of words) {
      const wordText = (wordData.word || "").toLowerCase().trim();

      for (const filler of FILLER_PATTERNS) {
        if (filler.pattern.test(wordText)) {
          if (!fillerWordMap.has(filler.word)) {
            fillerWordMap.set(filler.word, {
              word: filler.word,
              count: 0,
              timestamps: [],
            });
          }

          const entry = fillerWordMap.get(filler.word);
          entry.count += 1;
          entry.timestamps.push(wordData.start || 0);
          // Reset regex lastIndex for global patterns
          filler.pattern.lastIndex = 0;
          break;
        }
        // Reset regex lastIndex
        filler.pattern.lastIndex = 0;
      }
    }

    // Also do a full-text scan for multi-word fillers
    for (const filler of FILLER_PATTERNS) {
      if (filler.word.includes(" ")) {
        const matches = context.transcript.match(filler.pattern);
        if (matches && matches.length > 0) {
          if (!fillerWordMap.has(filler.word)) {
            fillerWordMap.set(filler.word, {
              word: filler.word,
              count: matches.length,
              timestamps: [],
            });
          } else {
            // Update count if full-text found more
            const entry = fillerWordMap.get(filler.word);
            entry.count = Math.max(entry.count, matches.length);
          }
        }
      }
      filler.pattern.lastIndex = 0;
    }

    context.fillerWords = Array.from(fillerWordMap.values());

    const totalFillers = context.fillerWords.reduce((sum, fw) => sum + fw.count, 0);
    logger.info(`Detected ${totalFillers} filler words across ${context.fillerWords.length} types`);
    logger.stepEnd(stepName, Date.now() - startTime);
    return context;
  } catch (error) {
    logger.stepFail(stepName, error);
    throw new Error(`[${stepName}] ${error.message}`);
  }
};
