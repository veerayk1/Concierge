# 18 — Integrations

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 06-Amenity Booking, 09-Communication, 14-Dashboard, 19-AI Framework

---

## 1. Overview

Concierge connects to external services for payments, communication, AI intelligence, file storage, building hardware, and data exchange. Every integration follows the same principles: the platform works without it (graceful degradation), credentials are stored encrypted, usage is metered and logged, and Super Admin controls which integrations are active per property.

### Why Integrations Matter

Competitive analysis revealed a consistent pattern: platforms that rely on a single communication channel (email-only) or lack payment support lose adoption. The strongest platforms offer multi-channel notifications, payment processing for amenity bookings, and calendar sync for residents. Concierge goes further with webhook-based extensibility, a public API for third-party developers, smart building hardware support, and weather-aware AI briefings.

### Integration Categories

| # | Category | Provider(s) | Purpose | Phase |
|---|----------|-------------|---------|-------|
| 1 | Payment | Stripe | Amenity booking fees, deposits, fines | v1 |
| 2 | Email | SendGrid | Transactional and bulk email delivery | v1 |
| 3 | SMS / Voice | Twilio | SMS notifications, voice emergency broadcast | v1 |
| 4 | Push Notifications | Firebase Cloud Messaging (FCM) | Mobile and web push notifications | v1 |
| 5 | AI Providers | Claude API + OpenAI API | AI intelligence layer (see PRD 19) | v1 |
| 6 | Cloud Storage | AWS S3 (or compatible) | Photos, documents, attachments | v1 |
| 7 | Calendar Sync | iCal / Google Calendar | Amenity booking sync to personal calendars | v1 |
| 8 | Smart Building | Vendor APIs | Smart locks, intercoms, camera systems | v2 |
| 9 | Webhooks (Outbound) | Custom endpoints | Push events to third-party systems | v2 |
| 10 | Public API | RESTful + API keys | Third-party developer access | v2 |
| 11 | Import / Export | CSV, Excel, PDF, Word | Bulk data import, report export | v1 |
| 12 | Digital Signage | Push protocol | Announcements to lobby screens | v3 |
| 13 | Weather | OpenWeatherMap | Dashboard widget, AI briefing context | v1 |
| 14 | Localization / i18n | AI provider + static files | Multi-language UI and content translation | v1 (basic), v2 (AI translation) |
| 15 | Real-Time Chat | WebSocket | Staff-to-staff in-app messaging | v3 |

### Design Principles

| # | Principle | Detail |
|---|-----------|--------|
| 1 | **Graceful degradation** | Every integration has a fallback. If Stripe is down, bookings still work -- payment is collected later. If Twilio is down, email replaces SMS. |
| 2 | **Encrypted credentials** | All API keys and secrets are stored with AES-256 encryption at rest. Never logged, never exposed in UI after initial entry. |
| 3 | **Metered and logged** | Every external API call is tracked: provider, endpoint, response time, status code, cost. Super Admin sees usage dashboards. |
| 4 | **Per-property control** | Each property can enable/disable integrations independently. A property that does not need payment processing never sees Stripe settings. |
| 5 | **Circuit breaker pattern** | After 5 consecutive failures to an external service, the integration enters a cooldown period (60 seconds). Requests during cooldown use the fallback path. |
| 6 | **Retry with backoff** | Failed requests retry up to 3 times with exponential backoff (1s, 2s, 4s) before triggering the fallback. |

---

## 2. Research Summary

### Findings from Competitive Analysis

| Finding | Detail | Impact on Concierge |
|---------|--------|---------------------|
| **Email-only notification** | One platform supported only email notifications, no SMS or push. Residents missed time-sensitive package alerts. | Multi-channel from day one: email + SMS + push + voice. |
| **Payment for amenity bookings** | Only one of three platforms observed had Stripe integration for amenity booking fees. The others required offline payment. | Stripe integration in v1 for amenity fees, deposits, and fines. |
| **Calendar sync missing** | No platform observed offered calendar sync for amenity bookings. Residents manually copied times. | iCal and Google Calendar export for every booking. |
| **No webhook support** | None of the platforms observed offered outbound webhooks for third-party integration. | Webhook system with event subscriptions in v2. |
| **No public API** | None of the platforms observed provided a documented public API for developers. | RESTful API with API key authentication in v2. |
| **CSV import for migration** | One platform supported CSV import for bulk resident data during onboarding. | Full CSV/Excel import for units, residents, vehicles, FOBs, and more. |
| **Export formats** | The strongest platform observed offered 10 export formats including CSV, Excel, and PDF across 39+ report types. | Excel and PDF export on every listing and report page. |
| **Digital signage** | One platform supported pushing announcements to lobby display screens. | Digital signage integration in v3. |
| **Weather on dashboard** | One platform displayed current weather on the dashboard. | Weather API integration for dashboard widget and AI context. |
| **Smart building absent** | No platform observed had smart lock, intercom, or camera API integration. | Smart building integrations in v2 as a differentiator. |

---

## 3. Feature Spec

### 3.1 Payment — Stripe

#### Purpose

Process payments for amenity bookings (party room deposits, guest suite fees), recurring amenity fees, and property-imposed fines. Stripe handles PCI compliance so Concierge never touches raw card numbers.

#### Provider Details

| Attribute | Value |
|-----------|-------|
| **Provider** | Stripe |
| **Authentication** | API secret key (server-side) + publishable key (client-side) |
| **Sandbox** | Stripe test mode with test API keys for development and staging |
| **PCI scope** | SAQ-A (Stripe.js and Elements handle card data; Concierge never sees card numbers) |
| **Supported currencies** | CAD, USD (configurable per property) |
| **Supported methods** | Credit card, debit card, Apple Pay, Google Pay (via Stripe Elements) |

#### Data Flow

```
Resident selects amenity → chooses time slot → sees fee breakdown
  → clicks "Book & Pay"
  → Stripe.js collects card info (client-side, never touches Concierge server)
  → Stripe creates PaymentIntent (server-side)
  → On success: booking confirmed, receipt emailed
  → On failure: error shown, booking held for 10 minutes for retry
  → Stripe webhook → Concierge updates payment status asynchronously
```

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `stripe_secret_key` | string | 255 | Yes (if enabled) | — | Must start with `sk_live_` or `sk_test_` | "Enter a valid Stripe secret key starting with sk_live_ or sk_test_" |
| `stripe_publishable_key` | string | 255 | Yes (if enabled) | — | Must start with `pk_live_` or `pk_test_` | "Enter a valid Stripe publishable key starting with pk_live_ or pk_test_" |
| `stripe_webhook_secret` | string | 255 | Yes (if enabled) | — | Must start with `whsec_` | "Enter the webhook signing secret from your Stripe dashboard" |
| `default_currency` | enum | — | Yes | `CAD` | One of: `CAD`, `USD` | "Select a supported currency" |
| `payment_description_template` | string | 500 | No | `"{amenity_name} booking — {date}"` | — | — |
| `auto_refund_on_cancellation` | boolean | — | No | `true` | — | — |
| `refund_window_hours` | integer | — | No | `48` | 1–720 | "Refund window must be between 1 and 720 hours" |
| `minimum_charge_cents` | integer | — | No | `100` | 50–100000 | "Minimum charge must be between $0.50 and $1,000.00" |
| `statement_descriptor` | string | 22 | No | `"CONCIERGE"` | Alphanumeric + spaces only, max 22 chars | "Statement descriptor can only contain letters, numbers, and spaces (max 22 characters)" |

> **Tooltip — Statement Descriptor**: This is the text that appears on the resident's credit card statement. Keep it short and recognizable so residents know what the charge is for.

#### Rate Limits and Cost

| Metric | Value |
|--------|-------|
| **Stripe API rate limit** | 100 requests/second (standard) |
| **Concierge internal limit** | 50 payment requests/minute per property |
| **Stripe fees** | 2.9% + $0.30 per transaction (standard North American pricing) |
| **Webhook delivery** | Stripe retries failed webhooks for up to 3 days |

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Card declined | "Your payment was declined. Please try a different card or contact your bank." | Log attempt, hold booking for 10 minutes |
| Stripe API timeout | "Payment processing is taking longer than expected. Your booking will be confirmed once payment is verified." | Queue for retry, send confirmation async |
| Stripe outage | "Online payment is temporarily unavailable. Your booking has been saved. Payment will be collected when service resumes." | Create booking with `payment_status: pending`, alert admin |
| Duplicate payment | Prevented by PaymentIntent idempotency key | Stripe handles deduplication |
| Refund failure | Admin notified via dashboard alert | Log failure, flag for manual refund |

#### Fallback Strategy

If Stripe is unreachable for more than 60 seconds, bookings proceed without payment. The booking is flagged as `payment_pending`. When Stripe recovers, the system sends a payment link to the resident via their preferred notification channel. Admin sees a "Pending Payments" widget on their dashboard.

---

### 3.2 Email — SendGrid

#### Purpose

Deliver transactional emails (package notifications, booking confirmations, password resets) and bulk emails (announcements, newsletters). SendGrid provides deliverability, bounce tracking, and template rendering.

#### Provider Details

