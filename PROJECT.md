Build a full-stack Next.js 14 application called
"MailHawk - Email Header Forensics & AI Spoof Detection Tool"

NO user authentication. NO database. NO login. NO Gmail OAuth.
This is a fully open, stateless, zero-friction tool.
User just lands on the page and immediately starts analyzing.
All analysis happens per-session in React state only.

USE GOOGLE FONTS DM MONO, SANS SERIF, INSTRUMENT SERIF USING IMPORTING FROM GOOGLE

═══════════════════════════════════════════
🏗️ TECH STACK
═══════════════════════════════════════════

- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui
- AI: OpenAI-compatible GPT OSS 120B model via API
- Maps: React-Leaflet (dynamic import, ssr: false)
- PDF: @react-pdf/renderer (server-side)
- IP Geolocation: ip-api.com (free, no key needed)
- IP Reputation: AbuseIPDB API (free tier)
- DNS Checks: Cloudflare DNS over HTTPS (no key needed)
- Charts: Recharts (for risk gauge + probability chart)

═══════════════════════════════════════════
📁 FOLDER STRUCTURE
═══════════════════════════════════════════

mailhawk/
├── app/
│ ├── page.tsx ← Landing + input page
│ ├── analyze/
│ │ └── page.tsx ← Full results page
│ ├── api/
│ │ ├── analyze/
│ │ │ └── route.ts ← Master analysis pipeline
│ │ ├── ai/
│ │ │ ├── verdict/
│ │ │ │ └── route.ts ← AI forensic verdict
│ │ │ └── chat/
│ │ │ └── route.ts ← AI chat (streaming)
│ │ ├── ip/
│ │ │ └── route.ts ← IP geolocation + reputation
│ │ ├── dns/
│ │ │ └── route.ts ← SPF/DKIM/DMARC DNS lookups
│ │ └── report/
│ │ └── route.ts ← PDF report generation
│ └── layout.tsx
│
├── components/
│ ├── home/
│ │ ├── HeroSection.tsx ← Landing hero with glow title
│ │ ├── FeatureBadges.tsx ← 3 feature highlight badges
│ │ ├── InputTabs.tsx ← Tab switcher component
│ │ ├── HeaderInput.tsx ← Paste raw header textarea
│ │ ├── FileUpload.tsx ← Drag & drop .eml/.txt upload
│ │ └── LoadingTerminal.tsx ← Animated terminal loading UI
│ ├── results/
│ │ ├── VerdictBanner.tsx ← SAFE/SUSPICIOUS/SPOOFED banner
│ │ ├── RiskGauge.tsx ← Circular risk score chart
│ │ ├── PhishingProbability.tsx← Bar/gauge chart % phishing
│ │ ├── RelayTimeline.tsx ← Hop-by-hop timeline
│ │ ├── RelayMap.tsx ← Leaflet map (dynamic, no SSR)
│ │ ├── SPFCard.tsx ← SPF check result card
│ │ ├── DKIMCard.tsx ← DKIM check result card
│ │ ├── DMARCCard.tsx ← DMARC trustability card
│ │ ├── LinkAnalysisCard.tsx ← URL/link safety analysis
│ │ ├── IPReputationCard.tsx ← IP reputation per hop
│ │ ├── HeaderMetaCard.tsx ← From/To/Subject/Date etc
│ │ ├── AIVerdictCard.tsx ← AI analysis result card
│ │ ├── AIChat.tsx ← Chat with AI about header
│ │ └── DownloadReport.tsx ← PDF download button
│ └── shared/
│ ├── Navbar.tsx
│ └── Footer.tsx
│
├── lib/
│ ├── headerParser.ts ← Core header parsing
│ ├── spoofDetector.ts ← Spoof/phishing scoring
│ ├── dnsChecker.ts ← SPF/DKIM/DMARC lookups
│ ├── ipChecker.ts ← IP reputation + geo
│ ├── linkAnalyzer.ts ← URL extraction + safety
│ ├── aiAnalyzer.ts ← GPT OSS API integration
│ └── pdfGenerator.ts ← PDF report builder
│
├── types/
│ └── index.ts ← All TypeScript interfaces
│
└── .env

