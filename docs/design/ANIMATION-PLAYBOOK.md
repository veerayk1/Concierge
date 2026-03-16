# Concierge — Animation Playbook

> Comprehensive motion specification targeting Paris Design Awards.
> Every animation defined here serves a purpose: communicate state, guide attention, or confirm action.
> Decorative motion is forbidden. Every frame earns its render cycle.

---

## Table of Contents

1. [Foundation Principles](#1-foundation-principles)
2. [Global Configuration](#2-global-configuration)
3. [Page Transitions](#3-page-transitions)
4. [Toast Notifications](#4-toast-notifications)
5. [Card Interactions](#5-card-interactions)
6. [Table Rows](#6-table-rows)
7. [Sidebar](#7-sidebar)
8. [Modal / Dialog](#8-modal--dialog)
9. [Form Elements](#9-form-elements)
10. [Status Changes](#10-status-changes)
11. [Loading](#11-loading)
12. [Gesture](#12-gesture)
13. [Animation Orchestration](#13-animation-orchestration)
14. [Performance Guidelines](#14-performance-guidelines)
15. [Accessibility — prefers-reduced-motion](#15-accessibility--prefers-reduced-motion)
16. [Testing Protocol](#16-testing-protocol)

---

## 1. Foundation Principles

### 1.1 Motion Philosophy

Motion in Concierge follows three rules derived from the design system:

1. **Purposeful** — Every animation communicates a state change, spatial relationship, or user confirmation. If removing the animation loses no information, remove it.
2. **Fast** — No animation exceeds 400ms perceived duration. Most complete under 300ms. Users must never wait for the UI.
3. **Physical** — Interactive elements use spring physics (mass, stiffness, damping) to feel tangible. Opacity and color use tween easing for smoothness.

### 1.2 When to Animate

| Scenario | Animate? | Reason |
|----------|----------|--------|
| User navigates between pages | Yes | Spatial continuity |
| Data loads for the first time | Yes | Progressive reveal reduces perceived load time |
| Status changes (e.g., Open to Released) | Yes | Draws attention to the change |
| User hovers a card | Yes | Confirms interactivity |
| User clicks a button | Yes | Tactile feedback |
| Decorative background effect | **No** | Violates "color only for meaning" principle |
| Looping ambient animation | **No** | Distracting in a work tool |
| Scroll-triggered parallax on desktop | **No** | Unnecessary in a data-dense management portal |

### 1.3 Spring Physics Reference

All interactive animations use spring physics. The table below defines the three spring profiles used throughout the system.

| Profile | Stiffness | Damping | Mass | Character | Used For |
|---------|-----------|---------|------|-----------|----------|
| **Snappy** | 400 | 30 | 1 | Crisp, no overshoot | Button press, toggle, checkbox |
| **Responsive** | 300 | 25 | 1 | Slight overshoot (1-2px) | Sidebar indicator, card hover, dropdown |
| **Gentle** | 200 | 20 | 1 | Visible overshoot (3-5px) | Modal open, page enter, toast slide |

### 1.4 Tween Easing Reference

Opacity and color transitions use cubic-bezier easing, never springs.

| Name | Cubic Bezier | Duration | Used For |
|------|-------------|----------|----------|
| **Fade In** | [0.0, 0.0, 0.2, 1.0] | 200ms | Content appearing |
| **Fade Out** | [0.4, 0.0, 1.0, 1.0] | 150ms | Content disappearing |
| **Ease Out** | [0.0, 0.0, 0.2, 1.0] | 200-300ms | Entering elements |
| **Ease In** | [0.4, 0.0, 1.0, 1.0] | 100-150ms | Exiting elements |
| **Ease In Out** | [0.4, 0.0, 0.2, 1.0] | 200ms | Symmetric transitions (sidebar width) |

---

## 2. Global Configuration

### 2.1 Shared Motion Tokens

```tsx
// src/lib/motion-tokens.ts

export const springSnappy = { type: "spring" as const, stiffness: 400, damping: 30 };
export const springResponsive = { type: "spring" as const, stiffness: 300, damping: 25 };
export const springGentle = { type: "spring" as const, stiffness: 200, damping: 20 };

export const easeFadeIn = { duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] };
export const easeFadeOut = { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] };
export const easeOut = { duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] };
export const easeIn = { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] };
export const easeInOut = { duration: 0.2, ease: [0.4, 0.0, 0.2, 1.0] };

export const staggerChildren = 0.03; // 30ms between children
export const staggerMax = 10; // Never stagger more than 10 items
```

### 2.2 Reduced Motion Hook

```tsx
// src/hooks/useReducedMotion.ts

import { useReducedMotion as useMotionReducedMotion } from "motion/react";

export function useAnimationConfig() {
  const shouldReduce = useMotionReducedMotion();

  return {
    shouldReduce,
    // Returns instant opacity-only transitions when reduced motion is preferred
    transition: (config: object) =>
      shouldReduce ? { duration: 0 } : config,
    variants: (full: object, reduced?: object) =>
      shouldReduce ? (reduced ?? { opacity: 1 }) : full,
  };
}
```

### 2.3 Import Convention

All components import from `"motion/react"` (the 2026 package path):

```tsx
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
```

---

## 3. Page Transitions

### 3.1 Page Enter

```
Animation Name: page-enter
Trigger: Route change — new page mounts into the content area
Motion Config:
  initial: { opacity: 0, y: 8 }
  animate: { opacity: 1, y: 0 }
  transition: { duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] }
Duration: 250ms
CSS Fallback: opacity: 0 → 1 instantly (duration: 0)
```

```tsx
import { motion } from "motion/react";

export function PageEnter({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] }}
    >
      {children}
    </motion.div>
  );
}
```

### 3.2 Page Exit

```
Animation Name: page-exit
Trigger: Route change — current page unmounts
Motion Config:
  exit: { opacity: 0, y: -8 }
  transition: { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] }
Duration: 150ms
CSS Fallback: opacity: 1 → 0 instantly (duration: 0)
```

```tsx
import { motion, AnimatePresence } from "motion/react";

export function PageTransitionWrapper({
  pageKey,
  children,
}: {
  pageKey: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### 3.3 Between-Tab Transition

```
Animation Name: tab-switch
Trigger: User clicks a horizontal tab within a page (e.g., Settings tabs, Unit detail tabs)
Motion Config:
  initial: { opacity: 0, x: direction * 16 }
  animate: { opacity: 1, x: 0 }
  exit: { opacity: 0, x: direction * -16 }
  transition: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }
Duration: 200ms
CSS Fallback: instant opacity swap (duration: 0)
```

The `direction` is +1 when switching to a tab to the right, -1 when switching left. This provides directional spatial context.

```tsx
import { motion, AnimatePresence } from "motion/react";

export function TabContent({
  tabKey,
  direction,
  children,
}: {
  tabKey: string;
  direction: 1 | -1;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, x: direction * 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -16 }}
        transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### 3.4 Between-Module Transition

```
Animation Name: module-switch
Trigger: User clicks a different module in the sidebar (e.g., Events → Packages)
Motion Config:
  initial: { opacity: 0, scale: 0.98 }
  animate: { opacity: 1, scale: 1 }
  exit: { opacity: 0, scale: 0.98 }
  transition: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }
Duration: 200ms
CSS Fallback: instant opacity swap (duration: 0)
```

Module transitions use scale instead of directional slide because modules have no spatial ordering (unlike tabs).

```tsx
import { motion, AnimatePresence } from "motion/react";

export function ModuleTransition({
  moduleKey,
  children,
}: {
  moduleKey: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={moduleKey}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 4. Toast Notifications

### 4.1 Toast Slide-In

```
Animation Name: toast-slide-in
Trigger: A notification fires (package logged, visitor arrived, error occurred)
Motion Config:
  initial: { opacity: 0, x: 80, scale: 0.95 }
  animate: { opacity: 1, x: 0, scale: 1 }
  transition: { type: "spring", stiffness: 200, damping: 20 }
Duration: ~350ms (spring settles)
CSS Fallback: opacity: 0 → 1 instantly
```

```tsx
import { motion } from "motion/react";

export function ToastSlideIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      role="alert"
      aria-live="polite"
    >
      {children}
    </motion.div>
  );
}
```

### 4.2 Toast Content Expand

```
Animation Name: toast-expand
Trigger: User clicks the chevron to expand toast details
Motion Config:
  initial: { height: 0, opacity: 0 }
  animate: { height: "auto", opacity: 1 }
  transition: { height: { type: "spring", stiffness: 300, damping: 25 }, opacity: { duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] } }
Duration: ~250ms
CSS Fallback: instant show/hide (duration: 0)
```

```tsx
import { motion, AnimatePresence } from "motion/react";

export function ToastExpandable({
  isExpanded,
  children,
}: {
  isExpanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { type: "spring", stiffness: 300, damping: 25 },
            opacity: { duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] },
          }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 4.3 Toast Dismiss

```
Animation Name: toast-dismiss
Trigger: Auto-dismiss timer expires OR user clicks dismiss
Motion Config:
  exit: { opacity: 0, x: 80, scale: 0.95 }
  transition: { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] }
Duration: 150ms
CSS Fallback: instant hide (duration: 0)
```

```tsx
import { motion } from "motion/react";

// Used within AnimatePresence wrapping the toast list
export const toastDismissVariants = {
  exit: { opacity: 0, x: 80, scale: 0.95 },
};

export const toastDismissTransition = {
  duration: 0.15,
  ease: [0.4, 0.0, 1.0, 1.0],
};
```

### 4.4 Toast Stack Reorder

```
Animation Name: toast-stack
Trigger: A toast is dismissed, causing remaining toasts to reposition
Motion Config:
  layout: true
  transition: { type: "spring", stiffness: 300, damping: 25 }
Duration: ~200ms (spring settles)
CSS Fallback: instant reposition (no layout animation)
```

```tsx
import { motion, LayoutGroup } from "motion/react";

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <LayoutGroup>
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ marginBottom: 8 }}
          >
            <ToastContent toast={toast} />
          </motion.div>
        ))}
      </div>
    </LayoutGroup>
  );
}
```

### 4.5 Toast Error Shake

```
Animation Name: toast-error-shake
Trigger: An error toast appears (failed notification, API error)
Motion Config:
  animate: { x: [0, -6, 6, -4, 4, -2, 2, 0] }
  transition: { duration: 0.4, ease: "easeInOut" }
Duration: 400ms
CSS Fallback: no shake, opacity-only appear
```

The shake runs ONCE after the slide-in completes, drawing attention to the error.

```tsx
import { motion, useAnimate } from "motion/react";
import { useEffect } from "react";

export function ToastErrorShake({ children }: { children: React.ReactNode }) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate(scope.current, { x: [0, -6, 6, -4, 4, -2, 2, 0] }, { duration: 0.4, ease: "easeInOut" });
  }, [animate, scope]);

  return <motion.div ref={scope}>{children}</motion.div>;
}
```

### 4.6 Toast Success Pulse

```
Animation Name: toast-success-pulse
Trigger: A success toast appears (package logged, maintenance resolved)
Motion Config:
  Icon container:
    animate: { scale: [1, 1.15, 1] }
    transition: { duration: 0.4, ease: [0.0, 0.0, 0.2, 1.0] }
  Pulse ring:
    initial: { scale: 1, opacity: 0.6 }
    animate: { scale: 1.8, opacity: 0 }
    transition: { duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0] }
Duration: 500ms (ring dissipates)
CSS Fallback: no pulse, static icon
```

```tsx
import { motion } from "motion/react";

export function ToastSuccessIcon() {
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      {/* Pulse ring */}
      <motion.div
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0] }}
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          backgroundColor: "#047857",
        }}
      />
      {/* Icon */}
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1.0] }}
      >
        <CheckCircleIcon size={20} color="#047857" />
      </motion.div>
    </div>
  );
}
```

---

## 5. Card Interactions

### 5.1 Card Hover Lift

```
Animation Name: card-hover-lift
Trigger: Mouse enters a clickable card (event card, stat card, package card)
Motion Config:
  whileHover: { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)" }
  transition: { type: "spring", stiffness: 300, damping: 25 }
Duration: ~200ms (spring settles)
CSS Fallback: no transform, background-color change only
```

The lift is exactly 2px — enough to feel responsive without being dramatic.

```tsx
import { motion } from "motion/react";

export function HoverCard({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={onClick}
      style={{
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </motion.div>
  );
}
```

### 5.2 Card Active Press

```
Animation Name: card-active-press
Trigger: Mouse down on a clickable card
Motion Config:
  whileTap: { scale: 0.98 }
  transition: { type: "spring", stiffness: 400, damping: 30 }
Duration: ~100ms (spring settles fast due to high stiffness)
CSS Fallback: no transform
```

```tsx
import { motion } from "motion/react";

export function PressableCard({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
      style={{
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
        cursor: "pointer",
      }}
    >
      {children}
    </motion.div>
  );
}
```

### 5.3 Card Expand

```
Animation Name: card-expand
Trigger: User clicks to expand a card to show additional detail (e.g., package card showing full tracking info)
Motion Config:
  layout: true
  Content area:
    initial: { opacity: 0, height: 0 }
    animate: { opacity: 1, height: "auto" }
    transition: { height: { type: "spring", stiffness: 300, damping: 25 }, opacity: { duration: 0.15, delay: 0.05 } }
Duration: ~250ms
CSS Fallback: instant show (duration: 0)
```

```tsx
import { motion, AnimatePresence } from "motion/react";

export function ExpandableCard({
  isExpanded,
  summary,
  detail,
}: {
  isExpanded: boolean;
  summary: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 25 }}>
      {summary}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              height: { type: "spring", stiffness: 300, damping: 25 },
              opacity: { duration: 0.15, delay: 0.05 },
            }}
            style={{ overflow: "hidden" }}
          >
            {detail}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

### 5.4 Card Collapse

```
Animation Name: card-collapse
Trigger: User clicks to collapse an expanded card
Motion Config:
  exit: { opacity: 0, height: 0 }
  transition: { height: { type: "spring", stiffness: 300, damping: 25 }, opacity: { duration: 0.1 } }
Duration: ~200ms
CSS Fallback: instant hide (duration: 0)
```

Collapse is faster than expand because users expect instant response when closing. The opacity fades first (100ms), then height collapses. Defined as the `exit` variant in the ExpandableCard above.

### 5.5 Card Drag

```
Animation Name: card-drag
Trigger: User long-presses and drags a card (e.g., reordering dashboard widgets)
Motion Config:
  drag: true
  dragConstraints: parentRef
  whileDrag: { scale: 1.03, boxShadow: "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)", zIndex: 50 }
  transition: { type: "spring", stiffness: 300, damping: 25 }
Duration: Continuous during drag; 200ms snap-back on release
CSS Fallback: no drag support; show reorder arrows instead
```

```tsx
import { motion, useMotionValue, Reorder } from "motion/react";

export function DraggableCard({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const y = useMotionValue(0);

  return (
    <Reorder.Item
      value={value}
      style={{ y }}
      whileDrag={{
        scale: 1.03,
        boxShadow: "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)",
        zIndex: 50,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {children}
    </Reorder.Item>
  );
}
```

---

## 6. Table Rows

### 6.1 Staggered Row Entry

```
Animation Name: table-staggered-entry
Trigger: Table data loads (initial page load, filter applied, sort changed)
Motion Config:
  Container (variants):
    animate: { transition: { staggerChildren: 0.03 } }
  Each row:
    initial: { opacity: 0, y: 4 }
    animate: { opacity: 1, y: 0 }
    transition: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }
Duration: 200ms per row + 30ms stagger; max 10 rows animated (rows 11+ appear instantly)
CSS Fallback: all rows appear instantly
```

```tsx
import { motion } from "motion/react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] },
  },
};

export function AnimatedTable({ rows }: { rows: TableRow[] }) {
  return (
    <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
      {rows.map((row, i) => (
        <motion.tr
          key={row.id}
          variants={i < 10 ? rowVariants : undefined}
          initial={i < 10 ? "hidden" : false}
        >
          {/* row cells */}
        </motion.tr>
      ))}
    </motion.tbody>
  );
}
```

### 6.2 Row Hover Highlight

```
Animation Name: table-row-hover
Trigger: Mouse enters a table row
Motion Config:
  whileHover: { backgroundColor: "#F9FAFB" }
  transition: { duration: 0.15, ease: "easeOut" }
Duration: 150ms
CSS Fallback: background-color: #F9FAFB (instant, no transition)
```

```tsx
import { motion } from "motion/react";

export function HoverableRow({ children }: { children: React.ReactNode }) {
  return (
    <motion.tr
      whileHover={{ backgroundColor: "#F9FAFB" }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ backgroundColor: "#FFFFFF" }}
    >
      {children}
    </motion.tr>
  );
}
```

### 6.3 Sort Column Transition

```
Animation Name: table-sort-transition
Trigger: User clicks a column header to sort
Motion Config:
  Container: layout animation on each row
  Each row:
    layout: true
    transition: { type: "spring", stiffness: 300, damping: 25 }
  Sort icon:
    animate: { rotate: sortDirection === "asc" ? 0 : 180 }
    transition: { type: "spring", stiffness: 400, damping: 30 }
Duration: ~200ms (rows reorder); ~150ms (icon rotation)
CSS Fallback: instant reorder, no animation
```

```tsx
import { motion, LayoutGroup } from "motion/react";

export function SortableTable({ rows, sortDirection }: { rows: TableRow[]; sortDirection: "asc" | "desc" }) {
  return (
    <LayoutGroup>
      <tbody>
        {rows.map((row) => (
          <motion.tr
            key={row.id}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* cells */}
          </motion.tr>
        ))}
      </tbody>
    </LayoutGroup>
  );
}

export function SortIcon({ direction }: { direction: "asc" | "desc" }) {
  return (
    <motion.span
      animate={{ rotate: direction === "asc" ? 0 : 180 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{ display: "inline-flex" }}
    >
      <ChevronUpIcon size={14} />
    </motion.span>
  );
}
```

### 6.4 Filter Fade

```
Animation Name: table-filter-fade
Trigger: User applies or removes a filter chip; rows that no longer match fade out, new matches fade in
Motion Config:
  Exiting rows:
    exit: { opacity: 0, height: 0 }
    transition: { opacity: { duration: 0.1 }, height: { duration: 0.15, delay: 0.05 } }
  Entering rows:
    initial: { opacity: 0, height: 0 }
    animate: { opacity: 1, height: "auto" }
    transition: { opacity: { duration: 0.15, delay: 0.05 }, height: { duration: 0.15 } }
Duration: 150-200ms
CSS Fallback: instant show/hide
```

```tsx
import { motion, AnimatePresence } from "motion/react";

export function FilterableTable({ rows }: { rows: TableRow[] }) {
  return (
    <AnimatePresence mode="popLayout">
      {rows.map((row) => (
        <motion.tr
          key={row.id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{
            opacity: { duration: 0.15 },
            height: { duration: 0.15 },
          }}
          style={{ overflow: "hidden" }}
        >
          {/* cells */}
        </motion.tr>
      ))}
    </AnimatePresence>
  );
}
```

---

## 7. Sidebar

### 7.1 Sidebar Expand / Collapse

```
Animation Name: sidebar-expand-collapse
Trigger: User clicks the hamburger toggle or system auto-collapses at breakpoint < 1280px
Motion Config:
  animate: { width: isExpanded ? 240 : 64 }
  transition: { type: "spring", stiffness: 300, damping: 25 }
  Label text:
    animate: { opacity: isExpanded ? 1 : 0 }
    transition: { duration: 0.1, delay: isExpanded ? 0.1 : 0 }
Duration: ~250ms (width spring); labels appear at 100ms after width starts expanding
CSS Fallback: instant width change
```

Labels fade in only after the sidebar has expanded past 180px to prevent text compression artifacts.

```tsx
import { motion } from "motion/react";

export function Sidebar({ isExpanded }: { isExpanded: boolean }) {
  return (
    <motion.nav
      animate={{ width: isExpanded ? 240 : 64 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{ overflow: "hidden", height: "100vh" }}
    >
      {navItems.map((item) => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "0 20px", height: 44 }}>
          <item.icon size={20} />
          <motion.span
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.1, delay: isExpanded ? 0.1 : 0 }}
            style={{ marginLeft: 12, whiteSpace: "nowrap" }}
          >
            {item.label}
          </motion.span>
        </div>
      ))}
    </motion.nav>
  );
}
```

### 7.2 Active Indicator Slide

```
Animation Name: sidebar-active-indicator
Trigger: User clicks a different nav item; the blue active bar (3px wide, left edge) slides vertically to the new item
Motion Config:
  layout: true (using layoutId)
  transition: { type: "spring", stiffness: 300, damping: 25 }
Duration: ~250ms
CSS Fallback: instant repositioning
```

This is the signature sidebar animation. The active indicator physically travels between nav items rather than disappearing and reappearing.

```tsx
import { motion } from "motion/react";

export function NavItem({ item, isActive }: { item: NavItemType; isActive: boolean }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", height: 44, padding: "0 20px" }}>
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: 2,
            backgroundColor: "#2563EB",
          }}
        />
      )}
      <item.icon size={20} color={isActive ? "#2563EB" : "#6B7280"} />
      <span style={{ marginLeft: 12, color: isActive ? "#111827" : "#6B7280", fontWeight: isActive ? 600 : 400 }}>
        {item.label}
      </span>
    </div>
  );
}
```

### 7.3 Submenu Slide

```
Animation Name: sidebar-submenu-slide
Trigger: User clicks a nav item that has children (e.g., Security expands to show Incidents, FOBs, Parking)
Motion Config:
  initial: { height: 0, opacity: 0 }
  animate: { height: "auto", opacity: 1 }
  exit: { height: 0, opacity: 0 }
  transition: { height: { type: "spring", stiffness: 300, damping: 25 }, opacity: { duration: 0.1 } }
Duration: ~200ms
CSS Fallback: instant show/hide
```

```tsx
import { motion, AnimatePresence } from "motion/react";

export function SidebarSubmenu({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { type: "spring", stiffness: 300, damping: 25 },
            opacity: { duration: 0.1 },
          }}
          style={{ overflow: "hidden", paddingLeft: 32 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 7.4 Nav Item Hover Highlight

```
Animation Name: sidebar-hover-highlight
Trigger: Mouse enters a sidebar nav item
Motion Config:
  whileHover: { backgroundColor: "#F3F4F6" }
  transition: { duration: 0.15, ease: "easeOut" }
Duration: 150ms
CSS Fallback: instant background change
```

```tsx
import { motion } from "motion/react";

export function NavItemHoverable({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ backgroundColor: "#F3F4F6" }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ borderRadius: 6, margin: "0 8px", padding: "0 12px" }}
    >
      {children}
    </motion.div>
  );
}
```

### 7.5 Section Reveal

```
Animation Name: sidebar-section-reveal
Trigger: Sidebar expands; grouped nav sections appear with staggered timing
Motion Config:
  Container:
    animate: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } }
  Each section label:
    initial: { opacity: 0, x: -8 }
    animate: { opacity: 1, x: 0 }
    transition: { duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] }
Duration: 150ms per label + 40ms stagger + 100ms initial delay
CSS Fallback: instant appear
```

```tsx
import { motion } from "motion/react";

const sectionContainerVariants = {
  collapsed: {},
  expanded: {
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const sectionLabelVariants = {
  collapsed: { opacity: 0, x: -8 },
  expanded: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] },
  },
};

export function SidebarSections({ isExpanded, sections }: { isExpanded: boolean; sections: Section[] }) {
  return (
    <motion.div
      variants={sectionContainerVariants}
      animate={isExpanded ? "expanded" : "collapsed"}
    >
      {sections.map((section) => (
        <div key={section.id}>
          <motion.span
            variants={sectionLabelVariants}
            style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            {section.label}
          </motion.span>
          {section.items.map((item) => (
            <NavItem key={item.id} item={item} isActive={false} />
          ))}
        </div>
      ))}
    </motion.div>
  );
}
```

---

## 8. Modal / Dialog

### 8.1 Modal Open (Scale + Fade)

```
Animation Name: modal-open-scale-fade
Trigger: User triggers a modal (create event, confirm action, view detail)
Motion Config:
  Overlay:
    initial: { opacity: 0 }
    animate: { opacity: 1 }
    transition: { duration: 0.2 }
  Dialog:
    initial: { opacity: 0, scale: 0.95, y: 8 }
    animate: { opacity: 1, scale: 1, y: 0 }
    transition: { type: "spring", stiffness: 200, damping: 20 }
Duration: 200ms overlay; ~300ms dialog spring
CSS Fallback: instant appear
```

```tsx
import { motion, AnimatePresence } from "motion/react";

export function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 100,
            }}
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 101,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              boxShadow: "0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)",
              maxWidth: 560,
              width: "90vw",
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 8.2 Modal Close (Reverse)

```
Animation Name: modal-close-reverse
Trigger: User clicks close, presses Escape, or clicks overlay
Motion Config:
  Overlay:
    exit: { opacity: 0 }
    transition: { duration: 0.15 }
  Dialog:
    exit: { opacity: 0, scale: 0.95, y: 8 }
    transition: { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] }
Duration: 150ms (faster close feels more responsive than open)
CSS Fallback: instant hide
```

Close uses a tween (not spring) for a crisp exit. Defined as the `exit` props in the Modal component above.

### 8.3 Mobile Sheet Slide-Up

```
Animation Name: sheet-slide-up-mobile
Trigger: Modal on viewport < 768px — appears as bottom sheet instead of centered dialog
Motion Config:
  initial: { y: "100%" }
  animate: { y: 0 }
  exit: { y: "100%" }
  transition: { type: "spring", stiffness: 300, damping: 30 }
Duration: ~300ms
CSS Fallback: instant appear at bottom
```

```tsx
import { motion, AnimatePresence } from "motion/react";

export function BottomSheet({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 100 }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 101,
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "85vh",
              overflow: "auto",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB" }} />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 8.4 Overlay Fade

```
Animation Name: overlay-fade
Trigger: Any overlay surface opens (modal, sheet, slide-over, popover backdrop)
Motion Config:
  initial: { opacity: 0 }
  animate: { opacity: 1 }
  exit: { opacity: 0 }
  transition: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1.0] }
Duration: 200ms
CSS Fallback: instant show/hide
```

This is the shared overlay animation used by modals, sheets, and slide-overs. The overlay color is `rgba(0, 0, 0, 0.4)` — dark enough to create focus, light enough to see context behind.

---

## 9. Form Elements

### 9.1 Input Focus Glow

```
Animation Name: form-focus-glow
Trigger: Input field receives focus (click or tab)
Motion Config:
  animate: {
    borderColor: "#2563EB",
    boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.15)"
  }
  transition: { duration: 0.2, ease: "easeOut" }
Duration: 200ms
CSS Fallback: border-color change only (instant), no glow
```

```tsx
import { motion } from "motion/react";
import { useState } from "react";

export function AnimatedInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.input
      {...props}
      onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
      animate={{
        borderColor: isFocused ? "#2563EB" : "#D1D5DB",
        boxShadow: isFocused
          ? "0 0 0 3px rgba(37, 99, 235, 0.15)"
          : "0 0 0 0px rgba(37, 99, 235, 0)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        fontSize: 15,
        outline: "none",
        width: "100%",
      }}
    />
  );
}
```

### 9.2 Input Error Shake

```
Animation Name: form-error-shake
Trigger: Form validation fails — the invalid field shakes
Motion Config:
  animate: { x: [0, -4, 4, -3, 3, -1, 1, 0] }
  transition: { duration: 0.35, ease: "easeInOut" }
  Also:
    borderColor: "#EF4444"
    boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.15)"
Duration: 350ms
CSS Fallback: red border only, no shake
```

```tsx
import { motion, useAnimate } from "motion/react";
import { useEffect } from "react";

export function ShakeOnError({
  hasError,
  children,
}: {
  hasError: boolean;
  children: React.ReactNode;
}) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (hasError) {
      animate(scope.current, { x: [0, -4, 4, -3, 3, -1, 1, 0] }, { duration: 0.35, ease: "easeInOut" });
    }
  }, [hasError, animate, scope]);

  return <motion.div ref={scope}>{children}</motion.div>;
}
```

### 9.3 Input Success Checkmark

```
Animation Name: form-success-check
Trigger: Field passes validation (e.g., valid email format, strong password)
Motion Config:
  Icon:
    initial: { opacity: 0, scale: 0.5 }
    animate: { opacity: 1, scale: 1 }
    transition: { type: "spring", stiffness: 400, damping: 30 }
  Checkmark path (SVG):
    initial: { pathLength: 0 }
    animate: { pathLength: 1 }
    transition: { duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] }
Duration: 250ms
CSS Fallback: instant appear, no path animation
```

```tsx
import { motion } from "motion/react";

export function SuccessCheck() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <motion.path
          d="M3 8.5L6.5 12L13 4"
          stroke="#047857"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] }}
        />
      </svg>
    </motion.div>
  );
}
```

### 9.4 Dropdown Open

```
Animation Name: form-dropdown-open
Trigger: User clicks a select/dropdown field
Motion Config:
  initial: { opacity: 0, scaleY: 0.95, y: -4 }
  animate: { opacity: 1, scaleY: 1, y: 0 }
  exit: { opacity: 0, scaleY: 0.95, y: -4 }
  transition: { duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] }
  transformOrigin: "top"
Duration: 150ms
CSS Fallback: instant show/hide
```

```tsx
import { motion, AnimatePresence } from "motion/react";

export function DropdownMenu({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0.95, y: -4 }}
          animate={{ opacity: 1, scaleY: 1, y: 0 }}
          exit={{ opacity: 0, scaleY: 0.95, y: -4 }}
          transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] }}
          style={{
            transformOrigin: "top",
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            boxShadow: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 9.5 Toggle Slide

```
Animation Name: form-toggle-slide
Trigger: User clicks a toggle switch
Motion Config:
  Knob:
    animate: { x: isOn ? 20 : 0 }
    transition: { type: "spring", stiffness: 400, damping: 30 }
  Track background:
    animate: { backgroundColor: isOn ? "#2563EB" : "#D1D5DB" }
    transition: { duration: 0.2 }
Duration: ~150ms (spring settles fast)
CSS Fallback: instant position and color change
```

```tsx
import { motion } from "motion/react";

export function Toggle({
  isOn,
  onToggle,
}: {
  isOn: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      onClick={onToggle}
      animate={{ backgroundColor: isOn ? "#2563EB" : "#D1D5DB" }}
      transition={{ duration: 0.2 }}
      role="switch"
      aria-checked={isOn}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        padding: 2,
        display: "flex",
        alignItems: "center",
      }}
    >
      <motion.div
        animate={{ x: isOn ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      />
    </motion.button>
  );
}
```

### 9.6 Checkbox Bounce

```
Animation Name: form-checkbox-bounce
Trigger: User checks a checkbox
Motion Config:
  Box:
    animate: { scale: [1, 0.85, 1.1, 1] }
    transition: { duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] }
  Checkmark path:
    initial: { pathLength: 0 }
    animate: { pathLength: 1 }
    transition: { duration: 0.2, delay: 0.05, ease: [0.0, 0.0, 0.2, 1.0] }
  Background fill:
    animate: { backgroundColor: isChecked ? "#2563EB" : "#FFFFFF" }
    transition: { duration: 0.1 }
Duration: 250ms total
CSS Fallback: instant check state, no bounce
```

```tsx
import { motion } from "motion/react";

export function AnimatedCheckbox({
  isChecked,
  onChange,
  label,
}: {
  isChecked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <motion.div
        animate={{
          scale: isChecked ? [1, 0.85, 1.1, 1] : 1,
          backgroundColor: isChecked ? "#2563EB" : "#FFFFFF",
        }}
        transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] }}
        onClick={onChange}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: isChecked ? "none" : "2px solid #D1D5DB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isChecked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <motion.path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, delay: 0.05, ease: [0.0, 0.0, 0.2, 1.0] }}
            />
          </svg>
        )}
      </motion.div>
      <span style={{ fontSize: 15, color: "#111827" }}>{label}</span>
    </label>
  );
}
```

### 9.7 Radio Pulse

```
Animation Name: form-radio-pulse
Trigger: User selects a radio option
Motion Config:
  Outer ring: no animation (static border)
  Inner dot:
    initial: { scale: 0 }
    animate: { scale: 1 }
    transition: { type: "spring", stiffness: 400, damping: 30 }
  Pulse ring (one-shot):
    initial: { scale: 1, opacity: 0.4 }
    animate: { scale: 2, opacity: 0 }
    transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1.0] }
