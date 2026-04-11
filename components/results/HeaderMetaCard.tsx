import type { ParsedHeader } from "@/types";
import { Mail, User, AtSign, Calendar, Hash, CornerUpRight, Reply } from "lucide-react";

interface Props { header: ParsedHeader }

const formatDate = (raw: string) => {
  try { return new Date(raw).toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" }); }
  catch { return raw; }
};

export default function HeaderMetaCard({ header }: Props) {
  const rows = [
    { icon: User, label: "From", value: `${header.from.name ? `"${header.from.name}" ` : ""}<${header.from.email}>`, mono: true },
    { icon: Mail, label: "To", value: header.to, mono: true },
    { icon: Hash, label: "Subject", value: header.subject, mono: false },
    { icon: Calendar, label: "Date", value: formatDate(header.date), mono: false },
    { icon: AtSign, label: "Message-ID", value: header.messageId, mono: true },
    { icon: CornerUpRight, label: "Return-Path", value: header.returnPath || "—", mono: true },
    { icon: Reply, label: "Reply-To", value: header.replyTo || "—", mono: true },
  ];

  const extras = [
    { label: "X-Originating-IP", value: header.xOriginatingIp || "—" },
    { label: "X-Mailer", value: header.xMailer || "—" },
    { label: "X-Spam-Score", value: header.xSpamScore > 0 ? String(header.xSpamScore) : "—" },
    { label: "Content-Type", value: header.contentType || "—" },
    { label: "MIME-Version", value: header.mimeVersion || "—" },
  ];

  return (
    <div className="card-hawk p-5">
      <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase mb-4">
        Email Metadata
      </h2>

      <div className="space-y-3">
        {rows.map(({ icon: Icon, label, value, mono }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-none bg-hawk-card flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3 h-3 text-hawk-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-mono text-hawk-muted/80 uppercase tracking-widest mb-0.5">{label}</p>
              <p
                className={`text-xs break-all leading-relaxed ${mono ? "font-mono text-hawk-text" : "text-hawk-text"}`}
                style={mono ? { fontFamily: "var(--font-dm-mono)" } : undefined}
              >
                {value || "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Extra headers */}
      <div className="mt-5 pt-4 border-t border-(--hawk-border)">
        <p className="text-[9px] font-mono text-hawk-muted/80 uppercase tracking-widest mb-3">Extended Headers</p>
        <div className="grid grid-cols-1 gap-2">
          {extras.map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-hawk-muted/80 w-36 shrink-0">{label}</span>
              <span className="text-[10px] font-mono text-hawk-muted truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
