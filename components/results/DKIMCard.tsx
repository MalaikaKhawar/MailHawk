"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { DnsResults } from "@/types";

interface Props {
  dkim: DnsResults["dkim"];
  fromResult: "pass" | "fail" | "none";
  domain: string;
  selector: string;
  algorithm?: string;
}

const RESULT_CONFIG = {
  valid:     { color: "var(--color-hawk-green)", bg: "#00ff8810", border: "#00ff8830", label: "VALID" },
  revoked:   { color: "#ff4444", bg: "#ff444410", border: "#ff444430", label: "REVOKED" },
  not_found: { color: "var(--color-hawk-muted)", bg: "#55556610", border: "#55556630", label: "NOT FOUND" },
};

const AUTH_CONFIG = {
  pass: { color: "var(--color-hawk-green)", label: "PASS" },
  fail: { color: "#ff4444", label: "FAIL" },
  none: { color: "var(--color-hawk-muted)", label: "NONE" },
};

export default function DKIMCard({ dkim, fromResult, domain, selector, algorithm }: Props) {
  const [expanded, setExpanded] = useState(false);
  const rc = RESULT_CONFIG[dkim.result] || RESULT_CONFIG.not_found;
  const auth = AUTH_CONFIG[fromResult] || AUTH_CONFIG.none;

  return (
    <div className="card-hawk p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-none bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold text-purple-400">DKIM</span>
          </div>
          <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase">
            DKIM Signature
          </h2>
        </div>
        <div className="flex gap-2">
          <span
            className="text-xs font-mono font-bold px-2 py-1 rounded-none border"
            style={{ color: auth.color, background: `${auth.color}10`, borderColor: `${auth.color}30` }}
          >
            {auth.label}
          </span>
          <span
            className="text-xs font-mono px-2 py-1 rounded-none border"
            style={{ color: rc.color, background: rc.bg, borderColor: rc.border }}
          >
            {rc.label}
          </span>
        </div>
      </div>

      
      <div className="space-y-2 mb-4">
        {[
          ["Signing Domain", domain || "-"],
          ["Selector", selector || "-"],
          ["Algorithm", algorithm || "-"],
          ["Key Status", dkim.isRevoked ? "Revoked" : dkim.keyExists ? "Valid public key found" : "Not found"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-hawk-muted w-28 shrink-0 uppercase tracking-wider">{k}</span>
            <span className="text-xs font-mono text-hawk-text">{v}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-hawk-muted leading-relaxed mb-4">{dkim.explanation}</p>

      {dkim.record && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-mono text-hawk-muted hover:text-hawk-muted transition-colors mt-auto"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Hide" : "Show"} DNS record
        </button>
      )}

      {expanded && dkim.record && (
        <div className="mt-4 p-3 rounded-none bg-hawk-bg border border-hawk-border">
          <pre className="text-[11px] font-mono text-hawk-green break-all whitespace-pre-wrap">
            {dkim.record}
          </pre>
        </div>
      )}
    </div>
  );
}
