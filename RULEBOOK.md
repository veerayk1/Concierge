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

## Rule 13: Unit & Component Testing — 95%+ Coverage

**Why:** Untested code is broken code waiting to break in production. In a multi-tenant condo platform handling security incidents, access codes, and financial data, a single uncaught bug can cascade across properties. 95% coverage is not aspirational — it is the minimum acceptable standard.

**Requirements:**

- 95% minimum **line AND branch coverage** for ALL code — backend, frontend, shared libraries, utilities
- New code introduced in any pull request must have **100% coverage** — zero untested new code ships
- CI/CD pipeline **hard-fails** if overall coverage drops below 95% — no overrides, no exceptions
- Every UI component tested for: correct rendering, all user interactions (click, hover, focus, blur, keyboard), all error states, loading states, empty states, and boundary conditions
- Every API function tested for: valid inputs, invalid inputs, missing inputs, null/undefined values, boundary values, and type coercion edge cases
- **Mutation testing** with a minimum 80% mutation score — tests must catch real bugs, not just execute code paths
- No test that only asserts "it rendered" or "it did not throw" — every test must verify **observable behavior** (output values, DOM changes, API responses, state transitions)
- Coverage reports generated on every PR and visible in the PR review interface
- Flaky tests are treated as P2 bugs — identified, tracked, and fixed within 24 hours

**Verification:** Is the overall test coverage at or above 95% for both lines and branches, and does every new line of code in this PR have a corresponding test that verifies behavior (not just execution)?

---

## Rule 14: Integration Testing

**Why:** Unit tests prove individual pieces work. Integration tests prove the system works as a whole. In a multi-tenant platform where a package arrival triggers notifications across channels and appears in a resident's portal, a failure at any integration point means a broken user experience.

**Requirements:**

- Every API endpoint tested for **every HTTP method it supports** and **every possible status code**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 422 (unprocessable), 429 (rate limited), 500 (server error)
- **Multi-tenant isolation tests**: automated tests that prove Property A's users, API keys, and queries cannot access, modify, or even detect the existence of Property B's data — tested for every data-accessing endpoint
- **RBAC matrix coverage**: every role (Super Admin, Property Admin, Property Manager, Front Desk, Security, Resident, Board Member) tested against every endpoint — verified that permitted actions succeed AND forbidden actions return 403
- **Cross-module workflow tests** covering end-to-end flows: package arrival → event creation → notification dispatch → resident portal display; maintenance request → vendor assignment → status updates → resident notification; amenity booking → approval → calendar update → reminder notification
- **Third-party integration tests**: mocked integration tests run on every PR; live sandbox integration tests run nightly against actual third-party APIs (payment processors, SMS providers, push notification services, email services)
- **Database migration tests**: every migration tested both UP and DOWN — verify data integrity is preserved in both directions, verify rollback does not lose data
- **Contract tests** between frontend and backend — API contract changes detected before they break consumers
- Integration test suite must complete in under 15 minutes — parallelize aggressively

**Verification:** For this feature, are all API endpoints tested across all status codes, all roles verified in the RBAC matrix, multi-tenant isolation proven, and end-to-end workflows validated from trigger to final user-visible outcome?

---

## Rule 15: Accessibility Testing

**Why:** Condo buildings are home to residents of all abilities — elderly residents, residents with visual impairments, residents with motor disabilities. Accessibility is not a nice-to-have. It is a legal requirement in many jurisdictions and a moral obligation. An inaccessible portal excludes the people who need building services the most.

**Requirements:**

