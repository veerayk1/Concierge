# Platform Comparison Matrix

Side-by-side feature comparison between Platform 1 (Aquarius/ICON), Platform 2 (BuildingLink), and Platform 3 (Condo Control) to inform Concierge design decisions.

---

## Feature Matrix

| Feature | Aquarius (P1) | BuildingLink (P2) | Condo Control (P3) | Winner | Concierge Decision |
|---------|:------------:|:-----------------:|:------------------:|:------:|-------------------|
| **FRONT DESK / EVENT LOGGING** | | | | | |
| Log/Event creation | ✅ 6 log types | ✅ Unified events + types | ✅ 7 entry types (unified console) | P2 | Unified event model with customizable types |
| Log display | Table rows | Card grid + color coding | ✅ Card/grid with color-coded icons | P2 | Card-based with table option toggle |
| Batch event creation | ❌ | ✅ 4-row batch form | ❌ Not observed | P2 | Implement batch mode |
| Print labels | ❌ | ✅ Per-event print | ✅ Per-event print | P2 | Implement label printing |
| Event type icons | ❌ | ✅ Courier logos + colors | ✅ Courier-specific icons | P2 | Custom icons per event type |
| Event grouping modes | ❌ | ✅ 4 grouping modes | ✅ 20+ filter options | P2 | Implement smart grouping with rich filtering |
| Shift log | ❌ | ✅ Persistent top-bar access | ✅ Pass-On Log entry type | P2 | Build as always-accessible feature |
| Incident tracking | ❌ Separate | ✅ 123 pending observed | ✅ Open/closed incident reports | P2 | Dedicated incident module |
| Front desk instructions | ❌ | ✅ Per-unit + management | ❌ Not observed | P2 | Per-unit instruction system |
| | | | | | |
| **PACKAGE MANAGEMENT** | | | | | |
| Package tracking | ✅ Basic | ✅ Courier-specific | ✅ Courier-specific | P2 | Courier-aware with branded icons |
| Package types | ✅ 11 physical types | ✅ 15 courier types | ✅ Courier types | P2 | Both physical + courier types |
| Package notifications | ✅ Email only | ✅ Email + Voice + SMS | ✅ Email only | P2 | Multi-channel notifications |
| Perishable flagging | ✅ Checkbox | ✅ Dedicated type | ❌ Not observed | Tie | Prominent perishable alerts |
| Storage spots | ✅ Dropdown | ❌ Not observed | ❌ Not observed | P1 | Keep storage spot tracking |
| Batch package recording | ✅ Bulk button | ✅ 4-row form | ❌ Not observed | P2 | Batch with better UX |
| Package release flow | ✅ Release button | ✅ Event close | ❌ Not observed | Tie | Explicit release workflow |
| Auto-generated reference # | ✅ | ❌ Not observed | ❌ Not observed | P1 | Keep auto-reference numbers |
| | | | | | |
| **MAINTENANCE** | | | | | |
| Maintenance requests | ✅ Basic form | ✅ 20+ field form | ❌ Not visible from concierge role | P2 | Rich form with smart defaults |
| Photo attachments | ❌ | ✅ Multi-format upload | ❌ Not visible | P2 | Photo + document uploads |
| Document attachments | ❌ | ✅ PDF/DOC/XLS | ❌ Not visible | P2 | Implement doc attachments |
| Permission to enter | ❌ | ✅ Yes/No toggle | ❌ Not visible | P2 | Add entry permission field |
| Entry instructions | ❌ | ✅ 1000 char textarea | ❌ Not visible | P2 | Add entry instructions |
| Work order printing | ❌ | ✅ Print checkbox | ❌ Not visible | P2 | Generate printable work orders |
| High urgency flag | ❌ | ✅ Checkbox | ❌ Not visible | P2 | Priority + urgency system |
| Vendor assignment | ❌ | ✅ Dropdown linked to directory | ❌ Not visible | P2 | Link vendors to requests |
| Equipment linkage | ❌ | ✅ Dropdown linked to equipment | ❌ Not visible | P2 | Link equipment to requests |
| Create in Hold/Close status | ❌ | ✅ Status toggle with dates | ❌ Not visible | P2 | Allow status on creation |
| Export to Excel | ❌ | ✅ On listing page | ❌ Not visible | P2 | Export on all listing pages |
| Category system | ✅ 11 categories | ✅ Configurable | ❌ Not visible | Tie | Configurable categories |
| | | | | | |
| **EQUIPMENT & ASSETS** | | | | | |
| Equipment tracking | ❌ | ✅ Full module | ❌ Not observed | P2 | Implement equipment module |
| Equipment categories | ❌ | ✅ 6 default categories | ❌ Not observed | P2 | Configurable categories |
| Replacement reports | ❌ | ✅ Dedicated report | ❌ Not observed | P2 | Lifecycle management |
| Recurring tasks | ❌ | ✅ Full scheduler + forecast | ❌ Not observed | P2 | Build task scheduler |
| Inspections | ❌ | ✅ Mobile-first with checklists | ❌ Not observed | P2 | Implement with modern UX |
| Asset manager | ❌ | ✅ Building asset tracking | ❌ Not observed | P2 | Consider for v2 |
| | | | | | |
| **VENDOR / CONTRACTOR MANAGEMENT** | | | | | |
| Contractor directory | ✅ Basic (name, phone, email) | ✅ Full directory with address | ❌ Not observed | P2 | Comprehensive vendor profiles |
| Insurance compliance | ❌ | ✅ 5-status dashboard | ❌ Not observed | P2 | Compliance tracking essential |
| Vendor master list | ❌ | ✅ Shared database | ❌ Not observed | P2 | Consider vendor network |
| Link to maintenance | ❌ | ✅ Direct assignment | ❌ Not observed | P2 | Vendor ↔ request linkage |
| | | | | | |
| **AMENITY / RESERVATION MANAGEMENT** | | | | | |
| Amenity booking | ✅ Basic | ✅ Full reservation system | ✅ 3-tab booking interface | P2 | Rich reservation system |
| Calendar view | ❌ | ✅ List + Calendar + Grid views | ✅ FullCalendar integration | P2 | Multiple view modes |
| Reservation approval | ❌ | ✅ Status workflow (Requested) | ✅ Approval workflow | P2 | Approval workflow |
| Payment for bookings | ❌ | ❌ Not observed | ✅ Stripe integration | P3 | Implement payment support for premium amenities |
| Multi-amenity calendar | ❌ | ❌ Not observed | ✅ Combined calendar view | P3 | Multi-amenity calendar view |
| | | | | | |
| **PARKING** | | | | | |
| Parking spot | ✅ Text field on unit | ✅ Full permit system | ✅ Visitor parking support | P2 | Permit-based system |
| Parking violations | ✅ Dedicated section | ❌ Not observed | ✅ Violation tracking | Tie | Keep violation tracking |
| Permit types setup | ❌ | ✅ Configurable permit types | ❌ Not observed | P2 | Configurable permits |
| Permit printing | ❌ | ✅ Print permit | ❌ Not observed | P2 | Print support |
| Vehicle registry | ✅ 3 vehicles per user | ✅ Dedicated vehicles tab | ❌ Not observed | Tie | Comprehensive vehicle tracking |
| | | | | | |
| **COMMUNICATION** | | | | | |
| Email sending | ✅ Basic | ✅ With template system | ✅ With email signature editor | P2 | Rich email composer with signature support |
| Announcements | ✅ Single channel | ✅ Multi-channel (3 channels) | ✅ 2 types (Regular, Customized) | P2 | Multi-channel distribution |
| Emergency broadcast | ✅ Basic emergency module | ✅ Voice + SMS broadcast | ❌ Not observed | P2 | Modern push + SMS + voice |
| Surveys | ✅ Basic | ✅ Full survey builder | ❌ Not observed | Tie | Survey builder with analytics |
| Library/Documents | ✅ Basic | ✅ Active document tracking | ❌ Not observed | Tie | Document management |
| Public display/signage | ❌ | ✅ Lobby screen config | ❌ Not observed | P2 | Consider for premium tier |
| Photo albums | ❌ | ✅ Photo gallery | ❌ Not observed | P2 | Community photo feature |
| Special email groups | ❌ | ✅ Custom distribution lists | ❌ Not observed | P2 | Email group management |
| Classified Ads marketplace | ❌ | ❌ | ✅ Forum-based marketplace | P3 | Consider community marketplace for resident engagement |
| | | | | | |
| **USER / UNIT MANAGEMENT** | | | | | |
| Unit profiles | ✅ Basic form | ✅ Modular 10-section overview | ✅ Unit file with group management | P2 | Modular, drag-reorderable sections |
| Unit custom fields | ❌ | ✅ Configurable fields | ❌ Not observed | P2 | Custom field system |
| User profile tabs | ✅ 6 tabs | ✅ 3 tabs (Overview, Details, Documents) | ✅ 6 tabs (User, Emergency, Vacations, Transactions, History, Docs) | P1/P3 | Comprehensive tabbed profile (P1 + P3 depth) |
| FOB/Key tracking | ✅ 6 slots | ❌ Not observed at unit level | ❌ Not observed | P1 | Keep FOB/key management |
| Buzzer codes | ✅ 2 slots | ❌ Not observed | ✅ Legacy buzzer module (271 codes) | P1/P3 | Keep buzzer codes |
| Garage clickers | ✅ 2 slots | ❌ Not observed | ❌ Not observed | P1 | Keep garage clicker tracking |
| Pet registration | ✅ Basic | ✅ Pet registry module | ❌ Not observed | Tie | Dedicated pet module |
| Emergency contacts | ✅ Dedicated tab | ❌ Not prominently featured | ✅ Dedicated tab | P1/P3 | Keep emergency contacts prominent |
| Parcel waivers | ✅ Dedicated section | ❌ Not observed | ❌ Not observed | P1 | Keep waiver management |
| Welcome emails | ✅ Configurable templates | ❌ Not observed | ❌ Not observed | P1 | Keep onboarding email system |
| Vacation/away tracking | ❌ | ❌ | ✅ Dedicated Vacations tab | P3 | Implement vacation/away tracking per resident |
| | | | | | |
| **SECURITY** | | | | | |
| Security logs | ✅ Dedicated security menu | ❌ Unified event model | ✅ Unified Security & Concierge console | P1/P3 | Dedicated security workflows |
| Parking violations | ✅ Full violation system | ❌ Not observed | ✅ Violation tracking | P1 | Keep violation tracking |
| Emergency assistance | ✅ Dedicated module | ❌ Not observed as separate | ❌ Not observed | P1 | Keep emergency assistance |
| Key checkout with ID | ❌ | ❌ | ✅ Key checkout with ID verification | P3 | Implement key checkout with identity verification |
| Authorized entry tracking | ❌ | ❌ | ✅ Dedicated entry type | P3 | Track authorized entries explicitly |
| | | | | | |
| **REPORTS & ANALYTICS** | | | | | |
| Reports | ✅ Basic | ✅ 4 report categories | ✅ 39+ pre-built reports (Telerik) | P3 | Comprehensive reporting with pre-built library |
| Excel export | ❌ Limited | ✅ On most pages | ✅ 10 export formats | P3 | Support multiple export formats |
| PDF export | ❌ | ✅ On some pages | ✅ PDF + 9 other formats | P3 | PDF export support |
| Favourite/saved reports | ❌ | ❌ Not observed | ✅ Star toggle for favourites | P3 | Implement saved/favourite reports |
| Custom reports | ❌ | ❌ Not observed | ✅ Custom reports tab | P3 | Allow custom report creation |
| | | | | | |
| **PLATFORM FEATURES** | | | | | |
| Multi-language | ❌ | ✅ Language selector | ❌ Not observed | P2 | i18n from day one |
| Mobile app | ❌ | ✅ GEO app + Resident App | ❌ Not observed | P2 | Mobile-first design |
| Tiered feature gating | ❌ All-or-nothing | ✅ Premium features visible/disabled | ❌ Not observed | P2 | Modular pricing tiers |
| Quick search (global) | ❌ | ✅ Top-bar search | ❌ Not observed | P2 | Global search essential |
| Alteration tracking | ❌ | ✅ 18-column project tracker | ❌ Not observed | P2 | Renovation management |
| Know your residents | ❌ | ✅ Gamified staff training | ❌ | P2 | Staff training tools |
| Resident ID system | ❌ | ✅ Passports, ID cards, verification | ❌ Not observed | P2 | Identity management |
| Purchase orders | ❌ | ✅ Procurement tracking | ❌ Not observed | P2 | Consider for v2 |
| Board governance | ❌ | ✅ Board options | ❌ Not observed | P2 | Consider for v2 |
| Two-factor auth (2FA) | ❌ | ❌ Not observed | ✅ Optional, user-controlled | P3 | Implement optional 2FA for all users |
| Training / LMS | ❌ | ❌ | ✅ 16 courses + learning paths | P3 | Build training module for staff onboarding |
| Idea board | ❌ | ❌ | ✅ Post Idea / Browse Ideas | P3 | Consider community idea/feedback board |
| Built-in chat widget | ❌ | ❌ | ✅ In-app chat | P3 | Consider real-time chat for staff communication |
| Electronic consent tracking | ❌ | ❌ | ✅ Consent management | P3 | Implement electronic consent/waiver tracking |
| Email signature editor | ❌ | ❌ | ✅ CKEditor 5 rich editor | P3 | Provide configurable email signature editor |

