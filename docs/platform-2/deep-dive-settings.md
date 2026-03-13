# Settings Module — Granular Deep Dive

Field-level documentation of every settings category, configuration option, and setup page in BuildingLink's Settings module.

---

## Overview

**Access**: Settings link in the left sidebar navigation (no submenu — direct panel open)
**Panel Title**: "General Building Set-Up Options"

The Settings module contains **23 configuration categories** displayed as a scrollable list in a panel that overlays the current page content. Each category links to a dedicated setup page.

---

## Settings Categories (23 total)

| # | Category | Subtitle | URL Pattern |
|---|----------|----------|-------------|
| 1 | Property directory | Main addresses, contacts, message links | `/v2/mgmt/Communicate/BuildingDirectorySettings.aspx` |
| 2 | Amenities | — | `/v2/mgmt/amenities/amenities.aspx` |
| 3 | Asset Manager | — | Asset Manager settings |
| 4 | Authorized computers | — | Computer authorization settings |
| 5 | Calendar | — | Calendar configuration |
| 6 | Custom fields | — | Custom field definitions |
| 7 | Design center | — | `/V2/Mgmt/DesignCenter/Dashboard.aspx` |
| 8 | Displays and consoles | — | Lobby display configuration |
| 9 | Document types | — | Document type definitions |
| 10 | Employees | — | Employee settings |
| 11 | Event log | General settings, event type, event locations | `/event-log/staff/event-settings` |
| 12 | Event types | — | Event type definitions |
| 13 | Front desk instructions | — | Instruction type settings |
| 14 | Holidays | — | Holiday calendar setup |
| 15 | Incident reports | Inactive and active types | Incident type configuration |
| 16 | Library categories | — | Document library categories |
| 17 | Maintenance/repair categories | — | Maintenance category setup |
| 18 | Occupant types | — | `/v2/Mgmt/Setup/DisplayUserTypes.aspx` (restricted) |
| 19 | Parking permits | — | Parking permit settings |
| 20 | Physical units | — | Unit/apartment definitions |
| 21 | Predefined maintenance responses | — | Canned maintenance responses |
| 22 | Resident posting categories | — | Bulletin board category setup |
| 23 | Shift log settings | — | Shift log configuration |
| 24 | Special permissions | — | Employee permission settings |

---

## 1. Property Directory Settings

**URL**: `/v2/mgmt/Communicate/BuildingDirectorySettings.aspx`

### Section 1: Main Addresses
**Preview buttons (2, top right):**
- **👁 Preview Staff "Building Directory" Page**
- **👁 Preview Resident "Communicate" Page**

#### Addresses Table Columns (7)
| # | Column | Description |
|---|--------|-------------|
| 1 | (Type) | Address type (Building, Management Company) |
| 2 | Name | Entity name |
| 3 | Address | Street address |
| 4 | City | City |
| 5 | State | Province/State |
| 6 | Zip | Postal code |
| 7 | Country | Country |
| 8 | Phone | Phone number |
| 9 | (Action) | Edit link |

#### Observed Addresses (2)
| Type | Name | Address | City | State | Zip | Country | Phone |
|------|------|---------|------|-------|-----|---------|-------|
| Building | Queensway Park Condos - TSCC 2934 | 7 Smith Crescent | Etobicoke | Ontario | M8Z 0G3 | Canada | 416-259-2323 |
| Management Company | Duka Property Management | 6205 Airport Rd | Mississauga | Ontario | ON L4V 1E1 | Canada | — |

### Section 2: Contacts
**Action**: **+ Add Contact** button (green, top right)

#### Contacts Table Columns (8)
| # | Column | Description |
|---|--------|-------------|
| 1 | Title | Contact role/title |
| 2 | First Name | First name |
| 3 | Last Name | Last name |
| 4 | Email | Email address |
| 5 | Work Phone | Work phone number |
| 6 | Cell Phone | Cell phone number |
| 7 | Fax | Fax number |
| 8 | Show Residents | Checkbox — visible to residents |
| 9 | (Order) | Display order dropdown |
| 10 | (Action) | Edit link |

#### Observed Contacts (3)
| Title | First Name | Last Name | Email | Work Phone | Order |
|-------|------------|-----------|-------|------------|-------|
| Property Manager | Gledis | Xhoxhi | queenswaypark.cm@dukamanagement.com | 416-259-2323 | 1 |
| Concierge | — | Desk | tscc2934concierge@royalcas.ca | 416-503-4806 | 2 |
| Site Administrator | Sidita | Nazifi | queenswaypark.office@dukamanagement.com | 416-259-2323 | 3 |