| Attribute | Value |
|-----------|-------|
| **Provider** | SendGrid (Twilio) |
| **Authentication** | API key (Bearer token) |
| **Sending modes** | Transactional (single recipient, immediate) and Marketing (bulk, scheduled) |
| **Deliverability** | Dedicated IP option for high-volume properties (1,000+ units) |

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `sendgrid_api_key` | string | 255 | Yes (if enabled) | — | Must start with `SG.` | "Enter a valid SendGrid API key starting with SG." |
| `from_email` | email | 255 | Yes | — | Valid email format, verified in SendGrid | "Enter a verified sender email address" |
| `from_name` | string | 100 | Yes | Property name | Non-empty | "Enter a sender display name" |
| `reply_to_email` | email | 255 | No | Same as `from_email` | Valid email format | "Enter a valid reply-to email address" |
| `daily_send_limit` | integer | — | No | `5000` | 100–100000 | "Daily limit must be between 100 and 100,000" |
| `bounce_threshold_percent` | integer | — | No | `5` | 1–50 | "Bounce threshold must be between 1% and 50%" |
| `unsubscribe_group_id` | integer | — | No | — | Positive integer | "Enter a valid SendGrid unsubscribe group ID" |
| `email_footer_html` | text | 2000 | No | Default Concierge footer | Valid HTML | "Footer contains invalid HTML" |
| `track_opens` | boolean | — | No | `true` | — | — |
| `track_clicks` | boolean | — | No | `true` | — | — |

> **Tooltip — Bounce Threshold**: If the percentage of bounced emails exceeds this number, sending pauses automatically and the admin is alerted. This protects your sender reputation.

#### Data Flow

```
Event occurs (package logged, announcement created, etc.)
  → Notification engine checks resident's email preference
  → If email enabled: build email from template + data
  → PII preserved in email body (emails are direct communication)
  → Send via SendGrid API
  → SendGrid returns message ID
  → Webhook callback: delivered / bounced / opened / clicked
  → Update notification_log with delivery status
```

#### Rate Limits and Cost

| Metric | Value |
|--------|-------|
| **SendGrid API rate limit** | 600 requests/minute (Essentials plan) |
| **Concierge internal limit** | 100 emails/minute per property (burst), 5,000/day default |
| **Cost** | ~$20/month for 50,000 emails (Essentials plan) |
| **Bounce handling** | Auto-suppress after 2 hard bounces to same address |

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Invalid email address | Admin sees "Email undeliverable" flag on resident profile | Mark address as invalid, exclude from future sends |
| SendGrid rate limit hit | No visible impact (queued) | Queue email, send on next available slot |
| SendGrid outage | "Email notification could not be sent. SMS notification sent instead." | Fallback to SMS if available, otherwise queue for retry |
| Bounce rate exceeded | Admin alert: "Email sending paused — bounce rate too high" | Pause sending, surface report of bounced addresses |

#### Fallback Strategy

If SendGrid is unreachable, emails are queued in a persistent retry queue with a 24-hour TTL. If the queue reaches 1,000 unsent emails for a property, the admin is notified. Critical emails (password resets, emergency broadcasts) attempt delivery through the backup SMTP provider.

**Backup SMTP Configuration** (advanced setting, collapsed by default):

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `backup_smtp_host` | string | 255 | No | -- | Valid hostname or IP | "Enter a valid SMTP host" |
| `backup_smtp_port` | integer | -- | No | 587 | 25, 465, 587, or 2525 | "SMTP port must be 25, 465, 587, or 2525" |
| `backup_smtp_username` | string | 255 | Conditional | -- | Required if host is set | "Username is required when SMTP host is configured" |
| `backup_smtp_password` | string | 255 | Conditional | -- | Required if host is set. Stored encrypted. | "Password is required when SMTP host is configured" |
| `backup_smtp_encryption` | enum | -- | No | `tls` | `none`, `tls`, `ssl` | -- |
| `backup_smtp_from_email` | email | 255 | Conditional | Inherits from primary `from_email` | Valid email format, required if host is set | "Enter a valid sender email for backup SMTP" |

> **Tooltip — Backup SMTP**: "Configure a backup SMTP provider for critical emails (password resets, emergency broadcasts) when the primary email provider is unreachable. Leave blank to rely on the retry queue only."

**"Test Backup SMTP" Button**:
- **Action**: Sends a test email to the admin's address via the backup SMTP provider
- **Loading state**: "Testing connection..." with spinner
- **Success state**: Green toast "Backup SMTP test successful -- check your inbox"
- **Failure state**: Red toast "Backup SMTP connection failed: {error_details}"

---

### 3.3 SMS and Voice — Twilio

#### Purpose

Send SMS notifications for time-sensitive events (package arrival, maintenance updates, booking reminders) and voice calls for emergency broadcasts. Twilio provides global SMS delivery and programmable voice with text-to-speech.

#### Provider Details

| Attribute | Value |
|-----------|-------|
| **Provider** | Twilio |
| **Authentication** | Account SID + Auth Token |
| **SMS** | Twilio Messaging API with sender ID or short code |
| **Voice** | Twilio Programmable Voice with TwiML for call scripts |
| **Phone numbers** | One local number per property (or shared toll-free) |

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `twilio_account_sid` | string | 50 | Yes (if enabled) | — | Must start with `AC` and be 34 chars | "Enter a valid Twilio Account SID (starts with AC)" |
| `twilio_auth_token` | string | 50 | Yes (if enabled) | — | Exactly 32 hex characters | "Enter a valid Twilio Auth Token" |
| `twilio_phone_number` | string | 20 | Yes (if SMS or Voice enabled) | — | E.164 format (e.g., `+14165551234`) | "Enter a phone number in E.164 format (e.g., +14165551234)" |
| `sms_enabled` | boolean | — | No | `true` | — | — |
| `voice_enabled` | boolean | — | No | `false` | — | — |
| `daily_sms_limit` | integer | — | No | `2000` | 100–50000 | "Daily SMS limit must be between 100 and 50,000" |
| `sms_opt_out_keyword` | string | 20 | No | `"STOP"` | Non-empty | "Enter an opt-out keyword" |
| `voice_language` | enum | — | No | `en-US` | Supported Twilio locale | "Select a supported language" |
| `voice_greeting` | string | 500 | No | `"This is an important message from {property_name}."` | — | — |
| `emergency_voice_retries` | integer | — | No | `2` | 0–5 | "Retry count must be between 0 and 5" |

> **Tooltip — Emergency Voice Retries**: For emergency broadcasts, the system will call each resident this many additional times if they do not answer. Set to 0 to call only once.

#### Data Flow — SMS

```
Notification triggered → check resident SMS preference
  → If SMS enabled and phone number on file:
  → Build message from template (160-char limit per segment)
  → Send via Twilio Messaging API
  → Twilio returns SID
  → Status callback: queued → sent → delivered / failed / undelivered
  → Update notification_log
```

#### Data Flow — Emergency Voice Broadcast

```
Admin triggers emergency broadcast
  → System loads all resident phone numbers for property
  → Builds TwiML script from emergency template
  → Initiates concurrent calls (max 50 at a time)
  → Twilio delivers voice message via text-to-speech
  → If no answer: retry per emergency_voice_retries setting
  → Status logged per resident: answered / voicemail / no_answer / failed
  → Admin sees real-time delivery dashboard
```

#### Rate Limits and Cost

| Metric | Value |
|--------|-------|
| **Twilio SMS rate limit** | 200 messages/second (toll-free), 1 message/second (local number) |
| **Concierge internal SMS limit** | 100 SMS/minute per property, 2,000/day default |
| **SMS cost** | ~$0.0079/message (US), ~$0.0085/message (Canada) |
| **Voice cost** | ~$0.014/minute (outbound, US/Canada) |
| **Emergency broadcast limit** | 50 concurrent calls per property |

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Invalid phone number | Admin sees "SMS undeliverable" flag on resident profile | Mark number as invalid, exclude from future SMS sends |
| Twilio rate limit | No visible impact (queued) | Queue SMS with backoff |
| Twilio outage (SMS) | "SMS notification could not be sent. Email notification sent instead." | Fallback to email |
| Twilio outage (Voice) | Admin alert: "Voice broadcast partially completed — X of Y calls delivered" | Queue remaining calls for retry, provide completion report |

#### Fallback Strategy

SMS failures fall back to email. Voice broadcast failures fall back to SMS (text version of the emergency message). The notification engine always attempts the next channel in the resident's preference order: push > SMS > email > voice (for non-emergency) or voice > SMS > push > email (for emergency).

---

### 3.4 Push Notifications — Firebase Cloud Messaging

#### Purpose

Deliver instant push notifications to mobile (iOS/Android via PWA or native wrapper) and web browsers. Push is the fastest channel and costs nothing per message.

#### Provider Details

| Attribute | Value |
|-----------|-------|
| **Provider** | Firebase Cloud Messaging (FCM) |
| **Authentication** | Firebase service account JSON key |
| **Platforms** | Web (service worker), iOS (APNs via FCM), Android (FCM native) |
| **Cost** | Free (no per-message cost) |

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `firebase_project_id` | string | 100 | Yes (if enabled) | — | Non-empty, alphanumeric with hyphens | "Enter your Firebase project ID" |
| `firebase_service_account_json` | text (JSON) | 5000 | Yes (if enabled) | — | Valid JSON with required FCM fields | "Enter a valid Firebase service account JSON" |
| `fcm_vapid_key` | string | 255 | Yes (for web push) | — | Non-empty | "Enter the VAPID key from your Firebase console" |
| `notification_icon_url` | url | 500 | No | Concierge default icon | Valid HTTPS URL | "Enter a valid HTTPS URL for the notification icon" |
| `notification_badge_url` | url | 500 | No | Concierge default badge | Valid HTTPS URL | "Enter a valid HTTPS URL for the notification badge" |
| `ttl_seconds` | integer | — | No | `86400` | 0–2419200 (0 to 28 days) | "TTL must be between 0 and 2,419,200 seconds (28 days)" |
| `collapse_key_prefix` | string | 50 | No | `"concierge"` | Alphanumeric and underscores | "Collapse key must contain only letters, numbers, and underscores" |

