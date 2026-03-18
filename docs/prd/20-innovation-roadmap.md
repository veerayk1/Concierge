# 20 — Innovation Roadmap

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

This document defines the **32 innovations** that separate Concierge from every building management platform on the market. These are not incremental improvements to existing features -- they are capabilities that no competitor offers today.

### Why Innovation Matters

The building management software industry has stagnated. Platforms built in the 2000s and 2010s added features over time, but their core experience has not changed. Staff still click through the same forms. Managers still export the same spreadsheets. Residents still check the same portals.

Concierge is not another iteration. It is a new category of product: an **AI-native, role-aware, real-time collaborative** building management platform. The innovations described here are what make that vision real.

### How This Document Is Organized

| Section                  | What It Covers                              | Innovation Count |
| ------------------------ | ------------------------------------------- | ---------------- |
| **AI-Native Features**   | Intelligence capabilities no competitor has | 15               |
| **Platform Innovation**  | Architectural and UX advances               | 10               |
| **Analytics Innovation** | Data and insight features                   | 7                |
| **Future Vision**        | v3+ concepts and emerging technology        | Open-ended       |

Each innovation includes:

- **Description**: What it does, in plain language
- **User Story**: Who benefits and why
- **Acceptance Criteria**: How we know it works
- **Implementation Notes**: Technical considerations
- **Target Version**: When it ships
- **Complexity**: Low / Medium / High / Very High

> **Tooltip — AI-Native**: A platform where artificial intelligence is built into the foundation, not added as an afterthought. Every module can call AI services through a shared gateway. See PRD 19 for the full AI Framework.

---

## 2. Innovation Philosophy

### 2.1 Three Principles of Differentiation

**Principle 1: Invisible Intelligence**

AI should feel like the platform is simply smart. No "AI-powered" badges. No chatbot windows. When a security guard speaks an incident report into their phone and it appears as a clean, structured log entry -- that is invisible intelligence. The guard did not "use AI." They just did their job faster.

**Principle 2: Role-Aware Everything**

Every screen, every widget, every notification adapts to who you are. A front desk concierge and a board member looking at the same building see completely different interfaces. This is not permission gating (hiding buttons). This is fundamentally different experiences designed for different jobs.

**Principle 3: Compound Value**

Each innovation is valuable alone. Together, they create something greater than the sum of their parts. The AI Daily Briefing pulls from predictive maintenance, anomaly detection, weather data, and scheduling -- none of which exist in isolation in competing products. The compound effect is what makes Concierge impossible to replicate feature-by-feature.

### 2.2 Innovation Categories

| Category          | Definition                                            | Risk                                                  | Reward                                       |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| **AI-Native**     | Features powered by the AI service layer (PRD 19)     | Medium -- depends on AI provider reliability and cost | Very High -- no competitor has these         |
| **Platform**      | Architectural and UX capabilities baked into the core | Low -- proven engineering patterns                    | High -- dramatically better daily experience |
| **Analytics**     | Data-driven insights and visualizations               | Low -- standard data engineering                      | High -- transforms raw data into decisions   |
| **Future Vision** | Emerging technology and long-term concepts            | High -- technology maturity varies                    | Very High -- defines the next generation     |

---

## 3. AI-Native Features

> These 15 innovations leverage the AI Framework (PRD 19) to deliver capabilities that no building management platform offers. Each feature degrades gracefully -- Concierge works without AI, it just works better with it.

---

### 3.1 AI Daily Briefing

**Description**

When a staff member starts their shift, the dashboard shows a personalized briefing that summarizes everything they need to know. Overnight events, pending items, today's scheduled maintenance, weather-related alerts, and any anomalies detected since their last login -- all in a 200-300 word summary written in natural language.

This is not a list of notifications. It is a narrative that connects the dots: "Three packages arrived overnight for units on the 4th floor. The elevator servicing scheduled for today may affect delivery. Two maintenance requests from last night remain unresolved, both related to plumbing on the 12th floor -- this could indicate a shared pipe issue."

> **Tooltip — Graceful Degradation**: If the AI service is unavailable, the dashboard shows standard KPI cards and a chronological event list. The briefing reappears when AI service is restored.

**User Story**

As a front desk concierge starting my morning shift, I want to see a summary of everything that happened since I left so that I can prioritize my first actions without reading through dozens of individual log entries.

**Acceptance Criteria**

- [ ] Briefing appears within 3 seconds of dashboard load
- [ ] Content is personalized to the user's role (concierge sees packages and visitors; security sees incidents and patrols)
- [ ] Briefing covers: overnight events, pending items, today's calendar, weather alerts, detected anomalies
- [ ] Narrative connects related items (e.g., multiple plumbing issues on the same floor)
- [ ] Briefing is cached for 1 hour to avoid redundant API calls
- [ ] User can dismiss the briefing or expand it to full detail
- [ ] If AI is unavailable, standard KPI dashboard loads without error

**Implementation Notes**

- Uses Sonnet model at ~$0.01 per generation
- Triggered at user's configured shift start time or on first login of the day
- Input: overnight events + pending items + calendar + weather API data + anomaly flags
- Output: 200-300 word narrative summary
- PII stripped before API call per the AI Framework privacy pipeline (PRD 19, Section 5)
- Cache key: user_id + date + shift_start_time

**Target Version**: v1
**Complexity**: Medium

---

### 3.2 Semantic Search

**Description**

Traditional search in building management platforms matches keywords: type "broken" and you get every entry containing that exact word. Semantic search understands meaning. Type "leaking faucet on high floors" and it returns maintenance requests about dripping taps on floors 15-30, even if none of them used the word "leaking."

Semantic search works across all modules -- events, maintenance requests, residents, units, amenity bookings, documents. Results are ranked by relevance to the user's role and recent activity.

> **Tooltip — Semantic Search**: Search that understands the meaning behind your words, not just the exact letters you typed. Powered by embedding models that convert text into mathematical representations of meaning.

**User Story**

As a property manager, I want to search for "water damage issues this winter" and get all related maintenance requests, vendor work orders, and incident reports -- even if they used different words like "flooding," "pipe burst," or "condensation."

**Acceptance Criteria**

- [ ] Search returns results across all modules the user has permission to view
- [ ] Results ranked by semantic relevance, not just keyword frequency
- [ ] Search understands synonyms and related concepts
- [ ] Results respect role-based access -- a resident never sees staff-only data
- [ ] Response time under 500ms for 95th percentile queries
- [ ] Fallback to keyword search if embedding service is unavailable
- [ ] Search suggestions appear after 3 characters typed (debounced 300ms)

**Implementation Notes**

- Uses OpenAI Embeddings for vectorization + Haiku for result reranking
- All searchable content is embedded on write (async) and stored in a vector index
- Query flow: user input -> embed query -> vector similarity search -> Haiku reranking -> filtered by role permissions -> return
- Estimated cost: $0.001 per query
- Vector index updates are eventual-consistent (< 30 second delay)

**Target Version**: v1
**Complexity**: High

---

### 3.3 Smart Guard Scheduling

**Description**

The platform analyzes historical incident data, seasonal patterns, building events, and weather forecasts to recommend optimal security guard shift schedules. Instead of static Monday-through-Friday rotations, the system identifies high-risk periods (Friday nights, holiday weekends, move-in/move-out days) and suggests increased coverage.

It also considers guard performance data and preferences to create balanced schedules that distribute high-demand shifts fairly.

**User Story**

As a property manager, I want the system to suggest guard schedules based on when incidents actually happen so that I can allocate security resources where they matter most.

**Acceptance Criteria**

- [ ] Generates weekly schedule recommendations based on historical incident patterns
- [ ] Considers: day of week, time of day, season, building events, weather forecast, guard availability
- [ ] Flags high-risk periods with recommended staffing levels
- [ ] Distributes undesirable shifts (overnight, weekends) fairly across guards
- [ ] Manager can accept, modify, or reject recommendations
- [ ] Shows reasoning for each recommendation ("Friday evenings average 3x more incidents")
- [ ] Minimum 90 days of historical data required before predictions activate
- [ ] Manual scheduling remains fully functional if AI is disabled

**Implementation Notes**

- Uses Sonnet model for pattern analysis (~$0.01 per generation)
- Scheduled weekly (Sunday 8:00 PM) for the upcoming week
- Input: 90-day incident history + event calendar + weather API + guard roster + availability
- Output: recommended weekly schedule with risk scores per shift
- Requires integration with weather API and building event calendar

