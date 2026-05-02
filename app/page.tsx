import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeatureBadges from "@/components/home/FeatureBadges";
import InputTabs from "@/components/home/InputTabs";

const FEATURES = [
  {
    icon: "🔍",
    title: "Header Parsing",
    desc: "Extracts From, To, Subject, relay hops, authentication results, DKIM signature and all standard fields.",
  },
  {
    icon: "🛡️",
    title: "Spoof Detection",
    desc: "Runs 13+ spoof checks including domain mismatch, display name impersonation and authentication failures.",
  },
  {
    icon: "🌍",
    title: "IP Geolocation",
    desc: "Geolocates every relay hop, shows ISP info and flags proxies, Tor nodes and hosting providers.",
  },
  {
    icon: "📋",
    title: "DNS Forensics",
    desc: "Checks SPF, DKIM and DMARC records in real-time via Cloudflare DNS. Shows trustability ratings.",
  },
  {
    icon: "🔗",
    title: "Link Analysis",
    desc: "Extracts and analyzes URLs for shorteners, IP-based URLs, lookalike domains and homograph attacks.",
  },
  {
    icon: "🤖",
    title: "AI Verdict",
    desc: "GPT-powered forensic analysis gives red flags, trust indicators, recommendations and technical breakdown.",
  },
];

const STEPS = [
  { step: "01", title: "Paste or upload", desc: "Copy the raw email header from your email client (View Source), paste it, or drop a .eml file." },
  { step: "02", title: "Click Analyze", desc: "MailHawk runs all forensic checks — DNS, IP reputation, AI analysis — in seconds." },
  { step: "03", title: "Read the verdict", desc: "Get a clear SAFE / SUSPICIOUS / SPOOFED verdict with detailed breakdown and recommendations." },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="bg-hawk-bg">
        <HeroSection>
          <FeatureBadges />
          <InputTabs />
        </HeroSection>

        
        <section id="features" className="bg-hawk-bg-alt py-24 px-6">
          <div className="max-w-275 mx-auto">
            
            <div className="text-center mb-14">
              <p className="font-mono text-[0.68rem] tracking-[0.14em] uppercase text-hawk-green mb-[0.85rem]">
                — What MailHawk Does
              </p>
              <h2 className="font-serif text-[clamp(2rem,5vw,3.2rem)] font-normal text-hawk-text leading-[1.15] m-0">
                Email forensics, <em className="text-hawk-green">simplified</em>
              </h2>
              <p className="font-sans text-[0.95rem] text-hawk-muted max-w-120 mx-auto mt-4 leading-[1.6]">
                Paste any email header and get a full forensic breakdown in seconds.
                No account needed. No data stored.
              </p>
            </div>

            
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-px bg-hawk-border border border-hawk-border rounded-none overflow-hidden">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="hover:bg-hawk-card-hover transition-colors duration-150 bg-hawk-card py-8 px-7"
                >
                  <div className="text-[1.6rem] mb-4">{f.icon}</div>
                  <h3 className="font-mono text-[0.72rem] font-bold tracking-[0.12em] uppercase text-hawk-green mb-[0.6rem]">
                    {f.title}
                  </h3>
                  <p className="font-sans text-[0.85rem] text-hawk-muted leading-[1.6] m-0">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        
        <section id="how-it-works" className="bg-hawk-bg py-24 px-6">
          <div className="max-w-225 mx-auto">
            <div className="text-center mb-14">
              <p className="font-mono text-[0.68rem] tracking-[0.14em] uppercase text-hawk-green mb-[0.85rem]">
                — Quick Start
              </p>
              <h2 className="font-serif text-[clamp(2rem,4.5vw,2.8rem)] font-normal text-hawk-text leading-[1.15] m-0">
                Three steps to <em className="text-hawk-green">clarity</em>
              </h2>
            </div>

            <div className="flex flex-col md:flex-row gap-px bg-hawk-border border border-hawk-border rounded-none overflow-hidden">
              {STEPS.map((s) => (
                <div
                  key={s.step}
                  className="flex-1 bg-hawk-card py-8 px-7 relative"
                >
                  <div className="absolute top-4 right-5 font-mono text-[3.5rem] font-bold text-hawk-border leading-none select-none">
                    {s.step}
                  </div>
                  <div className="w-7 h-7 rounded-none bg-[rgba(170,255,69,0.12)] border border-[rgba(170,255,69,0.3)] flex items-center justify-center mb-4">
                    <span className="font-mono text-[0.65rem] font-bold text-hawk-green">{s.step}</span>
                  </div>
                  <h3 className="font-mono text-[0.8rem] font-bold text-hawk-text mb-2 tracking-[0.04em]">
                    {s.title}
                  </h3>
                  <p className="font-sans text-[0.83rem] text-hawk-muted m-0 leading-[1.55]">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
