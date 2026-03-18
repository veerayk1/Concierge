# 19 — AI Framework

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 02-Roles and Permissions, all module PRDs

---

## 1. Overview

Concierge is an **AI-native platform** -- intelligence is embedded at every interaction point, not bolted on as an afterthought. From grammar correction on security reports to predictive maintenance analytics, AI enhances every module while remaining invisible to the user.

### Key Facts

| Aspect                    | Detail                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Providers**             | Claude API (Anthropic) + OpenAI API, with adapter pattern for future providers                           |
| **Total AI capabilities** | 105 features across 14 modules + 9 infrastructure capabilities                                           |
| **Control**               | Super Admin controls everything: per-feature toggles, provider selection, model selection, budget limits |
| **Cost target**           | ~$15-25/month for a typical 500-unit building                                                            |
| **Privacy**               | PII stripped before API calls. No training on user data. 24-hour response cache max.                     |
| **Graceful degradation**  | Every AI feature has a manual fallback. The platform works without AI -- it just works better with it.   |

---

## 2. AI Philosophy

### 2.1 Principles

| #   | Principle                       | What It Means                                                                                                                                                                                 |
| --- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Invisible intelligence**      | AI should feel like the platform is just smart, not that an AI is doing things. No "AI-powered" badges. No chatbot interfaces. Just better defaults, smarter suggestions, and cleaner output. |
| 2   | **Graceful degradation**        | Every AI feature has a non-AI fallback path. If the API is down, the user can still do everything manually. AI enhances -- it never gates.                                                    |
| 3   | **Human confirms, AI suggests** | AI never makes autonomous decisions. It suggests categories, drafts text, flags anomalies -- but a human always clicks the final button.                                                      |
| 4   | **Privacy first**               | PII is detected and stripped before any API call. No resident names, unit numbers, or personal data leaves the platform. Tokens are anonymized.                                               |
| 5   | **Cost-conscious routing**      | Use the cheapest model that achieves the quality bar. Haiku for simple tasks ($0.001/call). Sonnet for medium complexity ($0.005-0.01). Opus only when analytical depth demands it.           |
| 6   | **Measurable value**            | Every AI feature tracks acceptance rate, user satisfaction, and cost. Features below 60% acceptance rate are flagged for review.                                                              |

### 2.2 What AI Is NOT in Concierge

- NOT a chatbot or conversational assistant
- NOT a decision-maker (always advisory)
- NOT required for any workflow to function
- NOT a replacement for human judgment on security or safety matters
- NOT processing biometric data (face recognition, voice identification)

---

## 3. Provider Strategy

### 3.1 Dual-Provider Architecture

| Provider               | Models Available                                                                           | Best For                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **Anthropic (Claude)** | Haiku (fast/cheap), Sonnet (balanced), Opus (complex analysis)                             | Text generation, analysis, summarization, categorization |
| **OpenAI**             | GPT-4o-mini (fast/cheap), GPT-4o (balanced), Whisper (speech-to-text), Embeddings (search) | Voice transcription, semantic search, image analysis     |

### 3.2 Provider Selection Logic

```
For each AI feature:
  1. Super Admin can set: "Claude", "OpenAI", or "Auto"
  2. If "Auto":
     - Text tasks → Claude (Haiku/Sonnet/Opus based on complexity)
     - Voice tasks → OpenAI Whisper
     - Search/embeddings → OpenAI Embeddings
     - Image analysis → Either (cost-compare)
  3. Health check: If primary provider is down, auto-fallback to secondary
  4. Cost check: If monthly budget exceeded, downgrade model tier or pause non-essential features
```

### 3.3 Configuration

| Setting                      | Location                                         | Who Can Configure             |
| ---------------------------- | ------------------------------------------------ | ----------------------------- |
| API keys                     | Settings > AI Configuration > Provider Keys      | Super Admin only              |
| Default provider per feature | Settings > AI Configuration > Feature Defaults   | Super Admin                   |
| Per-property overrides       | Settings > AI Configuration > Property Overrides | Property Admin (if permitted) |
| Model selection per feature  | Settings > AI Configuration > Model Selection    | Super Admin                   |
| Budget limits                | Settings > AI Configuration > Budget             | Super Admin                   |

### 3.4 Future Provider Support

The adapter pattern allows adding new providers without code changes to individual features:

| Future Provider         | Timeline | Use Case                                     |
| ----------------------- | -------- | -------------------------------------------- |
| Google Gemini           | v2       | Additional fallback, multimodal              |
| Mistral                 | v3       | EU data residency requirements               |
| Local/on-premise models | v3+      | Properties requiring zero external API calls |

---

## 4. AI Feature Catalog

### 4.1 Security Console (12 capabilities)

| ID  | Name                               | Description                                                                                                              | Default Model      | Est. Cost | Trigger                                            | Input                                               | Output                                                    | Graceful Degradation                           | Default  |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------- | -------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- | -------- |
| 1   | Report Grammar and Tone Correction | Cleans up spelling, grammar, and tone in security reports to ensure professional documentation                           | Haiku              | $0.001    | On submit                                          | Report text                                         | Corrected text with changes highlighted                   | Manual proofreading                            | Enabled  |
| 2   | Incident Category Auto-Suggestion  | Suggests the most appropriate incident category based on the description as the user types                               | Haiku              | $0.001    | On typing (debounced 500ms)                        | Description text                                    | Top 3 category suggestions with confidence scores         | Manual category selection from dropdown        | Enabled  |
| 3   | Incident Severity Scoring          | Analyzes incident description and assigns a severity level with justification                                            | Haiku              | $0.001    | On submit                                          | Description + category + time of day                | Severity (Low/Medium/High/Critical) + reasoning           | Manual severity selection                      | Enabled  |
| 4   | Pattern Detection                  | Identifies recurring patterns across incidents (repeat offenders, time-based trends, location clusters)                  | Sonnet             | $0.01     | Daily scheduled (2:00 AM)                          | All incidents from past 30 days                     | Pattern report with visualizations                        | No automated pattern report; manual review     | Enabled  |
| 5   | Anomaly Detection                  | Flags unusual events in real-time by comparing against historical norms for the property                                 | Haiku              | $0.002    | On new event creation                              | Current event + 90-day historical data              | Alert (if anomalous) or pass                              | No real-time anomaly alerts                    | Enabled  |
| 6   | Shift Report Auto-Summarization    | Generates a narrative summary of all events during a completed shift                                                     | Sonnet             | $0.005    | End of shift (manual trigger or auto at shift end) | All shift entries + event details                   | Summary paragraph (200-400 words)                         | Guard writes manual summary                    | Enabled  |
| 7   | Guard Performance Scoring          | Analyzes guard activity patterns to generate performance metrics (response time, report quality, patrol coverage)        | Sonnet             | $0.01     | Weekly scheduled (Monday 6:00 AM)                  | All guard activity for the week                     | Performance scorecard per guard                           | No automated scoring; supervisor manual review | Disabled |
| 8   | Predictive Risk Assessment         | Forecasts risk levels for the upcoming period based on historical data, weather, scheduled events, and seasonal patterns | Sonnet             | $0.01     | Daily scheduled (5:00 AM)                          | Historical incidents + weather API + event calendar | Risk forecast with recommended staffing levels            | No risk forecast; standard staffing            | Disabled |
| 9   | Voice-to-Text Reporting            | Converts spoken security reports into structured, formatted text entries                                                 | Whisper + Sonnet   | $0.02     | On demand (microphone button)                      | Audio recording (up to 5 minutes)                   | Structured report with fields auto-populated              | Type report manually                           | Disabled |
| 10  | Photo Analysis                     | Analyzes uploaded photos to assess damage, identify safety hazards, or document conditions                               | Vision (GPT-4o)    | $0.01     | On photo upload                                    | Photo + context description                         | Damage assessment, hazard identification, condition notes | Manual description by guard                    | Disabled |
| 11  | Similar Incident Linking           | Finds and links related past incidents when a new one is filed, surfacing relevant history                               | Embeddings + Haiku | $0.002    | On submit                                          | Current incident description                        | Top 5 similar past incidents with relevance scores        | No automatic linking; manual search            | Enabled  |
| 12  | Auto-Escalation Recommendation     | Analyzes incident content and recommends whether escalation to supervisor/management is warranted                        | Haiku              | $0.001    | On submit                                          | Incident description + severity + category          | Escalate yes/no with reasoning                            | Manual escalation decision                     | Enabled  |

