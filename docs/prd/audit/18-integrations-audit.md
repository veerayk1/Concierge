# Audit: PRD 18 -- Integrations

> Cross-reference of PRD 18 against research files: `docs/settings.md` (Aquarius), `docs/platform-3/deep-dive-store.md` (Condo Control), `docs/platform-3/deep-dive-buzzer-codes.md` (Condo Control), `docs/PLATFORM-COMPARISON.md`, and all platform research.

---

## Summary

PRD 18 is the most thorough integrations document across the entire PRD set. It defines 13 integration categories with field-level specs, error handling, fallback strategies, rate limits, and cost estimates for every provider. All major integration gaps identified in competitive analysis are addressed. The document correctly identifies that no competitor had webhook support, public API access, calendar sync, or smart building hardware integration -- and specifies all of these. Minor gaps exist around i18n/multi-language support and a few edge cases from competitor research.

---

## CONFIRMED -- Features Properly Covered

| Research Feature | Research Source | PRD 18 Location | Notes |
|-----------------|----------------|-----------------|-------|
| Stripe payment integration | Condo Control store, Aquarius Tab 4 | 3.1 Payment -- Stripe | Comprehensive: 9 config fields, data flow, error handling for 5 scenarios, fallback when Stripe is down. Exceeds both Aquarius (basic key entry) and Condo Control (Stripe but non-functional) |
| Multi-channel notifications (email + SMS + push + voice) | PLATFORM-COMPARISON.md | 3.2 SendGrid, 3.3 Twilio, 3.4 FCM | All four channels specified with dedicated providers. Addresses Aquarius's email-only limitation |
| Email delivery with bounce tracking | BuildingLink research | 3.2 Email -- SendGrid | Bounce threshold, auto-suppress after 2 hard bounces, delivery status webhooks |
| SMS notifications | PLATFORM-COMPARISON.md (P2 only) | 3.3 SMS and Voice -- Twilio | SMS with opt-out keyword, daily limits, delivery status tracking |
| Voice emergency broadcast | PLATFORM-COMPARISON.md (P2 only) | 3.3 SMS and Voice -- Twilio | TwiML scripts, concurrent call limits (50), retry logic, real-time delivery dashboard |
| Push notifications | PLATFORM-COMPARISON.md | 3.4 Push -- FCM | Web + iOS + Android via FCM, TTL configuration, stale token cleanup |
| Calendar sync for amenity bookings | PLATFORM-COMPARISON.md (absent from all 3 platforms) | 3.7 Calendar Sync | iCal feeds for Google Calendar, Apple Calendar, Outlook. Unique differentiator |
| Digital signage / lobby screens | BuildingLink research | 3.12 Digital Signage | v3 feature. Polling-based display with emergency override, configurable content rotation |
| Weather dashboard widget | Condo Control research | 3.13 Weather -- OpenWeatherMap | Current conditions, 7-day forecast, severe weather alerts, AI briefing integration |
| CSV/Excel import for migration | PLATFORM-COMPARISON.md | 3.11 Import/Export | 8 import types (units, residents, vehicles, FOBs, buzzer codes, parking permits, vendors, equipment), dry run, validation preview, error reports |
| Export in multiple formats (CSV, Excel, PDF) | Condo Control (10 formats) | 3.11 Import/Export | CSV, XLSX, PDF with record limits per format. Fewer than CC's 10 formats but covers the essential three |
| Smart building hardware (locks, intercoms, cameras) | Not in any competitor | 3.8 Smart Building | v2 feature. Adapter pattern for August, Yale, Salto, ButterflyMX, Verkada, etc. Key differentiator |
| Outbound webhooks | Not in any competitor | 3.9 Webhooks | 13 subscribable event types, HMAC-SHA256 signing, retry logic, delivery replay |
| Public API with API keys | Not in any competitor | 3.10 Public API | RESTful, 10 scopes, rate limiting, IP whitelisting, OpenAPI docs |
| Cloud storage for file uploads | All platforms (implicit) | 3.6 Cloud Storage -- AWS S3 | Presigned URLs, virus scanning, CDN, lifecycle to Glacier, thumbnail generation |
| AI provider integration | Not in any competitor | 3.5 AI Providers | Claude + OpenAI, budget controls, PII stripping, cache TTL, auto-fallback |
| Payment for amenity bookings | Condo Control (Stripe) | 3.1 Payment -- Stripe | Apple Pay, Google Pay via Stripe Elements. Auto-refund on cancellation. Exceeds CC |
| Notification fallback chain | BuildingLink (multi-channel) | 3.3 Fallback Strategy | push > SMS > email > voice (non-emergency); voice > SMS > push > email (emergency) |

---

## GAPS -- Features Missing from PRD 18

