# Immersive 3D Experience — "BuildingAutopilot, on autopilot"

> Scroll-driven 3D showcase that makes a prospect _feel_ an entire building running
> itself. Isolated at `/experience` — the live site/homepage is untouched until approved.

## Concept

Not a real-estate tour. A cinematic, scroll-driven journey where the building is the
stage and the **story is the automation**: as you scroll, the platform's automations
visibly fire (a package logs itself, a request dispatches itself), resolving into a
single "command view" — the building on autopilot.

Narrative spine: **"The building that runs itself"**, bookended by **"Engage autopilot"**
brand framing, with flashes of **chaos → calm** on transitions.

## Scope of THIS slice (first beats — prove the mechanism)

A working, scrollable, cinematic sequence with these beats (scroll 0 → 1):

1. **Intro (0–0.15)** — dark 3D building forms; "BuildingAutopilot / Engage autopilot".
2. **Beat 1 — It logs itself (0.2–0.4)** — camera flies into the structure; a real
   package-intake UI card appears: arrived → auto-logged → resident notified.
3. **Beat 2 — It dispatches itself (0.45–0.65)** — a maintenance work-order auto-routes
   to a vendor (real work-order card).
4. **Beat 3 — One command view (0.7–0.9)** — pull back; a management dashboard glimpse,
   everything green, on autopilot.
5. **CTA (0.92–1)** — "Your building, on autopilot." → Request a demo / Get started.

Honest fidelity note: visuals are a **stylized-architectural first pass** (premium
lighting, brass brand accents, glow/bloom, fog, real product UI cards) — NOT photoreal
yet. It proves the experience; fidelity escalates each iteration.

## Architecture

- **Route:** `src/app/experience/page.tsx` (uses root layout only — isolated from the
  `(marketing)` and `(portal)` layouts; not linked from nav).
- **Engine:** raw **Three.js** (already installed `three@0.183`; no new deps → no
  version risk). `src/components/experience/scene.ts` — pure module exposing
  `createScene(container)` → `{ setProgress(p), resize(), dispose() }`.
  - WebGLRenderer (ACES tone mapping, sRGB, capped pixel ratio), fog, RoomEnvironment
    for PBR reflections (built into three, no external asset), hemisphere + directional
    - warm point lights, emissive brass accents.
  - Stylized condo tower (floor slabs, columns, facade, particles for depth).
  - Camera flies along a `CatmullRomCurve3`; `setProgress` maps scroll → position +
    lookAt. UnrealBloom via EffectComposer for the glow.
- **Component:** `src/components/experience/ImmersiveExperience.tsx` (client) — tall
  scroll container drives progress (rAF + lerp for smoothness, no Lenis dep); fixed
  full-viewport canvas; DOM overlay beats fade/move by scroll range; real product UI
  cards built with the design system + realistic mock data.

## Non-negotiables

- **Isolation:** nothing on the live homepage changes.
- **Safety/perf:** branded loader, capped DPR, dispose on unmount, `prefers-reduced-motion`
  - no-WebGL fallback (static hero, no crash).
- **Truthful:** the UI cards reflect real product surfaces; fidelity claims match reality.

## Iteration loop

Build first beats → user scrolls it live → feedback → refine to bar → next beats →
eventually escalate fidelity (captured real property / photoreal assets).
