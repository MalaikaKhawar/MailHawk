import type { LinkResult, TrustScore, DnsResults, IPResult, SpoofDetectionResult, AIVerdict } from "@/types";
import type { AILinkVerdict } from "@/lib/aiAnalyzer";

const URL_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "buff.ly",
  "short.link", "rb.gy", "is.gd", "v.gd", "cutt.ly", "rebrand.ly",
  "tiny.cc", "shrt.co", "snip.ly",
]);

const SUSPICIOUS_TLDS = new Set([
  ".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".ws",
  ".top", ".club", ".online", ".site", ".link", ".click",
]);

const KNOWN_BRANDS_PATTERNS: RegExp[] = [
  /paypa[l1]\.com/i, /app[l1]e\.com/i, /g[o0]{2}g[l1]e\.com/i,
  /amaz[o0]n\.com/i, /micr[o0]s[o0]ft\.com/i, /netf[l1][i!]x\.com/i,
];

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isIpBasedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  } catch {
    return false;
  }
}

function hasExcessiveSubdomains(domain: string): boolean {
  return domain.split(".").length > 4;
}

function isHomographAttack(domain: string): boolean {
  return /[^\x00-\x7F]/.test(domain);
}

function analyzeLink(
  url: string,
  fromDomain: string,
  aiResult?: AILinkVerdict
): LinkResult {
  const domain = extractDomain(url);
  if (!domain) {
    return {
      url, domain: "",
      riskLevel: "SUSPICIOUS",
      flags: ["Unable to parse URL"],
      isShortener: false, isIpBased: false,
      isSuspiciousTld: false, mismatchesFromDomain: false, isHomograph: false,
      aiPhishingScore: aiResult?.score ?? 40,
      aiReason: aiResult?.reason ?? "URL could not be parsed.",
      aiLabel: aiResult?.label ?? "SUSPICIOUS",
    };
  }

  const flags: string[] = [];
  let riskPoints = 0;

  const isShortener = URL_SHORTENERS.has(domain);
  const isIpBased = isIpBasedUrl(url);
  const tld = "." + domain.split(".").slice(-1)[0];
  const isSuspiciousTld = SUSPICIOUS_TLDS.has(tld);
  const mismatchesFromDomain = fromDomain
    ? !domain.endsWith(fromDomain) && !fromDomain.endsWith(domain)
    : false;
  const excessiveSubs = hasExcessiveSubdomains(domain);
  const isHomograph = isHomographAttack(domain);
  const isLookalike = KNOWN_BRANDS_PATTERNS.some((p) => p.test(domain));

  if (isShortener)          { flags.push("URL shortener — destination hidden");    riskPoints += 20; }
  if (isIpBased)            { flags.push("IP-based URL — no domain name");         riskPoints += 35; }
  if (isSuspiciousTld)      { flags.push(`Suspicious TLD: ${tld}`);                riskPoints += 20; }
  if (mismatchesFromDomain) { flags.push("Domain mismatch with sender");           riskPoints += 25; }
  if (excessiveSubs)        { flags.push("Excessive subdomains");                  riskPoints += 10; }
  if (isHomograph)          { flags.push("Homograph/unicode attack detected");     riskPoints += 40; }
  if (isLookalike)          { flags.push("Lookalike brand domain detected");       riskPoints += 30; }

  // Blend AI score (40%) with heuristic (60%)
  const aiScore = aiResult?.score ?? 30;
  const blended = riskPoints * 0.6 + aiScore * 0.4;

  let riskLevel: LinkResult["riskLevel"] = "SAFE";
  if (blended >= 35) riskLevel = "DANGEROUS";
  else if (blended >= 15) riskLevel = "SUSPICIOUS";

  // AI says PHISHING → at least SUSPICIOUS
  if (aiResult?.label === "PHISHING" && riskLevel === "SAFE") riskLevel = "SUSPICIOUS";

  return {
    url, domain, riskLevel, flags,
    isShortener, isIpBased, isSuspiciousTld, mismatchesFromDomain, isHomograph,
    aiPhishingScore: aiScore,
    aiReason: aiResult?.reason ?? "No AI assessment available.",
    aiLabel: aiResult?.label ?? "SUSPICIOUS",
  };
}

