# Audit: 08-User-Management PRD vs Research

> **Audit date**: 2026-03-14
> **PRD reviewed**: `/docs/prd/08-user-management.md`
> **Research files reviewed**:
> - `/docs/unit-file.md` (Aquarius unit listing)
> - `/docs/create-unit.md` (Aquarius create unit)
> - `/docs/user-profile.md` (Aquarius user profile, 6 tabs)
> - `/docs/user-management.md` (Aquarius user management)
> - `/docs/platform-3/deep-dive-unit-file.md` (Condo Control unit file)
> - `/docs/platform-3/deep-dive-my-account.md` (Condo Control my account)
> - `/docs/platform-2/manage-and-communicate.md` (BuildingLink manage section)

---

## Summary

The PRD is **thorough and exceeds what any single researched platform offers**. It covers the full user lifecycle (creation through deactivation), authentication, 2FA, login audit trail, notification preferences with multi-channel control, session management, and bulk import. The PRD successfully addresses every documented shortcoming from the research (read-only profiles, no password feedback, broken role-gated links, no 2FA). A small number of gaps remain, mostly around features present in research that were not explicitly addressed or excluded.

- **GAPS found**: 6
- **WEAK COVERAGE found**: 5
- **CONFIRMED coverage**: 35+ items

---

## GAPS

Items present in research that are **missing entirely** from the PRD.

### GAP-1: Email Signature (Rich Text) for Staff (Condo Control)

**Source**: `deep-dive-my-account.md` section 5 -- Email Signature tab with CKEditor 5 rich text editor. "Email signature will appear on emails sent to users when posting an Announcement, updating a Service Request or Violation."

Condo Control has a dedicated "Email Signature" tab on the My Account page allowing staff to compose a rich text email signature that is appended to outgoing communications. The PRD's My Account page (section 6.3) describes Profile, Security, and Notifications tabs but does not include an Email Signature tab or any mention of user-configured email signatures.

**Recommendation**: Add an Email Signature feature to the My Account page, at least for staff roles (Property Manager, Front Desk, Security). Include a rich text editor with formatting options, and specify which outgoing communications include the signature (announcements, maintenance request updates, violation notices).

### GAP-2: Unsubscribe from Email Notifications link (Condo Control)

**Source**: `deep-dive-my-account.md` section 2.1 -- "Unsubscribe from Email Notifications: clickable link to unsubscribe"

Condo Control has a one-click unsubscribe link on the user profile. The PRD has granular per-module notification preferences (section 3.1.8) with individual toggles, which is more powerful. However, there is no "unsubscribe from all non-critical emails" shortcut or one-click opt-out mechanism. CAN-SPAM and CASL regulations may require an easy unsubscribe mechanism.

**Recommendation**: Add a "Mute All" or "Unsubscribe from All" toggle at the top of the Notification Preferences page that disables all unsubscribable notifications at once. Also ensure all outgoing emails include an unsubscribe link in the footer per legal requirements.

### GAP-3: Employee Management / Staff Directory (BuildingLink)

**Source**: `manage-and-communicate.md` section 6 -- "Employees: Staff management for building employees. Dashboard shows 'Employees logging-in today' with name, role."

BuildingLink has a dedicated "Employees" section under Manage, showing staff login tracking with a dashboard of who is logging in today. The PRD's User Directory (section 3.1.10) lists all users including staff, filterable by role, but there is no dedicated staff/employee view or "staff logged in today" dashboard widget. The distinction matters for properties with shift-based security staff.

**Recommendation**: Consider adding a "Staff" view or filter preset to the User Directory that shows only staff roles, with a "Currently Active" indicator based on session data. A "Staff on shift today" widget could be cross-referenced to the Shift Log module.

### GAP-4: Special Email Groups / Custom Distribution Lists (BuildingLink)

**Source**: `manage-and-communicate.md` -- "Manage Special Email Groups: 1 Active -- Custom distribution lists beyond standard unit/building groups."

BuildingLink supports custom email distribution lists separate from standard groups. The PRD's notification system (section 3.1.8) covers per-module per-channel preferences, and the 09-Notification module presumably handles delivery, but there is no mention of user-created or admin-created distribution lists for targeted communication.

**Recommendation**: Cross-reference to the Notification module (09) or Announcements module, and specify whether custom distribution groups are supported. This is distinct from roles/permissions and relates to ad hoc communication targeting.

### GAP-5: Manage Missing Email Addresses dashboard (BuildingLink)

**Source**: `manage-and-communicate.md` -- "Manage Missing Email Addresses: Employees (3 missing), Occupants (19 missing)"

BuildingLink proactively tracks and surfaces counts of employees and occupants with missing email addresses. The PRD has a "Missing data score" metric (section 8.1) showing "% of profiles with incomplete information" and AI capability #93 "Missing Data Detection" that generates a weekly report. However, there is no dedicated "Missing Email Addresses" dashboard or quick-action page for administrators to identify and fix missing emails.

**Recommendation**: Add a "Data Quality" section or link on the User Directory page showing counts of users missing email, phone, and emergency contacts, with a direct link to a filtered view of those users. This is more immediately actionable than a weekly AI report.

