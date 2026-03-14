# Sidebar Navigation — Granular Deep Dive

Complete documentation of every sidebar navigation element in Condo Control.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Sidebar Structure

The sidebar is a **fixed-width left panel** that persists across all pages. It contains the property name, navigation links organized as a vertical list, and a collapse toggle at the bottom.

### 1.1 Sidebar Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Property name | "M.T.C.C. 872" — top of sidebar, plain text |

### 1.2 Navigation Items (Complete — 14 items + 3 sub-items)

| # | Label | Icon | URL | Type | Expandable | Sub-items |
|---|-------|------|-----|------|------------|-----------|
| 1 | Home | House icon | `/my/my-home` | Link | No | — |
| 2 | My Account | Person icon | `/my/unit` | Link | Yes (▼) | Change Password, Email Preferences, Package Preferences |
| 3 | Amenity Booking | Calendar/grid icon | `/amenity/landing/` | Link | No | — |
| 4 | Announcements | Megaphone/bullhorn icon | `/announcement/show-list/` | Link | No | — |
| 5 | Classified Ads | Ad/tag icon | `/forum/all-forums?mode=classifieds` | Link | No | — |
| 6 | Events | Calendar/star icon | `/event/list-event/` | Link | No | — |
| 7 | Library | Book icon | `/library/landing` | Link | No | — |
| 8 | Reports | Clipboard/document icon | `/reportV2/reports/` | Link | No | — |
| 9 | Security & Concierge | Circle/dot icon (hollow) | `/security/console/` | Link | Yes (▼) | Unit File |
| 10 | Store | Shopping bag icon | `/store/overview/` | Link | No | — |
| 11 | Survey | Clipboard/checklist icon | `/survey/list-surveys/` | Link | No | — |
| 12 | Training | People/group icon (two outlines) | `/training/overview/` | Link | No | — |
| 13 | Unit File | Document/card icon | `/unit/view-unit-file/` | Link | Yes (▼) | Buzzer Codes |
| 14 | User Guide | — | `https://support.condocontrol.com/hc/en-us` | External link | No | — |
| 15 | Collapse | Grid/layout icon | — | Toggle button | No | — |

### 1.3 Sub-Items

**My Account** (3 sub-items):

| # | Label | URL | Description |
|---|-------|-----|-------------|
| 1 | Change Password | `/change-password.aspx` | Legacy ASP.NET page |
| 2 | Email Preferences | `/my-account.aspx` | Legacy ASP.NET page |
| 3 | Package Preferences | `/my/unit#tab-14` | Deep link to Package Preferences tab on My Account |

**Security & Concierge** (1 sub-item):

| # | Label | URL | Description |
|---|-------|-----|-------------|
| 1 | Unit File | `/unit/view-unit-file/` | Same URL as the top-level Unit File link. Shortcut for quick access |

**Unit File** (1 sub-item):

| # | Label | URL | Description |
|---|-------|-----|-------------|
| 1 | Buzzer Codes | `/list-items.aspx?type=BuzzerCode` | Legacy ASP.NET buzzer code directory |

### 1.4 Sidebar Behavior

| Behavior | Description |
|----------|-------------|
| Expand/Collapse sections | Clicking the ▼/▲ arrow toggles sub-items. Multiple sections can be expanded simultaneously |
| Active state | Current page's sidebar item is highlighted (exact style not clearly observed — no bold or background change, relies on URL matching) |
| Collapse button | "Collapse" at bottom toggles the entire sidebar between full and icon-only mode |
| Scroll | Sidebar scrolls independently if content exceeds viewport height |

---

## 2. Top Navigation Bar

A fixed horizontal bar above the main content area.

### 2.1 Elements

| # | Element | Position | Description |
|---|---------|----------|-------------|
| 1 | Quick Search | Left | Text input with magnifying glass icon. Placeholder: "Quick Search". Global search |
| 2 | Help | Right | Lightbulb icon (🔍). Opens help panel |
| 3 | Call | Right | Phone icon (📞). Phone/contact feature |
| 4 | User avatar | Far right | Circular badge "TC" (initials of "Temp Concierge"). Opens user menu |

