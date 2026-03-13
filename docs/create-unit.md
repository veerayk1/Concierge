# Create Unit

The Create Unit page allows staff to register a new residential/commercial unit in the building management system.

**URL**: `/unit`

**Top Nav**: "Create Unit" tab in the top navigation bar

---

## Form Fields

### Basic Information

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select building | Yes* | Dropdown | Choose building for the new unit |
| Unit Number | Yes* | Text input | The unit number/identifier |
| Package email notification | No | Checkbox | "Do you want to send package related Email notification to all residents of this unit?" |
| Comments | No | Textarea | General comments about the unit |

### Access & Facility Details

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| EnterPhone code | No | Text input | Entry phone/intercom code for the unit |
| Parking Spot | No | Text input | Assigned parking spot number |
| Locker | No | Text input | Assigned locker number |

### FOB/Remote/Key (6 slots)

Supports up to 6 FOB/Remote/Key entries, each with:

| Field | Type | Description |
|-------|------|-------------|
| Type | Dropdown | Options: Access Card, FOB, Key, Remote |
| Serial Number | Text input | Serial number of the FOB/remote/key |

Entries labeled: FOB/Remote/Key 1 through FOB/Remote/Key 6

### Buzzer Codes (2 slots)

| Field | Type | Description |
|-------|------|-------------|
| Code | Text input | Buzzer code value |
| Comments | Text input | Notes about the buzzer code |

Entries labeled: Buzzer Code 1, Buzzer Code 2

### Garage Clickers (2 slots)

| Field | Type | Description |
|-------|------|-------------|
| Garage Clicker 1 | Text input | First garage clicker identifier |
| Garage Clicker 2 | Text input | Second garage clicker identifier |

### Key Tag

| Field | Type | Description |
|-------|------|-------------|
| Key Tag | Text input | Key tag identifier for the unit |

---

## Submit

- **"Save"** button (outlined style) — creates the unit in the system

---

## Features Summary

- Comprehensive unit registration with all physical access details
- Up to 6 FOB/Remote/Key assignments with type classification (Access Card, FOB, Key, Remote)
- Dual buzzer code support with comments
- Dual garage clicker registration
- Parking spot and locker assignment
- Entry phone code configuration
- Package notification opt-in per unit
- Multi-building support
