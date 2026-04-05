'use client';

import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          if (prefersReducedMotion) {
            setValue(target);
            return;
          }

          const start = performance.now();

          function animate(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic deceleration: 1 - (1 - t)^3
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          }

          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, value };
}
