'use client';

/**
 * BuildingAutopilot — Immersive scroll experience (client shell).
 *
 * A tall scroll container drives a 0→1 progress value. That progress flies the 3D
 * camera (see ./scene) and fades a sequence of "automation" beats — each a real
 * product-UI card — over the live 3D building. Falls back to a static hero when
 * WebGL is unavailable or the user prefers reduced motion.
 */

import { useEffect, useRef, useState } from 'react';
import type { SceneHandle } from './scene';

interface Beat {
  start: number;
  end: number;
  eyebrow: string;
  title: string;
  body: string;
  card: React.ReactNode;
}

// Opacity for a beat given global progress: ease in over the first fifth of its
// range, hold, ease out over the last fifth.
function beatOpacity(p: number, start: number, end: number): number {
  if (p < start || p > end) return 0;
  const span = end - start;
  const local = (p - start) / span;
  const fade = 0.22;
  if (local < fade) return local / fade;
  if (local > 1 - fade) return (1 - local) / fade;
  return 1;
}

function Chip({
  children,
  tone = 'green',
}: {
  children: React.ReactNode;
  tone?: 'green' | 'brass';
}) {
  const cls =
    tone === 'green'
      ? 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30'
      : 'bg-[#c9a96e]/15 text-[#e3c993] ring-[#c9a96e]/30';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ${cls}`}
    >
      {children}
    </span>
  );
}

function AutopilotTag() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/70 uppercase ring-1 ring-white/10">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Autopilot
    </span>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[380px] max-w-[88vw] rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-white shadow-2xl backdrop-blur-xl">
      {children}
    </div>
  );
}

const BEATS: Beat[] = [
  {
    start: 0.18,
    end: 0.42,
    eyebrow: 'Front desk',
    title: 'It logs itself.',
    body: 'A package arrives. BuildingAutopilot captures it, files it to the right unit, and notifies the resident — before anyone reaches for a clipboard.',
    card: (
      <GlassCard>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-white/80">Package intake</span>
          <AutopilotTag />
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c9a96e]/20 text-lg">
            📦
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium">Amazon · 2 parcels</div>
            <div className="text-[12px] text-white/50">Unit 1204 · ref #PKG-4471</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <Chip>Resident notified ✓</Chip>
          <span className="text-white/40">just now</span>
        </div>
      </GlassCard>
    ),
  },
  {
    start: 0.46,
    end: 0.66,
    eyebrow: 'Maintenance',
    title: 'It dispatches itself.',
    body: 'A leak is reported. The right vendor is assigned, the clock starts, and the resident is kept in the loop — automatically.',
    card: (
      <GlassCard>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-white/80">Work order</span>
          <AutopilotTag />
        </div>
        <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/5">
          <div className="text-[14px] font-medium">Water leak · Unit 802</div>
          <div className="mt-1 text-[12px] text-white/50">
            Auto-routed by category · priority High
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4f7fff]/20 text-[11px]">
              RP
            </div>
            <span className="text-[12px] text-white/70">Rapid Plumbing Co.</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <Chip>Vendor en route</Chip>
          <span className="text-white/40">SLA 4h</span>
        </div>
      </GlassCard>
    ),
  },
  {
    start: 0.7,
    end: 0.9,
    eyebrow: 'Command view',
    title: 'One building. One glance.',
    body: 'Every system — packages, requests, amenities, security — running itself, surfaced in a single command view. You stay in command; the building runs on autopilot.',
    card: (
      <GlassCard>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-white/80">Today · Queensway Tower</span>
          <Chip>All systems ✓</Chip>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['12', 'packages cleared'],
            ['3', 'requests auto-routed'],
            ['5', 'bookings approved'],
            ['0', 'items need you'],
          ].map(([n, label]) => (
            <div key={label} className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/5">
              <div className="text-[20px] font-semibold text-[#e3c993]">{n}</div>
              <div className="text-[11px] text-white/50">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[12px] text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> On autopilot since 6:00 AM
        </div>
      </GlassCard>
    ),
  },
];

export function ImmersiveExperience() {
  const mountRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let webgl = false;
    try {
      const c = document.createElement('canvas');
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      webgl = false;
    }
    if (reduce || !webgl) {
      setFallback(true);
      setReady(true);
      return;
    }

    let handle: SceneHandle | null = null;
    let raf = 0;
    let disposed = false;

    import('./scene')
      .then(({ createScene }) => {
        if (disposed || !mountRef.current) return;
        handle = createScene(mountRef.current);
        setReady(true);

        const loop = () => {
          raf = requestAnimationFrame(loop);
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          const p = scrollable > 0 ? window.scrollY / scrollable : 0;
          handle?.setProgress(p);

          if (introRef.current) {
            introRef.current.style.opacity = String(Math.max(0, 1 - p / 0.12));
          }
          if (ctaRef.current) {
            ctaRef.current.style.opacity = String(beatOpacity(p, 0.9, 1.0));
          }
          BEATS.forEach((b, i) => {
            const el = beatRefs.current[i];
            if (!el) return;
            const o = beatOpacity(p, b.start, b.end);
            el.style.opacity = String(o);
            el.style.transform = `translateY(${(1 - o) * 24}px)`;
          });
        };
        loop();
      })
      .catch(() => {
        setFallback(true);
        setReady(true);
      });

    const onResize = () => handle?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      handle?.dispose();
    };
  }, []);

  if (fallback) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#06070a] px-6 text-center text-white">
        <p className="mb-3 text-[12px] font-semibold tracking-[0.2em] text-[#c9a96e] uppercase">
          Building Management, on Autopilot
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          BuildingAutopilot
        </h1>
        <p className="mt-4 max-w-md text-white/60">
          The immersive experience needs a modern browser with motion enabled. Everything you need
          to run your building — packages, maintenance, amenities, security — on autopilot.
        </p>
      </main>
    );
  }

  return (
    <div className="relative bg-[#06070a]">
      {/* Fixed 3D canvas */}
      <div ref={mountRef} className="fixed inset-0 z-0 h-screen w-screen" aria-hidden="true" />

      {/* Loader */}
      <div
        className={`fixed inset-0 z-30 flex items-center justify-center bg-[#06070a] transition-opacity duration-700 ${
          ready ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#c9a96e]" />
          <p className="text-[13px] tracking-[0.2em] text-white/50 uppercase">Preparing flight</p>
        </div>
      </div>

      {/* Fixed overlay beats (driven imperatively by scroll) */}
      <div className="pointer-events-none fixed inset-0 z-10">
        {/* Intro */}
        <div
          ref={introRef}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white"
        >
          <p className="mb-4 text-[12px] font-semibold tracking-[0.25em] text-[#c9a96e] uppercase">
            Building Management, on Autopilot
          </p>
          <h1 className="max-w-4xl text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
            Engage autopilot.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] text-white/55">
            Scroll to step inside a building that runs itself.
          </p>
          <div className="mt-12 animate-bounce text-white/40">↓</div>
        </div>

        {/* Automation beats */}
        {BEATS.map((b, i) => (
          <div
            key={b.title}
            ref={(el) => {
              beatRefs.current[i] = el;
            }}
            className="absolute inset-0 flex items-center opacity-0"
            style={{ justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}
          >
            <div className="mx-[6vw] max-w-md text-white">
              <p className="mb-3 text-[12px] font-semibold tracking-[0.2em] text-[#c9a96e] uppercase">
                {b.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{b.title}</h2>
              <p className="mt-3 mb-6 text-[15px] leading-relaxed text-white/55">{b.body}</p>
              {b.card}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div
          ref={ctaRef}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white opacity-0"
        >
          <h2 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Your building, on autopilot.
          </h2>
          <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/demo"
              className="rounded-full bg-[#c9a96e] px-7 py-3 text-[15px] font-semibold text-[#1a1407] transition hover:bg-[#d8bd86]"
            >
              Request a demo
            </a>
            <a
              href="/"
              className="rounded-full px-7 py-3 text-[15px] font-medium text-white/70 ring-1 ring-white/20 transition hover:text-white"
            >
              Back to site
            </a>
          </div>
        </div>
      </div>

      {/* Tall scroll track — drives progress (600vh = 5 full screens of travel) */}
      <div className="relative z-0 h-[600vh] w-full" />
    </div>
  );
}
