# 22 — Marketing Website & Public Pages

> **Status**: Draft
> **Last updated**: 2026-03-16
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 16-Settings Admin (Branding), 19-AI Framework

---

## 1. Overview

### What It Is

The Marketing Website is the **public-facing front door** of Concierge. It is a collection of static and dynamic pages that live within the same Next.js 15 codebase as the main application but use a completely separate layout -- no sidebar, no authenticated navigation, and no access to property data. These pages serve three distinct audiences with three distinct goals.

This is not a separate product or repository. It is a route group (`(marketing)`) within the existing Next.js application, sharing the same design tokens, component library, and deployment pipeline. Marketing pages are statically generated at build time for maximum performance. Dynamic pages (login, demo request) use server-side rendering.

### Why It Exists

Every SaaS product needs a public presence that accomplishes three things:

1. **Attract prospects**: Property management companies evaluating building management software need to understand what Concierge does, how much it costs, and why it is better than their current solution -- all before talking to a salesperson.
2. **Serve existing customers**: Residents and staff at properties already using Concierge need a reliable, fast way to find the login page and reach the correct property portal.
3. **Build trust**: Security-conscious property managers need to verify compliance certifications, data handling practices, and company credibility before entrusting resident data to a platform.

Without a marketing website, Concierge relies entirely on outbound sales. The website is the primary inbound lead generation channel.

### Who Uses It

| Audience                                 | Goal                                                                  | Key Pages                                          |
| ---------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| **Prospective property managers**        | Evaluate Concierge as a replacement for their current platform        | Landing, Features, Pricing, Security, Demo Request |
| **Prospective board members**            | Present Concierge to their board as a recommendation                  | Features, Pricing, About, Security                 |
| **Existing staff (concierge, security)** | Log in to their property portal                                       | Login, Vanity URL (`/[property-slug]`)             |
| **Existing residents**                   | Log in to submit maintenance requests, check packages, book amenities | Login, Vanity URL (`/[property-slug]`)             |
| **Job seekers**                          | Learn about the company                                               | About                                              |
| **Search engines**                       | Index and rank Concierge pages                                        | All pages (SEO-optimized)                          |

---

## 2. Research Summary

### SaaS Marketing Best Practices from Industry Research

Industry research across leading property management SaaS platforms and broader B2B SaaS marketing analysis revealed these patterns:

| Practice                                  | Where Observed                                                                                                                                         | Our Approach                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Role-based feature showcase**           | Top SaaS products show different value propositions for different user types (admins vs end users)                                                     | Adopt. Tabbed role showcase on landing page and features page showing Concierge, Security, Manager, and Resident perspectives |
| **Interactive product demos**             | Leading platforms embed read-only demo environments directly on the website so prospects can click through without signing up                          | Adopt. Embed a guided walkthrough of the demo environment on the Features page                                                |
| **Transparent pricing**                   | B2B SaaS companies that show pricing publicly generate 2-3x more qualified leads than those requiring sales contact for pricing                        | Adopt. Full pricing page with three tiers, feature matrix, and FAQ                                                            |
| **Trust signals above the fold**          | Compliance badges (SOC 2, ISO 27001), customer count, and testimonials placed within the first viewport increase conversion rates                      | Adopt. Compliance badges in the hero section and footer, customer count as social proof                                       |
| **Property-specific login routing**       | Multi-tenant platforms provide vanity URLs or tenant identifiers so users reach the correct portal without confusion                                   | Adopt. Three login methods: vanity URL, email-based routing, and property code                                                |
| **Self-serve demo environments**          | Platforms that offer instant access to a sandbox (no sales call required) convert more top-of-funnel visitors into pipeline                            | Adopt. "Try it now" instant demo creation alongside the traditional "Request a Demo" form                                     |
| **Bilingual support for Canadian market** | Canadian SaaS products serving Ontario and Quebec provide English and French interfaces to comply with language requirements and reach the full market | Adopt. Full i18n support for English and French-Canadian                                                                      |
| **Privacy-respecting analytics**          | B2B SaaS targeting enterprise customers avoids Google Analytics due to GDPR and privacy concerns, using alternatives like Plausible or PostHog         | Adopt. Plausible or PostHog for analytics -- no cookie banners required                                                       |

### Best Practices Adopted

1. **Static generation for all marketing content** -- pages load in under 1 second from any location because they are pre-rendered HTML served from edge caches
2. **Progressive disclosure** -- landing page shows high-level value; features page goes deeper; demo lets prospects experience the product firsthand
3. **Single primary CTA per section** -- every section has one clear next step, not competing buttons
4. **Social proof throughout** -- testimonials, customer logos, and usage statistics appear on every major page
5. **Accessibility-first** -- all pages meet WCAG 2.2 AA standards, including proper heading hierarchy, alt text, focus management, and sufficient color contrast

### Pitfalls Avoided

1. **No gated content before demo** -- prospects can explore everything without creating an account or providing an email (except for the actual demo request)
2. **No competitor name-dropping** -- comparison tables use generic categories ("your current platform") rather than naming specific competitors, to avoid legal issues and to age well
3. **No pricing hidden behind "Contact Sales"** -- Starter and Professional tiers show exact pricing; only Enterprise requires a sales conversation
4. **No separate marketing site repository** -- a disconnected marketing site leads to design drift, duplicated components, and deployment complexity
5. **No cookie-consent popups** -- by choosing privacy-respecting analytics that do not use cookies, the site avoids intrusive consent banners entirely
6. **No autoplaying audio** -- video in the hero section autoplays muted with captions; users opt in to audio

---

## 3. Site Architecture

### 3.1 Route Group Structure

The marketing website lives within the existing Next.js 15 App Router codebase as a separate route group. This means it shares the same build, deployment, and component library but has a completely independent layout.

**Directory structure:**

```
app/
├── (portal)/          # Authenticated app (existing)
│   ├── layout.tsx     # Sidebar + header layout
│   └── ...
├── (admin)/           # Super Admin panel (existing)
│   └── ...
├── (auth)/            # Auth pages (existing)
│   └── ...
├── (marketing)/       # NEW: Public marketing pages
│   ├── layout.tsx     # Marketing layout (navbar + footer, no sidebar)
│   ├── page.tsx       # Landing page (/)
│   ├── features/
│   │   └── page.tsx   # Features page (/features)
│   ├── pricing/
│   │   └── page.tsx   # Pricing page (/pricing)
│   ├── security/
│   │   └── page.tsx   # Security page (/security)
│   ├── blog/
│   │   ├── page.tsx   # Blog listing (/blog)
│   │   └── [slug]/
│   │       └── page.tsx  # Individual post (/blog/[slug])
│   ├── contact/
│   │   └── page.tsx   # Contact page (/contact)
│   ├── demo/
│   │   └── page.tsx   # Demo request page (/demo)
│   ├── about/
│   │   └── page.tsx   # About page (/about)
│   ├── privacy/
│   │   └── page.tsx   # Privacy policy (/privacy)
│   ├── terms/
│   │   └── page.tsx   # Terms of service (/terms)
│   └── status/
│       └── page.tsx   # Status redirect (/status)
├── login/
│   └── page.tsx       # Universal login (/login)
└── [property-slug]/
    └── page.tsx       # Vanity URL login (/[property-slug])
```

### 3.2 Marketing Layout

The `(marketing)/layout.tsx` renders a layout that is completely different from the authenticated portal:

| Element            | Marketing Layout                                                                  | Portal Layout                                 |
| ------------------ | --------------------------------------------------------------------------------- | --------------------------------------------- |
| **Top navigation** | Horizontal navbar with logo, page links, "Login" button, and "Request a Demo" CTA | Sidebar navigation with role-aware menu items |
| **Sidebar**        | None                                                                              | Full sidebar with module links                |
| **Footer**         | Full footer with links, compliance badges, newsletter signup                      | Minimal footer or none                        |
| **Authentication** | Not required (public pages)                                                       | Required on every page                        |
| **Background**     | White with subtle section dividers                                                | White with content panels                     |

**Marketing navbar items:**

```
[Logo]  Features  Pricing  Security  Blog  About  Contact  |  Login  [Request a Demo]
```

On mobile (viewport width < 768px), the navbar collapses into a hamburger menu. The "Request a Demo" button remains visible outside the hamburger as a persistent CTA.

### 3.3 Rendering Strategy

