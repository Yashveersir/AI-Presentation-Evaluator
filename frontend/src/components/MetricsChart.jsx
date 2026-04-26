import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function MetricsChart({ emotionData = [], eyeContactData = [], fillerWords = [] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <EmotionTimeline data={emotionData} />
      <EyeContactChart data={eyeContactData} />
      <FillerWordHeatmap data={fillerWords} />
    </div>
  );
}

function EmotionTimeline({ data }) {
  const EMOTION_VALUES = { confident: 5, happy: 4, neutral: 3, surprised: 2, nervous: 1, confused: 0 };
  const chartData = data.filter(d => d.emotion !== "unknown").map(d => ({
    time: `${d.timestamp}s`,
    value: EMOTION_VALUES[d.emotion] ?? 3,
    emotion: d.emotion,
    confidence: Math.round((d.confidence || 0) * 100),
  }));
  const step = Math.max(1, Math.floor(chartData.length / 60));
  const sampled = chartData.filter((_, i) => i % step === 0);

  return (
    <div className="glass-card" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--surface-900)", marginBottom: "1rem" }}>
        Emotion Timeline
      </h3>
      {sampled.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={sampled}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-300)" />
            <XAxis dataKey="time" stroke="var(--surface-500)" fontSize={11} tickLine={false} interval="preserveStartEnd" />
            <YAxis stroke="var(--surface-500)" fontSize={10} domain={[0, 5]} ticks={[0,1,2,3,4,5]}
              tickFormatter={v => ["confused","nervous","surprised","neutral","happy","confident"][v] || ""} />
            <Tooltip contentStyle={{ background: "var(--surface-100)", border: "1px solid var(--glass-border)", borderRadius: 8, fontSize: "0.8rem" }} />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : <p style={{ textAlign: "center", padding: "2rem", color: "var(--surface-500)" }}>No emotion data</p>}
    </div>
  );
}

function EyeContactChart({ data }) {
  const contact = data.filter(d => d.hasEyeContact).length;
  const noContact = data.filter(d => !d.hasEyeContact).length;
  const total = contact + noContact;
  const chartData = [
    { name: "Eye Contact", value: total > 0 ? Math.round((contact / total) * 100) : 0, fill: "#22c55e" },
    { name: "No Contact", value: total > 0 ? Math.round((noContact / total) * 100) : 0, fill: "#ef4444" },
  ];

  return (
    <div className="glass-card" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--surface-900)", marginBottom: "1rem" }}>Eye Contact Analysis</h3>
      {total > 0 ? (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} layout="vertical" barCategoryGap={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-300)" horizontal={false} />
            <XAxis type="number" stroke="var(--surface-500)" fontSize={11} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="name" stroke="var(--surface-500)" fontSize={12} width={100} />
            <Tooltip formatter={v => [`${v}%`, ""]} contentStyle={{ background: "var(--surface-100)", border: "1px solid var(--glass-border)", borderRadius: 8 }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
              {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : <p style={{ textAlign: "center", padding: "2rem", color: "var(--surface-500)" }}>No eye contact data</p>}
    </div>
  );
}

function FillerWordHeatmap({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--surface-900)", marginBottom: "1rem" }}>Filler Words</h3>
        <p style={{ textAlign: "center", padding: "2rem", color: "var(--surface-500)" }}>No filler words detected 🎉</p>
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.count), 1);
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="glass-card" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--surface-900)", marginBottom: "1rem" }}>Filler Words</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((fw, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ minWidth: 80, fontSize: "0.85rem", fontWeight: 600, color: "var(--warning-400)", fontFamily: "var(--font-mono)" }}>"{fw.word}"</span>
            <div style={{ flex: 1, height: 24, background: "var(--surface-200)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.max(5, (fw.count / max) * 100)}%`, background: `rgba(251,191,36,${0.3 + (fw.count/max)*0.4})`, borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 8 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "white" }}>{fw.count}×</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
