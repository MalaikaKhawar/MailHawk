import type { AnalysisResult } from "@/types";
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, Clock } from "lucide-react";

interface Props {
  data: AnalysisResult;
}

const CONFIG = {
  SAFE: {
    bg: "bg-gradient-to-r from-[#002212] via-[#003a1a] to-[#002212]",
    border: "border-hawk-green/20",
    text: "text-hawk-green",
    icon: ShieldCheck,
    label: "SAFE",
    sub: "This email appears legitimate.",
    glow: "shadow-[0_0_60px_rgba(0,255,136,0.12)]",
    dot: "bg-hawk-green",
  },
  SUSPICIOUS: {
    bg: "bg-gradient-to-r from-[#2a1800] via-[#3a2000] to-[#2a1800]",
    border: "border-[#ffaa00]/20",
    text: "text-[#ffaa00]",
    icon: ShieldAlert,
    label: "SUSPICIOUS",
    sub: "Exercise caution with this email.",
    glow: "shadow-[0_0_60px_rgba(255,170,0,0.10)]",
    dot: "bg-[#ffaa00]",
  },
  SPOOFED: {
    bg: "bg-gradient-to-r from-[#2a0000] via-[#3a0000] to-[#2a0000]",
    border: "border-[#ff4444]/20",
    text: "text-[#ff4444]",
    icon: ShieldX,
    label: "SPOOFED / PHISHING",
    sub: "Do not interact with this email.",
    glow: "shadow-[0_0_60px_rgba(255,68,68,0.12)]",
    dot: "bg-[#ff4444]",
  },
};

export default function VerdictBanner({ data }: Props) {
  const verdict = data.aiVerdict?.verdict || data.spoofDetection.verdict;
  const c = CONFIG[verdict] || CONFIG.SUSPICIOUS;
  const Icon = c.icon;

  const riskScore = data.spoofDetection.riskScore;
  const phishing = data.aiVerdict?.phishingProbability ?? data.spoofDetection.phishingProbability;
  const analysisTime = new Date(data.analyzedAt).toLocaleString("en-US", {
    dateStyle: "medium", timeStyle: "short",
  });

  return (
    <div className={`w-full border-b ${c.border} ${c.bg} ${c.glow}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Verdict */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-none bg-black/20 border ${c.border} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-7 h-7 ${c.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
                <span className="text-xs font-mono text-hawk-muted tracking-widest uppercase">Forensic Verdict</span>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold font-mono ${c.text} tracking-wider`}>
                {c.label}
              </h1>
              <p className="text-sm text-hawk-muted mt-0.5">{data.aiVerdict?.oneLinerVerdict || c.sub}</p>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <div className={`text-2xl font-bold font-mono ${c.text}`}>{riskScore}</div>
              <div className="text-xs font-mono text-hawk-muted">Risk Score</div>
            </div>
            <div className="w-px h-10 bg-hawk-border" />
            <div className="text-center">
              <div className={`text-2xl font-bold font-mono ${phishing >= 60 ? "text-[#ff4444]" : phishing >= 30 ? "text-[#ffaa00]" : "text-hawk-green"}`}>
                {phishing}%
              </div>
              <div className="text-xs font-mono text-hawk-muted">Phishing</div>
            </div>
            <div className="w-px h-10 bg-hawk-border" />
            <div className="text-center">
              <div className="text-lg font-bold font-mono text-hawk-muted">
                {data.spoofDetection.checks.filter(c => c.passed).length}
                <span className="text-sm text-hawk-muted">/{data.spoofDetection.checks.length}</span>
              </div>
              <div className="text-xs font-mono text-hawk-muted">Checks Passed</div>
            </div>
          </div>
        </div>

        {/* AI confidence + timestamp */}
        {data.aiVerdict && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-hawk-muted">
            <span>AI Confidence: <span className="text-hawk-muted">{data.aiVerdict.confidence}%</span></span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Analyzed: {analysisTime}
            </span>
            <span>·</span>
            <span>From: <span className="text-hawk-muted">{data.parsedHeader.from.email || "Unknown"}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
