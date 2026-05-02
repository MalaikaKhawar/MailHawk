import { NextRequest, NextResponse } from "next/server";
import { checkIPs } from "@/lib/ipChecker";

export async function POST(req: NextRequest) {
  try {
    const { ips } = await req.json() as { ips: string[] };
    if (!ips || !Array.isArray(ips)) {
      return NextResponse.json({ error: "ips array required." }, { status: 400 });
    }
    const hops = ips.map((ip, i) => ({
      hopNumber: i + 1, from: "", by: "", ip,
      protocol: "SMTP", timestamp: new Date().toISOString(),
      delaySeconds: 0, isPrivateIp: false,
    }));
    const results = await checkIPs(hops);
    return NextResponse.json(results);
  } catch (err) {
    console.error("[/api/ip]", err);
    return NextResponse.json({ error: "IP lookup failed." }, { status: 500 });
  }
}