> **Tooltip — TTL (Time to Live)**: How long FCM holds a notification if the device is offline. After this time, the notification is discarded. 24 hours (86400 seconds) is recommended.

#### Data Flow

```
Notification triggered → check resident push preference
  → If push enabled and device token on file:
  → Build notification payload (title, body, data, icon)
  → Send to FCM API with device token(s)
  → FCM delivers to device
  → If device offline: held until TTL expires
  → Delivery receipt via FCM callback (best-effort)
  → Update notification_log
```

#### Rate Limits and Cost

| Metric | Value |
|--------|-------|
| **FCM rate limit** | 500 messages/second per project |
| **Concierge internal limit** | 200 push/minute per property |
| **Cost** | Free |
| **Token expiry** | Tokens refreshed automatically; stale tokens cleaned weekly |

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Invalid device token | No notification received | Remove stale token, send via next preferred channel |
| FCM quota exceeded | Delayed delivery | Queue with backoff, FCM auto-retries |
| FCM outage | No push received | Fallback to SMS or email |
| User disabled browser notifications | No push received | Flag in profile, suggest re-enabling at next login |

#### Fallback Strategy

Push notification failures are silent to the user (no error toast). The system falls back to the next channel in the resident's preference order. Device tokens are validated weekly; tokens that produce `NotRegistered` errors are removed.

---

### 3.5 AI Providers — Claude API and OpenAI API

#### Purpose

Power the 105 AI capabilities described in PRD 19 (AI Framework). The integration layer provides a unified gateway that routes requests to the correct provider based on Super Admin configuration.

> **Full details**: See [19-ai-framework.md](./19-ai-framework.md) for the complete AI feature catalog, provider selection logic, privacy handling, and cost modeling. This section covers only the integration mechanics.

#### Provider Details

| Attribute | Claude (Anthropic) | OpenAI |
|-----------|-------------------|--------|
| **Authentication** | API key (Bearer token) | API key (Bearer token) |
| **Models** | Haiku, Sonnet, Opus | GPT-4o-mini, GPT-4o, Whisper, Embeddings |
| **Best for** | Text generation, analysis, categorization | Voice-to-text, semantic search, image analysis |
| **Rate limits** | Tier-dependent (1,000–4,000 RPM) | Tier-dependent (500–10,000 RPM) |

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `anthropic_api_key` | string | 255 | Yes (if Claude enabled) | — | Must start with `sk-ant-` | "Enter a valid Anthropic API key" |
| `openai_api_key` | string | 255 | Yes (if OpenAI enabled) | — | Must start with `sk-` | "Enter a valid OpenAI API key" |
| `default_provider` | enum | — | Yes | `claude` | One of: `claude`, `openai`, `auto` | "Select a default AI provider" |
| `monthly_budget_cents` | integer | — | No | `2500` ($25) | 100–100000 | "Monthly AI budget must be between $1.00 and $1,000.00" |
| `budget_action_on_exceed` | enum | — | No | `downgrade_model` | One of: `downgrade_model`, `pause_non_essential`, `alert_only` | "Select a budget exceeded action" |
| `cache_ttl_seconds` | integer | — | No | `3600` | 0–86400 | "Cache TTL must be between 0 and 86,400 seconds" |
| `pii_stripping_enabled` | boolean | — | No | `true` | — | — |
| `max_retries` | integer | — | No | `2` | 0–5 | "Max retries must be between 0 and 5" |

> **Tooltip — Budget Action**: When the monthly AI budget is exceeded: **Downgrade model** switches to cheaper models (e.g., Haiku instead of Sonnet). **Pause non-essential** disables AI features marked as non-essential while keeping critical ones. **Alert only** sends an admin notification but continues spending.

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Provider API timeout | AI suggestion does not appear; manual input works normally | Retry once, then skip AI for this request |
| Provider rate limited | AI suggestion delayed by a few seconds | Queue with backoff, serve from cache if available |
| Provider outage | No AI features visible; all manual paths work | Switch to backup provider if configured; log outage |
| Budget exceeded | Depends on `budget_action_on_exceed` setting | Apply configured action, notify admin |
| PII detected in response | Response filtered before display | Strip PII from response, log anomaly |

#### Fallback Strategy

Every AI feature has a manual fallback path (documented in PRD 19). If both providers are down, the platform operates with zero AI -- all AI-enhanced fields show their non-AI defaults. The AI gateway maintains a health check ping every 30 seconds to each provider and pre-emptively routes traffic to the healthy provider.

---

### 3.6 Cloud Storage — AWS S3

#### Purpose

Store all user-uploaded files: photos (maintenance, incidents, packages), documents (insurance, bylaws, forms), attachments (event evidence), and generated exports (PDF reports, Excel files). S3 provides durability, CDN integration, and lifecycle policies.

#### Provider Details

| Attribute | Value |
|-----------|-------|
| **Provider** | AWS S3 (or S3-compatible: MinIO, DigitalOcean Spaces, Backblaze B2) |
| **Authentication** | AWS IAM credentials (access key + secret key) or IAM role |
| **CDN** | CloudFront (optional, recommended for properties with 500+ units) |
| **Encryption** | AES-256 server-side encryption (SSE-S3) by default |

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `s3_bucket_name` | string | 63 | Yes | — | Valid S3 bucket name (lowercase, hyphens, 3–63 chars) | "Enter a valid S3 bucket name" |
| `s3_region` | string | 30 | Yes | `ca-central-1` | Valid AWS region code | "Enter a valid AWS region" |
| `s3_access_key_id` | string | 128 | Yes | — | Non-empty | "Enter your AWS access key ID" |
| `s3_secret_access_key` | string | 128 | Yes | — | Non-empty | "Enter your AWS secret access key" |
| `cdn_domain` | string | 255 | No | — | Valid domain name | "Enter a valid CDN domain" |
| `max_file_size_mb` | integer | — | No | `10` | 1–100 | "Max file size must be between 1 MB and 100 MB" |
| `allowed_file_types` | string | 500 | No | `"jpg,jpeg,png,gif,heic,pdf,doc,docx,xls,xlsx"` | Comma-separated extensions | "Enter valid file extensions separated by commas" |
| `lifecycle_days_to_glacier` | integer | — | No | `365` | 30–3650 | "Lifecycle transition must be between 30 and 3,650 days" |
| `presigned_url_expiry_seconds` | integer | — | No | `3600` | 300–86400 | "URL expiry must be between 5 minutes and 24 hours" |

> **Tooltip — Lifecycle to Glacier**: Files older than this number of days are automatically moved to cheaper cold storage (Glacier). They remain accessible but retrieval takes a few minutes instead of being instant.

#### Data Flow

```
User clicks "Upload" → client requests presigned upload URL from server
  → Server generates presigned S3 PUT URL (valid for presigned_url_expiry_seconds)
  → Client uploads directly to S3 (no server bandwidth consumed)
  → On upload complete: client notifies server
  → Server validates file (size, type, virus scan)
  → Creates Attachment record with storage_url
  → Generates thumbnail (for images) via background worker
  → File served via CDN (if configured) or presigned GET URL
```

#### Rate Limits and Cost

| Metric | Value |
|--------|-------|
| **S3 PUT rate limit** | 3,500 requests/second per prefix |
| **S3 GET rate limit** | 5,500 requests/second per prefix |
| **Storage cost** | ~$0.025/GB/month (S3 Standard), ~$0.004/GB/month (Glacier) |
| **Transfer cost** | ~$0.09/GB (outbound to internet), free with CloudFront in many cases |

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Upload fails | "Upload failed. Please try again." with retry button | Log error, allow retry |
| File too large | "File exceeds the {max_file_size_mb} MB limit. Please upload a smaller file." | Reject before upload attempt |
| Unsupported file type | "This file type is not supported. Accepted formats: {allowed_file_types}" | Reject before upload attempt |
| S3 outage | "File storage is temporarily unavailable. Your data has been saved — the file can be attached later." | Save record without attachment, queue upload for retry |
| Virus detected | "This file was flagged as potentially unsafe and was not uploaded." | Quarantine file, alert admin |

#### Fallback Strategy

If S3 is unreachable, file uploads are disabled temporarily. Records (events, maintenance requests) can still be created without attachments. When S3 recovers, users can attach files to existing records. A local disk buffer (configurable, max 1 GB) temporarily stores files during short outages.

---

### 3.7 Calendar Sync — iCal and Google Calendar

#### Purpose

Let residents export amenity bookings to their personal calendars. When a booking is created, modified, or cancelled, the calendar event updates automatically. This was absent in all platforms studied during competitive analysis.

#### Provider Details