**Target Version**: v2
**Complexity**: High

---

### 3.4 Predictive Maintenance

**Description**

Rather than waiting for things to break, the platform analyzes equipment maintenance history, age, manufacturer data, and usage patterns to predict when equipment is likely to fail. It generates preventive maintenance recommendations weeks or months before a failure occurs.

The system learns from each property's specific patterns. A boiler that runs harder in a Toronto winter gets different predictions than one in a Vancouver building.

**User Story**

As a property manager, I want to know which building systems are likely to need repair in the next 60 days so that I can schedule preventive maintenance and avoid emergency service calls.

**Acceptance Criteria**

- [ ] Generates failure risk scores (0-100) for all tracked equipment
- [ ] Provides 30/60/90-day failure probability estimates
- [ ] Recommends specific preventive maintenance actions with priority ranking
- [ ] Considers: equipment age, maintenance history, manufacturer specs, usage intensity, season
- [ ] Tracks prediction accuracy over time (predicted vs actual failures)
- [ ] Property manager can dismiss or defer recommendations
- [ ] Requires minimum 6 months of equipment history before predictions activate
- [ ] Without AI, standard time-based maintenance schedules continue unchanged

**Implementation Notes**

- Uses Sonnet model for analysis (~$0.01 per weekly generation)
- Scheduled weekly (Wednesday 3:00 AM)
- Input: equipment records + maintenance history + age data + seasonal factors
- Output: failure risk scores + recommended maintenance schedule
- Accuracy improves over time as more data is collected -- system tracks its own prediction quality

**Target Version**: v2
**Complexity**: Very High

---

### 3.5 Automated Report Narratives

**Description**

Every report in Concierge can include an AI-generated narrative summary. Instead of just tables and charts, the system writes a plain-language explanation of what the data shows: "Maintenance response times improved 18% this quarter, driven primarily by faster vendor assignment. However, plumbing-related requests continue to take 40% longer than average, suggesting a need for a dedicated plumbing vendor."

This turns data into insight without requiring the reader to interpret charts.

**User Story**

As a board member reviewing monthly reports, I want a written summary that explains what the numbers mean so that I can make decisions without being a data analyst.

**Acceptance Criteria**

- [ ] Narrative generated for any report on demand (button click)
- [ ] Summary is 150-400 words depending on report complexity
- [ ] Identifies trends, anomalies, and comparisons to previous periods
- [ ] Highlights actionable findings ("consider adding a plumbing vendor")
- [ ] Language adapts to the viewer's role (technical for managers, strategic for board members)
- [ ] Narrative can be exported as part of the report (PDF/Excel)
- [ ] Without AI, reports contain only tables and charts

**Implementation Notes**

- Uses Sonnet model (~$0.005 per generation)
- Triggered on demand (button on report view)
- Input: report dataset + historical comparison data + role context
- Output: narrative summary with key findings
- Cached for 24 hours per report configuration

**Target Version**: v1
**Complexity**: Medium

---

### 3.6 Resident Satisfaction Score

**Description**

The platform calculates a real-time satisfaction score for each resident and for the building as a whole. It analyzes maintenance response times, package delivery speed, amenity availability, communication engagement, and complaint frequency to generate a score from 0 to 100.

This is not a survey. It is a computed score based on actual service quality data. Properties can use it to identify unhappy residents before they complain and to track the impact of operational changes.

**User Story**

As a property manager, I want to see which residents are likely dissatisfied based on their service experience so that I can proactively reach out before issues escalate.

**Acceptance Criteria**

- [ ] Score calculated per resident (0-100) and aggregated per building
- [ ] Factors include: maintenance response time, package claim time, amenity booking success rate, announcement engagement, complaint history
- [ ] Score updates daily
- [ ] Identifies at-risk residents (score dropping over 30 days)
- [ ] Manager can see contributing factors for any score
- [ ] Building-wide trend displayed on management dashboard
- [ ] Score is internal only -- never visible to residents
- [ ] Without AI, no satisfaction score is displayed

**Implementation Notes**

- Uses Sonnet model for factor weighting and analysis (~$0.005 per daily run)
- Scheduled daily (3:00 AM)
- Input: cross-module metrics per resident over trailing 90 days
- Output: satisfaction score + contributing factors + trend direction
- Privacy consideration: score is derived from service metrics only, never from message content

**Target Version**: v2
**Complexity**: High

---

### 3.7 Multi-Language Auto-Translation

**Description**

Any content created in Concierge -- announcements, notifications, maintenance updates, community posts -- can be automatically translated into multiple languages based on the building's resident demographics. The translation preserves tone and context, not just words.

Property administrators configure which languages are active for their building. When a concierge writes an announcement in English, translations into Mandarin, French, Arabic, or any configured language are generated automatically and delivered based on each resident's language preference.

**User Story**

As a concierge in a multilingual building, I want to write announcements once and have them automatically translated into the languages our residents speak so that everyone stays informed.

**Acceptance Criteria**

- [ ] Supports 20+ languages including: English, French, Mandarin, Cantonese, Arabic, Hindi, Urdu, Korean, Spanish, Portuguese, Tagalog, Russian, Farsi, Tamil, Punjabi, Vietnamese, Japanese, Italian, German, Polish
- [ ] Property Admin configures active languages for their building
- [ ] Residents set their preferred language in their profile
- [ ] Translation preserves tone (formal announcements stay formal, casual stays casual)
- [ ] Translated content is reviewed by staff before sending (not auto-sent)
- [ ] Translation cost displayed before confirmation
- [ ] Without AI, content is delivered in the original language only

**Implementation Notes**

- Uses Sonnet model for high-quality contextual translation (~$0.005 per language per translation)
- Triggered on demand (per language, per piece of content)
- Input: source text + target language + tone context
- Output: translated text with confidence indicator
- Staff can edit translations before publishing

**Target Version**: v1
**Complexity**: Medium

---

### 3.8 Voice-to-Text Incident Reporting

**Description**

Security guards and concierge staff can record incident reports by speaking into their phone. The system transcribes the audio, structures it into the correct report format, assigns appropriate categories and severity, and presents it for review before submission.

This is critical for situations where typing is impractical: a guard on patrol, a concierge handling a crowd, or any time where speed matters more than keyboard access.

**User Story**

As a security guard on patrol, I want to speak my incident report into my phone and have it appear as a structured, properly categorized log entry so that I can document events without stopping to type.

**Acceptance Criteria**

- [ ] Microphone button available on all event/incident creation forms
- [ ] Supports recordings up to 5 minutes
- [ ] Transcription accuracy of 95%+ for clear speech
- [ ] Auto-populates structured fields: category, severity, description, location
- [ ] Guard reviews and confirms before submission
- [ ] Works in noisy environments (lobby, parking garage) with noise reduction
- [ ] Offline mode: records audio locally and transcribes when connectivity resumes
- [ ] Without AI, standard text entry form is used

**Implementation Notes**

- Uses OpenAI Whisper for speech-to-text (~$0.006 per minute)
- Uses Sonnet for structuring transcribed text into report fields (~$0.005)
- Total cost: ~$0.02 per report
- Mobile-first implementation -- optimized for phone microphone
- Audio is never stored permanently -- deleted after successful transcription

**Target Version**: v1
**Complexity**: Medium

---

### 3.9 Smart Anomaly Alerts

**Description**

The platform continuously monitors all building activity and flags events that deviate from normal patterns. If packages normally arrive between 9 AM and 5 PM and one is logged at 2 AM, the system flags it. If a unit that never files complaints suddenly files three in a week, the system notices.

Anomaly alerts are surfaced on the dashboard and sent as notifications to appropriate staff. Each alert includes context: what is unusual, what the normal pattern looks like, and a recommended action.

**User Story**

As a property manager, I want to be automatically notified when something unusual happens in the building so that I can investigate before small issues become big problems.

**Acceptance Criteria**

- [ ] Monitors all event types for statistical anomalies
- [ ] Compares each event against 90-day rolling baseline for the property
- [ ] Alert includes: what happened, why it is unusual, normal pattern context, recommended action
- [ ] Alert severity: Info (unusual but not concerning), Warning (needs attention), Critical (immediate action)
- [ ] Configurable sensitivity per event type (reduce false positives)
- [ ] Maximum 5 alerts per day to prevent fatigue (prioritized by severity)
- [ ] Without AI, no anomaly detection -- events are logged without pattern analysis

