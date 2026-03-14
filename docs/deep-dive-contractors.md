# Deep Dive: Contractors Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: No dedicated URL — opens as modal/overlay from sidebar
**Sidebar label**: "Contractors"
**Page title**: "List of contractors for Bond"

### Page Layout
1. **Header**: Title "List of contractors for {Building Name}" + Back button (← arrow + "Back" text)
2. **Contractor list**: Vertical stack of contractor cards

### Navigation
| Element | Type | Action |
|---------|------|--------|
| ← Back | Button (top right) | Returns to previous page |

---

## 2. Contractor Cards

Each contractor is displayed in a simple card with 3 lines of information:

### Card Fields
| # | Field | Type | Notes |
|---|-------|------|-------|
| 1 | Company/Contractor Name | Bold text | First line |
| 2 | Phone Number | Plain text | Second line (may include contact person name in parentheses) |
| 3 | Specialty/Description | Blue link text | Third line — service type or description |

### Existing Contractors (7 contractors observed)
| # | Name | Phone | Specialty/Description |
|---|------|-------|-----------------------|
| 1 | CITYWIDE LOCKSMITH | 905-264-4401 | Lock Smith |
| 2 | ABM plumbing | 416-798-0003 | Plumber |
| 3 | Arsin Appliance- Dave | 416-220-7589 | Appliance Repair |
| 4 | Interior care | 4168561650 (Stephen Gregersen) | Flood cleanup services 24/7 and carpet cleaning |
| 5 | Diverse Air Systems Inc. | 416-560-2366 | In-suite heating and cooling problems-Resident /Owner must make cal |
| 6 | MERRIET | 416-238-5782 | In-suite heating and cooling problems-Resident /Owner must make call |
| 7 | Provident energy management system | 416-736-0630 | For hydro bill and Hydrometers |

### Key observations:
- **Specialty as link** — The specialty/description appears as blue link text (possibly clickable for more info?)
- **Contact person in phone** — Some entries embed the contact person name in parentheses with the phone number (e.g., "4168561650 (Stephen Gregersen)")
- **Duplicate services** — Two entries (#5 and #6) provide the same HVAC service with the same description
- **Inconsistent naming** — Some ALL CAPS (CITYWIDE LOCKSMITH, MERRIET), some title case, some with contact names
- **Phone format inconsistent** — Mix of "416-xxx-xxxx" and "416xxxxxxx" formats
- **Description doubles as notes** — Some descriptions include operational notes ("Resident /Owner must make call")
- **No categories** — Contractors are listed flat, not grouped by specialty

---

## 3. Service Categories (Deduced from contractor list)

| Category | Contractor(s) |
|----------|---------------|
| Locksmith | CITYWIDE LOCKSMITH |
| Plumbing | ABM plumbing |
| Appliance Repair | Arsin Appliance- Dave |
| Water/Flood Cleanup | Interior care |
| HVAC (Heating/Cooling) | Diverse Air Systems Inc., MERRIET |
| Utilities/Energy | Provident energy management system |

---

## 4. Concierge Design Implications

### Strengths to Preserve
1. **Quick sidebar access** — One click from any page to view contractor list
2. **Building-specific** — Contractors scoped to each building
3. **Simple display** — Name, phone, specialty in a scannable format
4. **Operational notes** — Descriptions include instructions ("Resident must make call")

### Gaps & Issues to Fix
1. **No CRUD for contractors** — No visible Add, Edit, or Delete buttons (read-only display)
2. **No contractor categories** — Flat list, not grouped by service type
3. **No email field** — Only phone numbers, no email addresses
4. **No address field** — No business address for contractors
5. **No insurance/compliance** — No insurance status, expiry dates, or WSIB tracking
6. **No clickable phone** — Phone numbers not clickable for one-tap calling
7. **No search/filter** — Can't search or filter the contractor list
8. **No rating/review** — No feedback mechanism for contractor performance
9. **No availability/hours** — No business hours or availability info
10. **No emergency designation** — No flag for 24/7 emergency contractors vs regular
11. **No website/link** — No contractor website URLs
12. **No contact person field** — Contact names embedded in phone number field (hacky)
13. **No sort order** — Unclear how contractors are ordered (not alphabetical)
14. **No history** — No record of past jobs or interactions with contractors
15. **Configured elsewhere** — Contractor data appears managed in Settings, not editable from this page

---

## 5. Data Model (Deduced)

```
Contractor
├── id (auto-generated)
├── company_name (string)
├── phone_number (string — free text, inconsistent formatting)
├── specialty_description (string — acts as both category and description)
├── building_id → Building
├── contact_person (string — currently embedded in phone field)
├── created_at (datetime)
└── updated_at (datetime)
```

**Note**: Contractors are likely configured in Settings > Building Settings. This page is purely a reference/directory view for front desk staff.

---

*Last updated: 2026-03-14*
*Total contractors: 7*
*Service categories: 6 (Locksmith, Plumbing, Appliance, Water Cleanup, HVAC, Utilities)*
*Page type: Read-only directory display*
