# Deep Dive: Emergency Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: No dedicated URL — opens as modal/overlay from sidebar
**Sidebar label**: "Emergency"
**Page title**: "Emergency Procedure for Bond"

### Page Layout
1. **Header**: Title "Emergency Procedure for {Building Name}" + Back button (← arrow + "Back" text)
2. **Content area**: Single text content block displaying the emergency procedure

### Navigation
| Element | Type | Action |
|---------|------|--------|
| ← Back | Button (top right) | Returns to previous page |

---

## 2. Content Display

### Current State
The emergency procedure content shows **"null"** — no emergency procedure has been configured for this building.

**Key insight**: This is a **read-only content display page**. The emergency procedure text is configured elsewhere (likely in Settings) and displayed here for quick staff access. When configured, it would contain building-specific emergency instructions (fire evacuation routes, utility shutoff locations, emergency contacts, etc.).

### Expected Content (based on module purpose)
Emergency procedures typically include:
- Fire evacuation procedures
- Medical emergency response
- Gas leak / carbon monoxide protocols
- Power outage procedures
- Flood / water damage response
- Elevator entrapment procedures
- Building lockdown procedures
- Emergency contact numbers (fire dept, police, ambulance, property manager)
- Utility shutoff locations (water, gas, electrical)

---

## 3. Concierge Design Implications

### Strengths to Preserve
1. **Quick sidebar access** — One click from any page to view emergency procedures
2. **Building-specific** — Procedures scoped to each building (important for multi-building properties)
3. **Simple display** — Clean, uncluttered presentation for emergency situations

### Gaps & Issues to Fix
1. **Not configured** — Content is "null" (not set up for this building)
2. **No structured format** — Appears to be a single text block, not structured sections
3. **No emergency contacts inline** — No phone number quick-dial buttons
4. **No printable version** — No print-friendly layout for posting
5. **No categories** — No separation by emergency type (fire, medical, flood, etc.)
6. **No images/diagrams** — No floor plans, evacuation maps, or shutoff diagrams
7. **No versioning** — No update history or version tracking
8. **No offline access** — Requires internet connection to view
9. **No multilingual support** — No visible language options for diverse resident populations
10. **No emergency broadcast** — This is view-only; no ability to trigger emergency notifications from here
11. **No link to emergency contacts tab** — Doesn't connect to user profile emergency contacts

---

## 4. Data Model (Deduced)

```
EmergencyProcedure
├── building_id → Building
├── content (text/html — single content block)
├── updated_at (datetime)
└── updated_by → User
```

**Note**: Emergency procedures are likely configured in Settings > Building Settings, not directly on this page. This page is purely a display/reference view.

---

*Last updated: 2026-03-14*
*Content status: Not configured ("null")*
*Page type: Read-only content display*
