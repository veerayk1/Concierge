'use client';

/**
 * Custom Cursor — Brass circle that scales on interactive elements.
 * Desktop only. Hidden on touch devices.
 */

import { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Disable on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
    // Disable if reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setVisible(true);
    const cursor = cursorRef.current;
    if (!cursor) return;

    let x = 0;
    let y = 0;
    let currentX = 0;
    let currentY = 0;

    function onMouseMove(e: MouseEvent) {
      x = e.clientX;
      y = e.clientY;
    }

    function animate() {
      // Smooth follow
      currentX += (x - currentX) * 0.15;
      currentY += (y - currentY) * 0.15;
      if (cursor) {
        cursor.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%) scale(${hovering ? 2.5 : 1})`;
      }
      requestAnimationFrame(animate);
    }

    function onMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[role="tab"]') ||
        target.closest('[role="button"]')
      ) {
        setHovering(true);
      }
    }

    function onMouseOut(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[role="tab"]') ||
        target.closest('[role="button"]')
      ) {
        setHovering(false);
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
    };
  }, [hovering]);

  if (!visible) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        border: '1px solid #C9A96E',
        background: hovering ? 'rgba(201, 169, 110, 0.1)' : 'transparent',
        pointerEvents: 'none',
        zIndex: 99999,
        mixBlendMode: 'difference',
        transition: 'width 200ms ease, height 200ms ease, background 200ms ease',
        willChange: 'transform',
      }}
    />
  );
}
