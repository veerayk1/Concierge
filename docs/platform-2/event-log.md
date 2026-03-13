# Event Log (Front Desk)

BuildingLink's Event Log is the equivalent of Aquarius's Logs system but with a fundamentally different architecture.

---

## Key Difference: Unified Event Model

**Aquarius** uses 6 separate log types (General, Cleaning, Incident, Fire, Noise, Security), each with its own creation flow.

**BuildingLink** uses a single unified "Event" concept with configurable **Event Types** grouped into **Event Groups**. This is more flexible and extensible.

---

## Event Type Configuration

### Event Groups (4 observed)

| Group | Event Types | Purpose |
|-------|-------------|---------|
| **Incoming Deliveries** | 15 types | Package/delivery tracking |
| **Keys** | 1 type | Key management |
| **People** | 1 type | Visitor/contractor tracking |
| **Loaner Items** | 1 type | Equipment lending |

### Incoming Deliveries Event Types (15)

| # | Event Type | Icon | Color | On-Open Email Template | Public Display | Sort |
|---|-----------|------|-------|----------------------|----------------|------|
| 1 | Amazon | Package icon | Yellow | "You have an Amazon delivery" | ✓ | 1 |
| 2 | Canada Post | Package icon | Red | "You have a Canada post delivery" | ✓ | 2 |
| 3 | Canada Parcel | Package icon | Green | "A CanPar delivery has arrived for your unit" | ✓ | 3 |
| 4 | Purolator | Package icon | Pink | "A Purolator package has arrived for your unit" | ✓ | 4 |
| 5 | DHL | DHL logo | Yellow | "You have a DHL delivery" | ✓ | 5 |
| 6 | Fedex | FedEx logo | Blue | "You have a FedEx delivery" | ✓ | 6 |
| 7 | UPS | UPS logo | Green | "You have a UPS package" | ✓ | 7 |
| 8 | Package | Package icon | Brown | "You have a package delivery" | ✓ | 8 |
| 9 | Perishables | Package icon | Pink | "You have a perishable delivery" | ✓ | 9 |
| 10 | Envelope | Package icon | Pink | "You have an envelope" | ✓ | 10 |
| 11 | Dry Cleaning/Laundry | Hanger icon | Red | "You have dry cleaning" | ✓ | 11 |
| 12 | Pharmacy | Package icon | Green | "You have a delivery from the pharmacy" | — | 12 |
| 13 | Flowers | Flower icon | Pink | "You have a flower delivery" | ✓ | 13 |
| 14 | Other | Ellipsis icon | Yellow | "You have a delivery" | ✓ | 14 |
| 15 | FLEETOPTICS | — | Blue | (custom) | ✓ | 18 |

### Per-Event-Type Configuration Fields

| Field | Description |
|-------|-------------|
| Icon | Visual icon (courier logos or generic) |
| Color | Color badge for visual identification |
| Event type name | Display name |
| Event group | Parent group assignment |
| On-Open action | Email template triggered when event is created |
| On-Close action | Action triggered when event is closed/resolved |
| Public display | Whether event shows on lobby screens |
| Sort order | Display order within group |
| Active/Inactive | Can be toggled (checkbox to show inactive) |

---

## Event Log Grid Display

### Layout: Card-Based Grid (vs Aquarius Table)

Events display as colored cards in a grid layout rather than table rows. Each card shows:
- Event type icon and color badge
- Unit number
- Resident name
- Timestamp
- Status indicators

### Display Controls

| Control | Options | Description |
|---------|---------|-------------|
| Card width | Adjustable | Change card size in grid |
| Font size | Adjustable | Scale text within cards |
| Grouping mode | 4 modes | Group events by different criteria |
| Show inactive | Checkbox | Toggle inactive event types |

### Grouping Modes (4)
1. By Event Group
2. By Status (Open/Closed)
3. By Unit
4. By Date

---

## Event Detail Modal

### Fields Observed

| Field | Description |
|-------|-------------|
| Unit | Unit number and resident name |
| Event type | Type from configuration |
| Comments | Free text notes |
| Status | Open/Closed |
| Created by | Staff member who logged |
| Created at | Timestamp |

### Premium Features (Disabled/Gated)

These features were visible in the UI but disabled — indicating tiered pricing:

| Feature | Status | Description |
|---------|--------|-------------|
| Signature | Disabled | Capture resident signature on event |
| App Authorization | Disabled | Mobile app-based authorization |
| Photo | Disabled | Photo capture on event |
| Driver's License/Photo ID | Disabled | Scan/capture identification |

---

## Batch Event Creation

"Record multiple events" form with:

| Field | Description |
|-------|-------------|
| Event type | Dropdown per row |
| Unit number | Unit search per row |
| Comment | Free text per row |
| Print label | Checkbox per row |
| Send notification | Dropdown per row (1st email/No notification/All addresses) |

- **4 rows** available for batch entry
- Individual notification control per event
- Print label integration

---

## General Settings (Event Log)

| Setting | Value/Type | Description |
|---------|-----------|-------------|
| Notification sender name | Text (tag-based) | "Queensway Park Condos - TSC..." |
| Notification sender email | Email (tag-based) | From address for event notifications |
| Allow staff to select notification recipients | Checkbox (✓) | Staff can choose who to notify per event |
| Default notification selection | Radio: 1st email / No notification / All addresses | Default recipient behavior |
| Management unit events email notifications | Text input | Email for management unit events |
| Allowed to view captured signatures | Radio: All building staff / Managers only | Signature access control |
| Use the event "Location" Module | Checkbox | Enable location tracking per event |
| Assigning a location should be mandatory | Checkbox (grayed if Location off) | Require location |
| Show resident's phone numbers on new events | Checkbox | Display phone on event creation |
| Residents can receive voice notifications for packages | Checkbox | Voice call package alerts |
| Residents can receive text notifications for packages | Checkbox (✓) | SMS package alerts |

---

## Concierge Comparison Notes

### What BuildingLink Does Better
1. **Courier-specific tracking** — Each courier gets its own icon, color, and notification template
2. **Multi-channel notifications** — Email + Voice + SMS per event
3. **Print labels** — Integrated label printing on package intake
4. **Batch creation** — 4-row batch entry with per-row notification control
5. **Premium feature gating** — Modular upsell (signature, photo, ID capture)
6. **Public display integration** — Events can surface on lobby screens
7. **Visual card layout** — More scannable than table rows for front desk staff

### What Aquarius Does Differently
1. **6 distinct log types** — Specialized forms for different scenarios (fire log has different fields than noise log)
2. **Simpler interface** — Less overwhelming for smaller properties
3. **Parcel type categorization** — Physical description categories (white box, brown package, etc.)
