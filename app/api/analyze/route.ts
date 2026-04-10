import { NextRequest, NextResponse } from "next/server";
import { parseHeader } from "@/lib/headerParser";
import { detectSpoof } from "@/lib/spoofDetector";
import { checkDns } from "@/lib/dnsChecker";
import { checkIPs } from "@/lib/ipChecker";
import { analyzeLinks } from "@/lib/linkAnalyzer";
import { runAIAnalysis } from "@/lib/aiAnalyzer";
import type { AnalysisResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawHeader } = body as { rawHeader: string };

    if (!rawHeader || typeof rawHeader !== "string" || rawHeader.trim().length < 10) {
      return NextResponse.json({ error: "Invalid or empty header provided." }, { status: 400 });
    }

    // 1. Parse
    const parsedHeader = parseHeader(rawHeader.trim());

    // 2. Spoof detection
    const spoofDetection = detectSpoof(parsedHeader);

    // 3. DNS + IPs + Links (parallel — all server-side)
    const [dnsResults, ipResults, linkResults] = await Promise.all([
      checkDns(
        parsedHeader.fromDomain,
        // Use the selector from the rich multi-header parser first, then DKIM-Signature fallback
        parsedHeader.headerAuthResults.dkimSelector
          || parsedHeader.authResults.dkimSelector
          || parsedHeader.dkimSignature.selector,
        // Pass parsed Authentication-Results as the primary truth
        {
          spf:   parsedHeader.headerAuthResults.spf,
          dkim:  parsedHeader.headerAuthResults.dkim,
          dmarc: parsedHeader.headerAuthResults.dmarc,
        }
      ).catch(() => ({
        spf:   { record: null, mechanisms: [], result: "none" as const, trustability: "NONE" as const, explanation: "DNS lookup failed." },
        dkim:  { record: null, keyExists: false, isRevoked: false, result: "not_found" as const, explanation: "DNS lookup failed." },
        dmarc: { record: null, policy: null, alignment: { dkim: "relaxed", spf: "relaxed" }, reportingConfigured: false, percentage: 100, trustability: "NONE" as const, trustabilityScore: 0, explanation: "DNS lookup failed." },
        mx:    { records: [], hasMx: false },
      })),
      checkIPs(parsedHeader.relayHops).catch(() => []),
      Promise.resolve(analyzeLinks(rawHeader, parsedHeader.fromDomain)),
    ]);

    // 4. AI (last, uses everything above)
    const partialData = { parsedHeader, spoofDetection, dnsResults, ipResults, linkResults };
    const aiVerdict = await runAIAnalysis(partialData).catch(() => ({
      verdict: spoofDetection.verdict,
      confidence: 60,
      phishingProbability: spoofDetection.phishingProbability,
      oneLinerVerdict: "AI analysis unavailable.",
      summary: "Manual review recommended.",
      redFlags: [],
      trustIndicators: [],
      recommendations: [],
      technicalBreakdown: {
        spfAnalysis: "", dkimAnalysis: "", dmarcAnalysis: "",
        routingAnalysis: "", ipAnalysis: "",
      },
    }));

    const result: AnalysisResult = {
      ...partialData,
      aiVerdict,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/analyze]", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