**Implementation Notes**

- Uses Haiku model for real-time anomaly scoring (~$0.002 per event)
- Triggered on every new event creation
- Input: current event + 90-day historical data for same event type
- Output: anomaly flag (yes/no) + severity + explanation
- Rate-limited to prevent cost overruns on high-volume properties

**Target Version**: v1
**Complexity**: Medium

---

### 3.10 AI Cost Analytics Dashboard

**Description**

A dedicated dashboard for Super Admins and Property Admins that shows exactly how much AI features cost, which ones deliver the most value, and where to optimize spending. It tracks cost per feature, acceptance rates (how often staff accept AI suggestions), and return on investment.

This is not just a billing page. It is a decision-support tool: "Voice-to-Text Reporting costs $45/month but saves guards an estimated 12 hours of typing. Predictive Maintenance costs $8/month and prevented 2 emergency calls worth $3,200."

**User Story**

As a Super Admin, I want to see exactly how much each AI feature costs and how much value it delivers so that I can make informed decisions about which features to keep enabled.

**Acceptance Criteria**

- [ ] Dashboard shows: daily spend, monthly cumulative, cost per feature, cost per call average
- [ ] Tracks acceptance rate per feature (how often staff accept AI suggestions vs override)
- [ ] Estimates ROI where measurable (time saved, emergency calls avoided)
- [ ] Budget alerts at 80% and 100% of configured monthly limit
- [ ] Allows per-feature cost analysis with trend over time
- [ ] Export as PDF or Excel for board reporting
- [ ] Features below 60% acceptance rate are automatically flagged for review

**Implementation Notes**

- Built on the AI Framework infrastructure layer (PRD 19, Section 5)
- Data source: AI invocation logs already captured by the framework
- No AI model cost -- this is a reporting feature built on existing telemetry
- Real-time updates via WebSocket for Super Admins monitoring spend

**Target Version**: v1
**Complexity**: Low

---

### 3.11 Courier Label OCR

**Description**

When a package arrives, the concierge takes a photo of the shipping label. The system uses optical character recognition to extract the tracking number, courier name, recipient name, and unit number. These fields are auto-populated in the package intake form, reducing manual data entry to a single photo.

For busy lobbies processing 50-100 packages per day, this saves 30-60 minutes of typing.

> **Tooltip — OCR (Optical Character Recognition)**: Technology that reads printed text from images. Point your camera at a shipping label and the system reads the text for you.

**User Story**

As a front desk concierge processing a large delivery, I want to photograph each package label and have the tracking number and recipient auto-filled so that I can process packages in seconds instead of minutes.

**Acceptance Criteria**

- [ ] Extracts: tracking number, courier name, recipient name, unit number (where printed)
- [ ] Accuracy of 90%+ for standard shipping labels (Amazon, FedEx, UPS, Canada Post, Purolator)
- [ ] Auto-matches extracted recipient to resident directory
- [ ] Staff reviews and confirms extracted data before saving
- [ ] Processes label photo in under 3 seconds
- [ ] Works with phone camera (no special hardware required)
- [ ] Without AI, manual data entry fields remain unchanged

**Implementation Notes**

- Uses GPT-4o Vision model (~$0.005 per label)
- Paired with Haiku for recipient-to-resident matching (~$0.001)
- Total cost: ~$0.006 per package
- Mobile-optimized camera interface with auto-focus on label area
- Training data: common North American courier label formats

**Target Version**: v1
**Complexity**: Medium

---

### 3.12 License Plate OCR

**Description**

Security guards can photograph a vehicle's license plate to auto-fill the plate number in visitor passes, parking violations, or vehicle registrations. The system extracts the plate number and province/state, then checks it against the building's registered vehicle database to identify if it belongs to a resident, a known visitor, or an unknown vehicle.

**User Story**

As a security guard documenting a parking violation, I want to photograph the license plate and have the plate number auto-filled so that I can complete the report quickly without transcription errors.

**Acceptance Criteria**

- [ ] Extracts plate number and province/state from photo
- [ ] Accuracy of 90%+ for standard North American plates
- [ ] Cross-references against building vehicle registry
- [ ] Identifies: registered resident vehicle, known visitor, or unknown
- [ ] Guard confirms extracted data before saving
- [ ] Works in low-light conditions (parking garages)
- [ ] Processing time under 3 seconds
- [ ] Without AI, manual plate number entry remains available

**Implementation Notes**

- Uses GPT-4o Vision model (~$0.01 per photo)
- Input: vehicle/plate photo
- Output: plate number + province/state + registry match result
- Low-light photo enhancement pre-processing on device before upload

**Target Version**: v2
**Complexity**: Medium

---

### 3.13 Natural Language Report Builder

**Description**

Instead of clicking through filters and column selectors, staff can type what they want to see in plain language: "Show me all maintenance requests from January that took more than 7 days to close, grouped by category." The system converts this into the correct query, applies the right filters, and generates the report.

**User Story**

As a property manager, I want to type what report I need in plain language and have it generated automatically so that I do not need to learn a complex report builder interface.

**Acceptance Criteria**

- [ ] Accepts natural language queries in a search bar on the Reports page
- [ ] Correctly interprets: date ranges, entity types, filters, grouping, sorting
- [ ] Shows the interpreted query for user confirmation ("I'll show maintenance requests from Jan 1-31 with resolution > 7 days, grouped by category. Is that right?")
- [ ] User can refine the query conversationally ("Also filter to just plumbing")
- [ ] Generated report can be saved, exported, and scheduled like any manual report
- [ ] Supports all report types available in the standard report builder
- [ ] Without AI, the standard filter-and-column report builder is used

**Implementation Notes**

- Uses Sonnet model for query interpretation (~$0.01 per query)
- Translates natural language into structured report parameters
- Does NOT execute raw SQL -- translates to the same filter/column API used by the manual builder
- Conversation context maintained for refinement (up to 5 follow-up queries)

**Target Version**: v2
**Complexity**: High

---

### 3.14 Board Presentation Auto-Generator

**Description**

Property managers preparing for board meetings can generate a presentation-ready document from their monthly data. The system pulls key metrics, generates narrative summaries, creates charts, identifies trends, and formats everything into a polished slide deck or PDF suitable for board review.

**User Story**

As a property manager preparing for a board meeting, I want to generate a professional presentation from this month's data so that I can spend my time on strategy instead of slide creation.

**Acceptance Criteria**

- [ ] Generates a 10-15 slide presentation from monthly operational data
- [ ] Includes: executive summary, financial overview, maintenance summary, security summary, amenity utilization, resident satisfaction trends
- [ ] Each slide has a narrative and relevant chart/table
- [ ] Highlights notable trends, improvements, and areas of concern
- [ ] Export as PDF or PowerPoint format
- [ ] Manager can edit any slide before finalizing
- [ ] Template style configurable per property (logo, colors)
- [ ] Without AI, manual presentation creation from raw reports

**Implementation Notes**

- Uses Sonnet model for narrative generation (~$0.01 per presentation)
- Uses the same data pipeline as individual module reports
- Chart generation: server-side rendering (same library as dashboard charts)
- Output: structured JSON that renders into PDF or PPTX via template engine
- Estimated generation time: 15-30 seconds for a full presentation

**Target Version**: v2
**Complexity**: Very High

---

### 3.15 Staff Performance AI Scoring

**Description**

The platform analyzes staff activity patterns to generate objective performance metrics. For security guards: response time to incidents, report quality scores, patrol coverage. For concierge: package processing speed, event logging consistency, shift handoff completeness. For maintenance staff: resolution time, first-time fix rate.

Scores are visible to supervisors and property managers only. They are advisory -- never used for automated employment decisions.

**User Story**

As a property manager supervising 8 concierge staff, I want to see objective performance metrics for each team member so that I can identify training needs and recognize high performers.

**Acceptance Criteria**

