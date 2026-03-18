import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Brand Panel */}
      <div className="hidden flex-col justify-between bg-neutral-900 p-12 lg:flex lg:w-[480px] xl:w-[560px] 2xl:w-[640px]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-[20px] font-semibold tracking-tight text-white">Concierge</span>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="text-[32px] leading-[1.2] font-bold tracking-tight text-white">
            Building management,
            <br />
            <span className="text-primary-400">reimagined.</span>
          </h2>
          <p className="max-w-[400px] text-[16px] leading-relaxed text-neutral-400">
            The modern platform for property managers, security teams, and residents. Everything
            your building needs, beautifully unified.
          </p>
        </div>

        <p className="text-[13px] text-neutral-600">
          &copy; {new Date().getFullYear()} Concierge. All rights reserved.
        </p>
      </div>

      {/* Right: Auth Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo — only shows below lg */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <div className="bg-primary-500 flex h-9 w-9 items-center justify-center rounded-xl">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-[20px] font-bold tracking-tight text-neutral-900">Concierge</span>
        </div>

        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
