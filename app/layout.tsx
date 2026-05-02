import type { Metadata } from "next";
import { Instrument_Serif, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "MailHawk - Email Header Forensics & AI Spoof Detection",
  description:
    "Analyze email headers instantly. Detect phishing, spoofing, and email fraud with AI-powered forensics. No login required.",
  keywords: [
    "email forensics",
    "spoof detection",
    "phishing analysis",
    "DKIM SPF DMARC",
    "email header analyzer",
    "AI email security",
  ],
  openGraph: {
    title: "MailHawk - Email Forensics & Spoof Detection",
    description:
      "AI-powered email header analysis. Detect spoofing, phishing and fraud in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSerif.variable} ${dmMono.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-hawk-bg text-hawk-text font-sans">
        {children}
      </body>
    </html>
  );
}