- [ ] Generates weekly performance scorecard per staff member
- [ ] Metrics tailored to role (security, concierge, maintenance each have different KPIs)
- [ ] Includes: activity volume, response time, quality scores, consistency metrics
- [ ] Compares individual performance to team averages (not absolute standards)
- [ ] Identifies trends: improving, stable, declining
- [ ] Visible to supervisors and property managers only
- [ ] Staff member can see their own metrics (configurable by Property Admin)
- [ ] Clearly labeled as "advisory" -- not for automated decisions
- [ ] Default: disabled. Must be explicitly enabled by Property Admin
- [ ] Without AI, no performance scoring -- manual supervisor evaluation only

**Implementation Notes**

- Uses Sonnet model for analysis (~$0.01 per weekly scorecard)
- Scheduled weekly (Monday 6:00 AM)
- Input: all staff activity for the week, aggregated by user
- Output: scorecard with metrics, comparisons, and trend indicators
- Default state: **disabled** -- requires explicit opt-in due to sensitivity
- Privacy: individual performance data is never sent to AI providers -- only anonymized aggregates

**Target Version**: v2
**Complexity**: High

---

## 4. Platform Innovation

> These 10 features represent architectural and user experience advances that no competitor in the building management space executes well. They require engineering investment but no AI dependency.

---

### 4.1 Role-Aware Everything

**Description**

Every screen in Concierge adapts to the logged-in user's role. This is the platform's core differentiator. A front desk concierge sees a package intake grid and visitor log. A security guard sees an incident dashboard and patrol tracker. A property manager sees maintenance queues and vendor compliance. A board member sees financial summaries and building analytics. A resident sees their packages, bookings, and announcements.

This is not the same interface with some buttons hidden. Each role has its own layout, navigation, dashboard widgets, default views, and action priorities.

> **Tooltip — Role-Aware**: The interface adapts not just in what you can do (permissions) but in what you see and how it is organized. Different jobs get different experiences, designed specifically for how each role works.

**User Story**

As a security guard starting my shift, I want to see a security-focused dashboard without any maintenance, billing, or amenity features so that I can focus on my job without distraction.

**Acceptance Criteria**

- [ ] 5 distinct role experiences: Front Desk, Security Guard, Property Manager, Board Member, Resident
- [ ] Each role has: unique dashboard layout, customized navigation menu, role-specific quick actions
- [ ] Features a user cannot access are completely invisible (never grayed out or disabled)
- [ ] Navigation shows only the modules relevant to the current role
- [ ] Dashboard widgets are role-appropriate (security gets incident map; concierge gets package queue)
- [ ] Data columns in list views are role-optimized
- [ ] Role switching (for users with multiple roles) is seamless, with no page reload

**Implementation Notes**

- Architecture defined in PRD 01 (Section 2.3) and PRD 02
- Role-aware rendering happens at the API layer: endpoints return different data shapes per role
- Frontend uses role-based component trees -- not conditional rendering on a single tree
- Each role has a separate navigation configuration stored in the role definition

**Target Version**: v1
**Complexity**: High (but foundational -- must ship in v1)

---

### 4.2 Command Palette (Cmd+K)

**Description**

A keyboard shortcut (Cmd+K on Mac, Ctrl+K on Windows) opens a universal command palette. Staff can type to search for anything, navigate to any page, or trigger any action -- without touching the mouse. Type "pkg" to jump to packages. Type "unit 1204" to open that unit's file. Type "new incident" to start an incident report.

This is the power-user feature that makes Concierge feel like a professional tool, not a web app from 2012.

**User Story**

As a concierge processing a busy lobby, I want to press Cmd+K and type "new package" to instantly open the package intake form so that I can work at the speed of thought.

**Acceptance Criteria**

- [ ] Opens with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
- [ ] Searches across: pages, actions, recent items, residents, units, events
- [ ] Shows results as user types with keyboard navigation (arrow keys + enter)
- [ ] Supports fuzzy matching ("mnt req" matches "Maintenance Request")
- [ ] Recent actions appear by default when palette opens (no typing needed)
- [ ] Role-aware: only shows pages and actions the user has access to
- [ ] Response time under 100ms for result display
- [ ] Works on every page in the application

**Implementation Notes**

- Client-side implementation -- no API calls for navigation items
- Searchable index built on login and updated via WebSocket
- Fuzzy matching library (e.g., Fuse.js) for tolerance of typos
- Action registry: each module registers its available actions at load time
- Recent items tracked in local storage (last 20 actions per user)

**Target Version**: v1
**Complexity**: Medium

---

### 4.3 Real-Time Collaboration (WebSocket)

**Description**

When multiple staff members work the same shift, they see each other's actions in real time. When one concierge logs a package, the other concierge sees it appear on their screen without refreshing. When a guard closes an incident, the property manager's dashboard updates instantly.

This eliminates the "I already handled that" problem that plagues every building management platform where staff must manually refresh to see current data.

**User Story**

As one of two concierge staff on a morning shift, I want to see my colleague's package entries appear on my screen in real time so that we do not duplicate work or miss updates.

**Acceptance Criteria**

- [ ] New events, status changes, and closures appear on all connected clients within 1 second
- [ ] Presence indicators show which staff are currently online and active
- [ ] Optimistic UI updates (action appears immediately, confirmed by server)
- [ ] Conflict detection: if two users edit the same record, the second user is warned
- [ ] WebSocket reconnects automatically after network interruption
- [ ] Falls back to polling (30-second interval) if WebSocket is unavailable
- [ ] Real-time updates respect role permissions -- users only see updates they are authorized to view

**Implementation Notes**

- WebSocket architecture defined in PRD 01 (Section 2.5)
- Event types for real-time: event_created, event_updated, event_closed, maintenance_updated, booking_changed, shift_note_added
- Channels scoped by property_id to prevent cross-tenant data leakage
- Presence system: heartbeat every 30 seconds, timeout after 90 seconds
- Estimated concurrent connections per property: 5-15 staff

**Target Version**: v1
**Complexity**: High

---

### 4.4 Dark Mode

**Description**

A system-wide dark color scheme for use during night shifts, in dimly lit lobbies, or by user preference. Dark mode is not just inverted colors -- it is a carefully designed alternate palette that maintains readability, preserves status color meaning, and reduces eye strain.

Dark mode follows the user's system preference by default but can be overridden in user settings.

**User Story**

As a security guard working the overnight shift, I want a dark interface that does not strain my eyes in a dimly lit lobby so that I can work comfortably for 8 hours.

**Acceptance Criteria**

- [ ] Follows system preference (prefers-color-scheme) by default
- [ ] User can override: Light, Dark, or Auto (follow system)
- [ ] All text maintains WCAG AA contrast ratios in both modes
- [ ] Status colors (red, yellow, green, blue) remain distinguishable in dark mode
- [ ] Charts and data visualizations adapt to dark backgrounds
- [ ] Transition between modes is smooth (no flash of wrong colors)
- [ ] Print output always uses light mode regardless of display setting
- [ ] Dark mode applies to all pages including settings and admin panels

**Implementation Notes**

- CSS custom properties (variables) for all colors
- Two theme files: light (default) and dark
- Design system (referenced in CLAUDE.md) extended with dark variants
- Key constraint: status colors must not change meaning between modes -- red always means critical
- Images and logos may need dark-mode-specific variants

**Target Version**: v1
**Complexity**: Medium

---

### 4.5 Offline-First Mobile

**Description**

The mobile application works without an internet connection. Guards on patrol in underground parking, concierge staff in areas with poor reception, and maintenance workers in mechanical rooms can all continue working. Data is cached locally, new entries are queued, and everything syncs automatically when connectivity resumes.

> **Tooltip — Offline-First**: The app stores data on your device so it works even without internet. When you reconnect, your changes are automatically uploaded.

**User Story**

As a security guard patrolling the underground parking garage where there is no cell signal, I want to log incidents on my phone and have them sync when I return to the lobby so that no events go unreported.

**Acceptance Criteria**

- [ ] All read data is cached locally on the device
- [ ] Create and update operations are queued with timestamps when offline
- [ ] Queue status indicator shows how many operations are pending sync
- [ ] On reconnect, queued operations sync automatically
- [ ] Conflicts are surfaced to the user: keep mine, keep server, or merge
- [ ] Offline mode supports: event creation, incident reporting, shift notes, photo capture
- [ ] Photos taken offline are stored locally and uploaded on reconnect
- [ ] Maximum offline period: 72 hours of cached data

**Implementation Notes**