---

## Score Summary

| Category | P1 Wins | P2 Wins | P3 Wins | Tie |
|----------|---------|---------|---------|-----|
| Front Desk / Events | 0 | 9 | 0 | 0 |
| Package Management | 2 | 4 | 0 | 2 |
| Maintenance | 0 | 11 | 0 | 1 |
| Equipment & Assets | 0 | 6 | 0 | 0 |
| Vendor Management | 0 | 4 | 0 | 0 |
| Amenity / Reservations | 0 | 3 | 2 | 0 |
| Parking | 0 | 2 | 0 | 2 |
| Communication | 0 | 5 | 1 | 2 |
| User / Unit Management | 3 | 1 | 1 | 1 |
| Security | 1 | 0 | 2 | 1 |
| Reports | 0 | 0 | 5 | 0 |
| Platform Features | 0 | 9 | 6 | 0 |
| **TOTAL** | **6** | **54** | **17** | **9** |

*Note: Some features previously won by P1 alone are now shared wins (P1/P3) where P3 also has the capability, and are counted under the leading platform. Ties updated where P3 brought parity.*

### Key Takeaway

BuildingLink remains the most feature-rich platform overall. However:

1. **Aquarius (P1)** has strengths in:
   - **Physical access management** — FOBs, buzzer codes, garage clickers, key tags
   - **Parcel waivers** — Legal document management
   - **Simpler onboarding** — Welcome email system