### 4.2 Package Management (10 capabilities)

| ID  | Name                               | Description                                                                                          | Default Model  | Est. Cost | Trigger                                              | Input                                       | Output                                                   | Graceful Degradation                            | Default  |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------- | --------- | ---------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------- | -------- |
| 13  | Courier Logo Auto-Detection        | Identifies the courier from package photos or tracking numbers and displays the appropriate logo     | Vision + Haiku | $0.005    | On package intake                                    | Photo or tracking number                    | Courier name + logo assignment                           | Manual courier selection from dropdown          | Enabled  |
| 14  | Tracking Number Extraction (OCR)   | Extracts tracking numbers from package label photos using optical character recognition              | Vision         | $0.005    | On photo upload                                      | Package label photo                         | Extracted tracking number + courier                      | Manual tracking number entry                    | Enabled  |
| 15  | Smart Unit Matching                | Suggests the correct unit and resident when partial or ambiguous delivery information is provided    | Haiku          | $0.001    | On typing recipient name                             | Partial name or unit + resident directory   | Top 3 resident/unit matches                              | Manual lookup in resident directory             | Enabled  |
| 16  | Package Volume Forecasting         | Predicts daily package volumes based on historical patterns, holidays, and sale events               | Sonnet         | $0.005    | Daily scheduled (6:00 AM)                            | 90-day package history + calendar           | Forecast for next 7 days with confidence                 | No volume forecast; reactive staffing           | Disabled |
| 17  | Unclaimed Package Reminders        | Generates and sends personalized reminder messages for packages unclaimed beyond threshold           | Haiku          | $0.001    | Scheduled (configurable: 24h, 48h, 72h after intake) | Package details + resident contact prefs    | Personalized reminder message                            | Generic template-based reminder                 | Enabled  |
| 18  | Package Description Generation     | Auto-generates a concise package description from photos (size, condition, sender visible)           | Vision         | $0.005    | On photo upload during intake                        | Package photo                               | Description text (size, type, condition, visible sender) | Manual description entry                        | Disabled |
| 19  | Delivery Pattern Analysis          | Identifies peak delivery times, top couriers, and volume trends per unit/building                    | Sonnet         | $0.01     | Weekly scheduled (Monday 3:00 AM)                    | All package data for past 30 days           | Analytics report with charts                             | No automated analysis; manual report            | Enabled  |
| 20  | Damaged Package Detection          | Flags potentially damaged packages from intake photos                                                | Vision         | $0.01     | On photo upload                                      | Package photo                               | Damage flag (yes/no) + description + recommendation      | Manual visual inspection                        | Disabled |
| 21  | Storage Location Suggestion        | Suggests optimal storage location based on package size, type, and current storage capacity          | Haiku          | $0.001    | On package intake                                    | Package size/type + current storage map     | Suggested storage location                               | Manual storage selection                        | Enabled  |
| 22  | Resident Notification Optimization | Determines the best notification channel and time for each resident based on their response patterns | Haiku          | $0.001    | On package intake                                    | Resident notification history + preferences | Optimal channel + time recommendation                    | Default notification channel and immediate send | Disabled |

### 4.3 Maintenance (12 capabilities)

| ID  | Name                                 | Description                                                                                                           | Default Model      | Est. Cost | Trigger                              | Input                                              | Output                                                 | Graceful Degradation                      | Default  |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------ | --------- | ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------- | -------- |
| 23  | Request Category Auto-Classification | Classifies maintenance requests into the correct category based on description text                                   | Haiku              | $0.001    | On submit                            | Request description                                | Category + sub-category suggestion                     | Manual category selection                 | Enabled  |
| 24  | Priority Scoring                     | Assesses urgency and priority of maintenance requests based on description, location, and historical data             | Haiku              | $0.001    | On submit                            | Description + unit + category + history            | Priority score (1-5) + reasoning                       | Manual priority assignment                | Enabled  |
| 25  | Duplicate Detection                  | Identifies potential duplicate or related requests before submission                                                  | Embeddings + Haiku | $0.002    | On submit (pre-save)                 | New request description + open requests            | Potential duplicates with similarity scores            | No duplicate detection; manual review     | Enabled  |
| 26  | Vendor Auto-Suggestion               | Recommends the most appropriate vendor based on request category, vendor ratings, availability, and compliance status | Sonnet             | $0.005    | On category assignment               | Category + vendor directory + compliance data      | Top 3 vendor recommendations with reasoning            | Manual vendor selection                   | Enabled  |
| 27  | Time-to-Resolution Estimation        | Predicts how long a request will take to resolve based on type, complexity, and historical resolution data            | Haiku              | $0.001    | On submit                            | Request details + historical resolution data       | Estimated hours/days + confidence level                | No estimate shown                         | Enabled  |
| 28  | Work Order Generation                | Auto-generates a formatted work order document from the request details                                               | Sonnet             | $0.005    | On demand (button click)             | Request details + vendor + unit info               | Formatted work order (PDF-ready)                       | Manual work order creation                | Enabled  |
| 29  | Photo-Based Damage Assessment        | Analyzes maintenance photos to estimate damage severity and suggest repair approaches                                 | Vision             | $0.01     | On photo upload                      | Photo(s) + request description                     | Damage assessment + repair suggestions                 | Manual assessment by maintenance staff    | Disabled |
| 30  | Recurring Issue Detection            | Identifies units or systems with recurring maintenance issues and recommends preventive action                        | Sonnet             | $0.01     | Weekly scheduled (Tuesday 3:00 AM)   | All requests for past 90 days                      | Recurring issue report + preventive recommendations    | No automated detection; manual review     | Enabled  |
| 31  | Cost Estimation                      | Estimates repair costs based on issue type, historical data, and vendor pricing                                       | Sonnet             | $0.005    | On demand                            | Request details + historical cost data             | Cost estimate range                                    | No cost estimate                          | Disabled |
| 32  | Response Template Generation         | Generates professional response templates for resident communication about their request status                       | Haiku              | $0.001    | On status change                     | Request details + new status                       | Draft response message                                 | Generic status update template            | Enabled  |
| 33  | Equipment Failure Prediction         | Analyzes equipment maintenance history to predict upcoming failures and recommend preventive maintenance              | Sonnet             | $0.01     | Weekly scheduled (Wednesday 3:00 AM) | Equipment records + maintenance history + age data | Failure risk scores + recommended maintenance schedule | No prediction; scheduled maintenance only | Disabled |
| 34  | Request Description Enhancement      | Improves resident-submitted request descriptions for clarity and adds relevant technical details                      | Haiku              | $0.001    | On submit                            | Raw request description                            | Enhanced description with technical context            | Original description used as-is           | Enabled  |

