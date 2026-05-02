"use client";

import type { AnalysisResult } from "@/types";
import { ShieldCheck, ShieldAlert, ShieldX, Clock } from "lucide-react";

interface Props {
  data: AnalysisResult;
}

const VERDICT_CONFIG = {
  SAFE: {
    bg: "bg-gradient-to-b from-[#001a0f] to-[#0e2b1a]",
    border: "border-hawk-green/20",
    accent: "#aaff45",
    text: "text-hawk-green",
    icon: ShieldCheck,
    label: "SAFE",
    sub: "This email appears legitimate.",
    glow: "shadow-[0_4px_40px_rgba(170,255,69,0.08)]",
    dot: "bg-hawk-green",
  },
  SUSPICIOUS: {
    bg: "bg-gradient-to-b from-[#1c1000] to-[#1a1200]",
    border: "border-[#ffaa00]/20",
    accent: "#ffaa00",
    text: "text-[#ffaa00]",
    icon: ShieldAlert,
    label: "SUSPICIOUS",
    sub: "Exercise caution with this email.",
    glow: "shadow-[0_4px_40px_rgba(255,170,0,0.07)]",
    dot: "bg-[#ffaa00]",
  },
  SPOOFED: {
    bg: "bg-gradient-to-b from-[#1c0000] to-[#1a0000]",
    border: "border-[#ff4444]/20",
    accent: "#ff4444",
    text: "text-[#ff4444]",
    icon: ShieldX,
    label: "SPOOFED / PHISHING",
    sub: "Do not interact with this email.",
    glow: "shadow-[0_4px_40px_rgba(255,68,68,0.08)]",
    dot: "bg-[#ff4444]",
  },
};

function scoreColor(n: number) {
  return n >= 70 ? "#aaff45" : n >= 40 ? "#ffaa00" : "#ff4444";
}

/** Uniform stat box — all stats use this same shell */
function StatBox({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-4 border-l border-white/6 bg-white/2 min-w-22.5">
      <span
        className="text-2xl font-bold font-mono leading-none"
        style={{ color: color ?? "#c8e6c9" }}
      >
        {value}
      </span>
      <span className="text-[9px] font-mono text-hawk-muted tracking-[0.18em] uppercase mt-1.5">
        {label}
      </span>
      {sub && (
        <span
          className="text-[9px] font-mono font-bold tracking-widest uppercase mt-0.5"
          style={{ color: color ?? "#85a892" }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

export default function VerdictBanner({ data }: Props) {
  const verdict = data.aiVerdict?.verdict || data.spoofDetection.verdict;
  const c = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.SUSPICIOUS;
  const Icon = c.icon;

  const riskScore = data.spoofDetection.riskScore;
  const phishing =
    data.aiVerdict?.phishingProbability ??
    data.spoofDetection.phishingProbability;
  const trust = data.trustScore;
  const passedChecks = data.spoofDetection.checks.filter(
    (ch) => ch.passed,
  ).length;
  const totalChecks = data.spoofDetection.checks.length;

  const analysisTime = new Date(data.analyzedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const trustColor =
    trust?.tier === "trusted"
      ? "#aaff45"
      : trust?.tier === "uncertain"
        ? "#ffaa00"
        : "#ff4444";
  const trustTierLabel =
    trust?.tier === "trusted"
      ? "Trusted"
      : trust?.tier === "uncertain"
        ? "Uncertain"
        : "Untrusted";

  return (
    <div className={`w-full border-b ${c.border} ${c.bg} ${c.glow}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row items-start lg:items-stretch py-6 gap-4 lg:gap-0">
          
          <div className="flex items-start gap-4 flex-1 lg:pr-8 lg:border-r lg:border-white/6">
            <div
              className="w-12 h-12 shrink-0 border flex items-center justify-center mt-0.5"
              style={{
                borderColor: c.accent + "33",
                background: c.accent + "0d",
              }}
            >
              <Icon style={{ color: c.accent }} className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`}
                />
                <span className="text-[10px] font-mono text-hawk-muted tracking-[0.2em] uppercase">
                  Forensic Verdict
                </span>
              </div>
              <h1
                className={`text-3xl font-bold font-mono ${c.text} tracking-wider leading-none mb-2`}
              >
                {c.label}
              </h1>
              <p className="text-sm text-hawk-muted leading-relaxed max-w-lg">
                {data.aiVerdict?.oneLinerVerdict || c.sub}
              </p>
            </div>
          </div>

          
          <div className="flex items-stretch mt-0 lg:ml-0 flex-wrap lg:flex-nowrap">
            
            {trust && (
              <StatBox
                label=""
                value={`${trust.score}%`}
                color={trustColor}
                sub={trustTierLabel}
              />
            )}

            
            <StatBox
              label="Risk Score"
              value={`${riskScore}/100`}
              color={scoreColor(100 - riskScore)}
            />

            
            <StatBox
              label="Phishing"
              value={`${phishing}%`}
              color={
                phishing >= 60
                  ? "#ff4444"
                  : phishing >= 30
                    ? "#ffaa00"
                    : "#aaff45"
              }
            />

            
            <StatBox
              label="Checks Passed"
              value={`${passedChecks}/${totalChecks}`}
              color={
                passedChecks === totalChecks
                  ? "#aaff45"
                  : passedChecks >= totalChecks * 0.7
                    ? "#ffaa00"
                    : "#ff4444"
              }
            />

            
            {data.aiVerdict && (
              <StatBox
                label="AI Confidence"
                value={`${data.aiVerdict.confidence}%`}
                color="#c8e6c9"
              />
            )}
          </div>
        </div>

        
        {trust && trust.factors.length > 0 && (
          <div className="border-t border-white/6 py-3 flex flex-wrap items-center">
            {trust.factors.map((f, i) => (
              <div
                key={f.name}
                className={`flex items-center gap-2.5 px-4 py-1 ${i > 0 ? "border-l border-white/5" : ""}`}
              >
                <span className="text-[9px] font-mono text-hawk-muted tracking-[0.15em] uppercase whitespace-nowrap">
                  {f.name}
                </span>
                <div className="w-20 h-0.75 bg-white/6 overflow-hidden">
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${f.score}%`,
                      background: scoreColor(f.score),
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-mono font-semibold w-7 text-right shrink-0"
                  style={{ color: scoreColor(f.score) }}
                >
                  {f.score}
                </span>
              </div>
            ))}
          </div>
        )}

        
        <div className="border-t border-white/6 py-2.5 flex flex-wrap items-center gap-4 text-[11px] font-mono text-hawk-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 opacity-50" />
            {analysisTime}
          </span>
          <span className="opacity-30">·</span>
          <span>
            From:{" "}
            <span className="text-hawk-muted/80">
              {data.parsedHeader.from.email || "Unknown"}
            </span>
          </span>
          {data.parsedHeader.fromDomain && (
            <>
              <span className="opacity-30">·</span>
              <span>
                Domain:{" "}
                <span className="text-hawk-muted/80">
                  {data.parsedHeader.fromDomain}
                </span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