### 2.2 Help Panel

Triggered by the Help button. A slide-in panel from the bottom-right corner.

| # | Element | Description |
|---|---------|-------------|
| 1 | "How can we help?" | Panel heading |
| 2 | Search input | Text input. Placeholder: "Example: How to log a visitor" |
| 3 | Contact Us | Link/section |
| 4 | Contact Support | Section with sub-elements |
| 5 | View My Cases | Link to `/my/tickets` — support ticket history |
| 6 | Contact Community Manager | Link for urgent issues or security concerns |
| 7 | Create support case | Link for technical issues |

---

## 3. Footer

A standard footer that appears at the bottom of every page.

### 3.1 Elements

| # | Element | URL | Description |
|---|---------|-----|-------------|
| 1 | Copyright | — | "© 2026 Condo Control. All rights reserved." |
| 2 | System Status | `https://status.propertycontrol.com/` | External link to status page |
| 3 | Privacy | `https://www.condocontrol.com/trust/` | External link to privacy/trust page |
| 4 | Help Center | `https://support.condocontrol.com/hc/en-us` | External link to help docs |
| 5 | Downloads | `https://www.condocontrol.com/mobile-app` | Mobile app download page |
| 6 | Download iOS App | `https://apps.apple.com/ca/app/condo-control-app/id1112614439` | Apple App Store link |
| 7 | Download Android App | `https://play.google.com/store/apps/details?id=com.condocontrolcentral.cccapp` | Google Play Store link |

**Note**: The Android app package name (`com.condocontrolcentral.cccapp`) uses the old "Condo Control Central" branding. The iOS app URL uses the rebranded "Condo Control" name.

---

## 4. URL Architecture Summary

### 4.1 Modern SPA Routes

| Module | Base URL | Architecture |
|--------|----------|-------------|
| Home/Dashboard | `/my/my-home` | Modern |
| My Account | `/my/unit` | Modern |
| Amenity Booking | `/amenity/landing/` | Modern |
| Announcements | `/announcement/show-list/` | Modern |
| Classified Ads | `/forum/all-forums?mode=classifieds` | Modern (forum engine) |
| Events | `/event/list-event/` | Modern |
| Library | `/library/landing` | Modern |
| Reports | `/reportV2/reports/` | Modern (v2 routes + Telerik) |
| Security Console | `/security/console/` | Modern (jQuery UI dialogs) |
| Store | `/store/overview/` | Modern |
| Survey | `/survey/list-surveys/` | Modern |
| Training | `/training/overview/` | Modern |
| Unit File | `/unit/view-unit-file/` | Modern |
| User Detail | `/user/view-user-details/{hashedId}` | Modern |

### 4.2 Legacy ASP.NET Pages

| Module | Base URL | Architecture |
|--------|----------|-------------|
| Buzzer Codes | `/list-items.aspx?type=BuzzerCode` | Legacy ASP.NET WebForms |
| Buzzer Code Detail | `/view-item.aspx?type=BuzzerCode&id={id}` | Legacy ASP.NET WebForms |
| Change Password | `/change-password.aspx` | Legacy ASP.NET WebForms |
| Email Preferences | `/my-account.aspx` | Legacy ASP.NET WebForms |
| File Download | `/view-file.aspx?FileRecordID={id}&Key={guid}` | Legacy ASP.NET WebForms |
| Dashboard Redirect | `/SessionUpdate/RedirectToConsole?filter=` | Legacy redirect handler |

### 4.3 External Links

| Destination | URL |
|-------------|-----|
| User Guide / Help Center | `https://support.condocontrol.com/hc/en-us` |
| System Status | `https://status.propertycontrol.com/` |
| Privacy/Trust | `https://www.condocontrol.com/trust/` |
| Mobile App Landing | `https://www.condocontrol.com/mobile-app` |
| iOS App Store | `https://apps.apple.com/ca/app/condo-control-app/id1112614439` |
| Google Play Store | `https://play.google.com/store/apps/details?id=com.condocontrolcentral.cccapp` |

---

## 5. Complete Module Inventory for Security & Concierge Role

