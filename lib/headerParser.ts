import type { ParsedHeader, RelayHop, AuthResults, DKIMSignature } from "@/types";

const PRIVATE_RANGES = [
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^127\.\d+\.\d+\.\d+$/,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_RANGES.some((r) => r.test(ip));
}

function extractIpFromText(text: string): string {
  const ipv4 = text.match(/\b(\d{1,3}\.){3}\d{1,3}\b/);
  if (ipv4) return ipv4[0];
  const ipv6 = text.match(/\[([0-9a-fA-F:]+)\]/);
  if (ipv6) return ipv6[1];
  return "";
}

function extractEmail(raw: string): { name: string; email: string; domain: string } {
  const nameEmail = raw.match(/^"?([^"<]*)"?\s*<([^>]+)>/);
  if (nameEmail) {
    const email = nameEmail[2].trim().toLowerCase();
    const domain = email.split("@")[1] || "";
    return { name: nameEmail[1].trim(), email, domain };
  }
  const bare = raw.match(/([^\s<>]+@[^\s<>]+)/);
  if (bare) {
    const email = bare[1].trim().toLowerCase();
    const domain = email.split("@")[1] || "";
    return { name: "", email, domain };
  }
  return { name: "", email: raw.trim(), domain: "" };
}

function getHeaderValue(headers: Map<string, string[]>, key: string): string {
  const vals = headers.get(key.toLowerCase());
  return vals ? vals[0] : "";
}

function getAllHeaderValues(headers: Map<string, string[]>, key: string): string[] {
  return headers.get(key.toLowerCase()) || [];
}

function unfoldHeader(raw: string): string {
  return raw.replace(/\r?\n[ \t]+/g, " ");
}

function parseHeaderMap(raw: string): Map<string, string[]> {
  const unfolded = unfoldHeader(raw);
  const lines = unfolded.split(/\r?\n/);
  const map = new Map<string, string[]>();

  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(value);
  }
  return map;
}

function parseRelayHops(headers: Map<string, string[]>): RelayHop[] {
  const receivedHeaders = getAllHeaderValues(headers, "received");
  const hops: RelayHop[] = [];
  const reversed = [...receivedHeaders].reverse();

  let prevTimestamp: Date | null = null;

  for (let i = 0; i < reversed.length; i++) {
    const text = reversed[i];
    const fromMatch = text.match(/from\s+([^\s]+)/i);
    const from = fromMatch ? fromMatch[1] : "";
    const byMatch = text.match(/by\s+([^\s]+)/i);
    const by = byMatch ? byMatch[1] : "";
    const protoMatch = text.match(/with\s+([A-Z0-9]+)/i);
    const protocol = protoMatch ? protoMatch[1].toUpperCase() : "SMTP";
    const ipRaw = extractIpFromText(text);
    const semiIdx = text.lastIndexOf(";");
    let timestamp: Date = new Date();
    if (semiIdx !== -1) {
      const dateStr = text.slice(semiIdx + 1).trim();
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) timestamp = parsed;
    }

    const delay = prevTimestamp
      ? Math.max(0, (timestamp.getTime() - prevTimestamp.getTime()) / 1000)
      : 0;

    hops.push({
      hopNumber: i + 1,
      from,
      by,
      ip: ipRaw,
      protocol,
      timestamp: timestamp.toISOString(),
      delaySeconds: Math.round(delay),
      isPrivateIp: ipRaw ? isPrivateIp(ipRaw) : false,
    });

    prevTimestamp = timestamp;
  }

  return hops;
}

