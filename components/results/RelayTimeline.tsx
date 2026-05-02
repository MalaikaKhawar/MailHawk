import type { RelayHop, IPResult } from "@/types";
import { Globe } from "lucide-react";

interface Props {
  hops: RelayHop[];
  ipResults: IPResult[];
}

function formatDelay(secs: number): string {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${Math.round(secs / 3600)}h`;
}

function getHopColor(hop: RelayHop, ip?: IPResult): string {
  if (ip?.riskLevel === "MALICIOUS") return "#ff4444";
  if (ip?.riskLevel === "SUSPICIOUS") return "#ffaa00";
  if (hop.isPrivateIp) return "var(--color-hawk-muted)";
  if (hop.delaySeconds > 3600) return "#ff6600";
  return "var(--color-hawk-green)";
}



export default function RelayTimeline({ hops, ipResults }: Props) {
  if (hops.length === 0) {
    return (
      <div className="card-hawk p-6">
        <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase mb-4">
          Relay Timeline
        </h2>
        <p className="text-sm text-hawk-muted/80 font-mono">No relay hops found in email header.</p>
      </div>
    );
  }

  return (
    <div className="card-hawk p-5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase">
          Relay Timeline
        </h2>
        <span className="text-xs font-mono text-hawk-muted/80">{hops.length} hop{hops.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="space-y-0">
        {hops.map((hop, index) => {
          const ip = ipResults.find((r) => r.ip === hop.ip);
          const color = getHopColor(hop, ip);
          const isLast = index === hops.length - 1;
          const isAnomaly = (ip?.riskLevel === "MALICIOUS" || ip?.riskLevel === "SUSPICIOUS" || hop.delaySeconds > 3600);

          return (
            <div key={hop.hopNumber} className="flex gap-4">
              
              <div className="flex flex-col items-center shrink-0 w-10">
                
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 font-mono font-bold text-xs"
                  style={{
                    borderColor: color,
                    background: `${color}12`,
                    color,
                    boxShadow: isAnomaly ? `0 0 12px ${color}60` : "none",
                  }}
                >
                  {hop.hopNumber}
                </div>
                
                {!isLast && (
                  <div
                    className="w-0.5 flex-1 my-1"
                    style={{ background: `linear-gradient(to bottom, ${color}40, ${color}10)`, minHeight: 24 }}
                  />
                )}
              </div>

              
              <div
                className={`flex-1 mb-3 p-4 rounded-none border transition-colors ${
                  isAnomaly
                    ? "border-current/30 bg-hawk-card-hover"
                    : "border-(--hawk-border) bg-hawk-bg"
                }`}
                style={{ borderColor: isAnomaly ? `${color}30` : undefined }}
              >
                
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-mono text-hawk-muted/80 uppercase tracking-wider">From</span>
                      {ip && (
                        <span className="text-[10px] font-mono text-hawk-muted border border-hawk-border px-1.5 py-0.5 rounded bg-hawk-bg">
                          <Globe className="w-3 h-3 inline mr-1" />
                          {ip.countryCode || "Unknown"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-hawk-text truncate">{hop.from || "-"}</p>
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-[9px] font-mono text-hawk-muted/80 uppercase tracking-wider mb-0.5">By</p>
                    <p className="text-xs font-mono text-hawk-text truncate">{hop.by || "-"}</p>
                  </div>
                </div>

                
                <div className="flex flex-wrap gap-3 text-[10px] font-mono">
                  {hop.ip && (
                    <span className="flex items-center gap-1" style={{ color }}>
                      <span className="text-hawk-muted/80">IP</span>
                      {hop.ip}
                    </span>
                  )}
                  {ip?.city && (
                    <span className="text-hawk-muted">
                      {ip.city}, {ip.countryCode}
                    </span>
                  )}
                  {ip?.isp && (
                    <span className="text-hawk-muted truncate max-w-50">{ip.isp}</span>
                  )}
                  <span className="text-hawk-muted/80">{hop.protocol}</span>
                  {hop.hopNumber > 1 && (
                    <span
                      className="ml-auto"
                      style={{ color: hop.delaySeconds > 3600 ? "#ff6600" : "var(--hawk-muted)" }}
                    >
                      +{formatDelay(hop.delaySeconds)}
                    </span>
                  )}
                </div>

                
                {ip && (
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="text-[9px] font-mono px-2 py-0.5 rounded border"
                      style={{
                        color: ip.riskLevel === "CLEAN" ? "var(--color-hawk-green)" : ip.riskLevel === "MALICIOUS" ? "#ff4444" : "#ffaa00",
                        borderColor: `${ip.riskLevel === "CLEAN" ? "var(--color-hawk-green)" : ip.riskLevel === "MALICIOUS" ? "#ff4444" : "#ffaa00"}30`,
                        background: `${ip.riskLevel === "CLEAN" ? "var(--color-hawk-green)" : ip.riskLevel === "MALICIOUS" ? "#ff4444" : "#ffaa00"}10`,
                      }}
                    >
                      {ip.riskLevel} · Abuse {ip.abuseScore}/100
                    </span>
                    {ip.isTor && <span className="text-[9px] font-mono text-[#ff4444] border border-[#ff444430] bg-[#ff444410] px-2 py-0.5 rounded">TOR NODE</span>}
                    {ip.isProxy && <span className="text-[9px] font-mono text-[#ffaa00] border border-[#ffaa0030] bg-[#ffaa0010] px-2 py-0.5 rounded">PROXY</span>}
                  </div>
                )}

                
                <p className="text-[10px] font-mono text-hawk-border-hover mt-2">
                  {new Date(hop.timestamp).toUTCString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
