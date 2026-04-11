import {
  Document, Page, Text, View, StyleSheet, renderToBuffer, Font,
} from "@react-pdf/renderer";
import type { AnalysisResult } from "@/types";
import React from "react";
import path from "path";

// Resolve font files from the local public/fonts directory
// (avoids remote fetch issues — all fonts are bundled at build time)
const F = (name: string) => path.join(process.cwd(), "public", "fonts", name);

// ─── Font Registration ────────────────────────────────────────────────────────
// Using stable GitHub raw URLs from google/fonts official repo (TTF, not variable)

// ─── DM Mono — monospace (headings, labels, tables, code-like text) ──────────
Font.register({
  family: "DM Mono",
  fonts: [
    { src: F("DMMono-Regular.ttf"),      fontWeight: 400 },
    { src: F("DMMono-Medium.ttf"),        fontWeight: 500 },
    { src: F("DMMono-Italic.ttf"),        fontWeight: 400, fontStyle: "italic" },
    { src: F("DMMono-MediumItalic.ttf"),  fontWeight: 500, fontStyle: "italic" },
  ],
});

// ─── Lato — body sans-serif (replaces DM Sans, no variable-font issues) ───────
Font.register({
  family: "Lato",
  fonts: [
    { src: F("Lato-Regular.ttf"),      fontWeight: 400 },
    { src: F("Lato-Medium.ttf"),        fontWeight: 500 },
    { src: F("Lato-Bold.ttf"),          fontWeight: 700 },
    { src: F("Lato-Italic.ttf"),        fontWeight: 400, fontStyle: "italic" },
    { src: F("Lato-MediumItalic.ttf"),  fontWeight: 500, fontStyle: "italic" },
    { src: F("Lato-BoldItalic.ttf"),    fontWeight: 700, fontStyle: "italic" },
  ],
});

// ─── Instrument Serif — cover headline serif ───────────────────────────────────
Font.register({
  family: "Instrument Serif",
  fonts: [
    { src: F("InstrumentSerif-Regular.ttf"), fontWeight: 400 },
    { src: F("InstrumentSerif-Italic.ttf"),  fontWeight: 400, fontStyle: "italic" },
  ],
});

