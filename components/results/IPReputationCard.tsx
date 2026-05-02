import type { IPResult } from "@/types";
import { Globe, Server, AlertTriangle, Shield } from "lucide-react";

interface Props { ipResults: IPResult[] }

const RISK_CONFIG = {
  CLEAN:     { color: "var(--color-hawk-green)", bg: "#00ff8810", border: "#00ff8830" },
  SUSPICIOUS:{ color: "#ffaa00", bg: "#ffaa0010", border: "#ffaa0030" },
  MALICIOUS: { color: "#ff4444", bg: "#ff444410", border: "#ff444430" },
};

const FLAG_EMOJIS: Record<string, string> = {
  US:"🇺🇸",DE:"🇩🇪",GB:"🇬🇧",FR:"🇫🇷",NL:"🇳🇱",RU:"🇷🇺",
  CN:"🇨🇳",IN:"🇮🇳",PK:"🇵🇰",BR:"🇧🇷",JP:"🇯🇵",AU:"🇦🇺",
  CA:"🇨🇦",SG:"🇸🇬",KR:"🇰🇷",TR:"🇹🇷",IT:"🇮🇹",ES:"🇪🇸",
};

export default function IPReputationCard({ ipResults }: Props) {
  if (ipResults.length === 0) {
    return (
      <div className="card-hawk p-5">
        <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase mb-4">
          IP Reputation
        </h2>
        <p className="text-sm text-hawk-muted font-mono">No public IPs found in relay path.</p>
      </div>
    );
  }

  return (
    <div className="card-hawk p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase">
          IP Reputation
        </h2>
        <span className="text-xs font-mono text-hawk-muted">{ipResults.length} IP{ipResults.length !== 1 ? "s" : ""} checked</span>
      </div>

      <div className="space-y-3">
        {ipResults.map((ip) => {
          const rc = RISK_CONFIG[ip.riskLevel];
          const flag = FLAG_EMOJIS[ip.countryCode] || "🌐";

          return (
            <div
              key={ip.ip}
              className="p-4 rounded-none border transition-colors"
              style={{ borderColor: rc.border, background: rc.bg }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-none flex items-center justify-center shrink-0"
                    style={{ background: rc.bg, border: `1px solid ${rc.border}` }}
                  >
                    <Server className="w-4 h-4" style={{ color: rc.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-mono font-bold" style={{ color: rc.color }}>
                      {ip.ip}
                    </p>
                    <p className="text-[10px] font-mono text-hawk-muted">Hop #{ip.hopNumber}</p>
                  </div>
                </div>

                
                <span
                  className="text-xs font-mono font-bold px-2.5 py-1 rounded-none border shrink-0"
                  style={{ color: rc.color, background: "transparent", borderColor: rc.border }}
                >
                  {ip.riskLevel}
                </span>
              </div>

              
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-hawk-muted" />
                  <span className="text-hawk-muted">{flag} {ip.city}, {ip.country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-hawk-muted" />
                  <span style={{ color: ip.abuseScore >= 75 ? "#ff4444" : ip.abuseScore >= 25 ? "#ffaa00" : "var(--color-hawk-green)" }}>
                    Abuse: {ip.abuseScore}/100
                  </span>
                </div>
                <div className="text-hawk-muted truncate col-span-2">{ip.isp || ip.org || "—"}</div>
              </div>

              
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ip.isTor && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff444420] text-hawk-danger border border-[#ff444430]">⚠ TOR</span>}
                {ip.isProxy && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ffaa0020] text-hawk-warning border border-[#ffaa0030]">⚠ PROXY</span>}
                {ip.isHosting && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#4488ff20] text-[#4488ff] border border-[#4488ff30]">HOSTING</span>}
                {ip.totalReports > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff444420] text-hawk-danger border border-[#ff444430]">
                    <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />
                    {ip.totalReports} reports
                  </span>
                )}
                {ip.usageType && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-hawk-card text-hawk-muted border border-hawk-border">{ip.usageType}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