### 4.4 Amenity Booking (8 capabilities)

| ID  | Name                              | Description                                                                                              | Default Model | Est. Cost | Trigger                           | Input                                           | Output                                            | Graceful Degradation                   | Default  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------- | --------- | --------------------------------- | ----------------------------------------------- | ------------------------------------------------- | -------------------------------------- | -------- |
| 35  | Smart Scheduling Suggestions      | Suggests optimal booking times based on availability, user preferences, and historical usage patterns    | Haiku         | $0.001    | On booking form open              | User booking history + availability calendar    | Top 3 time slot suggestions                       | Manual time selection from calendar    | Enabled  |
| 36  | Conflict Detection and Resolution | Identifies scheduling conflicts and suggests alternative times when a requested slot is unavailable      | Haiku         | $0.001    | On time selection                 | Requested time + availability + waitlist        | Alternative time suggestions                      | Standard "slot unavailable" message    | Enabled  |
| 37  | Usage Pattern Analytics           | Analyzes amenity usage to identify peak times, underutilized periods, and seasonal trends                | Sonnet        | $0.01     | Weekly scheduled (Monday 4:00 AM) | All booking data for past 90 days               | Usage analytics report with heatmaps              | No automated analytics; manual report  | Enabled  |
| 38  | Dynamic Pricing Recommendations   | Suggests pricing adjustments based on demand patterns (peak/off-peak) to optimize utilization            | Sonnet        | $0.005    | Monthly scheduled                 | Booking data + revenue data + utilization rates | Pricing recommendations per amenity per time slot | Static pricing maintained              | Disabled |
| 39  | Booking Description Generation    | Auto-generates event descriptions for amenity bookings based on type and past similar bookings           | Haiku         | $0.001    | On booking type selection         | Booking type + amenity + past similar bookings  | Draft event description                           | Manual description entry               | Disabled |
| 40  | No-Show Prediction                | Predicts likelihood of no-show based on resident booking history and sends preemptive reminders          | Haiku         | $0.001    | 24 hours before booking           | Resident booking history + no-show rate         | No-show probability + reminder if high risk       | Standard reminder sent to all bookings | Disabled |
| 41  | Capacity Optimization             | Recommends optimal capacity limits per amenity based on usage data and resident satisfaction             | Sonnet        | $0.005    | Monthly scheduled                 | Usage data + feedback + incident reports        | Capacity recommendations per amenity              | Static capacity limits maintained      | Disabled |
| 42  | Amenity Condition Monitoring      | Analyzes maintenance logs and incident reports to flag amenities that may need attention before bookings | Haiku         | $0.001    | On booking confirmation           | Amenity maintenance history + recent incidents  | Condition alert (if issues found) or pass         | No pre-booking condition check         | Enabled  |

### 4.5 Communication (10 capabilities)

| ID  | Name                            | Description                                                                                  | Default Model | Est. Cost | Trigger                        | Input                                   | Output                                             | Graceful Degradation                      | Default  |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------- | ------------- | --------- | ------------------------------ | --------------------------------------- | -------------------------------------------------- | ----------------------------------------- | -------- |
| 43  | Announcement Draft Generation   | Generates a professional announcement draft from a brief topic description                   | Sonnet        | $0.005    | On demand (button click)       | Topic + target audience + urgency level | Full announcement draft with subject line          | Manual writing from scratch               | Enabled  |
| 44  | Multi-Language Translation      | Translates announcements into multiple languages based on building demographics              | Sonnet        | $0.005    | On demand (per language)       | Announcement text + target language     | Translated text                                    | Single-language announcements only        | Disabled |
| 45  | Tone and Readability Adjustment | Adjusts announcement tone (formal/casual) and ensures readability for diverse audiences      | Haiku         | $0.001    | On submit (pre-send)           | Announcement text + target audience     | Adjusted text with readability score               | Original text used as-is                  | Enabled  |
| 46  | Subject Line Optimization       | Generates multiple subject line options optimized for open rates                             | Haiku         | $0.001    | On subject line field focus    | Announcement body + type                | 3 subject line options                             | Manual subject line entry                 | Enabled  |
| 47  | Audience Targeting Suggestion   | Suggests the most relevant audience segments for an announcement based on content analysis   | Haiku         | $0.001    | On content entry               | Announcement content                    | Suggested audience segments (roles, floors, units) | Manual audience selection                 | Enabled  |
| 48  | Optimal Send Time               | Recommends the best time to send based on historical open rates and engagement patterns      | Haiku         | $0.001    | On schedule step               | Historical engagement data + audience   | Optimal send time recommendation                   | Immediate send or manual time selection   | Disabled |
| 49  | Content Summarization           | Creates a short summary version for push notifications from longer announcement content      | Haiku         | $0.001    | On submit (if push enabled)    | Full announcement text                  | 160-character push notification summary            | Manual summary entry or truncation        | Enabled  |
| 50  | Emergency Template Selection    | Identifies the emergency type and pre-fills the appropriate template with relevant details   | Haiku         | $0.001    | On emergency broadcast trigger | Emergency description + type indicators | Pre-filled emergency template                      | Manual template selection from library    | Enabled  |
| 51  | Sentiment Analysis of Responses | Analyzes resident responses and feedback to announcements for sentiment trends               | Sonnet        | $0.005    | On response received           | Response text + announcement context    | Sentiment score + trend summary                    | No sentiment analysis; raw responses only | Disabled |
| 52  | Follow-Up Suggestion            | Suggests whether a follow-up announcement is needed based on engagement metrics and feedback | Haiku         | $0.001    | 48 hours after send            | Engagement metrics + feedback           | Follow-up recommendation + draft                   | No follow-up suggestion                   | Disabled |

### 4.6 Reports (8 capabilities)

| ID  | Name                            | Description                                                                                                            | Default Model | Est. Cost | Trigger                                      | Input                                   | Output                                                    | Graceful Degradation                   | Default  |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------- | --------- | -------------------------------------------- | --------------------------------------- | --------------------------------------------------------- | -------------------------------------- | -------- |
| 53  | Natural Language Report Builder | Generates reports from natural language queries (e.g., "Show me all maintenance requests from last month by category") | Sonnet        | $0.01     | On demand (search bar in Reports)            | Natural language query + available data | Structured report with filters applied                    | Manual filter and column selection     | Enabled  |
| 54  | Executive Summary Generation    | Creates a narrative executive summary from any generated report                                                        | Sonnet        | $0.005    | On demand (button on report view)            | Report data + metrics                   | 1-page executive summary                                  | No summary; raw report only            | Enabled  |
| 55  | Trend Identification            | Identifies significant trends and anomalies across report data and highlights them                                     | Sonnet        | $0.01     | On report generation                         | Report dataset + historical comparison  | Trend callouts with explanations                          | No trend highlighting                  | Enabled  |
| 56  | Comparative Analysis            | Compares current period against previous periods and highlights significant changes                                    | Sonnet        | $0.005    | On report generation (if comparison enabled) | Current + previous period data          | Comparison table with change indicators                   | Manual period comparison               | Enabled  |
| 57  | Report Scheduling Optimization  | Suggests optimal report generation schedules based on data update patterns and recipient preferences                   | Haiku         | $0.001    | On schedule creation                         | Report type + data refresh frequency    | Schedule recommendation                                   | Manual schedule selection              | Disabled |
| 58  | Data Quality Alerts             | Flags potential data quality issues in reports (missing data, outliers, inconsistencies)                               | Haiku         | $0.002    | On report generation                         | Report dataset                          | Data quality warnings with affected rows                  | No data quality checks                 | Enabled  |
| 59  | Predictive Forecasting          | Adds forecast projections to reports based on historical trends                                                        | Sonnet        | $0.01     | On demand (toggle on report)                 | Historical data (min 90 days)           | Forecast for next 30/60/90 days with confidence intervals | No forecasting; historical data only   | Disabled |
| 60  | Chart Type Recommendation       | Suggests the most effective visualization type for the data being displayed                                            | Haiku         | $0.001    | On report creation                           | Data schema + data sample               | Recommended chart type + configuration                    | Default chart type per report template | Enabled  |