// ─── Design Tokens — exact match with globals.css ────────────────────────────
const C = {
  bg:          "#0E2B1A",
  bgDeep:      "#0A1F13",
  bgAlt:       "#113620",
  card:        "#154026",
  cardHover:   "#194d2e",
  border:      "#1e5935",
  borderHover: "#267344",
  green:       "#aaff45",
  greenDim:    "#8edb2e",
  text:        "#e8f5e9",
  muted:       "#85a892",
  dimmer:      "#4a7060",
  danger:      "#ff5252",
  warn:        "#ffaa00",
  safe:        "#aaff45",
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Pages
  coverPage: {
    backgroundColor: C.bgDeep,
    color: C.text,
    padding: 0,
    display: "flex",
    flexDirection: "column",
  },
  page: {
    fontFamily: "Lato",
    backgroundColor: C.bg,
    color: C.text,
    padding: 0,
    fontSize: 9,
  },

  // ── Cover layout ─────────────────────────────────────────────────────────
  coverTopBar: {
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 48,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  coverLogoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  coverLogoIcon: {
    width: 28,
    height: 28,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  coverLogoIconText: {
    fontSize: 14,
    fontFamily: "DM Mono",
    fontWeight: 500,
    color: C.bgDeep,
  },
  coverLogoName: {
    fontSize: 16,
    fontFamily: "DM Mono",
    fontWeight: 500,
    color: C.green,
    letterSpacing: 1,
  },
  coverTopMeta: {
    fontFamily: "DM Mono",
    fontSize: 7,
    color: C.dimmer,
    letterSpacing: 0.5,
  },

  // Cover hero
  coverHero: {
    flex: 1,
    paddingHorizontal: 48,
    paddingTop: 56,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  coverHeadline: {
    fontFamily: "Instrument Serif",
    fontSize: 38,
    color: C.text,
    lineHeight: 1.15,
    marginBottom: 10,
  },
  coverHeadlineAccent: {
    fontFamily: "Instrument Serif",
    fontStyle: "italic",
    fontSize: 38,
    color: C.green,
  },
  coverSubline: {
    fontFamily: "Lato",
    fontSize: 10,
    color: C.muted,
    lineHeight: 1.6,
    maxWidth: 360,
    marginBottom: 40,
  },

  // Verdict strip on cover
  verdictStrip: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 32,
  },
  verdictStripLabel: {
    fontFamily: "DM Mono",
    fontSize: 7,
    color: C.dimmer,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.card,
    borderRightWidth: 1,
    borderRightColor: C.border,
    width: 100,
    justifyContent: "center",
  },
  verdictStripValue: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 13,
    letterSpacing: 2,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flex: 1,
  },
  verdictStripScore: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  verdictScoreNum: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 22,
  },
  verdictScoreLabel: {
    fontFamily: "DM Mono",
    fontSize: 6,
    color: C.dimmer,
    letterSpacing: 1,
    marginTop: 2,
  },

  coverOneLiner: {
    fontFamily: "Lato",
    fontSize: 9,
    color: C.muted,
    fontStyle: "italic",
    lineHeight: 1.6,
    borderLeftWidth: 2,
    borderLeftColor: C.border,
    paddingLeft: 12,
  },

  // ── Page content wrapper ──────────────────────────────────────────────────
  pageBody: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 48,
  },

  // ── Page Header Bar ────────────────────────────────────────────────────────
  pageTopBar: {
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTopBarLogo: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 9,
    color: C.green,
    letterSpacing: 1,
  },
  pageTopBarMeta: {
    fontFamily: "DM Mono",
    fontSize: 7,
    color: C.dimmer,
  },

  // ── Section ───────────────────────────────────────────────────────────────
  section: { marginBottom: 24 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    backgroundColor: C.green,
  },
  sectionTitle: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 8,
    color: C.green,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sectionNum: {
    fontFamily: "DM Mono",
    fontSize: 7,
    color: C.dimmer,
    marginLeft: "auto",
  },

  // ── Typography ─────────────────────────────────────────────────────────────
  paragraph: {
    fontFamily: "Lato",
    fontSize: 9,
    color: C.muted,
    lineHeight: 1.7,
    marginBottom: 6,
  },

  // ── Label/Value Row ────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    marginBottom: 5,
    minHeight: 16,
  },
  rowLabel: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 8,
    color: C.dimmer,
    width: 130,
    paddingTop: 1,
    letterSpacing: 0.3,
  },
  rowValue: {
    fontFamily: "DM Mono",
    fontSize: 8,
    color: C.text,
    flex: 1,
    lineHeight: 1.5,
  },

  // ── Auth result row ────────────────────────────────────────────────────────
  authBlock: {
    flexDirection: "row",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  authBlockLeft: {
    width: 80,
    backgroundColor: C.card,
    borderRightWidth: 1,
    borderRightColor: C.border,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  authBlockLabel: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 8,
    color: C.muted,
    letterSpacing: 1,
  },
  authBlockRight: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  authBlockResult: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  authBlockExplanation: {
    fontFamily: "Lato",
    fontSize: 8,
    color: C.muted,
    lineHeight: 1.5,
  },

  // ── Tables ─────────────────────────────────────────────────────────────────
  table: {
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.bgDeep,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.bgAlt,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  th: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 7,
    color: C.dimmer,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  td: {
    fontFamily: "DM Mono",
    fontSize: 7.5,
    color: C.muted,
  },
  tdHighlight: {
    fontFamily: "DM Mono",
    fontSize: 7.5,
    color: C.text,
  },

  // ── Flag card ──────────────────────────────────────────────────────────────
  flagCard: {
    flexDirection: "row",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  flagSevBar: {
    width: 4,
  },
  flagBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: C.bgAlt,
  },
  flagTitle: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 8,
    color: C.text,
    marginBottom: 3,
  },
  flagExplanation: {
    fontFamily: "Lato",
    fontSize: 8,
    color: C.muted,
    lineHeight: 1.5,
  },
  flagSevLabel: {
    fontFamily: "DM Mono",
    fontSize: 7,
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: "flex-start",
    width: 52,
    backgroundColor: C.card,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },

  // ── Recommendation item ────────────────────────────────────────────────────
  recItem: {
    flexDirection: "row",
    marginBottom: 5,
    alignItems: "flex-start",
  },
  recBadge: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 7,
    letterSpacing: 0.8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 10,
    marginTop: 1,
  },
  recText: {
    fontFamily: "Lato",
    fontSize: 9,
    color: C.muted,
    flex: 1,
    lineHeight: 1.5,
  },

  // ── Trust indicators ────────────────────────────────────────────────────────
  trustItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 8,
  },
  trustDot: {
    width: 5,
    height: 5,
    backgroundColor: C.green,
    marginTop: 2,
  },
  trustText: {
    fontFamily: "Lato",
    fontSize: 9,
    color: C.muted,
    flex: 1,
    lineHeight: 1.5,
  },

  // ── Technical breakdown grid ───────────────────────────────────────────────
  techGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  techCell: {
    width: "48%",
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    backgroundColor: C.card,
    marginBottom: 2,
  },
  techCellLabel: {
    fontFamily: "DM Mono",
    fontWeight: 500,
    fontSize: 7,
    color: C.green,
    letterSpacing: 1,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  techCellText: {
    fontFamily: "Lato",
    fontSize: 8,
    color: C.muted,
    lineHeight: 1.6,
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 40,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontFamily: "DM Mono",
    fontSize: 7,
    color: C.dimmer,
    letterSpacing: 0.5,
  },
  footerRight: {
    fontFamily: "DM Mono",
    fontSize: 7,
    color: C.dimmer,
  },
});