| Page               | Rendering                            | Reason                                                                     |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------------- |
| `/` (landing)      | Static Generation (SSG)              | Content changes infrequently; needs fastest possible load                  |
| `/features`        | SSG                                  | Static content with client-side tab switching                              |
| `/pricing`         | SSG                                  | Static content with client-side billing toggle                             |
| `/security`        | SSG                                  | Static content                                                             |
| `/blog`            | SSG with ISR (revalidate: 3600)      | New posts added periodically; revalidate hourly                            |
| `/blog/[slug]`     | SSG with ISR (revalidate: 3600)      | Individual posts are static but may receive edits                          |
| `/contact`         | SSG (form submits via Server Action) | Static page; form submission is server-side                                |
| `/demo`            | SSG (form submits via Server Action) | Static page; demo creation is server-side                                  |
| `/about`           | SSG                                  | Static content                                                             |
| `/privacy`         | SSG                                  | Static content                                                             |
| `/terms`           | SSG                                  | Static content                                                             |
| `/status`          | SSG (redirect)                       | Immediately redirects to external status service                           |
| `/login`           | SSR (dynamic)                        | Must check session cookies, handle redirects, and support property routing |
| `/[property-slug]` | SSR (dynamic)                        | Must look up property by slug and render branded login                     |

### 3.4 Full Sitemap

```
concierge.com/
├── /                       Landing page (hero, features, social proof, CTAs)
├── /features               Feature showcase with role-based tabs and module deep-dives
├── /pricing                Three-tier pricing with feature matrix and FAQ
├── /security               Compliance certifications, architecture overview, data handling
├── /blog                   Blog listing (categories, search, pagination)
├── /blog/[slug]            Individual blog post (MDX-rendered)
├── /contact                Contact form, support email, phone number
├── /demo                   Demo request form with instant-access option
├── /about                  Company story, team, mission statement
├── /privacy                Privacy policy (PIPEDA and GDPR compliant)
├── /terms                  Terms of service
├── /status                 Redirect to external status page (e.g., Betterstack)
├── /login                  Universal login with email routing and property code
└── /[property-slug]        Property-specific branded login (e.g., /maple-heights)
```

### 3.5 SEO Implementation

Every marketing page includes comprehensive SEO metadata.

**Per-page metadata (via Next.js `generateMetadata`):**

| Metadata                    | Implementation                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `<title>`                   | Unique per page. Format: `{Page Title} — Concierge` (e.g., "Features — Concierge")              |
| `<meta name="description">` | Unique per page. 150-160 characters. Includes primary keyword.                                  |
| `<link rel="canonical">`    | Self-referencing canonical URL for every page                                                   |
| Open Graph tags             | `og:title`, `og:description`, `og:image` (1200x630 preview image per page), `og:url`, `og:type` |
| Twitter Card tags           | `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`   |
| Structured data (JSON-LD)   | See below                                                                                       |

**Structured data (JSON-LD) per page type:**

| Page                       | Schema Type                    | Key Properties                                                    |
| -------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| Landing (`/`)              | `SoftwareApplication`          | name, description, operatingSystem, applicationCategory, offers   |
| Pricing (`/pricing`)       | `Product` with `offers` array  | name, description, offers (3 tiers with `price`, `priceCurrency`) |
| Blog listing (`/blog`)     | `Blog`                         | name, description, blogPost references                            |
| Blog post (`/blog/[slug]`) | `BlogPosting`                  | headline, datePublished, dateModified, author, image              |
| About (`/about`)           | `Organization`                 | name, description, url, logo, foundingDate, address               |
| Contact (`/contact`)       | `ContactPage` + `Organization` | telephone, email, address                                         |
| FAQ section on pricing     | `FAQPage`                      | mainEntity array of Question/Answer pairs                         |

**Technical SEO files:**

| File          | Location                              | Content                                                                                        |
| ------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `sitemap.xml` | `app/sitemap.ts` (dynamic generation) | All marketing pages + all published blog post slugs. Updated at build time and via ISR.        |
| `robots.txt`  | `app/robots.ts`                       | Allows all marketing pages. Disallows `/login`, `/[property-slug]`, and all `(portal)` routes. |

### 3.6 Internationalization (i18n)

Concierge targets the Canadian market, which requires English and French-Canadian support.

**Implementation:**

| Aspect             | Approach                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| URL structure      | Subdirectory routing: `concierge.com/en/features`, `concierge.com/fr/features`                                             |
| Default locale     | English (`en`). French (`fr-CA`) as secondary.                                                                             |
| Content management | Separate MDX files per locale for blog posts. JSON translation files for UI strings.                                       |
| Detection          | Browser `Accept-Language` header on first visit. Stored in cookie for subsequent visits.                                   |
| Switcher           | Language toggle in the footer and navbar (flag icon + language name)                                                       |
| SEO                | `hreflang` tags on every page pointing to the alternate locale version                                                     |
| Fallback           | If a French translation is missing, fall back to English with a subtle banner: "This page is not yet available in French." |
| Blog               | Blog posts can be published in one or both languages. Untranslated posts show English version with a translation notice.   |

### 3.7 Analytics

| Aspect         | Specification                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider       | Plausible Analytics (primary choice) or PostHog (if product analytics are needed)                                                                                                         |
| Cookie-free    | Yes. Neither Plausible nor PostHog in cookieless mode requires cookie consent banners.                                                                                                    |
| Events tracked | Page views, CTA clicks ("Request a Demo", "Start Free Trial", "See Pricing"), form submissions (demo, contact), blog post reads, pricing toggle (monthly vs annual), feature tab switches |
| Goals          | Demo request form submission, contact form submission, login page visit, pricing page visit                                                                                               |
| Dashboard      | Accessible to the Concierge internal marketing team only (not exposed to customers)                                                                                                       |
| GDPR/PIPEDA    | Both Plausible and PostHog can be configured to comply with PIPEDA and GDPR. No personal data is collected.                                                                               |
| Script loading | Loaded asynchronously. Does not block page rendering. Deferred with `next/script` strategy `afterInteractive`.                                                                            |

---

## 4. Landing Page

The landing page (`/`) is the most important page on the marketing website. It must communicate Concierge's value proposition within 5 seconds and give prospects a clear path to learn more or request a demo.

### 4.1 Page Structure (Top to Bottom)

The landing page is divided into 8 sections. Each section has exactly one purpose and one call to action.

#### Section 1: Hero

| Element            | Specification                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Headline**       | Large (48px desktop / 32px mobile), bold. Example: "The modern way to manage your building."                                                                                                                                                                        |
| **Subheadline**    | 20px, regular weight, neutral-600 color. One sentence expanding the headline. Example: "Security logging, package tracking, maintenance requests, amenity bookings, and resident communication — all in one platform built for Canadian properties."                |
| **Primary CTA**    | Button: "Request a Demo" → navigates to `/demo`. Uses `interactive-primary` color.                                                                                                                                                                                  |
| **Secondary CTA**  | Text link: "See Pricing →" → navigates to `/pricing`. Underlined, neutral-500 color.                                                                                                                                                                                |
| **Product visual** | Right side of hero (desktop) or below CTAs (mobile). Options: (a) Auto-playing muted video showing a 15-second walkthrough of the Security Console, or (b) Static screenshot of the Security Console dashboard with subtle CSS animation (e.g., a card sliding in). |
| **Compliance bar** | Below the hero, full-width muted background. Small logos: SOC 2, ISO 27001, ISO 27701, PIPEDA. Text: "Enterprise-grade security for Canadian properties."                                                                                                           |

**Desktop layout**: Two-column. Text on left (50%), product visual on right (50%). Vertically centered.
**Mobile layout**: Single column. Text on top, product visual below CTAs.

#### Section 2: Social Proof

| Element            | Specification                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Customer count** | "Trusted by X+ properties across Canada" in neutral-500 text, centered.                                                              |
| **Logo strip**     | Horizontal row of property management company logos (grayscale, hover to color). Minimum 6 logos. Auto-scrolling carousel on mobile. |

This section is narrow (120px tall on desktop). It serves as a trust signal between the hero and the feature highlights.

#### Section 3: Feature Highlights

Six feature cards in a 3x2 grid (desktop) or single column (mobile).

| Card | Icon                | Title                | Description (1 sentence)                                                           |
| ---- | ------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| 1    | Shield icon         | Security Console     | Log visitors, incidents, and shift notes in a unified real-time stream.            |
| 2    | Package icon        | Package Tracking     | Scan, notify, and release packages with courier-branded cards and label printing.  |
| 3    | Wrench icon         | Maintenance Requests | Submit, assign, and track work orders with photo uploads and vendor assignment.    |
| 4    | Calendar icon       | Amenity Booking      | Reserve party rooms, gyms, and guest suites with approval workflows and payment.   |
| 5    | Megaphone icon      | Announcements        | Send building-wide announcements via email, SMS, push, and lobby displays.         |
| 6    | Graduation cap icon | Staff Training       | Train concierge and security staff with courses, quizzes, and completion tracking. |

**Card design:**