### GAP-6: Resident Directory / Address Book (BuildingLink)

**Source**: `manage-and-communicate.md` -- "Resident Directory (formerly 'Address Book')" and "Building Directory"

BuildingLink has a Resident Directory (address book) and a separate Building Directory under the Communicate module. These are distinct from the User Management directory -- they are contact lookup tools optimized for quick phone/email lookup rather than full profile management. The PRD has a User Directory (section 3.1.10) but no separate lightweight contact directory or building directory concept.

**Recommendation**: Consider whether the User Directory's search and filter capabilities are sufficient for quick contact lookup, or whether a simplified "Directory" view (name, unit, phone, email only) would serve front desk staff better. If the User Directory covers this use case, add a note explaining why a separate directory is unnecessary.

---

## WEAK COVERAGE

Items present in research that are **partially covered** but lack detail or specificity.

### WEAK-1: Welcome Email Template Configuration (Aquarius)

**Source**: `user-management.md` -- "The email subject and body are configured in the building's Login Instructions settings" and "When welcome emails have already been sent for the selected building, a notice appears"

The PRD covers welcome email sending (section 3.1.3) with configurable templates, placeholder variables, and per-property customization. However, the research shows a notice that appears when "welcome emails have already been sent for this building" to prevent duplicate sends. The PRD does not specify any safeguard against sending bulk welcome emails multiple times to the same users, or any tracking of which users have already received welcome emails.

**Recommendation**: Add a "Welcome Email Status" field or indicator per user (Never Sent, Sent, Resent) and a safeguard in the bulk welcome email flow that warns admins if they are about to resend to users who have already received it.

### WEAK-2: Phone Number Types (Condo Control)

**Source**: `deep-dive-unit-file.md` -- Phone types: Cell, Home, Work, Other. Format: "(437) 223-4489(Cell)"

The PRD's Create User form (section 3.1.1) has a single "Phone Number" field. The resident profile in 07-unit-management has three separate phone fields (Cell, Home, Work). However, Condo Control also supports an "Other" phone type, and the 08-user-management PRD's User data model has only a single `phone` VARCHAR(20) field. There is a disconnect between the single phone field in 08 and the three phone fields in 07.

**Recommendation**: Either align the 08 data model to have phone_cell, phone_home, phone_work fields matching 07's resident profile, or add a PhoneNumber child entity (user_id, number, type, is_primary) that supports unlimited phone numbers with types. Clarify that the Create User form's "Phone Number" field populates the primary/cell number, and additional numbers are added on the profile page.

### WEAK-3: Registration Code System (Condo Control)

**Source**: `deep-dive-unit-file.md` -- "Registration Code: 6-char alphanumeric (e.g., 'HHXK9T')" with "Registration Code Status: Not Used / Used"

The PRD's research summary (07-unit-management, finding #8) says "Adopt with QR code generation and expiration" for the registration code system. However, neither PRD 07 nor PRD 08 specifies the registration code feature in the feature specification sections. The PRD 08 onboarding flow (section 3.1.3) uses a welcome email with a setup link, which may replace the need for registration codes. But the research commitment to adopt registration codes is not fulfilled or explicitly deferred.

**Recommendation**: Either add registration codes as an alternative onboarding method (admin generates a code, gives it to resident, resident self-registers using the code) or explicitly note that the welcome-email-with-setup-link approach supersedes registration codes and explain why.

### WEAK-4: Bulk Welcome Email for Building Onboarding (Aquarius)

**Source**: `user-management.md` -- "Send Welcome Email button: Sends the configured welcome email template to new/selected users" with building-scoped bulk sending.

The PRD supports sending welcome emails per user (section 3.1.3, "Send Welcome Email" checkbox on account creation, "Resend Welcome Email" from profile). The bulk CSV import (section 3.2.1) includes a "send_welcome_email" column. However, there is no explicit "Send Welcome Email to All Pending Users" bulk action on the User Directory page, which is how Aquarius handles building-wide onboarding.

**Recommendation**: Add a bulk action to the User Directory: "Send Welcome Email" available when filtering by status = "Pending Activation". This allows admins to send/resend welcome emails to all users who haven't activated yet, without re-importing.

### WEAK-5: Package Preferences per Resident (Condo Control)

