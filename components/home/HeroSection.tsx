"use client";

import { useEffect, useRef } from "react";

export default function HeroSection({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = { x: number; y: number; vx: number; vy: number; size: number; opacity: number; life: number; maxLife: number; };
    const particles: Particle[] = [];
    const MAX = 55;

    const spawn = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.6 - 0.1,
      size: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.45 + 0.1,
      life: 0,
      maxLife: Math.random() * 220 + 120,
    });

    for (let i = 0; i < MAX; i++) particles.push(spawn());

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle grid
      ctx.strokeStyle = "rgba(170,255,69,0.025)";
      ctx.lineWidth = 1;
      const g = 90;
      for (let x = 0; x < canvas.width; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life++;
        const alpha = p.opacity * (1 - p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(170,255,69,${alpha})`;
        ctx.fill();
        if (p.life >= p.maxLife) particles[i] = spawn();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-14 bg-hawk-bg">
      {/* Canvas bg */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" aria-hidden />

      {/* Radial glow overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,rgba(170,255,69,0.05)_0%,transparent_70%)]" aria-hidden />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[900px] mx-auto mt-24 px-6 text-center">
        {/* Eyebrow pill */}
        <div className="mx-auto mb-6 w-fit animate-[slide-up_0.4s_ease_forwards] bg-hawk-card flex items-center gap-2 py-2 px-4 font-mono">
          <span className="animate-pulse w-2 h-2 rounded-full bg-hawk-green block" />
          <span className="text-hawk-text text-[0.85rem] tracking-[0.02em]">AI-Powered Email Forensics</span>
        </div>

        {/* Big title */}
        <h1 className="font-serif text-[clamp(3.5rem,9vw,7rem)] font-normal leading-[1.08] tracking-[-0.01em] text-hawk-text mb-4">
          Mail<span className="glow-text italic text-hawk-green">Hawk</span>
        </h1>

        {/* Sub-headline */}
        <p className="font-sans text-[1.05rem] text-hawk-muted max-w-[560px] mx-auto mb-10 leading-[1.65]">
          Analyze email headers. Detect spoofing and phishing. Investigate relay
          hops. Powered by AI, DNS forensics, and IP reputation data.
        </p>

        {children}
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-[160px] pointer-events-none bg-[linear-gradient(to_bottom,transparent,var(--hawk-bg))]" aria-hidden />
    </section>
  );
}