Duration: 300ms
CSS Fallback: instant fill, no pulse
```

```tsx
import { motion, AnimatePresence } from "motion/react";

export function AnimatedRadio({
  isSelected,
  onChange,
  label,
}: {
  isSelected: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={onChange}>
      <div style={{ position: "relative", width: 18, height: 18 }}>
        {/* Outer ring */}
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            border: `2px solid ${isSelected ? "#2563EB" : "#D1D5DB"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatePresence>
            {isSelected && (
              <>
                {/* Inner dot */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563EB" }}
                />
                {/* Pulse ring */}
                <motion.div
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1.0] }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "2px solid #2563EB",
                  }}
                />
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      <span style={{ fontSize: 15, color: "#111827" }}>{label}</span>
    </label>
  );
}
```

### 9.8 Date Picker Slide

```
Animation Name: form-date-picker-slide
Trigger: User clicks a date input; calendar popover appears. Also: month navigation within the picker.
Motion Config:
  Calendar popover:
    initial: { opacity: 0, y: -4, scale: 0.98 }
    animate: { opacity: 1, y: 0, scale: 1 }
    exit: { opacity: 0, y: -4, scale: 0.98 }
    transition: { duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] }
  Month transition (next):
    initial: { opacity: 0, x: 24 }
    animate: { opacity: 1, x: 0 }
    exit: { opacity: 0, x: -24 }
    transition: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }
  Month transition (previous): reversed x direction
Duration: 150ms popover; 200ms month transition
CSS Fallback: instant show/hide
```

```tsx
import { motion, AnimatePresence } from "motion/react";

export function DatePickerPopover({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] }}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            boxShadow: "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)",
            border: "1px solid #E5E7EB",
            padding: 16,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MonthGrid({
  monthKey,
  direction,
  children,
}: {
  monthKey: string;
  direction: 1 | -1;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={monthKey}
        initial={{ opacity: 0, x: direction * 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -24 }}
        transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 10. Status Changes

### 10.1 Badge Color Transition

```
Animation Name: status-badge-color-transition
Trigger: An event's status changes (e.g., Open to In Progress, Pending to Resolved)
Motion Config:
  animate: {
    backgroundColor: newStatusBgColor,
    color: newStatusTextColor,
    scale: [1, 1.1, 1]
  }
  transition: {
    backgroundColor: { duration: 0.3, ease: "easeInOut" },
    color: { duration: 0.3, ease: "easeInOut" },
    scale: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1.0] }
  }