- White background, 1px `neutral-200` border, 8px border-radius
- Icon: 48px, `interactive-primary` color
- Title: 18px, `font-semibold`, `neutral-900`
- Description: 14px, `neutral-600`
- Hover effect: subtle shadow elevation (`shadow-md`)
- Click action: navigates to `/features` with the corresponding module section scrolled into view

#### Section 4: Role-Based Showcase

This section demonstrates Concierge's key differentiator: every role gets a purpose-built interface.

| Element              | Specification                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Section headline** | "Built for every role in your building"                                                                                                                |
| **Subheadline**      | "One platform, four purpose-built experiences."                                                                                                        |
| **Tab bar**          | Four tabs: Concierge, Security, Manager, Resident. Horizontal, centered. Active tab has `interactive-primary` underline.                               |
| **Tab content**      | Two-column layout (desktop). Left: list of 4-5 features specific to that role. Right: screenshot of the Concierge interface as that role would see it. |

**Tab content per role:**

| Tab           | Feature List                                                                                                                                                                                                           | Screenshot                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Concierge** | 1. Package intake with courier logo scanning, 2. Visitor registration with ID capture, 3. Shift handoff notes and live counts, 4. Per-unit front desk instructions, 5. Quick-create buttons for all event types        | Security Console in Concierge view |
| **Security**  | 1. Incident reporting with emergency service tracking, 2. Parking violation lifecycle management, 3. FOB and key checkout tracking, 4. Emergency contact quick lookup, 5. Real-time event stream from all entry points | Security Console in Security view  |
| **Manager**   | 1. Maintenance dashboard with SLA tracking, 2. Vendor compliance monitoring, 3. Cross-property portfolio reports, 4. Amenity revenue and utilization analytics, 5. Staff performance and training completion           | Management dashboard               |
| **Resident**  | 1. Track your packages in real time, 2. Submit and monitor maintenance requests, 3. Book amenities with instant confirmation, 4. View building announcements, 5. Update your contact information and preferences       | Resident portal dashboard          |

**Interaction**: Clicking a tab instantly swaps the content (client-side state, no page reload). On mobile, tabs become a horizontal scroll or dropdown selector.

#### Section 5: How It Works

A 3-step process section showing how easy it is to get started.

| Step | Icon           | Title                   | Description                                                                                             |
| ---- | -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| 1    | Clipboard icon | "Request a demo"        | "Fill out a 30-second form. We'll create a personalized demo environment with your building's details." |
| 2    | Play icon      | "Explore the platform"  | "Walk through every feature with realistic data. Switch between roles to see every perspective."        |
| 3    | Rocket icon    | "Go live in 30 minutes" | "Our setup wizard imports your units, residents, and amenities. Your team is operational the same day." |

**Layout**: Three columns on desktop, stacked on mobile. Connected by a subtle horizontal line between step numbers.

#### Section 6: Testimonials

| Element          | Specification                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| **Layout**       | Carousel with 3 visible testimonial cards on desktop, 1 on mobile                                               |
| **Card content** | Quote text (2-3 sentences), person's name, role, property name, optional headshot                               |
| **Navigation**   | Left/right arrows, dot indicators, auto-advance every 6 seconds (pauses on hover)                               |
| **Design**       | White card with `neutral-100` background, left border in `interactive-primary` color, 16px quote text in italic |

Minimum 5 testimonials to ensure variety. Testimonials should represent different roles (property manager, board member, concierge, resident).

#### Section 7: Bottom CTA

A full-width section with a colored background (`interactive-primary` at 5% opacity) that drives conversion.

| Element            | Specification                                                                 |
| ------------------ | ----------------------------------------------------------------------------- |
| **Headline**       | "Ready to modernize your building management?"                                |
| **Primary CTA**    | "Request a Demo" button (large, `interactive-primary` background, white text) |
| **Secondary CTA**  | "See Pricing →" text link                                                     |
| **Assurance text** | Small text below CTAs: "No credit card required. Free 14-day trial."          |

#### Section 8: Footer

The footer appears on every marketing page, not just the landing page.

| Column         | Contents                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------- |
| **Product**    | Features, Pricing, Security, Status, Blog                                                   |
| **Company**    | About, Contact, Careers (placeholder)                                                       |
| **Legal**      | Privacy Policy, Terms of Service                                                            |
| **Support**    | Help Center (placeholder), Contact, System Status                                           |
| **Newsletter** | Email input + "Subscribe" button. Text: "Get product updates and building management tips." |

**Below columns:**

- Compliance badge row: SOC 2, ISO 27001, ISO 27701, ISO 27017, ISO 9001, PIPEDA, GDPR
- Copyright line: "2026 Concierge. All rights reserved."
- Social media icons (LinkedIn, Twitter/X) -- links to company profiles
- Language switcher: "English | Francais"

---

## 5. Features Page

The Features page (`/features`) provides a comprehensive overview of every module in Concierge, organized by role.

### 5.1 Page Structure

#### Top Section: Role-Based Tabs

Identical tab mechanism to the landing page role showcase (Section 4.1, Section 4) but with deeper content.

| Element                | Specification                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Headline**           | "Everything your building needs. Nothing it doesn't."                                                                               |
| **Subheadline**        | "Choose your role to see the features that matter to you."                                                                          |
| **Tab bar**            | Five tabs: All Features, Concierge, Security, Manager, Resident                                                                     |
| **"All Features" tab** | Shows every module. Default active tab.                                                                                             |
| **Role tabs**          | Filters to show only modules relevant to that role. Modules not relevant to the selected role are hidden entirely (not grayed out). |

#### Module Deep-Dives (Accordion Sections)

Below the tab bar, each module is an expandable accordion section. When collapsed, it shows the module name, icon, and a one-line summary. When expanded, it shows:

| Element              | Specification                                                      |
| -------------------- | ------------------------------------------------------------------ |
| **Module icon**      | 32px, `interactive-primary` color                                  |
| **Module name**      | 24px, `font-semibold`                                              |
| **Summary**          | One paragraph (2-3 sentences) describing what the module does      |
| **Key capabilities** | Bulleted list of 4-8 specific capabilities with brief descriptions |
| **Screenshot**       | A product screenshot showing the module in action (lazy-loaded)    |
| **CTA**              | "See it in the demo →" link that navigates to `/demo`              |

**Modules listed (in display order):**

| #   | Module                        | Summary Focus                                                      |
| --- | ----------------------------- | ------------------------------------------------------------------ |
| 1   | Security Console              | Unified event logging with 9+ entry types                          |
| 2   | Package Management            | Courier-branded tracking with scan, notify, release                |
| 3   | Maintenance Requests          | Work order lifecycle with photos, vendors, equipment               |
| 4   | Amenity Booking               | Calendar views, approval workflows, payment integration            |
| 5   | Announcements & Communication | Multi-channel distribution (email, SMS, push, lobby display)       |
| 6   | Unit Management               | Modular unit overview with custom fields and per-unit instructions |
| 7   | Resident Portal               | Self-service packages, maintenance, bookings, profile              |
| 8   | Staff Training (LMS)          | Courses, quizzes, completion tracking, certificates                |
| 9   | Parking Management            | Permits, violations, enforcement lifecycle                         |
| 10  | Reports & Analytics           | 23+ report types with Excel/PDF export                             |
| 11  | Settings & Administration     | Roles, event types, branding, notification rules                   |
| 12  | AI-Powered Intelligence       | Smart categorization, draft generation, anomaly detection          |

First 3 modules are expanded by default. The rest are collapsed. Clicking a module heading toggles its expanded/collapsed state.

#### Comparison Table: "Why Switch?"

Below the module accordions, a comparison table helps prospects evaluate Concierge against their current platform without naming specific competitors.

| Element                            | Specification                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Headline**                       | "Why switch to Concierge?"                                                                                                  |
| **Table columns**                  | Feature, Your Current Platform, Concierge                                                                                   |
| **"Your Current Platform" column** | Generic descriptions of common limitations (e.g., "6 hardcoded log types", "Email-only notifications", "No mobile support") |
| **"Concierge" column**             | Corresponding Concierge capability with a green checkmark                                                                   |
| **Row count**                      | 10-12 rows covering the most impactful differences                                                                          |

**Example rows:**

| Feature           | Your Current Platform        | Concierge                                       |
| ----------------- | ---------------------------- | ----------------------------------------------- |
| Event types       | Limited to predefined types  | Unlimited configurable types with custom fields |
| Notifications     | Email only                   | Email, SMS, push, voice, and lobby display      |
| Mobile access     | No mobile support            | Fully responsive on all devices                 |
| Role-based views  | Same interface for everyone  | Purpose-built dashboard per role                |
| Staff training    | Not available                | Built-in LMS with courses and quizzes           |
| Setup time        | Days of manual configuration | 30-minute guided setup wizard                   |
| Package tracking  | Text-based logs              | Courier-branded cards with photo capture        |
| Reporting         | Basic CSV exports            | 23+ report types with PDF/Excel                 |
| Real-time updates | Manual refresh required      | Live WebSocket updates across all screens       |
| Compliance        | Limited certifications       | SOC 2, ISO 27001, PIPEDA, GDPR                  |

