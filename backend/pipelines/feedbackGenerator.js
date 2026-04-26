const { GoogleGenerativeAI } = require("@google/generative-ai");
const Logger = require("../utils/logger");

const logger = new Logger("FeedbackGenerator");

/**
 * Pipeline Step: Feedback Generator
 * Uses Google Gemini (FREE) to generate structured presentation feedback.
 *
 * @param {Object} context - Shared pipeline context.
 * @returns {Object} Updated context with feedback object.
 */
module.exports = async function feedbackGenerator(context) {
  const stepName = "feedbackGenerator";
  const startTime = Date.now();
  logger.stepStart(stepName);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build analysis data summary for Gemini
    const analysisData = {
      scores: context.scores,
      speechMetrics: context.speechMetrics,
      eyeContactScore: context.eyeContactScore,
      fillerWords: context.fillerWords,
      pauses: context.pauses,
      emotionSummary: context.emotionSummary,
      emotionStability: context.emotionStability,
      videoDuration: context.videoDuration,
      wordsPerMinute: context.wordsPerMinute,
      transcriptExcerpt: (context.transcript || "").substring(0, 500),
    };

    const prompt = `You are an expert presentation coach. Given the following analysis data, generate structured feedback.

Analysis Data: ${JSON.stringify(analysisData)}

Return ONLY valid JSON (no markdown, no code blocks, no backticks) in this exact shape:
{
  "strengths": ["string", "string", "string"],
  "improvements": ["string", "string", "string"],
  "actionItems": ["string", "string", "string"]
}

Rules:
- Each "strengths" entry must be a specific, observed strength from the data (not generic praise).
- Each "improvements" entry must reference a specific metric that needs work.
- Each "actionItems" entry must be a concrete, actionable step the presenter can take.
- Be encouraging but honest. Reference actual numbers from the analysis.
- Keep each entry to 1-2 sentences maximum.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let feedback;
    try {
      // Try direct parse first
      feedback = JSON.parse(responseText);
    } catch (parseError) {
      logger.warn("Direct parse failed, extracting JSON from response...");
      // Extract JSON from possible markdown wrapping
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse feedback response from Gemini");
      }
    }

    // Validate structure
    context.feedback = {
      strengths: Array.isArray(feedback.strengths)
        ? feedback.strengths.slice(0, 3)
        : ["Good overall presentation structure"],
      improvements: Array.isArray(feedback.improvements)
        ? feedback.improvements.slice(0, 3)
        : ["Continue practicing for consistency"],
      actionItems: Array.isArray(feedback.actionItems)
        ? feedback.actionItems.slice(0, 3)
        : ["Record yourself and review before presenting"],
    };

    logger.info("Feedback generated successfully via Gemini");
    logger.stepEnd(stepName, Date.now() - startTime);
    return context;
  } catch (error) {
    logger.stepFail(stepName, error);

    // Provide fallback feedback on API failure
    context.feedback = {
      strengths: [
        "Completed the presentation from start to finish",
        "Demonstrated willingness to be evaluated for improvement",
        "Maintained a structured delivery format",
      ],
      improvements: [
        "Analysis could not fully process — try re-uploading with clearer audio",
        "Ensure good lighting for better facial expression detection",
        "Consider recording in a quiet environment for better speech analysis",
      ],
      actionItems: [
        "Re-record your presentation with better audio/video quality",
        "Practice in front of a mirror to improve eye contact",
        "Use a timer to maintain consistent pacing throughout",
      ],
    };

    logger.warn("Using fallback feedback due to error");
    return context;
  }
};