- Architecture defined in PRD 01 (Section 2.6)
- Service worker for web-based PWA; native offline storage for mobile apps
- Operation queue: IndexedDB (web) or SQLite (native)
- Conflict resolution: last-write-wins for most fields; manual merge for text fields
- Sync priority: critical events first, then normal events, then read-cache updates

**Target Version**: v1
**Complexity**: Very High

---

### 4.6 Digital Signage Integration

**Description**

Concierge can push content to lobby display screens. Announcements, event calendars, weather, and building information appear on screens in the lobby, elevator, mail room, or any common area -- all managed from the same platform where the content is created.

No separate digital signage software required. No manual updates to TV screens. Write an announcement and check the "Lobby Display" box.

**User Story**

As a property manager, I want announcements to automatically appear on the lobby TV screen when I publish them so that residents see important information as they walk through the building.

**Acceptance Criteria**

- [ ] Dedicated "Signage" page builder for lobby display layouts
- [ ] Content types: announcements, event calendar, weather widget, building info, emergency alerts
- [ ] Auto-rotation between content cards (configurable interval: 10-60 seconds)
- [ ] Emergency alerts immediately override all other content
- [ ] Supports multiple display zones (lobby, elevator, mail room)
- [ ] Content syncs in real time -- changes appear on screens within 30 seconds
- [ ] Display device: any screen with a web browser (smart TV, Chromecast, dedicated signage player)
- [ ] Works without internet after initial load (cached content rotates offline)

**Implementation Notes**

- Signage client: lightweight web app running in full-screen browser mode
- Content delivery: WebSocket for real-time updates, local cache for offline resilience
- Layout engine: grid-based with responsive zones
- Emergency override: dedicated WebSocket channel with highest priority
- Hardware agnostic: works on any device with a modern web browser

**Target Version**: v2
**Complexity**: Medium

---

### 4.7 Resident Mobile App with Push Notifications

**Description**

Residents have their own mobile app (or PWA) that delivers push notifications for packages, maintenance updates, announcements, and booking confirmations. The app is purpose-built for residents -- it does not expose any staff functionality.

Push notifications are the killer feature. A resident gets a tap on their phone the moment a package arrives. They tap to see details. They tap again to acknowledge. Three taps, three seconds, done.

**User Story**

As a resident, I want to receive a push notification the instant my package arrives so that I can pick it up before the lobby gets busy.

**Acceptance Criteria**

- [ ] Available as iOS app, Android app, or Progressive Web App (PWA)
- [ ] Push notifications for: package arrival, maintenance status change, new announcement, booking confirmation
- [ ] Resident can configure notification preferences per type (push, email, SMS, or off)
- [ ] App shows: my packages, my maintenance requests, my bookings, building announcements
- [ ] Package acknowledgment: resident taps "I'll pick it up" to notify front desk
- [ ] Maintenance request submission with photo upload
- [ ] Amenity booking with calendar view
- [ ] Biometric login (Face ID / fingerprint) for quick access
- [ ] Without the app, residents use the web portal with email notifications

**Implementation Notes**

- Push notification service: Firebase Cloud Messaging (cross-platform)
- Native apps: React Native or Flutter for iOS/Android
- PWA: for residents who prefer not to install an app
- Notification delivery: triggered by event system webhooks
- Resident-only scope: separate from staff mobile app (different codebase, different permissions)

**Target Version**: v1
**Complexity**: Very High

---

### 4.8 Webhook and API Ecosystem

**Description**

Concierge exposes a documented REST API and webhook system that allows third-party integrations. Property management companies can connect Concierge to their accounting software, CRM, access control systems, elevator management, visitor management kiosks, and more.

Webhooks push data out when events occur. APIs pull data in when external systems need it. This makes Concierge a platform, not just an application.

> **Tooltip — Webhook**: An automated message sent from Concierge to another system when something happens. For example: "A package was delivered" triggers a webhook that updates your property management CRM.

**User Story**

As a property management company IT administrator, I want to connect Concierge to our accounting system via API so that maintenance costs flow automatically into our books.

**Acceptance Criteria**

- [ ] RESTful API with OpenAPI 3.0 documentation
- [ ] Authentication: API keys with scoped permissions (read-only, read-write, per-module)
- [ ] Webhook subscriptions: property admins configure which events trigger webhooks to which URLs
- [ ] Webhook events for: event creation/closure, maintenance request changes, resident changes, booking changes
- [ ] Retry logic: 3 attempts with exponential backoff on webhook delivery failure
- [ ] Rate limiting: 1000 requests/minute per API key (configurable)
- [ ] API versioning (v1, v2, etc.) with 12-month deprecation notice
- [ ] Webhook delivery logs visible in admin panel

**Implementation Notes**

- API gateway with rate limiting, authentication, and logging
- Webhook delivery: async queue (background job) to prevent blocking main operations
- API documentation: auto-generated from code annotations (OpenAPI spec)
- SDK consideration: TypeScript/JavaScript and Python SDKs for common integrations
- API keys stored encrypted; rotatable without downtime

**Target Version**: v2
**Complexity**: High

---

### 4.9 Customizable Dashboard Widgets

**Description**

Every user can customize their dashboard by adding, removing, rearranging, and resizing widgets. A concierge who processes 100 packages a day can make the package queue widget large. A property manager tracking vendor compliance can pin the vendor scorecard to the top. A board member can focus on financial summaries.

Widgets are role-aware: users only see widgets relevant to their role. But within those constraints, the layout is fully personalized.

**User Story**

As a front desk concierge, I want to rearrange my dashboard widgets so that the package queue is front and center since that is 80% of my daily work.

**Acceptance Criteria**

- [ ] Drag-and-drop widget rearrangement
- [ ] Widget resizing: small (1/4 width), medium (1/2 width), large (full width)
- [ ] Add/remove widgets from a role-appropriate catalog
- [ ] Widget catalog includes: KPI cards, event lists, calendars, charts, quick-action buttons, search, weather
- [ ] Layout persists per user across sessions and devices
- [ ] "Reset to default" option to restore role-default layout
- [ ] Property Admin can set the default layout per role
- [ ] Layout syncs across devices (not stored locally)

**Implementation Notes**

- Widget framework: each widget is a self-contained component with its own data source
- Layout storage: user preference record in the database (JSON layout definition)
- Drag-and-drop: CSS Grid with a drag library (e.g., react-grid-layout)
- Widget catalog: registry pattern -- each module registers available widgets on load
- Default layouts defined per role by Property Admin in Settings

**Target Version**: v1
**Complexity**: Medium

---

### 4.10 Multi-Property Portfolio View

**Description**

Management companies overseeing multiple properties can view aggregated data across all their buildings from a single dashboard. Total packages across all buildings, combined maintenance backlog, comparative security incident rates, and cross-property staff scheduling.

This is not just a building selector dropdown. It is a portfolio management interface that treats multiple buildings as a unified operation.

**User Story**

As a regional property manager overseeing 5 buildings, I want to see all my properties on one screen with key metrics so that I can identify which building needs my attention today.

**Acceptance Criteria**

- [ ] Portfolio dashboard shows all properties with key metrics per building
- [ ] Aggregated views: total packages, total open maintenance requests, total incidents, occupancy rates
- [ ] Comparative views: which building has the highest incident rate? Which has the most overdue maintenance?
- [ ] Click any building to drill into its individual dashboard
- [ ] Cross-property search: find a resident across all managed buildings
- [ ] Cross-property reporting: generate reports spanning multiple buildings
- [ ] Data isolation maintained: each property's data is separate in storage, aggregated only at display time
- [ ] Role permissions enforced: users only see properties they are assigned to

**Implementation Notes**

- Architecture supports multi-tenancy from v1 (PRD 01, Section 2.2)
- Portfolio view is an additional layer on top of single-property dashboards
- Aggregation queries: materialized views or scheduled rollups for performance
- Cross-property search: federated search across property-scoped indices
- Target users: management company staff with multi-property assignments

**Target Version**: v2
**Complexity**: High

---

## 5. Analytics Innovation

> These 7 features transform raw operational data into actionable intelligence. They give property managers, board members, and management companies the ability to make data-driven decisions.

---

### 5.1 Staff Leaderboard

**Description**

A gamified performance view that ranks staff by key metrics: packages processed, incidents resolved, response times, and shift coverage. The leaderboard is opt-in and designed to encourage healthy competition, not punitive comparison.

