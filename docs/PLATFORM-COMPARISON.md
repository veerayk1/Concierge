# Platform Comparison Matrix

Side-by-side feature comparison between Platform 1 (Aquarius/ICON) and Platform 2 (BuildingLink) to inform Concierge design decisions.

---

## Feature Matrix

| Feature | Aquarius (P1) | BuildingLink (P2) | Winner | Concierge Decision |
|---------|:------------:|:-----------------:|:------:|-------------------|
| **FRONT DESK / EVENT LOGGING** | | | | |
| Log/Event creation | ✅ 6 log types | ✅ Unified events + types | P2 | Unified event model with customizable types |
| Log display | Table rows | Card grid + color coding | P2 | Card-based with table option toggle |
| Batch event creation | ❌ | ✅ 4-row batch form | P2 | Implement batch mode |
| Print labels | ❌ | ✅ Per-event print | P2 | Implement label printing |
| Event type icons | ❌ | ✅ Courier logos + colors | P2 | Custom icons per event type |
| Event grouping modes | ❌ | ✅ 4 grouping modes | P2 | Implement smart grouping |
| Shift log | ❌ | ✅ Persistent top-bar access | P2 | Build as always-accessible feature |
| Incident tracking | ❌ Separate | ✅ 123 pending observed | P2 | Dedicated incident module |
| Front desk instructions | ❌ | ✅ Per-unit + management | P2 | Per-unit instruction system |
| | | | | |
| **PACKAGE MANAGEMENT** | | | | |
| Package tracking | ✅ Basic | ✅ Courier-specific | P2 | Courier-aware with branded icons |
| Package types | ✅ 11 physical types | ✅ 15 courier types | P2 | Both physical + courier types |
| Package notifications | ✅ Email only | ✅ Email + Voice + SMS | P2 | Multi-channel notifications |
| Perishable flagging | ✅ Checkbox | ✅ Dedicated type | Tie | Prominent perishable alerts |
| Storage spots | ✅ Dropdown | ❌ Not observed | P1 | Keep storage spot tracking |
| Batch package recording | ✅ Bulk button | ✅ 4-row form | P2 | Batch with better UX |
| Package release flow | ✅ Release button | ✅ Event close | Tie | Explicit release workflow |
| Auto-generated reference # | ✅ | ❌ Not observed | P1 | Keep auto-reference numbers |
| | | | | |
| **MAINTENANCE** | | | | |
| Maintenance requests | ✅ Basic form | ✅ 20+ field form | P2 | Rich form with smart defaults |
| Photo attachments | ❌ | ✅ Multi-format upload | P2 | Photo + document uploads |
| Document attachments | ❌ | ✅ PDF/DOC/XLS | P2 | Implement doc attachments |
| Permission to enter | ❌ | ✅ Yes/No toggle | P2 | Add entry permission field |
| Entry instructions | ❌ | ✅ 1000 char textarea | P2 | Add entry instructions |
| Work order printing | ❌ | ✅ Print checkbox | P2 | Generate printable work orders |
| High urgency flag | ❌ | ✅ Checkbox | P2 | Priority + urgency system |
| Vendor assignment | ❌ | ✅ Dropdown linked to directory | P2 | Link vendors to requests |
| Equipment linkage | ❌ | ✅ Dropdown linked to equipment | P2 | Link equipment to requests |
| Create in Hold/Close status | ❌ | ✅ Status toggle with dates | P2 | Allow status on creation |
| Export to Excel | ❌ | ✅ On listing page | P2 | Export on all listing pages |
| Category system | ✅ 11 categories | ✅ Configurable | Tie | Configurable categories |
| | | | | |
| **EQUIPMENT & ASSETS** | | | | |
| Equipment tracking | ❌ | ✅ Full module | P2 | Implement equipment module |
| Equipment categories | ❌ | ✅ 6 default categories | P2 | Configurable categories |
| Replacement reports | ❌ | ✅ Dedicated report | P2 | Lifecycle management |
| Recurring tasks | ❌ | ✅ Full scheduler + forecast | P2 | Build task scheduler |
| Inspections | ❌ | ✅ Mobile-first with checklists | P2 | Implement with modern UX |
| Asset manager | ❌ | ✅ Building asset tracking | P2 | Consider for v2 |
| | | | | |
| **VENDOR / CONTRACTOR MANAGEMENT** | | | | |
| Contractor directory | ✅ Basic (name, phone, email) | ✅ Full directory with address | P2 | Comprehensive vendor profiles |
| Insurance compliance | ❌ | ✅ 5-status dashboard | P2 | Compliance tracking essential |
| Vendor master list | ❌ | ✅ Shared database | P2 | Consider vendor network |
| Link to maintenance | ❌ | ✅ Direct assignment | P2 | Vendor ↔ request linkage |
| | | | | |
| **AMENITY / RESERVATION MANAGEMENT** | | | | |
| Amenity booking | ✅ Basic | ✅ Full reservation system | P2 | Rich reservation system |
| Calendar view | ❌ | ✅ List + Calendar + Grid views | P2 | Multiple view modes |
| Reservation approval | ❌ | ✅ Status workflow (Requested) | P2 | Approval workflow |
| | | | | |
| **PARKING** | | | | |
| Parking spot | ✅ Text field on unit | ✅ Full permit system | P2 | Permit-based system |
| Parking violations | ✅ Dedicated section | ❌ Not observed | P1 | Keep violation tracking |
| Permit types setup | ❌ | ✅ Configurable permit types | P2 | Configurable permits |
| Permit printing | ❌ | ✅ Print permit | P2 | Print support |
| Vehicle registry | ✅ 3 vehicles per user | ✅ Dedicated vehicles tab | Tie | Comprehensive vehicle tracking |
| | | | | |
| **COMMUNICATION** | | | | |
| Email sending | ✅ Basic | ✅ With template system | P2 | Rich email composer |
| Announcements | ✅ Single channel | ✅ Multi-channel (3 channels) | P2 | Multi-channel distribution |
| Emergency broadcast | ✅ Basic emergency module | ✅ Voice + SMS broadcast | P2 | Modern push + SMS + voice |
| Surveys | ✅ Basic | ✅ Full survey builder | Tie | Survey builder with analytics |
| Library/Documents | ✅ Basic | ✅ Active document tracking | Tie | Document management |
| Public display/signage | ❌ | ✅ Lobby screen config | P2 | Consider for premium tier |
| Photo albums | ❌ | ✅ Photo gallery | P2 | Community photo feature |
| Special email groups | ❌ | ✅ Custom distribution lists | P2 | Email group management |
| | | | | |
| **USER / UNIT MANAGEMENT** | | | | |
| Unit profiles | ✅ Basic form | ✅ Modular 10-section overview | P2 | Modular, drag-reorderable sections |
| Unit custom fields | ❌ | ✅ Configurable fields | P2 | Custom field system |
| User profile tabs | ✅ 6 tabs | ✅ 3 tabs (Overview, Details, Documents) | P1 | Comprehensive tabbed profile |
| FOB/Key tracking | ✅ 6 slots | ❌ Not observed at unit level | P1 | Keep FOB/key management |
| Buzzer codes | ✅ 2 slots | ❌ Not observed | P1 | Keep buzzer codes |
| Garage clickers | ✅ 2 slots | ❌ Not observed | P1 | Keep garage clicker tracking |
| Pet registration | ✅ Basic | ✅ Pet registry module | Tie | Dedicated pet module |
| Emergency contacts | ✅ Dedicated tab | ❌ Not prominently featured | P1 | Keep emergency contacts prominent |
| Parcel waivers | ✅ Dedicated section | ❌ Not observed | P1 | Keep waiver management |
| Welcome emails | ✅ Configurable templates | ❌ Not observed | P1 | Keep onboarding email system |
| | | | | |
| **SECURITY** | | | | |
| Security logs | ✅ Dedicated security menu | ❌ Unified event model | P1 | Dedicated security workflows |
| Parking violations | ✅ Full violation system | ❌ Not observed | P1 | Keep violation tracking |
| Emergency assistance | ✅ Dedicated module | ❌ Not observed as separate | P1 | Keep emergency assistance |
| | | | | |
| **REPORTS & ANALYTICS** | | | | |
| Reports | ✅ Basic | ✅ 4 report categories | P2 | Comprehensive reporting |
| Excel export | ❌ Limited | ✅ On most pages | P2 | Export everywhere |
| PDF export | ❌ | ✅ On some pages | P2 | PDF export support |
| | | | | |
| **PLATFORM FEATURES** | | | | |
| Multi-language | ❌ | ✅ Language selector | P2 | i18n from day one |
| Mobile app | ❌ | ✅ GEO app + Resident App | P2 | Mobile-first design |
| Tiered feature gating | ❌ All-or-nothing | ✅ Premium features visible/disabled | P2 | Modular pricing tiers |
| Quick search (global) | ❌ | ✅ Top-bar search | P2 | Global search essential |
| Alteration tracking | ❌ | ✅ 18-column project tracker | P2 | Renovation management |
| Know your residents | ❌ | ✅ Gamified staff training | P2 | Staff training tools |
| Resident ID system | ❌ | ✅ Passports, ID cards, verification | P2 | Identity management |
| Purchase orders | ❌ | ✅ Procurement tracking | P2 | Consider for v2 |
| Board governance | ❌ | ✅ Board options | P2 | Consider for v2 |

