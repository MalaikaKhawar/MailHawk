import { NextRequest, NextResponse } from "next/server";
import { generatePdfReport } from "@/lib/pdfGenerator";
import type { AnalysisResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json() as AnalysisResult;
    
    const pdfBuffer = await generatePdfReport(data);

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    return new Response(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="mailhawk-report-${ts}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch (err) {
    console.error("[/api/report]", err);
    return NextResponse.json({ error: "PDF generation failed." }, { status: 500 });
  }
}
