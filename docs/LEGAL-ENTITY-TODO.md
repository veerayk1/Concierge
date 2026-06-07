# ⚠️ LEGAL ENTITY — PLACEHOLDER, REPLACE WHEN REGISTERED

> **Status (as of 2026-06-07): the legal entity does NOT exist yet.**
> The name **"BuildingAutopilot Property Management Inc."** used in the legal pages is a
> **PLACEHOLDER**. When the real company is incorporated, replace it everywhere with the
> exact registered legal name (and registered address, if different).

---

## What to replace, and where

### 1. Legal entity name — `BuildingAutopilot Property Management Inc.`

- `src/app/(marketing)/privacy/page.tsx`
  - Section 1 "Introduction" (defines the entity + short term "BuildingAutopilot")
  - Section 11 "Contact" → Privacy Officer block
- `src/app/(marketing)/terms/page.tsx`
  - Section 1 "Agreement to terms" — currently names the brand "BuildingAutopilot" as the
    contracting party. Decide whether to insert the full registered entity name here.

Each spot has an inline `TODO(legal-entity)` comment pointing back to this file.

### 2. Registered address

- `src/app/(marketing)/privacy/page.tsx` Section 11 currently says **"Toronto, Ontario, Canada"**.
  Replace with the entity's actual registered address once known.

### 3. Contact emails (depend on the verified domain, not the entity, but verify together)

- `privacy@buildingautopilot.ca`, `legal@buildingautopilot.ca`, `security@buildingautopilot.ca`
  (in `privacy/page.tsx` and `terms/page.tsx`). These require the `buildingautopilot.ca` domain
  to be set up for email + verified in the email provider (Resend) before they actually receive mail.

---

## How to find every spot fast

```bash
# All inline reminders:
rg -n "TODO\(legal-entity\)" src

# Current placeholder entity name:
rg -n "BuildingAutopilot Property Management Inc" src
```

---

## Why this file exists

Yaswanth confirmed on 2026-06-07 that the entity is not yet created and asked to record the
placeholder so it can be swapped for the real registered name later (so it isn't forgotten).

Related: `docs/DOMAIN-STRATEGY.md` (brand = BuildingAutopilot, `.ca`-first).
