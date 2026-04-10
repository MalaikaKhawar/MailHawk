"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, AnalysisResult } from "@/types";
import { Send, Bot, User, Loader2, MessageSquare, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props { data: AnalysisResult }

const SUGGESTED_QUESTIONS = [
  "Is this email safe to interact with?",
  "What does SPF softfail mean?",
  "Explain the relay hops in simple terms.",
  "Should I click any links in this email?",
  "How can the sender domain be different from Return-Path?",
];

export default function AIChat({ data }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Build context string for AI
  const context = JSON.stringify({
    from: data.parsedHeader.from,
    subject: data.parsedHeader.subject,
    verdict: data.aiVerdict?.verdict,
    riskScore: data.spoofDetection.riskScore,
    spf: data.parsedHeader.authResults.spf,
    dkim: data.parsedHeader.authResults.dkim,
    dmarc: data.parsedHeader.authResults.dmarc,
    hops: data.parsedHeader.relayHops.length,
    summary: data.aiVerdict?.summary,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    const userMsg = text.trim();
    if (!userMsg || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Assistant placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        const captured = assistantText;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: captured };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't connect to the AI. Please check your API key configuration.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="card-hawk overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-hawk-card-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-none bg-hawk-green/10 border border-hawk-green/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-hawk-green" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-mono font-bold text-hawk-text">
              ASK MAILHAWK AI
            </h2>
            <p className="text-xs font-mono text-hawk-muted">
              Ask follow-up questions about this email
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-hawk-muted">
          {open ? "Collapse ▲" : "Expand ▼"}
        </span>
      </button>

      {open && (
        <>
          {/* Suggested questions */}
          {messages.length === 0 && (
            <div className="px-5 pb-4">
              <p className="text-[10px] font-mono text-hawk-muted uppercase tracking-widest mb-2">Suggested Questions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs font-mono px-3 py-1.5 rounded-none border border-hawk-border text-hawk-muted hover:border-hawk-green/30 hover:text-hawk-green hover:bg-hawk-green/5 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div
              ref={scrollRef}
              className="h-72 overflow-y-auto px-5 py-3 space-y-4 border-t border-[var(--hawk-border)]"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-7 h-7 rounded-none flex-shrink-0 flex items-center justify-center ${
                      msg.role === "user"
                        ? "bg-hawk-green/10 border border-hawk-green/20"
                        : "bg-hawk-green/10 border border-hawk-green/20"
                    }`}
                  >
                    {msg.role === "user"
                      ? <User className="w-3.5 h-3.5 text-hawk-green" />
                      : <Bot className="w-3.5 h-3.5 text-hawk-green" />
                    }
                  </div>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-none text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-hawk-green/5 border border-hawk-green/10 text-hawk-text font-mono"
                        : "bg-[var(--hawk-card)] border border-hawk-border text-[#cccccc]"
                    }`}
                  >
                    {msg.content ? (
                      msg.role === "assistant" ? (
                        <div className="flex flex-col gap-2 [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:font-bold [&_strong]:text-hawk-text">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )
                    ) : (
                      <span className="flex items-center gap-1 text-hawk-muted">
                        <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-[var(--hawk-border)] flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this email…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none input-hawk px-3 py-2.5 text-sm rounded-none"
              style={{ minHeight: 40, maxHeight: 120, fontFamily: "var(--font-dm-sans)" }}
            />
            <div className="flex gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="w-10 h-10 rounded-none border border-hawk-border flex items-center justify-center text-hawk-muted hover:text-hawk-muted hover:border-hawk-border-hover transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-none bg-hawk-green hover:bg-hawk-green/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-black" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
