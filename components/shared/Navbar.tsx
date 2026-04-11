"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ExternalLink, Menu } from "lucide-react";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "https://github.com", label: "GitHub ↗", external: true },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-hawk-border bg-hawk-bg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded-none bg-hawk-green flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-hawk-bg" />
            </div>
            <span className="font-mono text-base font-bold text-hawk-text tracking-[0.02em]">
              Mail<span className="text-hawk-green">Hawk</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="font-sans text-[0.8rem] font-medium text-hawk-muted no-underline transition-colors duration-150 tracking-[0.03em] hover:text-hawk-text"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="btn-hawk hidden sm:inline-flex text-[0.7rem] py-[0.45rem] px-4"
            >
              ▶ Analyze Email
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-[0.4rem] bg-transparent border border-hawk-border rounded-none text-hawk-muted cursor-pointer"
              aria-label="Toggle menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-hawk-border bg-hawk-bg pt-4 px-6 pb-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="block py-[0.6rem] font-mono text-[0.8rem] text-hawk-muted no-underline border-b border-hawk-border"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="btn-hawk mt-4 w-full justify-center text-[0.75rem]"
          >
            ▶ Analyze Email
          </Link>
        </div>
      )}
    </header>
  );
}
