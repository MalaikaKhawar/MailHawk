import { NextRequest, NextResponse } from "next/server";
import { checkDns } from "@/lib/dnsChecker";

export async function POST(req: NextRequest) {
  try {
    const { domain, selector } = await req.json() as { domain: string; selector?: string };
    if (!domain) {
      return NextResponse.json({ error: "domain required." }, { status: 400 });
    }
    const results = await checkDns(domain, selector || "");
    return NextResponse.json(results);
  } catch (err) {
    console.error("[/api/dns]", err);
    return NextResponse.json({ error: "DNS lookup failed." }, { status: 500 });
  }
}
