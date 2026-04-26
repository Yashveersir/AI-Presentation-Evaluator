import { CheckCircle, AlertTriangle, Zap } from "lucide-react";

/**
 * AI Feedback panel displaying strengths, improvements, and action items.
 */
export default function FeedbackPanel({ feedback = {} }) {
  const { strengths = [], improvements = [], actionItems = [] } = feedback;

  return (
    <div className="glass-card" style={{ padding: "1.5rem" }}>
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--surface-900)",
          marginBottom: "1.25rem",
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
            background: "var(--gradient-primary)",
            display: "inline-block",
          }}
        />
        AI Coach Feedback
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Strengths */}
        <FeedbackSection
          title="Strengths"
          items={strengths}
          icon={<CheckCircle size={18} />}
          color="#22c55e"
          bgColor="rgba(34, 197, 94, 0.08)"
          borderColor="rgba(34, 197, 94, 0.2)"
        />

        {/* Improvements */}
        <FeedbackSection
          title="Areas for Improvement"
          items={improvements}
          icon={<AlertTriangle size={18} />}
          color="#f59e0b"
          bgColor="rgba(245, 158, 11, 0.08)"
          borderColor="rgba(245, 158, 11, 0.2)"
        />

        {/* Action Items */}
        <FeedbackSection
          title="Action Items"
          items={actionItems}
          icon={<Zap size={18} />}
          color="#6366f1"
          bgColor="rgba(99, 102, 241, 0.08)"
          borderColor="rgba(99, 102, 241, 0.2)"
        />
      </div>
    </div>
  );
}

function FeedbackSection({ title, items, icon, color, bgColor, borderColor }) {
  if (!items || items.length === 0) return null;

  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: "1rem 1.25rem",
      }}
    >
      <h4
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color,
          fontWeight: 700,
          fontSize: "0.925rem",
          marginBottom: "0.75rem",
        }}
      >
        {icon}
        {title}
      </h4>

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, index) => (
          <li
            key={index}
            style={{
              display: "flex",
              gap: 10,
              fontSize: "0.875rem",
              color: "var(--surface-800)",
              lineHeight: 1.5,
            }}
          >
            <span
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: "50%",
                background: color,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 700,
                marginTop: 1,
              }}
            >
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
