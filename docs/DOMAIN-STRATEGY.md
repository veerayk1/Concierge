# Domain & Brand Strategy

> Plain-language plan for how we use our domains now, and how we add the US later.
> Keep this. When the US day comes, this tells you (or whoever builds it) exactly what to do.

---

## The name

**BuildingAutopilot**

We own both:

- `buildingautopilot.ca` (Canada — our main market)
- `buildingautopilot.com` (kept safe for the future / US)

Why "BuildingAutopilot": clear, memorable, and "Building" covers _every_ property type
(condos, apartments, rentals, mixed-use, commercial) — it does not box us into condos.

---

## The simple picture: one shop, signs on the door

We have **one shop** (one app, one database, one team). A domain is just a **sign on the door.**
Adding a second country later = hanging a **second sign on the same shop**, not building a new shop.

---

## What we do NOW (Canada-first)

Everything customers see uses **`.ca`**:

| Thing                 | Address                          |
| --------------------- | -------------------------------- |
| Website / landing     | `buildingautopilot.ca`           |
| Log in                | `buildingautopilot.ca/login`     |
| The app (after login) | `buildingautopilot.ca/dashboard` |
| Support email         | `support@buildingautopilot.ca`   |

- **One domain, on the main address** (no `app.` subdomain — people only need to remember one thing).
- The app lives on the **same domain** as the website, separated by the path (`/login`, `/dashboard`).
  This matches how the code is already built (Next.js route groups like `(portal)`).
- **`.com` is parked safely:** point it to redirect to `.ca` so no one can grab it and nothing is lost.

---

## What we do LATER (when US customers want in)

Hang the `.com` sign on the **same shop**. Same product, same data, same team — two signs.

| Task                                         | How hard                                     | Roughly    |
| -------------------------------------------- | -------------------------------------------- | ---------- |
| Point `.com` at the site                     | Trivial (DNS)                                | Minutes    |
| Show US copy/pricing on `.com`               | Easy (detect which domain the visitor used)  | Hours      |
| `support@buildingautopilot.com` → same inbox | Easy (email alias/forward into one helpdesk) | Minutes    |
| Serve the same app on `.com` too             | Easy (attach 2nd domain to the project)      | Hours      |
| **Stay logged in across `.ca` AND `.com`**   | **Moderate — the one real task**             | A few days |

### The one real task, in plain terms

A login "remembers you" with a small token tied to **one** domain. `.ca` and `.com` are different
domains, so a login on `.ca` doesn't automatically carry over to `.com`. Making login work smoothly
on both is a **well-known, solved problem** (same idea as "Log in with Google"). It's a contained
few-days job done **once** — not a rebuild.

**Simple fallback if we don't want to bother:** keep one shared login page for everyone. US customers
see `.com` everywhere else (site, emails, support); they only briefly touch the shared login. Most
never notice.

---

## Cheap insurance (do this while building now)

Build login/accounts the **standard, clean way** — do **not** hard-code `buildingautopilot.ca`
into odd corners of the auth code. If auth is built normally (Next.js defaults are fine), switching
on the US `.com` face later is smooth, with no surprises.

---

## The key reassurances

- The **expensive, painful** change is the _name/primary domain_ — and that's **already locked in.**
- Adding `.com` later is **additive** (stack a new layer), not a migration. App, database, customer
  accounts, and brand all stay exactly as they are.
- We are **not** locking ourselves into anything by going `.ca`-only now.

---

## One-sentence summary

**Now:** build the shop, hang the `.ca` sign, keep `.com` safe in the back.
**Later:** hang `.com` next to it and have a developer make one key open both doors.
