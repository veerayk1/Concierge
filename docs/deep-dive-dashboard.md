# Dashboard — Granular Deep Dive

Field-level documentation of every widget, button, chart, card, and interactive element on the Aquarius (ICON) Dashboard.

**URL**: `https://aquarius.iconconnect.ca/dashboard`
**Property**: TSCC 2584 - Toronto
**Logged-in user**: RAY_007
**Architecture**: Modern SPA (React/Material UI)

---

## 1. Top Navigation Bar (Global — appears on every page)

### Left Section
- **Aquarius Logo** (top left) — Red "AQUARIUS" with "MYCONDOLINK" superscript, links to dashboard

### Center Navigation Links (7 items)
| # | Link | URL | Description |
|---|------|-----|-------------|
| 1 | Home | `/dashboard` | Returns to dashboard |
| 2 | Amenities | `/amenities` | Amenity booking system |
| 3 | Create User | `/create-user` | User creation form |
| 4 | Create Unit | `/create-unit` | Unit creation form |
| 5 | Logs | `/logs` | Log entry system (6 log types) |
| 6 | Packages | `/packages` | Package management |

### Right Section
| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Search | Text input with magnifying glass | Placeholder: "Type and press enter to" — opens full-screen search overlay on click |
| 2 | RAY_007 | Dropdown menu | Username with down arrow — see User Menu below |
| 3 | Profile picture | Avatar icon | Clickable profile image/placeholder |

### Search Overlay (opens on search click)
- **Full-screen dimmed overlay** with centered search box
- **Placeholder**: "Type and press enter to search"
- **Close button**: X icon (top right of overlay)
- **Behavior**: Type query and press Enter to search across all modules

### User Menu (RAY_007 dropdown — 8 items)
| # | Item | Description |
|---|------|-------------|
| 1 | View Profile | Opens user profile page (6 tabs) |
| 2 | Switch Building | Switch to another property in the system |
| 3 | Switch Language | Submenu with arrow (→) — language options |
| 4 | Settings | System settings (8 tabs) |
| 5 | User Management | Manage all system users |
| 6 | Email Preferences | Configure email notification settings |
| 7 | Change Password | Password change form |
| 8 | Logout | End session |

---

## 2. Left Sidebar Navigation (Global — appears on every page)

### Sidebar Items (15 items, vertical list)
| # | Icon | Label | Description |
|---|------|-------|-------------|
| 1 | Grid icon | Dashboard | Main dashboard (current page) |
| 2 | Grid icon | Unit File | Unit management and resident info |
| 3 | Trophy icon | Amenities | Amenity management and booking |
| 4 | Grid/security icon | Security Menu | Security features, FOBs, incidents |
| 5 | Bell icon | Announcement | Announcement management |
| 6 | Megaphone icon | Advertisement | Advertisement management |
| 7 | Gear icon | Maintenance | Maintenance/service requests |
| 8 | Document icon | Library | Document library |
| 9 | Grid/store icon | Store | Online store/marketplace |
| 10 | Calendar icon | Events | Community events |
| 11 | Report icon | Reports | Report generation |
| 12 | Search icon | Search | Global search page |
| 13 | Document icon | Survey | Survey builder |
| 14 | Alert icon | Emergency | Emergency contacts |
| 15 | Person icon | Contractors | Contractor directory |

**Sidebar behavior**:
- Fixed left panel, always visible
- No collapsible sub-menus — each item is a direct link
- Active item not visually highlighted (flat design)
- Scrollable on shorter viewports

---

## 3. Property Header Banner

**Layout**: Full-width grey banner with ICON logo

| # | Element | Position | Content/Format |
|---|---------|----------|----------------|
| 1 | ICON Property Management logo | Left | Red logo banner |
| 2 | Property name | Below logo | "TSCC 2584 - Toronto" |
| 3 | Date/Time | Below property | "Friday, March 13, 2026 8:18 PM" (full day name, month name, day, year, time in 12h format) |
| 4 | Temperature | Center-right | "2 °C" (numeric with Celsius unit) |
| 5 | Wind | Right of temperature | "13 Km/h" (numeric with unit) |
| 6 | Mood | Far right | "Rain" (weather condition as text) |