// ─── Helper functions ─────────────────────────────────────────────────────────

function verdictColor(v: string): string {
  if (v === "SAFE")       return C.safe;
  if (v === "SUSPICIOUS") return C.warn;
  return C.danger;
}

function authColor(r: string): string {
  if (r === "pass")    return C.green;
  if (r === "fail")    return C.danger;
  return C.warn;
}

function sevColor(s: string): string {
  if (s === "HIGH")   return C.danger;
  if (s === "MEDIUM") return C.warn;
  return C.green;
}

function prioColor(p: string): string {
  if (p === "URGENT") return C.danger;
  if (p === "HIGH")   return C.warn;
  return C.green;
}

function prioBackground(p: string): string {
  if (p === "URGENT") return "#330c0c";
  if (p === "HIGH")   return "#2c1c00";
  return "#0f2b0f";
}

function riskColor(score: number): string {
  if (score >= 61) return C.danger;
  if (score >= 31) return C.warn;
  return C.green;
}

// ─── Reusable Sub-components ──────────────────────────────────────────────────

function PageTopBar({ title, meta }: { title: string; meta?: string }) {
  return (
    <View style={S.pageTopBar} fixed>
      <Text style={S.pageTopBarLogo}>MAILHAWK</Text>
      <Text style={S.pageTopBarMeta}>{title}{meta ? ` · ${meta}` : ""}</Text>
    </View>
  );
}

function SectionHeader({ title, index }: { title: string; index?: string }) {
  return (
    <View style={S.sectionHeader}>
      <View style={S.sectionDot} />
      <Text style={S.sectionTitle}>{title}</Text>
      {index && <Text style={S.sectionNum}>{index}</Text>}
    </View>
  );
}

function Footer({ label }: { label: string }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerLeft}>{label} · Developed with ❤️ by Malaika Yasmeen Khawar</Text>
      <Text style={S.footerRight} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={S.row}>
      <Text style={S.rowLabel}>{label}</Text>
      <Text style={S.rowValue}>{value || "—"}</Text>
    </View>
  );
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

