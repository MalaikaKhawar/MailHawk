import Link from "next/link";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-hawk-border bg-hawk-bg mt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-6 items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-none bg-hawk-green flex items-center justify-center">
              <Shield className="w-3 h-3 text-hawk-bg" />
            </div>
            <span className="font-mono font-bold text-[0.85rem] text-hawk-text">
              Mail<span className="text-hawk-green">Hawk</span>
            </span>
            <span className="font-mono text-[0.65rem] text-hawk-border-hover ml-2">v1.0</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {[
              { href: "/", label: "Analyze" },
              { href: "https://github.com", label: "GitHub", external: true },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                target={l.external ? "_blank" : undefined}
                rel={l.external ? "noopener noreferrer" : undefined}
                className="font-mono text-[0.72rem] text-hawk-muted no-underline tracking-[0.04em] hover:text-hawk-text transition-colors duration-150"
              >
                {l.label}
              </a>
            ))}
            <span className="font-mono text-[0.72rem] text-hawk-muted tracking-[0.03em]">
              No logs. No auth. 100% stateless.
            </span>
          </div>

          {/* Copyright */}
          <p className="font-mono text-[0.68rem] text-hawk-border-hover m-0">
            © {new Date().getFullYear()} MailHawk. Open source.
          </p>
        </div>

        {/* Security note */}
        <div className="mt-6 pt-5 border-t border-hawk-border flex items-center gap-2">
          <span className="text-hawk-green font-mono text-xs">▸</span>
          <span className="font-mono text-[0.68rem] text-hawk-muted">
            All analysis is performed server-side. No email data is stored or logged. External API calls are made per-request only.
          </span>
        </div>
      </div>
    </footer>
  );
}