Rankings reset weekly and monthly. Top performers are highlighted. The leaderboard is visible to staff and supervisors only -- never to residents or board members.

**User Story**

As a front desk supervisor, I want to see which concierge staff are processing the most packages and resolving the most events so that I can recognize high performers and identify coaching opportunities.

**Acceptance Criteria**

- [ ] Weekly and monthly ranking views
- [ ] Metrics tracked: events processed, average response time, package volume, shift completeness
- [ ] Rankings are role-specific (concierge ranked against concierge, guards against guards)
- [ ] Top 3 highlighted with visual distinction
- [ ] Opt-in: Property Admin must enable, individual staff can opt out
- [ ] Visible to: staff in the leaderboard, supervisors, property managers only
- [ ] Historical trends: "You processed 15% more packages this week vs last week"
- [ ] Without AI: rankings calculated from raw metrics, no narrative or insights

**Implementation Notes**

- Data source: event audit logs and activity tracking already captured by core platform
- Rankings computed nightly (scheduled job)
- No AI dependency -- pure metric calculation with optional AI narrative (ties into 3.15)
- Gamification consideration: badges for milestones (100th package, fastest response)

**Target Version**: v2
**Complexity**: Low

---

### 5.2 Unit Heat Map

**Description**

A visual building map that color-codes units by activity level. High-maintenance units glow warm (red/orange). Quiet units are cool (blue/green). This gives property managers an instant visual understanding of where problems concentrate in the building.

The heat map can be filtered by metric: maintenance requests, incidents, packages, complaints, or a composite score. Click any unit to drill into its full history.

**User Story**

As a property manager, I want to see a visual map of my building where problem units stand out so that I can focus my attention where it matters most.

**Acceptance Criteria**

- [ ] Visual building layout with units displayed as a grid or floor plan
- [ ] Color coding: green (no issues) through yellow (moderate) to red (high activity)
- [ ] Filterable by: maintenance requests, incidents, complaints, packages, composite
- [ ] Time range selector: last 7 days, 30 days, 90 days, 12 months
- [ ] Click any unit to open its unit file with full history
- [ ] Floor-by-floor view for tall buildings
- [ ] Auto-generated from unit registry (no manual building layout required)
- [ ] Export as image for reports

**Implementation Notes**

- Default layout: auto-generated grid based on unit numbers and floor assignments
- Optional: property admin can upload a floor plan image and pin units to coordinates
- Metric calculation: count of events/requests per unit over selected time range
- Color scale: configurable gradient with adjustable thresholds
- No AI dependency

**Target Version**: v2
**Complexity**: Medium

---

### 5.3 Trend Prediction

**Description**

Using historical data patterns, the system projects future trends for key metrics: maintenance volume, package deliveries, incident rates, amenity utilization. Predictions are displayed as dashed lines extending beyond the current data on charts, with confidence intervals shown as shaded bands.

Property managers can use these projections to plan staffing, budget for maintenance, and anticipate seasonal changes.

**User Story**

As a property manager planning next quarter's budget, I want to see predicted maintenance costs based on historical trends so that I can budget accurately instead of guessing.

**Acceptance Criteria**

- [ ] Predictions available for: maintenance volume, package volume, incident rate, amenity bookings, costs
- [ ] Minimum 90 days of historical data required before predictions activate
- [ ] Forecast periods: 30, 60, and 90 days forward
- [ ] Confidence intervals displayed (wider band = less certainty)
- [ ] Seasonal patterns detected and factored in (winter maintenance spike, summer amenity surge)
- [ ] Prediction accuracy tracked: predicted vs actual, displayed on the chart
- [ ] Can be toggled on/off per chart
- [ ] Without AI: charts show historical data only, no projections

**Implementation Notes**

- Uses Sonnet model for analysis (~$0.01 per forecast)
- Scheduled: regenerated weekly or on demand
- Input: historical time-series data (minimum 90 days)
- Output: projected values with upper/lower confidence bounds
- Visualization: dashed line with shaded confidence band on existing chart components

**Target Version**: v2
**Complexity**: High

---

### 5.4 Vendor Scorecard

**Description**

Every vendor working with the property receives a performance scorecard based on objective data: response time, completion rate, cost accuracy (quoted vs actual), insurance compliance status, and building manager satisfaction ratings.

This gives property managers hard data for vendor selection, contract renewal, and performance conversations.

**User Story**

As a property manager renewing vendor contracts, I want to see a performance scorecard for each vendor so that I can make data-driven decisions about which vendors to keep and which to replace.

**Acceptance Criteria**

- [ ] Scorecard for every vendor with 3+ completed work orders
- [ ] Metrics: average response time, completion rate, cost accuracy (quoted vs actual), insurance compliance, satisfaction rating
- [ ] Composite score: 0-100 based on weighted metrics
- [ ] Trend over time: is this vendor improving or declining?
- [ ] Comparison view: rank all vendors in a category (e.g., all plumbers)
- [ ] Export as PDF for contract negotiations
- [ ] Vendor can view their own scorecard (configurable by Property Admin)
- [ ] Without AI: raw metrics displayed without composite score or trend narrative

**Implementation Notes**

- Data source: maintenance request records, vendor assignments, completion timestamps, cost records
- Composite score: configurable weights per metric (Property Admin sets importance)
- Satisfaction rating: optional post-completion survey (1-5 stars) from maintenance staff
- Scorecard regenerated weekly

**Target Version**: v2
**Complexity**: Medium

---

### 5.5 Building Health Score

**Description**

A composite score from 0 to 100 that represents the overall operational health of a building. The score is calculated from: maintenance backlog, security incident rate, amenity utilization, resident satisfaction, equipment condition, vendor compliance, and staff performance.

The score appears on the management dashboard and portfolio view. Trends are tracked daily. Contributing factors are visible on click.

**User Story**

As a regional manager overseeing multiple buildings, I want a single health score per building so that I can quickly identify which properties need attention.

**Acceptance Criteria**

- [ ] Composite score: 0-100 with color coding (0-40 red, 41-70 yellow, 71-100 green)
- [ ] Contributing factors visible on click/expand
- [ ] Factors include: maintenance backlog weight, security incident rate, amenity utilization, resident satisfaction, equipment condition, vendor compliance
- [ ] Daily score calculation with 30-day trend line
- [ ] Score weights configurable by Property Admin (what matters most at this building?)
- [ ] Historical comparison: "Health score improved from 62 to 78 over the last quarter"
- [ ] Without AI: score is a simple weighted average of raw metrics, no narrative

**Implementation Notes**

- Uses Sonnet model for factor analysis and narrative (~$0.005 per daily run)
- Scheduled daily (3:00 AM) per property
- Input: cross-module metrics
- Output: composite score + factor breakdown + trend + narrative
- Architecture: ties into AI Dashboard capabilities (PRD 19, Section 4.10, Feature 84)

**Target Version**: v2
**Complexity**: Medium

---

### 5.6 Comparative Analytics

**Description**

Property managers and management companies can compare metrics between buildings, between time periods, or between buildings and anonymized industry benchmarks. "Our maintenance response time is 14 hours -- the industry average for buildings our size is 18 hours."

Benchmarks are derived from anonymized, aggregated data across Concierge properties (with explicit opt-in). Properties that do not opt in can still compare against their own historical data.

**User Story**

As a management company executive, I want to compare maintenance metrics across my 12 buildings and against industry benchmarks so that I can identify best practices and underperformers.

**Acceptance Criteria**

- [ ] Compare any metric between: two properties, two time periods, or property vs benchmark
- [ ] Benchmark data: anonymized aggregate from opted-in Concierge properties
- [ ] Opt-in consent: Property Admin explicitly enables benchmark data sharing
- [ ] Comparison charts: side-by-side bar charts, overlay line charts, delta tables
- [ ] Metrics available for comparison: all standard report metrics
- [ ] Export comparison reports as PDF/Excel
- [ ] Without benchmarks: comparison limited to own properties and own historical data

**Implementation Notes**

- Benchmark aggregation: scheduled monthly from all opted-in properties
- Data anonymization: property identifiers stripped, only category-level aggregates retained
- Segmentation: benchmarks segmented by building size (50-100, 100-250, 250-500, 500+ units)
- Storage: anonymized benchmark data in a separate, non-tenant-scoped table

**Target Version**: v3
**Complexity**: High

---

### 5.7 Export as Presentation

**Description**

