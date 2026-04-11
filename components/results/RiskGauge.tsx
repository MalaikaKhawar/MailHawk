"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Props {
  score: number;
}

function getColor(score: number) {
  if (score <= 30) return "var(--color-hawk-green)";
  if (score <= 60) return "#ffaa00";
  return "#ff4444";
}

function getLabel(score: number) {
  if (score <= 30) return "LOW RISK";
  if (score <= 60) return "MODERATE";
  return "HIGH RISK";
}

// Needle custom shape
function Needle({ cx, cy, score }: { cx: number; cy: number; score: number }) {
  const angle = (score / 100) * 180 - 180; // -180 (left) to 0 (right)
  const radian = (angle * Math.PI) / 180;
  const len = 62;
  const x2 = cx + len * Math.cos(radian);
  const y2 = cy + len * Math.sin(radian);
  return (
    <g>
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="var(--color-hawk-text)" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="var(--color-hawk-text)" />
      <circle cx={cx} cy={cy} r={3} fill="var(--color-hawk-bg)" />
    </g>
  );
}

export default function RiskGauge({ score }: Props) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const color = getColor(clampedScore);
  const label = getLabel(clampedScore);

  // Gauge: 3 arcs (green 0-30, yellow 31-60, red 61-100)
  const data = [
    { value: 30, color: "var(--color-hawk-green)" },
    { value: 30, color: "#ffaa00" },
    { value: 40, color: "#ff4444" },
  ];

  return (
    <div className="card-hawk p-6 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase">Risk Score</h2>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded border"
          style={{ color, borderColor: `${color}40`, background: `${color}10` }}
        >
          {label}
        </span>
      </div>

      <div className="relative w-full" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            {/* Background arc */}
            <Pie
              data={[{ value: 100 }]}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={85}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="var(--hawk-border)" />
            </Pie>
            {/* Colored zones */}
            <Pie
              data={data}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={85}
              dataKey="value"
              stroke="none"
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={`${entry.color}60`} />
              ))}
            </Pie>
            {/* Active score arc */}
            <Pie
              data={[
                { value: clampedScore },
                { value: 100 - clampedScore },
              ]}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={72}
              outerRadius={83}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center number */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
          <span
            className="text-5xl font-bold font-mono leading-none"
            style={{ color, textShadow: `0 0 20px ${color}80` }}
          >
            {clampedScore}
          </span>
          <span className="text-xs font-mono text-hawk-muted mt-1">/ 100</span>
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between w-full mt-1 px-2">
        <span className="text-[10px] font-mono text-hawk-green">0 SAFE</span>
        <span className="text-[10px] font-mono text-hawk-warning">30–60</span>
        <span className="text-[10px] font-mono text-hawk-danger">SPOOFED 100</span>
      </div>
    </div>
  );
}