| Attribute | Value |
|-----------|-------|
| **Protocol** | iCalendar (RFC 5545) via `.ics` feed URL |
| **Google Calendar** | Subscribe via iCal URL (Google handles polling) |
| **Apple Calendar** | Subscribe via iCal URL (Apple handles polling) |
| **Outlook** | Subscribe via iCal URL (Microsoft handles polling) |
| **Authentication** | Unique per-user feed URL with signed token (no login required) |

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `calendar_sync_enabled` | boolean | — | No | `true` | — | — |
| `feed_refresh_interval_minutes` | integer | — | No | `15` | 5–1440 | "Refresh interval must be between 5 minutes and 24 hours" |
| `include_location` | boolean | — | No | `true` | — | — |
| `include_description` | boolean | — | No | `true` | — | — |
| `reminder_minutes_before` | integer | — | No | `30` | 0–1440 | "Reminder must be between 0 and 1,440 minutes" |
| `feed_token_expiry_days` | integer | — | No | `365` | 30–730 | "Feed token expiry must be between 30 and 730 days" |

> **Tooltip — Feed Refresh Interval**: How often calendar apps check for updates. Shorter intervals mean faster sync but more server load. 15 minutes is a good balance.

#### Data Flow

```
Resident opens "My Bookings" → clicks "Add to Calendar"
  → System generates unique feed URL: /api/calendar/{user_token}.ics
  → Resident adds URL to Google Calendar / Apple Calendar / Outlook
  → Calendar app polls feed URL at refresh interval
  → Feed returns all active bookings as VEVENT entries
  → When booking is modified: next poll picks up the change
  → When booking is cancelled: VEVENT status set to CANCELLED
  → Feed token is rotatable (resident can regenerate if compromised)
```

#### Rate Limits and Cost

| Metric | Value |
|--------|-------|
| **Feed generation** | Cached per user, regenerated on booking change |
| **Rate limit** | 60 requests/minute per feed URL |
| **Cost** | None (self-hosted iCal feed) |

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Expired feed token | Calendar shows stale data | Send email prompting resident to regenerate feed URL |
| Feed URL leaked | Unauthorized access to booking schedule | Admin can revoke and regenerate all feed tokens |

#### Fallback Strategy

If the calendar feed endpoint is down, calendar apps display the last cached version (stale but functional). Residents can always download individual `.ics` files for specific bookings as a manual alternative.

---

### 3.8 Smart Building — Smart Locks, Intercoms, Camera Systems

#### Purpose

Integrate with building hardware for access control (smart locks), visitor management (intercoms with video), and security monitoring (camera systems). This is a v2 feature and a key differentiator -- no observed competitor has hardware API integration.

#### Architecture

Smart building integrations use an **adapter pattern** -- each hardware vendor has a dedicated adapter that translates Concierge commands into vendor-specific API calls.

#### Supported Hardware Categories

| Category | Example Vendors | Integration Type | Capabilities |
|----------|----------------|-----------------|--------------|
| **Smart Locks** | August, Yale, Salto, ASSA ABLOY | REST API / MQTT | Lock/unlock, temporary access codes, access log |
| **Intercom Systems** | ButterflyMX, Aiphone, 2N | REST API / SIP | Visitor call, remote unlock, photo capture, call log |
| **Camera Systems** | Verkada, Milestone, Avigilon | REST API / RTSP | Live feed URL, motion alerts, snapshot retrieval |

#### Configuration Fields (per device type)

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `vendor` | enum | — | Yes | — | Must be a supported vendor | "Select a supported hardware vendor" |
| `api_base_url` | url | 500 | Yes | — | Valid HTTPS URL | "Enter a valid HTTPS API endpoint" |
| `api_key` | string | 255 | Yes | — | Non-empty | "Enter the vendor API key" |
| `api_secret` | string | 255 | Conditional | — | Non-empty (if vendor requires) | "Enter the vendor API secret" |
| `device_mapping` | JSON | 5000 | No | `{}` | Valid JSON mapping device IDs to locations | "Enter valid JSON for device mapping" |
| `polling_interval_seconds` | integer | — | No | `30` | 5–300 | "Polling interval must be between 5 and 300 seconds" |
| `event_sync_enabled` | boolean | — | No | `true` | — | — |

> **Tooltip — Device Mapping**: Maps vendor device IDs to Concierge locations. For example: `{"lock_abc123": "Main Lobby", "lock_def456": "Gym Door"}`. This lets the system display human-readable names.

#### Data Flow — Smart Lock (example)

```
Resident books amenity (e.g., Party Room) → booking confirmed
  → System generates temporary access code via lock vendor API
  → Code valid from booking start to booking end + 30 min buffer
  → Code sent to resident via push notification
  → On booking cancellation: code revoked via vendor API
  → All lock/unlock events synced to Concierge event log
```

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Vendor API unreachable | "Smart lock temporarily unavailable. Contact front desk for access." | Alert on-duty staff, log failure |
| Access code generation fails | Front desk manually admits resident | Create manual event log entry, retry code generation |
| Camera feed unavailable | "Feed temporarily unavailable" with last snapshot shown | Retry connection, alert security supervisor |

#### Fallback Strategy

Smart building integrations are always supplementary -- the building's existing physical access system remains the primary method. If the API integration fails, staff handle access manually as they did before the integration.

#### Intercom-to-Buzzer-Code Sync (v2+)

When a smart intercom system (e.g., ButterflyMX, 2N) is integrated, the platform can optionally sync buzzer codes from the intercom directory to the Concierge Buzzer Code Directory (PRD 16, Section 3.15).

| Attribute | Detail |
|-----------|--------|
| **Sync direction** | Intercom system → Concierge (read-only sync). Concierge does not push codes to the intercom to avoid overwriting hardware-managed entries. |
| **Sync frequency** | Daily at a configurable time, or on-demand via "Sync Now" button. |
| **Conflict handling** | If a buzzer code differs between the intercom system and Concierge, the intercom value takes precedence. Admin is notified of conflicts. |
| **Toggle** | "Auto-sync buzzer codes from intercom" (boolean, default Off, under intercom device configuration). |
| **Mapping** | Intercom unit identifier → Concierge unit number. Admin maps units during initial setup via a mapping UI. |

> **Implementation note**: This feature depends on the intercom vendor exposing a directory API. Not all vendors support this. The feature is available only for vendors with directory read access.

---

### 3.9 Webhooks — Outbound Event Subscriptions

#### Purpose

Allow third-party systems to receive real-time notifications when events happen in Concierge. Property management companies can connect Concierge to their accounting software, CRM, or custom dashboards.

#### Architecture

Properties create webhook subscriptions that specify which events trigger an HTTP POST to their endpoint. Payloads follow a standard envelope format.

#### Subscription Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `name` | string | 100 | Yes | — | Non-empty | "Enter a name for this webhook" |
| `url` | url | 500 | Yes | — | Valid HTTPS URL | "Enter a valid HTTPS endpoint URL" |
| `secret` | string | 255 | Auto-generated | Random 32-char hex | — | — |
| `events` | array of strings | — | Yes | — | At least one event type selected | "Select at least one event type to subscribe to" |
| `active` | boolean | — | No | `true` | — | — |
| `description` | string | 500 | No | — | — | — |
| `headers` | JSON | 2000 | No | `{}` | Valid JSON object of string key-value pairs | "Enter valid JSON for custom headers" |
| `retry_count` | integer | — | No | `3` | 0–5 | "Retry count must be between 0 and 5" |
| `timeout_seconds` | integer | — | No | `10` | 5–30 | "Timeout must be between 5 and 30 seconds" |

> **Tooltip — Webhook Secret**: This secret is used to sign each webhook payload (HMAC-SHA256). Your receiving server should verify the signature to confirm the payload came from Concierge and was not tampered with.

#### Subscribable Event Types

| Event | Trigger | Payload Includes |
|-------|---------|------------------|
| `event.created` | Any event logged in the unified event model | Event type, unit, status, reference number |
| `event.closed` | Any event closed or resolved | Event details, resolution, closed_by |
| `package.received` | Package logged at front desk | Courier, unit, resident, tracking number |
| `package.released` | Package released to resident | Release time, released_to, released_by |
| `maintenance.created` | New maintenance request submitted | Category, unit, priority, description |
| `maintenance.status_changed` | Request status updated | Old status, new status, updated_by |
| `booking.created` | Amenity booking confirmed | Amenity, date/time, resident, payment status |
| `booking.cancelled` | Amenity booking cancelled | Cancellation reason, refund status |
| `announcement.published` | Announcement sent | Title, channels, audience |
| `resident.created` | New resident account created | Unit, role (PII excluded unless configured) |
| `resident.moved_out` | Resident deactivated | Unit, move-out date |
| `payment.completed` | Payment processed successfully | Amount, currency, booking reference |
| `payment.refunded` | Refund processed | Amount, reason, original transaction |

#### Payload Format

```json
{
  "id": "wh_01ABC123DEF456",
  "event": "package.received",
  "timestamp": "2026-03-14T15:30:00Z",
  "property_id": "prop_abc123",
  "data": {
    "event_id": "evt_789xyz",
    "reference_number": "PKG-2026-00147",
    "unit": "1205",
    "courier": "Amazon",
    "storage_location": "Package Room B"
  },
  "signature": "sha256=abc123..."
}
```

#### Rate Limits and Cost

| Metric | Value |
|--------|-------|
| **Max subscriptions per property** | 25 |
| **Max events per minute per subscription** | 100 |
| **Payload size limit** | 64 KB |
| **Retry schedule** | 1 minute, 5 minutes, 30 minutes (then marked failed) |
| **Cost** | Included in platform subscription |

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Endpoint returns 4xx | Webhook marked as failing in admin dashboard | Log error, do not retry (client error) |
| Endpoint returns 5xx | Webhook marked as failing | Retry per schedule |
| Endpoint timeout | Webhook marked as failing | Retry per schedule |
| All retries exhausted | Admin notified: "Webhook {name} has failed {retry_count} consecutive times" | Disable webhook after 50 consecutive failures |