Any report, chart, or dashboard view can be exported as a presentation-ready format. Not just raw data exports (CSV/Excel) but formatted slides with titles, narrative context, and properly styled charts suitable for board meetings, staff training, or management reviews.

**User Story**

As a property manager, I want to export this month's maintenance report as a presentation slide so that I can include it directly in my board meeting deck without recreating it in PowerPoint.

**Acceptance Criteria**

- [ ] Export available on: all report pages, dashboard views, analytics charts
- [ ] Formats: PDF (single page), PowerPoint slide, high-resolution image (PNG)
- [ ] Exported content includes: title, date range, chart/table, narrative summary (if AI-generated)
- [ ] Property branding applied: logo, colors
- [ ] Layout optimized for common presentation aspect ratios (16:9, 4:3)
- [ ] Batch export: select multiple reports to generate a multi-slide deck
- [ ] Without AI: exports include chart and data only, no narrative summary

**Implementation Notes**

- Server-side rendering for consistent output across devices
- PDF generation: Puppeteer or equivalent headless browser rendering
- PPTX generation: library-based (e.g., PptxGenJS) with template system
- Branding: property-specific templates loaded from property configuration
- Ties into Board Presentation Auto-Generator (3.14) for full deck generation

**Target Version**: v2
**Complexity**: Medium

---

## 6. Future Vision (v3+ Concepts)

> These are emerging capabilities and long-term concepts that define where Concierge is headed beyond v2. They are documented here for strategic alignment and early architectural consideration, not as committed features.

---

### 6.1 Emerging Technology Integration

| Concept                     | Description                                                                                                           | Why It Matters                                                                               | Earliest Version |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------- |
| **IoT Sensor Integration**  | Connect to building sensors (temperature, humidity, water flow, air quality) for automated alerts and data collection | Enables truly predictive maintenance based on real sensor data, not just historical patterns | v3               |
| **Smart Lock Integration**  | Integrate with electronic lock systems for remote access management, visitor passes, and delivery access              | Eliminates physical key management for many use cases; enables self-service visitor entry    | v3               |
| **Camera Feed AI Analysis** | Analyze security camera feeds for anomaly detection (tailgating, unauthorized access, crowd formation)                | Enhances security beyond manual monitoring; never used for facial recognition                | v4+              |
| **Energy Management**       | Track and optimize building energy consumption by connecting to smart meters and HVAC systems                         | Reduces operating costs; aligns with sustainability goals; provides board-level ROI metrics  | v4+              |
| **Drone Inspection**        | Process and analyze drone-captured building exterior photos for maintenance assessment                                | Automates exterior inspections that currently require scaffolding or rope access             | v4+              |

### 6.2 Multi-Property Portfolio Evolution

| Concept                           | Description                                                                                     | Why It Matters                                                                          | Earliest Version |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------- |
| **Cross-Property Staff Sharing**  | Manage floating staff who work across multiple buildings with unified scheduling                | Reduces staffing costs; enables specialized staff to serve multiple properties          | v3               |
| **Vendor Network**                | Shared vendor directory across properties with aggregated performance data and volume discounts | Leverages scale for better vendor pricing and broader vendor selection                  | v3               |
| **Centralized Procurement**       | Purchase orders and inventory management across a portfolio of buildings                        | Bulk purchasing, centralized budgeting, and cost tracking across properties             | v3               |
| **Portfolio Financial Dashboard** | Comprehensive financial views across all properties with drill-down capability                  | Gives management companies full financial visibility without logging into each property | v3               |

### 6.3 Predictive Everything

| Concept                          | Description                                                                                             | Why It Matters                                                     | Earliest Version |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------- |
| **Predictive Resident Turnover** | Analyze behavior patterns to predict which residents may not renew their lease                          | Enables proactive retention efforts, reducing costly unit turnover | v3               |
| **Predictive Cost Modeling**     | Forecast operating costs 12-24 months ahead based on equipment age, vendor trends, and historical spend | Transforms annual budgeting from guesswork to data-driven planning | v3               |
| **Incident Prevention Scoring**  | Assign risk scores to conditions (time of day, weather, events) that precede incidents                  | Shifts security from reactive to preventive                        | v3               |
| **Amenity Demand Forecasting**   | Predict amenity usage and automatically adjust availability, staffing, and pricing                      | Optimizes amenity operations and revenue without manual analysis   | v3               |

### 6.4 Resident Experience Evolution

| Concept                    | Description                                                                                  | Why It Matters                                                  | Earliest Version |
| -------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------- |
| **Resident Passport**      | Digital identity card with QR code for building access, package pickup, and amenity check-in | Streamlines every resident-staff interaction to a single scan   | v3               |
| **Community Marketplace**  | Full classified ads and services marketplace between residents                               | Builds community engagement and makes the resident app stickier | v3               |
| **Smart Home Integration** | Connect to in-unit smart devices for maintenance diagnostics and comfort management          | Enables remote troubleshooting and proactive comfort management | v4+              |

---

## 7. Competitive Moat

### 7.1 Why These Innovations Are Hard to Copy

| Moat Type                     | What It Means                                                                                                                                                                                                                                                                | Which Innovations It Protects                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **AI-Native Architecture**    | AI is a service layer in the foundation, not a feature bolted onto a legacy codebase. Retrofitting AI into a 15-year-old platform requires rewriting the core.                                                                                                               | All 15 AI-Native features                                                     |
| **Unified Event Model**       | Our configurable event system makes every AI feature more powerful because it operates on consistent, structured data. Competitors with hardcoded log types cannot feed clean data to AI models.                                                                             | Semantic Search, Anomaly Detection, Predictive Maintenance, Report Builder    |
| **Role-Aware Rendering**      | Every interface is purpose-built per role. Adding this to a platform designed around a single user experience requires redesigning every screen.                                                                                                                             | Role-Aware Everything, Command Palette, Dashboard Widgets                     |
| **Real-Time Foundation**      | WebSocket infrastructure is built into the core, not added as a patch. Real-time collaboration, live dashboards, and instant notifications all depend on this.                                                                                                               | Real-Time Collaboration, Digital Signage, Push Notifications                  |
| **Data Compound Effect**      | Each feature generates data that makes other features smarter. Package OCR feeds delivery analytics. Maintenance tracking feeds predictive maintenance. Incident data feeds anomaly detection. Competitors would need all features running to get the same compound benefit. | All Analytics features, Building Health Score, AI Daily Briefing              |
| **Multi-Tenant from Day One** | Portfolio views, cross-property analytics, and comparative benchmarks require multi-tenancy in the data model. Platforms built for single properties cannot add this without a database migration.                                                                           | Multi-Property Portfolio, Comparative Analytics, Cross-Property Staff Sharing |

### 7.2 Time-to-Replicate Estimates

| Innovation Category      | Time for a Legacy Competitor to Replicate | Why                                                                                                                           |
| ------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **AI-Native Features**   | 18-24 months                              | Requires AI gateway, PII pipeline, cost tracking, graceful degradation -- all foundational work before a single feature ships |
| **Platform Innovation**  | 12-18 months                              | Role-aware rendering and real-time collaboration require architectural changes, not feature additions                         |
| **Analytics Innovation** | 6-12 months                               | Most achievable for competitors, but value depends on clean data from unified event model                                     |
| **Future Vision**        | 24-36 months                              | IoT and sensor integrations require hardware partnerships and new data pipelines                                              |

---

## 8. Prioritization Matrix

### 8.1 Impact vs Effort Grid

Each innovation is scored on two axes:

- **Impact** (1-5): How much value does this deliver to users and the business?
- **Effort** (1-5): How much engineering time and complexity is required?

Higher impact and lower effort items are prioritized first.