### 4.7 Training / LMS (7 capabilities)

| ID  | Name                         | Description                                                                                         | Default Model | Est. Cost | Trigger                             | Input                                               | Output                                             | Graceful Degradation                     | Default  |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------- | ------------- | --------- | ----------------------------------- | --------------------------------------------------- | -------------------------------------------------- | ---------------------------------------- | -------- |
| 61  | Quiz Question Generation     | Auto-generates quiz questions from training material content                                        | Sonnet        | $0.005    | On demand (after content upload)    | Training material text                              | 10-20 quiz questions with answers and explanations | Manual quiz question creation            | Enabled  |
| 62  | Course Content Summarization | Creates study summaries and key takeaways from training modules                                     | Haiku         | $0.002    | On course completion (for review)   | Course content                                      | Summary + key points + common mistakes             | No automated summary                     | Enabled  |
| 63  | Knowledge Gap Analysis       | Identifies knowledge gaps across the team based on quiz performance and suggests targeted training  | Sonnet        | $0.01     | Weekly scheduled (Friday 3:00 AM)   | All quiz results + course completions               | Gap analysis report + recommended courses          | No gap analysis; manual review of scores | Enabled  |
| 64  | Adaptive Learning Path       | Adjusts training sequence and difficulty based on individual learner performance                    | Sonnet        | $0.005    | On quiz completion                  | Learner performance history + available courses     | Personalized next-course recommendation            | Linear course progression                | Disabled |
| 65  | Training Content Translation | Translates training materials and quizzes into multiple languages                                   | Sonnet        | $0.005    | On demand (per language per course) | Course content + target language                    | Translated course with localized quiz              | English-only training materials          | Disabled |
| 66  | Scenario Generation          | Creates realistic role-play scenarios for security and concierge training                           | Sonnet        | $0.01     | On demand (scenario builder)        | Role type + training topic + building context       | Interactive scenario with decision points          | Static written scenarios                 | Disabled |
| 67  | Compliance Tracking Alerts   | Monitors training completion deadlines and generates alerts for upcoming and overdue certifications | Haiku         | $0.001    | Daily scheduled (7:00 AM)           | Training assignments + completion dates + deadlines | Alert list for supervisors                         | Manual deadline tracking via calendar    | Enabled  |

### 4.8 Community (6 capabilities)

| ID  | Name                              | Description                                                                                            | Default Model      | Est. Cost | Trigger                               | Input                                 | Output                                            | Graceful Degradation                   | Default  |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------ | --------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------- | -------------------------------------- | -------- |
| 68  | Content Moderation                | Automatically flags inappropriate, offensive, or policy-violating community posts for moderator review | Haiku              | $0.001    | On post submit                        | Post text + images (if any)           | Flag (yes/no) + violation type + severity         | No auto-moderation; manual review only | Enabled  |
| 69  | Classified Ad Category Suggestion | Suggests the most appropriate category for classified ads based on title and description               | Haiku              | $0.001    | On ad creation                        | Ad title + description                | Category suggestion + price range (if applicable) | Manual category selection              | Enabled  |
| 70  | Duplicate Listing Detection       | Identifies potential duplicate classified ads to prevent spam                                          | Embeddings + Haiku | $0.002    | On ad submission                      | New ad content + existing active ads  | Duplicate flag with similar listings              | No duplicate detection                 | Enabled  |
| 71  | Community Sentiment Dashboard     | Aggregates sentiment across community posts, classified ads, and feedback to surface building mood     | Sonnet             | $0.01     | Weekly scheduled (Sunday 10:00 PM)    | All community content for past 7 days | Sentiment report with trending topics             | No sentiment tracking                  | Disabled |
| 72  | Post Enhancement                  | Suggests improvements to community posts for clarity and engagement                                    | Haiku              | $0.001    | On post submit (optional pre-publish) | Post draft text                       | Enhanced text suggestion                          | Original post published as-is          | Disabled |
| 73  | Event Recommendation              | Suggests relevant community events to residents based on their interests and past participation        | Haiku              | $0.001    | On dashboard load (if new events)     | User event history + available events | Personalized event recommendations                | Chronological event list for all       | Disabled |

### 4.9 Parking (5 capabilities)

| ID  | Name                               | Description                                                                                            | Default Model | Est. Cost | Trigger                                   | Input                                            | Output                                           | Graceful Degradation                             | Default  |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------- | --------- | ----------------------------------------- | ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------ | -------- |
| 74  | License Plate OCR                  | Extracts license plate numbers from photos for quick visitor pass creation and violation documentation | Vision        | $0.01     | On photo upload                           | Photo of vehicle/plate                           | Extracted plate number + province/state          | Manual plate number entry                        | Enabled  |
| 75  | Violation Pattern Detection        | Identifies repeat parking violators and escalation-worthy patterns                                     | Haiku         | $0.002    | On violation creation                     | New violation + violation history                | Repeat offender flag + escalation recommendation | No pattern detection; individual violations only | Enabled  |
| 76  | Visitor Parking Demand Forecasting | Predicts visitor parking demand based on day of week, season, and building events                      | Haiku         | $0.002    | Daily scheduled (6:00 AM)                 | Historical visitor parking data + event calendar | Demand forecast for next 7 days                  | No demand forecast                               | Disabled |
| 77  | Permit Expiry Management           | Monitors permit expirations and auto-generates renewal reminders with appropriate lead time            | Haiku         | $0.001    | Daily scheduled (8:00 AM)                 | All active permits + expiry dates                | Renewal reminders sorted by urgency              | Manual expiry tracking                           | Enabled  |
| 78  | Parking Analytics Report           | Generates comprehensive parking utilization reports with peak hours, turnover rates, and revenue       | Sonnet        | $0.01     | Monthly scheduled (1st of month, 4:00 AM) | All parking data for past month                  | Analytics report with visualizations             | Manual report creation                           | Enabled  |

### 4.10 Dashboard (6 capabilities)

