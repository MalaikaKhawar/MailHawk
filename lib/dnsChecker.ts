

import dns from "dns/promises";
import type { DnsResults } from "@/types";

/** Resolve TXT records using the Node.js built-in DNS resolver.
 *  Returns flat strings — inner chunk arrays are joined per RFC 7208. */
async function resolveTxt(name: string): Promise<string[]> {
  try {
    const records = await dns.resolveTxt(name);
    return records.map((chunks) => chunks.join(""));
  } catch {
    return [];
  }
}

async function resolveMx(name: string): Promise<string[]> {
  try {
    const records = await dns.resolveMx(name);
    return records
      .sort((a, b) => a.priority - b.priority)
      .map((r) => `${r.priority} ${r.exchange}`);
  } catch {
    return [];
  }
}

async function checkSpf(
  domain: string,
  headerResult?: string   // value from Authentication-Results header
): Promise<DnsResults["spf"]> {
  try {
    const records = await resolveTxt(domain);
    const spfRecord = records.find((r) => r.startsWith("v=spf1"));

    if (!spfRecord) {
      const result = (headerResult as DnsResults["spf"]["result"]) || "none";
      return {
        record: null,
        mechanisms: [],
        result,
        trustability: result === "pass" ? "MEDIUM" : "NONE",
        explanation: headerResult === "pass"
          ? `SPF passed (confirmed by receiving mail server). No SPF record visible in DNS, but the mail server validated it.`
          : `No SPF record published for ${domain}. Anyone can send email claiming to be from this domain.`,
      };
    }

    const mechanisms = spfRecord.split(/\s+/).slice(1);
    const allMech = mechanisms.find((m) => /all$/.test(m));
    let publishedTrust: DnsResults["spf"]["trustability"] = "LOW";
    if (allMech?.startsWith("-"))      publishedTrust = "HIGH";
    else if (allMech?.startsWith("~")) publishedTrust = "MEDIUM";
    else if (allMech?.startsWith("?")) publishedTrust = "LOW";
    else if (allMech?.startsWith("+")) publishedTrust = "NONE";
    const result: DnsResults["spf"]["result"] =
      (headerResult as DnsResults["spf"]["result"]) || "none";
    const trustability: DnsResults["spf"]["trustability"] =
      headerResult === "pass"     ? publishedTrust :
      headerResult === "fail"     ? "NONE" :
      headerResult === "softfail" ? "LOW" :
      publishedTrust;

    return {
      record: spfRecord,
      mechanisms,
      result,
      trustability,
      explanation: buildSpfExplanation(result, domain),
    };
  } catch {
    const result = (headerResult as DnsResults["spf"]["result"]) || "none";
    return {
      record: null,
      mechanisms: [],
      result,
      trustability: result === "pass" ? "MEDIUM" : "NONE",
      explanation: result === "pass"
        ? "SPF passed (confirmed by receiving mail server). DNS lookup unavailable."
        : "SPF DNS lookup failed and no result found in email header.",
    };
  }
}

function buildSpfExplanation(result: string, domain: string): string {
  switch (result) {
    case "pass":
      return `SPF passed. The sending server is authorized to send email for ${domain}.`;
    case "fail":
      return `SPF failed. The sending server is NOT authorized for ${domain}. High spoofing risk.`;
    case "softfail":
      return `SPF soft fail (~all). The server is not in the authorized list, but the domain uses a lenient policy.`;
    case "neutral":
      return `SPF neutral. The domain makes no assertion about whether this sender is authorized.`;
    default:
      return `No SPF result available for ${domain}. Cannot determine sender authorization.`;
  }
}

async function checkDmarc(
  domain: string,
  headerResult?: string   // value from Authentication-Results header
): Promise<DnsResults["dmarc"]> {
  try {
    const records = await resolveTxt(`_dmarc.${domain}`);
    const dmarcRecord = records.find((r) =>
      r.toLowerCase().startsWith("v=dmarc1")
    );

    if (!dmarcRecord) {
      return {
        record: null,
        policy: null,
        alignment: { dkim: "relaxed", spf: "relaxed" },
        reportingConfigured: false,
        percentage: 100,
        trustability: headerResult === "pass" ? "LOW" : "NONE",
        trustabilityScore: headerResult === "pass" ? 20 : 0,
        explanation: headerResult === "pass"
          ? `DMARC passed (confirmed by receiving mail server). No DMARC record visible in DNS.`
          : `No DMARC record found for ${domain}. Email has no DMARC protection.`,
      };
    }

    const get = (key: string): string => {
      const m = dmarcRecord.match(new RegExp(`${key}=([^;\\s]+)`, "i"));
      return m ? m[1] : "";
    };

    const policyRaw = get("p") as "none" | "quarantine" | "reject" | null;
    const adkim = get("adkim") || "r";
    const aspf  = get("aspf")  || "r";
    const pct   = parseInt(get("pct")) || 100;
    const reportingConfigured = !!get("rua");

    let trustability: DnsResults["dmarc"]["trustability"] = "NONE";
    let trustabilityScore = 0;

    if (policyRaw === "reject") {
      trustabilityScore = adkim === "s" && aspf === "s" ? 100 : 85;
      trustability = "HIGH";
    } else if (policyRaw === "quarantine") {
      trustabilityScore = 60;
      trustability = "MEDIUM";
    } else if (policyRaw === "none") {
      trustabilityScore = 20;
      trustability = "LOW";
    }
    const result = headerResult || (policyRaw ? "pass" : "none");

    return {
      record: dmarcRecord,
      policy: policyRaw || null,
      alignment: {
        dkim: adkim === "s" ? "strict" : "relaxed",
        spf:  aspf  === "s" ? "strict" : "relaxed",
      },
      reportingConfigured,
      percentage: pct,
      trustability,
      trustabilityScore,
      explanation: buildDmarcExplanation(result, policyRaw, domain),
    };
  } catch {
    return {
      record: null,
      policy: null,
      alignment: { dkim: "relaxed", spf: "relaxed" },
      reportingConfigured: false,
      percentage: 100,
      trustability: headerResult === "pass" ? "MEDIUM" : "NONE",
      trustabilityScore: headerResult === "pass" ? 50 : 0,
      explanation: headerResult === "pass"
        ? "DMARC passed (confirmed by receiving mail server). DNS lookup unavailable."
        : "DMARC DNS lookup failed and no result found in email header.",
    };
  }
}