Duration: 300ms
CSS Fallback: instant color change, no scale
```

```tsx
import { motion } from "motion/react";

const statusColors: Record<string, { bg: string; text: string }> = {
  open: { bg: "#DBEAFE", text: "#1D4ED8" },
  "in-progress": { bg: "#FEF3C7", text: "#92400E" },
  resolved: { bg: "#D1FAE5", text: "#065F46" },
  urgent: { bg: "#FEE2E2", text: "#991B1B" },
  pending: { bg: "#F3F4F6", text: "#374151" },
};

export function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] ?? statusColors.pending;

  return (
    <motion.span
      animate={{
        backgroundColor: colors.bg,
        color: colors.text,
        scale: [1, 1.1, 1],
      }}
      transition={{
        backgroundColor: { duration: 0.3, ease: "easeInOut" },
        color: { duration: 0.3, ease: "easeInOut" },
        scale: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1.0] },
      }}
      style={{
        padding: "4px 12px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
        display: "inline-block",
      }}
    >
      {status}
    </motion.span>
  );
}
```

### 10.2 Pulse Ring

```
Animation Name: status-pulse-ring
Trigger: Plays once immediately after a status change completes, drawing the user's eye
Motion Config:
  initial: { scale: 1, opacity: 0.6 }
  animate: { scale: 2.2, opacity: 0 }
  transition: { duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0] }