- **WCAG 2.2 Level AA compliance is mandatory** — not optional, not aspirational, not "we'll fix it later"
- **Automated accessibility scan runs on every PR** — PR cannot be merged if any WCAG AA violations are detected
- Every interactive element (buttons, links, inputs, dropdowns, modals, tabs, accordions, date pickers) must be **fully operable via keyboard alone** using Tab, Shift+Tab, Enter, Space, Escape, and Arrow keys
- **Color contrast minimum**: 4.5:1 ratio for normal text (under 18pt), 3:1 ratio for large text (18pt+ or 14pt+ bold), 3:1 ratio for UI components and graphical objects
- **Screen reader compatibility**: all images have meaningful alt text (or aria-hidden if decorative), all form inputs have associated labels, all regions have ARIA landmarks, dynamic content changes announced via aria-live regions, all custom components have appropriate ARIA roles and states
- **Focus management**: visible focus indicators on all interactive elements, logical focus order matching visual layout, focus trapped inside open modals, focus returned to trigger element when modal closes
- No information conveyed by **color alone** — always pair color with text, icons, or patterns (critical for status indicators and error states)
- **Annual manual accessibility audit** conducted with real assistive technology users (screen reader users, keyboard-only users, switch device users) — findings tracked as P2 bugs with 24-hour fix SLA for critical barriers
- All video and audio content must have captions and transcripts

**Verification:** Does this feature pass automated WCAG 2.2 AA scanning with zero violations, and can a keyboard-only user and a screen reader user complete every workflow without barriers?

---

## Rule 16: Code Quality Standards

**Why:** Code quality is not about aesthetics — it is about maintainability, debuggability, and long-term velocity. Sloppy code creates compounding technical debt that slows every future feature. In a platform that must serve properties for years, every file must be clean enough for a new developer to understand without asking questions.

**Requirements:**

- **TypeScript strict mode enabled globally** — `strict: true` in tsconfig, no `any` types anywhere (use `unknown` + type guards), strict null checks enforced, no implicit returns, no unused variables or parameters
- **Maximum cyclomatic complexity: 10 per function** — enforced by linter, no exceptions
- **Maximum function length: 50 lines** — if a function exceeds 50 lines, it must be decomposed
- **Maximum file length: 400 lines** — if a file exceeds 400 lines, it must be split into focused modules
- **Linting (ESLint) and formatting (Prettier) enforced in CI** — zero warnings, zero errors, no `eslint-disable` comments without a linked ticket explaining why
- Every pull request requires **minimum 2 code reviewers** who have approved — no self-merges, no single-reviewer merges
- **No dead code** — unused functions, unused imports, unused variables, unreachable code blocks are CI failures
- **No commented-out code** — if code is not needed, delete it (git preserves history)
- **No TODO/FIXME/HACK comments without a linked ticket** — every TODO must reference a tracked issue (e.g., `// TODO(CONC-1234): Implement retry logic`)
- Consistent naming conventions enforced: camelCase for variables/functions, PascalCase for components/classes/types, SCREAMING_SNAKE_CASE for constants, kebab-case for file names
- All magic numbers and magic strings extracted into named constants with explanatory names

**Verification:** Does this code pass all linting and formatting checks with zero warnings, contain no `any` types, have no function exceeding 50 lines or 10 cyclomatic complexity, and has every TODO linked to a tracked ticket?

---

## Rule 17: Documentation & Knowledge Transfer

**Why:** If the original developer leaves and no one can understand the code, the project is dead. Documentation is not extra work — it is insurance against knowledge loss. Every decision, every API, every component must be documented well enough that a new developer can be productive within their first week.

**Requirements:**

- Every public function, method, and exported module has **JSDoc/TSDoc documentation** — description, parameters with types, return value, thrown exceptions, and a usage example for complex functions
- **API documentation auto-generated from code** using OpenAPI/Swagger spec — every endpoint, every request/response schema, every error code documented and always in sync with the implementation
- **Architecture Decision Records (ADR)** written for every significant technical decision — what was decided, what alternatives were considered, why this option was chosen, what trade-offs were accepted
- Every module directory contains a **README.md** explaining: module purpose, directory structure, key files, dependencies, how to run tests, and important design decisions
- **Storybook stories for every UI component** showing: default state, all variants/sizes, loading state, error state, empty state, disabled state, interactive state, and edge cases (long text, missing data)
- **Runbook for every production operation** — deployment, rollback, database migration, cache clearing, log investigation, incident escalation, backup restoration, tenant provisioning, tenant offboarding
- **New developer onboarding guide** — maintained, tested by having a team member follow it quarterly, updated immediately when any step is outdated
- Changelog maintained for every release — what changed, what was fixed, what was added, what was deprecated