#### Fallback Strategy

Webhook failures do not affect platform operations. Failed webhook payloads are stored for 7 days and can be replayed from the admin dashboard. The admin can view the delivery log showing each attempt, response code, and response body.

---

### 3.10 Public API — RESTful API for Third-Party Developers

#### Purpose

Provide a documented, authenticated API for third-party developers and property management companies to build custom integrations, reporting dashboards, and mobile applications.

#### Architecture

| Attribute | Value |
|-----------|-------|
| **Style** | RESTful (JSON over HTTPS) |
| **Authentication** | API key (header: `X-API-Key`) + property scope |
| **Versioning** | URL-based: `/api/v1/`, `/api/v2/` |
| **Documentation** | OpenAPI 3.0 spec, auto-generated from code |
| **Sandbox** | Dedicated sandbox environment with test data |

#### API Key Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `key_name` | string | 100 | Yes | — | Non-empty, unique per property | "Enter a unique name for this API key" |
| `key_value` | string | 64 | Auto-generated | Random 64-char hex | — | — |
| `scopes` | array of strings | — | Yes | — | At least one scope selected | "Select at least one API scope" |
| `rate_limit_per_minute` | integer | — | No | `60` | 10–1000 | "Rate limit must be between 10 and 1,000 requests per minute" |
| `allowed_ips` | array of strings | — | No | `[]` (allow all) | Valid IPv4 or IPv6 addresses or CIDR blocks | "Enter valid IP addresses or CIDR blocks" |
| `expires_at` | datetime | — | No | `null` (never expires) | Future date | "Expiry date must be in the future" |
| `active` | boolean | — | No | `true` | — | — |

> **Tooltip — API Scopes**: Control what this API key can access. For example, `events:read` allows reading events but not creating them. Always grant the minimum scopes needed.

#### Available Scopes

| Scope | Description |
|-------|-------------|
| `events:read` | Read events, packages, incidents |
| `events:write` | Create and update events |
| `maintenance:read` | Read maintenance requests |
| `maintenance:write` | Create and update maintenance requests |
| `units:read` | Read unit directory |
| `residents:read` | Read resident profiles (PII controlled by admin) |
| `bookings:read` | Read amenity bookings |
| `bookings:write` | Create and manage bookings |
| `announcements:read` | Read announcements |
| `reports:read` | Read reports |

#### Rate Limits and Cost

| Metric | Value |
|--------|-------|
| **Default rate limit** | 60 requests/minute per API key |
| **Max configurable rate limit** | 1,000 requests/minute |
| **Max API keys per property** | 10 |
| **Response size limit** | 1 MB |
| **Pagination** | Cursor-based, max 100 items per page |
| **Cost** | Included in platform subscription (may require higher tier) |

#### Error Handling

All API errors return standard JSON:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "You have exceeded the rate limit of 60 requests per minute.",
    "retry_after_seconds": 45
  }
}
```

| HTTP Status | Meaning |
|-------------|---------|
| `400` | Bad request — invalid parameters |
| `401` | Unauthorized — invalid or missing API key |
| `403` | Forbidden — API key lacks required scope |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
| `503` | Service unavailable — try again later |

---

### 3.11 Import / Export — CSV, Excel, PDF, Word

#### Purpose

Import bulk data during property onboarding (units, residents, vehicles, FOBs) and export any listing or report as CSV, Excel (XLSX), or PDF. Competitive analysis found that the most comprehensive platform supported 10 export formats across 39+ report types.

#### Import Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `import_file` | file | — | Yes | — | `.csv` or `.xlsx`, max 10 MB | "Upload a CSV or Excel file (max 10 MB)" |
| `import_type` | enum | — | Yes | — | One of: `units`, `residents`, `vehicles`, `fobs`, `buzzer_codes`, `parking_permits`, `vendors`, `equipment` | "Select the type of data to import" |
| `duplicate_handling` | enum | — | No | `skip` | One of: `skip`, `update`, `error` | "Select how to handle duplicate records" |
| `dry_run` | boolean | — | No | `true` | — | — |
| `notify_on_completion` | boolean | — | No | `true` | — | — |

> **Tooltip — Dry Run**: When enabled, the import runs a validation pass without saving any data. You will see a preview of what would be imported, including any errors. Always run a dry run first.

#### Import Data Flow

```
Admin uploads CSV/Excel file → selects import type
  → System runs dry run: validates every row
  → Shows preview: X records to create, Y to update, Z errors
  → Admin reviews and clicks "Import"
  → Background worker processes records in batches of 100
  → Progress bar updates in real-time (WebSocket)
  → On completion: summary report with success/failure counts
  → Failed rows available as downloadable CSV with error descriptions
```

#### Export Configuration

Every listing page and report includes an export button with format options:

| Format | Description | Max Records |
|--------|-------------|-------------|
| **CSV** | Comma-separated values, UTF-8 with BOM | 100,000 |
| **Excel (XLSX)** | Formatted workbook with headers, filters, and column widths | 50,000 |
| **PDF** | Formatted document with property branding, headers, footers, page numbers | 10,000 |
| **Word (DOCX)** | Editable document with property branding, headers, formatted table, and table of contents. Ideal for board meeting distribution where recipients need to annotate or modify content. | 10,000 |

#### Export Data Flow

```
User clicks "Export" → selects format → optionally adjusts columns
  → Server generates file in background
  → For small exports (<1,000 rows): immediate download
  → For large exports (>1,000 rows): "Your export is being prepared. You'll receive a notification when it's ready."
  → File stored in S3 for 7 days → download link sent via preferred channel
  → Download link is single-use and expires after 24 hours
```

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Import file too large | "File exceeds the 10 MB limit. Split your data into smaller files." | Reject upload |
| Import column mismatch | "Column 'Unit Number' is missing. Download the template to see required columns." | Show column mapping UI with suggestions |
| Import row validation error | "Row 15: Phone number format invalid. Expected: +1XXXXXXXXXX" | Skip row, include in error report |
| Export timeout | "Export is taking longer than expected. We'll notify you when it's ready." | Move to background queue |

---

### 3.12 Digital Signage — Lobby Screen Integration

#### Purpose

Push announcements, emergency alerts, and building information to lobby display screens, elevator displays, and common area monitors. This is a v3 feature. Competitive analysis found that one platform offered lobby screen configuration for announcements.

#### Architecture

Concierge exposes a read-only display endpoint that digital signage hardware polls for content. The signage device renders a web page served by Concierge.

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `signage_enabled` | boolean | — | No | `false` | — | — |
| `display_name` | string | 100 | Yes (if enabled) | — | Non-empty | "Enter a name for this display" |
| `display_location` | string | 200 | No | — | — | — |
| `content_types` | array of strings | — | Yes (if enabled) | `["announcements", "weather", "events"]` | At least one type selected | "Select at least one content type" |
| `rotation_interval_seconds` | integer | — | No | `15` | 5–120 | "Rotation interval must be between 5 and 120 seconds" |
| `emergency_override` | boolean | — | No | `true` | — | — |
| `display_theme` | enum | — | No | `light` | One of: `light`, `dark`, `auto` | "Select a display theme" |
| `auth_token` | string | 64 | Auto-generated | Random 64-char hex | — | — |
| `show_clock` | boolean | — | No | `true` | — | — |
| `custom_logo_url` | url | 500 | No | Property logo | Valid HTTPS URL | "Enter a valid HTTPS URL for the display logo" |

> **Tooltip — Emergency Override**: When enabled, emergency broadcasts immediately replace all content on this display with the emergency message, regardless of the rotation schedule. Strongly recommended.

#### Data Flow

```
Signage device loads: /display/{auth_token}
  → Concierge serves responsive web page
  → Page polls /api/display/{auth_token}/content every rotation_interval
  → Content rotates: announcements, weather, upcoming events, building info
  → On emergency broadcast: WebSocket pushes immediate override
  → Emergency message displayed until admin clears it
```

#### Rate Limits and Cost

| Metric | Value |
|--------|-------|
| **Max displays per property** | 20 |
| **Polling rate** | 1 request per rotation interval per display |
| **Cost** | Included in platform subscription |

---

### 3.13 Weather — OpenWeatherMap

#### Purpose

Display current weather and forecast on the dashboard widget and provide weather context to AI briefings (e.g., "Heavy rain expected -- check roof drains" or "Freezing temperatures -- salt walkways").

#### Provider Details

| Attribute | Value |
|-----------|-------|
| **Provider** | OpenWeatherMap |
| **Authentication** | API key (query parameter) |
| **Data** | Current conditions, 7-day forecast, severe weather alerts |
| **Update frequency** | Every 30 minutes (cached) |

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `openweathermap_api_key` | string | 64 | Yes (if enabled) | — | Non-empty, 32-char hex | "Enter a valid OpenWeatherMap API key" |
| `latitude` | decimal | — | Yes | — | -90 to 90, 6 decimal places | "Enter a valid latitude" |
| `longitude` | decimal | — | Yes | — | -180 to 180, 6 decimal places | "Enter a valid longitude" |
| `units` | enum | — | No | `metric` | One of: `metric`, `imperial` | "Select a unit system" |
| `cache_duration_minutes` | integer | — | No | `30` | 10–120 | "Cache duration must be between 10 and 120 minutes" |
| `severe_weather_alerts` | boolean | — | No | `true` | — | — |
| `alert_notification_roles` | array of strings | — | No | `["property_manager", "security_supervisor"]` | Valid role slugs | "Select valid roles to receive weather alerts" |

> **Tooltip — Severe Weather Alerts**: When enabled, the system automatically notifies selected staff roles when a severe weather alert is issued for your area (e.g., winter storm warning, heat advisory). Helps with proactive building preparation.

#### Data Flow

```
Dashboard loads → client requests /api/weather
  → Server checks cache (30-min TTL)
  → If cache miss: fetch from OpenWeatherMap API
  → Return: current temp, conditions, icon, 7-day forecast
  → If severe weather alert active: show alert banner on dashboard
  → AI briefing engine includes weather in daily context