Duration: 500ms (single shot, no loop)
CSS Fallback: no ring, status change communicated by color alone
```

```tsx
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function PulseRing({
  trigger,
  color,
}: {
  trigger: number; // increment to trigger
  color: string;
}) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [trigger]);

  return (
    <motion.div
      key={key}
      initial={{ scale: 1, opacity: 0.6 }}
      animate={{ scale: 2.2, opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0] }}
      style={{
        position: "absolute",
        inset: -4,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        pointerEvents: "none",
      }}
    />
  );
}
```

### 10.3 Count Increment

```
Animation Name: status-count-increment
Trigger: A KPI stat card value changes (e.g., "Packages Today" goes from 41 to 42)
Motion Config:
  Old number:
    exit: { opacity: 0, y: -12 }
    transition: { duration: 0.15 }
  New number:
    initial: { opacity: 0, y: 12 }
    animate: { opacity: 1, y: 0 }
    transition: { type: "spring", stiffness: 300, damping: 25 }
Duration: ~200ms
CSS Fallback: instant number change
```

The old number slides up and fades out while the new number slides up into place, creating a slot-machine effect.

```tsx
import { motion, AnimatePresence } from "motion/react";

export function AnimatedCounter({ value }: { value: number }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", height: "1.2em" }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            display: "block",
            fontSize: 32,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.2,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
```

---

## 11. Loading

### 11.1 Skeleton Shimmer

```
Animation Name: loading-skeleton-shimmer
Trigger: Content is loading; skeleton placeholders are displayed
Motion Config:
  CSS animation (not Motion — pure CSS is more performant for infinite loops):
    background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)
    background-size: 200% 100%
    animation: shimmer 1.5s linear infinite
  @keyframes shimmer:
    0%: { background-position: 200% 0 }
    100%: { background-position: -200% 0 }
