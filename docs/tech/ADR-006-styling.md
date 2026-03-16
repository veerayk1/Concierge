# ADR-006: Styling & UI Component Architecture

## Status: Accepted
## Date: 2026-03-15
## Decision Makers: Architecture Team

## Context

Concierge requires a styling and UI architecture that delivers Apple-grade minimalism while supporting a complex, role-aware interface across 12+ user roles. The design system (documented in `DESIGN-SYSTEM.md`, 2,243 lines) specifies exact design tokens for colors, typography, spacing, shadows, and animation curves. The chosen solution must:

1. Integrate tightly with our design token system (colors, spacing, typography defined once, consumed everywhere).
2. Provide accessible UI primitives that comply with WCAG 2.2 AA (RULEBOOK Rule 13, TECH-STACK Section 17).
3. Support spring-physics animations for page transitions, toast notifications, card interactions, and layout shifts.
4. Give us full visual control — the design system mandates white backgrounds, no dark sidebars, no gradients, and color used only for status and actions. Pre-styled component libraries fight this philosophy.
5. Support desktop-monitor-first design (1920x1080 primary) with responsive breakpoints down to tablet and mobile.
6. Produce minimal production CSS via tree-shaking.
7. Maintain a consistent icon system with outlined style at 1.5px stroke weight.

We also need a solution that the team can maintain long-term without fighting framework opinions on every component.

## Decision

We adopt the following styling stack:

- **Tailwind CSS 4.x** as the utility-first CSS framework, with design tokens mapped to CSS custom properties.
- **Radix UI** (latest) as the unstyled, accessible component primitive library.
- **Framer Motion 12.x** as the animation library for spring physics, layout animations, and gesture support.
- **Lucide React** as the icon library (1,400+ icons, outlined style, tree-shakeable).

All four libraries are MIT-licensed.

## Rationale

### Tailwind CSS 4.x over CSS Modules, styled-components, or CSS-in-JS (Emotion/Stitches)

Tailwind's utility-first approach maps directly to our design tokens. We define tokens once as CSS custom properties and reference them in utilities across every component. This eliminates the drift between a design token file and actual component styles that plagues CSS Modules and CSS-in-JS approaches.

Tailwind 4.x specifically brings native CSS nesting, the Lightning CSS engine for faster builds, and first-class CSS custom property integration. The `@apply` directive lets us create component-level abstractions when utility strings become verbose, keeping the best of both worlds.

CSS Modules require manual mapping from tokens to class names, creating a maintenance layer. styled-components and Emotion add JavaScript runtime cost to style computation, which conflicts with React Server Components (our Next.js 15 App Router uses RSC heavily). Stitches is no longer actively maintained.

Tailwind's responsive variants (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) align with our desktop-first responsive strategy, and its tree-shaking ensures only used utilities ship to production.

### Radix UI over shadcn/ui, Chakra UI, Material UI, and Ant Design

Radix UI provides **unstyled** accessible primitives. This is the critical differentiator. Our design system mandates exact visual specifications — white backgrounds, specific shadow values, precise spacing tokens, and color used only for status indicators. Pre-styled libraries (Chakra, Material UI, Ant Design) impose their own visual opinions that we would spend significant effort overriding.

shadcn/ui builds on Radix but adds opinionated Tailwind styles via copy-pasted component files. While closer to our needs, we would still override most of its default styling to match our design system. Using Radix directly gives us the accessible foundation (ARIA roles, keyboard navigation, focus management, screen reader support) without any visual baggage.

Radix components we will use: Dialog, DropdownMenu, Select, Checkbox, RadioGroup, Tabs, Tooltip, Popover, ScrollArea, Separator, Switch, Toast, AlertDialog, NavigationMenu, Accordion, Collapsible, ContextMenu, HoverCard, Menubar, Slider, and ToggleGroup.

The compound component pattern (`Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`) provides composability that matches our progressive-disclosure design philosophy — components can be assembled differently per role without wrapper hacks.

Accessibility is built into every Radix primitive by default: proper ARIA attributes, keyboard event handling, focus trapping in modals, and screen reader announcements. This directly supports WCAG 2.2 AA compliance required by RULEBOOK Rule 13 without additional accessibility work per component.

