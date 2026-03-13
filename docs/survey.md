# Survey

The Survey section allows building management to create and distribute surveys to residents.

**URL**: `/surveys`

---

## Page Header

- **Title**: "Survey" (with clipboard icon)
- **+ Create New Survey** button (outlined) — opens the Create New Survey modal

## Filters

- **Select building**: Dropdown to filter surveys by building

---

## Survey Cards

Each survey is displayed as a card with:

| Field | Description |
|-------|-------------|
| Survey Icon | Document icon |
| Title | Survey name (e.g., "Bond Holiday Party Survey") |
| Status Banner | Orange/yellow banner if expired: "EXPIRED! The survey has expired and is not visible to residents anymore." |
| Visible to Owners | Yes/No |
| Visible to Tenants | Yes/No |
| Expiry Date | Date and time (e.g., "Nov 30, 2023 12:00 AM") |
| Created On | Date and time of creation |
| Updated On | Date and time of last update |
| **View** button | Opens the Survey View modal |

---

## Create New Survey Modal

Opened by clicking **"+ Create New Survey"** button.

**Title**: "Create New Survey"

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Choose building (default: Bond) |
| Brief Survey Description | Yes* | Text input | Survey title/description |
| Expiry Date and Time | No | Date picker with clear (×) button | When the survey expires (default: today's date) |
| Visible to Owners | No | Checkbox | Make survey visible to owners (default: checked) |
| Visible to Tenants | No | Checkbox | Make survey visible to tenants (default: unchecked) |
| **Save** | — | Button | Create the survey |

**Note**: After creating the survey shell, questions are added separately (the create modal only sets up the survey metadata).

---

## Survey View Modal

Opened by clicking **"View"** on a survey card.

**Title**: "Survey View"

### Summary Section
- **Completion Count**: "Your survey has been completed by X unit/units"
- **Question Count**: "Your survey had X Questions"
- **Download Survey Report** button — exports survey results

### Questions List
- Displays all questions in the survey with their answer options
- Questions are shown as text with bullet-point answer choices
- Supports multiple-choice questions (e.g., YES/NO, or multiple options)

---

## Features Summary

- Survey creation and management
- Building-specific survey distribution
- Audience targeting (Owners, Tenants, or both)
- Expiry date management with auto-expiration
- Status tracking (active/expired) with visual banner
- Multiple-choice question support
- Survey response tracking (completion count by unit)
- Survey report download capability
- Building filter dropdown