2. **Condo Control (P3)** introduces unique capabilities not found in either P1 or P2:
   - **Training / LMS** — 16 courses with learning paths for staff development
   - **Idea board** — Community-driven feature requests and feedback
   - **Classified Ads** — Resident-to-resident marketplace
   - **Reporting depth** — 39+ pre-built reports with 10 export formats and favourites
   - **Payment integration** — Stripe for amenity bookings
   - **2FA** — Optional two-factor authentication
   - **Key checkout with ID verification** — Security-first key management
   - **Built-in chat** — Real-time in-app communication
   - **Electronic consent tracking** — Digital consent/waiver management

3. **BuildingLink (P2)** leads in:
   - **Maintenance depth** — 7 sub-modules with 20+ field forms
   - **Equipment & asset management** — Full lifecycle tracking
   - **Vendor compliance** — Insurance tracking with 5-status dashboard
   - **Multi-channel communication** — Email + SMS + Voice + Push
   - **Alteration tracking** — Renovation project management
   - **Platform maturity** — Mobile apps, i18n, public displays

**Concierge should**: Take BuildingLink's operational breadth, combine with Aquarius's physical access management, add Condo Control's reporting depth, payment integration, training/LMS, and community features (idea board, classified ads), and wrap it all in a modern, Apple-grade design system with role-aware interfaces, 2FA, and intelligent defaults.
