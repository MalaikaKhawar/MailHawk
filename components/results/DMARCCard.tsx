"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info, Check, X } from "lucide-react";
import type { DnsResults } from "@/types";

interface Props {
  dmarc: DnsResults["dmarc"];
  fromResult: "pass" | "fail" | "none";
}

const POLICY_CONFIG = {
  reject:     { color: "var(--color-hawk-green)", label: "reject", desc: "Unauthorized emails are rejected outright" },
  quarantine: { color: "#ffaa00", label: "quarantine", desc: "Suspicious emails go to spam folder" },
  none:       { color: "#ff8800", label: "none", desc: "Monitor only - no enforcement" },
};

const TRUST_CONFIG = {
  HIGH:   { color: "var(--color-hawk-green)", width: "100%", label: "HIGH TRUST" },
  MEDIUM: { color: "#ffaa00", width: "60%", label: "MEDIUM TRUST" },
  LOW:    { color: "#ff8800", width: "30%", label: "LOW TRUST" },
  NONE:   { color: "#ff4444", width: "5%", label: "NO PROTECTION" },
};

export default function DMARCCard({ dmarc, fromResult }: Props) {
  const [expanded, setExpanded] = useState(false);
  const trust = TRUST_CONFIG[dmarc.trustability] || TRUST_CONFIG.NONE;
  const policy = dmarc.policy ? POLICY_CONFIG[dmarc.policy] : null;
  const authColor = fromResult === "pass" ? "var(--color-hawk-green)" : fromResult === "fail" ? "#ff4444" : "var(--color-hawk-muted)";

  return (
    <div className="card-hawk p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-none bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <span className="text-[9px] font-mono font-bold text-orange-400">DMARC</span>
          </div>
          <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase">
            DMARC Policy
          </h2>
        </div>
        <span
          className="text-xs font-mono font-bold px-2.5 py-1 rounded-none border"
          style={{ color: authColor, background: `${authColor}10`, borderColor: `${authColor}30` }}
        >
          {fromResult.toUpperCase()}
        </span>
      </div>

      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono text-hawk-muted uppercase tracking-wider">Trustability</span>
          <span className="text-xs font-mono" style={{ color: trust.color }}>{trust.label}</span>
        </div>
        <div className="h-1.5 rounded-full bg-hawk-card overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: trust.width, background: `linear-gradient(90deg, #004d29, ${trust.color})`, boxShadow: `0 0 8px ${trust.color}60` }}
          />
        </div>
        <div className="text-right text-xs font-mono mt-1" style={{ color: trust.color }}>
          {dmarc.trustabilityScore}/100
        </div>
      </div>

      
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          ["Policy", policy ? (
            <span key="p" style={{ color: policy.color }} className="font-medium">p={policy.label}</span>
          ) : <span key="p" className="text-hawk-muted">Not set</span>],
          ["DKIM Alignment", dmarc.alignment.dkim],
          ["SPF Alignment", dmarc.alignment.spf],
          ["Coverage", `${dmarc.percentage}% of mail`],
          ["Reporting", dmarc.reportingConfigured ? <span key="r" className="flex items-center gap-1"><Check className="w-3 h-3 text-hawk-green" /> Configured</span> : <span key="r" className="flex items-center gap-1"><X className="w-3 h-3 text-[#ff4444]" /> Not configured</span>],
        ].map(([k, v]) => (
          <div key={k as string} className="bg-hawk-bg rounded-none p-2.5 border border-(--hawk-border)">
            <p className="text-[9px] font-mono text-hawk-muted uppercase tracking-widest mb-1">{k as string}</p>
            <p className="text-xs font-mono text-hawk-text">{v as React.ReactNode}</p>
          </div>
        ))}
      </div>

      
      {policy && (
        <div className="flex items-start gap-2 p-2.5 rounded-none bg-hawk-bg border border-(--hawk-border) mb-4">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: policy.color }} />
          <p className="text-xs text-hawk-muted">{policy.desc}</p>
        </div>
      )}

      <p className="text-sm text-hawk-muted leading-relaxed mb-4">{dmarc.explanation}</p>

      {dmarc.record && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-mono text-hawk-muted hover:text-hawk-muted transition-colors mt-auto pt-2"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Hide" : "Show"} raw DMARC record
        </button>
      )}

      {expanded && dmarc.record && (
        <div className="mt-4 p-3 rounded-none bg-hawk-bg border border-hawk-border">
          <pre className="text-[11px] font-mono text-hawk-green break-all whitespace-pre-wrap">
            {dmarc.record}
          </pre>
        </div>
      )}
    </div>
  );
}
