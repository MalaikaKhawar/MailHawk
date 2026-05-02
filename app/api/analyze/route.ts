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

    const parsedHeader = parseHeader(rawHeader.trim());

    const spoofDetection = detectSpoof(parsedHeader);

    const rawLinks = analyzeLinks(rawHeader, parsedHeader.fromDomain);
    const linkUrls = rawLinks.map((l) => l.url);

    const [dnsResults, ipResults, aiLinkVerdicts, aiVerdict] = await Promise.all([

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

      checkIPs(parsedHeader.relayHops).catch(() => []),

      analyzeLinksWithAI(linkUrls, parsedHeader.fromDomain).catch(() => ({})),

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

    const linkResults = mergeAILinkResults(rawLinks, aiLinkVerdicts);

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