**Key observations**:
- Weather widget integrated directly into the header banner
- "Mood" is the weather condition descriptor (e.g., Rain, Clear, Cloudy)
- Date/time is static at page load (not real-time updating)

---

## 4. Quick Action Buttons

Three buttons below the header banner:

| # | Button | Style | Icon | Behavior |
|---|--------|-------|------|----------|
| 1 | Reset View | Outlined (green text, white bg) | External link icon (↗) | Resets dashboard layout to default |
| 2 | Contacts | Outlined (green text, white bg) | None | Opens "Point of contacts" modal |
| 3 | + Shift Logs | Filled (blue bg, white text) | + icon | Opens Shift Log modal (right-aligned) |

### "Point of contacts" Modal
**Trigger**: Contacts button
**Layout**: Centered modal with X close button, envelope icon in header

#### Contact Cards (3 observed)
| # | Role | Name | Email | Phone |
|---|------|------|-------|-------|
| 1 | Property Manager | Wayne Sauder | wayne@iconpm.ca | 416-551-4590 |
| 2 | Property Administrator | Arbi Agastra | arbi@iconpm.ca | 416-551-4590 |
| 3 | Concierge Desk | Concierge Desk | bondconcierge@royalcas.ca | 416-551-8309 |

**Card layout**: Each contact in a bordered card showing Role - Name, clickable email (blue link), phone number

### Shift Log Modal
**Trigger**: + Shift Logs button
**Title**: "Shift Logs (Last 48 hours)"
**Instruction text**: "Use the 'Search' button to review Shift Notes added prior to 48 hours ago."

#### Existing Shift Log Entries (4 observed in 48-hour window)
| # | Timestamp | Author | Content Type |
|---|-----------|--------|-------------|
| 1 | Mar 12, 2026 12:08 AM | Arnav | Full shift report with timestamps, patrol details, key handoff |
| 2 | Mar 12, 2026 8:03 AM | S/G Arnav | Pass-on log review, patrol report, door checks |
| 3 | Mar 13, 2026 12:03 AM | (staff) | Shift report |
| 4 | Mar 13, 2026 8:13 AM | (staff) | Shift report |

**Entry format**: HTML-formatted text with `<p>` tags, `<strong>` for timestamps within entries (e.g., "12:09 AM", "12:20 AM"), narrative style describing patrol activities, key management, and incident notes.

#### Shift Log Entry Divider
- **"Add Note to Shift Log"** — text divider between existing entries and new entry form

#### New Shift Log Form
| # | Field | Type | Options/Default | Description |
|---|-------|------|-----------------|-------------|
| 1 | Priority | Radio buttons (2) | ○ High / ◉ Normal | Default: Normal |
| 2 | Related to Unit | Dropdown (select) | "Related to Unit:" (placeholder) | Link shift note to specific unit |
| 3 | Clear | Button | — | Clear the form |
| 4 | Shift Log | Textarea (3 rows) | Placeholder: "Shift Log" | Free-text entry for shift note |

#### Shift Log Action Buttons (3)
| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Add Note | Outlined | Add note to current shift log without ending shift |
| 2 | End of shift | Outlined | Add note and mark shift as complete |
| 3 | Search | Outlined | Search historical shift logs (beyond 48 hours) |

---

## 5. Summary Cards (8 cards in 3-column grid)

### Row 1 (3 cards)

#### Card 1: Users
| Property | Value |
|----------|-------|
| Icon | Purple people icon (circular bg) |
| Title | "Users" |
| Count | 2,080 |
| Unit label | "USERS" |
| Time window | "24 Hours" with calendar icon |
| Resize handle | Bottom-right corner drag handle (↘) |