═══════════════════════════════════════════
🎯 USER FLOW
═══════════════════════════════════════════

HOME PAGE (/) — two input methods as tabs:

TAB 1 — "Paste Header"
→ Large monospace textarea
→ Placeholder shows example header snippet
→ Character count shown bottom right
→ "Analyze Email" button (disabled if empty)

TAB 2 — "Upload File"
→ Drag and drop zone for .eml or .txt files
→ On drop: parse file, extract header,
auto-fill the textarea in Tab 1
→ Switch to Tab 1 automatically after upload
→ "Analyze Email" button

On clicking "Analyze Email":
→ Validate header is not empty
→ Show LoadingTerminal component with steps:
[✓] Parsing email header...
[✓] Extracting relay hops...
[✓] Checking SPF record...
[✓] Checking DKIM signature...
[✓] Checking DMARC policy...
[✓] Checking IP reputation...
[✓] Analyzing link safety...
[✓] Running AI forensic analysis...
[✓] Building report...
→ Call /api/analyze with raw header string
→ Store result in sessionStorage as JSON
→ Redirect to /analyze page

RESULTS PAGE (/analyze):
→ Read result from sessionStorage
→ If empty, redirect back to /
→ Render all result components

═══════════════════════════════════════════
🔍 HEADER PARSING (lib/headerParser.ts)
═══════════════════════════════════════════

Accept raw header string. Extract:

BASIC FIELDS:

- From (display name + email address)
- To
- Subject
- Date
- Message-ID
- Return-Path
- Reply-To
- X-Originating-IP
- X-Mailer
- X-Spam-Status, X-Spam-Score
- Content-Type
- MIME-Version

RELAY HOPS (parse all "Received:" headers):
For each Received header extract:

- from: hostname/IP
- by: receiving server
- IP address (regex IPv4 + IPv6)
- protocol (SMTP, ESMTP, etc)
- timestamp (parse to Date object)
- delay from previous hop (seconds)
- flag if IP is private range:
  10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x

AUTHENTICATION RESULTS:
Parse "Authentication-Results:" header for:

- spf=pass|fail|softfail|neutral|none
- dkim=pass|fail|none (+ selector, domain)
- dmarc=pass|fail|none (+ policy)

DKIM SIGNATURE:
Parse "DKIM-Signature:" header for:

- v= (version)
- a= (algorithm)
- d= (signing domain)
- s= (selector)
- h= (signed headers list)
- bh= (body hash)

Return typed ParsedHeader object with all fields.

═══════════════════════════════════════════
🛡️ SPOOF & PHISHING DETECTION
(lib/spoofDetector.ts)
═══════════════════════════════════════════

Run ALL of these checks. Each adds to risk score.

DOMAIN MISMATCH CHECKS:

1. From domain vs Return-Path domain
   → Mismatch = +35 points (major red flag)
2. From domain vs Reply-To domain
   → Mismatch = +25 points
3. Message-ID domain vs From domain
   → Mismatch = +15 points
4. From display name vs From email domain
   → e.g. "PayPal" <attacker@evil.com> = +40 points

AUTHENTICATION FAILURES: 5. SPF = fail → +30 points
SPF = softfail → +15 points
SPF = none (no record) → +10 points 6. DKIM = fail → +25 points
DKIM = none → +10 points 7. DMARC = fail → +20 points
DMARC = none → +10 points

RELAY HOP ANOMALIES: 8. More than 7 hops → +10 points 9. Any hop delay > 1 hour → +10 points per hop 10. Private IP appearing between public IPs → +20 points 11. Hops going backwards geographically → +5 points

HEADER ANOMALIES: 12. X-Spam-Score > 5 → +15 points 13. Missing standard headers (Date, Message-ID) → +10 each 14. Unusual X-Mailer value → +5 points 15. Multiple From headers → +30 points

PHISHING PROBABILITY SCORE:
Calculate separately from risk score:

- Analyse display name spoofing (PayPal, Apple, Google, etc)
- Check if From domain is lookalike
  (paypa1.com, app1e.com, g00gle.com)
