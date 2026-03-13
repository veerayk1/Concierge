# Advertisement

The Advertisement section allows residents to post classified-style advertisements (for sale, services, etc.) that require property manager approval before appearing on the site.

**URL**: `/advertisements`

---

## Page Header

- **Title**: "Advertisement" (with megaphone icon)
- **+ Create Advertisements** button (blue/filled) — opens the create advertisement form
- **Approve Advertisements** button (outlined) — opens the approval queue modal

## Status Filter

- **Dropdown** with options: **All**, **Approved**, **Unapproved**
- Filters the advertisement cards displayed

## Content Area

- Displays advertisement cards in a grid when available
- Shows "No advertisements to show" when empty

---

## Create Advertisements Form

Opened by clicking **"+ Create Advertisements"** button. Appears as an inline panel (not a modal) with a "Back" button to return.

**Approval Notice**: "Please note that your post will need to be approved by the Property Manager before appearing on the site. Please allow at least 2 business days for them to review."

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select building | Yes* | Dropdown | Choose building for the advertisement |
| Select Category | Yes* | Dropdown | Category of advertisement (default: "Biz") |
| Title | Yes* | Text input | Advertisement title |
| Advertisement Details | Yes* | Textarea | Advertisement body/description |
| Attachments | No | Drag-and-drop file upload | Max 4 files, multi-select with CTRL/CMD. "Drop files here" area |
| Price | No | Text input | "You can also mention that it's free or the interested person may contact" |
| I agree to term and conditions? | Yes* | Checkbox | Must agree before posting |
| **Post** | — | Button | Submit advertisement for approval |

---

## Approve Advertisements Modal

Opened by clicking **"Approve Advertisements"** button.

**Title**: "Unapproved Advertisements"

### Unapproved Advertisements Table

| Column | Description |
|--------|-------------|
| Approve | Checkbox/action to approve the advertisement |
| Title | Advertisement title |
| Advertisement Category | Category (e.g., Biz) |
| Advertisement Details | Body content of the ad |
| Expiry Date | When the advertisement expires |
| Building | Which building it belongs to |
| Price | Listed price |
| Author | Who posted the advertisement |
| Created On | Date of submission |

---

## Workflow

1. **Resident/User creates** an advertisement via the Create form
2. Advertisement enters **Unapproved** status (pending review)
3. **Property Manager reviews** via the Approve Advertisements modal
4. Manager can **approve** or **reject** the advertisement
5. Approved advertisements appear in the main Advertisement listing
6. Filter dropdown allows viewing All, Approved, or Unapproved ads

---

## Features Summary

- Classified-style advertisement posting by residents
- Property manager approval workflow (moderation system)
- Category-based organization
- File attachment support (up to 4 files)
- Optional pricing field
- Terms and conditions agreement required
- Status-based filtering (All/Approved/Unapproved)
- Multi-building support