#### Card 2: Amenities
| Property | Value |
|----------|-------|
| Icon | Teal/green tent icon (circular bg) |
| Title | "Amenities" |
| Count | 7 |
| Unit label | "AMENITIES" |
| Time window | "24 Hours" |
| Resize handle | Bottom-right corner (↘) |

#### Card 3: Announcements (wider — spans remaining width)
| Property | Value |
|----------|-------|
| Icon | Blue megaphone icon (circular bg) |
| Title | "Announcements" |
| "See All" button | Outlined button — links to full announcements list |
| Recent items | Bullet list of recent announcements |
| Total count | 1,179 |
| Unit label | "ANNOUNCEMENTS" |
| Time window | "24 Hours" |

**Observed announcement items (3)**:
1. Women's Steam room - Out of Service
2. Elevator #3 Back in Service
3. New Announcement

### Row 2 (3 cards)

#### Card 4: Bookings
| Property | Value |
|----------|-------|
| Icon | Blue house icon (circular bg) |
| Title | "Bookings" |
| Count | 64 |
| Unit label | "BOOKINGS" |
| Time window | "24 Hours" |

#### Card 5: Packages
| Property | Value |
|----------|-------|
| Icon | Red box/package icon (circular bg) |
| Title | "Packages" |
| Count | 166 |
| Unit label | "PACKAGES" |
| Time window | "24 Hours" |

### Row 3 (3 cards)

#### Card 6: Bulletins
| Property | Value |
|----------|-------|
| Icon | Green clipboard icon (circular bg) |
| Title | "Bulletins" |
| Count | 27 |
| Unit label | "BULLETINS" |
| Time window | "24 Hours" |

#### Card 7: Logs
| Property | Value |
|----------|-------|
| Icon | Orange/yellow chat icon (circular bg) |
| Title | "Logs" |
| Count | 7,138 |
| Unit label | "LOGS" |
| Time window | "24 Hours" |

#### Card 8: Service Requests (wider — spans remaining width)
| Property | Value |
|----------|-------|
| Icon | Pink/magenta eye icon (circular bg) |
| Title | "Service Requests" |
| "See All" button | Outlined button — links to full service requests list |
| Recent items | Bullet list of recent service requests |
| Total count | 74 |
| Unit label | "SERVICE REQUESTS" |
| Time window | "24 Hours" |

**Observed service request items (3)**:
1. Microwave Broken
2. Cupboard mechanism
3. Balcony screen door fell out

### Card Common Properties
- All cards have a **resize handle** (↘) in the bottom-right corner for drag-to-resize
- All cards show **"24 Hours"** time window with calendar icon (except charts which show "1 Month")
- Cards 3 and 8 (Announcements, Service Requests) are **wider format** with bullet-point lists and "See All" buttons
- Cards 1-2, 4-7 are **compact format** showing only icon + count + label

---

## 6. Charts and Analytics (4 chart widgets)

### Chart 1: Maintenance Requests by Month
| Property | Value |
|----------|-------|
| Type | Line chart (single series) |
| X-axis | Months (Jan–Dec) |
| Y-axis | Count (range: ~14–36) |
| X-axis label | "transportation" |
| Series | "requests" (purple line with circle markers) |
| Time window | "1 Month" |
| Resize handle | Bottom-right (↘) |

**Observed data points**:
- Jan: ~26, Feb: ~27, Mar: ~24, Apr: ~16, May: ~18
- Jun: ~36, Jul: ~35, Aug: ~30, Sep: ~30, Oct: ~33
- Nov: ~28, Dec: ~23

**Note**: X-axis label says "transportation" which appears to be a bug/mislabel — should be "month"

### Chart 2: Successful Emails
| Property | Value |
|----------|-------|
| Type | Line chart (4 series) |
| X-axis | Dates (2026-03-09 to 2026-03-13) |
| Y-axis | Count (range: 0–1,200) |
| X-axis label | "transportation" |
| Series (4) | clicked (light pink), processed (medium purple), open (dark purple), delivered (darkest purple) |