- Check if links in body point to different domain
  than From domain
- Combine into 0-100 phishing probability percentage

FINAL SCORING:

- Risk Score 0-100 (capped at 100)
- Phishing Probability 0-100%
- Verdict:
  0-30 → SAFE (green)
  31-60 → SUSPICIOUS (yellow)
  61-100 → SPOOFED / PHISHING (red)

═══════════════════════════════════════════
🔐 DNS CHECKS (lib/dnsChecker.ts)
═══════════════════════════════════════════

Use Cloudflare DNS over HTTPS API for all lookups:
Base URL: https://cloudflare-dns.com/dns-query
Headers: Accept: application/dns-json

Extract sender domain from From header.
Run these DNS lookups:

1. SPF CHECK:
   GET ?name={domain}&type=TXT
   → Find record starting with "v=spf1"
   → Parse mechanisms: +all, -all, ~all, ?all
   → Parse includes: include:domain.com
   → Parse ip4/ip6 ranges
   → Result: record found/not found + parsed mechanisms
   → Trustability: PASS / FAIL / SOFTFAIL / NONE

2. DMARC CHECK:
   GET ?name=\_dmarc.{domain}&type=TXT
   → Find record starting with "v=DMARC1"
   → Parse:
   p= (policy: none/quarantine/reject)
   rua= (aggregate report email)
   ruf= (forensic report email)
   pct= (percentage of mail policy applies to)
   adkim= (DKIM alignment: r=relaxed, s=strict)
   aspf= (SPF alignment: r=relaxed, s=strict)
   → Trustability rating:
   p=reject + strict alignment = HIGH TRUST
   p=quarantine = MEDIUM TRUST
   p=none = LOW TRUST
   no record = NO PROTECTION

3. DKIM CHECK:
   Use selector from parsed DKIM-Signature header
   GET ?name={selector}.\_domainkey.{domain}&type=TXT
   → Find record with "v=DKIM1"
   → Parse public key (p=)
   → Verify key exists and is not revoked (p= not empty)
   → Result: VALID / REVOKED / NOT FOUND

4. MX RECORD CHECK:
   GET ?name={domain}&type=MX
   → List mail servers for domain
   → Flag if no MX records (domain cannot receive mail
   = likely spoofed/throwaway)

Return structured DnsResults object with all findings
and a human-readable trustability summary for each check.

═══════════════════════════════════════════
🔗 LINK ANALYSIS (lib/linkAnalyzer.ts)
═══════════════════════════════════════════

Extract all URLs from the raw header text:

- From headers: List-Unsubscribe, List-Archive
- Any URLs in X-\* headers
- Any URLs visible in header content

For each URL found:

1. Parse domain from URL
2. Compare domain to From email domain
   → Mismatch = suspicious flag
3. Check for lookalike domains:
   - Homograph attacks (unicode chars)
   - Common brand spoofs (paypa1, g00gle, amaz0n)
   - Excessive subdomains
   - Suspicious TLDs (.xyz, .tk, .ml, .ga, .cf)
4. Check URL shorteners (bit.ly, tinyurl, t.co etc)
   → Flag as "hidden destination"