#### Interactive Demo Embed

At the bottom of the Features page, an embedded read-only demo walkthrough.

| Element            | Specification                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Headline**       | "See it in action"                                                                                                                       |
| **Implementation** | Embedded iframe pointing to a read-only demo environment. Users can click through the interface but cannot create or modify data.        |
| **Fallback**       | If the demo environment is unavailable, show a video walkthrough instead with a "Request a personalized demo" CTA.                       |
| **Guided tour**    | Overlay tooltips walk the user through 5 key screens: Dashboard, Security Console, Package Management, Maintenance, and Amenity Booking. |
| **Role switcher**  | Dropdown inside the demo embed that switches the demo view between Concierge, Security, Manager, and Resident roles.                     |

---

## 6. Pricing Page

The Pricing page (`/pricing`) provides transparent pricing information for all three tiers.

### 6.1 Page Structure

#### Billing Toggle

| Element             | Specification                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **Toggle**          | Centered pill toggle: "Monthly"                                                                                                                                            | "Annual". Default: Annual. |
| **Annual discount** | When "Annual" is selected, show a badge: "Save 2 months" in `status-success` color.                                                                                        |
| **Price display**   | Prices update instantly when toggling (client-side state). Monthly shows per-month price. Annual shows per-month equivalent with total annual price in smaller text below. |

#### Tier Cards

Three pricing cards side by side on desktop, stacked on mobile. The Professional tier is visually emphasized as the recommended choice.

**Starter Tier:**

| Element          | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| **Name**         | Starter                                                  |
| **Target**       | "For small buildings and boutique condos"                |
| **Unit range**   | Up to 50 units                                           |
| **Price**        | $X/unit/month (monthly) or $X/unit/month billed annually |
| **CTA**          | "Start Free Trial" button (outlined style)               |
| **Feature list** | See feature matrix below                                 |

**Professional Tier:**

| Element             | Value                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| **Name**            | Professional                                                          |
| **Target**          | "For mid-size properties and management companies"                    |
| **Unit range**      | 50-300 units                                                          |
| **Price**           | $Y/unit/month (monthly) or $Y/unit/month billed annually              |
| **CTA**             | "Start Free Trial" button (filled `interactive-primary` style)        |
| **Badge**           | "Most Popular" badge in `interactive-primary` color at top of card    |
| **Feature list**    | See feature matrix below                                              |
| **Visual emphasis** | Slightly larger card, subtle shadow, `interactive-primary` top border |

**Enterprise Tier:**

| Element          | Value                                           |
| ---------------- | ----------------------------------------------- |
| **Name**         | Enterprise                                      |
| **Target**       | "For large portfolios and management companies" |
| **Unit range**   | 300+ units                                      |
| **Price**        | "Custom pricing" (no dollar amount)             |
| **CTA**          | "Contact Sales" button (outlined style)         |
| **Feature list** | See feature matrix below                        |

#### Feature Matrix

Below the tier cards, a detailed comparison table.

| Feature Category  | Feature                         | Starter           | Professional       | Enterprise    |
| ----------------- | ------------------------------- | ----------------- | ------------------ | ------------- |
| **Core**          | Security Console                | Yes               | Yes                | Yes           |
| **Core**          | Package Management              | Yes               | Yes                | Yes           |
| **Core**          | Maintenance Requests            | Yes               | Yes                | Yes           |
| **Core**          | Amenity Booking                 | Yes               | Yes                | Yes           |
| **Core**          | Announcements (Email)           | Yes               | Yes                | Yes           |
| **Core**          | Unit Management                 | Yes               | Yes                | Yes           |
| **Core**          | Resident Portal                 | Yes               | Yes                | Yes           |
| **Core**          | Shift Log                       | Yes               | Yes                | Yes           |
| **Core**          | Global Search                   | Yes               | Yes                | Yes           |
| **Communication** | SMS Notifications               | No                | Yes                | Yes           |
| **Communication** | Push Notifications              | No                | Yes                | Yes           |
| **Communication** | Voice Call Cascade              | No                | No                 | Yes           |
| **Communication** | Lobby Display Integration       | No                | Yes                | Yes           |
| **Advanced**      | Staff Training (LMS)            | No                | Yes                | Yes           |
| **Advanced**      | Reports & Analytics             | Basic (5 reports) | Full (23+ reports) | Full + Custom |
| **Advanced**      | Vendor Compliance               | No                | Yes                | Yes           |
| **Advanced**      | Equipment Tracking              | No                | Yes                | Yes           |
| **Advanced**      | Inspection Checklists           | No                | Yes                | Yes           |
| **Advanced**      | AI-Powered Features             | No                | Yes                | Yes           |
| **Advanced**      | Parking Management              | No                | Yes                | Yes           |
| **Admin**         | Custom Event Types              | Up to 10          | Unlimited          | Unlimited     |
| **Admin**         | Custom Fields per Module        | Up to 5           | Unlimited          | Unlimited     |
| **Admin**         | API Access                      | No                | Yes                | Yes           |
| **Admin**         | Two-Factor Authentication (2FA) | No                | Yes                | Yes           |
| **Admin**         | Login Audit Trail               | No                | Yes                | Yes           |
| **Enterprise**    | Multi-Property Dashboard        | No                | No                 | Yes           |
| **Enterprise**    | White-Label Branding            | No                | No                 | Yes           |
| **Enterprise**    | Dedicated Support Manager       | No                | No                 | Yes           |
| **Enterprise**    | SLA Guarantees                  | No                | No                 | Yes           |
| **Enterprise**    | SSO Integration                 | No                | No                 | Yes           |
| **Enterprise**    | Custom Onboarding               | No                | No                 | Yes           |
| **Support**       | Email Support                   | Yes               | Yes                | Yes           |
| **Support**       | Phone Support                   | No                | Yes                | Yes           |
| **Support**       | Priority Support                | No                | No                 | Yes           |
| **Storage**       | File Storage                    | 10 GB             | 50 GB              | Unlimited     |
| **Storage**       | Data Retention                  | 1 year            | 5 years            | Unlimited     |

#### FAQ Section

Below the feature matrix, an expandable FAQ accordion.

| Question                                             | Answer Summary                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| What happens after the free trial?                   | Your data is preserved. You choose a plan or export your data. No auto-charge.                                                     |
| Can I change plans later?                            | Yes. Upgrade or downgrade at any time. Prorated charges apply.                                                                     |
| What counts as a "unit"?                             | Any residential unit (apartment, condo, townhouse). Commercial units and amenity spaces do not count.                              |
| Is there a setup fee?                                | No. All plans include free onboarding with the setup wizard. Enterprise includes custom onboarding.                                |
| What payment methods do you accept?                  | Visa, Mastercard, American Express. Annual plans can pay by invoice/wire transfer.                                                 |
| Do you offer discounts for non-profits or co-ops?    | Yes. Contact us for special pricing for non-profit housing cooperatives.                                                           |
| What is included in "Custom Onboarding"?             | A dedicated implementation specialist who configures your property, imports data, and trains your staff on-site or via video call. |
| Can I import data from my current platform?          | Yes. We provide CSV/Excel import tools for units, residents, packages, maintenance history, and FOB records.                       |
| How does billing work for multi-property portfolios? | Enterprise plans consolidate billing across all properties. Volume discounts apply.                                                |
| What happens to my data if I cancel?                 | You have 30 days to export all data. After 30 days, data is permanently deleted per our retention policy.                          |

#### Bottom CTA

| Element      | Specification                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------- |
| **Headline** | "Still have questions?"                                                                         |
| **Text**     | "Our team is happy to walk you through the platform and find the right plan for your building." |
| **CTA**      | "Contact Sales" button → navigates to `/contact`                                                |

---

## 7. Login & Property Routing

This is the most technically complex section of the marketing website. The login experience must route users to the correct property portal quickly and without confusion.

### 7.1 Universal Login Page (`/login`)

The login page at `concierge.com/login` supports three entry methods. The page renders server-side (SSR) because it must check for existing session cookies and handle dynamic property routing.

**Page layout:**

| Element                 | Specification                                                           |
| ----------------------- | ----------------------------------------------------------------------- |
| **Logo**                | Concierge logo centered at top                                          |
| **Card**                | Centered card (480px max-width) with white background and subtle shadow |
| **Tab bar inside card** | Two tabs: "Email" (default), "Property Code"                            |
| **Below card**          | Link: "Don't have an account? Request a demo" → `/demo`                 |
| **Footer**              | Minimal: links to Privacy, Terms, Status, and language switcher         |