```

#### Rate Limits and Cost

| Metric | Value |
|--------|-------|
| **OpenWeatherMap rate limit** | 60 calls/minute (free tier), 3,000/minute (paid) |
| **Concierge internal limit** | 2 calls/hour per property (cached) |
| **Free tier** | 1,000 calls/day (sufficient for ~20 properties) |
| **Paid tier** | ~$40/month for 100,000 calls/month |

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| API key invalid | Weather widget shows "Weather unavailable" | Alert admin to check API key |
| API timeout | Widget shows last cached weather data | Serve stale cache, retry on next cycle |
| API outage | Widget shows last cached data with "Last updated X minutes ago" | Continue serving cache, skip AI weather context |

#### Fallback Strategy

Weather is a non-critical integration. If the API is unreachable, the dashboard widget shows the last known weather with a "last updated" timestamp. AI briefings omit weather context rather than failing entirely.

---

### 3.14 Localization / i18n — Translation Support

#### Purpose

Support multi-language interfaces and translated content for properties serving diverse communities. The platform comparison matrix identifies "i18n from day one" as a strategic decision. This section defines the integration layer for translation services.

#### Architecture

Localization operates at two levels:

| Level | Scope | Implementation |
|-------|-------|----------------|
| **UI strings** | All platform interface text (buttons, labels, menus, error messages, tooltips) | Static translation files (JSON) shipped with each release. Community-contributed translations accepted via PR. No runtime API needed. |
| **User-generated content** | Announcements, notifications, event descriptions, amenity rules | On-demand translation via AI provider (Section 3.5) or optional external translation API. |

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `default_locale` | enum | -- | Yes | `en-CA` | Valid BCP 47 locale code | "Select a valid locale" |
| `supported_locales` | enum[] | 10 max | Yes | `[en-CA]` | Valid BCP 47 locale codes, at least one | "Select at least one supported locale" |
| `auto_translate_announcements` | boolean | -- | No | false | -- | -- |
| `translation_provider` | enum | -- | No | `ai` | `ai` (uses configured AI provider from 3.5), `none` | -- |
| `resident_locale_preference` | boolean | -- | No | true | -- | -- |

> **Tooltip — Auto-Translate Announcements**: "When enabled, announcements are automatically translated into all supported locales using the AI provider. Translations are generated as drafts for admin review before publishing."

> **Tooltip — Resident Locale Preference**: "When enabled, residents can choose their preferred language in their profile settings. All notifications, emails, and portal content will be displayed in their chosen language."

#### Supported Locales (v1)

| Locale Code | Language | Notes |
|-------------|----------|-------|
| `en-CA` | English (Canada) | Default, always available |
| `fr-CA` | French (Canada) | Required for Quebec properties |
| `zh-Hans` | Simplified Chinese | High demand in GTA condo market |
| `ko` | Korean | High demand in GTA condo market |

Additional locales added via configuration without code changes. UI string translation files follow the pattern: `locales/{locale_code}.json`.

#### Data Flow — Announcement Translation

```
Admin creates announcement in default locale
  → If auto_translate_announcements is On:
    → System sends content to AI provider for translation
    → Translations generated for each supported locale
    → Translations saved as drafts (status: pending_review)
    → Admin reviews and approves/edits each translation
    → On publish: announcement delivered in each resident's preferred locale
  → If auto_translate_announcements is Off:
    → Admin manually enters translations per locale (tabbed editor)
```

#### Error Handling

| Scenario | User Experience | System Action |
|----------|----------------|---------------|
| Translation API timeout | "Translation could not be generated. You can enter it manually." | Fall back to manual entry, log error |
| Unsupported locale requested | Serve content in default locale | Log locale miss for analytics |
| Resident has no locale preference | Serve content in property default locale | -- |

#### Fallback Strategy

Translation is a non-critical integration. If the AI translation fails, the platform serves content in the default locale. Admins can always manually enter translations. The UI never blocks on translation availability.

#### Phase

- **v1**: UI strings for `en-CA` and `fr-CA`. Locale preference in resident profile. Manual translation entry for announcements.
- **v2**: AI-powered auto-translation. Additional locales (`zh-Hans`, `ko`). Translated notification templates.

---

### 3.15 Real-Time Chat — Staff Messaging (v3+)

#### Purpose

Provide in-app real-time messaging for staff communication. Enables front desk, security, and property management to coordinate without relying on external chat tools.

#### Architecture

WebSocket-based messaging using a dedicated chat service. Messages are persisted and searchable.

#### Scope (v3+)

| Capability | Description |
|-----------|-------------|
| **Staff-to-staff messaging** | Direct messages between staff members on duty |
| **Shift channels** | Auto-created channel per active shift for team coordination |
| **Property channel** | Persistent channel for building-wide staff announcements |
| **Message types** | Text, image attachment, event link (deep link to any Concierge event) |
| **Read receipts** | Sent, delivered, read indicators |
| **Typing indicators** | Real-time typing status |
| **Offline queue** | Messages queued when recipient is offline, delivered on next login |
| **Search** | Full-text search across message history |

#### Configuration Fields

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `chat_enabled` | boolean | -- | No | false | -- | -- |
| `message_retention_days` | integer | -- | No | 365 | 30--730 | "Retention must be between 30 and 730 days" |
| `file_attachment_max_size_mb` | integer | -- | No | 5 | 1--10 | "Max attachment size must be between 1 and 10 MB" |
| `allow_resident_chat` | boolean | -- | No | false | Tooltip: "When enabled, residents can message front desk staff through the portal. Staff-to-staff chat is always available." | -- |

> **Implementation note**: This is a v3+ feature. For v1/v2, staff communication relies on the Shift Log (pass-on notes) and existing notification channels.

---

## 4. Data Model

### 4.1 IntegrationConfig

Stores integration credentials and settings per property.

```
IntegrationConfig
├── id (UUID, auto-generated)
├── property_id → Property
├── integration_type (enum: stripe, sendgrid, twilio, fcm, anthropic, openai, s3, calendar, smart_building, webhooks, api, signage, weather)
├── enabled (boolean, default: false)
├── credentials (JSONB, encrypted — provider-specific keys and secrets)
├── settings (JSONB — provider-specific configuration)
├── status (enum: active, error, disabled, configuring)
├── last_health_check_at (timestamp, nullable)
├── last_health_check_status (enum: healthy, degraded, unreachable, nullable)
├── error_message (text, nullable — last error for admin display)
├── created_by → User
├── created_at (timestamp)
├── updated_by → User
├── updated_at (timestamp)
└── audit_log[] → AuditEntry
```

### 4.2 IntegrationLog

Tracks every external API call for debugging, cost tracking, and compliance.

```
IntegrationLog
├── id (UUID, auto-generated)
├── property_id → Property
├── integration_type (enum — same as IntegrationConfig)
├── direction (enum: outbound, inbound)
├── endpoint (varchar 500 — the external URL called)
├── method (enum: GET, POST, PUT, PATCH, DELETE)
├── request_size_bytes (integer)
├── response_status_code (integer)
├── response_time_ms (integer)
├── success (boolean)
├── error_message (text, nullable)
├── cost_cents (integer, nullable — estimated cost of this call)
├── idempotency_key (varchar 100, nullable)
├── metadata (JSONB — additional context: model used, tokens consumed, etc.)
└── created_at (timestamp)
```

### 4.3 WebhookSubscription

```
WebhookSubscription
├── id (UUID, auto-generated)
├── property_id → Property
├── name (varchar 100)
├── url (varchar 500)
├── secret (varchar 255, auto-generated)
├── events[] (array of varchar 100 — subscribed event types)
├── headers (JSONB — custom headers sent with each delivery)
├── active (boolean, default: true)
├── retry_count (integer, default: 3, range: 0–5)
├── timeout_seconds (integer, default: 10, range: 5–30)
├── consecutive_failures (integer, default: 0)
├── last_triggered_at (timestamp, nullable)
├── last_success_at (timestamp, nullable)
├── last_failure_at (timestamp, nullable)
├── last_failure_reason (text, nullable)
├── description (varchar 500, nullable)
├── created_by → User
├── created_at (timestamp)
└── updated_at (timestamp)
```

### 4.4 WebhookDelivery

```
WebhookDelivery
├── id (UUID, auto-generated)
├── subscription_id → WebhookSubscription
├── event_type (varchar 100)
├── payload (JSONB — the delivered payload)
├── response_status_code (integer, nullable)
├── response_body (text, truncated to 1000 chars, nullable)
├── response_time_ms (integer, nullable)
├── attempt_number (integer)
├── success (boolean)
├── error_message (text, nullable)
├── next_retry_at (timestamp, nullable)
└── created_at (timestamp)
```

### 4.5 ApiKey

```
ApiKey
├── id (UUID, auto-generated)
├── property_id → Property
├── key_name (varchar 100)
├── key_hash (varchar 255 — SHA-256 hash of the actual key)
├── key_prefix (varchar 8 — first 8 chars for identification, e.g., "ck_a1b2...")
├── scopes[] (array of varchar 50)
├── rate_limit_per_minute (integer, default: 60, range: 10–1000)
├── allowed_ips[] (array of varchar 45 — IPv4 or IPv6)
├── expires_at (timestamp, nullable)
├── last_used_at (timestamp, nullable)
├── total_requests (integer, default: 0)
├── active (boolean, default: true)
├── created_by → User
├── created_at (timestamp)
└── updated_at (timestamp)
```

### 4.6 ImportJob

```
ImportJob
├── id (UUID, auto-generated)
├── property_id → Property
├── import_type (enum: units, residents, vehicles, fobs, buzzer_codes, parking_permits, vendors, equipment)
├── file_name (varchar 255)
├── file_size_bytes (integer)
├── file_storage_url (varchar 500)
├── duplicate_handling (enum: skip, update, error)
├── dry_run (boolean)
├── status (enum: pending, validating, previewing, importing, completed, failed)
├── total_rows (integer, nullable)
├── processed_rows (integer, default: 0)
├── created_rows (integer, default: 0)
├── updated_rows (integer, default: 0)
├── skipped_rows (integer, default: 0)
├── error_rows (integer, default: 0)
├── error_report_url (varchar 500, nullable — downloadable CSV of errors)
├── started_at (timestamp, nullable)
├── completed_at (timestamp, nullable)
├── created_by → User
└── created_at (timestamp)
```

### 4.7 SignageDisplay

```
SignageDisplay
├── id (UUID, auto-generated)
├── property_id → Property
├── display_name (varchar 100)
├── display_location (varchar 200, nullable)
├── auth_token (varchar 64, auto-generated, unique)
├── content_types[] (array of varchar 50)
├── rotation_interval_seconds (integer, default: 15)
├── emergency_override (boolean, default: true)
├── display_theme (enum: light, dark, auto)
├── show_clock (boolean, default: true)
├── custom_logo_url (varchar 500, nullable)
├── last_ping_at (timestamp, nullable — last time device polled)
├── active (boolean, default: true)
├── created_by → User
└── created_at (timestamp)
```

---

## 5. User Flows

### 5.1 Super Admin — Configure a New Integration

```
1. Navigate to Settings > Integrations
2. See card grid of all integration categories (each showing status: Connected / Not Configured / Error)
3. Click integration card (e.g., "Stripe Payment")
4. Fill in credentials and settings (form validates in real-time)
5. Click "Test Connection" → system verifies credentials against provider
   → Success: green checkmark, "Connection successful"
   → Failure: red message, "Could not connect: {error_detail}"