function parseAuthResults(raw: string): AuthResults {
  const defaults: AuthResults = {
    spf: "none",
    dkim: "none",
    dmarc: "none",
    spfDomain: "",
    dkimDomain: "",
    dkimSelector: "",
  };

  if (!raw) return defaults;
  const spfMatch = raw.match(/spf=(pass|fail|softfail|neutral|none|permerror|temperror)/i);
  if (spfMatch) {
    const val = spfMatch[1].toLowerCase();
    if (["pass", "fail", "softfail", "neutral", "none"].includes(val)) {
      defaults.spf = val as AuthResults["spf"];
    }
  }
  const dkimMatch = raw.match(/dkim=(pass|fail|none|neutral|permerror|temperror)/i);
  if (dkimMatch) {
    const val = dkimMatch[1].toLowerCase();
    if (["pass", "fail", "none"].includes(val)) {
      defaults.dkim = val as AuthResults["dkim"];
    }
  }
  const dmarcMatch = raw.match(/dmarc=(pass|fail|none|bestguesspass|permerror|temperror)/i);
  if (dmarcMatch) {
    const val = dmarcMatch[1].toLowerCase();
    if (["pass", "fail", "none"].includes(val)) {
      defaults.dmarc = val as AuthResults["dmarc"];
    }
  }
  const spfDomainMatch = raw.match(/smtp\.mailfrom[= ]+([^\s;,]+)/i)
    || raw.match(/smtp\.helo[= ]+([^\s;,]+)/i);
  if (spfDomainMatch) defaults.spfDomain = spfDomainMatch[1].replace(/[<>]/g, "");
  const dkimDomainMatch = raw.match(/header\.d[= ]+([^\s;,]+)/i)
    || raw.match(/header\.i[= ]+@?([^\s;,]+)/i);
  if (dkimDomainMatch) defaults.dkimDomain = dkimDomainMatch[1].replace(/^@/, "");

  const dkimSelectorMatch = raw.match(/header\.s[= ]+([^\s;,]+)/i);
  if (dkimSelectorMatch) defaults.dkimSelector = dkimSelectorMatch[1];

  return defaults;
}

