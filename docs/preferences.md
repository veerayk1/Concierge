# Notification Settings (Email Preferences)

The Notification Settings page allows users to configure which email notifications they receive from the system.

**URL**: `/preferences`

**Title**: "Notification Settings" (with bell icon)

**Access**: Profile dropdown menu → "Email Preferences" or User Profile → "Notification Preferences" tab

---

## Notification Options

All options are checkboxes (checked = enabled, unchecked = disabled):

| # | Notification Setting | Default State | Description |
|---|---------------------|---------------|-------------|
| 1 | Emails Declined | Unchecked | Opt out of emails sent via the site. Does NOT apply to booking warnings, package notices, or similar system-generated emails. Content is kept private and not shown publicly. Must keep this OFF to receive announcement-related emails. |
| 2 | Amenity booked notification | Unchecked | Notify when an amenity is booked |
| 3 | Amenity booking cancelled notification | Unchecked | Notify when an amenity booking is cancelled |
| 4 | Service request created | Checked ✓ | Notify when a new service/maintenance request is created |
| 5 | Service request updated | Checked ✓ | Notify when a service/maintenance request is updated |
| 6 | New security report/log created | Checked ✓ | Notify when a new security report or log entry is created |
| 7 | Parking violation created and updated | Unchecked | Notify when a parking violation is created or updated |
| 8 | New event added | Checked ✓ | Notify when a new event is added |
| 9 | Resident edits profile | Checked ✓ | Notify when a resident edits their own profile |
| 10 | Emergency Assistance updates | Checked ✓ | Notify when a resident updates Emergency Assistance related requirements |

### Save Button

- **"Save"** button (dark blue) — saves notification preference changes

---

## Important Notes

- The "Emails Declined" option is a master opt-out but has exceptions for critical system emails
- Notification preferences are per-user (each staff/admin sets their own)
- Changes take effect immediately upon saving
- Some notifications may be role-dependent (e.g., security reports relevant to security staff)

---

## Role-Based Notification Relevance

| Role Type | Most Relevant Notifications |
|-----------|------------------------------|
| Admin / Property Manager | All 10 categories |
| Concierge / Front Desk | Service requests, security logs, parking violations, resident profile changes |
| Security Staff | Security logs, parking violations, emergency assistance changes |
| Resident / Tenant | Amenity bookings, events, service request updates |
| Owner | Amenity bookings, events, service requests, profile changes |

---

## Anticipated Behaviors

1. **Emails Declined** is a soft opt-out — system-critical emails (booking confirmations, package arrivals) still send regardless
2. Notifications route to the user's primary email address from their profile
3. The "from" email address for each category is configured in Settings > General > Default Email Settings
4. Auto-CC recipients for log-type notifications are configured separately in Settings > General > Auto-CC Email Lists
5. Parking-related notifications have their own role-based configuration in Settings > Parking tab (9 roles can be toggled independently)

---

## Features Summary

- 10 configurable email notification categories
- Master email opt-out with critical email exceptions
- Per-user notification customization
- Covers: amenities, maintenance, security, parking, events, profiles, emergency
- Accessible from both profile dropdown and user profile page

---

## Concierge Improvement Opportunities

1. **Granular channels** — Let users choose email vs. in-app vs. push per category
2. **Frequency control** — Instant, daily digest, or weekly summary options
3. **Quiet hours** — Don't send non-critical notifications during specified hours
4. **Smart grouping** — Batch multiple related notifications into a single email
5. **Category expansion** — Add package arrival, visitor check-in, maintenance scheduled, move-in/move-out
6. **Priority levels** — Mark certain notifications as urgent (fire log, emergency assistance) with different delivery behavior
7. **Preview** — Show a sample notification before enabling each category