### 7.2 Entry Method A: Direct Vanity URL

When a user visits `concierge.com/[property-slug]` (e.g., `concierge.com/maple-heights`):

**Step-by-step flow:**

| Step | Action                                             | What the User Sees                                                                                                                              |
| ---- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | User types or clicks `concierge.com/maple-heights` | Loading spinner (< 500ms)                                                                                                                       |
| 2    | Server looks up property by slug in the database   | --                                                                                                                                              |
| 3a   | Property found                                     | Branded login page: property logo, property name, welcome message (if configured), primary color accent. Email input field + "Continue" button. |
| 3b   | Property NOT found                                 | Error page: "Property not found. Check the URL or try logging in at concierge.com/login." with a link to `/login`.                              |
| 4    | User enters email and clicks "Continue"            | Loading state on button                                                                                                                         |
| 5    | Server verifies email belongs to this property     | --                                                                                                                                              |
| 5a   | Email found                                        | Password input field appears (animated slide). "Forgot password?" link below.                                                                   |
| 5b   | Email NOT found at this property                   | Error: "No account found with this email at {property name}. Contact your building admin or try a different email."                             |
| 6    | User enters password and clicks "Sign In"          | Loading state on button                                                                                                                         |
| 7a   | Password correct, 2FA not enabled                  | Redirect to property dashboard                                                                                                                  |
| 7b   | Password correct, 2FA enabled                      | 2FA verification screen: 6-digit code input. "Resend code" link. 60-second cooldown.                                                            |
| 7c   | Password incorrect                                 | Error: "Incorrect password. You have {N} attempts remaining." Lockout after 5 failed attempts.                                                  |
| 8    | 2FA code verified                                  | Redirect to property dashboard                                                                                                                  |

**Branding on vanity URL login:**

| Branding Element                 | Source                              | Fallback                             |
| -------------------------------- | ----------------------------------- | ------------------------------------ |
| Property logo                    | `property.branding.logo_url`        | Concierge default logo               |
| Property name                    | `property.name`                     | "Concierge"                          |
| Welcome message                  | `property.branding.welcome_message` | "Welcome back. Sign in to continue." |
| Primary color (accents, buttons) | `property.branding.primary_color`   | Concierge default blue               |
| Background                       | Always white                        | --                                   |

### 7.3 Entry Method B: Email-Based Routing

When a user visits `concierge.com/login` and uses the "Email" tab:

**Step-by-step flow:**

| Step | Action                                                    | What the User Sees                                                                                                                                                                             |
| ---- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | User enters email address in the email field              | Standard email input with validation                                                                                                                                                           |
| 2    | User clicks "Continue"                                    | Loading state on button                                                                                                                                                                        |
| 3    | Server looks up all properties associated with this email | --                                                                                                                                                                                             |
| 4a   | Email belongs to exactly 1 property                       | Password input appears. Property name and logo shown above the password field as context: "Signing in to {property name}".                                                                     |
| 4b   | Email belongs to 2+ properties                            | Property picker screen: list of properties with logo, name, and address. User clicks one. Then password input appears.                                                                         |
| 4c   | Email belongs to 0 properties                             | Error: "No account found with this email. If you're a resident, contact your building administrator. If you're interested in Concierge, request a demo." with links to `/contact` and `/demo`. |
| 5    | User enters password (and 2FA if enabled)                 | Same flow as vanity URL steps 6-8                                                                                                                                                              |
| 6    | Authentication successful                                 | Redirect to the selected property's dashboard                                                                                                                                                  |

**Property picker card (for multi-property users):**

| Field                        | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| Property logo                | 40px thumbnail                                     |
| Property name                | Bold, 16px                                         |
| Property address             | 14px, `neutral-500`                                |
| User's role at this property | 12px badge (e.g., "Property Manager", "Concierge") |
| Click action                 | Selects this property, proceeds to password input  |

### 7.4 Entry Method C: Property Code

When a user visits `concierge.com/login` and switches to the "Property Code" tab:

**Step-by-step flow:**

| Step | Action                                                              | What the User Sees                                                                             |
| ---- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1    | User sees 6-character input field with placeholder: "e.g., MPL-HTS" | Masked input, auto-uppercased, auto-hyphenated after 3 characters                              |
| 2    | User enters property code and clicks "Continue"                     | Loading state                                                                                  |
| 3    | Server looks up property by code                                    | --                                                                                             |
| 3a   | Property found                                                      | Transition to branded login (same as vanity URL step 3a). Email field appears.                 |
| 3b   | Property NOT found                                                  | Error: "Property code not found. Check with your building administrator for the correct code." |
| 4    | Proceeds with email + password flow                                 | Same as vanity URL steps 4-8                                                                   |

**Property code format:**

- 7 characters including hyphen: 3 uppercase letters, hyphen, 3 uppercase letters (e.g., `MPL-HTS`)
- Storage: `Property.propertyCode` field (String, unique, 7 characters)
- Auto-generated when a property is created using the following algorithm:
  1. Take the first word of the property name and strip all vowels (A, E, I, O, U)
  2. Take the first 3 consonants (uppercase). If fewer than 3 consonants exist, pad with letters from the original word.
  3. Repeat for the second word of the property name
  4. Join with a hyphen: `{first3}-{second3}`
- Examples: "Maple Heights" strips to "MPL" + "HGHTS" first 3 = "HGH" ... but the canonical format uses `MPL-HTS` (first 3 consonants of each word)
- Collision handling: If the generated code already exists, randomize the last character (A-Z) until a unique code is found
- Admin can customize in Settings > Branding > Property Code
- Regeneration: Admin can regenerate the code at any time. The old code expires immediately with no redirect period.
- Uniqueness enforced at the database level
- Case-insensitive lookup (user can type `mpl-hts` or `MPL-HTS`)

### 7.5 Vanity URL System

Each property gets a URL slug that maps to a branded login page.

| Aspect               | Specification                                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL format           | `concierge.com/[slug]` where slug is 3-50 lowercase alphanumeric characters with hyphens                                                                                                                   |
| Configuration        | Admin sets in Settings > Branding > Custom URL Slug                                                                                                                                                        |
| Validation           | Must be unique across all properties. Cannot conflict with reserved routes (`features`, `pricing`, `login`, `demo`, `about`, `blog`, `contact`, `security`, `status`, `privacy`, `terms`, `api`, `admin`). |
| Default              | Auto-generated from property name (e.g., "Maple Heights Condos" becomes `maple-heights-condos`)                                                                                                            |
| Change               | Admin can change the slug. Old slug returns a 301 redirect to the new slug for 90 days, then 404.                                                                                                          |
| Physical signage use | The URL is designed to be printed on lobby signs, welcome packages, and business cards. Format: `concierge.com/maple-heights`                                                                              |

**Slug generation algorithm:**

The default slug is auto-generated from the property name using `slugify(propertyName)`:

1. Convert to lowercase
2. Replace `@` with `at`
3. Replace `#` with empty string
4. Replace all spaces and remaining special characters with hyphens
5. Collapse consecutive hyphens into a single hyphen
6. Trim hyphens from the start and end
7. Truncate to 50 characters (without cutting mid-word if possible)

| Input                      | Output                       |
| -------------------------- | ---------------------------- |
| Maple Heights Condominiums | `maple-heights-condominiums` |
| The Grand @ King West      | `the-grand-at-king-west`     |
| TSCC #2934                 | `tscc-2934`                  |

**Collision handling:** If the generated slug already exists, append `-2`. If that also exists, try `-3`, and so on (e.g., `maple-heights-2`). Admin can override the auto-generated slug at any time in Settings > Branding > Custom URL Slug. When a slug is changed, the old slug is stored in a `slug_redirects` table with a 90-day expiry. During those 90 days, requests to the old slug receive a 301 redirect to the new slug via middleware. After 90 days, the redirect is removed and the old slug returns 404.

**Reserved route list (vanity slugs cannot use these):**

```
features, pricing, login, demo, about, blog, contact, security, status,
privacy, terms, api, admin, dashboard, settings, help, docs, changelog,
health, robots.txt, sitemap.xml, favicon.ico, en, fr
```

### 7.6 "Remember Property" Feature

| Aspect             | Specification                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Checkbox**       | "Remember this property" checkbox on the login form (checked by default)                                                                                                                             |
| **Storage**        | Saves the property ID and slug in a secure, HttpOnly cookie (not localStorage)                                                                                                                       |
| **Behavior**       | Next time the user visits `/login`, the system detects the cookie and pre-loads the property's branding and name. The email field is pre-focused.                                                    |
| **Multi-property** | If a user belongs to multiple properties, the "remembered" property is the most recently logged-in one. The property picker still appears if the user clears the cookie or uses a different browser. |
| **Expiry**         | Cookie expires after 90 days of inactivity                                                                                                                                                           |

