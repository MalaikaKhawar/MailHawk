import { Settings, Shield, Bot } from "lucide-react";

const BADGES = [
  { icon: <Settings className="w-5 h-5 text-hawk-green" />, label: "Header Forensics", sub: "Full relay mapping" },
  { icon: <Shield className="w-5 h-5 text-hawk-green" />, label: "Spoof Detection", sub: "13+ checks - realtime" },
  { icon: <Bot className="w-5 h-5 text-hawk-green" />, label: "AI Analysis", sub: "GPT-powered verdict" },
];

export default function FeatureBadges() {
  return (
    <div className="flex flex-wrap gap-3 justify-center mb-8">
      {BADGES.map((b) => (
        <div
          key={b.label}
          className="hover:border-hawk-border-hover flex items-center gap-2 py-[0.45rem] px-[0.85rem] rounded-none bg-hawk-card border border-hawk-border transition-colors duration-150 cursor-default"
        >
          <span className="text-[0.9rem]">{b.icon}</span>
          <div>
            <div className="font-mono text-[0.68rem] font-bold text-hawk-green tracking-[0.08em]">
              {b.label}
            </div>
            <div className="font-mono text-[0.6rem] text-hawk-muted">
              {b.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