---

## Score Summary

| Category | P1 Wins | P2 Wins | Tie |
|----------|---------|---------|-----|
| Front Desk / Events | 0 | 9 | 0 |
| Package Management | 2 | 4 | 2 |
| Maintenance | 0 | 11 | 1 |
| Equipment & Assets | 0 | 6 | 0 |
| Vendor Management | 0 | 4 | 0 |
| Amenity / Reservations | 0 | 3 | 0 |
| Parking | 1 | 3 | 1 |
| Communication | 0 | 5 | 2 |
| User / Unit Management | 5 | 3 | 2 |
| Security | 3 | 0 | 0 |
| Reports | 0 | 3 | 0 |
| Platform Features | 0 | 9 | 0 |
| **TOTAL** | **11** | **60** | **8** |

### Key Takeaway

BuildingLink is a significantly more feature-rich platform. However, Aquarius has strengths in:
1. **Security-specific workflows** — Dedicated security menu with violation tracking
2. **Physical access management** — FOBs, buzzer codes, garage clickers, key tags
3. **Emergency contacts** — Prominently featured
4. **Simpler onboarding** — Welcome email system
5. **Parcel waivers** — Legal document management

**Concierge should**: Take BuildingLink's breadth of features, combine with Aquarius's security and access management strengths, and wrap it all in a modern, Apple-grade design system with role-aware interfaces and intelligent defaults.