### Section 3: Message Links
**Action**: **+ Add Message Link** button (green, top right)

#### Message Links Table Columns (7)
| # | Column | Description |
|---|--------|-------------|
| 1 | Title | Link name |
| 2 | Staff | ☑/☐ Visible to staff |
| 3 | Owner | ☑/☐ Visible to owners |
| 4 | Tenant | ☑/☐ Visible to tenants |
| 5 | Board | ☑/☐ Visible to board members |
| 6 | Recipients | Email recipients |
| 7 | (Order) | Display order |

#### Observed Message Links (1)
| Title | Staff | Owner | Tenant | Board | Recipients |
|-------|-------|-------|--------|-------|------------|
| Send Message to Manager | ☑ | ☑ | ☑ | ☑ | queenswaypark.office@dukamanagement.com |

---

## 2. Amenity Reservations Settings

**URL**: `/v2/mgmt/amenities/amenities.aspx`

### Tabs (2)
1. **Amenities** (default) — View/edit individual amenities
2. **Amenity Groups** — Group amenities together

### Options
- ☐ **Include inactive amenities** checkbox

### Amenities Table Columns (9)
| # | Column | Description |
|---|--------|-------------|
| 1 | (Image) | Amenity photo or "No image" placeholder |
| 2 | Amenity Name | Name of the amenity |
| 3 | Status | Active/Inactive |
| 4 | Approve Automatically | Whether bookings auto-approve |
| 5 | Can Resident View? | ✓ if residents can see availability |
| 6 | Can Resident enter Multi-Day Reservations? | Multi-day booking support |
| 7 | Allow Reservations That Overlap | Concurrent booking support |
| 8 | Amenity Group (optional) | Group assignment |
| 9 | Mgmt Notifications Sent To | Email addresses for booking notifications |

### Observed Amenities (4)
| Amenity | Status | Approve Auto | Resident View | Notifications |
|---------|--------|-------------|---------------|---------------|
| BBQ 1 | Active | — | ✓ | queenswaypark.office@dukamanagement.com; tscc2934concierge@royalcas.ca |
| BBQ 2 | Active | — | ✓ | queenswaypark.office@dukamanagement.com; tscc2934concierge@royalcas.ca |
| Moving Elevator | Active | — | ✓ | queenswaypark.office@dukamanagement.com; tscc2934concierge@royalcas.ca |
| Party room | Active | — | ✓ | queenswaypark.office@dukamanagement.com; tscc2934concierge@royalcas.ca |

### Key Observations
- No amenities auto-approve — all require staff approval
- All amenities visible to residents
- None allow overlapping reservations
- None support multi-day reservations
- Dual notification recipients: office + concierge emails
- **+ Add New Amenity** button (green, top right)

---

## 3. Design Center

**URL**: `/V2/Mgmt/DesignCenter/Dashboard.aspx`

**Description**: "The Design Center provides you with multiple options to create and customize visual elements of BuildingLink, to fit your specific needs."

### Customization Areas (5)
| # | Area | Description |
|---|------|-------------|
| 1 | Resident Passport | Customize resident ID card design |
| 2 | Public Displays | Configure lobby screen visual layout |
| 3 | Email Design Templates | Customize email templates and branding |
| 4 | Website Building Images | Upload/manage building photos for the portal |
| 5 | Mobile Apps | Configure mobile app branding/appearance |

Each area has a **⊕ About** expandable section for more details.

---

## 4. Event Log Settings (Modern SPA)

**URL**: `/event-log/staff/event-settings`

### Tabs (2)
1. **Event types** — Manage event type definitions
2. **General Settings** (default when navigated from Settings panel)

### General Settings Fields

#### Email Notification Configuration
| Field | Type | Current Value |
|-------|------|---------------|
| Name | Tag input | "Queensway Park Condos - TSC..." |
| Email | Tag input | "tscc2934concierge@royalcas.ca" |

**Description**: "When sending out Automatic e-mail notifications, what name and reply to e-mail address should BuildingLink use? If no reply to e-mail addresses are specified, emails will show notify@BuildingLink.com and BuildingLink as the sender"

