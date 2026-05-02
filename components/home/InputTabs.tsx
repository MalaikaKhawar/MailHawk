"use client";

import { useState } from "react";
import HeaderInput from "@/components/home/HeaderInput";
import FileUpload from "@/components/home/FileUpload";

export default function InputTabs() {
  const [active, setActive] = useState<"upload" | "paste">("upload");
  const [header, setHeader] = useState("");

  return (
    <div className="w-full max-w-175 mx-auto">
      
      <div className="flex gap-2 justify-center mb-4">
        {(["upload", "paste"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`font-mono text-xs font-semibold tracking-[0.04em] px-5 py-2 rounded-none border border-hawk-border cursor-pointer transition-all duration-150 box-border ${
              active === tab
                ? "border-b-hawk-green bg-hawk-green text-[#0b1a0f]"
                : "border-b-hawk-border bg-hawk-card text-hawk-muted"
            }`}
          >
            {tab === "paste" ? "⌨ Paste Header" : "📁 Upload File"}
          </button>
        ))}
      </div>

      
      <div className="bg-hawk-card border border-hawk-border rounded-none p-5">
        {active === "paste" ? (
          <>
            <div className="mb-4 font-mono text-[0.65rem] text-hawk-muted bg-hawk-green/5 py-[0.6rem] px-[0.8rem] border border-hawk-border flex items-center gap-2">
              <span className="text-hawk-green font-bold">▸ GMAIL INSTRUCTIONS:</span> 
              <span>Open email &gt; Click <strong>⋮ (More)</strong> &gt; <strong>Show original</strong> &gt; <strong>Copy to clipboard</strong></span>
            </div>
            <HeaderInput value={header} onChange={setHeader} />
          </>
        ) : (
          <>
            <div className="mb-4 font-mono text-[0.65rem] text-hawk-muted bg-hawk-green/5 py-[0.6rem] px-[0.8rem] border border-hawk-border flex items-center gap-2">
              <span className="text-hawk-green font-bold">▸ GMAIL INSTRUCTIONS:</span> 
              <span>Open email &gt; Click <strong>⋮ (More)</strong> &gt; <strong>Download message</strong> (.eml)</span>
            </div>
            <FileUpload
              onHeaderExtracted={(h: string) => {
                setHeader(h);
                setActive("paste");
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