6. Click "Save & Enable"
7. Integration status changes to "Connected" on the card grid
```

### 5.2 Property Admin — Set Up Webhooks

```
1. Navigate to Settings > Integrations > Webhooks
2. See list of existing subscriptions (or empty state: "No webhooks configured. Webhooks let external systems receive updates when events happen in Concierge.")
3. Click "Add Webhook"
4. Enter name, URL, select event types from checkbox list
5. System auto-generates signing secret (displayed once, copyable)
6. Click "Save"
7. Click "Send Test" → system sends test payload to the endpoint
   → Success: "Test payload delivered. Response: 200 OK"
   → Failure: "Test failed. Response: {status_code} — {error}"
8. Webhook appears in list with status badge (Active / Failing)
```

### 5.3 Property Admin — Import Resident Data

```
1. Navigate to Settings > Import Data
2. Select import type: "Residents"
3. Download template CSV (pre-filled with correct column headers)
4. Upload completed CSV file
5. System runs dry run automatically
6. Preview screen: "142 records to create, 8 duplicates to skip, 3 errors"
7. Click row to see error detail: "Row 45: Email 'john@' is not valid"
8. Fix errors in file or proceed with partial import
9. Click "Import"
10. Progress bar: "Importing... 67 of 142 records"
11. Completion: "Import complete. 142 created, 8 skipped, 3 errors."
12. Download error report CSV
```

### 5.4 Resident — Add Booking to Calendar

```
1. View confirmed amenity booking in "My Bookings"
2. Click calendar icon on booking card
3. Options appear: "Add to Google Calendar", "Add to Apple Calendar", "Download .ics"
4. For Google/Apple: system generates subscription URL, opens calendar app
5. For .ics: downloads single-event file
6. Booking appears in personal calendar with amenity name, time, location, and booking reference
7. If booking is later modified or cancelled, calendar updates on next sync
```

### 5.5 Developer — Access the Public API

```
1. Property Admin navigates to Settings > Integrations > API Keys
2. Clicks "Create API Key"
3. Enters key name, selects scopes, sets rate limit
4. Optionally restricts to specific IP addresses
5. Clicks "Generate"
6. API key displayed once (masked after leaving page)
7. Developer uses key in X-API-Key header
8. Documentation available at /api/docs (OpenAPI spec)
```

---

## 6. UI/UX

### 6.1 Integration Settings Page

**Layout**: Card grid showing all integration categories. Each card shows:
- Integration name and icon
- Status badge: `Connected` (green) / `Not Configured` (gray) / `Error` (red) / `Configuring` (yellow)
- Last health check time
- Click to expand configuration

**Progressive Disclosure**:
- Basic settings (credentials, enable/disable) shown by default
- Advanced settings (rate limits, fallback behavior, retry policies) behind "Advanced" toggle
- Logs and usage stats in a separate "Activity" tab within each integration

### 6.2 Empty States

| Integration | Empty State Message | Action |
|-------------|-------------------|--------|
| Stripe | "Payment processing is not configured. Enable Stripe to accept payments for amenity bookings and deposits." | "Set Up Stripe" button |
| SendGrid | "Email delivery is not configured. Connect SendGrid to send notifications, announcements, and alerts to residents." | "Connect SendGrid" button |
| Twilio | "SMS and voice notifications are not configured. Connect Twilio to enable text messages and emergency voice calls." | "Connect Twilio" button |
| Webhooks | "No webhooks configured. Webhooks let you send real-time updates to external systems when events happen in Concierge." | "Add Webhook" button |
| API Keys | "No API keys created. API keys let third-party applications access your property data securely." | "Create API Key" button |
| Smart Building | "No smart building devices connected. Integrate with smart locks, intercoms, and camera systems for automated access control." | "Add Device" button |
| Digital Signage | "No display screens configured. Push announcements and building information to lobby screens and common area monitors." | "Add Display" button |

### 6.3 Health Dashboard

Each integration shows a health status widget:
- **Uptime** over the last 30 days (percentage)
- **Average response time** in milliseconds
- **Error rate** as a percentage
- **Last successful call** timestamp
- **Cost this month** (for metered integrations: Stripe, Twilio, AI providers)

### 6.4 Credential Entry

- Password-type input fields (masked by default, eye icon to reveal)
- "Test Connection" button appears after all required fields are filled
- Credentials are never displayed after initial save -- only the first 8 characters are shown with asterisks
- "Rotate Key" button generates new credentials without downtime (old key valid for 24 hours during transition)

---

## 7. AI Integration

The integration layer connects directly to the AI Framework (PRD 19). Key touchpoints:

| AI Feature | Integration Used | How |
|------------|-----------------|-----|
| Weather-aware morning briefing | Weather API (OpenWeatherMap) | AI includes weather forecast and severe alerts in the daily property briefing |
| Photo analysis (damage, packages) | AI Provider (OpenAI Vision) | Uploaded photos sent to Vision API for analysis |
| Voice-to-text reporting | AI Provider (OpenAI Whisper) | Audio recordings transcribed via Whisper API |
| Smart scheduling suggestions | Calendar Sync | AI analyzes booking patterns from calendar data |
| Package courier detection | AI Provider (OpenAI Vision) | Package photos analyzed to identify courier logos |
| Cost tracking and budget | AI Provider gateway | IntegrationLog tracks cost per AI call, enforces monthly budget |
| Natural language report builder | AI Provider (Claude) | User query → structured report via Claude API |
| Emergency template selection | Weather API + AI | Severe weather context informs emergency template suggestions |

All AI integrations follow the same graceful degradation principle: if the AI provider is down, manual alternatives work normally.

---

## 8. Analytics

### 8.1 Integration Health Dashboard (Super Admin)

| Metric | Description | Visualization |
|--------|-------------|---------------|
| **Uptime per integration** | Percentage of successful health checks over 30 days | Uptime bar per integration |
| **API call volume** | Total external API calls per day, per integration | Line chart (7-day trend) |
| **Error rate** | Percentage of failed calls per integration | Number with trend indicator |
| **Average response time** | Mean response time in milliseconds per integration | Number with trend indicator |
| **Cost breakdown** | Monthly cost per metered integration (Stripe fees, Twilio SMS, AI provider) | Stacked bar chart |

### 8.2 Notification Delivery Analytics (Property Admin)

| Metric | Description |
|--------|-------------|
| **Channel breakdown** | Percentage delivered via email vs SMS vs push vs voice |
| **Delivery success rate** | Per channel, per day |
| **Bounce rate** | Email bounces as percentage of total sends |
| **Open rate** | Email open rate (from SendGrid tracking) |
| **SMS delivery rate** | Percentage of SMS confirmed delivered |
| **Push delivery rate** | Percentage of push notifications delivered |

### 8.3 Payment Analytics (Property Admin)

| Metric | Description |
|--------|-------------|
| **Total revenue** | Sum of successful payments, current month |
| **Transaction count** | Number of payments processed |
| **Average transaction** | Mean payment amount |
| **Refund rate** | Refunds as percentage of total transactions |
| **Failed payment rate** | Declined/failed as percentage of attempts |
| **Pending payments** | Count of bookings with `payment_pending` status |

### 8.4 Webhook Analytics (Property Admin)

| Metric | Description |
|--------|-------------|
| **Delivery success rate** | Percentage of webhook deliveries with 2xx response |
| **Average response time** | Mean time for endpoint to respond |
| **Most triggered event** | Which event type generates the most webhook calls |
| **Failing subscriptions** | Count of subscriptions with recent failures |

---

## 9. Notifications

### 9.1 Integration Health Alerts

| Event | Recipients | Channels | Message |
|-------|-----------|----------|---------|
| Integration connection lost | Super Admin, Property Admin | Email, Push | "{Integration} is unreachable. Fallback is active. Check your credentials in Settings > Integrations." |
| Integration recovered | Super Admin, Property Admin | Email, Push | "{Integration} connection restored. All queued operations are being processed." |
| Webhook delivery failing | Property Admin | Email | "Webhook '{name}' has failed {count} consecutive deliveries. Check the endpoint at {url}." |
| AI budget exceeded | Super Admin | Email, Push | "AI monthly budget of ${budget} has been exceeded for {property}. Action: {budget_action}." |
| Import completed | Property Admin | Email, Push | "Data import completed: {created} created, {updated} updated, {errors} errors." |
| API key expiring | Property Admin | Email | "API key '{key_name}' expires in {days} days. Rotate the key in Settings > Integrations > API Keys." |
| High bounce rate | Property Admin | Email | "Email bounce rate has reached {rate}%. Sending has been paused. Review bounced addresses." |
| Payment failure spike | Property Admin | Email, Push | "{count} payment failures in the last hour. Check Stripe dashboard for details." |

### 9.2 Resident-Facing Notifications via Integrations

| Event | Email (SendGrid) | SMS (Twilio) | Push (FCM) | Voice (Twilio) |
|-------|:-:|:-:|:-:|:-:|
| Package received | Yes | Yes | Yes | No |
| Package reminder (unclaimed) | Yes | Yes | Yes | No |
| Booking confirmed | Yes | Yes | Yes | No |
| Booking reminder | Yes | Yes | Yes | No |
| Payment receipt | Yes | No | No | No |
| Announcement | Yes | Configurable | Yes | No |
| Emergency broadcast | Yes | Yes | Yes | Yes |
| Maintenance update | Yes | Configurable | Yes | No |

---

## 10. API

### 10.1 Integration Management Endpoints (Super Admin / Property Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/integrations` | List all integration configs for property | Property Admin+ |
| `GET` | `/api/v1/integrations/{type}` | Get config for specific integration | Property Admin+ |
| `PUT` | `/api/v1/integrations/{type}` | Update integration config | Super Admin |
| `POST` | `/api/v1/integrations/{type}/test` | Test connection to provider | Super Admin |
| `GET` | `/api/v1/integrations/{type}/health` | Get health status | Property Admin+ |
| `GET` | `/api/v1/integrations/{type}/logs` | Get API call logs | Super Admin |

