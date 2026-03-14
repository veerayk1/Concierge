# Audit: 15-Search & Navigation PRD vs Research

> **Date**: 2026-03-14
> **Auditor**: Cross-reference audit
> **Research sources**: docs/search.md (Aquarius), docs/top-navigation.md (Aquarius), docs/platform-3/deep-dive-sidebar-navigation.md (Condo Control), docs/platform-3/deep-dive-dashboard.md (Condo Control -- Quick Search section)

---

## Summary

The Search & Navigation PRD (15-search-navigation.md) is the strongest of the three PRDs audited. It addresses every single competitive weakness identified in the research, introduces substantial innovations (Command Palette, semantic search, AI-powered suggestions, cross-module correlation), and provides detailed specs for all components. Every "What Gets Wrong" observation from Condo Control's sidebar navigation is explicitly fixed. Almost no features from the research are missing.

**Coverage score**: 97/100

---

## GAPS (Features in research but missing from PRD)

### GAP-1: Building-Specific Search Filter (Checkbox-Based)
- **Source**: Aquarius search.md -- "Select Building" checkbox-based building selection in left panel
- **What's missing**: The PRD's full search page (Section 3.6) includes a "Building" filter as a checkbox group, which covers this. However, the Command Palette (Section 3.1) does not mention a building filter or scoping. For multi-building properties, users searching from the command palette may get results from all buildings when they only care about one.
- **Impact**: Low. The command palette auto-scopes to the active property, and the full search page has the building filter.
- **Recommendation**: Add a note that command palette results are scoped to the user's active property. If multi-building, results from all buildings within the property are shown, but building name is included in result subtitles for disambiguation.

### GAP-2: Search Type Toggle (Full Search vs. Unit/People Search)
- **Source**: Aquarius search.md -- Two search modes: "Full Search" (default, across all content types) and "Unit/People Search" (focused on units and residents)
- **What's missing**: The PRD uses a unified search with automatic scope detection and result categories instead of distinct modes. This is a superior design. However, the Aquarius "Unit/People Search" mode essentially provides a pre-filtered view. The PRD's category grouping achieves the same result differently.
- **Impact**: None. The PRD's approach is better. Documented here for completeness.
- **Recommendation**: No change needed. The unified search with category grouping is the correct design choice.

---

## WEAK COVERAGE (Features present but underspecified)

### WEAK-1: Help Panel Integration
- **Source**: Condo Control deep-dive-sidebar-navigation.md -- Help button (lightbulb icon) opens slide-in panel with "How can we help?", search input, Contact Us, View My Cases, Contact Community Manager, Create support case
- **PRD coverage**: Section 3.8 (Top Navigation Bar) includes a "Help" item in the User Menu Dropdown that links to `/help`. However, the inline help panel with search, support case creation, and community manager contact described in Condo Control is not specified.
- **Recommendation**: Expand the Help item into a Help Panel specification (either in this PRD or a separate lightweight PRD). Include: help search, contextual help articles, support ticket creation link, and contact management link. This is a v2 feature but should be noted.

### WEAK-2: Call/Phone Quick Action in Top Bar
- **Source**: Condo Control deep-dive-sidebar-navigation.md -- Phone icon in top bar labeled "Call" for quick phone/contact feature. Condo Control deep-dive-dashboard.md -- Phone/handset icon labeled "Call"
- **PRD coverage**: The PRD's top navigation bar (Section 3.8) includes: hamburger menu, property switcher, search icon, notification bell, and user avatar. There is no phone/call icon.
- **Recommendation**: Consider adding a "Contact Management" or "Quick Dial" icon to the top bar for staff roles. This could open a panel showing the management office phone number, emergency contacts, and vendor contacts. Low priority.

### WEAK-3: User Guide / External Documentation Link
- **Source**: Condo Control deep-dive-sidebar-navigation.md -- "User Guide" sidebar item linking to external Zendesk help center
- **PRD coverage**: The PRD explicitly avoids external help links (listed as a pattern to avoid in Section 2). The user menu has "Help" linking to `/help`. However, the PRD does not specify what `/help` contains.
- **Recommendation**: Define the `/help` page contents. This could be an embedded help center with contextual articles, FAQs, and a search. Ensure it is internal (not an external Zendesk link).

### WEAK-4: Footer Links (System Status, Privacy, Mobile App Downloads)
- **Source**: Condo Control deep-dive-sidebar-navigation.md -- Footer with copyright, System Status link, Privacy link, Help Center link, App Store download, Google Play download
- **PRD coverage**: The PRD does not specify a global footer. The sidebar and top bar are covered, but no footer is mentioned.
- **Recommendation**: Add a minimal footer specification: copyright, privacy policy link, terms of service link, system status link, and mobile app download links (iOS/Android). This is a low-priority but expected component.

