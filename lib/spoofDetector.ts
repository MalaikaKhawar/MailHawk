import type { ParsedHeader, SpoofDetectionResult, SpoofCheck } from "@/types";
import { getRootDomain } from "./utils";
export const KNOWN_BRANDS: Record<string, string[]> = {
  paypal: ["paypal.com"],
  apple: ["apple.com", "icloud.com"],
  google: ["google.com", "gmail.com", "googlemail.com"],
  microsoft: ["microsoft.com", "outlook.com", "hotmail.com", "live.com"],
  amazon: ["amazon.com", "amazon.co.uk", "amazon.de"],
  netflix: ["netflix.com"],
  facebook: ["facebook.com", "fb.com", "meta.com"],
  instagram: ["instagram.com"],
  twitter: ["twitter.com", "x.com"],
  ebay: ["ebay.com"],
  dhl: ["dhl.com"],
  fedex: ["fedex.com"],
  ups: ["ups.com"],
  chase: ["chase.com"],
  wellsfargo: ["wellsfargo.com"],
  bankofamerica: ["bankofamerica.com"],
  irs: ["irs.gov"],
  linkedin: ["linkedin.com"],
  dropbox: ["dropbox.com"],
  stripe: ["stripe.com"],
  github: ["github.com"],
  anthropic: ["anthropic.com"],
  openai: ["openai.com", "chatgpt.com"],
};
const LOOKALIKE_PATTERNS: RegExp[] = [
  /paypa[l1]\.com/i,
  /app[l1]e\.com/i,
  /g[o0][o0]g[l1]e\.com/i,
  /amaz[o0]n\.com/i,
  /micr[o0]s[o0]ft\.com/i,
  /netf[l1][i!]x\.com/i,
  /[a-z]+-[a-z]+-[a-z]+\.(com|net|org|info)/i,
];

const SUSPICIOUS_TLDS = [".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".ws", ".top", ".club", ".online", ".site"];

function extractDomain(email: string): string {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : "";
}

function domainsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  if (lowerA === lowerB) return true;
  
  return getRootDomain(lowerA) === getRootDomain(lowerB);
}

function isLookalikeDomain(domain: string): boolean {
  const rootDomain = getRootDomain(domain);
  const allGenuineDomains = Object.values(KNOWN_BRANDS).flat();
  if (allGenuineDomains.includes(rootDomain)) {
    return false;
  }
  
  return LOOKALIKE_PATTERNS.some((p) => p.test(domain));
}

function isSuspiciousTld(domain: string): boolean {
  return SUSPICIOUS_TLDS.some((tld) => domain.endsWith(tld));
}

function getBrandForName(displayName: string): string | null {
  const name = displayName.toLowerCase().replace(/[^a-z]/g, "");
  for (const brand of Object.keys(KNOWN_BRANDS)) {
    if (name.includes(brand)) return brand;
  }
  return null;
}

function isLegitDomainForBrand(domain: string, brand: string): boolean {
  const legit = KNOWN_BRANDS[brand] || [];
  return legit.some((d) => domain.endsWith(d));
}