5. Check for IP-based URLs (http://1.2.3.4/login)
   → Flag as highly suspicious

Return array of analyzed links with risk level per link.

═══════════════════════════════════════════
🌍 IP REPUTATION (lib/ipChecker.ts)
═══════════════════════════════════════════

Skip private/loopback IPs entirely.
For each public IP in relay hops:

1. GEOLOCATION — ip-api.com (free, no key):
   GET http://ip-api.com/json/{ip}
   ?fields=status,country,countryCode,city,
   lat,lon,isp,org,as,proxy,hosting,mobile

Extract: country, city, lat, lon, isp, org,
isProxy, isHosting, isMobile

2. REPUTATION — AbuseIPDB:
   GET https://api.abuseipdb.com/api/v2/check
   ?ipAddress={ip}&maxAgeInDays=90
   Headers: Key: {ABUSEIPDB_API_KEY}
   Accept: application/json

Extract: abuseConfidenceScore (0-100),
totalReports, lastReportedAt,
isTor, usageType, domain

RISK CLASSIFICATION per IP:

- Score 0-24: CLEAN (green)
- Score 25-74: SUSPICIOUS (yellow)
- Score 75-100: MALICIOUS (red)

Return array of IPResult objects,
one per unique public IP in relay path.

═══════════════════════════════════════════
🤖 AI ANALYSIS (lib/aiAnalyzer.ts)
═══════════════════════════════════════════

Use GPT OSS 120B model via OpenAI-compatible API.
Base URL: https://api.openai.com/v1 (or custom endpoint)
Model: set via OPENAI_MODEL env variable

SYSTEM PROMPT:
"You are MailHawk, an expert email forensics analyst
and cybersecurity investigator with 20 years of
experience. You analyze email header data and provide
clear, accurate, actionable forensic verdicts.
You explain complex technical findings in plain English
that non-technical users can understand.
Always respond with valid JSON only. No markdown.
No explanation outside the JSON structure."

USER PROMPT:
"Analyze this email header forensic report and respond
ONLY with this exact JSON structure, no other text:
{
verdict: 'SAFE' | 'SUSPICIOUS' | 'SPOOFED',
confidence: <number 0-100>,
phishingProbability: <number 0-100>,
oneLinerVerdict: '<one sentence plain English summary>',
summary: '<2-3 paragraph detailed explanation>',
redFlags: [
{ flag: '<flag name>', severity: 'HIGH'|'MEDIUM'|'LOW',
explanation: '<why this is suspicious>' }
],
trustIndicators: [
'<things that seem legitimate>'
],
recommendations: [
{ action: '<what to do>', priority: 'URGENT'|'HIGH'|'LOW' }
],
technicalBreakdown: {
spfAnalysis: '<detailed SPF explanation>',
dkimAnalysis: '<detailed DKIM explanation>',
dmarcAnalysis: '<detailed DMARC explanation>',
routingAnalysis: '<relay path analysis>',
ipAnalysis: '<IP reputation analysis>'
}
}

Email forensic data:
${JSON.stringify(fullAnalysisData, null, 2)}"

AI CHAT (/api/ai/chat):

- Accept: { messages: ChatMessage[], headerContext: string }
- System: MailHawk forensics expert with header context
- Stream response back using ReadableStream
- User can ask follow-up questions like:
  'Is this email from PayPal safe?'
  'What does SPF softfail mean?'
  'Should I click the link in this email?'

═══════════════════════════════════════════
📊 CHARTS & VISUALIZATIONS
═══════════════════════════════════════════

Use Recharts for all charts.

1. RISK GAUGE (RiskGauge.tsx):
   - Semicircular gauge chart
   - 0-100 scale
   - Color zones: green (0-30), yellow (31-60), red (61-100)
   - Needle pointing to risk score
   - Large number in center
   - Label: "Risk Score"

2. PHISHING PROBABILITY (PhishingProbability.tsx):
   - Horizontal progress bar style
   - Animated fill on load
   - Color: green → yellow → red based on %
   - Shows: "47% Phishing Probability"
   - Sub-label: "Based on AI analysis + header signals"

3. AUTHENTICATION SUMMARY (in SPFCard, DKIMCard, DMARCCard):
   - Each card shows PASS/FAIL/NONE badge
   - Colored dot indicator
   - Short explanation text
   - Expandable technical details section
   - Trustability rating (HIGH/MEDIUM/LOW/NONE)
   - For DMARC specifically show:
     - Policy level (none/quarantine/reject)
     - Alignment mode (strict/relaxed)
     - Reporting configured (yes/no)
     - Overall DMARC trustability score

4. RELAY TIMELINE (RelayTimeline.tsx):
   - Vertical timeline component
   - Each hop is a card showing:
     - Hop number
     - From/By hostnames
     - IP address (colored by reputation)
     - Country flag + city
     - Timestamp
     - Delay from previous hop
     - Abuse score badge
   - Connecting line between hops
   - Flag anomalous hops in red/yellow

═══════════════════════════════════════════
🗺️ MAP (components/results/RelayMap.tsx)
═══════════════════════════════════════════

MUST use: const RelayMap = dynamic(() =>
import('../results/RelayMap'), { ssr: false })

Use React-Leaflet with OpenStreetMap tiles.
Tile URL: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

Features:

- Custom colored markers per IP:
  green circle = clean (score < 25)
  yellow circle = suspicious (score 25-74)
  red circle = malicious (score >= 75)
- Polyline connecting all hops in sequence
- Popup on marker click showing:
  Hop #N
  IP: x.x.x.x
  Location: City, Country
  ISP: name
  Abuse Score: XX/100
  Timestamp: date/time
  Delay: Xm Xs from previous
- Auto-fit bounds to all markers
- Dark map theme if available, else default OSM

═══════════════════════════════════════════
📄 PDF REPORT (lib/pdfGenerator.ts)
═══════════════════════════════════════════

Server-side generation via /api/report/route.ts
Using @react-pdf/renderer

PDF sections in order:

1. Cover: MailHawk logo, title, analysis timestamp,
   overall verdict badge (colored), risk score
2. Executive Summary: AI one-liner + summary paragraph
3. Email Metadata: From, To, Subject, Date, Message-ID table
4. Authentication Results:
   SPF, DKIM, DMARC — each with result + explanation
5. Relay Path: numbered table of all hops
   (hop#, from, by, IP, location, delay, abuse score)
6. IP Reputation: table of all IPs with scores
7. Link Analysis: table of extracted URLs with risk level
8. AI Full Analysis: complete AI verdict and breakdown
9. Red Flags: numbered list with severity
10. Recommendations: action items with priority

Style: professional, dark header with white text,
alternating row shading in tables, colored verdict badges.

═══════════════════════════════════════════
🎨 UI DESIGN SYSTEM
═══════════════════════════════════════════

COLORS:
--bg-primary: #0a0a0f
--bg-card: #111118
--bg-card-hover: #16161f
--accent-green: #00ff88
--accent-green-dim: #00cc6a
--danger-red: #ff4444
--warning-yellow: #ffaa00
--text-primary: #e0e0e0
--text-secondary: #888899
--border: #222233
--border-hover: #333344

TYPOGRAPHY:

- Font: Inter (Google Fonts)
- Monospace: JetBrains Mono (for header display)
- Hero title: 5xl-7xl, bold, text-white
  with green glow: text-shadow: 0 0 40px #00ff88
- Section headers: 2xl, bold, text-accent-green
- Body: base, text-primary
- Code/headers: monospace, text-green-400

COMPONENT STYLES:
Cards:
bg-[#111118] border border-[#222233]
rounded-xl p-6 shadow-lg
hover:border-[#333344] transition-all

Buttons (primary):
bg-[#00ff88] text-black font-bold
rounded-lg px-6 py-3
hover:bg-[#00cc6a] transition-colors
shadow: 0 0 20px rgba(0,255,136,0.3)

Badges:
SAFE: bg-green-500/20 text-green-400
border border-green-500/30
SUSPICIOUS: bg-yellow-500/20 text-yellow-400
border border-yellow-500/30
SPOOFED: bg-red-500/20 text-red-400
border border-red-500/30

Input/Textarea:
bg-[#0a0a0f] border border-[#222233]
text-[#e0e0e0] font-mono rounded-lg
focus:border-[#00ff88] focus:ring-1
focus:ring-[#00ff88] transition-all

LOADING TERMINAL:
bg-[#0a0a0f] border border-[#222233]
rounded-xl p-6 font-mono
Each step appears with 600ms delay:
[>] Parsing email header... (typing animation)
[✓] Parsing email header... (green checkmark)
[>] Checking DNS records... (next step starts)
Green blinking cursor at active line
Progress bar at bottom

HERO SECTION:
Full viewport height section
Centered content
"MailHawk" in 7xl bold with green glow
Animated subtle particle background (CSS only)
3 feature badges below subtitle:
[🔍 Header Forensics] [🛡️ Spoof Detection] [🤖 AI Analysis]
Input tabs below badges

MOBILE RESPONSIVE:

- Single column layout on mobile
- Results cards stack vertically
- Map: 300px height on mobile, 500px on desktop
- Hamburger menu: shadcn Sheet component
- Timeline: simplified on mobile
- Charts: full width on mobile

═══════════════════════════════════════════
📱 PAGES DETAIL
═══════════════════════════════════════════

HOME PAGE (app/page.tsx):
<Navbar />
<HeroSection>

<h1>MailHawk</h1> ← with green glow
<p>AI-Powered Email Forensics & Spoof Detection</p>
<FeatureBadges />
<InputTabs>
<Tab label="Paste Header">
<HeaderInput />
</Tab>
<Tab label="Upload File">
<FileUpload />
</Tab>
</InputTabs>
</HeroSection>

  <Footer />

RESULTS PAGE (app/analyze/page.tsx):
Read data from sessionStorage key: "mailhawk_result"
If missing → redirect to /

Layout:
<Navbar />
<VerdictBanner /> ← full width, colored

  <div class="grid grid-cols-2 gap-6">
    <RiskGauge />
    <PhishingProbability />
    <SPFCard />
    <DKIMCard />
    <DMARCCard />              ← with full trustability detail
    <HeaderMetaCard />
    <IPReputationCard />
    <LinkAnalysisCard />
  </div>
  <RelayTimeline />            ← full width
  <RelayMap />                 ← full width, 500px height
  <AIVerdictCard />            ← full width
  <AIChat />                   ← full width
  <DownloadReport />           ← button → calls /api/report
  <Footer />

═══════════════════════════════════════════
🔌 API ROUTES
═══════════════════════════════════════════

POST /api/analyze
Body: { rawHeader: string }
Process: 1. parseHeader(rawHeader) → parsedHeader 2. detectSpoof(parsedHeader) → spoofResult 3. checkDNS(parsedHeader.fromDomain) → dnsResult 4. checkIPs(parsedHeader.relayHops) → ipResults 5. analyzeLinks(rawHeader) → linkResults 6. runAIAnalysis({parsedHeader, spoofResult,
dnsResult, ipResults, linkResults}) → aiResult 7. Return combined AnalysisResult object
Response: full AnalysisResult JSON

POST /api/ai/chat
Body: { messages: ChatMessage[], context: string }
Response: streaming text

GET /api/report
Query: ?data=<base64 encoded AnalysisResult>
Response: PDF file download

POST /api/ip
Body: { ips: string[] }
Response: IPResult[]

POST /api/dns
Body: { domain: string }
Response: DnsResults

═══════════════════════════════════════════
📝 TYPESCRIPT INTERFACES (types/index.ts)
═══════════════════════════════════════════

interface ParsedHeader {
from: { name: string; email: string; domain: string }
to: string
subject: string
date: string
messageId: string
returnPath: string
replyTo: string
xOriginatingIp: string
xMailer: string
xSpamScore: number
relayHops: RelayHop[]
authResults: AuthResults
dkimSignature: DKIMSignature
rawHeader: string
}

interface RelayHop {
hopNumber: number
from: string
by: string
ip: string
protocol: string
timestamp: Date
delaySeconds: number
isPrivateIp: boolean
}

interface AuthResults {
spf: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none'
dkim: 'pass' | 'fail' | 'none'
dmarc: 'pass' | 'fail' | 'none'
spfDomain: string
dkimDomain: string
dkimSelector: string
}

interface DnsResults {
spf: {
record: string | null
mechanisms: string[]
result: 'pass' | 'fail' | 'softfail' | 'none'
trustability: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
}
dkim: {
record: string | null
keyExists: boolean
isRevoked: boolean
result: 'valid' | 'revoked' | 'not_found'
}
dmarc: {
record: string | null
policy: 'none' | 'quarantine' | 'reject' | null
alignment: { dkim: string; spf: string }
reportingConfigured: boolean
percentage: number
trustability: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
trustabilityScore: number
}
mx: {
records: string[]
hasMx: boolean
}
}

interface IPResult {
ip: string
hopNumber: number
country: string
city: string
lat: number
lon: number
isp: string
org: string
isProxy: boolean
isHosting: boolean
isTor: boolean
abuseScore: number
totalReports: number
lastReported: string | null
riskLevel: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS'
}

interface LinkResult {
url: string
domain: string
riskLevel: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS'
flags: string[]
isShortener: boolean
isIpBased: boolean
isSuspiciousTld: boolean
mismatchesFromDomain: boolean
}

interface SpoofDetectionResult {
riskScore: number
phishingProbability: number
verdict: 'SAFE' | 'SUSPICIOUS' | 'SPOOFED'
checks: SpoofCheck[]
}

interface SpoofCheck {
name: string
passed: boolean
severity: 'HIGH' | 'MEDIUM' | 'LOW'
detail: string
pointsAdded: number
}

interface AIVerdict {
verdict: 'SAFE' | 'SUSPICIOUS' | 'SPOOFED'
confidence: number
phishingProbability: number
oneLinerVerdict: string
summary: string
redFlags: { flag: string; severity: string; explanation: string }[]
trustIndicators: string[]
recommendations: { action: string; priority: string }[]
technicalBreakdown: {
spfAnalysis: string
dkimAnalysis: string
dmarcAnalysis: string
routingAnalysis: string
ipAnalysis: string
}
}

interface AnalysisResult {
parsedHeader: ParsedHeader
spoofDetection: SpoofDetectionResult
dnsResults: DnsResults
ipResults: IPResult[]
linkResults: LinkResult[]
aiVerdict: AIVerdict
analyzedAt: string
}

═══════════════════════════════════════════
🔑 ENVIRONMENT VARIABLES (.env.local)
═══════════════════════════════════════════

# AI (GPT OSS 120B)

OPENAI_API_KEY=your_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# IP Reputation

ABUSEIPDB_API_KEY=your_key_here

# App

NEXT_PUBLIC_APP_URL=http://localhost:3000

═══════════════════════════════════════════
📦 PACKAGES TO INSTALL
═══════════════════════════════════════════

npx create-next-app@latest mailhawk --typescript
--tailwind --eslint --app --src-dir=no

cd mailhawk

npx shadcn@latest init
npx shadcn@latest add button card tabs badge
sheet toast progress separator

npm install openai
npm install react-leaflet leaflet @types/leaflet
npm install @react-pdf/renderer
npm install recharts
npm install react-dropzone
npm install react-hot-toast
npm install lucide-react
npm install date-fns
npm install axios

═══════════════════════════════════════════
⚠️ CRITICAL IMPLEMENTATION NOTES
═══════════════════════════════════════════

1. RelayMap MUST use dynamic import with ssr:false:
   const Map = dynamic(() => import(
   '@/components/results/RelayMap'), { ssr: false })

2. sessionStorage key: "mailhawk_result"
   Store: JSON.stringify(AnalysisResult)
   Read: JSON.parse(sessionStorage.getItem(
   "mailhawk_result") || "{}")

3. /api/analyze runs ALL checks sequentially,
   returns single combined AnalysisResult object.
   Frontend makes ONE API call only.

4. DMARC trustability must show:
   - Policy level with color badge
   - Alignment strictness
   - Whether reporting is configured
   - Plain English explanation of what it means
   - Overall trustability score 0-100

5. PDF generation is server-side only.
   Pass full AnalysisResult as base64 query param.

6. All external API calls (ip-api, AbuseIPDB,
   Cloudflare DNS) happen server-side in API routes.
   Never call these from the browser directly.

7. Error handling: if any check fails (API down,
   DNS timeout etc.), return partial results
   with that check marked as "unavailable",
   never crash the whole analysis.

8. Loading terminal steps must match actual
   processing steps. Use Server-Sent Events or
   just fake the timing client-side (600ms per step)
   while the single /api/analyze call runs in parallel.

9. Mobile: results page cards go to single column
   at md breakpoint. Map height 300px on mobile.

10. The AI prompt must include the FULL analysis
    data so it can give accurate, specific verdicts
    rather than generic responses.
