"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import LoadingTerminal from "@/components/home/LoadingTerminal";

const PLACEHOLDER = `Received: from mail.example.com (mail.example.com [192.0.2.1])
        by mx.recipient.com with ESMTP id abc123
        for <user@recipient.com>; Mon, 10 Apr 2026 12:00:00 +0000
Authentication-Results: mx.recipient.com;
        spf=pass smtp.mailfrom=sender@example.com;
        dkim=pass header.d=example.com;
        dmarc=pass
From: "Sender Name" <sender@example.com>
To: user@recipient.com
Subject: Your account requires attention
Date: Mon, 10 Apr 2026 12:00:00 +0000
Message-ID: <unique-id@example.com>`;

const CHAR_LIMIT = 50000;

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function HeaderInput({ value, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAnalyze = async () => {
    if (!value.trim()) {
      setError("Please paste an email header before analyzing.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawHeader: value }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const result = await res.json();
      sessionStorage.setItem("mailhawk_result", JSON.stringify(result));
      router.push("/analyze");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <LoadingTerminal />
      ) : (
        <>
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="header-input"
              value={value}
              onChange={(e) => {
                if (e.target.value.length <= CHAR_LIMIT) onChange(e.target.value);
              }}
              placeholder={PLACEHOLDER}
              rows={14}
              spellCheck={false}
              className="input-hawk w-full resize-none p-4 text-sm leading-relaxed placeholder-hawk-border-hover focus:outline-none mb-4 font-mono"
            />
            {/* Char count */}
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-[#444455]">
              {value.length.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[#ff4444] font-mono flex items-center gap-1.5">
              <span>✗</span> {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => onChange("")}
              disabled={!value}
              className="text-xs font-mono text-hawk-muted hover:text-hawk-muted transition-colors disabled:opacity-30"
            >
              Clear
            </button>
            <button
              id="analyze-button"
              onClick={handleAnalyze}
              disabled={!value.trim() || loading}
              className="btn-hawk flex items-center gap-2 text-sm px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Analyze Email
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