Duration: 1.5s per cycle, infinite until content loads
CSS Fallback: static #F3F4F6 background (no shimmer)
```

```tsx
import { motion } from "motion/react";

// CSS-based for performance (infinite animations should avoid JS overhead)
const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s linear infinite",
  borderRadius: 8,
};

// Add to global CSS:
// @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

export function SkeletonLine({ width, height = 16 }: { width: string | number; height?: number }) {
  return <div style={{ ...shimmerStyle, width, height }} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div style={{ padding: 20, borderRadius: 12, backgroundColor: "#FFFFFF" }}>
      <SkeletonLine width="60%" height={14} />
      <div style={{ marginTop: 12 }}>
        <SkeletonLine width="100%" height={20} />
      </div>
      <div style={{ marginTop: 8 }}>
        <SkeletonLine width="40%" height={12} />
      </div>
    </div>
  );
}

// Fade from skeleton to real content
export function SkeletonToContent({
  isLoaded,
  skeleton,
  children,
}: {
  isLoaded: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isLoaded ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1.0] }}
        >
          {children}
        </motion.div>
      ) : (
        skeleton
      )}
    </motion.div>
  );
}
```

### 11.2 Chart Draw

```
Animation Name: loading-chart-draw
Trigger: Chart data loads; bars/lines animate from baseline to their values
Motion Config:
  Bar chart:
    initial: { scaleY: 0 }
    animate: { scaleY: 1 }
    transition: { duration: 0.6, ease: [0.0, 0.0, 0.2, 1.0], delay: index * 0.05 }
    transformOrigin: "bottom"
  Line chart (SVG path):
    initial: { pathLength: 0 }
    animate: { pathLength: 1 }
    transition: { duration: 0.8, ease: [0.0, 0.0, 0.2, 1.0] }
Duration: 600-800ms
CSS Fallback: instant render, no draw animation
```

```tsx
import { motion } from "motion/react";

export function AnimatedBar({
  height,
  index,
  color = "#2563EB",
}: {
  height: number;
  index: number;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.0, 0.0, 0.2, 1.0],
        delay: index * 0.05,
      }}
      style={{
        height,
        backgroundColor: color,
        borderRadius: "4px 4px 0 0",
        transformOrigin: "bottom",
        width: "100%",
      }}
    />
  );
}

export function AnimatedLinePath({ d }: { d: string }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="#2563EB"
      strokeWidth={2}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, ease: [0.0, 0.0, 0.2, 1.0] }}
    />
  );
}
```

### 11.3 Progress Bar

```
Animation Name: loading-progress-bar
Trigger: File upload, export generation, or any determinate progress operation
Motion Config:
  Bar fill:
    animate: { width: `${percent}%` }
    transition: { type: "spring", stiffness: 200, damping: 25 }
  Indeterminate (unknown duration):
    animate: { x: ["-100%", "100%"] }
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
Duration: Spring settles in ~200ms per update; indeterminate cycles at 1.2s
CSS Fallback: instant width change (determinate); static bar (indeterminate)
```

```tsx
import { motion } from "motion/react";