| ID  | Name                               | Description                                                                                                 | Default Model | Est. Cost | Trigger                                             | Input                                                 | Output                                              | Graceful Degradation                            | Default  |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------- | --------- | --------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------- | -------- |
| 79  | Daily Briefing Generation          | Creates a personalized morning briefing summarizing overnight events, pending items, and today's priorities | Sonnet        | $0.01     | Daily scheduled (per user's shift start or 8:00 AM) | Overnight events + pending items + calendar + weather | Briefing summary (200-300 words)                    | Static dashboard KPI cards only                 | Enabled  |
| 80  | Smart KPI Selection                | Dynamically selects the most relevant KPI cards based on current building conditions and anomalies          | Haiku         | $0.001    | On dashboard load                                   | All available KPIs + current anomalies                | Top 4-6 KPI cards prioritized by relevance          | Static default KPI set                          | Enabled  |
| 81  | Actionable Insight Cards           | Surfaces proactive insights like "Package volume up 40% vs. last week -- consider extra staff"              | Sonnet        | $0.005    | On dashboard load (cached 1 hour)                   | Cross-module data trends                              | 1-3 insight cards with recommended actions          | No insight cards; standard dashboard            | Enabled  |
| 82  | Weather-Aware Alerts               | Integrates weather data to generate relevant building alerts (storm prep, snow removal, AC demand)          | Haiku         | $0.001    | On weather API update (every 3 hours)               | Weather forecast + building context                   | Weather-related action items                        | No weather integration                          | Enabled  |
| 83  | Resident Dashboard Personalization | Customizes the resident dashboard based on individual usage patterns and preferences                        | Haiku         | $0.001    | On dashboard load                                   | User activity history + preferences                   | Personalized widget order + content                 | Default dashboard layout for all residents      | Disabled |
| 84  | Building Health Score              | Calculates a composite building health score from maintenance, security, amenity, and satisfaction metrics  | Sonnet        | $0.005    | Daily scheduled (3:00 AM)                           | Cross-module metrics                                  | Health score (0-100) + trend + contributing factors | No health score; individual module metrics only | Enabled  |

### 4.11 Search (3 capabilities)

| ID  | Name                               | Description                                                                                                      | Default Model      | Est. Cost | Trigger                     | Input                                            | Output                                  | Graceful Degradation                               | Default |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------ | --------- | --------------------------- | ------------------------------------------------ | --------------------------------------- | -------------------------------------------------- | ------- |
| 85  | Semantic Search                    | Understands natural language queries and returns relevant results across all modules (not just keyword matching) | Embeddings + Haiku | $0.001    | On search query             | Natural language query + user's permission scope | Ranked results across modules           | Keyword-only search                                | Enabled |
| 86  | Search Result Ranking              | Personalizes search result ordering based on user role, recent activity, and query context                       | Haiku              | $0.001    | On search results returned  | Results + user context + role                    | Re-ranked results with relevance scores | Default relevance ranking                          | Enabled |
| 87  | Query Suggestion and Auto-Complete | Suggests search queries based on partial input and common searches for the user's role                           | Haiku              | $0.0005   | On typing (debounced 300ms) | Partial query + user role + popular queries      | Top 5 query suggestions                 | No suggestions; basic autocomplete on entity names | Enabled |

### 4.12 Notifications (4 capabilities)

| ID  | Name                                 | Description                                                                                                           | Default Model | Est. Cost | Trigger                                        | Input                                            | Output                              | Graceful Degradation                      | Default |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------- | --------- | ---------------------------------------------- | ------------------------------------------------ | ----------------------------------- | ----------------------------------------- | ------- |
| 88  | Smart Notification Batching          | Groups related notifications to reduce notification fatigue (e.g., "3 packages arrived" instead of 3 separate alerts) | Haiku         | $0.001    | On notification queue processing (every 5 min) | Pending notifications for a user                 | Batched notification with summary   | Individual notifications sent immediately | Enabled |
| 89  | Channel Optimization                 | Selects the optimal notification channel (email, SMS, push) based on urgency and user response patterns               | Haiku         | $0.001    | On notification send                           | Notification urgency + user channel history      | Channel recommendation              | Default channel per notification type     | Enabled |
| 90  | Notification Content Personalization | Tailors notification language and detail level based on recipient role and preferences                                | Haiku         | $0.001    | On notification generation                     | Notification data + recipient role + preferences | Personalized notification text      | Generic template-based notification       | Enabled |
| 91  | Escalation Timing                    | Determines when to escalate unseen notifications (e.g., upgrade email to SMS after 2 hours for urgent items)          | Haiku         | $0.001    | On notification age check (every 30 min)       | Notification status + urgency + time elapsed     | Escalation decision (escalate/wait) | Fixed escalation timers per type          | Enabled |

### 4.13 Unit and User Management (5 capabilities)

| ID  | Name                                       | Description                                                                                               | Default Model | Est. Cost | Trigger                             | Input                                                 | Output                                    | Graceful Degradation                               | Default  |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------- | --------- | ----------------------------------- | ----------------------------------------------------- | ----------------------------------------- | -------------------------------------------------- | -------- |
| 92  | Resident Onboarding Checklist Generation   | Creates a personalized onboarding checklist based on unit type, amenities, and building rules             | Haiku         | $0.002    | On new resident account creation    | Unit details + building amenities + rules             | Personalized onboarding checklist         | Generic onboarding checklist                       | Enabled  |
| 93  | Missing Data Detection                     | Identifies incomplete resident profiles and unit records, prioritizing the most critical missing fields   | Haiku         | $0.001    | Weekly scheduled (Saturday 6:00 AM) | All resident/unit records                             | Missing data report with priority ranking | No missing data reports                            | Enabled  |
| 94  | Move-In/Move-Out Prediction                | Predicts upcoming move-ins and move-outs based on lease data and behavioral signals                       | Sonnet        | $0.005    | Monthly scheduled (15th of month)   | Lease dates + activity patterns + historical turnover | Predicted moves for next 60 days          | No predictions; calendar-based lease tracking only | Disabled |
| 95  | Resident Communication Preference Learning | Learns individual resident communication preferences from interaction patterns                            | Haiku         | $0.001    | On resident interaction             | Interaction history (opens, clicks, response times)   | Updated preference profile                | Default preferences per role                       | Disabled |
| 96  | Unit History Summarization                 | Creates a concise summary of a unit's complete history (residents, maintenance, incidents, modifications) | Sonnet        | $0.005    | On demand (unit file view)          | All unit records across modules                       | Narrative unit history summary            | Chronological log view                             | Enabled  |

---

## 5. Cross-Cutting AI Infrastructure (9 items)

| ID  | Name                        | Description                                                                                      | Type         | Detail                                                                                                                                                                                                               |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 97  | AI Cost Dashboard           | Real-time dashboard showing AI spend by module, provider, model, and feature                     | Monitoring   | Charts: daily spend, cumulative monthly, cost per call average, top 10 features by cost. Accessible to Super Admin and Property Admin.                                                                               |
| 98  | Usage Analytics             | Tracks how often each AI feature is invoked, acceptance rates, and user satisfaction             | Analytics    | Per-feature metrics: invocations/day, acceptance rate %, manual override rate %, average latency. Weekly trend reports.                                                                                              |
| 99  | Quality Monitoring          | Continuously monitors AI output quality through acceptance rates and user feedback               | Quality      | Features below 60% acceptance rate flagged for review. Automatic model upgrade suggestion if quality drops. Human review queue for flagged outputs.                                                                  |
| 100 | Privacy Controls            | PII detection and stripping pipeline that runs before every API call                             | Privacy      | Named Entity Recognition for resident names, unit numbers, phone numbers, emails. Replacement with anonymized tokens. Reverse-mapping on response receipt. Audit log of all anonymization events.                    |
| 101 | Rate Limiting               | Per-feature, per-user, and per-property rate limits to prevent abuse and cost overruns           | Protection   | Default: 100 calls/user/hour, 10,000 calls/property/day. Configurable per feature. Soft limit (warn) at 80%, hard limit (block) at 100%.                                                                             |
| 102 | Response Caching            | Caches AI responses for identical inputs to reduce API calls and cost                            | Optimization | Cache duration: 1 hour for real-time features, 24 hours for analytics. Cache key: hash of input + model + feature. Estimated 30-40% cost reduction.                                                                  |
| 103 | Prompt Library              | Centralized, versioned prompt templates for all AI features                                      | Engineering  | Version-controlled prompts. A/B testing support. Rollback capability. Per-property prompt customization. Prompt performance metrics.                                                                                 |
| 104 | A/B Testing Framework       | Enables testing different models, prompts, or providers for the same feature                     | Testing      | Split traffic by percentage. Statistical significance calculator. Auto-promote winner after confidence threshold. Test duration limits.                                                                              |
| 105 | Graceful Degradation Engine | Monitors provider health and automatically falls back to manual workflows when AI is unavailable | Reliability  | Health check every 30 seconds per provider. Circuit breaker pattern: 3 failures in 60 seconds triggers fallback. Auto-recovery when provider returns. User notification: subtle "AI temporarily unavailable" banner. |