#### Notification Settings
| Setting | Type | Current Value |
|---------|------|---------------|
| Allow staff to select notification recipients on event creation | Checkbox | ☑ Checked |
| Default notification selection | Radio buttons (3) | |
| — 1st email address | Radio | ○ |
| — No notification | Radio | ○ |
| — All addresses | Radio | ◉ Selected |
| Management unit events email notifications | Text input | Empty |

#### Signature & Privacy
| Setting | Type | Current Value |
|---------|------|---------------|
| Allowed to view captured signatures | Radio buttons (2) | |
| — All building staff | Radio | ◉ Selected |
| — Managers only | Radio | ○ |

#### Module Toggles
| Setting | Type | Current Value |
|---------|------|---------------|
| Use the event "Location" Module | Checkbox | ☐ Unchecked |
| Assigning a location should be mandatory | Checkbox | ☐ Disabled (greyed out) |
| Show the resident's phone numbers once recording new events | Checkbox | ☐ Unchecked |
| Residents (who opt in) can receive voice notifications for packages | Checkbox | ☐ Unchecked |
| Residents (who opt in) can receive text notifications for packages | Checkbox | ☑ Checked |

#### Audit
- **Last changed by**: BuildingLink Admin350 on 9/19/2025, 04:16 PM
- **Save all changes** button (teal)

---

## Authorization Notes

### Restricted Settings
Some settings pages return "Unauthorized" for the current user role (Manager level). Specifically:
- **Occupant types** — "You are not authorized to view this page. Please Log Out and try again."

This suggests certain settings are restricted to Security Officer level or BuildingLink administrator accounts.

---

## Settings Category Descriptions

### Categories with Subtitles
| Category | Subtitle |
|----------|----------|
| Property directory | Main addresses, contacts, message links |
| Event log | General settings, event type, event locations |
| Incident reports | Inactive and active types |

### Categories Without Subtitles (functional descriptions)
| Category | Functional Description |
|----------|----------------------|
| Amenities | Configure amenity types, rules, hours, and reservation settings |
| Asset Manager | Configure asset categories and types |
| Authorized computers | Whitelist computers for secure access |
| Calendar | Configure calendar categories and settings |
| Custom fields | Define custom data fields for units and occupants |
| Design center | Customize visual branding (passports, displays, emails, website, mobile) |
| Displays and consoles | Configure lobby digital signage displays |
| Document types | Define document categories and types |
| Employees | Configure employee roles and settings |
| Event types | Define and manage event type categories |
| Front desk instructions | Configure instruction types and defaults |
| Holidays | Define building holiday calendar (affects operating hours, bookings) |
| Library categories | Configure document library category structure |
| Maintenance/repair categories | Define maintenance request categories and sub-categories |
| Occupant types | Define resident/occupant type classifications (Owner, Tenant, etc.) |
| Parking permits | Configure parking permit types and rules |
| Physical units | Define unit/apartment numbers and properties |
| Predefined maintenance responses | Create canned/template responses for maintenance requests |
| Resident posting categories | Define bulletin board posting categories |
| Shift log settings | Configure shift log templates and settings |
| Special permissions | Set granular employee permissions beyond authority levels |

---

## Concierge Design Implications

### From Settings Deep Dive
1. **23 configuration categories** — comprehensive but potentially overwhelming; Concierge should group these more logically
2. **Panel overlay navigation** — Settings opens as an overlay panel on top of current page, not a dedicated page — allows quick access from anywhere
3. **Property Directory is the identity hub** — addresses, contacts, message links define how the building presents itself
4. **Dual notification pattern** — office email + concierge email on all amenity notifications shows the multi-role workflow
5. **No auto-approve on any amenity** — staff-mediated workflow is the norm, not the exception
6. **Design Center with 5 customization areas** — significant branding/theming capability
7. **Event log settings are granular** — 8+ toggleable features including location module, voice/text notifications, signature privacy
8. **Text notifications enabled, voice disabled** — shows preference for SMS over voice for package notifications
9. **Role-based settings access** — some settings restricted to higher authority levels
10. **Audit trail on settings changes** — "Last changed by" with timestamp on settings pages
11. **Contact ordering** — drag-to-reorder pattern for contacts and message links
12. **Message link visibility matrix** — Staff/Owner/Tenant/Board checkboxes per link — fine-grained audience control
13. **Predefined maintenance responses** — time-saving templates for common maintenance issues
14. **Holiday calendar** — centrally configured, affects amenity hours and booking availability
