import { NextRequest, NextResponse } from "next/server";
import { parseHeader } from "@/lib/headerParser";
import { detectSpoof } from "@/lib/spoofDetector";
import { checkDns } from "@/lib/dnsChecker";
import { checkIPs } from "@/lib/ipChecker";
import { analyzeLinks, mergeAILinkResults, computeTrustScore } from "@/lib/linkAnalyzer";
import { runAIAnalysis, analyzeLinksWithAI } from "@/lib/aiAnalyzer";
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

    // 2. Spoof detection (sync)
    const spoofDetection = detectSpoof(parsedHeader);

    // 3. Heuristic link pre-scan (sync, instant)
    const rawLinks = analyzeLinks(rawHeader, parsedHeader.fromDomain);
    const linkUrls = rawLinks.map((l) => l.url);

    // 4. DNS + IPs + AI link analysis + AI forensic verdict — all parallel
    const [dnsResults, ipResults, aiLinkVerdicts, aiVerdict] = await Promise.all([

      // DNS — Layer 1 from header auth results, Layer 2 from Node dns module
      checkDns(
        parsedHeader.fromDomain,
        parsedHeader.headerAuthResults.dkimSelector
          || parsedHeader.authResults.dkimSelector
          || parsedHeader.dkimSignature.selector,
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

      // IP reputation
      checkIPs(parsedHeader.relayHops).catch(() => []),

      // AI link analysis — one batch call for all URLs
      analyzeLinksWithAI(linkUrls, parsedHeader.fromDomain).catch(() => ({})),

      // Full AI forensic verdict — fires in parallel, uses heuristic link results
      runAIAnalysis({
        parsedHeader,
        spoofDetection,
        dnsResults: {
          spf:   { record: null, mechanisms: [], result: parsedHeader.headerAuthResults.spf as "pass"|"fail"|"softfail"|"neutral"|"none", trustability: "NONE" as const, explanation: "" },
          dkim:  { record: null, keyExists: false, isRevoked: false, result: "not_found" as const, explanation: "" },
          dmarc: { record: null, policy: null, alignment: { dkim: "relaxed", spf: "relaxed" }, reportingConfigured: false, percentage: 100, trustability: "NONE" as const, trustabilityScore: 0, explanation: "" },
          mx:    { records: [], hasMx: false },
        },
        ipResults: [],
        linkResults: rawLinks,
      }).catch(() => ({
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
      })),
    ]);

    // 5. Merge per-URL AI verdicts into final LinkResult[]
    const linkResults = mergeAILinkResults(rawLinks, aiLinkVerdicts);

    // 6. Compute composite trust score (0–100%)
    const trustScore = computeTrustScore(dnsResults, ipResults, linkResults, spoofDetection, aiVerdict);

    const result: AnalysisResult = {
      parsedHeader,
      spoofDetection,
      dnsResults,
      ipResults,
      linkResults,
      aiVerdict,
      trustScore,
      analyzedAt: new Date().toISOString(),
    };

    // Fire and forget storage quietly in the background
    // Normal process returns instantly and doesn't wait for this to finish
    fetch(new URL("/api/store", req.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result, rawHeader }),
    }).catch((err) => console.error("[Async Storage Failed] ", err));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/analyze]", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
