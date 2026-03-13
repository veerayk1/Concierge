# URL Route Map

Complete URL routing map for the Aquarius Condo Management Portal.

---

## Top Navigation Bar

| URL | Page | Nav Label |
|-----|------|-----------|
| `/dashboard` | Dashboard | Home |
| `/amenities` | Amenity Booking | Amenities |
| `/manage-users` | User Management | Create User |
| `/unit` | Create Unit | Create Unit |
| `/logs` | Logs Menu | Logs |
| `/packages/0` | Package Management | Packages |

---

## Sidebar Navigation

| URL | Page | Sidebar Label |
|-----|------|---------------|
| `/dashboard` | Dashboard | Dashboard |
| `/unit-file` | Unit File | Unit File |
| `/amenities` | Amenity Booking | Amenities |
| `/security&concierge` | Security & Concierge Menu | Security Menu |
| `/announcement` | Announcements | Announcement |
| `/advertisements` | Advertisements | Advertisement |
| `/maintenance` | Maintenance Requests | Maintenance |
| `/library` | Document Library | Library |
| `/store` | Store | Store |
| `/events` | Events | Events |
| `/reports` | Reports | Reports |
| `/search` | Search | Search |
| `/survey` | Surveys | Survey |
| `/emergency` | Emergency Info | Emergency |
| — (panel) | Contractors | Contractors |

---

## Profile Dropdown Menu

| URL | Page | Menu Item |
|-----|------|-----------|
| `/view-user/{username}` | User Profile | View Profile |
| — (action) | Switch Building | Switch Building |
| — (action) | Language Toggle | English / French |
| `/settings` | Building Settings | Settings |
| `/manage-users` | User Management | User Management |
| `/preferences` | Notification Settings | Email Preferences |
| — (action) | Change Password | Change Password |
| — (action) | Logout | Logout |

---

## Settings Tabs (sub-routes within `/settings`)

| Tab | Description |
|-----|-------------|
| General | Building info, emails, contacts, toggles |
| Parking | Visitor parking rules and limits |
| Login | Login page customization |
| Payment | Payment processor config (Stripe) |
| Amenity | Amenity overview cards |
| Groups | Role/group management (18 groups) |
| Keys | Key inventory management |
| Contractors | Contractor directory CRUD |

---

## Logs Section Anchors

| URL | Section |
|-----|---------|
| `/logs` | All logs |
| `/logs#bulletins` | Bulletin section |

---

## Amenity Booking

| URL | Page |
|-----|------|
| `/amenities` | Amenity listing |
| `/new-amenity` | Create new amenity |
| `/all-bookings` | All bookings view |

---

## Dynamic Routes

| Pattern | Example | Description |
|---------|---------|-------------|
| `/view-user/{username}` | `/view-user/RAY_007` | User profile page |
| `/packages/{buildingId}` | `/packages/0` | Package management for building |

---

## Features

- Bilingual support (English/French) via language toggle
- Multi-building support via "Switch Building" dropdown
- Role-based navigation (some items visible only to certain roles)
- Sidebar navigation for all main modules
- Top navigation for quick-access actions (Create User, Create Unit)
- Profile dropdown for settings and account management