| #    | Innovation                        | Impact | Effort | Target | Priority Score |
| ---- | --------------------------------- | ------ | ------ | ------ | -------------- |
|      | **AI-NATIVE FEATURES**            |        |        |        |                |
| 3.1  | AI Daily Briefing                 | 5      | 2      | v1     | 10.0           |
| 3.2  | Semantic Search                   | 5      | 4      | v1     | 6.3            |
| 3.5  | Automated Report Narratives       | 4      | 2      | v1     | 8.0            |
| 3.7  | Multi-Language Auto-Translation   | 4      | 2      | v1     | 8.0            |
| 3.8  | Voice-to-Text Incident Reporting  | 4      | 3      | v1     | 5.3            |
| 3.9  | Smart Anomaly Alerts              | 4      | 3      | v1     | 5.3            |
| 3.10 | AI Cost Analytics Dashboard       | 3      | 1      | v1     | 9.0            |
| 3.11 | Courier Label OCR                 | 4      | 2      | v1     | 8.0            |
| 3.6  | Resident Satisfaction Score       | 4      | 3      | v2     | 5.3            |
| 3.12 | License Plate OCR                 | 3      | 2      | v2     | 4.5            |
| 3.13 | Natural Language Report Builder   | 5      | 4      | v2     | 6.3            |
| 3.14 | Board Presentation Auto-Generator | 4      | 5      | v2     | 3.2            |
| 3.15 | Staff Performance AI Scoring      | 3      | 4      | v2     | 2.3            |
| 3.3  | Smart Guard Scheduling            | 4      | 4      | v2     | 4.0            |
| 3.4  | Predictive Maintenance            | 5      | 5      | v2     | 5.0            |
|      | **PLATFORM INNOVATION**           |        |        |        |                |
| 4.1  | Role-Aware Everything             | 5      | 4      | v1     | 6.3            |
| 4.2  | Command Palette (Cmd+K)           | 4      | 2      | v1     | 8.0            |
| 4.3  | Real-Time Collaboration           | 5      | 4      | v1     | 6.3            |
| 4.4  | Dark Mode                         | 3      | 2      | v1     | 4.5            |
| 4.9  | Customizable Dashboard Widgets    | 4      | 3      | v1     | 5.3            |
| 4.7  | Resident Mobile App with Push     | 5      | 5      | v1     | 5.0            |
| 4.5  | Offline-First Mobile              | 4      | 5      | v1     | 3.2            |
| 4.6  | Digital Signage Integration       | 3      | 3      | v2     | 3.0            |
| 4.8  | Webhook and API Ecosystem         | 4      | 4      | v2     | 4.0            |
| 4.10 | Multi-Property Portfolio View     | 5      | 4      | v2     | 6.3            |
|      | **ANALYTICS INNOVATION**          |        |        |        |                |
| 5.1  | Staff Leaderboard                 | 3      | 1      | v2     | 9.0            |
| 5.2  | Unit Heat Map                     | 4      | 2      | v2     | 8.0            |
| 5.4  | Vendor Scorecard                  | 4      | 2      | v2     | 8.0            |
| 5.5  | Building Health Score             | 4      | 3      | v2     | 5.3            |
| 5.7  | Export as Presentation            | 3      | 3      | v2     | 3.0            |
| 5.3  | Trend Prediction                  | 4      | 4      | v2     | 4.0            |
| 5.6  | Comparative Analytics             | 4      | 4      | v3     | 4.0            |

> **Priority Score formula**: Impact^2 / Effort. Higher is better. This naturally favors high-impact, low-effort items.

### 8.2 Version Roadmap Summary

**v1 — Foundation (14 innovations)**

| Category      | Innovations                                                                                                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI-Native (8) | AI Daily Briefing, Semantic Search, Automated Report Narratives, Multi-Language Auto-Translation, Voice-to-Text Incident Reporting, Smart Anomaly Alerts, AI Cost Analytics Dashboard, Courier Label OCR |
| Platform (6)  | Role-Aware Everything, Command Palette, Real-Time Collaboration, Dark Mode, Customizable Dashboard Widgets, Resident Mobile App with Push, Offline-First Mobile                                          |

**v2 — Differentiation (15 innovations)**

| Category      | Innovations                                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AI-Native (7) | Smart Guard Scheduling, Predictive Maintenance, Resident Satisfaction Score, License Plate OCR, Natural Language Report Builder, Board Presentation Auto-Generator, Staff Performance AI Scoring |
| Platform (3)  | Digital Signage Integration, Webhook and API Ecosystem, Multi-Property Portfolio View                                                                                                            |
| Analytics (6) | Staff Leaderboard, Unit Heat Map, Trend Prediction, Vendor Scorecard, Building Health Score, Export as Presentation                                                                              |

**v3 — Market Leadership (3+ innovations)**

| Category      | Innovations                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Analytics (1) | Comparative Analytics                                                                                                                                         |
| Future Vision | IoT Integration, Smart Lock Integration, Cross-Property Staff Sharing, Vendor Network, Predictive Resident Turnover, Resident Passport, Community Marketplace |

### 8.3 Key Dependencies

```
AI Daily Briefing ──────────→ requires: Unified Event Model (v1), AI Framework (v1)
Semantic Search ────────────→ requires: Vector index infrastructure, AI Framework (v1)
Smart Guard Scheduling ─────→ requires: Staff Management module, Weather API integration
Predictive Maintenance ─────→ requires: Equipment Tracking module (v2), 6+ months of data
Multi-Property Portfolio ───→ requires: Multi-tenancy architecture (v1), 2+ properties
Comparative Analytics ──────→ requires: Multi-Property Portfolio (v2), benchmark opt-in
Building Health Score ──────→ requires: All core modules operational, cross-module data
Board Presentation ─────────→ requires: Report Narratives (v1), Chart rendering, Export engine
```

---

---

## 9. Completeness Checklist

### Implementation Note

This PRD is a **feature catalog and roadmap**, not a buildable specification. Each innovation listed here is either:

1. **Fully specified** in another PRD (cross-referenced below), or
2. **Deferred** to a future PRD that will be written before development begins.

No developer builds from this document alone. This document serves as the master index of planned innovations and their dependencies.

### Cross-Reference to Buildable PRDs

| Innovation                      | Fully Specified In                                  | Status                    |
| ------------------------------- | --------------------------------------------------- | ------------------------- |
| AI Daily Briefing               | PRD 14 (Dashboard), PRD 19 (AI Framework)           | v1 -- Buildable           |
| Semantic Search                 | PRD 15 (Search & Navigation), PRD 19 (AI Framework) | v1 -- Buildable           |
| Package OCR                     | PRD 04 (Package Management), PRD 19 (AI Framework)  | v1 -- Buildable           |
| Incident Auto-Categorization    | PRD 03 (Security Console), PRD 19 (AI Framework)    | v1 -- Buildable           |
| Smart Notification Timing       | PRD 09 (Communication), PRD 19 (AI Framework)       | v1 -- Buildable           |
| Report Narratives               | PRD 10 (Reports & Analytics), PRD 19 (AI Framework) | v1 -- Buildable           |
| Role-Aware Everything           | PRD 02 (Roles & Permissions), PRD 14 (Dashboard)    | v1 -- Buildable           |
| Command Palette                 | PRD 15 (Search & Navigation)                        | v1 -- Buildable           |
| Customizable Dashboard Widgets  | PRD 14 (Dashboard)                                  | v1 -- Buildable           |
| Real-Time Collaboration         | PRD 01 (Architecture -- WebSocket)                  | v1 -- Buildable           |
| Dark Mode                       | PRD 17 (Mobile & Responsive)                        | v1 -- Buildable           |
| Smart Guard Scheduling          | Future PRD required                                 | v2 -- Not yet specified   |
| Predictive Maintenance          | Future PRD required                                 | v2 -- Not yet specified   |
| License Plate OCR               | PRD 13 (Parking), PRD 19 (AI Framework)             | v2 -- Buildable           |
| Natural Language Report Builder | PRD 10 (Reports), PRD 19 (AI Framework)             | v2 -- Partially specified |
| Building Health Score           | PRD 14 (Dashboard), PRD 19 (AI Framework)           | v2 -- Partially specified |
| Digital Signage Integration     | Future PRD required                                 | v2 -- Not yet specified   |
| Webhook and API Ecosystem       | PRD 26 (Developer Portal & API)                     | v2 -- Buildable           |
| Multi-Property Portfolio View   | PRD 01 (Architecture)                               | v2 -- Partially specified |
| Comparative Analytics           | Future PRD required                                 | v3 -- Not yet specified   |

### Edge Cases

Edge cases for each innovation are defined in the PRD where that innovation is fully specified. Innovations that are not yet fully specified (marked "Future PRD required" above) will have edge cases defined when their PRD is written.

---

_Last updated: 2026-03-17_
_Total innovations documented: 32 (15 AI-Native + 10 Platform + 7 Analytics)_
_Target line count: 750+ lines_
