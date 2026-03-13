# Maintenance (Service Requests)

The Maintenance section manages service requests submitted by residents for repairs, maintenance, and building services.

**URL**: `/service-requests`

---

## Page Header

- **Title**: "Service Requests" (with gear icon)
- **Create Service Request** button (blue/filled) — opens the create form

## Search & Filters

| Filter | Type | Description |
|--------|------|-------------|
| Search by keyword | Text input + search icon | Keyword search across requests |
| Status Filter | Dropdown with clear (×) button | Default: "All" |
| Search | Button (red) | Execute search |
| Reset Search | Button (outlined) | Clear all filters |
| Print Requests | Button (outlined) | Print the service requests list |

### Status Filter Options
- **All** — show all requests
- **Open** — currently open/active requests
- **Received** — acknowledged but not yet started
- **On hold** — paused requests
- **Closed** — completed/resolved requests

---

## Service Request Cards

Displayed in a **3-column grid layout**. Each card contains:

| Field | Description |
|-------|-------------|
| Title | Request heading (e.g., "Microwave Broken", "Cupboard mechanism") |
| Status | Current status (Open, Received, On hold, Closed) |
| Sent By | Username of submitter (e.g., "cameronclasper2") |
| Request Type | Category (e.g., "In Suite Repairs", "Service Request") |
| Priority | Priority level (High, Normal, Low) |
| Posted On | Date and time (e.g., "Mar 10, 2026 7:43 PM") |
| Assigned To | Staff member assigned (may be empty) |
| Authorization to enter | Suite entry permission status (e.g., "Granted") |
| Detail | Full description of the service request |

### Card Action Buttons

| Button | Action |
|--------|--------|
| **View** | View full service request details |
| **Update** | Update the service request (change status, add notes) |
| **Delete** | Delete the service request |

---

## Create Service Request Form

Opened by clicking **"Create Service Request"** button. Appears as an inline panel with a "Back" button.

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Choose building (default: Bond) |
| Request Type | Yes* | Dropdown | Category of request (e.g., In Suite Repairs, Service Request) |
| Priority | Yes* | Dropdown | Priority level (High, Normal, Low) |
| Assign To | Yes* | Dropdown | Assign to a staff member |
| Select Unit | No | Dropdown | Associate with a specific unit |
| Requested By | Yes* | Dropdown | Person making the request |
| Title | Yes* | Text input | Brief description of the issue |
| Service Request Details | No | Textarea | Full description ("Request Details...") |
| Attach a file | No | Drag-and-drop upload | "Drop files here" area |
| I authorize building staff to enter my suite | No | Checkbox | Grant suite entry permission |
| **Save** | — | Button | Submit the service request |

---

## Request Types
- **In Suite Repairs** — repairs inside individual units
- **Service Request** — general building service requests

## Priority Levels
- **High** — urgent issues
- **Normal** — standard priority
- **Low** — non-urgent issues

---

## Features Summary

- Keyword search across all requests
- Status-based filtering (All, Open, Received, On hold, Closed)
- Priority-based categorization (High, Normal, Low)
- Request type classification
- Staff assignment tracking
- Suite entry authorization tracking
- File attachment support
- Print capability
- Card-based grid layout (3 per row)
- View, Update, and Delete actions per request
