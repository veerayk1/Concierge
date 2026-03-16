# ADR-005: Custom AI Gateway with Dual-Provider Support (Claude + OpenAI)

## Status: Accepted
## Date: 2026-03-15
## Decision Makers: Architecture Team

## Context

Concierge integrates AI capabilities across multiple modules to deliver intelligent building
management features that no competitor offers:

- **Smart event classification**: Automatically categorize incoming events (package, visitor,
  incident, maintenance) from free-text descriptions or photos.
- **Maintenance request triage**: Analyze maintenance descriptions and photos to suggest
  priority, category, and relevant equipment, reducing manual classification time.
- **Announcement drafting**: Generate professional building announcements from brief staff
  notes in multiple languages for multilingual condo communities.
- **Report summarization**: Produce executive summaries of weekly/monthly activity reports
  for board members.
- **Search enhancement**: Convert natural language queries ("packages for unit 815 last week")
  into structured database queries.
- **Security incident analysis**: Analyze incident descriptions to suggest related past
  incidents and recommend response protocols.

These features have strict requirements:

- **PII stripping**: Resident names, unit numbers, phone numbers, and email addresses must
  be stripped or pseudonymized before being sent to any external AI provider. Condo resident
  data is PIPEDA-protected. Sending raw PII to US-based AI APIs would violate data residency
  commitments.
- **Per-feature provider/model selection**: Some features need Claude's longer context window
  and stronger reasoning (report summarization, incident analysis). Others need OpenAI's
  faster, cheaper models (event classification, search query generation). The gateway must
  route requests to the appropriate provider and model.
- **Cost metering per property**: Each property has a monthly AI budget set by the Super Admin.
  Usage must be tracked per property, per feature, per model. Overage alerts must fire before
  the budget is exhausted.
- **Graceful degradation**: If an AI provider is down or rate-limited, the feature must
  degrade gracefully (e.g., skip auto-classification, show manual category picker).
- **Super Admin controls**: Super Admins can enable/disable AI features per property,
  set budget limits, view usage dashboards, and configure which provider/model each feature
  uses.
- **Audit trail**: Every AI API call must be logged with: feature, model, token count,
  cost, latency, property_id, and a hash of the prompt (not the prompt itself, for privacy).

## Decision

Build a **custom AI gateway service** as an internal module within the Next.js application
that acts as a centralized proxy between Concierge features and external AI providers.

### Architecture

```
Feature Module (e.g., Maintenance Triage)
  |
  | aiGateway.request({ feature, prompt, context })
  |
  v
AI Gateway Module (server-side only)
  |
  +--> PII Stripper
  |      - Regex patterns for phone, email, postal code
  |      - Named entity recognition for resident names
  |      - Unit number pseudonymization (Unit 815 -> Unit [UNIT_A])
  |      - Reversible mapping stored in-memory for response de-pseudonymization
  |
  +--> Budget Check
  |      - Query property's monthly usage vs budget limit
  |      - If over 90%: log warning, continue
  |      - If over 100%: reject request, return degraded response
  |
  +--> Router
  |      - Look up feature -> provider/model mapping from config
  |      - Feature config stored in database, editable by Super Admin
  |      - Default mappings:
  |          event_classification  -> openai/gpt-4o-mini (fast, cheap)
  |          search_query          -> openai/gpt-4o-mini
  |          maintenance_triage    -> anthropic/claude-sonnet (balanced)
  |          announcement_draft    -> anthropic/claude-sonnet
  |          report_summary        -> anthropic/claude-opus (best reasoning)
  |          incident_analysis     -> anthropic/claude-opus
  |
  +--> Provider Adapter
  |      - Unified interface: { provider, model, messages, maxTokens, temperature }
  |      - Claude adapter: Anthropic SDK with Messages API
  |      - OpenAI adapter: OpenAI SDK with Chat Completions API
  |      - Retry with exponential backoff (3 attempts, 1s/2s/4s)
  |      - Circuit breaker: after 5 consecutive failures, mark provider as unhealthy
  |        for 60 seconds, fall back to secondary provider or degraded mode
  |
  +--> Response Processor
  |      - De-pseudonymize PII placeholders back to real values
  |      - Validate response structure (expected JSON schema for classification)
  |      - Truncate if response exceeds expected length
  |
  +--> Metering & Audit
         - Record: property_id, feature, provider, model, input_tokens, output_tokens,
           cost_usd, latency_ms, status (success/failure/degraded), prompt_hash
         - Increment property's monthly usage counter (Redis for speed, PostgreSQL for durability)
         - Emit billing event for cost tracking
```

### PII Stripping Pipeline

```typescript
interface PIIStripper {
  strip(text: string): { sanitized: string; mappings: PIIMapping[] };
  restore(text: string, mappings: PIIMapping[]): string;
}

interface PIIMapping {
  original: string;       // "John Smith"
  placeholder: string;    // "[PERSON_A]"
  type: "name" | "email" | "phone" | "unit" | "address" | "postal_code";
}

// Pipeline:
// 1. Regex: emails, phone numbers (10+ patterns), postal codes, unit numbers
// 2. NER: resident names via local model or dictionary lookup against property's
//    resident database (no external API call for PII detection)
// 3. Pseudonymization: deterministic placeholders ([PERSON_A], [UNIT_A]) so
//    the AI can still reason about relationships ("resident of [UNIT_A]")
// 4. Mapping stored in-memory, never persisted, garbage collected after response
```

### Budget Configuration