| # | Missing Feature | Research Source | Severity | Recommendation |
|---|----------------|----------------|----------|----------------|
| 1 | **Multi-language / i18n integration** | PLATFORM-COMPARISON.md ("i18n from day one" decision) | Medium | The comparison matrix lists "Multi-language" as a platform feature with the Concierge decision "i18n from day one." PRD 18 does not specify how translation/localization is handled. No translation API integration (e.g., Google Translate API for user-generated content) or locale configuration is defined. This could be a PRD 17 (Mobile) or PRD 01 (Architecture) concern, but the integration aspect (translation API, locale-aware templates) belongs here. Add a section or cross-reference. |
| 2 | **Intercom/buzzer integration with smart building systems** | Condo Control buzzer-codes.md + PLATFORM-COMPARISON.md | Low | PRD 18 Section 3.8 mentions intercom systems (ButterflyMX, Aiphone, 2N) but does not connect to the Buzzer Code Directory in PRD 16. When a smart intercom system is integrated, buzzer codes could be synced automatically rather than manually entered. Add a note about intercom-to-buzzer-code sync in v2+. |
| 3 | **In-app real-time chat integration** | PLATFORM-COMPARISON.md (P3: "Built-in chat widget") | Low | The comparison matrix has "Built-in chat widget" as a P3 feature with the decision "Consider real-time chat for staff communication." PRD 18 does not specify a chat/messaging integration (e.g., WebSocket-based in-app chat or integration with a chat provider). This may be covered in PRD 20 (Innovation Roadmap) as a future feature. |

---

## WEAK COVERAGE -- Features Present but Underspecified

| # | Feature | Research Source | PRD 18 Location | Issue | Recommendation |
|---|---------|----------------|-----------------|-------|----------------|
| 1 | **Export format parity with Condo Control** | Condo Control (10 export formats) | 3.11 Import/Export | PRD specifies 3 formats (CSV, XLSX, PDF). Condo Control offered 10 formats including Word, MHTML, RTF, OpenDocument, etc. While 3 formats cover 95% of use cases, the "Concierge Decision" in the comparison matrix says "Support multiple export formats." | Consider adding Word (DOCX) as a fourth format. The remaining 6 formats from CC are rarely used and not worth the engineering cost. |
| 2 | **Favourite/saved reports** | PLATFORM-COMPARISON.md (P3: star toggle for favourites) | Not in PRD 18 | The comparison matrix has "Favourite/saved reports" as a P3 win. This is more of a PRD 10 (Reports) feature than an integration, but the export/report infrastructure in 3.11 does not mention saved configurations. | Verify PRD 10 covers saved/favourite reports with star toggle. |
| 3 | **Backup SMTP provider** | PRD 18 Section 3.2 mentions it | 3.2 Fallback Strategy | The fallback strategy mentions "a backup SMTP provider" for critical emails but does not provide configuration fields for this backup provider. | Add backup SMTP configuration fields (host, port, username, password) as an advanced setting under the SendGrid integration, or document that the platform ships with a built-in basic SMTP fallback. |
| 4 | **Store/e-commerce payment flow** | Condo Control store (FOB replacements, permits) | Not in PRD 18 | The Stripe integration (3.1) is scoped to amenity booking payments. The Condo Control Store module used Stripe for a broader set of property purchases (FOB replacements, parking permit purchases, deposits). The Store is v3+ per CLAUDE.md, so this gap is expected. | No action for v1. When the Store module is built, extend Stripe integration to support product catalog purchases beyond amenity bookings. |
| 5 | **Notification preference granularity** | Condo Control ("Module-organized email preferences -- 12 notification types") | PRD 18 mentions resident preferences but does not detail the configuration | Condo Control's module-organized email preferences (Amenity, Announcements, Events, etc.) are noted in CLAUDE.md as a strength. PRD 09 (Communication) likely covers this. | Verify PRD 09 specifies per-module notification preferences matching or exceeding CC's 12 categories. |

---

## Cross-Reference Notes

- **Payment configuration fields**: PRD 16 (Settings) Section 3.1.3 has "Enable online payments" and "Enable in-person payments" toggles. PRD 18 Section 3.1 has the actual Stripe credential fields. The two PRDs complement each other correctly.
- **Import/Export**: Both PRD 16 (Tab 13: Data Import/Export) and PRD 18 (Section 3.11) cover import/export. PRD 16 focuses on the admin UI; PRD 18 focuses on the technical implementation. No conflict -- they are consistent.
- **AI providers**: PRD 18 Section 3.5 covers integration mechanics; PRD 19 (AI Framework) covers the 105 AI features. Correct separation of concerns.
- **Webhook endpoints**: PRD 18 Section 10.7 defines inbound webhook endpoints for Stripe, SendGrid, and Twilio callbacks. These are not duplicated elsewhere.

---

*Audited: 2026-03-14*
*Research files checked: 5*
*PRD sections reviewed: 13 integration categories + data model + user flows + analytics*
