"use client";

import { useEffect, useRef } from "react";

interface Props {
  probability: number;
}

function getColor(p: number) {
  if (p <= 30) return "var(--color-hawk-green)";
  if (p <= 60) return "#ffaa00";
  return "#ff4444";
}

function getLabel(p: number) {
  if (p <= 15) return "Very Low";
  if (p <= 30) return "Low";
  if (p <= 50) return "Moderate";
  if (p <= 70) return "High";
  if (p <= 85) return "Very High";
  return "Critical";
}

export default function PhishingProbability({ probability }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = Math.min(100, Math.max(0, probability));
  const color = getColor(pct);
  const label = getLabel(pct);

  useEffect(() => {
    if (!barRef.current) return;
    const bar = barRef.current;
    bar.style.width = "0%";
    const timer = setTimeout(() => {
      bar.style.width = `${pct}%`;
    }, 100);
    return () => clearTimeout(timer);
  }, [pct]);

  // Segment markers
  const markers = [
    { pos: 30, label: "30%" },
    { pos: 60, label: "60%" },
  ];

  return (
    <div className="card-hawk p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase">
            Phishing Probability
          </h2>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded border"
            style={{ color, borderColor: `${color}40`, background: `${color}10` }}
          >
            {label}
          </span>
        </div>

        {/* Big percentage */}
        <div className="flex items-baseline gap-2 mb-8">
          <span
            className="text-6xl font-bold font-mono leading-none"
            style={{ color, textShadow: `0 0 20px ${color}60` }}
          >
            {pct}
          </span>
          <span className="text-2xl font-mono text-hawk-muted">%</span>
        </div>
      </div>

      <div>
        {/* Progress bar */}
        <div className="relative mb-3">
          {/* Track */}
          <div className="h-3 rounded-full overflow-hidden bg-hawk-card">
            {/* Gradient zones background */}
            <div
              className="absolute inset-0 h-3 rounded-full opacity-20"
              style={{ background: "linear-gradient(90deg, #00ff88 0%, #ffaa00 30%, #ff4444 60%)" }}
            />
            {/* Active fill */}
            <div
              ref={barRef}
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                background: `linear-gradient(90deg, #004d29, ${color})`,
                boxShadow: `0 0 12px ${color}60`,
                width: "0%",
              }}
            />
          </div>

          {/* Markers */}
          {markers.map((m) => (
            <div
              key={m.pos}
              className="absolute top-0 h-3 flex flex-col items-center"
              style={{ left: `${m.pos}%` }}
            >
              <div className="w-px h-3 bg-hawk-border-hover" />
            </div>
          ))}
        </div>

        {/* Scale */}
        <div className="flex justify-between text-[10px] font-mono text-hawk-muted mb-4">
          <span className="text-hawk-green">0% Safe</span>
          <span className="text-[#ffaa00]">30% Caution</span>
          <span className="text-[#ff4444]">60%+ Danger</span>
        </div>

        <p className="text-xs text-hawk-muted font-mono">
          Based on AI analysis + header signals
        </p>
      </div>
    </div>
  );
}
