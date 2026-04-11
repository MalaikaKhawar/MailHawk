import type { LinkResult } from "@/types";
import { Link, AlertTriangle, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface Props { links: LinkResult[] }

const RISK_CONFIG = {
  SAFE:      { color: "var(--color-hawk-green)", icon: CheckCircle, bg: "#00ff8810", border: "#00ff8830" },
  SUSPICIOUS:{ color: "#ffaa00", icon: AlertTriangle, bg: "#ffaa0010", border: "#ffaa0030" },
  DANGEROUS: { color: "#ff4444", icon: XCircle, bg: "#ff444410", border: "#ff444430" },
};

export default function LinkAnalysisCard({ links }: Props) {
  if (links.length === 0) {
    return (
      <div className="card-hawk p-5">
        <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase mb-4">
          Link Analysis
        </h2>
        <p className="text-sm text-hawk-muted font-mono">No URLs found in email header.</p>
      </div>
    );
  }

  const uniqueLinks: LinkResult[] = [];
  const seenUrls = new Set<string>();
  for (const l of links) {
    if (!seenUrls.has(l.url)) {
      seenUrls.add(l.url);
      uniqueLinks.push(l);
    }
  }

  const dangerous = uniqueLinks.filter((l) => l.riskLevel === "DANGEROUS").length;
  const suspicious = uniqueLinks.filter((l) => l.riskLevel === "SUSPICIOUS").length;
  const safe = uniqueLinks.filter((l) => l.riskLevel === "SAFE").length;

  return (
    <div className="card-hawk p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase">
          Link Analysis
        </h2>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {dangerous > 0 && <span className="text-[#ff4444]">{dangerous} dangerous</span>}
          {suspicious > 0 && <span className="text-[#ffaa00]">{suspicious} suspicious</span>}
          {safe > 0 && <span className="text-hawk-green">{safe} safe</span>}
        </div>
      </div>

      <div className="space-y-2">
        {uniqueLinks.map((link, i) => {
          const rc = RISK_CONFIG[link.riskLevel];
          const Icon = rc.icon;

          return (
            <div
              key={i}
              className="p-3 rounded-none border"
              style={{ borderColor: rc.border, background: rc.bg }}
            >
              <div className="flex items-start gap-2.5 mb-2">
                <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: rc.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                      style={{ color: rc.color, borderColor: rc.border, background: "transparent" }}
                    >
                      {link.riskLevel}
                    </span>
                    {link.isShortener && <span className="text-[9px] font-mono text-hawk-muted bg-hawk-card px-1.5 py-0.5 rounded border border-hawk-border">shortener</span>}
                    {link.isIpBased && <span className="text-[9px] font-mono text-[#ff4444] bg-[#ff444410] px-1.5 py-0.5 rounded border border-[#ff444430]">IP-based</span>}
                    {link.isHomograph && <span className="text-[9px] font-mono text-[#ff4444] bg-[#ff444410] px-1.5 py-0.5 rounded border border-[#ff444430]">homograph</span>}
                    {link.isSuspiciousTld && <span className="text-[9px] font-mono text-[#ffaa00] bg-[#ffaa0010] px-1.5 py-0.5 rounded border border-[#ffaa0030]">suspicious TLD</span>}
                    {link.mismatchesFromDomain && <span className="text-[9px] font-mono text-[#ffaa00] bg-[#ffaa0010] px-1.5 py-0.5 rounded border border-[#ffaa0030]">domain mismatch</span>}
                  </div>
                  <p className="text-xs font-mono text-hawk-muted truncate">{link.domain}</p>
                  <p className="text-[10px] font-mono text-hawk-muted truncate mt-0.5">{link.url}</p>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="shrink-0 text-hawk-muted hover:text-hawk-muted transition-colors"
                  title="Open URL (caution)"
                  onClick={(e) => {
                    if (link.riskLevel === "DANGEROUS") {
                      if (!confirm("⚠️ This URL is flagged as DANGEROUS. Are you sure you want to open it?")) {
                        e.preventDefault();
                      }
                    }
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {link.flags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 ml-6">
                  {link.flags.map((flag) => (
                    <span key={flag} className="text-[9px] font-mono text-hawk-muted">
                      · {flag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
