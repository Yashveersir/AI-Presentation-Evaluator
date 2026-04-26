import { useMemo } from "react";

/**
 * Animated circular score ring with color coding.
 * Red: 0-39, Yellow: 40-69, Green: 70-100
 */
export default function ScoreCard({
  score = 0,
  label = "Score",
  size = 160,
  strokeWidth = 10,
  subtitle = "",
  icon = null,
  animate = true,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = useMemo(() => {
    if (score >= 70) return { stroke: "#22c55e", glow: "rgba(34, 197, 94, 0.3)", label: "Excellent" };
    if (score >= 40) return { stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.3)", label: "Average" };
    return { stroke: "#ef4444", glow: "rgba(239, 68, 68, 0.3)", label: "Needs Work" };
  }, [score]);

  return (
    <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
      <div className="score-ring-container" style={{ width: size, height: size, margin: "0 auto" }}>
        <svg
          className="score-ring-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background ring */}
          <circle
            className="score-ring-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />

          {/* Glow effect */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth + 8}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            opacity={0.15}
            style={{
              transition: animate ? "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          />

          {/* Progress ring */}
          <circle
            className="score-ring-progress"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: animate ? "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
              filter: `drop-shadow(0 0 8px ${color.glow})`,
            }}
          />
        </svg>

        {/* Center text */}
        <div
          className="score-ring-text"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          <div
            style={{
              fontSize: size > 120 ? "2.5rem" : "1.5rem",
              fontWeight: 800,
              color: color.stroke,
              lineHeight: 1,
            }}
          >
            {score}
          </div>
          {size > 100 && (
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--surface-600)",
                fontWeight: 500,
                marginTop: 2,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {color.label}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        {icon && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
            {icon}
          </div>
        )}
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--surface-900)",
            marginBottom: 2,
          }}
        >
          {label}
        </h3>
        {subtitle && (
          <p style={{ fontSize: "0.8rem", color: "var(--surface-600)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
