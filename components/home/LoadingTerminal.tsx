"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  "Parsing email header...",
  "Extracting relay hops...",
  "Checking SPF record...",
  "Checking DKIM signature...",
  "Checking DMARC policy...",
  "Checking IP reputation...",
  "Analyzing link safety...",
  "Running AI forensic analysis...",
  "Building report...",
];

type StepState = "pending" | "active" | "done";

export default function LoadingTerminal() {
  const [stepStates, setStepStates] = useState<StepState[]>(STEPS.map(() => "pending"));
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i >= STEPS.length) {
        clearInterval(interval);
        return;
      }
      setStepStates((prev) => {
        const next = [...prev];
        if (i > 0) next[i - 1] = "done";
        next[i] = "active";
        return next;
      });
      setCurrentStep(i);
      i++;
    }, 650);

    return () => clearInterval(interval);
  }, []);

  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div className="terminal-container p-5 space-y-4">
      
      <div className="flex items-center gap-2 pb-3 border-b border-hawk-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-hawk-danger/50" />
          <div className="w-3 h-3 rounded-full bg-hawk-warning/50" />
          <div className="w-3 h-3 rounded-full bg-hawk-green/50" />
        </div>
        <span className="text-xs font-mono text-[#444455] ml-2">mailhawk — forensic-engine</span>
      </div>

      
      <div className="space-y-2 min-h-50">
        {STEPS.map((step, i) => {
          const state = stepStates[i];
          return (
            <div
              key={step}
              className={`flex items-center gap-3 text-sm font-mono transition-opacity duration-300 ${
                state === "pending" ? "opacity-0" : "opacity-100"
              }`}
              style={{ animation: state !== "pending" ? "terminal-line 0.3s ease forwards" : undefined }}
            >
              <span
                className={`text-base w-5 shrink-0 ${
                  state === "done"
                    ? "text-hawk-green"
                    : state === "active"
                    ? "text-hawk-warning"
                    : "text-[#444455]"
                }`}
              >
                {state === "done" ? "✓" : state === "active" ? "▶" : "○"}
              </span>
              <span
                className={
                  state === "done"
                    ? "text-hawk-green"
                    : state === "active"
                    ? "text-hawk-text"
                    : "text-[#444455]"
                }
              >
                {step}
                {state === "active" && (
                  <span className="cursor-blink ml-0.5 text-hawk-green">▌</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      
      <div className="space-y-2 pt-2">
        <div className="flex justify-between text-xs font-mono text-[#444455]">
          <span>Analysis progress</span>
          <span className="text-hawk-green">{progress}%</span>
        </div>
        <div className="h-1.5 bg-hawk-card rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #004d29, #00ff88)",
              boxShadow: "0 0 10px rgba(0,255,136,0.4)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
