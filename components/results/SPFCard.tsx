"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { DnsResults } from "@/types";

interface Props {
  spf: DnsResults["spf"];
  fromResult: "pass" | "fail" | "softfail" | "neutral" | "none";
}

const RESULT_CONFIG = {
  pass:     { color: "var(--color-hawk-green)", bg: "#00ff8810", border: "#00ff8830", label: "PASS" },
  fail:     { color: "#ff4444", bg: "#ff444410", border: "#ff444430", label: "FAIL" },
  softfail: { color: "#ffaa00", bg: "#ffaa0010", border: "#ffaa0030", label: "SOFTFAIL" },
  neutral:  { color: "var(--color-hawk-muted)", bg: "#88889910", border: "#88889930", label: "NEUTRAL" },
  none:     { color: "var(--color-hawk-muted)", bg: "#55556610", border: "#55556630", label: "NONE" },
};

const TRUST_CONFIG = {
  HIGH:   { color: "var(--color-hawk-green)", label: "HIGH TRUST" },
  MEDIUM: { color: "#ffaa00", label: "MEDIUM TRUST" },
  LOW:    { color: "#ff8800", label: "LOW TRUST" },
  NONE:   { color: "#ff4444", label: "NO TRUST" },
};

export default function SPFCard({ spf, fromResult }: Props) {
  const [expanded, setExpanded] = useState(false);
  const result = fromResult || spf.result;
  let rc = RESULT_CONFIG[result] || RESULT_CONFIG.none;
  const tc = TRUST_CONFIG[spf.trustability] || TRUST_CONFIG.NONE;

  if (result === "pass" && spf.trustability === "NONE") {
    rc = { color: "#ffaa00", bg: "#ffaa0010", border: "#ffaa0030", label: "PASS (UNTRUSTED)" };
  }

  return (
    <div className="card-hawk p-5 h-full flex flex-col">
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-none bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold text-blue-400">SPF</span>
          </div>
          <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase">
            SPF Record
          </h2>
        </div>
        <span
          className="text-xs font-mono font-bold px-2.5 py-1 rounded-none border"
          style={{ color: rc.color, background: rc.bg, borderColor: rc.border }}
        >
          {rc.label}
        </span>
      </div>

      
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tc.color }} />
        <span className="text-xs font-mono" style={{ color: tc.color }}>{tc.label}</span>
      </div>

      
      <p className="text-sm text-hawk-muted leading-relaxed mb-4">{spf.explanation}</p>

      
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-mono text-hawk-muted hover:text-hawk-muted transition-colors mt-auto"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Hide" : "Show"} technical details
      </button>

      {expanded && (
        <div className="mt-4 p-3 rounded-none bg-hawk-bg border border-hawk-border space-y-2">
          {spf.record ? (
            <pre className="text-[11px] font-mono text-hawk-green break-all whitespace-pre-wrap">
              {spf.record}
            </pre>
          ) : (
            <p className="text-xs font-mono text-hawk-muted">No SPF record found in DNS.</p>
          )}
          {spf.mechanisms.length > 0 && (
            <div className="pt-2 border-t border-hawk-border">
              <p className="text-[10px] font-mono text-hawk-muted mb-1 uppercase tracking-widest">Mechanisms</p>
              <div className="flex flex-wrap gap-1.5">
                {spf.mechanisms.map((m) => (
                  <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded bg-hawk-card-hover border border-hawk-border text-hawk-muted">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
