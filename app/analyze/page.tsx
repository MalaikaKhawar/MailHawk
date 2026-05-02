"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/types";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import VerdictBanner from "@/components/results/VerdictBanner";
import HeaderMetaCard from "@/components/results/HeaderMetaCard";
import RiskGauge from "@/components/results/RiskGauge";
import PhishingProbability from "@/components/results/PhishingProbability";
import SPFCard from "@/components/results/SPFCard";
import DKIMCard from "@/components/results/DKIMCard";
import DMARCCard from "@/components/results/DMARCCard";
import RelayTimeline from "@/components/results/RelayTimeline";
import IPReputationCard from "@/components/results/IPReputationCard";
import LinkAnalysisCard from "@/components/results/LinkAnalysisCard";
import AIVerdictCard from "@/components/results/AIVerdictCard";
import AIChat from "@/components/results/AIChat";
import DownloadReport from "@/components/results/DownloadReport";
import dynamic from "next/dynamic";
const RelayMap = dynamic(() => import("@/components/results/RelayMap"), { ssr: false });

export default function AnalyzePage() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const router = useRouter();

  useEffect(() => {
    const raw = sessionStorage.getItem("mailhawk_result");
    if (!raw) {
      router.push("/");
      return;
    }
    try {
      setData(JSON.parse(raw));
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!data) {
    return (
      <div className="min-h-screen bg-hawk-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-hawk-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { parsedHeader: ph, spoofDetection: sd, dnsResults, ipResults, linkResults, aiVerdict: ai } = data;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen pb-20">
        <VerdictBanner data={data} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1"><RiskGauge score={sd.riskScore} /></div>
            <div className="lg:col-span-1"><PhishingProbability probability={ai?.phishingProbability ?? sd.phishingProbability} /></div>
            <div className="lg:col-span-1 h-full"><DownloadReport data={data} /></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
              
              {ai && (
                <section>
                  <AIVerdictCard verdict={ai} />
                </section>
              )}

              
              <section>
                <h2 className="text-xl font-mono font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-hawk-green">▸</span> Email Authentication
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <SPFCard spf={dnsResults?.spf || { record: null, mechanisms: [], result: "none", trustability: "NONE", explanation: "No data." }} fromResult={ph.authResults.spf as never} />
                  <DKIMCard dkim={dnsResults?.dkim || { record: null, keyExists: false, isRevoked: false, result: "not_found", explanation: "No data." }} fromResult={ph.authResults.dkim} domain={ph.dkimSignature?.domain || ""} selector={ph.dkimSignature?.selector || ""} algorithm={ph.dkimSignature?.algorithm} />
                </div>
                <div className="grid grid-cols-1">
                  <DMARCCard dmarc={dnsResults?.dmarc || { record: null, policy: null, alignment: { dkim: "relaxed", spf: "relaxed" }, reportingConfigured: false, percentage: 100, trustability: "NONE", trustabilityScore: 0, explanation: "No data." }} fromResult={ph.authResults.dmarc} />
                </div>
              </section>

              
              <section>
                <h2 className="text-xl font-mono font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-hawk-green">▸</span> Routing Infrastructure
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  <RelayMap ipResults={ipResults} />
                  <RelayTimeline hops={ph.relayHops} ipResults={ipResults} />
                </div>
              </section>
            </div>

            
            <div className="space-y-8">
              
              {ai && <AIChat data={data} />}

              
              <HeaderMetaCard header={ph} />

              
              <LinkAnalysisCard links={linkResults} />

              
              <IPReputationCard ipResults={ipResults} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
