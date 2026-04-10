import type { LinkResult } from "@/types";

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
  // Check for unicode characters that look like ASCII
  return /[^\x00-\x7F]/.test(domain);
}

function analyzeLink(url: string, fromDomain: string): LinkResult {
  const domain = extractDomain(url);
  if (!domain) {
    return {
      url, domain: "",
      riskLevel: "SUSPICIOUS",
      flags: ["Unable to parse URL"],
      isShortener: false, isIpBased: false,
      isSuspiciousTld: false, mismatchesFromDomain: false, isHomograph: false,
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

  if (isShortener) { flags.push("URL shortener — destination hidden"); riskPoints += 20; }
  if (isIpBased) { flags.push("IP-based URL — no domain name"); riskPoints += 35; }
  if (isSuspiciousTld) { flags.push(`Suspicious TLD: ${tld}`); riskPoints += 20; }
  if (mismatchesFromDomain) { flags.push("Domain mismatch with sender"); riskPoints += 25; }
  if (excessiveSubs) { flags.push("Excessive subdomains"); riskPoints += 10; }
  if (isHomograph) { flags.push("Homograph/unicode attack detected"); riskPoints += 40; }
  if (isLookalike) { flags.push("Lookalike brand domain detected"); riskPoints += 30; }

  let riskLevel: LinkResult["riskLevel"] = "SAFE";
  if (riskPoints >= 35) riskLevel = "DANGEROUS";
  else if (riskPoints >= 15) riskLevel = "SUSPICIOUS";

  return {
    url, domain, riskLevel, flags,
    isShortener, isIpBased, isSuspiciousTld,
    mismatchesFromDomain, isHomograph,
  };
}

export function analyzeLinks(rawHeader: string, fromDomain: string): LinkResult[] {
  const matches = rawHeader.match(URL_REGEX) || [];
  // Deduplicate
  const unique = [...new Set(matches)];
  return unique.map((url) => analyzeLink(url, fromDomain));
}