### WEAK-5: Sidebar Item Active State Visual Treatment
- **Source**: Condo Control deep-dive-sidebar-navigation.md -- "Active page is indicated by a left teal/green border bar on the submenu item"
- **PRD coverage**: Section 6.4 (Design Rules) specifies "Active nav item: primary blue (#007AFF) icon and label. Inactive: #8E8E93 gray." However, it does not mention a left border bar or other strong active indicator.
- **Recommendation**: Add a left border indicator (e.g., 3px solid primary blue on the left edge) for the active sidebar item in addition to the color change. This provides a stronger visual signal, especially for users with color vision deficiency.

### WEAK-6: Chat/Support Widget (Floating)
- **Source**: Condo Control deep-dive-dashboard.md -- "Circular teal/dark chat bubble icon" in bottom-right of every page, opens live chat or support widget
- **PRD coverage**: Not mentioned in any section. The PRD has help via the user menu but no floating support/chat widget.
- **Recommendation**: Defer to v2. If live chat support is planned, add a floating chat widget spec. Otherwise, the help panel in the user menu is sufficient.

### WEAK-7: Notification Icon Differentiation
- **Source**: Aquarius top-navigation.md -- "Camera/notification icon" separate from other navigation. Condo Control -- Help (lightbulb), Call (phone), User Avatar as separate icons
- **PRD coverage**: Section 3.4 covers the Notification Bell thoroughly. Section 3.8 lists the top bar elements. However, the distinction between different top-bar icon behaviors (some open dropdowns, some navigate) is not explicitly documented as interaction patterns.
- **Recommendation**: Minor. Add a note in Section 3.8 clarifying that the search icon opens the command palette (overlay), the notification bell opens a dropdown panel, and the user avatar opens a dropdown menu. Different interaction patterns for different icons.

---

## CONFIRMED (Features properly covered)

| # | Research Feature | PRD Section | Notes |
|---|-----------------|-------------|-------|
| 1 | Global search across all modules | 3.1, 3.6 | Command palette + full search page |
| 2 | Quick search always in top bar | 3.8 | Search icon with Cmd+K hint text |
| 3 | Cross-module search results grouped by type | 3.1, 3.6 | 8 result categories with per-role filtering |
| 4 | Collapsible sidebar with icon-only mode | 3.2 | Full spec with persistence and responsive behavior |
| 5 | Role-aware navigation (not alphabetical) | 3.2 | Ordered by workflow priority per role |
| 6 | Badge counters on sidebar items | 3.2 | 5 items with real-time WebSocket badges |
| 7 | Breadcrumb navigation | 3.3 | On every page with responsive collapse |
| 8 | Sidebar collapse toggle NOT styled as nav item | 3.2 | "Chevron icon (not styled as a nav item)" |
| 9 | No duplicate navigation links | 2 (Patterns to Avoid) | Explicitly listed as anti-pattern |
| 10 | Semantically meaningful icons per item | 2 (Patterns to Avoid), 3.2 | Explicitly addressed |
| 11 | Role indicator in sidebar | 3.2 | "User Identity Block" with avatar, name, role badge |
| 12 | Favorites/pinning of sidebar items | 3.2 | Max 3 pins, pinned items at top |
| 13 | Keyboard shortcuts | 3.1 | Full keyboard navigation: Cmd+K, arrows, enter, escape, tab, / key |
| 14 | Search filter checkboxes for content types | 3.6 | Content Type checkbox group in filter sidebar |
| 15 | Module-specific search result pagination | 3.6 | "Load More" pagination with 20 results per page |
| 16 | No autocomplete (Condo Control weakness) | 3.1, 7.2 | FIXED: AI-powered context-aware suggestions with 300ms debounce |
| 17 | Top bar icons (search, help, user) | 3.8 | Covered with property switcher addition |
| 18 | Mobile navigation | 3.5 | Fixed bottom bar with role-specific items |
| 19 | Search across: units, security events, announcements, service requests, amenity bookings, library | 3.1, 3.6 | All 6 Condo Control search categories covered plus maintenance and documents |
| 20 | Aquarius search options: General Logs, Incident Logs, Fire Logs, Noise Logs, Advertisements, Maintenance, Library | 3.6 | Covered under unified event model -- all log types are searchable as "Events" |
| 21 | Expandable sidebar sub-items | 3.2 | "expandable" boolean attribute, progressive disclosure in Section 6.4 |
| 22 | Search results include reference numbers | 3.6 | Result subtitle includes reference_number via metadata field |
| 23 | Sidebar sections for organization | 3.2 | "Navigation Sections" with headers (OVERVIEW, OPERATIONS, DAILY) |
| 24 | Multi-property support / property switcher | 3.8 | Property Switcher in top bar for multi-property users |
| 25 | Semantic/intent-based search | 7.1 | AI semantic search with embeddings and cosine similarity |
| 26 | Quick actions from search | 3.1 | 9 role-filtered quick actions in command palette |
| 27 | Recent items / search history | 3.7 | 10 recent items + 20 search queries with clear options |

---

*Audit complete. 2 gaps identified (both low impact). 7 areas of weak coverage identified. 27 features confirmed as properly covered.*
