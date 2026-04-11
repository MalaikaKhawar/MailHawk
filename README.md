<div align="center">
  <h1>🦅 MailHawk</h1>
  <p><b>AI-Powered Email Forensics & Phishing Detection Engine</b></p>
</div>

MailHawk is a next-generation cybersecurity tool that automates the deep forensic analysis of email headers. By combining DNS record verification, IP reputation tracking, heuristic link analysis, and parallel generative AI, MailHawk instantly unpacks raw email headers to detect sophisticated spoofing attempts, suspicious routing anomalies, and massive phishing campaigns.

---

> **Academic Project**  
> **Course:** Cybersecurity Semester Project  
> **Institution:** University of Punjab, Lahore  
> **Student:** Malaika Yasmeen Khawar  
> **Roll Number:** BITF22M525
>
> _“I developed this project to gain extensive, hands-on experience in the field of defensive cybersecurity. My ultimate goal was to build a robust tool capable of catching highly deceptive emails and uncovering massive phishing campaigns. Creating MailHawk allowed me to turn theoretical concepts into a practical, automated threat detection solution—significantly enhancing my skills in forensic analysis, network communication, and AI-driven security investigations.”_

---

## 🔥 Key Features

- **Instant Header Parsing:** Extracts `From`, `To`, `Subject`, `Message-ID`, `Return-Path`, and constructs a complete timeline of all intermediate relay hops in milliseconds.
- **Advanced Spoof Detection:** Runs 13+ rigorous forensic checks including domain origin mismatch, display name impersonation, and implicit authentication failures.
- **DNS Forensic Verification:** Dynamically queries global DNS networks to validate SPF declarations, DKIM public cryptographic keys, and DMARC enforcement policies in real-time.
- **Relay Geolocation & IP Reputation:** Traces the entire origin route of the email, pinpointing physical locations of hops and heavily penalizing TOR exit nodes, open proxies, and known botnet IPs.
- **Parallel AI Threat Analysis:** Deploys a highly optimized concurrent LLM architecture. Task A assesses every extracted URL for obfuscation techniques, while Task B evaluates the email’s semantic social engineering payload.
- **Dynamic Composite Trust Score:** Mathematically blends raw heuristic data, DNS validation integers, and AI confidence parameters to assign the payload a strict `0-100%` security rating.
- **Forensic PDF Export:** Rapidly generates high-fidelity PDF reports of the dashboard for offline archival, incident response logging, and chain-of-custody documentation.
- **Real-time Persistence:** Asynchronously fires intelligence logs into a Firebase Realtime Database for historical platform tracking without slowing down user analysis.

## 🛠️ Technology Stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS v4, Lucide-React
- **Backend Architecture:** Serverless Node.js Route Handlers
- **Datastore:** Firebase Realtime Database
- **AI Orchestration:** OpenAI API (Configurable to Groq / compatible LLMs)
- **Utilities:** `dns/promises` (Native resolution), `jspdf` & `html2canvas` (Client-side reporting)

## ⚡ How It Works (The Pipeline)

1. **Input Payload:** Users paste the raw `.eml` header source code or upload the `.eml` file directly into the MailHawk interface.
2. **Heuristic Pre-Scan:** The Node.js regex engine instantly extracts origin domains, routing chains, and embedded URLs locally before making any network calls.
3. **Parallel Processing Execution:** MailHawk avoids long processing times by utilizing `Promise.all()` to simultaneously fire requests to:
   - External DNS providers for Auth queries.
   - IP Intelligence APIs for Hop mapping.
   - The LLM for batch AI URL classification.
   - The LLM for overall forensic text sentiment analysis.
4. **Verdict Generation:** Output promises resolve and feed into the Trust Algorithm, projecting a beautifully rendered UI verdict containing technical tracking information, an interactive risk gauge, and plain-English recommendations.

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/MalaikaKhawar/MailHawk.git
cd mailhawk
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory and supply your LLM keys:

```env
OPENAI_API_KEY=your_ai_api_key_here
# MailHawk can optionally be rerouted to lightning-fast models like Groq
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

### 4. Run the Platform

```bash
npm run dev
```

Navigate to `http://localhost:3000` to launch the MailHawk interface.

---

_Developed at Punjab University Lahore for the advancement of practical cybersecurity education._
