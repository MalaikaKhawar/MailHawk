"use client";

import { useState } from "react";
import type { AIVerdict } from "@/types";
import {
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  ShieldAlert, Brain, Wrench
} from "lucide-react";

interface Props { verdict: AIVerdict }

const SEV_CONFIG = {
  HIGH:   { color: "#ff4444", bg: "#ff444412", border: "#ff444430" },
  MEDIUM: { color: "#ffaa00", bg: "#ffaa0012", border: "#ffaa0030" },
  LOW:    { color: "var(--color-hawk-green)", bg: "#00ff8812", border: "#00ff8830" },
};

const PRI_CONFIG = {
  URGENT: { color: "#ff4444", label: "URGENT" },
  HIGH:   { color: "#ffaa00", label: "HIGH" },
  LOW:    { color: "var(--color-hawk-green)", label: "LOW" },
};

export default function AIVerdictCard({ verdict }: Props) {
  const [showTech, setShowTech] = useState(false);

  return (
    <div className="card-hawk p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-none bg-hawk-green/10 border border-hawk-green/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-hawk-green" />
        </div>
        <div>
          <h2 className="text-sm font-mono font-bold text-hawk-text tracking-wide">AI FORENSIC ANALYSIS</h2>
          <p className="text-xs font-mono text-hawk-muted">Confidence: {verdict.confidence}%</p>
        </div>
      </div>

      {/* One-liner */}
      <div className="p-4 rounded-none bg-hawk-bg border border-hawk-border mb-6">
        <p
          className="text-lg leading-relaxed text-hawk-text"
          style={{ fontFamily: "var(--font-instrument-serif)", fontStyle: "italic" }}
        >
          &ldquo;{verdict.oneLinerVerdict}&rdquo;
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h3 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase mb-3">Summary</h3>
        <p className="text-sm text-hawk-muted leading-relaxed">{verdict.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Red Flags */}
        {verdict.redFlags.length > 0 && (
          <div>
            <h3 className="text-xs font-mono font-bold text-[#ff4444] tracking-widest uppercase mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Red Flags ({verdict.redFlags.length})
            </h3>
            <div className="space-y-2">
              {verdict.redFlags.map((flag, i) => {
                const sc = SEV_CONFIG[flag.severity as keyof typeof SEV_CONFIG] || SEV_CONFIG.LOW;
                return (
                  <div
                    key={i}
                    className="p-3 rounded-none border"
                    style={{ borderColor: sc.border, background: sc.bg }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{ color: sc.color, background: `${sc.color}15` }}
                      >
                        {flag.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-hawk-text">{flag.flag}</span>
                    </div>
                    <p className="text-[11px] text-hawk-muted leading-relaxed">{flag.explanation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        {verdict.trustIndicators.length > 0 && (
          <div>
            <h3 className="text-xs font-mono font-bold text-hawk-green tracking-widest uppercase mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3" />
              Trust Indicators
            </h3>
            <div className="space-y-2">
              {verdict.trustIndicators.map((ti, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-none bg-[#00ff8808] border border-[#00ff8820]">
                  <span className="text-hawk-green mt-0.5 flex-shrink-0 text-sm">✓</span>
                  <p className="text-xs text-hawk-muted">{ti}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {verdict.recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase mb-3 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3" />
            Recommendations
          </h3>
          <div className="space-y-2">
            {verdict.recommendations.map((rec, i) => {
              const pc = PRI_CONFIG[rec.priority as keyof typeof PRI_CONFIG] || PRI_CONFIG.LOW;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-none bg-hawk-bg border border-[var(--hawk-border)]">
                  <span
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5"
                    style={{ color: pc.color, background: `${pc.color}15` }}
                  >
                    {pc.label}
                  </span>
                  <p className="text-xs text-hawk-text">{rec.action}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Technical Breakdown — expandable */}
      <button
        onClick={() => setShowTech(!showTech)}
        className="flex items-center gap-2 text-xs font-mono text-hawk-muted hover:text-hawk-muted transition-colors w-full"
      >
        <Wrench className="w-3 h-3" />
        {showTech ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showTech ? "Hide" : "Show"} Technical Breakdown
      </button>

      {showTech && (
        <div className="mt-4 space-y-3">
          {Object.entries(verdict.technicalBreakdown).map(([key, val]) => (
            <div key={key} className="p-3 rounded-none bg-hawk-bg border border-[var(--hawk-border)]">
              <p className="text-[9px] font-mono text-hawk-green uppercase tracking-widest mb-1.5">
                {key.replace(/Analysis$/, "").replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="text-xs text-hawk-muted leading-relaxed">{val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
