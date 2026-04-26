import { auth } from "./firebase";

const FUNCTIONS_URL =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_URL ||
  "http://127.0.0.1:5001/your-project-id/us-central1";

/**
 * Get auth token for API requests.
 */
async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.getIdToken();
}

/**
 * Fetch analysis results from Cloud Function.
 * @param {string} videoId - The video document ID.
 * @returns {Object} { video, analysis, status }
 */
export async function fetchResults(videoId) {
  const token = await getAuthToken();

  const response = await fetch(
    `${FUNCTIONS_URL}/getResults?videoId=${encodeURIComponent(videoId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Generate and download PDF report.
 * @param {Object} analysisData - Full analysis results.
 * @param {string} videoName - Original video filename.
 */
export async function downloadPDFReport(analysisData, videoName = "presentation") {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241);
  doc.text("Presentation Analysis Report", pageWidth / 2, y, { align: "center" });
  y += 12;

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 140);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: "center" });
  y += 15;

  // Overall Score
  const scores = analysisData.scores || {};
  doc.setFontSize(36);
  doc.setTextColor(
    scores.overall >= 70 ? 34 : scores.overall >= 40 ? 245 : 239,
    scores.overall >= 70 ? 197 : scores.overall >= 40 ? 158 : 68,
    scores.overall >= 70 ? 94 : scores.overall >= 40 ? 11 : 68
  );
  doc.text(`${scores.overall || 0}`, pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(120, 120, 140);
  doc.text("Overall Score", pageWidth / 2, y, { align: "center" });
  y += 15;

  // Score Breakdown
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 60);
  doc.text("Score Breakdown", 20, y);
  y += 10;

  doc.setFontSize(11);
  const scoreItems = [
    { label: "Confidence", value: scores.confidence || 0 },
    { label: "Speech Clarity", value: scores.speechClarity || 0 },
    { label: "Eye Contact", value: scores.eyeContact || 0 },
    { label: "Engagement", value: scores.engagement || 0 },
  ];

  for (const item of scoreItems) {
    doc.setTextColor(80, 80, 100);
    doc.text(`${item.label}: `, 25, y);
    doc.setTextColor(99, 102, 241);
    doc.text(`${item.value}/100`, 80, y);
    y += 8;
  }
  y += 10;

  // Speech Metrics
  const metrics = analysisData.speechMetrics || {};
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 60);
  doc.text("Speech Metrics", 20, y);
  y += 10;

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 100);
  doc.text(`Words Per Minute: ${metrics.wpm || 0}`, 25, y);
  y += 8;
  doc.text(`Clarity Score: ${metrics.clarityScore || 0}/100`, 25, y);
  y += 12;

  // Filler Words
  const fillerWords = analysisData.fillerWords || [];
  if (fillerWords.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 60);
    doc.text("Filler Words Detected", 20, y);
    y += 10;

    doc.setFontSize(10);
    for (const fw of fillerWords) {
      doc.setTextColor(80, 80, 100);
      doc.text(`"${fw.word}" — ${fw.count} occurrences`, 25, y);
      y += 7;
    }
    y += 8;
  }

  // Feedback
  const feedback = analysisData.feedback || {};
  if (feedback.strengths && feedback.strengths.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94);
    doc.text("Strengths", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 100);
    for (const s of feedback.strengths) {
      const lines = doc.splitTextToSize(`• ${s}`, pageWidth - 45);
      doc.text(lines, 25, y);
      y += lines.length * 6 + 3;
    }
    y += 5;
  }

  if (feedback.improvements && feedback.improvements.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFontSize(14);
    doc.setTextColor(245, 158, 11);
    doc.text("Areas for Improvement", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 100);
    for (const imp of feedback.improvements) {
      const lines = doc.splitTextToSize(`• ${imp}`, pageWidth - 45);
      doc.text(lines, 25, y);
      y += lines.length * 6 + 3;
    }
    y += 5;
  }

  if (feedback.actionItems && feedback.actionItems.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.text("Action Items", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 100);
    for (const ai of feedback.actionItems) {
      const lines = doc.splitTextToSize(`• ${ai}`, pageWidth - 45);
      doc.text(lines, 25, y);
      y += lines.length * 6 + 3;
    }
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 160);
    doc.text(
      "AI Presentation Evaluator Report",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${videoName}-analysis-report.pdf`);
}
