const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Logger = require("../../utils/logger");

const logger = new Logger("SpeechToText");

/**
 * Pipeline Step: Speech-to-Text
 * Uses Google Gemini 1.5 Flash (FREE) to transcribe audio with timestamps.
 *
 * @param {Object} context - Shared pipeline context.
 * @param {string} context.audioPath - Path to extracted audio file.
 * @returns {Object} Updated context with transcript, words, and segments.
 */
module.exports = async function speechToText(context) {
  const stepName = "speechToText";
  const startTime = Date.now();
  logger.stepStart(stepName);

  try {
    if (!context.audioPath) {
      throw new Error("audioPath is required in context");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    // Read audio file and convert to base64
    const audioBuffer = fs.readFileSync(context.audioPath);
    const audioBase64 = audioBuffer.toString("base64");

    const prompt = `Transcribe this audio completely and accurately. Then provide the result as JSON only (no markdown, no code blocks) in this exact format:
{
  "text": "the full transcript text here",
  "segments": [
    { "start": 0.0, "end": 2.5, "text": "segment text" }
  ],
  "words": [
    { "word": "hello", "start": 0.0, "end": 0.3 }
  ]
}

Rules:
- "text" must contain the complete transcript as a single string.
- "segments" should break the transcript into sentence-level chunks with start/end times in seconds.
- "words" should list individual words with approximate start/end times in seconds.
- If you cannot determine exact timestamps, estimate them evenly based on audio duration.
- Return ONLY valid JSON, nothing else.`;

    let responseText;
    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "audio/wav",
            data: audioBase64,
          },
        },
      ]);
      responseText = result.response.text();
    } catch (geminiError) {
      logger.warn("Gemini transcription failed, trying Groq fallback: " + geminiError.message);
      if (!process.env.GROQ_API_KEY) {
        throw geminiError;
      }
      
      const formData = new FormData();
      const audioBlob = new Blob([fs.readFileSync(context.audioPath)], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'verbose_json');

      const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: formData
      });

      const data = await groqResponse.json();
      if (!groqResponse.ok) {
        throw new Error(data.error?.message || "Groq audio API error");
      }

      const parsedOutput = {
        text: data.text || "",
        segments: (data.segments || []).map(s => ({
          start: s.start,
          end: s.end,
          text: s.text
        })),
        words: []
      };

      responseText = JSON.stringify(parsedOutput);
      logger.info("Speech-to-text completed successfully via Groq Whisper fallback");
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      logger.warn("Direct JSON parse failed, extracting from response...");
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: treat entire response as plain transcript
        parsed = {
          text: responseText.replace(/```[\s\S]*?```/g, "").trim(),
          segments: [],
          words: [],
        };
      }
    }

    context.transcript = parsed.text || "";
    context.segments = Array.isArray(parsed.segments) ? parsed.segments : [];
    context.words = Array.isArray(parsed.words) ? parsed.words : [];

    // Calculate WPM
    const wordCount = context.transcript.split(/\s+/).filter(Boolean).length;
    const durationMinutes = (context.videoDuration || 60) / 60;
    context.wordsPerMinute = durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : 0;

    logger.info(`Transcribed ${wordCount} words, WPM: ${context.wordsPerMinute}`);
    logger.stepEnd(stepName, Date.now() - startTime);
    return context;
  } catch (error) {
    logger.stepFail(stepName, error);
    throw new Error(`[${stepName}] ${error.message}`);
  }
};