### 10.2 Webhook Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/webhooks` | List webhook subscriptions | Property Admin+ |
| `POST` | `/api/v1/webhooks` | Create webhook subscription | Property Admin+ |
| `PUT` | `/api/v1/webhooks/{id}` | Update subscription | Property Admin+ |
| `DELETE` | `/api/v1/webhooks/{id}` | Delete subscription | Property Admin+ |
| `POST` | `/api/v1/webhooks/{id}/test` | Send test delivery | Property Admin+ |
| `GET` | `/api/v1/webhooks/{id}/deliveries` | List delivery history | Property Admin+ |
| `POST` | `/api/v1/webhooks/{id}/deliveries/{delivery_id}/replay` | Replay a failed delivery | Property Admin+ |

### 10.3 API Key Management Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/api-keys` | List API keys for property | Property Admin+ |
| `POST` | `/api/v1/api-keys` | Create new API key | Property Admin+ |
| `PUT` | `/api/v1/api-keys/{id}` | Update key settings | Property Admin+ |
| `DELETE` | `/api/v1/api-keys/{id}` | Revoke API key | Property Admin+ |
| `POST` | `/api/v1/api-keys/{id}/rotate` | Rotate key (new value, old valid 24h) | Property Admin+ |

### 10.4 Import/Export Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/imports/templates/{type}` | Download CSV template for import type | Property Admin+ |
| `POST` | `/api/v1/imports` | Upload and start import job | Property Admin+ |
| `GET` | `/api/v1/imports/{id}` | Get import job status | Property Admin+ |
| `GET` | `/api/v1/imports/{id}/errors` | Download error report | Property Admin+ |
| `POST` | `/api/v1/exports` | Generate export (body specifies module, format, filters) | Varies by module |
| `GET` | `/api/v1/exports/{id}` | Get export job status and download URL | Requestor |

### 10.5 Calendar Feed Endpoint

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/calendar/{user_token}.ics` | iCal feed for user's bookings | Signed token (no login) |

### 10.6 Signage Display Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/display/{auth_token}` | Full-page signage display | Display auth token |
| `GET` | `/api/v1/display/{auth_token}/content` | Content payload for signage | Display auth token |

### 10.7 Inbound Webhook Endpoints (from providers)

| Method | Endpoint | Provider | Purpose |
|--------|----------|----------|---------|
| `POST` | `/webhooks/stripe` | Stripe | Payment status updates, refund confirmations |
| `POST` | `/webhooks/sendgrid` | SendGrid | Delivery status, bounces, opens, clicks |
| `POST` | `/webhooks/twilio/sms` | Twilio | SMS delivery status callbacks |
| `POST` | `/webhooks/twilio/voice` | Twilio | Voice call status callbacks |

All inbound webhooks verify the provider's signature before processing.

---

## 11. Completeness Checklist

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Payment processing for amenity bookings with Stripe | Defined | Section 3.1 |
| 2 | Email delivery via SendGrid with bounce tracking | Defined | Section 3.2 |
| 3 | SMS notifications via Twilio | Defined | Section 3.3 |
| 4 | Voice emergency broadcast via Twilio | Defined | Section 3.3 |
| 5 | Push notifications via Firebase Cloud Messaging | Defined | Section 3.4 |
| 6 | AI provider integration (Claude + OpenAI) | Defined | Section 3.5, cross-ref PRD 19 |
| 7 | Cloud file storage via S3 | Defined | Section 3.6 |
| 8 | Calendar sync via iCal feeds | Defined | Section 3.7 |
| 9 | Smart building hardware (locks, intercoms, cameras) | Defined | Section 3.8 |
| 10 | Outbound webhooks with event subscriptions | Defined | Section 3.9 |
| 11 | Public RESTful API with API key auth | Defined | Section 3.10 |
| 12 | CSV/Excel import for bulk data | Defined | Section 3.11 |
| 13 | PDF/Excel/CSV/Word export for reports and listings | Defined | Section 3.11 |
| 14 | Digital signage for lobby screens | Defined | Section 3.12 |
| 15 | Weather API for dashboard and AI briefing | Defined | Section 3.13 |
| 16 | All configuration fields have type, validation, and error messages | Verified | All sections |
| 17 | Every integration has error handling and fallback strategy | Verified | All sections |
| 18 | Rate limits defined per integration | Verified | All sections |
| 19 | Cost estimates provided for metered integrations | Verified | Sections 3.1–3.5, 3.13 |
| 20 | Data model covers all integration entities | Verified | Section 4 |
| 21 | User flows for admin setup, webhook creation, import, calendar sync, API keys | Verified | Section 5 |
| 22 | Empty states with guidance for every integration | Verified | Section 6.2 |
| 23 | Progressive disclosure for advanced settings | Verified | Section 6.1 |
| 24 | Tooltips for complex configuration fields | Verified | All sections |
| 25 | Circuit breaker and retry patterns documented | Verified | Section 1, per-integration error handling |
| 26 | Credential security (encryption, masking, rotation) | Verified | Section 6.4 |
| 27 | Integration health monitoring and alerting | Verified | Sections 6.3, 8.1, 9.1 |
| 28 | No competitor names referenced | Verified | Uses "competitive analysis" and "industry research" |
| 29 | Multi-channel notification fallback chain documented | Verified | Section 3.3 |
| 30 | Inbound webhook signature verification | Verified | Section 10.7 |
| 31 | Backup SMTP provider configuration fields | Defined | Section 3.2 |
| 32 | Intercom-to-buzzer-code sync (v2+) | Defined | Section 3.8 |
| 33 | Localization / i18n with locale configuration and AI translation | Defined | Section 3.14 |
| 34 | Real-time staff chat integration (v3+) | Defined | Section 3.15 |
| 35 | Word (DOCX) as fourth export format | Defined | Section 3.11 |

---

*This document defines all external integrations for Concierge. For AI-specific integration details, see [19-ai-framework.md](./19-ai-framework.md). For notification template design, see [09-communication.md](./09-communication.md). For amenity payment flows, see [06-amenity-booking.md](./06-amenity-booking.md).*