export function detectSpoof(parsed: ParsedHeader): SpoofDetectionResult {
  const checks: SpoofCheck[] = [];
  let riskScore = 0;

  const fromDomain = parsed.from.domain;
  const returnPathDomain = extractDomain(parsed.returnPath);
  const replyToDomain = extractDomain(parsed.replyTo);
  const messageIdDomain = parsed.messageId
    ? (parsed.messageId.match(/@([^\s>]+)/) || [])[1] || ""
    : "";
  const check1Passed =
    !returnPathDomain || domainsMatch(fromDomain, returnPathDomain);
  const check1Points = check1Passed ? 0 : 35;
  riskScore += check1Points;
  checks.push({
    name: "From/Return-Path Domain Match",
    passed: check1Passed,
    severity: "HIGH",
    detail: check1Passed
      ? `From domain (${fromDomain}) matches Return-Path domain.`
      : `From domain (${fromDomain}) does NOT match Return-Path (${returnPathDomain}). Major spoofing indicator.`,
    pointsAdded: check1Points,
  });
  const check2Passed = !replyToDomain || domainsMatch(fromDomain, replyToDomain);
  const check2Points = check2Passed ? 0 : 25;
  riskScore += check2Points;
  checks.push({
    name: "From/Reply-To Domain Match",
    passed: check2Passed,
    severity: "HIGH",
    detail: check2Passed
      ? `Reply-To domain matches From domain.`
      : `Reply-To domain (${replyToDomain}) differs from From domain (${fromDomain}). Replies will go elsewhere.`,
    pointsAdded: check2Points,
  });
  const check3Passed = !messageIdDomain || domainsMatch(fromDomain, messageIdDomain);
  const check3Points = check3Passed ? 0 : 15;
  riskScore += check3Points;
  checks.push({
    name: "Message-ID Domain Match",
    passed: check3Passed,
    severity: "MEDIUM",
    detail: check3Passed
      ? `Message-ID domain matches From domain.`
      : `Message-ID domain (${messageIdDomain}) differs from From domain (${fromDomain}).`,
    pointsAdded: check3Points,
  });
  const brand = getBrandForName(parsed.from.name);
  const check4Passed = !brand || isLegitDomainForBrand(fromDomain, brand);
  const check4Points = check4Passed ? 0 : 40;
  riskScore += check4Points;
  checks.push({
    name: "Display Name Brand Impersonation",
    passed: check4Passed,
    severity: "HIGH",
    detail: check4Passed
      ? brand
        ? `Display name "${parsed.from.name}" uses legitimate ${brand} domain.`
        : "No known brand detected in display name."
      : `Display name "${parsed.from.name}" impersonates ${brand} but email domain is "${fromDomain}".`,
    pointsAdded: check4Points,
  });
  const spf = parsed.authResults.spf;
  let spfPoints = 0;
  if (spf === "fail") spfPoints = 30;
  else if (spf === "softfail") spfPoints = 15;
  else if (spf === "none") spfPoints = 10;
  riskScore += spfPoints;
  checks.push({
    name: "SPF Authentication",
    passed: spf === "pass",
    severity: spf === "fail" ? "HIGH" : "MEDIUM",
    detail:
      spf === "pass"
        ? "SPF check passed - sending server is authorized."
        : spf === "fail"
        ? "SPF hard fail - sending server is NOT authorized to send for this domain."
        : spf === "softfail"
        ? "SPF soft fail - sending server is not in the authorized list."
        : "No SPF record found for this domain.",
    pointsAdded: spfPoints,
  });
  const dkim = parsed.authResults.dkim;
  let dkimPoints = 0;
  if (dkim === "fail") dkimPoints = 25;
  else if (dkim === "none") dkimPoints = 10;
  riskScore += dkimPoints;
  checks.push({
    name: "DKIM Signature",
    passed: dkim === "pass",
    severity: dkim === "fail" ? "HIGH" : "MEDIUM",
    detail:
      dkim === "pass"
        ? "DKIM signature verified - email content was not tampered with."
        : dkim === "fail"
        ? "DKIM signature failed - email may have been modified in transit."
        : "No DKIM signature present.",
    pointsAdded: dkimPoints,
  });
  const dmarc = parsed.authResults.dmarc;
  let dmarcPoints = 0;
  if (dmarc === "fail") dmarcPoints = 20;
  else if (dmarc === "none") dmarcPoints = 10;
  riskScore += dmarcPoints;
  checks.push({
    name: "DMARC Policy",
    passed: dmarc === "pass",
    severity: dmarc === "fail" ? "HIGH" : "LOW",
    detail:
      dmarc === "pass"
        ? "DMARC policy passed - email is aligned with domain policy."
        : dmarc === "fail"
        ? "DMARC policy failed - email does not comply with domain's DMARC policy."
        : "DMARC record not found or not checked.",
    pointsAdded: dmarcPoints,
  });
  const hopCount = parsed.relayHops.length;
  const check8Points = hopCount > 7 ? 10 : 0;
  riskScore += check8Points;
  checks.push({
    name: "Relay Hop Count",
    passed: hopCount <= 7,
    severity: "LOW",
    detail:
      hopCount <= 7
        ? `${hopCount} relay hops - within normal range.`
        : `${hopCount} relay hops - unusually high, may indicate obfuscation.`,
    pointsAdded: check8Points,
  });
  const ONE_HOUR = 3600;
  let delayPoints = 0;
  const longDelayHops: number[] = [];
  for (const hop of parsed.relayHops) {
    if (hop.delaySeconds > ONE_HOUR) {
      delayPoints += 10;
      longDelayHops.push(hop.hopNumber);
    }
  }
  riskScore += delayPoints;
  checks.push({
    name: "Long Hop Delays",
    passed: longDelayHops.length === 0,
    severity: "MEDIUM",
    detail:
      longDelayHops.length === 0
        ? "No abnormal delays between relay hops."
        : `Hops ${longDelayHops.join(", ")} had delays over 1 hour - suspicious.`,
    pointsAdded: delayPoints,
  });
  let privateInPublicPoints = 0;
  const publicHops = parsed.relayHops.filter((h) => h.ip && !h.isPrivateIp);
  if (publicHops.length >= 2) {
    const privateInBetween = parsed.relayHops.some((h, i) => {
      if (!h.ip || !h.isPrivateIp) return false;
      const before = parsed.relayHops.some(
        (x, j) => j < i && x.ip && !x.isPrivateIp
      );
      const after = parsed.relayHops.some(
        (x, j) => j > i && x.ip && !x.isPrivateIp
      );
      return before && after;
    });
    if (privateInBetween) {
      privateInPublicPoints = 20;
      riskScore += privateInPublicPoints;
    }
  }
  checks.push({
    name: "Private IP in Public Relay Chain",
    passed: privateInPublicPoints === 0,
    severity: "MEDIUM",
    detail:
      privateInPublicPoints === 0
        ? "No private IP addresses found between public relay hops."
        : "A private IP address appears between public relay hops - unusual routing pattern.",
    pointsAdded: privateInPublicPoints,
  });
  const spamScorePoints = parsed.xSpamScore > 5 ? 15 : 0;
  riskScore += spamScorePoints;
  checks.push({
    name: "Spam Score",
    passed: parsed.xSpamScore <= 5,
    severity: "MEDIUM",
    detail:
      parsed.xSpamScore <= 5
        ? `X-Spam-Score is ${parsed.xSpamScore} - within acceptable range.`
        : `X-Spam-Score is ${parsed.xSpamScore} - above threshold of 5.`,
    pointsAdded: spamScorePoints,
  });
  let missingPoints = 0;
  if (!parsed.date) {
    missingPoints += 10;
    checks.push({
      name: "Missing Date Header",
      passed: false,
      severity: "MEDIUM",
      detail: "Date header is absent - required by RFC 2822.",
      pointsAdded: 10,
    });
  }
  if (!parsed.messageId) {
    missingPoints += 10;
    checks.push({
      name: "Missing Message-ID Header",
      passed: false,
      severity: "MEDIUM",
      detail: "Message-ID header is absent - required for tracking and deduplication.",
      pointsAdded: 10,
    });
  }
  riskScore += missingPoints;
  const lookalike = isLookalikeDomain(fromDomain);
  const lookalikeTld = isSuspiciousTld(fromDomain);
  const lookalikePoints = lookalike ? 25 : lookalikeTld ? 10 : 0;
  riskScore += lookalikePoints;
  checks.push({
    name: "Lookalike/Suspicious Domain",
    passed: !lookalike && !lookalikeTld,
    severity: "HIGH",
    detail:
      lookalike
        ? `From domain "${fromDomain}" looks like a known brand domain (typosquatting).`
        : lookalikeTld
        ? `From domain "${fromDomain}" uses a suspicious TLD.`
        : `From domain "${fromDomain}" appears legitimate.`,
    pointsAdded: lookalikePoints,
  });
  riskScore = Math.min(100, riskScore);
  let phishing = 0;
  if (brand && !isLegitDomainForBrand(fromDomain, brand)) phishing += 40;
  if (lookalike) phishing += 30;
  if (lookalikeTld) phishing += 15;
  if (!check2Passed) phishing += 20;
  if (spf === "fail" || spf === "softfail") phishing += 15;
  phishing = Math.min(100, phishing);
  let verdict: SpoofDetectionResult["verdict"] = "SAFE";
  if (riskScore >= 61) verdict = "SPOOFED";
  else if (riskScore >= 31) verdict = "SUSPICIOUS";

  return { riskScore, phishingProbability: phishing, verdict, checks };
}