/** Pure heuristic pass — fast, no AI */
export function analyzeLinks(rawHeader: string, fromDomain: string): LinkResult[] {
  const matches = rawHeader.match(URL_REGEX) || [];
  const unique = [...new Set(matches)];
  return unique.map((url) => analyzeLink(url, fromDomain));
}

/** Merge AI verdicts into already-analyzed links */
export function mergeAILinkResults(
  links: LinkResult[],
  aiVerdicts: Record<string, AILinkVerdict>
): LinkResult[] {
  return links.map((link) => {
    const ai = aiVerdicts[link.url];
    if (!ai) return link;
    return analyzeLink(link.url, "", ai);
  });
}

// ─── Trust Score Calculator ───────────────────────────────────────────────────

export function computeTrustScore(
  dnsResults: DnsResults,
  ipResults: IPResult[],
  linkResults: LinkResult[],
  spoofDetection: SpoofDetectionResult,
  aiVerdict: AIVerdict
): TrustScore {
  const factors: TrustScore["factors"] = [];

  // Factor 1: SPF (weight 20)
  const spfScore =
    dnsResults.spf.result === "pass"     ? 100 :
    dnsResults.spf.result === "neutral"  ? 60  :
    dnsResults.spf.result === "softfail" ? 35  :
    dnsResults.spf.result === "fail"     ? 0   : 30;
  factors.push({ name: "SPF", score: spfScore, weight: 20 });

  // Factor 2: DKIM (weight 20)
  const dkimScore =
    dnsResults.dkim.result === "valid"   ? 100 :
    dnsResults.dkim.result === "revoked" ? 0   : 40;
  factors.push({ name: "DKIM", score: dkimScore, weight: 20 });

  // Factor 3: DMARC (weight 15)
  factors.push({ name: "DMARC", score: dnsResults.dmarc.trustabilityScore, weight: 15 });

  // Factor 4: IP Reputation (weight 20)
  let ipScore = 100;
  if (ipResults.length > 0) {
    const avgAbuse  = ipResults.reduce((s, ip) => s + ip.abuseScore, 0) / ipResults.length;
    const hasMalicious = ipResults.some((ip) => ip.riskLevel === "MALICIOUS");
    const hasTor    = ipResults.some((ip) => ip.isTor);
    ipScore = Math.max(0, 100 - avgAbuse - (hasMalicious ? 30 : 0) - (hasTor ? 20 : 0));
  }
  factors.push({ name: "IP Reputation", score: Math.round(ipScore), weight: 20 });

  // Factor 5: Link Safety (weight 15)
  let linkScore = 100;
  if (linkResults.length > 0) {
    const scores = linkResults.map((l) => {
      const h = l.riskLevel === "SAFE" ? 100 : l.riskLevel === "SUSPICIOUS" ? 50 : 0;
      return h * 0.6 + (100 - l.aiPhishingScore) * 0.4;
    });
    linkScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  }
  factors.push({ name: "Link Safety", score: Math.round(linkScore), weight: 15 });

  // Factor 6: Spoof Checks (weight 10)
  factors.push({ name: "Spoof Checks", score: Math.max(0, 100 - spoofDetection.riskScore), weight: 10 });

  // Weighted average
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const raw = factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight;

  // Small downward nudge from AI phishing probability
  const aiPenalty = (aiVerdict.phishingProbability ?? 0) * 0.1;
  const score = Math.round(Math.max(0, Math.min(100, raw - aiPenalty)));

  const tier: TrustScore["tier"] =
    score >= 70 ? "trusted" : score >= 40 ? "uncertain" : "untrusted";

  const label =
    score >= 80 ? `${score}% Trusted`   :
    score >= 60 ? `${score}% Uncertain` :
    score >= 40 ? `${score}% Risky`     : `${score}% Untrusted`;

  return { score, label, tier, factors };
}
