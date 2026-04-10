"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types";
import { Download, Loader2, FileText } from "lucide-react";

interface Props { data: AnalysisResult }

export default function DownloadReport({ data }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    setError("");
    try {
      const url = `/api/report`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mailhawk-report-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-hawk p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-none bg-[rgba(170,255,69,0.1)] border border-[rgba(170,255,69,0.2)] flex-shrink-0 flex items-center justify-center">
            <FileText className="w-5 h-5 text-hawk-green" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-hawk-text">Download Report</h3>
            <p className="text-[10px] text-hawk-muted font-mono mt-1">
              FORENSIC SNAPSHOT · {new Date(data.analyzedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <p className="text-xs font-mono text-hawk-muted leading-relaxed">
          Generate an offline PDF copy containing full header metadata, relay infrastructure, and AI spoof detection results.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-hawk-border">
        {error && (
          <div className="mb-3 p-2 bg-[#ff4444]/10 border border-[#ff4444]/30 text-[#ff4444] text-[10px] uppercase tracking-wider font-mono leading-tight">
            [ERROR] {error}
          </div>
        )}
        <button
          id="download-report-button"
          onClick={handleDownload}
          disabled={loading}
          className="btn-hawk w-full flex items-center justify-center gap-2 text-sm px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
          ) : (
             <><Download className="w-4 h-4" /> Download PDF</>
          )}
        </button>
      </div>
    </div>
  );
}