---

## 6. Super Admin AI Control Panel

### 6.1 Global Controls

| Control            | Type                           | Description                                                                              |
| ------------------ | ------------------------------ | ---------------------------------------------------------------------------------------- |
| Global AI Toggle   | On/Off switch                  | Master kill switch. Disables all AI features across all properties instantly.            |
| Per-Module Toggle  | On/Off per module              | Disable AI for entire modules (e.g., turn off all Security Console AI).                  |
| Per-Feature Toggle | On/Off per feature             | Granular control over each of the 105 features individually.                             |
| Emergency Shutdown | Button (requires confirmation) | Immediately halts all AI API calls. For use during provider outages or cost emergencies. |

### 6.2 Provider Configuration

| Setting                       | Options                                   | Default               |
| ----------------------------- | ----------------------------------------- | --------------------- |
| Primary provider              | Claude / OpenAI                           | Claude                |
| Fallback provider             | Claude / OpenAI / None                    | OpenAI                |
| Per-feature provider override | Claude / OpenAI / Auto                    | Auto                  |
| Per-feature model override    | Provider-specific model list              | Auto (system selects) |
| API key management            | Encrypted key storage, rotation reminders | --                    |
| Connection test               | Test button per provider                  | --                    |

### 6.3 Budget Controls

| Setting                  | Description                                          | Default          |
| ------------------------ | ---------------------------------------------------- | ---------------- |
| Daily budget limit       | Maximum AI spend per day across all properties       | $5.00            |
| Weekly budget limit      | Maximum AI spend per week                            | $25.00           |
| Monthly budget limit     | Maximum AI spend per month                           | $75.00           |
| Per-property daily limit | Maximum AI spend per property per day                | $2.00            |
| Alert threshold          | Email alert when budget reaches this %               | 80%              |
| Over-budget behavior     | Downgrade models / Disable non-essential / Hard stop | Downgrade models |
| Cost allocation          | Per-property cost tracking for billing               | Enabled          |

### 6.4 Dashboards

**Cost Dashboard**:

- Daily AI spend chart (line graph, 30-day view)
- Spend by module (bar chart)
- Spend by provider (pie chart)
- Spend by model tier (stacked bar)
- Cost per call average trend
- Top 10 most expensive features
- Projected monthly spend

**Quality Dashboard**:

- Acceptance rate per feature (bar chart, sorted)
- User override rate trend
- Average response latency per provider
- Feature health status (green/yellow/red)
- User satisfaction scores (if feedback collected)

**Usage Dashboard**:

- Total AI calls per day (line chart)
- Calls by module (stacked area)
- Active features count
- Cache hit rate
- Rate limit events

---

## 7. Privacy and Data Handling

### 7.1 PII Protection Pipeline

```
User Input → PII Detection → Anonymization → API Call → Response → De-anonymization → User Output
```

| Step                 | Detail                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PII Detection**    | Named Entity Recognition identifies: resident names, unit numbers, phone numbers, email addresses, license plates, FOB serial numbers.            |
| **Anonymization**    | Detected PII replaced with tokens: "John Smith in Unit 1205" becomes "PERSON_1 in UNIT_1". Mapping table stored locally (never sent to provider). |
| **API Call**         | Only anonymized text sent to provider. No PII leaves the platform.                                                                                |
| **De-anonymization** | Provider response tokens mapped back to original values before displaying to user.                                                                |
| **Audit**            | Every anonymization event logged: what was detected, what was replaced, which API call, timestamp.                                                |

### 7.2 Data Policies

| Policy                       | Detail                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No training**              | All API usage is through commercial API endpoints (not consumer products). Providers contractually prohibited from training on our data.                                                                       |
| **Response caching**         | AI responses cached locally for maximum 24 hours, then automatically purged.                                                                                                                                   |
| **Audit log retention**      | AI call audit logs retained for 90 days (configurable). Include: feature ID, timestamp, input hash (not content), output hash, cost, latency, model used.                                                      |
| **GDPR compliance**          | Users can request deletion of all AI interaction history associated with their account.                                                                                                                        |
| **Biometric data**           | Face photos and voice recordings are processed locally only. Voice-to-text uses edge processing where available; when cloud Whisper is required, audio is deleted from provider within 24 hours per API terms. |
| **Cross-property isolation** | AI features never have access to data from properties the user is not authorized for.                                                                                                                          |

### 7.3 Compliance

| Standard        | Status                    | Detail                                                                |
| --------------- | ------------------------- | --------------------------------------------------------------------- |
| GDPR            | Compliant                 | Right to deletion, data portability, explicit consent for AI features |
| PIPEDA (Canada) | Compliant                 | Personal information protection for Canadian properties               |
| SOC 2 Type II   | Target for v2             | AI audit logs support compliance requirements                         |
| Data residency  | Configurable per property | Canadian properties can restrict to Canadian/US data centers only     |

### 7.4 AI Decision Transparency (GDPR Art. 22 Compliance)

**Purpose**: GDPR Article 22 gives individuals the right not to be subject to decisions based solely on automated processing that significantly affect them. While most Concierge AI features are assistive (suggestions, not decisions), several features produce outputs that influence outcomes for residents, and transparency is required.

**Principle**: Every AI-generated output that is displayed to a user or used in a decision must be clearly labeled as AI-generated, and the affected person must have the ability to request human review.

#### 7.4.1 AI Attribution Badge

Every screen where AI-generated content is displayed must include an attribution badge.

**Badge Specification**:

