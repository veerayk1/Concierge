# Concierge — Mandatory Rulebook

> **This file is the LAW.** Every feature, every screen, every line of code, every document
> produced for Concierge MUST pass every rule below. No exceptions. No shortcuts.
>
> Before starting ANY work, read this file. Before finishing ANY work, verify against this file.
> This is not a guideline — it is a hard requirement.

---

## How to Use This Rulebook

1. **Before you start** any task → Read the relevant rules
2. **While you work** → Apply every rule to every decision
3. **Before you finish** → Run the verification checklist at the bottom
4. **If a rule conflicts** with a shortcut you want to take → The rule wins. Always.

---

## Rule 1: Desktop Monitor-First Design

**Why:** 99% of users work on desktop monitors in condo management offices. These are not developers on laptops — they are security guards, property managers, and building staff sitting at a front desk with a large monitor.

**Requirements:**
- Design for **1920x1080 monitors first**, then adapt down to tablet and mobile
- Use the full screen real estate — side panels, multi-column layouts, split views, dashboard grids
- Never design cramped layouts optimized for small screens and then stretch them for desktop
- Mobile is a **secondary** experience for on-the-go tasks (guard patrols, resident self-service)
- Test every screen at 1920x1080 before testing at any smaller size

**Verification:** Can a person sitting at a front desk monitor use this screen comfortably without squinting, scrolling excessively, or feeling like the layout wastes space?

---

## Rule 2: Non-Technical Users

**Why:** Every user of this system — security guards, property managers, board members, building supervisors, contractors, amenity specialists, patrol guards — is a non-technical person. They do not understand technology like software engineers. They should never need to.

**Requirements:**
- Every screen must pass the **"30-second test"**: Can a first-time user figure out what to do within 30 seconds?
- No technical jargon anywhere in the UI (no "API", "webhook", "JSONB", "RBAC" — use plain English)
- Every complex feature needs a **tooltip** (i icon) explaining what it does in plain language
- Labels must be self-explanatory — "Add New Package" not "Create Event"
- Icons must always have text labels (no icon-only buttons except universally understood ones like X for close)
- Error messages must tell the user **what went wrong** and **what to do about it** in plain language
- Never show a blank screen — every empty state must have guidance ("No packages yet. Click + New Package to log your first delivery.")
- Onboarding flows for first-time users of each role

**Verification:** Could a 55-year-old security guard who has never used software beyond email understand this screen on their first day?

---

## Rule 3: Admin Experience is Paramount

**Why:** The Admin (property manager or building owner) is the person who PAYS for the software. From a business psychology standpoint — if the security guard loves the product but the Admin hates their interface, we lose the contract. The Admin decides whether we stay or go.

**Requirements:**
- Admin interface must be the **most polished, most intuitive, most powerful** interface in the entire system
- Admin must have **zero friction** — no dead ends, no "contact support" moments, no confusing settings
- Admin must feel like they have **superpowers** — complete control over every aspect of the system
- Admin dashboard should feel like a **command center** — powerful but effortless
- Every Admin action must have clear confirmation, undo capability where possible, and never be destructive without warning
- Admin should be able to configure everything without asking for help: roles, permissions, event types, notification templates, AI features, branding, billing — ALL of it
- UX quality priority hierarchy: **Super Admin > Property Admin > Property Manager > Front Desk/Concierge > Security > Residents**

**Verification:** If you were paying $500/month for this software, would you feel like you have full control and never feel lost or frustrated?

---

## Rule 4: Admin/Super Admin Panel — Design from First Principles

**Why:** We never had admin-level access to any of the 3 competitor platforms we researched. We saw user-level interfaces only. The Admin and Super Admin panels are the MOST IMPORTANT parts of the system (see Rule 3) and we have the LEAST research data on them.

**Requirements:**
- Every Admin/Super Admin feature must be designed from **first principles and industry best practices**, not from competitor research
- Extra design attention, extra review passes, extra testing for Admin features
- Admin features to design with maximum care: property onboarding, billing, multi-property management, API key management, AI configuration, user provisioning, role creation, audit logs, system health monitoring, notification template management, branding/theming
- When in doubt about an Admin feature, research how the best SaaS platforms handle it (Stripe Dashboard, Shopify Admin, Firebase Console) — these are gold-standard admin experiences
- Explicitly mark in documentation which Admin features are "researched from competitors" vs "designed from best practices"

