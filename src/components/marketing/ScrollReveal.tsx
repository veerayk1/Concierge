'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
}

export function ScrollReveal({
  children,
  className = '',
  style,
  delay = 0,
  direction = 'up',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }

    // Set initial transform based on direction
    const transformMap = {
      up: 'translateY(18px)',
      left: 'translateX(-18px)',
      right: 'translateX(18px)',
    } as const;

    el.style.opacity = '0';
    el.style.transform = transformMap[direction];
    el.style.transition = [
      `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      `transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    ].join(', ');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0) translateX(0)';
          observer.unobserve(el);
        }
      },
      // Fire as soon as the element starts entering, plus a bottom-margin
      // pre-trigger, so content is never sitting dim/blank when it reaches view.
      { threshold: 0.01, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [delay, direction]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