**Source**: `deep-dive-my-account.md` section 10 -- Package Preferences tab (#tab-14), hidden for Security role, "Likely purpose: Resident-facing preferences for how packages are handled (e.g., leave at door vs hold at front desk)"

Condo Control has a Package Preferences tab on the user account page (visible to residents only). The PRD mentions package instructions as part of the Vacation/Away feature in 07-unit-management (section 3.2.3: "Package Instructions: Hold, Return to Sender, Leave with Concierge") but only in the context of vacations. There is no standing package preference per resident for normal (non-vacation) package handling.

**Recommendation**: Consider adding a "Default Package Preference" field on the resident profile (or in the Package Management module) with options like: Hold at Front Desk (default), Leave at Door, Notify Only, Custom Instructions. This would be the resident's standing preference independent of vacation status.

---

## CONFIRMED

Items from research that are **fully covered** in the PRD with adequate detail.

| # | Research Item | Source | PRD Location | Notes |
|---|--------------|--------|-------------|-------|
| 1 | Admin-created accounts (no self-registration) | Aquarius user-management.md | 3.1.1, Principle #1 | Explicit design decision |
| 2 | Welcome email system with configurable templates | Aquarius user-management.md | 3.1.3 | With placeholder variables and per-property config |
| 3 | Building-scoped user management | Aquarius user-management.md | 3.1.1 (#5 Property field) | Property selector on account creation |
| 4 | User group/role assignment | Aquarius user-profile.md | 3.1.1 (#6 Role field) | With role hierarchy enforcement |
| 5 | Unit association on account creation | Aquarius user-profile.md | 3.1.1 (#7 Unit field) | Conditional requirement for resident roles |
| 6 | User status (Active/Inactive) | Aquarius user-profile.md | 3.1.2 | Expanded to 4 states with lifecycle diagram |
| 7 | First Name / Last Name fields | Aquarius user-profile.md | 3.1.1 (#1, #2) | With validation rules |
| 8 | Email address field | Aquarius user-profile.md | 3.1.1 (#3) | With RFC 5322 validation and uniqueness |
| 9 | Phone number field | Aquarius user-profile.md | 3.1.1 (#4) | E.164 format |
| 10 | Front Desk Instructions on user creation | Aquarius user-profile.md | 3.1.1 (#11) | 500 char textarea |
| 11 | Assistance Required flag | Aquarius user-profile.md | 3.1.1 (#10) | Boolean with tooltip |
| 12 | Last login tracking | Aquarius user-profile.md | Data model (last_login_at) | Timestamp field |
| 13 | Account created/updated dates | Aquarius user-profile.md | Data model (created_at, updated_at) | Automatic timestamps |
| 14 | Login audit trail (device, IP, status) | CC deep-dive-my-account.md | 3.1.6 | Enhanced with GeoIP location and failure reason |
| 15 | Two-Factor Authentication | CC deep-dive-my-account.md | 3.1.5 | TOTP with backup codes, admin enforcement |
| 16 | Module-organized email preferences | CC deep-dive-my-account.md | 3.1.8 | 16 types across 9 modules with 3 channels |
| 17 | Auto-save on notification toggle | CC deep-dive-my-account.md | 3.1.8 | "Auto-save on toggle. No save button needed." |
| 18 | Critical emails exempt from preferences | CC deep-dive-my-account.md | 3.1.8 tooltip | "Critical security emails always delivered" |
| 19 | Change Password with 3 fields | CC deep-dive-my-account.md | 3.1.4 | With real-time strength indicator |
| 20 | Password complexity requirements display | CC (missing in research) | 3.1.4 | Strength meter + requirements checklist |
| 21 | Date of Birth field | CC deep-dive-unit-file.md | 3.1.1 (#8) | With age validation (16+) |
| 22 | Company Name field | CC deep-dive-unit-file.md | 3.1.1 (#9) | 100 chars |
| 23 | Language Preference | CC deep-dive-my-account.md | 3.1.1 (#13) | Dropdown with supported languages |
| 24 | Require Assistance flag | CC deep-dive-unit-file.md | 3.1.1 (#10) | Boolean with tooltip |
| 25 | Profile photo support | CC (missing in research) | 3.1.7 (#8 editable) | Profile photo upload |
| 26 | Self-service profile editing | CC (broken in research) | 3.1.7 | 8 editable fields with verification for email |
| 27 | Email change verification flow | Not in any platform | 3.1.7 | 6-step verification flow |
| 28 | Hidden navigation for unauthorized features | CC (broken in research) | Research finding #4 | "Features a user cannot access are completely invisible" |
| 29 | Bulk user import via CSV | Not in any platform | 3.2.1 | 500-row limit, validation preview, partial import |
| 30 | User search with multiple filters | All platforms | 3.1.10 | 7 filter types including 2FA |
| 31 | Export (CSV/Excel/PDF) | CLAUDE.md non-negotiable | 3.1.10 | Export button on directory |
| 32 | Session management (multi-device) | Not in any platform | 3.1.9 | 5 devices, per-session sign-out |
| 33 | Account suspension with immediate enforcement | Not in any platform | 3.1.2 | All sessions invalidated immediately |
| 34 | Suspicious login detection (AI) | Not in any platform | 7.1 | Risk scoring with admin alerts |
| 35 | Contact validation / typo detection (AI) | Not in any platform | 7.2 | "Did you mean gmail.com?" inline suggestion |
| 36 | Temporary roles with expiry (v2) | Not in any platform | 3.2.3 | Auto-revoke at expiry |
| 37 | Account merge for multi-property users (v2) | Not in any platform | 3.2.4 | Super Admin only |

---

*Audit completed: 2026-03-14*
*Total items audited: 48+*
*Gaps: 6 | Weak coverage: 5 | Confirmed: 37*