**Verification:** Does this Admin feature feel like it belongs in a Stripe-quality dashboard? Would a non-technical building owner understand it?

---

## Rule 5: Zero Ambiguity in Requirements

**Why:** The PRD and all specifications must be so detailed that an AI coding agent or a junior developer can implement them with zero questions. Vague requirements lead to wrong implementations, which lead to rework, which leads to delays.

**Requirements:**
- Every field must specify: data type, max length, required/optional, default value, validation rules, error messages
- Every button must specify: what it does on click, success state, failure state, loading state
- Every screen must specify: desktop layout, tablet layout, mobile layout, empty state, loading state, error state, full state
- No vague phrases like "handle gracefully" or "appropriate error" — say exactly what happens
- Write at **10th-grade reading level** — simple words, short sentences, no assumptions about domain knowledge
- If something could be interpreted two ways, it's not specific enough — rewrite until there's only one interpretation

**Verification:** Could a 10th-grade student read this requirement and explain exactly what needs to be built?

---

## Rule 6: No Competitor Names — Legal Protection

**Why:** As Concierge grows, we cannot risk legal claims of IP infringement or reverse engineering. All product-facing documents must be clean.

**Requirements:**
- NEVER mention: Aquarius, BuildingLink, Condo Control, Condo Control Central, ICON
- Use instead: "industry research", "competitive analysis", "best practices observed in the market"
- Internal research docs (`docs/`, `docs/platform-2/`, `docs/platform-3/`) can keep names — they're internal
- Product-facing docs (`docs/prd/`, any future product docs) must be completely clean
- When referencing features inspired by research, say "based on industry best practices" not "from [competitor]"

**Verification:** Run a text search for all competitor names. Zero results in product-facing documents.

---

## Rule 7: AI at Every Stage

**Why:** AI is our core differentiator. Every competing platform was built 10+ years ago without AI. We integrate intelligence at every interaction — it should feel invisible, like the system just "knows" what you need.

**Requirements:**
- Before building any feature, ask: "Where can AI make this easier, faster, or smarter?"
- After building any feature, validate: "Did we miss any AI integration opportunity?"
- 105 AI capabilities are defined in `19-ai-framework.md` — cross-reference every module
- AI must degrade gracefully — if AI is down, the feature still works (just without smart suggestions)
- Super Admin can toggle any AI feature on/off per module
- Cost-conscious: use the cheapest model that gets the job done (Haiku for simple tasks, Sonnet for complex)
- AI should feel invisible — it makes things better without being loud about it

**Verification:** For this feature, have we identified every place AI could help? Is there a graceful fallback if AI is unavailable?

---

## Rule 8: Feature Completeness — Nothing Gets Missed

**Why:** Users may not need every feature on day one. But when they eventually encounter a problem, they expect the platform to solve it. A missing feature = a frustrated customer = potential churn. We documented 800+ fields across 46 research files. Every single one must be accounted for.