**Verification:** Can a new developer who has never seen this codebase understand this module's purpose, run its tests, and make a change within one day using only the documentation provided?

---

## Rule 18: Acceptance & Audit Rights

**Why:** Shipping a feature that has not been formally accepted is shipping a guess. In a platform managing security, access control, and financial data for condo properties, guesses are unacceptable. Every feature must pass formal acceptance, and every client must have the right to audit how their data is handled.

**Requirements:**

- **User Acceptance Testing (UAT) required for every feature** before production deployment — no feature goes live without sign-off from a designated tester or product owner
- **UAT environment must be identical to production** — same infrastructure, same configuration, same data volume characteristics, same third-party integrations (sandbox mode)
- **Release acceptance criteria checklist with 12+ gates** that must ALL pass before deployment: (1) all tests pass, (2) coverage thresholds met, (3) accessibility scan clean, (4) SAST scan clean, (5) DAST scan clean, (6) performance benchmarks met, (7) UAT sign-off obtained, (8) documentation updated, (9) runbook reviewed, (10) rollback plan documented, (11) monitoring alerts configured, (12) feature flags configured for gradual rollout
- **Client audit rights**: property management companies can request and receive a detailed report of how their data is stored, accessed, encrypted, backed up, and retained — within 5 business days of request
- **Third-party auditor access**: SOC 2 and ISO auditors receive defined read-only access to audit logs, security configurations, and compliance evidence — scoped to prevent data exposure
- **Bug SLAs enforced and tracked**:
  - P1 (system down / data breach): response within 15 minutes, fix within 4 hours
  - P2 (major feature broken / security vulnerability): response within 1 hour, fix within 24 hours
  - P3 (minor feature broken / UX issue): response within 4 hours, fix within 1 week
  - P4 (cosmetic / enhancement): response within 24 hours, fix within 1 sprint
- **Feature flags mandatory for all new features** — gradual rollout (1% → 10% → 50% → 100%), no big-bang releases that affect all properties simultaneously
- **Automated rollback**: if error rate exceeds 1% threshold within 10 minutes of deployment, system automatically rolls back to previous version within 5 minutes — no human intervention required

**Verification:** Has this feature passed all 12 release gates, been formally accepted in UAT, and been configured for gradual rollout with automated rollback?

---

## Rule 19: Security Testing

**Why:** Concierge handles building access codes, resident PII, security incident reports, and financial data across multiple properties. A single security vulnerability — cross-tenant data leak, privilege escalation, injection attack — could expose hundreds of residents' data and destroy the company. Security testing is not a phase — it is a permanent, continuous requirement.

**Requirements:**