### Framer Motion 12.x over CSS animations or no animation library

Our design system specifies spring-physics animation curves (e.g., `stiffness: 300, damping: 30` for page transitions) that CSS `transition` and `@keyframes` cannot express. Spring animations respond naturally to interruption — if a user triggers a new action mid-animation, the spring recalculates rather than snapping or queueing.

Key Framer Motion capabilities we require:
- **Spring physics**: Configurable stiffness/damping for natural-feeling interactions.
- **Layout animations**: Smooth repositioning when elements reorder (event lists, drag-and-drop dashboard widgets).
- **AnimatePresence**: Animate elements entering and exiting the DOM (page transitions, toast stacking, modal open/close).
- **Gesture support**: Drag, hover, tap, and pan — essential for future React Native mobile interactions.
- **Reduced motion**: Built-in `useReducedMotion()` hook respects `prefers-reduced-motion` for accessibility.

CSS-only animations cannot achieve layout animations or exit animations without JavaScript. No animation library at all would result in a flat, unpolished experience inconsistent with the Apple-grade quality bar.

### Lucide React over Heroicons, Phosphor, or Font Awesome

Lucide is a maintained fork of Feather Icons with 1,400+ icons in an outlined style at 1.5px stroke weight. This matches our design system's specification for clean, minimal iconography. Icons are tree-shakeable (import only what you use), include TypeScript definitions, and render at a consistent 24x24 default size. Font Awesome's filled style conflicts with our design language, and Heroicons has a smaller icon set.

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **CSS Modules** | Manual token mapping, no utility-first speed, larger CSS output, harder responsive design |
| **styled-components** | Runtime CSS-in-JS conflicts with React Server Components, JavaScript overhead |
| **Emotion** | Same RSC conflict as styled-components, adds runtime cost |
| **Stitches** | No longer actively maintained as of 2023 |
| **Chakra UI** | Pre-styled — would require extensive theme overrides to match our design system |
| **shadcn/ui** | Builds on Radix (good) but adds opinionated default styles we would override |
| **Material UI (MUI)** | Material Design visual language conflicts with our Apple-grade minimalism; large bundle |
| **Ant Design** | Enterprise-oriented but visually opinionated, large bundle, React 19 compatibility uncertain |
| **CSS-only animations** | Cannot express spring physics, layout animations, or exit animations |

## Consequences

### Positive
- Full control over every pixel — the design system is implemented exactly as specified, not approximated.
- WCAG 2.2 AA accessibility built into every interactive component via Radix primitives.
- Spring-physics animations create a polished, Apple-quality interaction feel.
- Minimal production CSS — Tailwind tree-shakes unused utilities, Radix adds zero CSS, Lucide tree-shakes unused icons.
- No framework lock-in on visual design — switching from Tailwind to another approach would not require rewriting component logic.
- Framer Motion's gesture support provides a bridge to React Native mobile (same interaction mental model).

### Negative
- More CSS authoring work than pre-styled libraries — every Radix component needs full Tailwind styling.
- Team must understand both Tailwind utility classes and Radix component APIs.
- Framer Motion adds ~30KB to client bundle (tree-shaken), which is non-trivial but justified by the interaction quality.
- No out-of-the-box theme or component gallery — we build our own component library from scratch.

### Risks
- Tailwind 4.x is a major version upgrade; early adoption may encounter ecosystem compatibility gaps with third-party plugins.
- Framer Motion's API surface is large; without team conventions, animation usage could become inconsistent. Mitigation: define animation presets in the design system and enforce them via shared motion variants.
- Radix UI releases individual packages per component; version coordination across 20+ packages requires attention during upgrades.

## Related ADRs
- [ADR-001-framework.md](ADR-001-framework.md) — Next.js 15 App Router (RSC compatibility drove CSS-in-JS rejection)
- [ADR-007-testing.md](ADR-007-testing.md) — Storybook + Chromatic for visual regression testing of styled components
- [ADR-009-mobile-strategy.md](ADR-009-mobile-strategy.md) — Framer Motion gesture patterns inform future React Native interaction design
