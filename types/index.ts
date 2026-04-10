// ─── Email Header Types ──────────────────────────────────────────────────────

export interface DKIMSignature {
  version: string;
  algorithm: string;
  domain: string;
  selector: string;
  signedHeaders: string[];
  bodyHash: string;
}

export interface AuthResults {
  spf: "pass" | "fail" | "softfail" | "neutral" | "none";
  dkim: "pass" | "fail" | "none";
  dmarc: "pass" | "fail" | "none";
  spfDomain: string;
  dkimDomain: string;
  dkimSelector: string;
}

export interface RelayHop {
  hopNumber: number;
  from: string;
  by: string;
  ip: string;
  protocol: string;
  timestamp: string; // ISO string for serialization
  delaySeconds: number;
  isPrivateIp: boolean;
}

export interface ParsedHeader {
  from: { name: string; email: string; domain: string };
  to: string;
  subject: string;
  date: string;
  messageId: string;
  returnPath: string;
  replyTo: string;
  xOriginatingIp: string;
  xMailer: string;
  xSpamScore: number;
  xSpamStatus: string;
  contentType: string;
  mimeVersion: string;
  relayHops: RelayHop[];
  authResults: AuthResults;
  dkimSignature: DKIMSignature;
  rawHeader: string;
  fromDomain: string;
  /** Parsed values from the Authentication-Results header — primary truth for SPF/DKIM/DMARC */
  headerAuthResults: {
    spf:          "pass" | "fail" | "softfail" | "neutral" | "none";
    dkim:         "pass" | "fail" | "none";
    dmarc:        "pass" | "fail" | "none";
    dkimSelector: string;
    dkimDomain:   string;
    spfDomain:    string;
  };
}

// ─── Spoof Detection Types ───────────────────────────────────────────────────

export interface SpoofCheck {
  name: string;
  passed: boolean;
  severity: "HIGH" | "MEDIUM" | "LOW";
  detail: string;
  pointsAdded: number;
}

export interface SpoofDetectionResult {
  riskScore: number;
  phishingProbability: number;
  verdict: "SAFE" | "SUSPICIOUS" | "SPOOFED";
  checks: SpoofCheck[];
}

// ─── DNS Types ───────────────────────────────────────────────────────────────

export interface DnsResults {
  spf: {
    record: string | null;
    mechanisms: string[];
    result: "pass" | "fail" | "softfail" | "neutral" | "none";
    trustability: "HIGH" | "MEDIUM" | "LOW" | "NONE";
    explanation: string;
  };
  dkim: {
    record: string | null;
    keyExists: boolean;
    isRevoked: boolean;
    result: "valid" | "revoked" | "not_found";
    explanation: string;
  };
  dmarc: {
    record: string | null;
    policy: "none" | "quarantine" | "reject" | null;
    alignment: { dkim: string; spf: string };
    reportingConfigured: boolean;
    percentage: number;
    trustability: "HIGH" | "MEDIUM" | "LOW" | "NONE";
    trustabilityScore: number;
    explanation: string;
  };
  mx: {
    records: string[];
    hasMx: boolean;
  };
}

// ─── IP Types ────────────────────────────────────────────────────────────────

export interface IPResult {
  ip: string;
  hopNumber: number;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lon: number;
  isp: string;
  org: string;
  isProxy: boolean;
  isHosting: boolean;
  isMobile: boolean;
  isTor: boolean;
  abuseScore: number;
  totalReports: number;
  lastReported: string | null;
  riskLevel: "CLEAN" | "SUSPICIOUS" | "MALICIOUS";
  usageType: string;
}

// ─── Link Analysis Types ─────────────────────────────────────────────────────

export interface LinkResult {
  url: string;
  domain: string;
  riskLevel: "SAFE" | "SUSPICIOUS" | "DANGEROUS";
  flags: string[];
  isShortener: boolean;
  isIpBased: boolean;
  isSuspiciousTld: boolean;
  mismatchesFromDomain: boolean;
  isHomograph: boolean;
}

// ─── AI Types ────────────────────────────────────────────────────────────────

export interface AIVerdict {
  verdict: "SAFE" | "SUSPICIOUS" | "SPOOFED";
  confidence: number;
  phishingProbability: number;
  oneLinerVerdict: string;
  summary: string;
  redFlags: { flag: string; severity: "HIGH" | "MEDIUM" | "LOW"; explanation: string }[];
  trustIndicators: string[];
  recommendations: { action: string; priority: "URGENT" | "HIGH" | "LOW" }[];
  technicalBreakdown: {
    spfAnalysis: string;
    dkimAnalysis: string;
    dmarcAnalysis: string;
    routingAnalysis: string;
    ipAnalysis: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Combined Result ─────────────────────────────────────────────────────────

export interface AnalysisResult {
  parsedHeader: ParsedHeader;
  spoofDetection: SpoofDetectionResult;
  dnsResults: DnsResults;
  ipResults: IPResult[];
  linkResults: LinkResult[];
  aiVerdict: AIVerdict;
  analyzedAt: string;
}