### 7.7 Error States

Every error state must show a clear message with a suggested next action.

| Error                              | Message                                                                                             | Suggested Action                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Invalid email format               | "Please enter a valid email address."                                                               | Highlight the email input in red.                                    |
| Email not found                    | "No account found with this email."                                                                 | "Contact your building admin" link + "Request a demo" link.          |
| Wrong password                     | "Incorrect password. {N} attempts remaining."                                                       | "Forgot password?" link.                                             |
| Account locked (5 failed attempts) | "Your account has been locked for security. Try again in 30 minutes or contact your administrator." | "Contact administrator" link + timer showing remaining lockout time. |
| Property not found (vanity URL)    | "This property URL does not exist."                                                                 | "Try logging in at concierge.com/login" link.                        |
| Property not found (property code) | "Property code not found."                                                                          | "Check with your building administrator for the correct code."       |
| 2FA code expired                   | "This code has expired. A new code has been sent."                                                  | Auto-resend new code. Show "Resend" link with 60-second cooldown.    |
| 2FA code incorrect                 | "Incorrect verification code. Please try again."                                                    | Keep input focused, clear the field.                                 |
| Demo expired                       | "This demo environment has expired."                                                                | "Request a new demo" link to `/demo`.                                |
| Account disabled                   | "Your account has been disabled by your administrator."                                             | "Contact your building administrator."                               |
| Session expired                    | "Your session has expired. Please sign in again."                                                   | Pre-fill email, focus on password field.                             |
| Server error                       | "Something went wrong. Please try again."                                                           | "Try again" button + "Contact support" link.                         |

### 7.8 Post-Authentication Redirect

After successful authentication:

| Scenario                                                                   | Redirect Target                                                      |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| User logged in via vanity URL                                              | Property dashboard for that property                                 |
| User logged in via email (single property)                                 | Property dashboard                                                   |
| User logged in via email (multi-property, selected one)                    | Dashboard of the selected property                                   |
| User logged in via property code                                           | Property dashboard for that property                                 |
| User was trying to access a specific page before being redirected to login | The original requested page (stored in `redirectTo` query parameter) |
| Demo user                                                                  | Demo property dashboard with orange "DEMO" badge                     |

---

## 8. Demo Request Page

The Demo Request page (`/demo`) is the primary lead generation form for Concierge.

### 8.1 Page Layout

| Element                         | Specification                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Headline**                    | "See Concierge in action"                                                                          |
| **Subheadline**                 | "Get a personalized demo environment with realistic data. Explore every feature at your own pace." |
| **Two-column layout (desktop)** | Left: form. Right: benefits list + screenshot.                                                     |
| **Single-column (mobile)**      | Form on top, benefits below.                                                                       |

### 8.2 Form Fields

| Field                   | Type                                                            | Required | Validation                                                                                                           | Placeholder/Help                     |
| ----------------------- | --------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Full name               | Text input                                                      | Yes      | Min 2 characters                                                                                                     | "Jane Smith"                         |
| Work email              | Email input                                                     | Yes      | Valid email format. Reject free email domains (gmail, yahoo, hotmail) with suggestion: "Please use your work email." | "jane@company.com"                   |
| Company name            | Text input                                                      | Yes      | Min 2 characters                                                                                                     | "Acme Property Management"           |
| Number of properties    | Number input (or dropdown: 1, 2-5, 6-20, 20+)                   | Yes      | --                                                                                                                   | "How many properties do you manage?" |
| Number of units (total) | Number input (or dropdown: <50, 50-100, 100-300, 300-500, 500+) | Yes      | --                                                                                                                   | "Total units across all properties"  |
| Current platform        | Dropdown                                                        | No       | Options: "None (manual/paper-based)", "Spreadsheets", "Other software", "Prefer not to say"                          | "What do you currently use?"         |
| Phone number            | Tel input                                                       | No       | Valid phone format (Canadian/US)                                                                                     | "+1 (416) 555-0100"                  |

**Submit button:** "Request a Demo" (full-width, `interactive-primary`).

**Below submit:**

- "Or try it right now →" link that triggers instant demo creation (see Section 8.3)
- "By submitting, you agree to our Privacy Policy." with link to `/privacy`

### 8.3 On Form Submission