export function ProgressBar({
  percent,
  indeterminate = false,
}: {
  percent?: number;
  indeterminate?: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: 4,
        backgroundColor: "#E5E7EB",
        borderRadius: 2,
        overflow: "hidden",
      }}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {indeterminate ? (
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: "40%",
            height: "100%",
            backgroundColor: "#2563EB",
            borderRadius: 2,
          }}
        />
      ) : (
        <motion.div
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{
            height: "100%",
            backgroundColor: "#2563EB",
            borderRadius: 2,
          }}
        />
      )}
    </div>
  );
}
```

### 11.4 Spinner (Last Resort)

```
Animation Name: loading-spinner
Trigger: ONLY used for inline actions where a skeleton is not possible (e.g., button loading state, inline save indicator). Never for page or section loading.
Motion Config:
  CSS animation (not Motion):
    animation: spin 0.6s linear infinite
  @keyframes spin:
    0%: { transform: rotate(0deg) }
    100%: { transform: rotate(360deg) }
Duration: 0.6s per rotation, infinite
CSS Fallback: static "Loading..." text
```

```tsx
// CSS-based for performance
const spinnerStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  border: "2px solid #E5E7EB",
  borderTop: "2px solid #2563EB",
  borderRadius: "50%",
  animation: "spin 0.6s linear infinite",
};

// Add to global CSS:
// @keyframes spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div
      style={{ ...spinnerStyle, width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}
```

---

## 12. Gesture

### 12.1 Swipe Dismiss

```
Animation Name: gesture-swipe-dismiss
Trigger: User swipes a card or notification horizontally (mobile, or trackpad gesture on desktop)
Motion Config:
  drag: "x"
  dragConstraints: { left: 0, right: 0 }
  dragElastic: 0.3
  onDragEnd: if velocity.x > 300 or offset.x > 150 → dismiss
  Dismiss:
    animate: { x: 400, opacity: 0 }
    transition: { duration: 0.2, ease: [0.4, 0.0, 1.0, 1.0] }
Duration: 200ms dismiss animation
CSS Fallback: show dismiss button instead (no gesture)
```

```tsx
import { motion, useMotionValue, useTransform, PanInfo } from "motion/react";

export function SwipeDismissable({
  onDismiss,
  children,
}: {
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 150], [1, 0.5]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.velocity.x > 300 || info.offset.x > 150) {
      onDismiss();
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      style={{ x, opacity, touchAction: "pan-y" }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0.0, 1.0, 1.0] }}
    >
      {children}
    </motion.div>
  );
}
```

### 12.2 Pull to Refresh

```
Animation Name: gesture-pull-to-refresh
Trigger: User pulls down from the top of a scrollable list (mobile viewport)
Motion Config:
  Indicator (spinner + text):
    initial: { y: -40, opacity: 0 }
    animate (pulling): { y: pullDistance * 0.5, opacity: clamp(pullDistance / 80, 0, 1) }
    animate (refreshing): { y: 40 }
    transition: { type: "spring", stiffness: 300, damping: 25 }
  Spinner during refresh:
    animate: { rotate: 360 }
    transition: { duration: 0.6, repeat: Infinity, ease: "linear" }