**Requirements:**
- Every module PRD must cross-reference the specific research files it draws from
- Every module PRD must have a completeness checklist at the end
- Every field, dropdown option, workflow, and edge case from research must appear in the PRD
- If a researched feature is deliberately excluded, document WHY (don't just silently drop it)
- Before finalizing any module: go through the research files line by line
- The feature catalog (17 functional areas) is the master reference
- `PLATFORM-COMPARISON.md` "Concierge Decision" column must be honored for every feature

**Verification:** For this module, have I read every line of every relevant research file and confirmed each item appears in the PRD or is explicitly marked as "not included (reason)"?

---

## Rule 9: Progressive Disclosure — Don't Overwhelm

**Why:** Non-technical users (Rule 2) get overwhelmed by too many options. But power users eventually need those options. The solution: show basic first, reveal advanced on demand.

**Requirements:**
- Default forms must be lean — only fields used 80%+ of the time are visible by default
- Advanced fields hide behind "Show More" or expandable sections
- Settings pages use tabs or accordion sections, not one giant scrolling page
- Navigation is role-aware — each role sees only their relevant menu items (not 60 items for everyone)
- One primary action per screen — if two CTAs compete for attention, the design is wrong
- Color is reserved for status and actions only — not decoration

**Verification:** Does this screen show the minimum needed for the common case? Can a power user access advanced options without leaving the page?

---

## Rule 10: Analytics Embedded Everywhere

**Why:** Competing platforms have zero real analytics. Every module in Concierge ships with three layers of analytics, giving property managers and admins actionable insights, not just raw data.

**Requirements:**
- Every module gets three analytics layers:
  1. **Operational Dashboard** — Real-time counts, status breakdowns, trend sparklines
  2. **Performance Analytics** — Staff metrics, response times, SLA compliance
  3. **AI Insights** — Pattern detection, anomaly alerts, predictive recommendations
- Charts must specify: chart type, axes, data source, formula for KPIs
- Alert thresholds must be configurable by Admin
- Drill-down paths: click KPI → filtered list → individual record
- Export capability on every analytics view (CSV, Excel, PDF)

**Verification:** For this module, are all three analytics layers defined with specific charts, KPIs, and alert thresholds?

---

## Rule 11: Multi-Channel Notifications from Day One

**Why:** Competing platforms are email-only or email-plus-one-channel. We support Email, SMS, Push, and Voice from launch. Residents choose their preferred channels. No email-only dead ends.

**Requirements:**
- Every notification event must support all 4 channels (email, SMS, push, voice)
- Residents can set preferences per channel, per notification type
- Emergency broadcasts override preferences (push → SMS → voice cascade)
- Notification templates are admin-configurable (not hardcoded)
- Do-not-disturb hours for non-emergency notifications
- Batch/digest options to prevent notification fatigue

**Verification:** For this notification, are all 4 channels supported? Can the resident control their preferences? Can the admin customize the template?

---

## Rule 12: Data Security, PII Encryption & Multi-Framework Compliance

**Why:** Concierge is a multi-tenant SaaS platform handling PII from multiple buildings, multiple property management companies, and multiple boards of directors. Each has sensitive incident reports, financial data, legal documents, and personal information. If a condo loses data and we cannot recover it, we lose that client AND our reputation. One public data incident could kill the company. This is not optional — it is existential.

**Requirements:**

### Encryption (Non-Negotiable for Every Feature)
- All data encrypted **at rest** (AES-256) and **in transit** (TLS 1.3)
- **Application-level double encryption** for critical PII: SIN, passport numbers, bank accounts, credit cards, medical information, access codes, alarm codes
- Encryption keys managed via cloud KMS, rotated quarterly
- Per-property encryption keys — if one property is compromised, others are unaffected
- PII must be classified into tiers (Critical / Sensitive / Standard) and handled accordingly
- **Every feature** that stores, displays, transmits, or exports PII must follow the encryption and access rules defined in `01-architecture.md` Section 13

### Backup & Disaster Recovery
- **Continuous PITR** (Point-in-Time Recovery) — can restore to any second within the retention window
- **Automated daily snapshots** — compressed and encrypted before storage
- **Geographic redundancy** — primary (Toronto), secondary (Montreal), cold (Calgary) — all within Canada
- **Per-property backup isolation** — one property's backup/restore does not affect others
- **Configurable retention policies** — Super Admin sets per property (minimum: 7 days hot, 30 days warm)
- **RPO: 1 hour** maximum data loss. **RTO: 4 hours** to full service restoration
- **Periodic integrity verification** — weekly checksum validation, monthly test restore, quarterly full DR drill
- **Super Admin Backup Health Dashboard** — real-time visibility into backup status, storage, health, and alerts for every property

### PII Handling (Global Rule — Every Module Must Comply)
- Application logs NEVER contain PII — log sanitization middleware strips PII before writing
- PII is stripped before sending to AI providers (Claude/OpenAI) — anonymized identifiers only
- Exported files inherit the exporter's permission level — Tier 1 PII exports require additional confirmation
- Notifications minimize PII exposure — "You have a package" not "John Smith, your Amazon order #12345 is here"
- When a resident moves out, PII is archived encrypted, then permanently deleted after the retention period
- Every read of critical or sensitive PII is logged: who, when, from where, why

### Multi-Framework Compliance
This platform must be designed and built to satisfy **all** of the following compliance frameworks simultaneously:

1. **PIPEDA** (Personal Information Protection and Electronic Documents Act) — Canadian federal privacy law. All personal information collected with informed consent. Data residency: all data stored in Canadian data centers. Breach notification to Privacy Commissioner within 72 hours. Right to access and right to correction for all residents.

2. **GDPR** (General Data Protection Regulation) — EU data protection, required for international expansion. Right to erasure ("right to be forgotten"). Data portability (export all resident data in standard format). Consent tracking (when, what, how consent was given). Data Processing Agreements (DPA) with all sub-processors. Lawful basis for processing documented for each data type.

3. **SOC 2 Type II** — Security, Availability, Processing Integrity, Confidentiality, Privacy. Access controls documented and enforced. Audit trails for all data access. Change management procedures. Incident response plan documented. Annual penetration testing. Continuous monitoring of security controls.

4. **ISO 27001** — Information Security Management System (ISMS). Formal risk assessment and risk treatment plan. Security policies documented and reviewed annually. Asset inventory and classification. Access control policy with least-privilege principle. Incident management procedures. Business continuity planning.

5. **ISO 27701** — Privacy Information Management (extension of ISO 27001). PII controller and processor roles defined. Privacy impact assessments for new features. Data subject rights procedures (access, correction, deletion). Cross-border data transfer safeguards. Privacy-by-design embedded in development lifecycle.

6. **ISO 27017** — Cloud Security Controls. Cloud-specific security controls for multi-tenant isolation. Shared responsibility model documented. Virtual machine and container hardening. Cloud service customer data protection. Secure data deletion when tenants leave.

7. **ISO 9001** — Quality Management System. Documented processes for all critical operations. Regular internal audits. Continuous improvement cycle (Plan-Do-Check-Act). Customer focus in all design decisions. Evidence-based decision making.

8. **HIPAA** (Health Insurance Portability and Accountability Act) — Relevant because resident profiles may store medical conditions, accessibility needs, emergency medical information. Protected Health Information (PHI) must be encrypted at rest and in transit. Minimum necessary standard — only show medical info to roles that need it. Business Associate Agreements (BAA) with any third party that touches health data. Breach notification within 60 days for health data specifically. Access logs for all PHI access must be retained for 6 years.

### Security Incident Response
- Incident classification (P1-P4) with defined response times
- P1 (confirmed breach): containment within 15 minutes, Super Admin notified within 15 minutes, affected property admins within 1 hour, Privacy Commissioner within 72 hours
- Post-incident report within 7 days
- Super Admin Incident Dashboard showing active incidents, timelines, affected scope, and resolution status

**Verification:** Does this feature handle PII? If yes: Is it encrypted per the tier? Is access logged? Is it stripped before AI processing? Is it excluded from application logs? Is it handled correctly in exports and notifications? Does the backup/recovery strategy cover it? Does the implementation satisfy ALL 8 compliance frameworks listed above?

---

## Verification Checklist — Run Before Completing ANY Work

Before marking any task as done, verify:

- [ ] **Rule 1**: Designed for desktop monitors first (1920x1080)?
- [ ] **Rule 2**: Understandable by a non-technical person in 30 seconds?
- [ ] **Rule 3**: Admin experience is frictionless and powerful?
- [ ] **Rule 4**: Admin features designed from first principles (not guessed from limited research)?
- [ ] **Rule 5**: Zero ambiguity — every field, button, and screen fully specified?
- [ ] **Rule 6**: Zero competitor names in product-facing documents?
- [ ] **Rule 7**: AI integration opportunities identified and specified?
- [ ] **Rule 8**: Every feature from research accounted for (or explicitly excluded with reason)?
- [ ] **Rule 9**: Progressive disclosure applied — basic first, advanced on demand?
- [ ] **Rule 10**: Three analytics layers defined with specific charts and KPIs?
- [ ] **Rule 11**: Multi-channel notifications with resident preferences?
- [ ] **Rule 12**: Data security, PII encryption, backup/DR, and multi-framework compliance (PIPEDA, GDPR, SOC 2, ISO 27001, ISO 27701, ISO 27017, ISO 9001, HIPAA)?

---

*This rulebook is a living document. Every instruction from the product owner gets added here as a new rule. Every rule applies to every piece of work — past, present, and future.*

*Last updated: 2026-03-14*
*Rules: 12*