function parseAllAuthResults(rawHeader: string): ParsedHeader["headerAuthResults"] {
  const result: ParsedHeader["headerAuthResults"] = {
    spf: "none",
    dkim: "none",
    dmarc: "none",
    dkimSelector: "",
    dkimDomain: "",
    spfDomain: "",
  };
  const unfolded = rawHeader.replace(/\r?\n[ \t]+/g, " ");
  const lines = unfolded.split(/\r?\n/);

  const authHeaders: string[] = [];
  for (const line of lines) {
    if (/^authentication-results:/i.test(line)) {
      authHeaders.push(line.replace(/^authentication-results:/i, "").trim());
    }
  }

  if (authHeaders.length === 0) return result;
  const scored = authHeaders.map((h) => {
    const lower = h.toLowerCase();
    let score = 0;
    if (/spf=(pass|fail|softfail|neutral)/.test(lower))   score++;
    if (/dkim=(pass|fail)/.test(lower))                   score++;
    if (/dmarc=(pass|fail)/.test(lower))                  score++;
    if (/header\.s=/.test(lower))                         score++;
    return { h, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].h;
  const spfMatch = best.match(/spf=(pass|fail|softfail|neutral|none|permerror|temperror)/i);
  if (spfMatch) {
    const v = spfMatch[1].toLowerCase();
    if (["pass", "fail", "softfail", "neutral", "none"].includes(v)) {
      result.spf = v as ParsedHeader["headerAuthResults"]["spf"];
    }
  }
  const dkimMatch = best.match(/dkim=(pass|fail|none|neutral|permerror|temperror)/i);
  if (dkimMatch) {
    const v = dkimMatch[1].toLowerCase();
    if (["pass", "fail", "none"].includes(v)) {
      result.dkim = v as ParsedHeader["headerAuthResults"]["dkim"];
    }
  }
  const dmarcMatch = best.match(/dmarc=(pass|fail|none|bestguesspass|permerror|temperror)/i);
  if (dmarcMatch) {
    const v = dmarcMatch[1].toLowerCase();
    if (["pass", "fail", "none"].includes(v)) {
      result.dmarc = v as ParsedHeader["headerAuthResults"]["dmarc"];
    }
  }
  const spfDomain = best.match(/smtp\.mailfrom[= ]+([^\s;,]+)/i)
    || best.match(/smtp\.helo[= ]+([^\s;,]+)/i);
  if (spfDomain) result.spfDomain = spfDomain[1].replace(/[<>]/g, "").split("@").pop() || "";
  const dkimDomain = best.match(/header\.d[= ]+([^\s;,]+)/i)
    || best.match(/header\.i[= ]+@?([^\s;,]+)/i);
  if (dkimDomain) result.dkimDomain = dkimDomain[1].replace(/^@/, "");
  const dkimSel = best.match(/header\.s[= ]+([^\s;,]+)/i);
  if (dkimSel) result.dkimSelector = dkimSel[1];

  return result;
}

function parseDkimSignature(raw: string): DKIMSignature {
  const defaults: DKIMSignature = {
    version: "",
    algorithm: "",
    domain: "",
    selector: "",
    signedHeaders: [],
    bodyHash: "",
  };

  if (!raw) return defaults;

  const get = (key: string) => {
    const m = raw.match(new RegExp(`${key}=([^;\\s]+)`, "i"));
    return m ? m[1] : "";
  };

  const hMatch = raw.match(/h=([^;]+)/i);
  const signedHeaders = hMatch ? hMatch[1].split(":").map((s) => s.trim()) : [];

  return {
    version: get("v"),
    algorithm: get("a"),
    domain: get("d"),
    selector: get("s"),
    signedHeaders,
    bodyHash: get("bh"),
  };
}

export function parseHeader(rawHeader: string): ParsedHeader {
  const headers = parseHeaderMap(rawHeader);

  const fromRaw = getHeaderValue(headers, "from");
  const from = extractEmail(fromRaw);
  const headerAuthResults = parseAllAuthResults(rawHeader);
  const authResultsRaw = getHeaderValue(headers, "authentication-results");
  const authResults = parseAuthResults(authResultsRaw);
  if (!authResults.dkimSelector && headerAuthResults.dkimSelector) {
    authResults.dkimSelector = headerAuthResults.dkimSelector;
  }
  if (!authResults.dkimDomain && headerAuthResults.dkimDomain) {
    authResults.dkimDomain = headerAuthResults.dkimDomain;
  }
  const dkimSigRaw = getHeaderValue(headers, "dkim-signature");
  const dkimSignature = parseDkimSignature(dkimSigRaw);

  if (!authResults.dkimDomain && dkimSignature.domain) {
    authResults.dkimDomain = dkimSignature.domain;
  }
  if (!authResults.dkimSelector && dkimSignature.selector) {
    authResults.dkimSelector = dkimSignature.selector;
  }
  if (!headerAuthResults.dkimSelector && dkimSignature.selector) {
    headerAuthResults.dkimSelector = dkimSignature.selector;
  }
  if (!headerAuthResults.dkimDomain && dkimSignature.domain) {
    headerAuthResults.dkimDomain = dkimSignature.domain;
  }

  const relayHops = parseRelayHops(headers);

  const xSpamScoreRaw = getHeaderValue(headers, "x-spam-score");
  const xSpamScore = parseFloat(xSpamScoreRaw) || 0;
  const returnPathRaw = getHeaderValue(headers, "return-path");
  const returnPath = returnPathRaw.replace(/[<>]/g, "").trim();
  const replyToRaw = getHeaderValue(headers, "reply-to");
  const replyToEmail = extractEmail(replyToRaw);

  return {
    from,
    fromDomain: from.domain,
    to: getHeaderValue(headers, "to"),
    subject: getHeaderValue(headers, "subject"),
    date: getHeaderValue(headers, "date"),
    messageId: getHeaderValue(headers, "message-id"),
    returnPath,
    replyTo: replyToEmail.email || replyToRaw,
    xOriginatingIp: getHeaderValue(headers, "x-originating-ip"),
    xMailer: getHeaderValue(headers, "x-mailer"),
    xSpamScore,
    xSpamStatus: getHeaderValue(headers, "x-spam-status"),
    contentType: getHeaderValue(headers, "content-type"),
    mimeVersion: getHeaderValue(headers, "mime-version"),
    relayHops,
    authResults,
    dkimSignature,
    rawHeader,
    headerAuthResults,
  };
}