function MailHawkPDF({ data }: { data: AnalysisResult }) {
  const {
    parsedHeader: ph,
    spoofDetection: sd,
    dnsResults: dns,
    ipResults,
    linkResults,
    aiVerdict: ai,
    trustScore: ts,
  } = data;

  const verdict    = ai?.verdict || sd.verdict;
  const riskScore  = sd.riskScore;
  const vColor     = verdictColor(verdict);
  const rColor     = riskColor(riskScore);
  const genDate    = new Date(data.analyzedAt).toUTCString();

  return (
    <Document title="MailHawk Forensic Report" author="MailHawk" creator="MailHawk · mailhawk.app">

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 1 — Cover
      ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={[S.coverPage, { fontFamily: "Lato" }]}>

        {/* Top bar */}
        <View style={S.coverTopBar}>
          <View style={S.coverLogoGroup}>
            <View style={S.coverLogoIcon}>
              <Text style={S.coverLogoIconText}>M</Text>
            </View>
            <Text style={S.coverLogoName}>MAILHAWK</Text>
          </View>
          <Text style={S.coverTopMeta}>EMAIL HEADER FORENSICS · AI SPOOF DETECTION</Text>
        </View>

        {/* Hero */}
        <View style={S.coverHero}>
          <View>
            {/* Headline */}
            <Text style={S.coverHeadline}>
              Forensic{"\n"}
              <Text style={S.coverHeadlineAccent}>Analysis</Text>{" "}
              Report
            </Text>
            <Text style={S.coverSubline}>
              AI-powered email header analysis · SPF, DKIM & DMARC verification ·
              IP reputation · Link inspection · Relay path tracing
            </Text>

            {/* Verdict strip */}
            <View style={S.verdictStrip}>
              <View style={S.verdictStripLabel}>
                <Text style={{ fontFamily: "DM Mono", fontSize: 7, color: C.dimmer, letterSpacing: 1 }}>VERDICT</Text>
              </View>
              <View style={[S.verdictStripValue, { backgroundColor: verdictColor(verdict) === C.green ? "#0f2a10" : verdictColor(verdict) === C.warn ? "#2a1a00" : "#2a0808" }]}>
                <Text style={[S.verdictStripValue, { color: vColor, paddingHorizontal: 0, paddingVertical: 0 }]}>{verdict}</Text>
              </View>
              <View style={[S.verdictStripScore, { backgroundColor: C.card }]}>
                <Text style={[S.verdictScoreNum, { color: rColor }]}>{riskScore}</Text>
                <Text style={S.verdictScoreLabel}>RISK / 100</Text>
              </View>
              {ts && (
                <View style={[S.verdictStripScore, { backgroundColor: C.bgAlt, borderLeftWidth: 1, borderLeftColor: C.border }]}>
                  <Text style={[S.verdictScoreNum, { color: ts.tier === "trusted" ? C.green : ts.tier === "uncertain" ? C.warn : C.danger }]}>
                    {ts.score}%
                  </Text>
                  <Text style={S.verdictScoreLabel}>TRUST SCORE</Text>
                </View>
              )}
            </View>

            {/* One-liner */}
            {ai?.oneLinerVerdict && (
              <Text style={S.coverOneLiner}>
                {ai.oneLinerVerdict}
              </Text>
            )}
          </View>

          {/* Bottom meta grid */}
          <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 18, flexDirection: "row", gap: 32 }}>
            {[
              ["GENERATED",   genDate],
              ["FROM DOMAIN", ph.fromDomain || "—"],
              ["SUBJECT",     ph.subject ? ph.subject.slice(0, 40) + (ph.subject.length > 40 ? "…" : "") : "—"],
              ["TRUST SCORE", ts ? ts.label : "—"],
            ].map(([k, v]) => (
              <View key={k} style={{ flex: 1 }}>
                <Text style={{ fontFamily: "DM Mono", fontSize: 6.5, color: C.dimmer, letterSpacing: 1, marginBottom: 4 }}>{k}</Text>
                <Text style={{
                  fontFamily: "DM Mono", fontSize: 8, lineHeight: 1.4,
                  color: k === "TRUST SCORE" && ts
                    ? ts.tier === "trusted" ? C.green : ts.tier === "uncertain" ? C.warn : C.danger
                    : C.muted,
                }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 2 — Executive Summary + Email Metadata + Auth
      ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <PageTopBar title="FORENSIC REPORT" meta="SUMMARY & METADATA" />

        <View style={S.pageBody}>

          {/* Executive Summary */}
          <View style={S.section}>
            <SectionHeader title="Executive Summary" index="01" />
            <Text style={S.paragraph}>{ai?.summary || "No AI summary available. Please review the header data manually."}</Text>
          </View>

          {/* Email Metadata */}
          <View style={S.section}>
            <SectionHeader title="Email Metadata" index="02" />
            <View style={{ borderWidth: 1, borderColor: C.border, padding: 14, backgroundColor: C.bgAlt }}>
              {[
                ["From",            `${ph.from.name ? ph.from.name + "  " : ""}<${ph.from.email}>`],
                ["To",              ph.to],
                ["Subject",         ph.subject],
                ["Date",            ph.date],
                ["Message-ID",      ph.messageId],
                ["Return-Path",     ph.returnPath],
                ["Reply-To",        ph.replyTo || "—"],
                ["X-Originating-IP", ph.xOriginatingIp || "—"],
                ["X-Mailer",        ph.xMailer || "—"],
                ["X-Spam-Score",    ph.xSpamScore !== undefined ? String(ph.xSpamScore) : "—"],
              ].map(([label, val], i) => (
                <View key={label}
                  style={[
                    S.row,
                    i > 0 ? { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 5 } : {},
                  ]}
                >
                  <Text style={S.rowLabel}>{label}</Text>
                  <Text style={S.rowValue}>{val || "—"}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Authentication Results */}
          <View style={S.section}>
            <SectionHeader title="Authentication Results" index="03" />

            {([
              ["SPF",   ph.authResults.spf,   dns?.spf?.record,   dns?.spf?.explanation],
              ["DKIM",  ph.authResults.dkim,  dns?.dkim?.record,  dns?.dkim?.explanation],
              ["DMARC", ph.authResults.dmarc, dns?.dmarc?.record, dns?.dmarc?.explanation],
            ] as [string, string, string | null, string][]).map(([label, result, record, explanation]) => (
              <View key={label} style={S.authBlock}>
                <View style={S.authBlockLeft}>
                  <Text style={S.authBlockLabel}>{label}</Text>
                </View>
                <View style={S.authBlockRight}>
                  <Text style={[S.authBlockResult, { color: authColor(result) }]}>
                    {result.toUpperCase()}
                  </Text>
                  {record && (
                    <Text style={{ fontFamily: "DM Mono", fontSize: 6.5, color: C.dimmer, marginBottom: 3, lineHeight: 1.4 }}>
                      {record.length > 90 ? record.slice(0, 90) + "…" : record}
                    </Text>
                  )}
                  <Text style={S.authBlockExplanation}>{explanation || "—"}</Text>
                </View>
              </View>
            ))}
          </View>

        </View>

        <Footer label="MailHawk · Forensic Report" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 3 — Relay Path + IP Reputation
      ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <PageTopBar title="FORENSIC REPORT" meta="RELAY PATH & IP REPUTATION" />

        <View style={S.pageBody}>

          {/* Relay Hops */}
          <View style={S.section}>
            <SectionHeader title="Email Relay Path" index="04" />
            {ph.relayHops.length === 0 ? (
              <Text style={S.paragraph}>No relay hops found in headers.</Text>
            ) : (
              <View style={S.table}>
                <View style={S.tableHead}>
                  {(["#", "FROM SERVER", "BY SERVER", "IP ADDRESS", "PROTOCOL", "DELAY"] as const).map((h, i) => (
                    <Text key={h} style={[S.th, { flex: i === 0 ? 0.3 : i === 3 ? 1.5 : 1 }]}>{h}</Text>
                  ))}
                </View>
                {ph.relayHops.map((hop, i) => (
                  <View key={hop.hopNumber} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                    <Text style={[S.tdHighlight, { flex: 0.3, color: C.green }]}>{hop.hopNumber}</Text>
                    <Text style={[S.td, { flex: 1 }]}>{hop.from || "—"}</Text>
                    <Text style={[S.td, { flex: 1 }]}>{hop.by || "—"}</Text>
                    <Text style={[S.td, { flex: 1.5, color: hop.isPrivateIp ? C.dimmer : C.text }]}>
                      {hop.ip || "—"}{hop.isPrivateIp ? " (private)" : ""}
                    </Text>
                    <Text style={[S.td, { flex: 1 }]}>{hop.protocol}</Text>
                    <Text style={[S.td, { flex: 1, color: hop.delaySeconds > 3600 ? C.warn : C.muted }]}>
                      {hop.delaySeconds > 0 ? `${hop.delaySeconds}s` : "—"}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* IP Reputation */}
          {ipResults.length > 0 && (
            <View style={S.section}>
              <SectionHeader title="IP Reputation Analysis" index="05" />
              <View style={S.table}>
                <View style={S.tableHead}>
                  {["IP ADDRESS", "LOCATION", "ISP / ORG", "ABUSE", "RISK"].map((h, i) => (
                    <Text key={h} style={[S.th, { flex: i === 2 ? 1.5 : i === 0 ? 1.2 : 1 }]}>{h}</Text>
                  ))}
                </View>
                {ipResults.map((ip, i) => (
                  <View key={ip.ip} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                    <Text style={[S.tdHighlight, { flex: 1.2 }]}>{ip.ip}</Text>
                    <Text style={[S.td, { flex: 1 }]}>{ip.city ? `${ip.city}, ` : ""}{ip.countryCode || "—"}</Text>
                    <Text style={[S.td, { flex: 1.5 }]}>{(ip.isp || ip.org || "—").slice(0, 28)}</Text>
                    <Text style={[S.td, { flex: 1 }]}>{ip.abuseScore}/100</Text>
                    <Text style={[S.td, { flex: 1, color: verdictColor(ip.riskLevel === "CLEAN" ? "SAFE" : ip.riskLevel === "MALICIOUS" ? "SPOOFED" : "SUSPICIOUS") }]}>
                      {ip.riskLevel}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Spoof Detection Checks */}
          <View style={S.section}>
            <SectionHeader title="Spoof Detection Checks" index="06" />
            <View style={S.table}>
              <View style={S.tableHead}>
                {["CHECK", "STATUS", "SEVERITY", "DETAIL"].map((h, i) => (
                  <Text key={h} style={[S.th, { flex: i === 3 ? 2.5 : i === 0 ? 1.5 : 1 }]}>{h}</Text>
                ))}
              </View>
              {sd.checks.map((chk, i) => (
                <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                  <Text style={[S.td, { flex: 1.5, color: C.text }]}>{chk.name}</Text>
                  <Text style={[S.td, { flex: 1, color: chk.passed ? C.green : C.danger }]}>
                    {chk.passed ? "PASSED" : "FAILED"}
                  </Text>
                  <Text style={[S.td, { flex: 1, color: sevColor(chk.severity) }]}>{chk.severity}</Text>
                  <Text style={[S.td, { flex: 2.5 }]}>{chk.detail}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>

        <Footer label="MailHawk · Forensic Report" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 4 — AI Analysis, Flags, Recs
      ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <PageTopBar title="FORENSIC REPORT" meta="AI ANALYSIS & RECOMMENDATIONS" />

        <View style={S.pageBody}>

          {/* Link Analysis */}
          {linkResults.length > 0 && (
            <View style={S.section}>
              <SectionHeader title="Link Analysis" index="07" />
              <View style={S.table}>
                <View style={S.tableHead}>
                  {["URL", "DOMAIN", "RISK", "FLAGS"].map((h, i) => (
                    <Text key={h} style={[S.th, { flex: i === 0 ? 2.5 : i === 3 ? 1.5 : 1 }]}>{h}</Text>
                  ))}
                </View>
                {linkResults.slice(0, 12).map((link, i) => (
                  <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                    <Text style={[S.td, { flex: 2.5 }]}>{link.url.length > 50 ? link.url.slice(0, 50) + "…" : link.url}</Text>
                    <Text style={[S.td, { flex: 1, color: C.text }]}>{link.domain}</Text>
                    <Text style={[S.td, { flex: 1, color: verdictColor(link.riskLevel === "SAFE" ? "SAFE" : link.riskLevel === "DANGEROUS" ? "SPOOFED" : "SUSPICIOUS") }]}>
                      {link.riskLevel}
                    </Text>
                    <Text style={[S.td, { flex: 1.5 }]}>{link.flags.slice(0, 3).join(", ") || "None"}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Technical Breakdown */}
          {ai?.technicalBreakdown && (
            <View style={S.section}>
              <SectionHeader title="AI Technical Breakdown" index="08" />
              <View style={S.techGrid}>
                {([
                  ["SPF Analysis",    ai.technicalBreakdown.spfAnalysis],
                  ["DKIM Analysis",   ai.technicalBreakdown.dkimAnalysis],
                  ["DMARC Analysis",  ai.technicalBreakdown.dmarcAnalysis],
                  ["Routing",         ai.technicalBreakdown.routingAnalysis],
                  ["IP Analysis",     ai.technicalBreakdown.ipAnalysis],
                ] as [string, string][]).filter(([, v]) => v && v !== "AI unavailable").map(([label, text]) => (
                  <View key={label} style={S.techCell}>
                    <Text style={S.techCellLabel}>{label}</Text>
                    <Text style={S.techCellText}>{text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Red Flags */}
          {ai?.redFlags && ai.redFlags.length > 0 && (
            <View style={S.section}>
              <SectionHeader title="Red Flags" index="09" />
              {ai.redFlags.map((f, i) => (
                <View key={i} style={S.flagCard}>
                  <View style={[S.flagSevBar, { backgroundColor: sevColor(f.severity) }]} />
                  <View style={S.flagBody}>
                    <Text style={S.flagTitle}>{f.flag}</Text>
                    <Text style={S.flagExplanation}>{f.explanation}</Text>
                  </View>
                  <View style={S.flagSevLabel}>
                    <Text style={{ fontFamily: "DM Mono", fontSize: 6.5, color: sevColor(f.severity), letterSpacing: 0.8 }}>
                      {f.severity}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Trust Indicators */}
          {ai?.trustIndicators && ai.trustIndicators.length > 0 && (
            <View style={S.section}>
              <SectionHeader title="Trust Indicators" index="10" />
              {ai.trustIndicators.map((t, i) => (
                <View key={i} style={S.trustItem}>
                  <View style={S.trustDot} />
                  <Text style={S.trustText}>{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {ai?.recommendations && ai.recommendations.length > 0 && (
            <View style={S.section}>
              <SectionHeader title="Recommendations" index="11" />
              {ai.recommendations.map((r, i) => (
                <View key={i} style={S.recItem}>
                  <Text style={[S.recBadge, {
                    color: prioColor(r.priority),
                    backgroundColor: prioBackground(r.priority),
                    borderWidth: 1,
                    borderColor: prioColor(r.priority),
                  }]}>
                    {r.priority}
                  </Text>
                  <Text style={S.recText}>{r.action}</Text>
                </View>
              ))}
            </View>
          )}

          {/* AI Confidence + Phishing Probability */}
          {ai && (
            <View style={{ borderWidth: 1, borderColor: C.border, flexDirection: "row", overflow: "hidden" }}>
              {[
                ["AI CONFIDENCE",      `${ai.confidence ?? "—"}%`,          C.text],
                ["PHISHING PROBABILITY", `${ai.phishingProbability ?? "—"}%`, ai.phishingProbability >= 60 ? C.danger : ai.phishingProbability >= 30 ? C.warn : C.green],
                ["RISK SCORE",          `${riskScore} / 100`,                rColor],
              ].map(([label, value, color], i) => (
                <View key={label as string} style={{
                  flex: 1,
                  padding: 14,
                  borderLeftWidth: i > 0 ? 1 : 0,
                  borderLeftColor: C.border,
                  backgroundColor: i % 2 === 0 ? C.card : C.bgAlt,
                  alignItems: "center",
                }}>
                  <Text style={{ fontFamily: "DM Mono", fontSize: 6.5, color: C.dimmer, letterSpacing: 1, marginBottom: 6 }}>{label as string}</Text>
                  <Text style={{ fontFamily: "DM Mono", fontWeight: 500, fontSize: 18, color: color as string }}>{value as string}</Text>
                </View>
              ))}
            </View>
          )}

        </View>

        <Footer label="MailHawk · Forensic Report" />
      </Page>

    </Document>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function generatePdfReport(data: AnalysisResult): Promise<Buffer> {
  const buf = await renderToBuffer(<MailHawkPDF data={data} /> as any);
  return Buffer.from(buf);
}
