import type { IPResult, RelayHop } from "@/types";

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  return (
    /^10\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^127\./.test(ip) ||
    ip === "::1"
  );
}

function classifyRisk(score: number): IPResult["riskLevel"] {
  if (score >= 75) return "MALICIOUS";
  if (score >= 25) return "SUSPICIOUS";
  return "CLEAN";
}

async function getGeoData(ip: string): Promise<Partial<IPResult>> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon,isp,org,as,proxy,hosting,mobile`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return {};
    const d = await res.json();
    if (d.status !== "success") return {};
    return {
      country: d.country || "Unknown",
      countryCode: d.countryCode || "",
      city: d.city || "Unknown",
      lat: d.lat || 0,
      lon: d.lon || 0,
      isp: d.isp || d.org || "",
      org: d.org || "",
      isProxy: d.proxy || false,
      isHosting: d.hosting || false,
      isMobile: d.mobile || false,
    };
  } catch {
    return {};
  }
}

async function getAbuseData(ip: string): Promise<Partial<IPResult>> {
  const key = process.env.ABUSEIPDB_API_KEY;
  if (!key) return { abuseScore: 0, totalReports: 0, isTor: false, usageType: "" };
  try {
    const res = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`,
      {
        headers: { Key: key, Accept: "application/json" },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return { abuseScore: 0, totalReports: 0, isTor: false };
    const { data } = await res.json();
    return {
      abuseScore: data.abuseConfidenceScore || 0,
      totalReports: data.totalReports || 0,
      lastReported: data.lastReportedAt || null,
      isTor: data.isTor || false,
      usageType: data.usageType || "",
    };
  } catch {
    return { abuseScore: 0, totalReports: 0, isTor: false };
  }
}

export async function checkIPs(hops: RelayHop[]): Promise<IPResult[]> {
  const seen = new Set<string>();
  const publicHops = hops.filter((h) => h.ip && !isPrivateIp(h.ip));

  const results = await Promise.all(
    publicHops.map(async (hop) => {
      if (seen.has(hop.ip)) return null;
      seen.add(hop.ip);

      const [geo, abuse] = await Promise.all([
        getGeoData(hop.ip),
        getAbuseData(hop.ip),
      ]);

      const abuseScore = (abuse.abuseScore as number) || 0;

      return {
        ip: hop.ip,
        hopNumber: hop.hopNumber,
        country: geo.country || "Unknown",
        countryCode: geo.countryCode || "",
        city: geo.city || "Unknown",
        lat: geo.lat || 0,
        lon: geo.lon || 0,
        isp: geo.isp || "",
        org: geo.org || "",
        isProxy: geo.isProxy || false,
        isHosting: geo.isHosting || false,
        isMobile: geo.isMobile || false,
        isTor: abuse.isTor || false,
        abuseScore,
        totalReports: (abuse.totalReports as number) || 0,
        lastReported: (abuse.lastReported as string | null) || null,
        riskLevel: classifyRisk(abuseScore),
        usageType: (abuse.usageType as string) || "",
      } satisfies IPResult;
    })
  );

  return results.filter(Boolean) as IPResult[];
}