Duration: Spring-driven during pull; 600ms spinner rotation
CSS Fallback: no pull-to-refresh; show refresh button in header
```

```tsx
import { motion, useMotionValue, useTransform } from "motion/react";
import { useState } from "react";

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const y = useMotionValue(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const indicatorOpacity = useTransform(y, [0, 80], [0, 1]);
  const indicatorY = useTransform(y, [0, 120], [-40, 40]);

  async function handleDragEnd() {
    if (y.get() > 80 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  }

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <motion.div
        style={{ opacity: indicatorOpacity, y: indicatorY }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {isRefreshing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
          >
            <RefreshIcon size={20} color="#2563EB" />
          </motion.div>
        ) : (
          <span style={{ fontSize: 13, color: "#6B7280" }}>Pull to refresh</span>
        )}
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        style={{ y, touchAction: "pan-x" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
```

### 12.3 Pinch Zoom (Mobile)

```
Animation Name: gesture-pinch-zoom
Trigger: User pinch-zooms on an image or document preview (mobile viewport only)
Motion Config:
  Container:
    animate: { scale: pinchScale }
    transition: { type: "spring", stiffness: 300, damping: 25 }
  Snap back (on release if scale < 1):
    animate: { scale: 1 }
    transition: { type: "spring", stiffness: 400, damping: 30 }
  Max scale: 3
  Min scale: 1 (snaps back below 1)
Duration: Spring-driven, continuous during gesture
CSS Fallback: no pinch zoom; provide zoom buttons (+/-) instead
```

```tsx
import { motion, useMotionValue, useTransform } from "motion/react";
import { useRef } from "react";

export function PinchZoomImage({ src, alt }: { src: string; alt: string }) {
  const scale = useMotionValue(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pinch gesture handling via pointer events
  // (Production implementation would use useGesture from @use-gesture/react)

  return (
    <div ref={containerRef} style={{ overflow: "hidden", touchAction: "none" }}>
      <motion.img
        src={src}
        alt={alt}
        style={{ scale, maxWidth: "100%", transformOrigin: "center" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </div>
  );
}
```

---

## 13. Animation Orchestration

### 13.1 Stagger Children Pattern

When multiple elements enter the viewport simultaneously, stagger their appearance to create a wave effect.

**Rules:**
- Stagger delay: 30ms between children
- Maximum staggered items: 10 (items beyond 10 appear with the 10th)
- Direction: top-to-bottom for vertical lists, left-to-right for horizontal grids
- Never stagger on exit (exits should be simultaneous for responsiveness)

```tsx
import { motion } from "motion/react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] },
  },
};

export function StaggeredList({ items }: { items: Item[] }) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          variants={i < 10 ? itemVariants : undefined}
          initial={i < 10 ? "hidden" : false}
        >
          <ItemCard item={item} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 13.2 Choreographed Dashboard Entry

When the dashboard loads, elements enter in a specific choreographed sequence that guides the user's eye from most important to least important.

**Sequence:**
1. **0ms** — Sidebar appears (instant, no animation — it is the frame)
2. **0ms** — Page header fades in (200ms duration)
3. **50ms** — KPI stat cards stagger in from left to right (30ms between each, 4 cards)
4. **200ms** — Charts draw from baseline (600ms duration)
5. **250ms** — Data table rows stagger in (30ms between each, max 10 rows)
6. **300ms** — Quick action buttons fade in as a group

```tsx
import { motion } from "motion/react";

const dashboardOrchestration = {
  header: { delay: 0 },
  stats: { delay: 0.05, stagger: 0.03 },
  charts: { delay: 0.2, duration: 0.6 },
  table: { delay: 0.25, stagger: 0.03 },
  actions: { delay: 0.3 },
};

export function DashboardLayout() {
  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: dashboardOrchestration.header.delay }}
      >
        <DashboardHeader />
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: dashboardOrchestration.stats.stagger,
              delayChildren: dashboardOrchestration.stats.delay,
            },
          },
        }}
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.id}
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] } },
            }}
          >
            <StatCard stat={stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: dashboardOrchestration.charts.delay }}
      >
        <ChartsSection />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: dashboardOrchestration.table.delay }}
      >
        <EventsTable />
      </motion.div>
    </div>
  );
}
```

### 13.3 Slide-Over Panel Entry (Package Intake)

The package intake slide-over is a high-frequency action. Its animation must feel instant and satisfying.

**Sequence:**
1. **0ms** — Overlay fades in (200ms)
2. **0ms** — Panel slides in from right (spring: stiffness 300, damping 25)
3. **150ms** — Form fields stagger in from top (30ms each, 5-6 fields)
4. **200ms** — Auto-focus fires on Unit field (no animation, just focus glow)

```tsx
import { motion, AnimatePresence } from "motion/react";

export function SlideOverPanel({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 100 }}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 480,
              maxWidth: "90vw",
              backgroundColor: "#FFFFFF",
              zIndex: 101,
              boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
              overflowY: "auto",
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 13.4 Layout Animation Groups

When cards reorder (sort, filter, drag-and-drop), use `LayoutGroup` to coordinate their movement so cards slide to their new positions simultaneously.

```tsx
import { LayoutGroup, motion } from "motion/react";

export function ReorderableGrid({ items }: { items: Item[] }) {
  return (
    <LayoutGroup>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card item={item} />
          </motion.div>
        ))}
      </div>
    </LayoutGroup>
  );
}
```

---

## 14. Performance Guidelines

### 14.1 Transform-Only Rule

All animations MUST use only these CSS properties to stay on the compositor thread and avoid layout/paint:

| Allowed | Property | Use Case |
|---------|----------|----------|
| Yes | `transform: translate()` | Position changes (slide, lift) |
| Yes | `transform: scale()` | Size changes (press, hover, modal) |
| Yes | `transform: rotate()` | Icon rotation (sort arrow, spinner) |
| Yes | `opacity` | Fade in/out |
| Yes | `filter` (sparingly) | Blur for overlay background |

| Forbidden | Property | Why |
|-----------|----------|-----|
| No | `width`, `height` | Triggers layout recalculation |
| No | `top`, `left`, `right`, `bottom` | Triggers layout recalculation |
| No | `margin`, `padding` | Triggers layout recalculation |
| No | `border-width` | Triggers layout recalculation |
| No | `font-size` | Triggers layout recalculation |

**Exception**: `height: "auto"` animations (expand/collapse) are acceptable ONLY when:
1. The element has `overflow: hidden`
2. The content is modest in size (under 500px height)
3. Motion handles the layout animation internally via `layout` prop

### 14.2 will-change Usage

Apply `will-change` sparingly and only to elements that animate frequently.

```css
/* Apply to permanently animatable elements */
.sidebar { will-change: width; }
.toast-container > * { will-change: transform, opacity; }

/* DO NOT apply to: */
/* - Elements that animate once (page enter, chart draw) */
/* - All cards by default (too many layers) */
/* - More than 10 elements on screen simultaneously */
```

### 14.3 GPU Layer Management

| Element Type | Promote to GPU Layer? | Reason |
|-------------|----------------------|--------|
| Sidebar (during resize) | Yes | Animates frequently |
| Toast notifications | Yes | Stack, slide, dismiss continuously |
| Modal overlay | Yes | Large surface, simple opacity |
| Modal dialog | Yes | Scale + opacity during open/close |
| Table rows | **No** | Too many elements; use stagger instead |
| Stat cards | **No** | Only animate on load (one-shot) |
| Skeleton shimmer | **No** | CSS animation on `background-position` is already efficient |

### 14.4 Frame Budget

Target: **60fps** (16.67ms per frame) on both 60Hz and 120Hz displays.

- All spring animations from Motion are frame-rate independent (they use real time, not frame count)
- CSS animations use `animation-timing-function` which is interpolated by the browser
- Test on: Chrome DevTools Performance tab, targeting < 8ms scripting per frame during animations
- On 120Hz displays (ProMotion MacBooks, iPad Pro), spring animations will appear even smoother without code changes

### 14.5 Bundle Size

Motion (formerly Framer Motion) supports tree-shaking. Import only what each component needs.

```tsx
// Good — minimal import
import { motion, AnimatePresence } from "motion/react";

// Bad — importing everything
import * as Motion from "motion/react";
```

Estimated bundle impact of each feature:

| Feature | Approx. Size (gzipped) |
|---------|----------------------|
| `motion` component | ~5 KB |
| `AnimatePresence` | ~2 KB |
| `LayoutGroup` / `layout` | ~4 KB |
| `useAnimate` | ~1 KB |
| `Reorder` | ~3 KB |
| Spring physics engine | Included in base |

Total estimated impact: **12-15 KB gzipped** for the full animation system.

### 14.6 Low-End Device Strategy

For devices with limited GPU (detected via `navigator.hardwareConcurrency < 4` or `navigator.deviceMemory < 4`):

1. Reduce stagger count to 5 (from 10)
2. Disable chart draw animations (instant render)
3. Disable card hover lift (use background color only)
4. Disable layout animations on tables (instant reorder)
5. Keep: page transitions, modal open/close, toast notifications (these are critical for UX comprehension)

```tsx
export function usePerformanceTier(): "high" | "low" {
  if (typeof navigator === "undefined") return "high";
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as any).deviceMemory ?? 8;
  return cores < 4 || memory < 4 ? "low" : "high";
}
```

---

## 15. Accessibility — prefers-reduced-motion

### 15.1 Global Reduced Motion Strategy

When `prefers-reduced-motion: reduce` is active, ALL motion is replaced with instant opacity transitions. No transforms, no springs, no gestures.

**What changes:**
- All `transform` animations become instant (duration: 0)
- All spring physics become instant (duration: 0)
- Opacity transitions remain but become instant (duration: 0)
- Skeleton shimmer stops (static gray background)
- Spinner remains (it is an essential loading indicator, not decorative)
- Gesture animations are disabled (swipe, pull-to-refresh, pinch)
- Chart draw animations are disabled (instant render)

**What does NOT change:**
- Color transitions on status badges (essential information, CSS-only)
- Focus ring appearance (essential accessibility indicator)
- Scroll behavior (controlled by `scroll-behavior`, not by Motion)

### 15.2 Implementation

```tsx
// src/providers/MotionProvider.tsx

import { MotionConfig } from "motion/react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
```

Setting `reducedMotion="user"` tells Motion to respect the OS-level `prefers-reduced-motion` setting automatically. When enabled:
- `initial` and `animate` values resolve instantly
- `exit` animations are skipped
- `whileHover` and `whileTap` still apply state changes but without animation
- `layout` animations resolve instantly

### 15.3 CSS Fallback for Non-Motion Animations

For CSS-based animations (shimmer, spinner), add the media query:

```css
@media (prefers-reduced-motion: reduce) {
  /* Skeleton shimmer — static background */
  [data-skeleton] {
    animation: none !important;
    background: #F3F4F6 !important;
  }

  /* All transitions — instant */
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }

  /* Exception: spinner remains for loading indication */
  [data-spinner] {
    animation-duration: 0.6s !important;
    animation-iteration-count: infinite !important;
  }
}
```

### 15.4 Per-Animation Fallback Reference

| # | Animation | Reduced Motion Behavior |
|---|-----------|------------------------|
| 1 | page-enter | Instant opacity: 0 to 1 |
| 2 | page-exit | Instant opacity: 1 to 0 |
| 3 | tab-switch | Instant opacity swap |
| 4 | module-switch | Instant opacity swap |
| 5 | toast-slide-in | Instant opacity: 0 to 1 |
| 6 | toast-expand | Instant height change |
| 7 | toast-dismiss | Instant opacity: 1 to 0 |
| 8 | toast-stack | Instant reposition |
| 9 | toast-error-shake | No shake, red border only |
| 10 | toast-success-pulse | No pulse, static icon |
| 11 | card-hover-lift | Background color change only |
| 12 | card-active-press | No scale |
| 13 | card-expand | Instant height change |
| 14 | card-collapse | Instant height change |
| 15 | card-drag | Instant reposition (or arrow buttons) |
| 16 | table-staggered-entry | All rows appear instantly |
| 17 | table-row-hover | Instant background color |
| 18 | table-sort-transition | Instant reorder |
| 19 | table-filter-fade | Instant show/hide |
| 20 | sidebar-expand-collapse | Instant width change |
| 21 | sidebar-active-indicator | Instant reposition |
| 22 | sidebar-submenu-slide | Instant show/hide |
| 23 | sidebar-hover-highlight | Instant background |
| 24 | sidebar-section-reveal | Instant appear |
| 25 | modal-open-scale-fade | Instant appear |
| 26 | modal-close-reverse | Instant hide |
| 27 | sheet-slide-up-mobile | Instant appear at bottom |
| 28 | overlay-fade | Instant show/hide |
| 29 | form-focus-glow | Instant border color |
| 30 | form-error-shake | Red border only, no shake |
| 31 | form-success-check | Instant appear |
| 32 | form-dropdown-open | Instant show/hide |
| 33 | form-toggle-slide | Instant position swap |
| 34 | form-checkbox-bounce | Instant check, no bounce |
| 35 | form-radio-pulse | Instant fill, no pulse |
| 36 | form-date-picker-slide | Instant show/hide |
| 37 | status-badge-color-transition | Instant color change |
| 38 | status-pulse-ring | No ring |
| 39 | status-count-increment | Instant number change |
| 40 | loading-skeleton-shimmer | Static gray background |
| 41 | loading-chart-draw | Instant render |
| 42 | loading-progress-bar | Instant width update |
| 43 | loading-spinner | Keeps spinning (essential) |
| 44 | gesture-swipe-dismiss | Dismiss button instead |
| 45 | gesture-pull-to-refresh | Refresh button instead |
| 46 | gesture-pinch-zoom | Zoom +/- buttons instead |

---

## 16. Testing Protocol

### 16.1 Visual Regression Testing

Every animation must be tested in three states:
1. **Initial state** — before animation triggers
2. **Mid-animation** — during the transition (screenshot at 50% duration)
3. **Final state** — after animation completes

Use Playwright with `page.pause()` at animation midpoints for screenshot comparison.

### 16.2 Performance Testing Checklist

| Test | Target | Tool |
|------|--------|------|
| Frame rate during page transition | 60fps sustained | Chrome DevTools Performance |
| Frame rate during table sort (100 rows) | 60fps sustained | Chrome DevTools Performance |
| Frame rate during modal open | 60fps sustained | Chrome DevTools Performance |
| Total scripting time per animation frame | < 8ms | Chrome DevTools Performance |
| Layout thrashing | 0 forced reflows | Chrome DevTools Performance |
| GPU memory during toast stack (5 toasts) | < 50MB additional | Chrome Task Manager |
| Bundle size impact of motion | < 20 KB gzipped | Webpack Bundle Analyzer |

### 16.3 Device Testing Matrix

| Device | Display | Priority | Notes |
|--------|---------|----------|-------|
| MacBook Pro 14" | 120Hz ProMotion | High | Primary dev machine, test spring smoothness |
| 27" external monitor | 60Hz | High | Primary user display (99% of users on desktop monitors) |
| iPad Pro 12.9" | 120Hz ProMotion | Medium | Security guard patrol use case |
| iPhone 15 | 60Hz | Medium | Resident portal mobile |
| Low-end Android | 60Hz | Low | Verify graceful degradation |

### 16.4 Accessibility Testing

1. Enable `prefers-reduced-motion: reduce` in OS settings
2. Verify every animation from the 46-item table in Section 15.4 matches its reduced-motion behavior
3. Verify no content is lost when animations are disabled
4. Verify focus management still works without motion cues
5. Run Lighthouse accessibility audit — no animation-related failures

---

## Appendix A: Complete Animation Inventory

| # | Name | Category | Trigger | Physics | Duration |
|---|------|----------|---------|---------|----------|
| 1 | page-enter | Page Transition | Route mount | Tween | 250ms |
| 2 | page-exit | Page Transition | Route unmount | Tween | 150ms |
| 3 | tab-switch | Page Transition | Tab click | Tween | 200ms |
| 4 | module-switch | Page Transition | Sidebar nav click | Tween | 200ms |
| 5 | toast-slide-in | Toast | Notification fire | Spring (Gentle) | ~350ms |
| 6 | toast-expand | Toast | Chevron click | Spring (Responsive) | ~250ms |
| 7 | toast-dismiss | Toast | Auto/manual dismiss | Tween | 150ms |
| 8 | toast-stack | Toast | Toast removed | Spring (Responsive) | ~200ms |
| 9 | toast-error-shake | Toast | Error notification | Tween (keyframes) | 400ms |
| 10 | toast-success-pulse | Toast | Success notification | Tween | 500ms |
| 11 | card-hover-lift | Card | Mouse enter | Spring (Responsive) | ~200ms |
| 12 | card-active-press | Card | Mouse down | Spring (Snappy) | ~100ms |
| 13 | card-expand | Card | Click to expand | Spring (Responsive) | ~250ms |
| 14 | card-collapse | Card | Click to collapse | Tween | ~200ms |
| 15 | card-drag | Card | Long-press + drag | Spring (Responsive) | Continuous |
| 16 | table-staggered-entry | Table | Data load | Tween + stagger | 200ms + 30ms/row |
| 17 | table-row-hover | Table | Mouse enter row | Tween | 150ms |
| 18 | table-sort-transition | Table | Column header click | Spring (Responsive) | ~200ms |
| 19 | table-filter-fade | Table | Filter applied | Tween | 150-200ms |
| 20 | sidebar-expand-collapse | Sidebar | Toggle click | Spring (Responsive) | ~250ms |
| 21 | sidebar-active-indicator | Sidebar | Nav item click | Spring (Responsive) | ~250ms |
| 22 | sidebar-submenu-slide | Sidebar | Parent item click | Spring (Responsive) | ~200ms |
| 23 | sidebar-hover-highlight | Sidebar | Mouse enter item | Tween | 150ms |
| 24 | sidebar-section-reveal | Sidebar | Sidebar expands | Tween + stagger | 150ms + 40ms/label |
| 25 | modal-open-scale-fade | Modal | Modal trigger | Spring (Gentle) | ~300ms |
| 26 | modal-close-reverse | Modal | Close/escape/overlay | Tween | 150ms |
| 27 | sheet-slide-up-mobile | Modal | Modal on mobile | Spring (Responsive) | ~300ms |
| 28 | overlay-fade | Modal | Any overlay opens | Tween | 200ms |
| 29 | form-focus-glow | Form | Input focus | Tween | 200ms |
| 30 | form-error-shake | Form | Validation fail | Tween (keyframes) | 350ms |
| 31 | form-success-check | Form | Validation pass | Spring (Snappy) + Tween | 250ms |
| 32 | form-dropdown-open | Form | Select click | Tween | 150ms |
| 33 | form-toggle-slide | Form | Toggle click | Spring (Snappy) | ~150ms |
| 34 | form-checkbox-bounce | Form | Checkbox click | Tween (keyframes) | 250ms |
| 35 | form-radio-pulse | Form | Radio select | Spring (Snappy) + Tween | 300ms |
| 36 | form-date-picker-slide | Form | Date input click | Tween | 150-200ms |
| 37 | status-badge-color-transition | Status | Status changes | Tween | 300ms |
| 38 | status-pulse-ring | Status | After status change | Tween | 500ms |
| 39 | status-count-increment | Status | KPI value changes | Spring (Responsive) | ~200ms |
| 40 | loading-skeleton-shimmer | Loading | Content loading | CSS infinite | 1.5s/cycle |
| 41 | loading-chart-draw | Loading | Chart data loads | Tween + stagger | 600-800ms |
| 42 | loading-progress-bar | Loading | Progress update | Spring (Gentle) | ~200ms/update |
| 43 | loading-spinner | Loading | Inline action loading | CSS infinite | 0.6s/rotation |
| 44 | gesture-swipe-dismiss | Gesture | Horizontal swipe | Tween | 200ms |
| 45 | gesture-pull-to-refresh | Gesture | Pull down | Spring (Responsive) | Spring-driven |
| 46 | gesture-pinch-zoom | Gesture | Pinch gesture | Spring (Responsive) | Spring-driven |

---

## Appendix B: Quick Reference — Spring Profiles

```
Snappy:     { type: "spring", stiffness: 400, damping: 30 }  → Buttons, toggles, checkboxes
Responsive: { type: "spring", stiffness: 300, damping: 25 }  → Cards, sidebar, layout
Gentle:     { type: "spring", stiffness: 200, damping: 20 }  → Modals, toasts, page enter
```

## Appendix C: Quick Reference — Tween Easings

```
Fade In:    { duration: 0.2,  ease: [0.0, 0.0, 0.2, 1.0] }  → Content appearing
Fade Out:   { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] }  → Content disappearing
Ease Out:   { duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] }  → Entering elements
Ease In:    { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] }  → Exiting elements
Ease InOut: { duration: 0.2,  ease: [0.4, 0.0, 0.2, 1.0] }  → Symmetric transitions
```

---

*Last updated: 2026-03-16*
*Animation count: 46 defined, each with full Motion config, code example, and reduced-motion fallback*
*Physics model: 3 spring profiles (Snappy/Responsive/Gentle) + 5 tween easings*
*Performance target: 60fps on 60Hz and 120Hz displays, < 20 KB gzipped bundle impact*
*Accessibility: Full prefers-reduced-motion compliance — instant opacity for every animation*