- **Authentication testing**: brute force protection verified (account lockout after 5 failed attempts), session management tested (sessions expire after inactivity, sessions invalidated on password change), token expiry enforced (access tokens max 15 minutes, refresh tokens max 7 days), multi-factor authentication flows tested for all bypass scenarios
- **Authorization testing**: horizontal escalation tests (User A cannot access User B's data within the same role), vertical escalation tests (Resident cannot access Admin endpoints), cross-tenant escalation tests (Property A staff cannot access Property B data) — automated for every endpoint
- **Input validation testing**: SQL injection (parameterized queries verified), XSS (reflected, stored, and DOM-based), CSRF (token validation on every state-changing request), command injection, path traversal, SSRF, XML/JSON injection — ALL attack vectors tested and blocked with automated test suites
- **PII exposure testing**: automated scans confirming PII NEVER appears in application logs, URL parameters, query strings, error messages, client-side JavaScript variables, browser localStorage/sessionStorage, or network responses to unauthorized roles
- **Regression tests for every fixed vulnerability**: when a security bug is fixed, a permanent automated test is added that specifically reproduces the original attack — this test must never be deleted
- **Quarterly penetration testing** by an independent third-party security firm — scope includes all API endpoints, web application, mobile application, infrastructure, and social engineering
- **Critical and High severity findings block deployment** until resolved and verified — no exceptions, no risk acceptance for Critical findings
- **Security headers enforced**: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Referrer-Policy, Permissions-Policy — tested on every response

**Verification:** Have all authentication, authorization, and input validation attack vectors been tested? Is there a regression test for every previously fixed vulnerability? Are the latest penetration test findings all resolved?

---

## Rule 20: Static Application Security Testing (SAST)

**Why:** Security vulnerabilities caught in code review cost 10x less to fix than those found in production. SAST analyzes source code for vulnerabilities before the code ever runs. In a platform handling PII and access credentials, every line of code must be scanned before it reaches any environment.

**Requirements:**

- **SAST runs on EVERY pull request** — Critical and High severity findings block merge, no exceptions
- **Nightly full SAST scan on the main branch** — results reviewed by the security lead within 24 hours every business day
- **Custom SAST rules for Concierge-specific patterns**: PII handling without encryption, multi-tenant data queries without tenant_id filter, direct database access bypassing the data access layer, encryption key handling outside KMS, hardcoded configuration values
- **Remediation SLAs enforced and tracked**:
  - Critical: remediated within 24 hours of detection
  - High: remediated within 72 hours of detection
  - Medium: remediated within 1 week of detection
  - Low: remediated within 1 sprint of detection
- **Secrets scanning on every commit and across full git history** — zero tolerance for hardcoded API keys, database passwords, encryption keys, tokens, or certificates in source code — pre-commit hooks block commits containing secrets
- **License compliance scanning for all dependencies** — no GPL-licensed dependencies in proprietary code, no dependencies with known vulnerabilities (CVE), automated alerts when dependency licenses change
- **Developers must have SAST tooling in their IDE** (shift-left security) — vulnerabilities flagged in real-time as code is written, before it even reaches a pull request
- SAST tool configuration stored in version control and reviewed as part of security audits
- False positive rate tracked — if SAST false positive rate exceeds 20%, rules must be tuned within 1 week

**Verification:** Has SAST been run on this code with zero Critical or High findings, are all secrets scanning checks passing, and are all dependency licenses compliant?

---

## Rule 21: Dynamic Application Security Testing (DAST)

**Why:** SAST finds vulnerabilities in code. DAST finds vulnerabilities in the running application — misconfigurations, authentication bypasses, injection flaws that only manifest at runtime. In a multi-tenant platform, DAST is the last automated line of defense before a vulnerability reaches real users and real data.

**Requirements:**

- **DAST runs against the staging environment on every release candidate** — Critical and High findings block promotion to production
- **Weekly scheduled DAST scan** against the staging environment — results reviewed within 24 hours every business day
- **Authenticated scans for EVERY user role**: Super Admin, Property Admin, Property Manager, Front Desk/Concierge, Security Guard, Resident, Board Member — each role scanned separately to detect role-specific vulnerabilities and privilege escalation paths
- **Cross-tenant DAST**: automated scan attempts to access other tenants' data using valid credentials from a different tenant — any successful cross-tenant data access is treated as a P1 Critical incident
- **API fuzzing against all endpoints** using the OpenAPI specification — random, malformed, oversized, and boundary-value inputs sent to every parameter of every endpoint, with responses validated against expected error handling
- **Remediation SLAs identical to SAST**:
  - Critical: remediated within 24 hours of detection
  - High: remediated within 72 hours of detection
  - Medium: remediated within 1 week of detection
  - Low: remediated within 1 sprint of detection
- **DAST findings correlated with SAST findings** in a unified security dashboard — deduplicated, prioritized, and tracked through resolution with full audit trail
- **Zero false-negative tolerance for OWASP Top 10** — DAST configuration must be validated quarterly to ensure it detects all OWASP Top 10 vulnerability categories
- DAST scan results archived for 2 years for compliance audit purposes

**Verification:** Has DAST been run against this release candidate with authenticated scans for every role, cross-tenant isolation validated, API fuzzing completed, and all Critical/High findings resolved before production deployment?

---

## Rule 22: Data Protection Impact Assessment (DPIA) for New PII Fields

**Why:** GDPR Article 35 and ISO 27701 require a Data Protection Impact Assessment before any processing that is likely to result in a high risk to data subjects' rights. In a condo management platform that handles resident PII, every new field that collects personal information must be assessed for privacy impact before it reaches production. This prevents accidental scope creep of data collection without proper justification.

**Requirements:**

- **Every PR that introduces a new PII field** (any field that stores personally identifiable information as defined in COMPLIANCE-MATRIX.md Section 2) **must include a completed DPIA section in the PR description** before it can be approved
- **DPIA fields required in the PR description**:
  1. **Field name and data type**: What is being collected (e.g., "date_of_birth, date field on Resident model")
  2. **PII classification tier**: Tier 1 (Critical), Tier 2 (Sensitive), or Tier 3 (Standard) per the encryption matrix
  3. **Purpose of collection**: Why this data is needed (specific business justification, not generic "for the platform")
  4. **Lawful basis**: Which legal basis applies — consent, contract, legitimate interest, legal obligation, vital interests, or public task (GDPR Art. 6)
  5. **Data subjects affected**: Which user types (residents, staff, vendors, visitors)
  6. **Retention period**: How long the data will be kept and what happens after (anonymize, delete, archive)
  7. **Access scope**: Which roles can read this field, which can write it
  8. **Encryption tier confirmation**: Confirmation that the field will be encrypted at the correct tier
  9. **Cross-border transfer**: Whether this data will be sent to any third-party provider (and if so, which)
  10. **Risk assessment**: Low / Medium / High risk to data subjects, with justification
- **Reviewer responsibility**: At least one PR reviewer must verify the DPIA section is complete and the risk assessment is reasonable. If risk is Medium or High, the DPO (or Security Officer if no DPO) must also approve.
- **CI enforcement**: A PR template check verifies the presence of the DPIA section when file changes touch model definitions or database migrations. Missing DPIA blocks merge.
- **DPIA registry**: Completed DPIAs are indexed in the ROPA (Record of Processing Activities, `docs/tech/ROPA.md`) within 5 business days of the PR merging.
- **Existing fields**: The initial DPIA for all existing PII fields is documented in `docs/tech/COMPLIANCE-MATRIX.md` Section 2 (Data Inventory). This rule applies to all NEW fields introduced after the initial compliance audit.

**Verification:** Does this PR introduce any new PII fields? If yes, is the DPIA section complete in the PR description with all 10 required items, and has the appropriate reviewer (DPO for Medium/High risk) approved it?

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
- [ ] **Rule 13**: Unit & component test coverage at 95%+ (lines AND branches), 100% for new code, mutation score 80%+?
- [ ] **Rule 14**: Integration tests covering all endpoints × all status codes × all roles, multi-tenant isolation proven, cross-module workflows validated?
- [ ] **Rule 15**: WCAG 2.2 Level AA compliant, keyboard accessible, screen reader compatible, color contrast verified?
- [ ] **Rule 16**: TypeScript strict mode, no `any` types, cyclomatic complexity ≤10, functions ≤50 lines, files ≤400 lines, 2 reviewers, zero dead code?
- [ ] **Rule 17**: JSDoc on all public functions, OpenAPI spec current, ADRs written, Storybook stories for all components, runbooks for all operations?
- [ ] **Rule 18**: UAT passed, all 12 release gates cleared, feature flags configured, automated rollback in place, bug SLAs defined?
- [ ] **Rule 19**: Authentication, authorization, and injection testing complete, PII exposure verified clean, penetration test findings resolved?
- [ ] **Rule 20**: SAST passed with zero Critical/High findings, secrets scan clean, dependency licenses compliant?
- [ ] **Rule 21**: DAST passed for all roles, cross-tenant isolation validated, API fuzzing complete, findings correlated with SAST in unified dashboard?
- [ ] **Rule 22**: If new PII fields introduced, DPIA section complete in PR description with all 10 items, DPO/Security Officer approved for Medium/High risk?

---

_This rulebook is a living document. Every instruction from the product owner gets added here as a new rule. Every rule applies to every piece of work — past, present, and future._

_Last updated: 2026-03-14_
_Rules: 21_
