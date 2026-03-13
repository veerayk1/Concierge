# Logs Menu

The Logs Menu provides creation and management for 6 log types plus a bulletin system.

**URL**: `/logs`

**Title**: "Logs Menu"

---

## Page Structure

The page is organized as sequential sections, each containing:
1. A **"Create [Type] Log"** button (dark blue)
2. A **"View All"** link
3. A data table with recent entries
4. Pagination (5 rows per page)

---

## Log Types

### 1. General Log

**Table Columns**: Reference #, Title, Creation By, Creation Time, View, Edit, Delete

**Create General Log Modal Fields**:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Building selector |
| Related Unit | No | Dropdown | Unit association |
| Post in all buildings | No | Checkbox | "Your log will be posted in all the buildings you have access to" |
| Title | Yes* | Text input | Log title |
| Event Date and Time | Yes* | DateTime picker | Defaults to current date/time |
| Send Copy | No | Multi-select dropdown | Email recipients for copy |
| General log Details | Yes* | Rich text editor | Full WYSIWYG editor with font, size, alignment, lists, images, links, tables, etc. Word count shown |

**Submit Buttons**: "Save and Exit" | "Save and New"

---

### 2. Incident Log

**Create Incident Log Modal Fields**:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Building selector |
| Related Unit | No | Dropdown | Unit association |
| Time Incident Occurred | No | DateTime picker | When the incident happened |
| Incident Title | No | Text input | Incident title |
| Incident Type | No | Dropdown | Category of incident (requires building selection) |
| Incident Details | Yes* | Rich text editor | Full WYSIWYG editor. Pre-filled with "Full Report to Follow..." |
| Suspect | No | Text input | Suspect description |
| Were police/fire department etc called? | No | Toggle switch | Emergency services notification |
| Send Copy | No | Multi-select dropdown | Email recipients |
| Attach any files | No | File upload | Max 4 files, multi-select with CTRL/CMD |

**Submit Button**: "Save"

---

### 3. Fire Log

**Create Fire Log Modal Fields**:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Building selector |
| Related Unit | No | Dropdown | Unit association |
| Log Title | Yes* | Text input | Fire log title |
| Start Date and Time | Yes* | DateTime picker | When fire event started |
| Time fire alarm went off | Yes* | DateTime picker | Alarm activation time |
| Where is the alarm? | Yes* | Text input | Alarm location |
| What kind of alarm? | Yes* | Text input | Alarm type |
| Time you called the fire department | Yes* | DateTime picker | FD call time |
| Time you made the first announcement | Yes* | DateTime picker | First PA announcement |

**Prepare for fire department arrival** (Checklist):
- [ ] Fire Safety Plan
- [ ] Fire department keys
- [ ] List of residents that need fire assistance

**Ensure elevators respond** (Checklist):
- [ ] Elevator 1 (If available)
- [ ] Elevator 2 (If available)
- [ ] Elevator 3 (If available)
- [ ] Elevator 4 (If available)

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Time fire department arrives | Yes* | DateTime picker | FD arrival time |
| Time you made the second announcement | No | DateTime picker | Second PA announcement |
| Time fire department gives all clear | No | DateTime picker | All-clear time |

**Reset electronic devices** (Checklist):
- [ ] Pull Station
- [ ] Smoke Detector
- [ ] Heat Detector
- [ ] Sprinkler Head
- [ ] Fire Panel
- [ ] Mag Locks
- [ ] Elevators

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Time you made the third announcement | No | DateTime picker | Third PA announcement |
| Time of fire department departure | Yes* | DateTime picker | FD departure time |
| Fire log Details | Yes* | Textarea | Pre-filled "Full Report to Follow..." |
| Send Copy | No | Multi-select dropdown | Email recipients |
| Attach any files | No | File upload | Max 4 files |

---

### 4. Noise Log

**Create Noise Log Modal Fields**:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Building selector |
| Related Unit | No | Dropdown | Unit association |
| Title | No | Text input | Noise log title |
| Event Date and Time | No | DateTime picker | When noise occurred |

**Nature of Complaint** (Checkbox list — multi-select):
- [ ] Drop on Floor
- [ ] Loud Music
- [ ] Smoking Hallways
- [ ] Smoking in Suite
- [ ] Hallway Noise
- [ ] Piano Playing
- [ ] Dog Barking
- [ ] Cooking Odors
- [ ] Children Playing
- [ ] Walking/Banging
- [ ] Party
- [ ] Talking
- [ ] Construction
- [ ] Other

**Investigation Fields**:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Upon investigating the complainant's floor the noise was noticeable by | Yes* | Dropdown | How noise was detected |
| Upon investigating the suspect's floor the noise was noticeable | Yes* | Dropdown | How noise was detected at suspect floor |
| Upon investigating the suspect's floor the noise duration was | Yes* | Dropdown | Duration assessment |
| Upon investigating the suspect's floor the noise degree/volume was | Yes* | Dropdown | Volume assessment |
| Length of time verified | No | Text input | Duration in minutes |

**Suspect contacted by** (Checkbox list):
- [ ] Home Phone
- [ ] Work Phone
- [ ] Other Phone
- [ ] At the door
- [ ] No one home

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Complainant contacted to advise of action taken | Yes* | Dropdown | How complainant was notified |
| Noise log Details | Yes* | Textarea | Pre-filled "Full Report to Follow..." |

---

### 5. Pre/Post Inspection Log

**Create Inspection Log Modal Fields**:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Inspection Type | Yes* | Dropdown | Options: "Pre Inspection", "Post Inspection" |
| Select Building | Yes* | Dropdown | Building selector |
| Related Booking | No | Dropdown | Link to amenity booking |
| Title | Yes* | Text input | Inspection title |
| Inspection Date and Time | Yes* | DateTime picker | Defaults to current |
| Inspection Details | Yes* | Textarea | Inspection notes |

**Submit Button**: "Save"

---

### 6. Bulletin

**Create Bulletin Modal Fields**:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | No | Dropdown | Building selector |
| Title | Yes* | Text input | Bulletin title |
| Expiry Date and Time | No | DateTime picker | Defaults to 7 days from now |
| Never Expire | No | Checkbox | Override expiry |
| Bulletin Details | Yes* | Textarea | Bulletin content |
| Attach a file | No | File upload | Single file attachment |

**URL anchor**: `/logs#bulletins`

---

## Common Table Features

All log tables share:
- **Columns**: Reference #, Title, Creation By, Creation Time, View, Edit, Delete
- **Pagination**: 5 rows per page, Previous/Next navigation, page count display
- **Row-per-page selector**: Configurable (default 5)
- **Fire Log table** also has: a cloud/download icon column (likely PDF export)
- **View** link opens log detail view
- **Edit** icon opens edit modal
- **Delete** icon (trash) for soft-delete

## Dashboard Integration

- **"+ Shift Logs"** button on the dashboard creates General Logs (shift reports)
- Dashboard shows recent log entries in a summary section
- Dashboard stats: "7136 LOGS" total count
