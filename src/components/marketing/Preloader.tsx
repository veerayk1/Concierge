'use client';

/**
 * Preloader — Sets the tone before the page loads.
 * Shows "Concierge" wordmark with an expanding line, then slides up.
 * Only shows on initial page load (sessionStorage check).
 */

import { useEffect, useState } from 'react';

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    // Don't show preloader on subsequent visits
    if (typeof window !== 'undefined' && sessionStorage.getItem('concierge-loaded')) {
      setSkip(true);
      setVisible(false);
      return;
    }

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const timer = setTimeout(
      () => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          sessionStorage.setItem('concierge-loaded', '1');
        }, 600);
      },
      prefersReducedMotion ? 200 : 1800
    );

    return () => clearTimeout(timer);
  }, []);

  if (skip || !visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A0A',
        transform: exiting ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Wordmark */}
      <span
        style={{
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          fontSize: '2rem',
          fontWeight: 300,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          marginBottom: '1.5rem',
        }}
      >
        Concierge
      </span>

      {/* Expanding line */}
      <div
        style={{
          width: '120px',
          height: '1px',
          background: 'rgba(255,255,255,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: '#C9A96E',
            animation: 'preloaderLine 1.5s ease-out forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes preloaderLine {
          0% { width: 0%; left: 50%; transform: translateX(-50%); }
          100% { width: 100%; left: 0%; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