```typescript
interface PropertyAIConfig {
  propertyId: string;
  monthlyBudgetUsd: number;          // e.g., 50.00
  enabledFeatures: AIFeature[];       // which features are active
  featureOverrides: {                 // per-feature provider/model override
    [feature: string]: {
      provider: "anthropic" | "openai";
      model: string;
    };
  };
  alertThresholds: number[];          // e.g., [0.75, 0.90] for 75% and 90% warnings
  alertRecipients: string[];          // user IDs to notify on threshold breach
}
```

### Feature Registration

Each module registers its AI feature with the gateway:

```typescript
aiGateway.registerFeature({
  id: "maintenance_triage",
  name: "Maintenance Request Triage",
  description: "Categorizes and prioritizes maintenance requests",
  defaultProvider: "anthropic",
  defaultModel: "claude-sonnet",
  maxInputTokens: 2000,
  maxOutputTokens: 500,
  expectedResponseSchema: maintenanceTriageSchema,  // Zod schema for validation
  degradedBehavior: "skip",  // "skip" | "fallback_provider" | "cached_response"
});
```

## Rationale

1. **PII compliance is non-negotiable**: PIPEDA prohibits sending resident PII to US-based
   servers without explicit consent. A centralized gateway ensures every AI request passes
   through the PII stripping pipeline. Without this gateway, each feature module would need
   to implement PII stripping independently, guaranteeing inconsistency and eventual leakage.

2. **Dual-provider avoids single-vendor lock-in**: AI pricing, capabilities, and availability
   change rapidly. Claude excels at long-context reasoning (reports, analysis). OpenAI's
   smaller models are faster and cheaper for classification tasks. The gateway abstracts
   provider differences behind a unified interface.

3. **Cost metering prevents bill shock**: Without per-property budgets, a single property
   with high event volume could generate thousands of AI API calls per month. The gateway
   enforces budget limits and provides usage visibility to Super Admins.

4. **Circuit breaker pattern ensures availability**: If Claude's API has an outage,
   maintenance triage should not break. The circuit breaker falls back to the secondary
   provider or degrades to manual mode, keeping the core application functional.

5. **Centralized audit simplifies compliance**: SOC 2 requires demonstrating that PII is
   not sent to unauthorized third parties. A single gateway with logged (hashed) prompts
   and token counts provides the audit evidence.

## Alternatives Considered

### LangChain
- **Pros**: Provider abstraction, chain composition, tool use, memory management, large
  community.
- **Rejected because**: Heavy dependency (200+ transitive packages). Abstractions are
  designed for complex agent workflows (tool use, RAG, multi-step chains) that we do not
  need in v1. Our use cases are simple request/response patterns that do not benefit from
  LangChain's chain composition. Does not include PII stripping or cost metering. Adds
  significant bundle size and complexity for features we would not use.

### Direct API Calls from Each Module
- **Pros**: Simplest implementation, no abstraction overhead, each module owns its AI logic.
- **Rejected because**: PII stripping would need to be implemented in every module (6+
  modules in v1). Cost metering would require each module to report usage to a central
  service. Circuit breaker logic would be duplicated. Provider switching would require
  changes in every module. This approach virtually guarantees PII leakage through
  inconsistent implementation.

### Single Provider (Claude or OpenAI only)
- **Pros**: Simpler implementation, one SDK, one billing relationship, one set of
  rate limits to manage.
- **Rejected because**: No provider excels at all use cases. Claude's Opus model is
  expensive for high-volume classification tasks. OpenAI's smaller models lack the
  reasoning depth for report summarization and incident analysis. Single-provider also
  means zero redundancy during outages.

## Consequences

### Positive
- PII never leaves Canadian infrastructure in raw form. All AI requests are sanitized
  through a single, auditable pipeline.
- Super Admins have full visibility and control over AI features, costs, and provider
  selection per property.
- Features degrade gracefully during provider outages instead of breaking.
- Adding a new AI provider (e.g., Google Gemini, Mistral) requires only a new adapter
  class, not changes to every feature module.
- Cost tracking per property enables fair billing and prevents surprise charges.
- Centralized prompt templates improve consistency across features.

### Negative
- Custom middleware to build and maintain. The PII stripping pipeline, circuit breaker,
  budget enforcement, and provider adapters are non-trivial components.
- PII stripping via regex and dictionary lookup will have false positives (stripping
  non-PII) and false negatives (missing novel PII patterns). Requires ongoing tuning.
- Adds latency to every AI request (PII strip + budget check + routing ~5-15ms overhead).
  Acceptable for the use cases (none are sub-100ms latency sensitive).
- Gateway is a single point of failure for all AI features. Mitigated by keeping the
  gateway stateless and horizontally scalable.

### Risks
- **PII stripping false negatives**: Regex and dictionary approaches may miss PII in
  unusual formats (e.g., "call John at extension 4815"). Mitigated by: conservative
  stripping (strip anything that looks like a number pattern), regular PII audit of
  logged prompt hashes, and iterative pattern improvement.
- **Budget enforcement race conditions**: Concurrent requests may exceed the budget
  before the counter is updated. Mitigated by using Redis INCRBYFLOAT for atomic
  counter increments and allowing a small overage buffer (5%) rather than strict cutoff.
- **Provider API changes**: AI providers change their APIs, pricing, and model names.
  Mitigated by abstracting behind the adapter interface and pinning SDK versions.
  Quarterly review of provider changes.
- **Model deprecation**: Providers retire models (e.g., GPT-3.5, Claude 2). The
  feature-to-model mapping in the database allows Super Admins to update model selections
  without code changes.

## Related ADRs
- ADR-001: Framework (AI gateway runs as a server-side module within Next.js)
- ADR-002: Database (metering data and feature config stored in PostgreSQL)
- ADR-003: Auth (AI requests scoped to authenticated user's property context)
- ADR-004: Realtime (AI-generated classifications can trigger realtime updates)