| # | Module | Deep Dive File | Lines | Key Feature |
|---|--------|---------------|-------|-------------|
| 1 | Dashboard (Home) | `deep-dive-dashboard.md` | ~250 | 6 KPI cards, quick links |
| 2 | My Account | `deep-dive-my-account.md` | ~300 | Password, email prefs, package prefs |
| 3 | Amenity Booking | `deep-dive-amenity-booking.md` | ~350 | Calendar + list views, booking detail |
| 4 | Announcements | `deep-dive-announcements.md` | ~150 | List with status badges, detail view |
| 5 | Classified Ads | `deep-dive-classified-ads.md` | ~180 | Forum-based, create/reply capability |
| 6 | Events | `deep-dive-events.md` | ~230 | Calendar + list, dual calendar system |
| 7 | Library | `deep-dive-library.md` | ~250 | Folder tree, file downloads |
| 8 | Reports | `deep-dive-reports.md` | ~280 | 39 reports, Telerik viewer, 10 export formats |
| 9 | Security & Concierge | `deep-dive-security-concierge.md` | ~650 | Console with 7 entry types, jQuery UI dialogs |
| 10 | Store | `deep-dive-store.md` | ~80 | Non-functional (payment not configured) |
| 11 | Survey | `deep-dive-survey.md` | ~100 | Empty (no surveys published) |
| 12 | Training | `deep-dive-training.md` | ~300 | LMS with 16 courses, team results |
| 13 | Unit File | `deep-dive-unit-file.md` | ~350 | 1,028 users, 6-tab user detail |
| 14 | Buzzer Codes | `deep-dive-buzzer-codes.md` | ~200 | 271 codes, legacy ASP.NET |
| 15 | Sidebar Navigation | `deep-dive-sidebar-navigation.md` | ~200 | This file |

**Total deep-dive files**: 15
**Total estimated lines**: ~3,870

---

## 6. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Clean sidebar organization** — 14 items is manageable. Items are logically grouped with expandable sections for related sub-items
2. **Consistent iconography** — Each sidebar item has a unique icon. Teal color scheme throughout
3. **Quick Search in top bar** — Global search always accessible regardless of current page
4. **Collapsible sidebar** — Can minimize to icon-only mode for more content space
5. **Help panel integration** — Help, search, and support case creation accessible from any page
6. **Mobile app links in footer** — Both iOS and Android app links prominently placed
7. **Breadcrumb navigation** — Consistent breadcrumb trail on all pages for wayfinding

### What CondoControl Gets Wrong
1. **Mixed architecture** — Modern SPA routes alongside legacy `.aspx` pages. Change Password, Email Preferences, and Buzzer Codes all use old ASP.NET WebForms. Jarring UX transitions
2. **Duplicate Unit File link** — "Unit File" appears as both a top-level sidebar item AND a sub-item under "Security & Concierge". Same URL (`/unit/view-unit-file/`). Wastes sidebar space
3. **Security & Concierge icon is wrong** — Uses a hollow circle/dot icon while every other item has a descriptive icon. Should use a shield or security camera icon
4. **No badge/counter on sidebar items** — No indication of unread announcements, outstanding packages, or pending items. Must click into each module to see counts
5. **User Guide is external** — Opens Zendesk Help Center in a new tab. Context switch away from the platform. Should embed help content
6. **"Collapse" is a sidebar item** — The collapse toggle is styled as a sidebar navigation item, not a separate control. Could confuse users into thinking it's a navigation destination
7. **No role indicator** — Sidebar doesn't show the current user's role. "Temp Concierge" must navigate to My Account to confirm their role
8. **No favorites or pinning** — Cannot reorder or pin frequently-used modules to the top. Security & Concierge staff likely use Security Console 90% of the time but it's item #9 in the list
9. **Alphabetical ordering** — Items are sorted alphabetically (Amenity, Announcements, Classified, Events...), not by usage frequency. For a Security & Concierge user, the Security Console should be first
10. **No keyboard shortcuts** — No visible keyboard shortcuts for navigation (e.g., Alt+S for Security Console)

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~200+*