| Step | Action                                                                 | What the User Sees                                                                                                                                                                                  |
| ---- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Form submits via Server Action                                         | Loading state on button, form disabled                                                                                                                                                              |
| 2    | Server validates all fields                                            | If validation fails, show inline errors per field                                                                                                                                                   |
| 3    | Server creates a demo property environment (calls demo seeder)         | Progress indicator: "Creating your demo environment..."                                                                                                                                             |
| 4    | Server generates demo credentials (email: user's email, temp password) | --                                                                                                                                                                                                  |
| 5    | Server sends email with demo credentials and a direct login link       | --                                                                                                                                                                                                  |
| 6    | Server creates a CRM lead record (or sends webhook to CRM)             | --                                                                                                                                                                                                  |
| 7    | Server schedules a follow-up sales call (or sends calendar invite)     | --                                                                                                                                                                                                  |
| 8    | Success screen                                                         | "Your demo is ready!" with: (a) "Open Demo Now" button that logs user in directly, (b) "We've also emailed your credentials to {email}", (c) "A member of our team will reach out within 24 hours." |

### 8.4 Instant Access ("Try It Now")

| Aspect               | Specification                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trigger**          | "Try it right now" link below the main form                                                                                                                                                    |
| **Required fields**  | Only email address (work email, same validation)                                                                                                                                               |
| **Flow**             | Enter email → creates demo property instantly → redirects to demo dashboard → sends credentials email in background                                                                            |
| **Demo environment** | Uses the standard "Maple Heights" template (200 units, full mock data)                                                                                                                         |
| **Expiry**           | Demo expires after 14 days of inactivity                                                                                                                                                       |
| **Limit**            | 1 instant demo per email address. If the email already has an active demo, redirect to the existing demo with a message: "You already have an active demo. Click below to continue exploring." |

### 8.5 Automated Follow-Up Email Sequence

| Email | Timing    | Subject                                 | Content Focus                                              |
| ----- | --------- | --------------------------------------- | ---------------------------------------------------------- |
| 1     | Immediate | "Your Concierge demo is ready"          | Login credentials, direct link, 3 things to try first      |
| 2     | Day 2     | "Did you explore the Security Console?" | Highlight the most impressive feature, link to guided tour |
| 3     | Day 5     | "How Concierge saves 2 hours per shift" | Case study or value proposition, link to demo              |
| 4     | Day 10    | "Your demo expires in 4 days"           | Urgency, schedule a call CTA, link to pricing              |
| 5     | Day 14    | "Your demo has expired"                 | Recap, "Reactivate demo" link, schedule a call CTA         |

Each email includes an unsubscribe link. If the user logs into the demo, the sequence adapts (e.g., skips the "did you explore" email if they already did).

---

## 9. Other Pages

### 9.1 Security Page (`/security`)

| Section                   | Content                                                                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hero**                  | "Security you can trust" headline. "Your residents' data deserves enterprise-grade protection."                                                                                                                 |
| **Compliance badges**     | Large visual badges with descriptions: SOC 2 Type II, ISO 27001, ISO 27701, ISO 27017, ISO 9001, PIPEDA, GDPR, HIPAA                                                                                            |
| **Architecture overview** | High-level diagram showing: encrypted data at rest (AES-256), encrypted in transit (TLS 1.3), multi-tenant isolation, automated backups, disaster recovery. No implementation details that could aid attackers. |
| **Data handling**         | Where data is stored (Canadian data centers), retention policies, backup frequency (daily), RTO/RPO targets                                                                                                     |
| **Access controls**       | Role-based access, 2FA, session management, login audit trail                                                                                                                                                   |
| **Penetration testing**   | Annual third-party penetration test schedule, responsible disclosure program                                                                                                                                    |
| **Bug bounty**            | Responsible disclosure policy with security contact email                                                                                                                                                       |
| **CTA**                   | "Download our Security Whitepaper" (PDF, gated behind email) + "Contact our security team"                                                                                                                      |

### 9.2 About Page (`/about`)

| Section               | Content                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------- |
| **Company story**     | Why Concierge was built. The problem with existing building management software. The vision. |
| **Mission statement** | One clear sentence about Concierge's mission.                                                |
| **Team**              | Photos, names, roles, and short bios for key team members.                                   |
| **Values**            | 3-5 company values with brief descriptions.                                                  |
| **CTA**               | "Join our team" (link to careers, placeholder) + "Get in touch" (link to `/contact`)         |

### 9.3 Blog (`/blog`)

| Aspect                 | Specification                                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content format**     | MDX files stored in `content/blog/` directory. Each post is a `.mdx` file with frontmatter.                                                                                      |
| **Frontmatter fields** | `title`, `slug`, `date`, `author`, `category`, `tags[]`, `excerpt`, `coverImage`, `locale` (en or fr-CA), `published` (boolean)                                                  |
| **Listing page**       | Grid of blog post cards (3 columns desktop, 1 mobile). Each card: cover image, title, excerpt, date, category badge, author name.                                                |
| **Categories**         | Product Updates, Building Management Tips, Security & Compliance, Customer Stories, Industry Insights                                                                            |
| **Search**             | Text search across title, excerpt, and tags. Client-side filtering (static site, no server search).                                                                              |
| **Pagination**         | 12 posts per page. Numbered pagination at bottom.                                                                                                                                |
| **Individual post**    | Full MDX rendering with code blocks, images, callouts, and embedded components. Table of contents sidebar on desktop. Social sharing buttons. "Related posts" section at bottom. |
| **RSS feed**           | Auto-generated RSS feed at `/blog/feed.xml`                                                                                                                                      |

### 9.4 Contact Page (`/contact`)

| Element           | Specification                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Form fields**   | Name (required), email (required), subject (dropdown: Sales, Support, Partnership, Other), message (required, textarea) |
| **Contact info**  | Support email, phone number (with business hours), physical address                                                     |
| **Response time** | "We typically respond within 24 hours."                                                                                 |
| **Submit action** | Server Action that sends email to the Concierge support inbox and creates a CRM record                                  |

### 9.5 Privacy Policy (`/privacy`)

| Aspect           | Specification                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Content**      | Full PIPEDA and GDPR-compliant privacy policy                                                                                            |
| **Format**       | MDX with table of contents, section anchors, and "Last updated" date                                                                     |
| **Key sections** | Data collected, how data is used, data sharing, data retention, user rights (access, correction, deletion), cookies, contact information |
| **Language**     | Available in English and French-Canadian                                                                                                 |

### 9.6 Terms of Service (`/terms`)

| Aspect           | Specification                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Content**      | Standard SaaS terms of service                                                                                          |
| **Format**       | MDX with table of contents, section anchors, and "Last updated" date                                                    |
| **Key sections** | Account terms, payment terms, cancellation policy, data ownership, liability limitations, acceptable use, SLA reference |
| **Language**     | Available in English and French-Canadian                                                                                |

### 9.7 Status Page (`/status`)

| Aspect             | Specification                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Implementation** | Not hosted on Concierge. Redirects (302) to an external status service (e.g., Betterstack, Instatus).                                 |
| **Why external**   | If Concierge itself is down, the status page must still be accessible. External hosting guarantees availability.                      |
| **Link**           | The `/status` route performs a server-side redirect to the configured external URL.                                                   |
| **Fallback**       | If no external status URL is configured, show a simple page: "System status: All systems operational" with a link to contact support. |

---

## 10. Responsive Design

### 10.1 Design Philosophy

Consistent with the rest of the Concierge platform, the marketing website is designed for **desktop monitors first** (1920px viewport). Most prospects evaluating building management software are property managers sitting at a desktop computer. However, all pages must be fully functional on tablet and mobile devices.

### 10.2 Breakpoints

| Breakpoint           | Width           | Layout Adjustments                                                                                                    |
| -------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Desktop large**    | 1440px+         | Max-width content container (1200px), centered. Full multi-column layouts.                                            |
| **Desktop standard** | 1024px - 1439px | Same layout as large, slightly compressed spacing.                                                                    |
| **Tablet**           | 768px - 1023px  | Two-column layouts become single-column. Pricing cards stack vertically. Feature comparison table becomes scrollable. |
| **Mobile**           | < 768px         | Single-column layout. Hamburger navigation. Stacked pricing cards. Accordion-only feature display.                    |

### 10.3 Navigation Behavior

| Viewport         | Navigation Style                                                                                                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop (768px+) | Horizontal navbar with all links visible. "Request a Demo" button always visible. Logo on left, links centered, CTAs on right.                                                                                                                       |
| Mobile (< 768px) | Logo on left, hamburger icon on right. "Request a Demo" button remains visible next to the hamburger (persistent CTA). Hamburger opens a full-screen overlay with all navigation links, large tap targets (48px minimum height), and a close button. |

### 10.4 Touch Optimization

| Element                 | Touch Specification                                |
| ----------------------- | -------------------------------------------------- |
| All buttons             | Minimum 44px height, 16px horizontal padding       |
| All links in navigation | Minimum 48px tap target height                     |
| Form inputs             | 48px height, 16px font size (prevents iOS zoom)    |
| Carousel navigation     | Swipe gesture support in addition to arrow buttons |
| Tab switching           | Horizontal swipe to switch tabs on mobile          |

---

## 11. Performance & Technical

### 11.1 Core Web Vitals Targets

| Metric                                                            | Target                       | How                                                                                                                                   |
| ----------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **LCP (Largest Contentful Paint)**                                | < 2.5 seconds                | Static generation, edge caching, optimized hero image/video, preloaded fonts                                                          |
| **FID (First Input Delay)** / **INP (Interaction to Next Paint)** | < 100ms (FID), < 200ms (INP) | Minimal client-side JavaScript on marketing pages, defer analytics scripts, avoid layout-blocking operations                          |
| **CLS (Cumulative Layout Shift)**                                 | < 0.1                        | Explicit width/height on all images and videos, font `display: swap` with size-adjust, no dynamically injected content above the fold |

### 11.2 Image Optimization

| Aspect                | Implementation                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Format**            | AVIF (primary), WebP (fallback), PNG/JPEG (legacy fallback). Served via `next/image` component which auto-negotiates format.                                              |
| **Sizing**            | All images use `next/image` with explicit `width` and `height` attributes. Responsive `sizes` attribute provided for all images (e.g., `(max-width: 768px) 100vw, 50vw`). |
| **Hero image/video**  | Preloaded with `priority` prop on `next/image` or `<link rel="preload">` for video.                                                                                       |
| **Below-fold images** | Lazy loaded (default `next/image` behavior).                                                                                                                              |
| **Blog images**       | Served from a CDN. MDX image component wraps `next/image` with automatic optimization.                                                                                    |
| **Logo strip**        | SVG format for company logos (scalable, small file size).                                                                                                                 |

### 11.3 Font Loading

| Aspect               | Implementation                                                                   |
| -------------------- | -------------------------------------------------------------------------------- |
| **Primary font**     | Inter (via `next/font/google` for automatic optimization)                        |
| **Display strategy** | `display: swap` to prevent invisible text during font load                       |
| **Size adjust**      | `size-adjust` CSS property on the fallback font to minimize CLS when Inter loads |
| **Subsetting**       | Only load Latin character set for English. Load Latin Extended for French.       |

### 11.4 Lazy Loading

| Content                                 | Strategy                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Above-fold content (hero, social proof) | Eagerly loaded. No lazy loading.                                                                |
| Feature highlight cards                 | Lazy loaded with `IntersectionObserver`. Fade-in animation on entry.                            |
| Testimonial carousel                    | Lazy loaded. Placeholder height reserved to prevent CLS.                                        |
| Interactive demo embed (iframe)         | Lazy loaded. Shows a screenshot placeholder until the user scrolls to it or clicks "Load demo". |
| Blog post images                        | Lazy loaded (default `next/image`).                                                             |
| Footer                                  | Not lazy loaded (small, always rendered).                                                       |

### 11.5 Edge Caching

| Content Type                    | Cache Strategy                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Static marketing pages          | CDN edge cache, revalidate on deploy (ISR with `revalidate: false` for fully static pages) |
| Blog listing                    | CDN edge cache, `revalidate: 3600` (1 hour)                                                |
| Blog posts                      | CDN edge cache, `revalidate: 3600` (1 hour)                                                |
| Login page                      | No cache (SSR, dynamic)                                                                    |
| Vanity URL pages                | No cache (SSR, dynamic, includes property branding)                                        |
| Static assets (JS, CSS, images) | Immutable cache headers (hashed filenames), CDN edge cache, 1-year max-age                 |

### 11.6 JavaScript Budget

| Page          | Target JS Bundle (gzipped)                            |
| ------------- | ----------------------------------------------------- |
| Landing page  | < 80 KB                                               |
| Features page | < 100 KB (includes tab switching and accordion logic) |
| Pricing page  | < 60 KB (includes toggle logic)                       |
| Blog post     | < 50 KB                                               |
| Login page    | < 70 KB (includes form validation and routing logic)  |

Marketing pages use React Server Components by default. Only interactive elements (tab switcher, billing toggle, carousel, form validation) ship client-side JavaScript.

---

## 12. Edge Cases

### 12.1 Vanity URL Conflicts

| Scenario                                                              | Handling                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User tries a vanity URL that does not exist (`/nonexistent-property`) | Server checks if the slug matches a known property. If not, check if it matches a reserved route. If neither, render a 404 page: "This property page does not exist. You can log in at concierge.com/login." HTTP status code: 404. |
| Two properties try to claim the same slug                             | The database enforces uniqueness on the `slug` column. The second property's admin sees an inline validation error: "This URL is already in use. Please choose a different one."                                                    |
| Property changes its slug                                             | The old slug returns a 301 redirect to the new slug for 90 days. After 90 days, the old slug becomes available for other properties and returns 404. A `slug_redirects` table tracks old-to-new mappings with expiry dates.         |
| Slug conflicts with a reserved route                                  | The slug validation regex rejects any value in the reserved route list. The admin sees: "This URL is reserved. Please choose a different one." The reserved list is maintained in a single constant in the codebase.                |
| Slug contains invalid characters                                      | Client-side validation restricts input to lowercase letters, numbers, and hyphens. Server-side validation rejects anything that does not match `^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$`.                                                 |

### 12.2 User Belongs to No Properties

| Scenario                                                           | Handling                                                                                                                                                                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User enters an email at `/login` that has no associated properties | Error message: "No account found with this email address." Two action links: (a) "If you're a resident, contact your building administrator to get set up." (b) "If you're evaluating Concierge, request a demo." |
| User's only property has been deactivated                          | Error message: "Your property account is currently inactive. Contact your property administrator for assistance."                                                                                                 |
| User enters a valid email but their account is disabled            | Error message: "Your account has been disabled. Contact your building administrator." No password prompt is shown.                                                                                                |

### 12.3 Demo Environment Edge Cases

| Scenario                                                 | Handling                                                                                                                                                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo environment creation fails (e.g., database error)   | Show error: "We couldn't create your demo right now. Please try again in a few minutes or contact us at {support email}." Log the error for engineering. Retry button on the error screen.                                 |
| User requests a second demo with the same email          | If the existing demo is still active (not expired), redirect to it: "You already have an active demo. Click below to continue exploring." If expired, create a new one.                                                    |
| Demo environment reaches 14-day expiry                   | Day 12: send reminder email. Day 14: disable login with message: "Your demo has expired. Request a new demo or contact sales." Data retained for 30 more days (in case they reactivate). Day 44: data permanently deleted. |
| Demo user tries to access features not in the demo       | All features are available in the demo. No feature gating in demo mode. The demo environment includes data for every module.                                                                                               |
| Multiple simultaneous demo creations overload the seeder | Rate limit: maximum 10 demo environments created per minute globally. Queue excess requests with a message: "High demand. Your demo will be ready in approximately {N} minutes. We'll email you when it's ready."          |

### 12.4 Blog Edge Cases

| Scenario                                          | Handling                                                                                                                                                    |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blog post with invalid MDX (syntax error)         | Build-time MDX compilation catches syntax errors. The post is excluded from the build. A warning is logged. The blog listing does not show the broken post. |
| Blog post with missing frontmatter fields         | Build-time validation requires `title`, `slug`, `date`, and `published`. Missing required fields cause a build warning. The post is excluded.               |
| Blog post references an image that does not exist | `next/image` returns a broken image icon. A build-time check (custom Next.js plugin) scans MDX for image references and warns about missing files.          |
| User navigates to a blog slug that does not exist | 404 page: "This blog post does not exist. Browse all posts." Link to `/blog`.                                                                               |
| Blog post slug conflicts with another post        | Build-time check enforces unique slugs across all MDX files. Duplicate slugs cause a build error with a clear message identifying both files.               |

### 12.5 Form Submission Edge Cases

| Scenario                                          | Handling                                                                                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User submits demo form but JavaScript is disabled | Forms use Server Actions with progressive enhancement. The form submits as a standard POST request. The server processes it and returns a confirmation page.                                          |
| User double-clicks the submit button              | Button is disabled immediately on first click. Server-side deduplication by email + timestamp (5-minute window).                                                                                      |
| User submits with a disposable/temporary email    | Validation rejects known disposable email domains (maintained via an npm package like `disposable-email-domains`). Error: "Please use a permanent work email address."                                |
| Rate limiting on form submissions                 | Maximum 3 submissions per email per hour. Maximum 10 submissions per IP per hour. Excess attempts show: "Too many requests. Please try again later."                                                  |
| CRM webhook fails                                 | Form submission still succeeds from the user's perspective. The CRM webhook failure is logged and retried (3 retries with exponential backoff). Manual review queue for persistently failed webhooks. |

### 12.6 Performance Edge Cases

| Scenario                                       | Handling                                                                                                                                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User on slow connection (2G/3G)                | Critical CSS is inlined. Hero image has a low-quality placeholder (LQIP) that loads instantly. Below-fold content loads progressively.                                                                         |
| User has JavaScript disabled                   | Marketing pages render as static HTML (server-rendered). All content is visible. Interactive features (tabs, toggles, carousels) degrade to their default/first state. Forms work via progressive enhancement. |
| CDN edge cache is stale after a deploy         | ISR revalidation ensures pages update within the configured window. Critical updates can trigger on-demand revalidation via `revalidatePath()` in a deploy hook.                                               |
| High traffic spike (e.g., Product Hunt launch) | Static pages serve from CDN edge without hitting the origin server. Login and demo pages are the only dynamic routes. Demo creation is rate-limited (Section 12.3).                                            |

---

## 13. Accessibility

All marketing pages comply with WCAG 2.2 AA standards.

| Requirement           | Implementation                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Heading hierarchy** | Every page has exactly one `<h1>`. Subheadings follow `h2` > `h3` > `h4` order without skipping levels.                                                 |
| **Alt text**          | Every image has descriptive alt text. Decorative images use `alt=""`. Screenshots include alt text describing what the screenshot shows.                |
| **Color contrast**    | All text meets 4.5:1 contrast ratio (normal text) or 3:1 (large text) against its background. Verified with automated tooling in CI.                    |
| **Focus management**  | All interactive elements are keyboard-accessible. Focus order follows visual order. Focus indicators are visible (2px `interactive-primary` outline).   |
| **Skip navigation**   | "Skip to main content" link as the first focusable element on every page.                                                                               |
| **Form labels**       | Every form input has an associated `<label>` element. Error messages are associated with inputs via `aria-describedby`.                                 |
| **Landmarks**         | Proper use of `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>` landmarks.                                                                           |
| **Reduced motion**    | Animations respect `prefers-reduced-motion: reduce`. Carousel auto-advance stops. Fade-in animations are disabled.                                      |
| **Screen reader**     | Tab content changes announced via `aria-live` regions. Accordion expansion announced via `aria-expanded`. Carousel position announced via `aria-label`. |

---

## 14. Content Management

### 14.1 Static Pages

| Page                                        | Content Source                | Update Process            |
| ------------------------------------------- | ----------------------------- | ------------------------- |
| Landing, Features, Pricing, Security, About | Hardcoded in React components | Code change → PR → deploy |
| Privacy, Terms                              | MDX files in `content/legal/` | MDX edit → PR → deploy    |

### 14.2 Blog Posts

| Aspect            | Specification                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Storage**       | MDX files in `content/blog/en/` and `content/blog/fr-CA/`                                                                                     |
| **Authoring**     | Content team writes MDX in a code editor or CMS with MDX preview                                                                              |
| **Publishing**    | Set `published: true` in frontmatter → merge PR → ISR revalidates within 1 hour                                                               |
| **Draft preview** | `published: false` posts are accessible at `/blog/[slug]?preview=true` with a valid preview token (for content team review before publishing) |

### 14.3 Testimonials

| Aspect             | Specification                                                                      |
| ------------------ | ---------------------------------------------------------------------------------- |
| **Storage**        | JSON file: `content/testimonials.json`                                             |
| **Schema**         | `{ quote: string, name: string, role: string, property: string, avatar?: string }` |
| **Update process** | Edit JSON → PR → deploy                                                            |

---

## 15. Dependencies

| Dependency                       | What This PRD Needs From It                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| 01-Architecture                  | Multi-tenant data model, property configuration schema, API route patterns          |
| 02-Roles and Permissions         | Role definitions for role-based showcase content and login routing                  |
| 16-Settings Admin                | Property branding configuration (logo, color, slug, welcome message, property code) |
| 19-AI Framework                  | Not directly used on marketing pages, but referenced in feature descriptions        |
| BUSINESS-OPERATIONS.md Section 1 | Demo environment system for instant demo creation and guided walkthroughs           |
| BUSINESS-OPERATIONS.md Section 5 | White-label branding for vanity URL login pages                                     |
| BUSINESS-OPERATIONS.md Section 6 | Subscription tiers and pricing model for the pricing page                           |

---

_Last updated: 2026-03-16_
_Author: Concierge Product Team_