**Observed pattern**: Peak on 2026-03-09 (~1,200 for delivered/processed), declining trend through 2026-03-13

### Chart 3: Failed Emails
| Property | Value |
|----------|-------|
| Type | Line chart (4 series) |
| X-axis | Dates (2026-03-09 to 2026-03-13) |
| Y-axis | Count (range: 0) |
| X-axis label | "transportation" |
| Series (4) | spams (light pink), invalid emails (medium purple), bounces (dark purple), blocks (darkest purple) |

**Observed data**: All values at 0 — no failed emails in this period

### Chart 4: User Breakdown
| Property | Value |
|----------|-------|
| Type | Donut/ring chart |
| Segments (2) | tenants: 65.24% (teal/green), owners: 34.76% (orange) |
| Legend | Below chart — "tenants" (green dot) and "owners" (orange dot) |

### Chart 5: Unit Breakdown
| Property | Value |
|----------|-------|
| Type | Donut/ring chart |
| Segments (3) | RentalUnits: 287 (teal/green), OwnedUnits: 392 (orange), EmptyUnits: small segment (purple) |
| Legend | Below chart — "RentalUnits" (green dot), "OwnedUnits" (orange dot), "EmptyUnits" (purple dot) |

---

## 7. Recent Incident Logs Panel

| Property | Value |
|----------|-------|
| Title | "Recent Incident Logs" |
| Position | Right column, below Service Requests card |

**Observed incident entries (4)** — each as a clickable blue link:
1. Trespasser in Garbage Disposal Area
2. Main OHD Signal Lights Malfunction
3. unauthorized vehicle parked in Spot D1
4. (additional entries visible on scroll)

**Behavior**: Each entry is a hyperlink that navigates to the full incident report

---

## 8. Support Widget

| Property | Value |
|----------|-------|
| Type | Floating button |
| Position | Bottom-right corner (fixed position) |
| Label | "Support" with question mark icon (?) |
| Color | Blue background, white text |
| Behavior | Opens support/help system |

---

## Concierge Design Implications

### From Dashboard Deep Dive
1. **8 summary cards in 3-column grid** — layout uses 2 compact + 1 wide card per row; Concierge should support configurable dashboard layouts
2. **Resizable cards** — every card has a drag-to-resize handle; consider if this adds value or is unnecessary complexity
3. **24-hour time window on all cards** — fixed window; consider allowing configurable time ranges (today, 7d, 30d)
4. **"See All" buttons** on Announcements and Service Requests cards — good progressive disclosure pattern
5. **Shift Log modal** — rich shift handoff system with 48-hour rolling window, priority tagging, and unit linkage; critical for 24/7 staffed buildings
6. **Point of contacts** — simple but essential; 3 contact types (Manager, Administrator, Concierge Desk) with email + phone
7. **Weather integration** — temperature, wind, mood (condition) in header banner; nice-to-have for front desk staff
8. **Search overlay** — full-screen dimmed overlay with single search input; clean pattern for global search
9. **User dropdown has "Switch Building"** — multi-property support built into the core navigation; Concierge must support this from day one
10. **Chart mislabeling** — X-axis says "transportation" on all charts (likely a bug); shows importance of proper axis labels and chart configuration
11. **4 email analytics charts** — tracking clicked, processed, open, delivered AND spam, invalid, bounces, blocks; comprehensive email monitoring
12. **User vs Unit breakdown charts** — 65/35 tenant/owner split and rental/owned/empty unit counts; important property management metrics
13. **15 sidebar items, flat structure** — no sub-menus, no grouping; BuildingLink uses expandable groups which scales better for many modules
14. **Recent Incident Logs** — clickable links to incident reports directly on dashboard; good for security-focused awareness
15. **Shift Log entries contain HTML** — raw HTML tags visible in entries (e.g., `<p>`, `<strong>`); indicates rich-text editor on input but may not render properly on display
