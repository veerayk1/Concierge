import type { ReactNode } from 'react';

const BRAND_BULLETS = [
  'One login replaces the dozen your team juggles today.',
  'Packages, maintenance, security, amenities, parking, residents.',
  'Same data, same design, same product. Everything finally talks.',
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Brand Panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0A0A0A] p-12 lg:flex lg:w-[480px] xl:w-[560px] 2xl:w-[640px]">
        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 600px 480px at 50% 30%, rgba(201, 169, 110, 0.10), transparent 70%)',
          }}
        />
        {/* Subtle grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 85%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 85%)',
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background: 'rgba(201,169,110,0.12)',
              border: '1px solid rgba(201,169,110,0.25)',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4BA85"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-[18px] font-medium tracking-tight text-white">
            BuildingAutopilot
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          <h2
            className="text-[40px] leading-[1.05] font-light tracking-[-0.025em] text-white"
            style={{ letterSpacing: '-0.025em' }}
          >
            The last platform
            <br />
            your building{' '}
            <em className="font-light not-italic" style={{ color: '#D4BA85', fontStyle: 'italic' }}>
              will ever
            </em>{' '}
            need.
          </h2>
          <ul className="flex flex-col gap-3.5">
            {BRAND_BULLETS.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 text-[14px] leading-relaxed text-white/60"
              >
                <span
                  aria-hidden="true"
                  className="mt-[7px] inline-block h-[5px] w-[5px] shrink-0 rounded-full"
                  style={{ background: '#D4BA85' }}
                />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[12px] text-white/30">
          &copy; {new Date().getFullYear()} BuildingAutopilot. All rights reserved.
        </p>
      </div>

      {/* Right: Auth Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4BA85"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-[20px] font-semibold tracking-tight text-neutral-900">
            BuildingAutopilot
          </span>
        </div>

        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