function buildDmarcExplanation(
  result: string,
  policy: string | null,
  domain: string
): string {
  if (result === "pass")
    return `DMARC passed. This email is authenticated and aligns with ${domain}'s published policy (p=${policy || "unknown"}).`;
  if (result === "fail" && policy === "reject")
    return `DMARC failed with a reject policy. This email would be rejected by most mail servers.`;
  if (result === "fail")
    return `DMARC failed. The email does not align with ${domain}'s published policy.`;
  return `DMARC result unavailable for ${domain}.`;
}

async function checkDkim(
  domain: string,
  selector: string,
  headerResult?: string   // value from Authentication-Results header
): Promise<DnsResults["dkim"]> {
  if (!selector || !domain) {
    return {
      record: null,
      keyExists: false,
      isRevoked: false,
      result: headerResult === "pass" ? "valid" : "not_found",
      explanation: headerResult === "pass"
        ? "DKIM passed (confirmed by receiving mail server). Selector not available for independent DNS verification."
        : "No DKIM selector found in email headers. Cannot verify public key.",
    };
  }

  const dkimHost = `${selector}._domainkey.${domain}`;

  try {
    const records = await resolveTxt(dkimHost);
    const dkimRecord = records.find(
      (r) => r.includes("v=DKIM1") || r.includes("p=")
    );

    if (!dkimRecord) {
      return {
        record: null,
        keyExists: headerResult === "pass",
        isRevoked: false,
        result: headerResult === "pass" ? "valid" : "not_found",
        explanation: headerResult === "pass"
          ? `DKIM passed per email header. Public key at ${dkimHost} may be served via CDN or is not directly resolvable.`
          : `DKIM public key not found at ${dkimHost}.`,
      };
    }

    const pMatch = dkimRecord.match(/p=([A-Za-z0-9+/=]*)/);
    const isRevoked = !pMatch || pMatch[1] === "";

    return {
      record: dkimRecord,
      keyExists: true,
      isRevoked,
      result: isRevoked ? "revoked" : "valid",
      explanation: isRevoked
        ? `DKIM key has been revoked at ${dkimHost} (empty p= field).`
        : `DKIM public key verified at ${dkimHost}.`,
    };
  } catch {
    return {
      record: null,
      keyExists: headerResult === "pass",
      isRevoked: false,
      result: headerResult === "pass" ? "valid" : "not_found",
      explanation: headerResult === "pass"
        ? "DKIM passed (confirmed by receiving mail server). Direct DNS lookup unavailable."
        : "DKIM DNS lookup failed and no result found in email header.",
    };
  }
}

async function checkMx(domain: string): Promise<DnsResults["mx"]> {
  const records = await resolveMx(domain);
  return { records, hasMx: records.length > 0 };
}

/**
 * Check DNS records for a domain and combine with header auth results.
 *
 * @param domain         - The From: domain to check (e.g. "facebook.com")
 * @param dkimSelector   - The DKIM selector from the email (e.g. "s2048-2021-q2")
 * @param headerAuth     - Parsed values from Authentication-Results header (primary truth)
 */
export async function checkDns(
  domain: string,
  dkimSelector: string,
  headerAuth?: {
    spf:   string;
    dkim:  string;
    dmarc: string;
  }
): Promise<DnsResults> {
  const [spf, dmarc, dkim, mx] = await Promise.all([
    checkSpf(domain,              headerAuth?.spf),
    checkDmarc(domain,            headerAuth?.dmarc),
    checkDkim(domain, dkimSelector, headerAuth?.dkim),
    checkMx(domain),
  ]);
  return { spf, dmarc, dkim, mx };
}
