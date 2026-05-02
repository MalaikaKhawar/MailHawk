import { NextRequest, NextResponse } from "next/server";
import type { AnalysisResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { result, rawHeader } = (await req.json()) as {
      result: AnalysisResult;
      rawHeader: string;
    };

    if (!result || !result.parsedHeader) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const payload = {
      analyzedAt: result.analyzedAt,
      verdict: result.aiVerdict?.verdict || result.spoofDetection.verdict,
      trustScore: result.trustScore?.score || 0,
      riskScore: result.spoofDetection.riskScore || 0,
      phishingScore:
        result.aiVerdict?.phishingProbability ??
        result.spoofDetection.phishingProbability ??
        0,
      checksPassed: `${result.spoofDetection.checks.filter((c) => c.passed).length}/${result.spoofDetection.checks.length}`,
      aiConfidence: result.aiVerdict?.confidence || 0,
      metadata: {
        from: result.parsedHeader.from.email || "",
        to: result.parsedHeader.to || "",
        subject: result.parsedHeader.subject || "",
        date: result.parsedHeader.date || "",
        messageId: result.parsedHeader.messageId || "",
        returnPath: result.parsedHeader.returnPath || "",
        replyTo: result.parsedHeader.replyTo || "",
      },
      rawEmailContent: rawHeader,
      fullAnalysisData: result,
    };

    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        const fbRes = await fetch(
          "https://chat-app-1db4d-default-rtdb.firebaseio.com/scans.json",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!fbRes.ok) {
          console.error("[/api/store] Firebase refused:", await fbRes.text());
        }
        success = true;
      } catch (err: any) {
        retries--;
        if (retries === 0) {
          console.error("[/api/store] Firebase completely failed after retries. Cause:", err.message);
          throw err;
        } else {

          await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 1000));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/store] Error storing to Firebase:", error);
    return NextResponse.json({ error: "Failed to store" }, { status: 500 });
  }
}