- **Visual**: Small pill-shaped badge, 12px font, grey background (#F3F4F6), dark grey text (#4B5563), icon: sparkle (matching existing AI icon pattern)
- **Text**: "AI Suggestion" (for recommendations) or "AI Generated" (for auto-filled content)
- **Placement**: Inline, immediately adjacent to the AI-generated content. Not in a tooltip — must be visible without hover.
- **Accessibility**: `aria-label="This content was generated by AI"`, role="status"

**Where the badge appears** (non-exhaustive, applies to all AI features in Section 4):

| Module             | AI Feature                   | Badge Text      | Placement                             |
| ------------------ | ---------------------------- | --------------- | ------------------------------------- |
| Security Console   | Incident severity suggestion | "AI Suggestion" | Next to suggested severity level      |
| Security Console   | Similar incident linking     | "AI Suggestion" | Header of "Similar Incidents" panel   |
| Package Management | Courier detection            | "AI Detected"   | Next to auto-filled courier name      |
| Package Management | Resident matching            | "AI Suggestion" | Next to suggested recipient           |
| Package Management | Storage location suggestion  | "AI Suggestion" | Next to suggested storage spot        |
| Maintenance        | Category classification      | "AI Suggestion" | Next to auto-filled category          |
| Maintenance        | Priority assessment          | "AI Suggestion" | Next to suggested priority            |
| Maintenance        | Duplicate detection          | "AI Suggestion" | Header of "Possible Duplicates" panel |
| Amenity Booking    | Conflict prediction          | "AI Suggestion" | Next to conflict warning              |
| Communication      | Draft generation             | "AI Generated"  | Top of generated draft text           |
| Communication      | Tone adjustment              | "AI Generated"  | Top of adjusted text                  |
| Reports            | AI recommendations           | "AI Suggestion" | Header of recommendations panel       |
| Dashboard          | Daily briefing               | "AI Generated"  | Header of briefing card               |
| Compliance         | Anomaly explanation          | "AI Generated"  | Header of explanation text            |

#### 7.4.2 Human Review Request

**Purpose**: Any person affected by an AI-generated suggestion or classification has the right to request that a human reviews and potentially overrides the AI output.

**"Request Human Review" Link**:

- **Visual**: Text link, 12px, blue (#2563EB), underlined. Appears directly below the AI Attribution Badge.
- **Text**: "Request Human Review"
- **Action**: Opens a small modal:
  - Title: "Request Human Review"
  - Body: "A staff member will review this AI-generated [suggestion/classification] and may make changes. You will be notified of the outcome."
  - Text field: "Reason for review request (optional)" — max 500 chars
  - Buttons: "Submit Request" (primary), "Cancel" (secondary)
- **Backend**: Creates a `HumanReviewRequest` record and sends an in-app notification to the assigned staff member (or Property Admin if no specific assignee).

**HumanReviewRequest Data Model**:

```
HumanReviewRequest
├── id (UUID, PK)
├── property_id → Property (FK, NOT NULL)
├── requested_by → User (FK, NOT NULL)
├── ai_feature_id (varchar 10, NOT NULL) -- e.g., "F003" from Section 4 catalog
├── ai_output_reference (jsonb, NOT NULL) -- The specific AI output being contested
├── entity_type (varchar 50, NOT NULL) -- e.g., "MaintenanceRequest", "SecurityIncident"
├── entity_id (UUID, NOT NULL) -- ID of the record containing the AI output
├── reason (text, nullable)
├── status (enum: pending, under_review, upheld, overridden, dismissed)
├── reviewed_by → User (FK, nullable)
├── review_notes (text, nullable)
├── original_value (text, NOT NULL) -- The AI-generated value
├── final_value (text, nullable) -- The human-reviewed value (may be same as original)
├── created_at (timestamp with tz, NOT NULL, default NOW())
├── resolved_at (timestamp with tz, nullable)
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_human_review_property_status (property_id, status) WHERE status IN ('pending', 'under_review')
  - idx_human_review_requested_by (requested_by)
```

**SLA**: Human review requests must be resolved within 48 hours. If unresolved after 24 hours, escalate to Property Admin. If unresolved after 48 hours, the AI suggestion is automatically flagged as "Pending Review" in the UI with a yellow warning indicator.

**Notification**:

- On submission: In-app notification to assigned reviewer
- After 24 hours unresolved: Email escalation to Property Admin
- On resolution: In-app + email notification to the requester with outcome

#### 7.4.3 Privacy Policy AI Disclosure

The Privacy Policy page (PRD 22, Section 9.5) must include an "Automated Decision-Making" section with:

1. A list of AI features that produce suggestions or classifications affecting residents
2. The purpose of each (e.g., "Package recipient matching helps ensure packages are delivered to the correct unit")
3. The logic involved (e.g., "Name matching uses fuzzy string comparison against the resident directory")
4. The right to request human review of any AI-generated output
5. Instructions for exercising this right (link to the "Request Human Review" mechanism)

#### 7.4.4 AI Opt-Out per Feature Category

In the Privacy tab of My Account (PRD 08, Section 6.3.2), add an "AI Preferences" section:

| Toggle                                    | Default | Effect When Off                                                                                                                         |
| ----------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| AI suggestions in my maintenance requests | On      | Maintenance requests from this resident will not have AI category/priority suggestions auto-applied. Staff can still manually classify. |
| AI-generated communication drafts         | On      | Announcements and notifications sent to this resident will not use AI-generated content. Templates are used instead.                    |
| AI analytics on my data                   | On      | This resident's data is excluded from AI-powered pattern analysis (e.g., recurring maintenance issue detection).                        |

**Important**: These toggles affect AI processing of the individual's data only. They do not disable AI features platform-wide (that is the Super Admin's control in Section 6.1).

---

## 8. Cost Modeling

### 8.1 Typical 500-Unit Building (Daily Breakdown)

| Activity                                                                    | Daily Frequency   | AI Calls/Day | Avg Model        | Cost/Call | Daily Cost     | Monthly Cost      |
| --------------------------------------------------------------------------- | ----------------- | ------------ | ---------------- | --------- | -------------- | ----------------- |
| Package intake (OCR, courier detect, smart match, storage suggest)          | 50 packages       | 150          | Haiku/Vision     | $0.002    | $0.30          | $9.00             |
| Incident reports (grammar, category, severity, similar linking, escalation) | 5 incidents       | 25           | Haiku            | $0.001    | $0.03          | $0.75             |
| Maintenance requests (classify, priority, duplicate, template, enhance)     | 10 requests       | 40           | Haiku            | $0.001    | $0.04          | $1.20             |
| Announcements (draft, tone, subject, summary, audience)                     | 2 announcements   | 10           | Haiku/Sonnet     | $0.003    | $0.03          | $0.90             |
| Search queries (semantic, ranking, suggestions)                             | 100 queries       | 200          | Embeddings/Haiku | $0.001    | $0.20          | $6.00             |
| Dashboard briefing + insights + KPI + weather                               | 20 users          | 60           | Haiku/Sonnet     | $0.003    | $0.18          | $5.40             |
| Notifications (batching, channel, personalization, escalation)              | 200 notifications | 200          | Haiku            | $0.001    | $0.20          | $6.00             |
| Community moderation + classified ads                                       | 10 posts          | 15           | Haiku            | $0.001    | $0.02          | $0.45             |
| Parking (plate OCR, violation patterns, permit reminders)                   | 15 events         | 20           | Haiku/Vision     | $0.003    | $0.06          | $1.80             |
| Training (quiz gen, compliance alerts)                                      | 2 sessions        | 5            | Haiku/Sonnet     | $0.003    | $0.02          | $0.45             |
| Reports (summaries, trends, data quality)                                   | 3 reports         | 10           | Sonnet           | $0.007    | $0.07          | $2.10             |
| Scheduled analytics (patterns, recurring issues, health score)              | 1 batch           | 5            | Sonnet           | $0.01     | $0.05          | $1.50             |
| **TOTAL**                                                                   |                   | **~740**     |                  |           | **~$1.20/day** | **~$35.55/month** |

### 8.2 Cost Context

| Metric                                                  | Value        |
| ------------------------------------------------------- | ------------ |
| Monthly AI cost (500-unit building, all features)       | ~$25-40      |
| Monthly AI cost (500-unit building, core features only) | ~$12-18      |
| Monthly AI cost per unit                                | ~$0.05-0.08  |
| Typical SaaS subscription per unit                      | $3-8/month   |
| AI cost as % of subscription                            | ~1-2%        |
| Cache hit savings (estimated 35%)                       | -$9-14/month |
| **Net monthly AI cost**                                 | **~$15-25**  |

### 8.3 Cost Scaling

| Building Size | Est. Daily AI Calls | Est. Monthly Cost |
| ------------- | ------------------- | ----------------- |
| 50 units      | ~100                | $3-5              |
| 200 units     | ~350                | $8-15             |
| 500 units     | ~740                | $15-25            |
| 1,000 units   | ~1,300              | $25-45            |
| 2,000 units   | ~2,200              | $40-70            |

Cost scales sub-linearly because many features (analytics, reports, health scores) run on fixed schedules regardless of building size.

---

## 9. Future AI Roadmap

### v1 -- Core Intelligence (Launch)

| Capability Type                 | Examples                                                     | Models             |
| ------------------------------- | ------------------------------------------------------------ | ------------------ |
| Text correction and enhancement | Grammar fix, tone adjustment, description enhancement        | Haiku              |
| Auto-categorization             | Incident types, maintenance categories, ad categories        | Haiku              |
| Smart matching                  | Unit/resident matching, duplicate detection, similar linking | Embeddings + Haiku |
| Semantic search                 | Natural language search across all modules                   | Embeddings + Haiku |
| Basic analytics                 | Shift summaries, daily briefings, KPI selection              | Sonnet             |
| Content generation              | Announcement drafts, response templates, work orders         | Haiku/Sonnet       |
| Smart notifications             | Batching, channel selection, personalization                 | Haiku              |

### v2 -- Advanced Capabilities (3-6 months post-launch)

| Capability Type           | Examples                                                   | Models           |
| ------------------------- | ---------------------------------------------------------- | ---------------- |
| Voice-to-text             | Security report dictation, maintenance notes               | Whisper + Sonnet |
| Photo/image analysis      | Package OCR, damage assessment, plate recognition          | Vision           |
| Predictive analytics      | Risk forecasting, demand prediction, failure prediction    | Sonnet           |
| Advanced reporting        | Natural language queries, executive summaries, forecasting | Sonnet           |
| Training/LMS intelligence | Quiz generation, adaptive learning, knowledge gaps         | Sonnet           |
| Multi-language support    | Announcement translation, training translation             | Sonnet           |

### v3 -- Autonomous Capabilities (6-12 months post-launch)

| Capability Type           | Examples                                                                   | Models         |
| ------------------------- | -------------------------------------------------------------------------- | -------------- |
| Proactive alerts          | Anomaly detection, weather-aware preparation, compliance reminders         | Haiku/Sonnet   |
| Smart scheduling          | Maintenance scheduling, staff optimization, amenity pricing                | Sonnet         |
| Cross-module intelligence | Building health score, resident satisfaction prediction, cost optimization | Sonnet/Opus    |
| A/B testing at scale      | Automatic prompt optimization, model selection                             | Infrastructure |

### v4 -- Multi-Modal Intelligence (12+ months post-launch)

| Capability Type      | Examples                                                 | Models               |
| -------------------- | -------------------------------------------------------- | -------------------- |
| Video analysis       | Security camera anomaly detection, parking monitoring    | Vision (next-gen)    |
| IoT integration      | Sensor-driven maintenance alerts, energy optimization    | Haiku + IoT adapters |
| Real-time processing | Live incident assistance, real-time translation          | Edge models          |
| Autonomous workflows | Auto-dispatch maintenance, self-healing building systems | Opus + orchestration |

---

## Edge Cases

### AI Provider Failures

| Scenario                                                        | Behavior                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude API returns 500 error                                    | Retry up to 3 times with exponential backoff (1s, 3s, 9s). If all retries fail, fall back to OpenAI for the same capability. If OpenAI also fails, return the feature's non-AI fallback (e.g., manual entry instead of OCR auto-fill). Log the failure. Never block the user workflow.                                                 |
| OpenAI API returns 500 error                                    | Same retry and fallback pattern, but falling back to Claude instead.                                                                                                                                                                                                                                                                   |
| Claude API rate limit (429)                                     | Respect the `Retry-After` header. Queue the request. If the queue exceeds 50 pending requests, switch to OpenAI for the duration of the rate limit window.                                                                                                                                                                             |
| OpenAI API rate limit (429)                                     | Same pattern, falling back to Claude.                                                                                                                                                                                                                                                                                                  |
| AI response takes longer than 10 seconds                        | Display a "Still thinking..." indicator at 3 seconds. At 10 seconds, abort the request and show: "AI suggestion unavailable. You can proceed manually." The user can retry with a "Try Again" button.                                                                                                                                  |
| AI provider returns content that fails safety filtering         | Discard the response. Log the incident with the prompt (but not the response content). Return: "AI suggestion unavailable for this content." Do not show the filtered content to the user under any circumstances.                                                                                                                     |
| AI hallucination detected (output references non-existent data) | All AI outputs that reference database entities (unit numbers, resident names, event IDs) are validated against the database before display. If a referenced entity does not exist, that portion of the AI output is stripped with a note: "Some AI suggestions were removed because they referenced data that could not be verified." |
| Monthly AI cost exceeds budget ceiling ($50/property)           | At 80% of budget: alert Property Admin. At 100%: disable non-essential AI features (smart suggestions, analytics narratives). Keep essential AI features active (OCR, safety-critical anomaly detection). Reset on the 1st of the next month.                                                                                          |
| Both providers are down simultaneously                          | All AI features degrade to manual mode. A system-wide banner appears for admin roles: "AI features are temporarily unavailable. All manual workflows remain fully operational." Log the dual outage for the status page.                                                                                                               |

### AI Content Quality

| Scenario                                                         | Behavior                                                                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI generates a package notification with incorrect resident name | AI-generated notifications are always validated against the database before sending. The resident name is fetched from the database, never from the AI response. AI only generates the message body template. |
| AI search returns zero relevant results                          | Fall back to keyword-based search. Display: "AI search did not find relevant results. Showing keyword matches instead."                                                                                       |
| AI-generated report narrative contains outdated data             | Report narratives are generated from fresh database queries, not from cached AI responses. The AI formats the data; it does not supply the data.                                                              |

---

## Completeness Checklist

### AI Capability Coverage

| #   | Requirement                                                            | Status  | Section    |
| --- | ---------------------------------------------------------------------- | ------- | ---------- |
| 1   | Dual-provider architecture (Claude + OpenAI)                           | Covered | 2          |
| 2   | Model selection per capability (Haiku/Sonnet/Opus, GPT-4o-mini/GPT-4o) | Covered | 2.1        |
| 3   | Cost tracking and budget controls                                      | Covered | 3          |
| 4   | Graceful degradation on provider failure                               | Covered | Edge Cases |
| 5   | 105 AI capabilities cataloged across 14 modules                        | Covered | 4          |
| 6   | Security Console AI capabilities (12)                                  | Covered | 4.1        |
| 7   | Package Management AI capabilities (10)                                | Covered | 4.2        |
| 8   | Maintenance AI capabilities (12)                                       | Covered | 4.3        |
| 9   | Amenity Booking AI capabilities (8+)                                   | Covered | 4.4        |
| 10  | Privacy controls (anonymization, opt-out, data minimization)           | Covered | 5          |
| 11  | Rate limiting and cost ceiling enforcement                             | Covered | Edge Cases |
| 12  | Phased rollout plan (v1-v4)                                            | Covered | 6          |

### Provider Failure Coverage

| #   | Requirement                            | Status  | Section    |
| --- | -------------------------------------- | ------- | ---------- |
| 1   | Single provider 500 error handling     | Covered | Edge Cases |
| 2   | Rate limit (429) handling              | Covered | Edge Cases |
| 3   | Timeout handling with user feedback    | Covered | Edge Cases |
| 4   | Content safety filtering               | Covered | Edge Cases |
| 5   | Hallucination detection and mitigation | Covered | Edge Cases |
| 6   | Cost overrun prevention                | Covered | Edge Cases |
| 7   | Dual provider simultaneous outage      | Covered | Edge Cases |

---

_End of document._
