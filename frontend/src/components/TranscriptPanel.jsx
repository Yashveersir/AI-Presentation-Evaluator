import { useMemo } from "react";

/**
 * Transcript panel with filler word highlighting and pause markers.
 * Filler words are highlighted in yellow, long pauses are marked in red.
 */
export default function TranscriptPanel({ transcript = "", fillerWords = [], pauses = [] }) {
  // Build a set of filler word patterns for highlighting
  const fillerSet = useMemo(() => {
    return new Set(fillerWords.map((fw) => fw.word.toLowerCase()));
  }, [fillerWords]);

  // Process transcript with highlights
  const highlightedContent = useMemo(() => {
    if (!transcript) return null;

    // Split transcript into words and process
    const words = transcript.split(/(\s+)/);
    const elements = [];

    let wordIndex = 0;
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Skip whitespace tokens
      if (/^\s+$/.test(word)) {
        elements.push(<span key={`ws-${i}`}>{word}</span>);
        continue;
      }

      const cleanWord = word.toLowerCase().replace(/[.,!?;:'"()]/g, "");

      if (fillerSet.has(cleanWord)) {
        elements.push(
          <span key={`fw-${i}`} className="highlight-filler" title="Filler word">
            {word}
          </span>
        );
      } else {
        elements.push(<span key={`w-${i}`}>{word}</span>);
      }
      wordIndex++;
    }

    return elements;
  }, [transcript, fillerSet]);

  // Format pause duration
  const formatPause = (p) => {
    return `${p.duration.toFixed(1)}s pause`;
  };

  return (
    <div className="glass-card" style={{ padding: "1.5rem" }}>
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--surface-900)",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--primary-500)",
            display: "inline-block",
          }}
        />
        Full Transcript
      </h3>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          marginBottom: "1rem",
          fontSize: "0.8rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 12,
              borderRadius: 3,
              background: "rgba(251, 191, 36, 0.3)",
            }}
          />
          <span style={{ color: "var(--surface-600)" }}>Filler Words</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 12,
              borderRadius: 3,
              background: "rgba(239, 68, 68, 0.2)",
            }}
          />
          <span style={{ color: "var(--surface-600)" }}>Long Pauses</span>
        </div>
      </div>

      {/* Transcript Body */}
      <div
        style={{
          maxHeight: 320,
          overflowY: "auto",
          padding: "1rem",
          background: "var(--surface-100)",
          borderRadius: 12,
          lineHeight: 1.8,
          fontSize: "0.925rem",
          color: "var(--surface-800)",
          fontFamily: "var(--font-sans)",
        }}
        id="transcript-body"
      >
        {transcript ? (
          highlightedContent
        ) : (
          <p style={{ color: "var(--surface-500)", fontStyle: "italic" }}>
            No transcript available.
          </p>
        )}
      </div>

      {/* Pause Markers */}
      {pauses.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h4
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--surface-700)",
              marginBottom: "0.5rem",
            }}
          >
            Detected Pauses ({pauses.length})
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {pauses.map((p, i) => (
              <span key={i} className="highlight-pause" style={{ fontSize: "0.8rem" }}>
                ⏸ {formatPause(p)} at {p.start.toFixed(1)}s
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--glass-border)",
          fontSize: "0.8rem",
          color: "var(--surface-600)",
        }}
      >
        <span>
          <strong style={{ color: "var(--surface-800)" }}>
            {transcript ? transcript.split(/\s+/).filter(Boolean).length : 0}
          </strong>{" "}
          words
        </span>
        <span>
          <strong style={{ color: "var(--warning-400)" }}>
            {fillerWords.reduce((sum, fw) => sum + fw.count, 0)}
          </strong>{" "}
          filler words
        </span>
        <span>
          <strong style={{ color: "var(--danger-400)" }}>{pauses.length}</strong> long pauses
        </span>
      </div>
    </div>
  );
}
