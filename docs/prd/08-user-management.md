# 08 -- User Management

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

User Management controls the full lifecycle of every person who accesses the Concierge platform -- from the moment an admin creates their account to the moment they are deactivated. It covers account creation, onboarding, authentication, profile management, notification preferences, session security, and audit logging.

### Why It Matters

In condo environments, user accounts are tied to physical building access (FOBs, keys, buzzer codes). A compromised account or a stale active account is not just a software risk -- it is a physical security risk. User Management must be tight, auditable, and admin-controlled.

### Core Principles

| #   | Principle                       | Detail                                                                                                                                                                                       |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Admin-created accounts only** | No self-registration, no SSO, no social login. An admin creates every account and assigns a role. This is a deliberate security decision for environments where building access is at stake. |
| 2   | **One role per property**       | A user holds exactly one role per property. They may have different roles at different properties. See 02-Roles and Permissions for the full hierarchy.                                      |
| 3   | **Immediate enforcement**       | Role changes, password resets, and deactivations take effect instantly. No stale session caching.                                                                                            |
| 4   | **Self-service where safe**     | Users can edit their own name, phone, and email (with verification). They cannot change their role, unit, or status.                                                                         |
| 5   | **Audit everything**            | Every login, role change, profile edit, and account action is logged with timestamp, actor, IP, and device.                                                                                  |

### Module Scope

| In Scope                             | Out of Scope                                     |
| ------------------------------------ | ------------------------------------------------ |
| Account creation (single + bulk CSV) | Unit management (see 07)                         |
| Role assignment per property         | FOB/key management (see 07)                      |
| Welcome email and onboarding flow    | Vendor accounts (see 05)                         |
| Password policy and reset            | Payment/billing configuration (see 16)           |
| Two-factor authentication (TOTP)     | Role definition and custom role builder (see 02) |
| Login audit trail                    | Notification delivery infrastructure (see 09)    |
| Profile self-editing                 | Emergency contacts (see 07)                      |
| Notification preferences per module  |                                                  |
| Session management                   |                                                  |
| Bulk user import via CSV             |                                                  |
| Account suspension and deactivation  |                                                  |
| User search with filters             |                                                  |
| Recent Account Activity page         |                                                  |

---

## 2. Research Summary

### Key Findings from Competitive Analysis

| #   | Finding                                                                                                                                                                       | Source                                | Impact on Concierge                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | One platform offers admin-created accounts with welcome email templates but no 2FA, no login audit trail, and email-only notifications                                        | Industry research (Platform A)        | Concierge adds 2FA, login auditing, and multi-channel notifications from day one                        |
| 2   | Another platform provides a login audit trail (device, IP, status) and optional 2FA, but profiles are entirely read-only -- users cannot edit their own name, phone, or email | Industry research (Platform C)        | Concierge provides self-service editing for basic profile fields with verification                      |
| 3   | Module-organized email preferences (12 types across 10 modules) provide more clarity than flat checkbox lists (10 checkboxes in a single list)                                | Industry research (Platforms A and C) | Concierge groups notification preferences by module with per-channel control                            |
| 4   | One platform shows a "Package Preferences" sidebar link to all roles, but the destination tab is hidden for non-resident roles -- a silent failure                            | Industry research (Platform C)        | Concierge hides navigation items entirely for unauthorized roles. Never show what a user cannot access. |
| 5   | No observed platform shows password complexity requirements on the change-password screen. Users guess and fail.                                                              | Industry research (all platforms)     | Concierge displays all password requirements inline with real-time validation feedback                  |
| 6   | One platform mixes modern SPA pages with legacy server-rendered pages for account management, creating an inconsistent experience                                             | Industry research (Platform C)        | Concierge uses a single, consistent architecture for all account pages                                  |
| 7   | Bulk welcome email sending exists but bulk user import (CSV) does not in any observed platform                                                                                | Industry research (all platforms)     | Concierge supports CSV import for bulk onboarding of entire buildings                                   |
| 8   | No platform provides AI-powered suspicious login detection or profile auto-complete                                                                                           | Industry gap                          | Concierge integrates AI for login anomaly detection and onboarding assistance                           |

### What We Steal (Best Patterns)

- Login audit trail with device, IP, and success/failure status
- Module-organized notification preferences with individual toggles
- Welcome email templates configurable per property
- 2FA as a user-controlled option with admin enforcement capability
- Electronic consent tracking for legal compliance

### What We Fix (Worst Patterns)

- Read-only profiles that require admin intervention for basic info changes
- Empty states with no action buttons (e.g., "No emergency contacts" but no Add button)
- No password complexity feedback during password changes
- Visible-but-broken navigation links for role-gated features
- No bulk user import capability

---

## 3. Feature Specification

### 3.1 Core (v1)

#### 3.1.1 Account Creation (Single)

| Aspect                  | Detail                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Who**                 | Super Admin, Property Admin                                                                                                                                                                                                     |
| **What**                | Create a new user account tied to a specific property with a role assignment                                                                                                                                                    |
| **Acceptance Criteria** | Admin fills in required fields, assigns role and unit, saves. System generates a temporary password, creates the account, and queues the welcome email. Account appears in the user directory with "Pending Activation" status. |

**Create User Form Fields**

| #   | Field                   | Data Type          | Max Length | Required    | Default          | Validation                                                                                                                                                                                                                                                 | Error Message                                                                       |
| --- | ----------------------- | ------------------ | ---------- | ----------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | First Name              | String             | 50 chars   | Yes         | --               | Letters, hyphens, apostrophes, spaces only. Min 1 char.                                                                                                                                                                                                    | "First name is required" / "First name contains invalid characters"                 |
| 2   | Last Name               | String             | 50 chars   | Yes         | --               | Letters, hyphens, apostrophes, spaces only. Min 1 char.                                                                                                                                                                                                    | "Last name is required" / "Last name contains invalid characters"                   |
| 3   | Email Address           | String (email)     | 254 chars  | Yes         | --               | Valid RFC 5322 email format. Must be unique across the property.                                                                                                                                                                                           | "Valid email address is required" / "This email is already in use at this property" |
| 4   | Phone Number            | String             | 20 chars   | No          | --               | E.164 format with country code. Digits, +, -, (, ) only. This populates `phone_cell` (the primary/cell number). Additional phone types (Home, Work) can be added on the resident profile page (see 07-Unit-Management, section 3.1.5 Tab 1, fields #8-#9). | "Enter a valid phone number with country code"                                      |
| 5   | Property                | UUID (select)      | --         | Yes         | Current property | Must be a property the admin has access to                                                                                                                                                                                                                 | "Select a property"                                                                 |
| 6   | Role                    | UUID (select)      | --         | Yes         | --               | Must be a valid role for the selected property. Cannot exceed admin's own permissions.                                                                                                                                                                     | "Select a role"                                                                     |
| 7   | Unit                    | UUID (select)      | --         | Conditional | --               | Required for resident roles. Optional for staff roles. Must be a valid unit at the selected property.                                                                                                                                                      | "Unit is required for resident accounts"                                            |
| 8   | Date of Birth           | Date               | --         | No          | --               | Must be in the past. Must make user at least 16 years old. Format: YYYY-MM-DD.                                                                                                                                                                             | "Date of birth must be a past date" / "User must be at least 16 years old"          |
| 9   | Company Name            | String             | 100 chars  | No          | --               | Letters, numbers, spaces, common punctuation.                                                                                                                                                                                                              | "Company name contains invalid characters"                                          |
| 10  | Require Assistance      | Boolean            | --         | No          | No               | --                                                                                                                                                                                                                                                         | --                                                                                  |
| 11  | Front Desk Instructions | String (textarea)  | 500 chars  | No          | --               | Free text. No HTML.                                                                                                                                                                                                                                        | "Instructions cannot exceed 500 characters"                                         |
| 12  | Send Welcome Email      | Boolean (checkbox) | --         | No          | Yes (checked)    | --                                                                                                                                                                                                                                                         | --                                                                                  |
| 13  | Language Preference     | String (select)    | --         | No          | English          | Must be a supported language.                                                                                                                                                                                                                              | --                                                                                  |

**Tooltip**: "Require Assistance" -- "Enable this if the resident needs accessibility accommodations or emergency assistance. This flag is visible to front desk and security staff."

**Create User Button**

| State                    | Behavior                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Default**              | Label: "Create Account". Blue filled button.                                                                           |
| **Loading**              | Label changes to "Creating...". Spinner icon replaces text. Button disabled.                                           |
| **Success**              | Toast notification: "Account created for [First Name] [Last Name]. Welcome email queued." Redirects to user directory. |
| **Failure (validation)** | Inline errors appear below each invalid field. Button re-enables. Page scrolls to the first error.                     |
| **Failure (server)**     | Toast notification (red): "Failed to create account. Please try again." Button re-enables.                             |

#### 3.1.2 Account Status Lifecycle

```
                    +------------------+
                    | Pending          |
     Admin creates  | Activation       |
     account        +--------+---------+
                             |
                    User clicks welcome
                    email link + sets password
                             |
                    +--------v---------+
              +---->| Active            |<----+
              |     +--------+---------+     |
              |              |               |
         Admin            Admin           Admin
         reactivates      suspends        deactivates
              |              |               |
              |     +--------v---------+     |
              +-----| Suspended         |     |
                    +------------------+     |
                                             |
                    +--------v---------+     |
                    | Deactivated       |-----+
                    +------------------+  (admin reactivates)
```

| Status                 | Description                                                                                    | Login Allowed |       Data Visible        | Can Be Changed By             |
| ---------------------- | ---------------------------------------------------------------------------------------------- | :-----------: | :-----------------------: | ----------------------------- |
| **Pending Activation** | Account created, user has not completed onboarding                                             |      No       |      Yes (to admin)       | System (on activation), Admin |
| **Active**             | User has completed onboarding and can log in                                                   |      Yes      |            Yes            | Admin                         |
| **Suspended**          | Temporarily blocked. Used for policy violations, investigations, or extended absence.          |      No       |      Yes (to admin)       | Admin                         |
| **Deactivated**        | Permanently inactive. Used for move-outs or terminations. Data is retained for audit purposes. |      No       | Yes (to admin, read-only) | Admin (can reactivate)        |

**Status Change Button**

| State            | Behavior                                                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default**      | Dropdown with options: Activate, Suspend, Deactivate. Label matches the next valid transition.                                                                                |
| **Confirmation** | Modal dialog: "Are you sure you want to [suspend/deactivate] [User Name]? [Explanation of what happens]." Two buttons: "Cancel" (secondary) and "[Action]" (destructive red). |
| **Loading**      | Modal button shows spinner. "Processing..." label.                                                                                                                            |
| **Success**      | Toast: "[User Name] has been [suspended/deactivated/reactivated]." All active sessions invalidated immediately.                                                               |
| **Failure**      | Toast (red): "Failed to change account status. Please try again." Modal stays open.                                                                                           |

#### 3.1.3 Welcome Email and Onboarding

**Welcome Email Content**

| Component                    | Detail                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Subject**                  | Configurable template. Default: "Welcome to [Property Name] -- Set Up Your Account"                                                                                                                                                                                                                                                       |
| **Body**                     | Configurable rich text template. Must include: temporary password or setup link, login URL, property name, support contact.                                                                                                                                                                                                               |
| **Template location**        | Settings > Login Instructions                                                                                                                                                                                                                                                                                                             |
| **Send trigger**             | Automatic on account creation (if checkbox enabled) or manual from the user profile                                                                                                                                                                                                                                                       |
| **Resend**                   | Admin can resend from the user's profile page. "Resend Welcome Email" button.                                                                                                                                                                                                                                                             |
| **Welcome Email Status**     | Tracked per user. Values: Never Sent, Sent (with timestamp), Resent (with count and last timestamp). Displayed as a badge on the user's profile header and in the User Directory table on hover.                                                                                                                                          |
| **Duplicate send safeguard** | When an admin initiates a bulk welcome email send (via the "Send Welcome Email" bulk action on the User Directory), the system warns if any selected users have already received a welcome email: "X of Y selected users have already received a welcome email. Proceed to resend?" with "Send to All" and "Send to Unsent Only" options. |

**Onboarding Flow (User's First Login)**

| Step | Screen                       | What Happens                                                                                                               |
| ---- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1    | Set Password                 | User clicks setup link from email. Enters new password (with real-time complexity feedback). Confirms password.            |
| 2    | Review Profile               | User sees pre-filled profile (name, email, unit). Can update phone number.                                                 |
| 3    | Set Notification Preferences | Checkbox grid of notification types organized by module. Smart defaults pre-selected based on role.                        |
| 4    | Enable 2FA (Optional)        | Prompt to set up TOTP authenticator. "Set Up Now" or "Skip for Now" (skip allowed unless admin enforces 2FA for the role). |
| 5    | Complete                     | Dashboard loads. Tooltip tour highlights key features for the user's role.                                                 |

**Alternative Onboarding: Registration Codes (v2)**

In addition to the welcome-email-with-setup-link approach (the default onboarding method), Concierge supports registration codes as an alternative for properties where email delivery is unreliable or where admin prefers in-person onboarding.

| Aspect              | Detail                                                                                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Code format**     | 6-character alphanumeric, auto-generated (e.g., "HHXK9T"). Optionally rendered as a QR code for scanning.                                                                                                       |
| **Generation**      | Admin generates a code per user from the user's profile page ("Generate Registration Code" button) or in bulk from the User Directory ("Generate Codes" bulk action).                                           |
| **Delivery**        | Admin prints or shares the code in person, on paper, or via a physical welcome packet.                                                                                                                          |
| **Expiry**          | Codes expire after a configurable period (default: 72 hours). Expired codes show "Expired" status and can be regenerated.                                                                                       |
| **Status tracking** | Per-code status: Generated, Used, Expired. Displayed on the user's profile.                                                                                                                                     |
| **Redemption**      | Resident visits the property's login page, clicks "I have a registration code", enters the code, and proceeds to the standard onboarding flow (Set Password > Review Profile > Notification Preferences > 2FA). |
| **Validation**      | Code must be valid, unexpired, and unused. Invalid code shows: "This code is invalid or has expired. Contact your property administrator for a new code."                                                       |

#### 3.1.4 Password Policy

| Rule                       | Value                                     |             Configurable              |
| -------------------------- | ----------------------------------------- | :-----------------------------------: |
| Minimum length             | 8 characters                              |              Yes (8-32)               |
| Uppercase required         | At least 1                                |             Yes (on/off)              |
| Lowercase required         | At least 1                                |             Yes (on/off)              |
| Number required            | At least 1                                |             Yes (on/off)              |
| Special character required | At least 1                                |             Yes (on/off)              |
| Password history           | Cannot reuse last 5 passwords             |              Yes (0-24)               |
| Maximum age                | 90 days (staff), never expire (residents) |                  Yes                  |
| Failed login lockout       | 5 attempts triggers 15-minute lockout     | Yes (3-10 attempts, 5-60 min lockout) |

**Password Strength Indicator**

Displayed in real-time as the user types.

| Strength    | Color      | Criteria                                                |
| ----------- | ---------- | ------------------------------------------------------- |
| Weak        | Red        | Meets fewer than 3 of the 4 character type requirements |
| Fair        | Orange     | Meets 3 of 4 requirements but under 10 characters       |
| Strong      | Green      | Meets all 4 requirements and 10+ characters             |
| Very Strong | Dark green | Meets all requirements and 14+ characters               |

**Change Password Form Fields**

| #   | Field                | Data Type | Required | Validation                                                            | Error Message                                                            |
| --- | -------------------- | --------- | -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Current Password     | Password  | Yes      | Must match stored hash                                                | "Current password is incorrect"                                          |
| 2   | New Password         | Password  | Yes      | Must meet complexity rules. Cannot match current or last 5 passwords. | "Password does not meet requirements" / "Cannot reuse a recent password" |
| 3   | Confirm New Password | Password  | Yes      | Must exactly match New Password                                       | "Passwords do not match"                                                 |

**Change Password Button**

| State       | Behavior                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| **Default** | Label: "Update Password". Blue filled button. Disabled until all 3 fields have values.                     |
| **Loading** | Spinner + "Updating..." Disabled.                                                                          |
| **Success** | Toast: "Password updated. You will be asked to log in again." All sessions invalidated. Redirect to login. |
| **Failure** | Inline error on the relevant field. Button re-enables.                                                     |

#### 3.1.5 Two-Factor Authentication (2FA)

| Aspect                | Detail                                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Method**            | TOTP (Time-based One-Time Password) via authenticator app (Google Authenticator, Authy, 1Password, etc.)                                  |
| **Who controls**      | User can enable/disable for themselves. Property Admin can enforce for specific roles.                                                    |
| **Enrollment**        | QR code displayed on screen. User scans with authenticator app. Enters 6-digit code to confirm. System provides 10 backup recovery codes. |
| **Login with 2FA**    | After email + password, a second screen asks for the 6-digit TOTP code. "Remember this device for 30 days" checkbox.                      |
| **Recovery**          | If user loses authenticator access, they can enter a backup recovery code. If all codes are used, admin must reset 2FA for the user.      |
| **Admin enforcement** | Settings > Security > "Require 2FA for roles: [checkboxes]". When enforced, users cannot skip the 2FA setup step during onboarding.       |

**2FA Setup Fields**

| #   | Field             | Data Type             | Required | Validation                                        | Error Message                                           |
| --- | ----------------- | --------------------- | -------- | ------------------------------------------------- | ------------------------------------------------------- |
| 1   | QR Code           | Image (display only)  | --       | --                                                | --                                                      |
| 2   | Manual Key        | String (display only) | --       | --                                                | --                                                      |
| 3   | Verification Code | String (numeric)      | Yes      | Exactly 6 digits. Must match current TOTP window. | "Invalid code. Make sure your authenticator is synced." |

**Enable 2FA Button**

| State       | Behavior                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Default** | Label: "Verify and Enable". Blue filled button. Disabled until 6-digit code entered.                                                                               |
| **Loading** | Spinner + "Verifying..."                                                                                                                                           |
| **Success** | Toast: "Two-factor authentication enabled." Displays 10 backup codes with "Download" and "Copy" options. Warning: "Save these codes. They cannot be viewed again." |
| **Failure** | Inline error: "Invalid code. Please try again." Field clears.                                                                                                      |

#### 3.1.6 Login Audit Trail (Recent Account Activity)

Every login attempt is recorded and displayed to both the user and the admin.

**Audit Log Entry Fields**

| #   | Column           | Data Type         | Description                                                                                |
| --- | ---------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| 1   | Date and Time    | DateTime          | Timestamp of the login attempt. Format: "Mar 14, 2026 at 8:48 PM"                          |
| 2   | Device / Browser | String            | Parsed user agent. Examples: "Chrome on macOS", "Safari on iPhone", "Mobile App (Android)" |
| 3   | IP Address       | String            | IPv4 or IPv6 address of the client                                                         |
| 4   | Location         | String            | Approximate city/country derived from IP (via GeoIP lookup)                                |
| 5   | Login Status     | Enum              | "Success" (green badge) or "Failed" (red badge)                                            |
| 6   | Failure Reason   | String (nullable) | Only for failures: "Wrong password", "Account locked", "2FA failed", "Expired session"     |

**Visibility Rules**

| Viewer                 | What They See                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **User (own account)** | Last 20 login entries on their My Account > Recent Activity tab                            |
| **Property Admin**     | Full audit log for any user at their property. Filterable by date range, status, and user. |
| **Super Admin**        | Full audit log across all properties. Exportable.                                          |

#### 3.1.7 Profile Self-Editing

Users can edit a limited set of their own profile fields. Changes to sensitive fields (email) require verification.

**Editable Fields (Self-Service)**

| #   | Field                      |   Editable By User   |          Verification Required          | Admin Override |
| --- | -------------------------- | :------------------: | :-------------------------------------: | :------------: |
| 1   | First Name                 |         Yes          |                   No                    |      Yes       |
| 2   | Last Name                  |         Yes          |                   No                    |      Yes       |
| 3   | Phone Number               |         Yes          |                   No                    |      Yes       |
| 4   | Email Address              |         Yes          | Yes (verification email to new address) |      Yes       |
| 5   | Date of Birth              |         Yes          |                   No                    |      Yes       |
| 6   | Language Preference        |         Yes          |                   No                    |      Yes       |
| 7   | About Me (bio)             |         Yes          |                   No                    |      Yes       |
| 8   | Profile Photo              |         Yes          |                   No                    |      Yes       |
| 9   | Default Package Preference | Yes (residents only) |                   No                    |      Yes       |

**Default Package Preference** (Resident roles only)

A standing preference for how packages are handled during normal (non-vacation) operations. This field appears on the resident's self-service profile and is also editable by admin/manager.

| #   | Field                    | Type     | Required    | Options                                                                        | Default            | Error Message                                                             |
| --- | ------------------------ | -------- | ----------- | ------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------- |
| 1   | Default Package Handling | Dropdown | No          | Hold at Front Desk, Leave at Door, Notify Only, Custom Instructions            | Hold at Front Desk | --                                                                        |
| 2   | Custom Instructions      | Textarea | Conditional | 500 chars max. Required when Default Package Handling = "Custom Instructions". | Empty              | "Custom instructions are required when 'Custom Instructions' is selected" |

**Behavior**: When a package arrives for this resident, the package intake screen (see 04-Package Management) displays the resident's default package preference as a banner: "Resident preference: {preference}." Staff can override per-package. During vacation periods (see 07-Unit-Management, section 3.2.3), vacation-specific package instructions take precedence over this default preference.

**Read-Only Fields (User Cannot Edit)**

| #   | Field                | Why                                    |
| --- | -------------------- | -------------------------------------- |
| 1   | Username             | System-generated, permanent identifier |
| 2   | Role                 | Admin-assigned                         |
| 3   | Unit                 | Admin-assigned                         |
| 4   | Property             | Admin-assigned                         |
| 5   | Account Status       | Admin-controlled                       |
| 6   | Account Created Date | System-generated                       |
| 7   | Last Login Date      | System-generated                       |

**Email Change Flow**

| Step | What Happens                                                                                  |
| ---- | --------------------------------------------------------------------------------------------- |
| 1    | User enters new email address and clicks "Update Email"                                       |
| 2    | System sends a verification link to the NEW email address. Old email remains active.          |
| 3    | Toast: "Verification email sent to [new email]. Your email will not change until you verify." |
| 4    | User clicks verification link in the new email within 24 hours                                |
| 5    | Email updated. Old email receives notification: "Your email has been changed to [new email]." |
| 6    | If verification link expires (24h), no change occurs. User must start over.                   |

**Save Profile Button**

| State       | Behavior                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------- |
| **Default** | Label: "Save Changes". Blue filled button. Disabled until a field is modified.              |
| **Loading** | Spinner + "Saving..."                                                                       |
| **Success** | Toast: "Profile updated." Button returns to disabled (no unsaved changes).                  |
| **Failure** | Toast (red): "Failed to save changes. Please try again." Inline errors if validation fails. |

#### 3.1.8 Notification Preferences

Users configure which notifications they receive and through which channels. Preferences are organized by module.

**Preference Matrix**

| #   | Module        | Notification Type                | Email | SMS | Push | Default (Email) | Default (SMS) | Default (Push) |
| --- | ------------- | -------------------------------- | :---: | :-: | :--: | :-------------: | :-----------: | :------------: |
| 1   | Packages      | Package received at front desk   |  On   | Off |  On  |       On        |      Off      |       On       |
| 2   | Packages      | Package unclaimed reminder       |  On   | Off | Off  |       On        |      Off      |      Off       |
| 3   | Maintenance   | Request status update            |  On   | Off |  On  |       On        |      Off      |       On       |
| 4   | Maintenance   | Request assigned (staff)         |  On   | Off |  On  |       On        |      Off      |       On       |
| 5   | Amenities     | Booking confirmed                |  On   | Off |  On  |       On        |      Off      |       On       |
| 6   | Amenities     | Booking cancelled                |  On   | Off | Off  |       On        |      Off      |      Off       |
| 7   | Amenities     | Booking reminder (24h before)    |  On   | Off |  On  |       On        |      Off      |       On       |
| 8   | Announcements | New announcement posted          |  On   | Off |  On  |       On        |      Off      |       On       |
| 9   | Events        | New event posted                 |  On   | Off | Off  |       On        |      Off      |      Off       |
| 10  | Security      | Visitor signed in/out of my unit |  On   | Off |  On  |       On        |      Off      |       On       |
| 11  | Community     | Reply to my classified ad        |  On   | Off | Off  |       On        |      Off      |      Off       |
| 12  | Community     | Reply to my forum thread         |  On   | Off | Off  |       On        |      Off      |      Off       |
| 13  | Library       | New document posted              |  On   | Off | Off  |       On        |      Off      |      Off       |
| 14  | Surveys       | New survey posted                |  On   | Off | Off  |       On        |      Off      |      Off       |
| 15  | Account       | Login from new device            |  On   | On  | Off  |       On        |      On       |      Off       |
| 16  | Account       | Password changed                 |  On   | On  | Off  |       On        |      On       |      Off       |

**Mute All Toggle**: At the top of the Notification Preferences page, a prominent "Mute All Non-Critical Notifications" toggle allows users to disable all unsubscribable notifications at once. When enabled, all individual toggles below are overridden and grayed out. A yellow info banner appears: "All optional notifications are muted. You will still receive critical security emails (password resets, account lockouts, login alerts)." Toggling off restores all individual preferences to their previous state.

**Tooltip**: Notification preferences only control non-critical notifications. Critical security emails (password resets, account lockouts, 2FA recovery) are always delivered regardless of preferences.

**Unsubscribe link in emails**: All outgoing non-critical emails include an "Unsubscribe" link in the footer per CAN-SPAM and CASL requirements. Clicking the link opens the Notification Preferences page with the relevant toggle pre-highlighted. A one-click "Unsubscribe from this type" action is available without requiring login (via a signed, time-limited token in the URL).

**Save Preferences Behavior**: Auto-save on toggle. No save button needed. A brief "Saved" confirmation appears next to the toggled item for 2 seconds.

**Role-Based Visibility**: Only modules relevant to the user's role are displayed. A resident never sees "Maintenance > Request assigned (staff)" because they do not have staff permissions.

**Custom Distribution Lists**: For targeted communication beyond role-based and module-based preferences, admins can create custom distribution groups using the Resident Groups feature (see 07-Unit-Management, section 3.1.9). These groups serve as audience selectors when composing announcements (see 11-Announcements) or sending bulk notifications (see 09-Notifications). Distribution groups are managed at the property level and are distinct from notification preference categories.

#### 3.1.9 Session Management

| Aspect                            | Detail                                                                                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Session duration (staff)**      | 8 hours. No "Remember Me" option.                                                                                                                                           |
| **Session duration (resident)**   | 30 days with "Remember Me" enabled. 24 hours without.                                                                                                                       |
| **Multi-device**                  | Allowed. Users can be logged in on up to 5 devices simultaneously.                                                                                                          |
| **Session invalidation triggers** | Password change, role change, account suspension, account deactivation, admin-initiated "Sign Out All Devices".                                                             |
| **Active Sessions view**          | Users see their active sessions on My Account > Security. Shows device name, browser, last active time. "Sign Out" button per session. "Sign Out All Other Devices" button. |

**Active Sessions Table Fields**

| #   | Column      | Data Type | Description                                                  |
| --- | ----------- | --------- | ------------------------------------------------------------ |
| 1   | Device      | String    | Parsed device name: "Chrome on macOS", "Safari on iPhone 15" |
| 2   | Location    | String    | City, Country from GeoIP                                     |
| 3   | Last Active | DateTime  | Relative time: "Active now", "2 hours ago", "3 days ago"     |
| 4   | Current     | Boolean   | Badge: "This device" on the current session                  |
| 5   | Action      | Button    | "Sign Out" button (not shown for current session)            |

#### 3.1.10 User Search and Directory

**Search Bar**

| Field  | Data Type | Max Length | Placeholder                               |
| ------ | --------- | ---------- | ----------------------------------------- |
| Search | String    | 100 chars  | "Search by name, email, unit, or role..." |

**Filter Options**

| #   | Filter       | Type                               | Options                                            |
| --- | ------------ | ---------------------------------- | -------------------------------------------------- |
| 1   | Role         | Multi-select                       | All roles defined for the property                 |
| 2   | Status       | Multi-select                       | Pending Activation, Active, Suspended, Deactivated |
| 3   | Unit         | Text input with autocomplete       | All units at the property                          |
| 4   | Building     | Select (multi-building properties) | All buildings                                      |
| 5   | Created Date | Date range picker                  | From / To                                          |
| 6   | Last Login   | Date range picker                  | From / To                                          |
| 7   | 2FA Enabled  | Toggle                             | Yes / No / All                                     |
| 8   | Email Status | Multi-select                       | Valid / Invalid / Missing                          |

**Quick Contact Lookup**: The User Directory serves as both the administrative user management tool and the contact directory for front desk staff. A separate "Resident Directory" or "Address Book" is not needed because:

1. The search bar supports name, email, unit, and role search with 300ms debounce for instant lookup.
2. The table displays name, email, unit, and role inline -- the most common fields for contact lookup.
3. Staff roles see a simplified view (no admin actions column) focused on contact information.
4. Clicking any user row shows a compact profile card with phone numbers and email for quick reference without navigating to the full profile.

For building-wide printed directories, the Export function (CSV/Excel/PDF) filtered by building produces a printable contact list.

**User Directory Table Columns**

| #   | Column              |  Sortable  | Default Sort  |
| --- | ------------------- | :--------: | :-----------: |
| 1   | Name (First + Last) |    Yes     | A-Z (default) |
| 2   | Email               |    Yes     |      --       |
| 3   | Unit                |    Yes     |      --       |
| 4   | Role                |    Yes     |      --       |
| 5   | Status              |    Yes     |      --       |
| 6   | Last Login          |    Yes     |      --       |
| 7   | 2FA                 | Yes (icon) |      --       |
| 8   | Actions             |     No     |      --       |

**Actions Column**: Kebab menu (three dots) with options: View Profile, Edit, Change Role, Suspend/Activate, Send Welcome Email, Reset Password, Reset 2FA.

**Data Quality Banner**: Below the filter bar, a collapsible banner shows actionable data quality counts. Visible to Property Admin and Super Admin only. Default: collapsed, showing only a summary line.

| Indicator                  | Count                                              | Action                                   |
| -------------------------- | -------------------------------------------------- | ---------------------------------------- |
| Missing email              | "{N} users have no email address"                  | Click to filter directory to those users |
| Missing phone              | "{N} users have no phone number"                   | Click to filter directory to those users |
| Missing emergency contacts | "{N} residents have no emergency contacts"         | Click to filter directory to those users |
| Invalid emails             | "{N} users have invalid email addresses (bounced)" | Click to filter directory to those users |

**Summary line** (when collapsed): "Data quality: {N} issues found. [View Details]" -- or "Data quality: All profiles complete" (green checkmark) when no issues exist. The banner is dismissible per session but reappears on next login if issues remain.

**Saved Filter Presets**: Above the filter bar, quick-access buttons for common views:

| #   | Preset             | Filters Applied                                                                          | Badge                        |
| --- | ------------------ | ---------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | All Users          | No filters                                                                               | Total user count             |
| 2   | Staff              | Role filter = all staff roles (Property Manager, Front Desk, Security, Maintenance Tech) | Staff count                  |
| 3   | Residents          | Role filter = all resident roles (Owner, Tenant, Offsite Owner, Family Member)           | Resident count               |
| 4   | Pending Activation | Status = Pending Activation                                                              | Pending count (amber if > 0) |

**Bulk Actions**: When one or more users are selected via checkboxes in the directory table, a bulk action bar appears above the table:

| #   | Action                           | Available When                                             | Confirmation                                                                                                                                                               |
| --- | -------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Send Welcome Email               | At least one selected user has status = Pending Activation | "Send welcome emails to {N} users? {M} users have already received a welcome email and will be resent." Options: "Send to All Selected" / "Send to Unsent Only" / "Cancel" |
| 2   | Change Status                    | Any selection                                              | "Change status to [dropdown] for {N} users?"                                                                                                                               |
| 3   | Export Selected                  | Any selection                                              | Immediate download, no confirmation needed                                                                                                                                 |
| 4   | Generate Registration Codes (v2) | At least one selected user has status = Pending Activation | "Generate registration codes for {N} users? Existing unused codes will be replaced."                                                                                       |

**Staff View**: When the "Staff" preset is active, an additional "Currently Active" column appears showing a green dot for staff members with an active session (based on session data from 3.1.9). This helps properties with shift-based security and concierge teams see who is currently logged in. A future integration with the Shift Log module (see 12-Shift-Log) can surface "Staff on shift today" data here.

**Export Button**: "Export" button above the table. Options: CSV, Excel, PDF. Exports the current filtered view.

### 3.2 Enhanced (v2)

#### 3.2.1 Bulk User Import via CSV

| Aspect              | Detail                                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Who**             | Super Admin, Property Admin                                                                                                                                      |
| **Template**        | Downloadable CSV template with columns: first_name, last_name, email, phone, role, unit, date_of_birth, language, send_welcome_email                             |
| **Max rows**        | 500 users per upload                                                                                                                                             |
| **File size limit** | 5 MB                                                                                                                                                             |
| **Validation**      | Pre-import validation report. Shows row-by-row results: valid, warning (duplicate email but different property), error (missing required field, invalid format). |
| **Error handling**  | Partial import supported. Valid rows are imported; invalid rows are listed in an error report for correction and re-upload.                                      |

**Upload CSV Button**

| State                   | Behavior                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Default**             | Label: "Upload CSV". Blue outlined button. Accepts .csv files only.                                                                 |
| **Loading**             | "Validating [filename]..." progress bar.                                                                                            |
| **Validation Complete** | Preview table showing first 10 rows + validation summary: "487 valid, 13 errors." Green rows = valid. Red rows = error with reason. |
| **Import Confirmation** | "Import 487 Users" button (blue filled). "Fix Errors and Re-upload" link.                                                           |
| **Import Success**      | Toast: "487 accounts created. 487 welcome emails queued." Download error report link for the 13 failed rows.                        |

**CSV Template Fields**

| #   | Column Header      | Required    | Format           | Example              |
| --- | ------------------ | ----------- | ---------------- | -------------------- |
| 1   | first_name         | Yes         | Text             | Jane                 |
| 2   | last_name          | Yes         | Text             | Smith                |
| 3   | email              | Yes         | email@domain.com | jane.smith@email.com |
| 4   | phone              | No          | +1-416-555-0100  | +14165550100         |
| 5   | role               | Yes         | Exact role name  | Resident (Owner)     |
| 6   | unit               | Conditional | Unit number      | 1205                 |
| 7   | date_of_birth      | No          | YYYY-MM-DD       | 1985-06-15           |
| 8   | language           | No          | ISO 639-1        | en                   |
| 9   | send_welcome_email | No          | true/false       | true                 |

#### 3.2.2 Advanced Login Security

| Feature                      | Detail                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| **IP-based alerts**          | Alert admin when a user logs in from a new country or a known-bad IP range                  |
| **Device fingerprinting**    | Track device characteristics beyond user agent. Notify user on new device login.            |
| **Concurrent session limit** | Configurable max sessions per user (default 5). Oldest session dropped when limit exceeded. |
| **Session activity log**     | Detailed session log showing pages visited, actions taken, and duration (admin-only view)   |

#### 3.2.3 Delegation and Temporary Access

| Feature             | Detail                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Temporary roles** | Admin assigns a role with an expiry date. System auto-revokes at midnight on the expiry date. Use case: temporary security guard, summer intern, guest access.                                                                       |
| **Delegation**      | A resident can delegate limited access to another person (e.g., dog walker, house cleaner). Limited to: view packages, view upcoming bookings. Delegated users do not have full accounts -- they receive a time-limited access link. |

#### 3.2.4 Account Merge

| Feature     | Detail                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose** | When a user has accounts at multiple properties, merge them into a single login that can switch between properties                                                                         |
| **Who**     | Super Admin only                                                                                                                                                                           |
| **Process** | Select two or more accounts with the same email. Confirm merge. System consolidates into one account with per-property role assignments. All historical data retained under each property. |

### 3.3 Future (v3+)

| Feature                                 | Description                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Biometric login (mobile)**            | Face ID / fingerprint authentication on the mobile app                                                                   |
| **Passkey support**                     | WebAuthn/FIDO2 passwordless login via platform authenticators                                                            |
| **Resident ID cards**                   | Printable or digital ID cards with QR code for building access                                                           |
| **SSO for management companies**        | Optional SSO for management company staff across all their properties (not for residents)                                |
| **Activity-based account deactivation** | Auto-deactivate accounts with no login for configurable period (e.g., 180 days). Admin notification before deactivation. |
| **Delegated admin**                     | Property Admin can designate a user as "Account Coordinator" who can create resident accounts but not staff accounts     |

---

## 4. Data Model

### 4.1 User

```
User
  id              UUID          PK, auto-generated
  first_name      VARCHAR(50)   NOT NULL
  last_name       VARCHAR(50)   NOT NULL
  email           VARCHAR(254)  NOT NULL, UNIQUE per property
  phone_cell      VARCHAR(20)   NULLABLE (primary phone — populated from "Phone Number" on account creation form)
  phone_home      VARCHAR(20)   NULLABLE (added via resident profile, see 07-Unit-Management section 3.1.5 Tab 1)
  phone_work      VARCHAR(20)   NULLABLE (added via resident profile, see 07-Unit-Management section 3.1.5 Tab 1)
  date_of_birth   DATE          NULLABLE
  company_name    VARCHAR(100)  NULLABLE
  language        VARCHAR(5)    DEFAULT 'en'
  about_me        TEXT          NULLABLE, max 500 chars
  profile_photo   VARCHAR(255)  NULLABLE (S3 URL)
  require_assist  BOOLEAN       DEFAULT false
  default_pkg_pref ENUM         NULLABLE ('hold_at_front_desk', 'leave_at_door', 'notify_only', 'custom')
  default_pkg_instructions TEXT NULLABLE, max 500 chars (required when default_pkg_pref = 'custom')
  status          ENUM          'pending_activation', 'active', 'suspended', 'deactivated'
  password_hash   VARCHAR(255)  NOT NULL
  password_set_at TIMESTAMP     NOT NULL
  totp_secret     VARCHAR(64)   NULLABLE (encrypted at rest)
  totp_enabled    BOOLEAN       DEFAULT false
  recovery_codes  JSONB         NULLABLE (encrypted, array of hashed codes)
  welcome_email_status ENUM     DEFAULT 'never_sent' ('never_sent', 'sent', 'resent')
  welcome_email_sent_at TIMESTAMP NULLABLE
  welcome_email_count INTEGER   DEFAULT 0
  email_signature TEXT          NULLABLE, max 2000 chars (rich text, staff roles only)
  email_signature_enabled BOOLEAN DEFAULT false
  created_at      TIMESTAMP     NOT NULL, auto
  updated_at      TIMESTAMP     NOT NULL, auto
  created_by      UUID          FK -> User (admin who created)
  last_login_at   TIMESTAMP     NULLABLE
```

### 4.2 UserPropertyRole

```
UserPropertyRole
  id              UUID          PK
  user_id         UUID          FK -> User, NOT NULL
  property_id     UUID          FK -> Property, NOT NULL
  role_id         UUID          FK -> Role, NOT NULL
  unit_id         UUID          FK -> Unit, NULLABLE (required for resident roles)
  assigned_at     TIMESTAMP     NOT NULL
  assigned_by     UUID          FK -> User
  expires_at      TIMESTAMP     NULLABLE (v2: temporary roles)

  UNIQUE(user_id, property_id)  -- one role per property
```

### 4.3 LoginAudit

```
LoginAudit
  id              UUID          PK
  user_id         UUID          FK -> User, NOT NULL
  timestamp       TIMESTAMP     NOT NULL
  ip_address      VARCHAR(45)   NOT NULL (supports IPv6)
  user_agent      TEXT          NOT NULL
  device_parsed   VARCHAR(100)  Parsed device/browser string
  location_city   VARCHAR(100)  NULLABLE (GeoIP)
  location_country VARCHAR(2)   NULLABLE (ISO 3166-1 alpha-2)
  status          ENUM          'success', 'failed'
  failure_reason  VARCHAR(100)  NULLABLE
  two_factor_used BOOLEAN       DEFAULT false
```

### 4.4 UserSession

```
UserSession
  id              UUID          PK
  user_id         UUID          FK -> User, NOT NULL
  property_id     UUID          FK -> Property, NOT NULL
  token_hash      VARCHAR(255)  NOT NULL
  device_parsed   VARCHAR(100)  NOT NULL
  ip_address      VARCHAR(45)   NOT NULL
  location_city   VARCHAR(100)  NULLABLE
  created_at      TIMESTAMP     NOT NULL
  last_active_at  TIMESTAMP     NOT NULL
  expires_at      TIMESTAMP     NOT NULL
  is_remembered   BOOLEAN       DEFAULT false
```

### 4.5 NotificationPreference

```
NotificationPreference
  id              UUID          PK
  user_id         UUID          FK -> User, NOT NULL
  property_id     UUID          FK -> Property, NOT NULL
  module          VARCHAR(50)   NOT NULL (e.g., 'packages', 'maintenance')
  notification_type VARCHAR(100) NOT NULL (e.g., 'package_received')
  email_enabled   BOOLEAN       DEFAULT true
  sms_enabled     BOOLEAN       DEFAULT false
  push_enabled    BOOLEAN       DEFAULT false

  UNIQUE(user_id, property_id, notification_type)
```

### 4.6 AccountAudit

```
AccountAudit
  id              UUID          PK
  user_id         UUID          FK -> User (target user), NOT NULL
  actor_id        UUID          FK -> User (who made the change), NOT NULL
  action          ENUM          'created', 'activated', 'suspended', 'deactivated',
                                'reactivated', 'role_changed', 'profile_edited',
                                'password_changed', 'password_reset', '2fa_enabled',
                                '2fa_disabled', '2fa_reset', 'welcome_email_sent',
                                'email_changed', 'sessions_invalidated'
  details         JSONB         Context (e.g., { "from_role": "Resident", "to_role": "Board Member" })
  ip_address      VARCHAR(45)   NOT NULL
  timestamp       TIMESTAMP     NOT NULL
```

### 4.7 PasswordHistory

```
PasswordHistory
  id              UUID          PK
  user_id         UUID          FK -> User, NOT NULL
  password_hash   VARCHAR(255)  NOT NULL
  set_at          TIMESTAMP     NOT NULL
```

### 4.8 Entity Relationship Summary

```
User 1───N UserPropertyRole N───1 Property
User 1───N UserPropertyRole N───1 Role
User 1───N LoginAudit
User 1───N UserSession
User 1───N NotificationPreference
User 1───N AccountAudit (as target)
User 1───N AccountAudit (as actor)
User 1───N PasswordHistory
UserPropertyRole N───1 Unit (optional)
```

---

## 5. User Flows

### 5.1 Admin Creates a New Resident Account

| Step | Actor          | Action                                                       | System Response                                                                                                                    |
| ---- | -------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Property Admin | Navigates to User Management > "Create Account" button       | Create User form loads with property pre-selected                                                                                  |
| 2    | Property Admin | Fills in First Name, Last Name, Email                        | AI suggests unit match if email domain matches an existing resident (tooltip only)                                                 |
| 3    | Property Admin | Selects role: "Resident (Owner)"                             | Unit field becomes required. Role-specific fields appear (unit selector, parking spot).                                            |
| 4    | Property Admin | Selects Unit 1205 from dropdown                              | Unit auto-complete shows "1205 - Floor 12" with current occupant count                                                             |
| 5    | Property Admin | Leaves "Send Welcome Email" checked. Clicks "Create Account" | System creates account (status: Pending Activation). Generates temporary password. Queues welcome email. Toast: "Account created." |
| 6    | System         | Sends welcome email                                          | Email contains: property name, login URL, setup link (expires in 72 hours), support contact                                        |
| 7    | New Resident   | Opens email, clicks setup link                               | Browser opens the onboarding flow (Step 1: Set Password)                                                                           |
| 8    | New Resident   | Sets password (with real-time strength indicator)            | Password saved. Proceeds to Step 2: Review Profile.                                                                                |
| 9    | New Resident   | Reviews pre-filled profile. Adds phone number.               | Proceeds to Step 3: Notification Preferences.                                                                                      |
| 10   | New Resident   | Toggles notification preferences.                            | Proceeds to Step 4: 2FA (optional).                                                                                                |
| 11   | New Resident   | Clicks "Skip for Now" on 2FA                                 | Onboarding complete. Redirect to dashboard. Status changes to Active.                                                              |

### 5.2 User Changes Their Password

| Step | Actor  | Action                                                 | System Response                                                                                      |
| ---- | ------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1    | User   | Navigates to My Account > Security > "Change Password" | Change Password form loads                                                                           |
| 2    | User   | Enters current password                                | Field validates (no real-time check until submit)                                                    |
| 3    | User   | Types new password                                     | Real-time strength indicator updates. Requirements checklist shows green checks as criteria are met. |
| 4    | User   | Types confirmation                                     | "Passwords match" or "Passwords do not match" shown inline                                           |
| 5    | User   | Clicks "Update Password"                               | System verifies current password. Checks password history. Saves new hash. Invalidates all sessions. |
| 6    | System | Redirects to login page                                | Toast: "Password updated. Please log in with your new password." Notification sent to user's email.  |

### 5.3 Admin Bulk Imports Users via CSV (v2)

| Step | Actor          | Action                                                            | System Response                                                                                                                               |
| ---- | -------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Property Admin | Navigates to User Management > "Import" > "Download Template"     | CSV template downloads                                                                                                                        |
| 2    | Property Admin | Fills in CSV with 200 residents. Uploads via "Upload CSV" button. | System parses file. Progress bar: "Validating 200 rows..."                                                                                    |
| 3    | System         | Completes validation                                              | Preview screen: "194 valid, 6 errors." Table shows first 10 rows. Error rows highlighted in red with reasons (e.g., "Row 45: Missing email"). |
| 4    | Property Admin | Clicks "Import 194 Users"                                         | Progress bar: "Creating accounts... 97 of 194." Runs in background.                                                                           |
| 5    | System         | Import completes                                                  | Toast: "194 accounts created. 194 welcome emails queued." Download link for error report (6 failed rows).                                     |
| 6    | Property Admin | Downloads error report. Fixes 6 rows. Re-uploads.                 | Validates and imports remaining 6.                                                                                                            |

### 5.4 User Enables 2FA

| Step | Actor  | Action                                                                    | System Response                                                                                                                                                     |
| ---- | ------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | User   | Navigates to My Account > Security > Two-Factor Authentication > "Enable" | 2FA setup screen loads with QR code and manual key                                                                                                                  |
| 2    | User   | Scans QR code with authenticator app                                      | App generates 6-digit code                                                                                                                                          |
| 3    | User   | Enters 6-digit code in verification field                                 | System validates code against TOTP secret.                                                                                                                          |
| 4    | System | Code valid                                                                | Displays 10 backup recovery codes. "Download as Text" and "Copy All" buttons. Warning: "Save these codes in a safe place. You will not be able to view them again." |
| 5    | User   | Clicks "I Have Saved My Codes"                                            | 2FA enabled. Toast: "Two-factor authentication enabled."                                                                                                            |

### 5.5 Admin Investigates Suspicious Login Activity

| Step | Actor          | Action                                                                             | System Response                                                                            |
| ---- | -------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1    | Property Admin | Receives AI alert: "Unusual login detected for John Doe -- new country (Germany)." | Navigates to User Management > search for John Doe > View Profile > Login Audit.           |
| 2    | Property Admin | Reviews login audit entries                                                        | Table shows login from Germany at 3:14 AM local time. Status: Success.                     |
| 3    | Property Admin | Determines it is unauthorized                                                      | Clicks "Suspend Account" from the user's profile.                                          |
| 4    | System         | Suspends account. Invalidates all sessions.                                        | Toast: "John Doe has been suspended. All active sessions terminated."                      |
| 5    | Property Admin | Clicks "Reset Password"                                                            | System generates password reset link. Emails it to John Doe's verified email.              |
| 6    | Property Admin | Clicks "Reset 2FA"                                                                 | Clears TOTP secret and backup codes. John Doe must re-enroll on next login.                |
| 7    | Property Admin | Reactivates account                                                                | Status changes to Active. John Doe can log in with reset link to set new password and 2FA. |

---

## 6. UI/UX

### 6.1 Page: User Directory

**Desktop (1280px+)**

```
+------------------------------------------------------------------+
| User Management                              [+ Create] [Import] |
+------------------------------------------------------------------+
| [Search: name, email, unit, role...] [Role v] [Status v] [More v]|
+------------------------------------------------------------------+
| NAME            | EMAIL              | UNIT | ROLE      | STATUS  |
|-----------------|--------------------+------+-----------+---------|
| Jane Smith      | jane@email.com     | 1205 | Owner     | Active  |
| John Doe        | john@email.com     | 302  | Tenant    | Active  |
| Sarah Connor    | sarah@building.com | --   | Concierge | Active  |
| Mike Ross       | mike@email.com     | 815  | Owner     | Suspended|
|                                                                   |
| Showing 1-25 of 487 users               [<] [1] [2] [3] ... [>] |
+------------------------------------------------------------------+
```

**Tablet (768px-1279px)**

- Table columns reduce to: Name, Role, Status, Actions.
- Email and Unit visible on row expansion (tap to expand).
- Filters collapse into a "Filters" button that opens a slide-over panel.

**Mobile (< 768px)**

- Card layout replaces table. Each card shows: Name (bold), Role (badge), Status (colored dot), Unit.
- Tap card to view full profile.
- Search bar is sticky at top. Filters accessible via filter icon button.
- "+ Create" becomes a floating action button (FAB) at bottom-right.

**Empty State (No Users)**

```
+------------------------------------------------------------------+
|                                                                   |
|              [Person icon illustration]                           |
|                                                                   |
|          No users at this property yet.                           |
|                                                                   |
|    Create accounts to get your building started.                  |
|                                                                   |
|         [+ Create First Account]    [Import from CSV]             |
|                                                                   |
+------------------------------------------------------------------+
```

**Loading State**

- Skeleton rows (pulsing grey rectangles) in place of table rows. 5 skeleton rows shown.

**Error State**

- Banner at top: "Unable to load user directory. Please try again." with "Retry" button.

### 6.2 Page: User Profile (Admin View)

**Layout**

```
+------------------------------------------------------------------+
| [< Back to Directory]                                             |
|                                                                   |
| [Photo]  Jane Smith                               [Edit] [... v] |
|          Resident (Owner) - Unit 1205                             |
|          jane@email.com | +1-416-555-0100                        |
|          Status: Active (green badge)                             |
|          Last login: Mar 14, 2026 at 8:48 PM                     |
+------------------------------------------------------------------+
| [Profile] [Activity] [Security] [Notifications] [Audit Log]      |
+------------------------------------------------------------------+
|                                                                   |
|  (Tab content renders here)                                       |
|                                                                   |
+------------------------------------------------------------------+
```

**Tabs**

| #   | Tab           | Content                                                                                      |
| --- | ------------- | -------------------------------------------------------------------------------------------- |
| 1   | Profile       | All editable profile fields in a form layout. Two columns on desktop.                        |
| 2   | Activity      | Login audit trail table (last 50 entries). Date range filter.                                |
| 3   | Security      | Active sessions table. 2FA status with enable/disable. Password last changed date.           |
| 4   | Notifications | Notification preference toggles organized by module.                                         |
| 5   | Audit Log     | AccountAudit entries: all admin actions taken on this user (role changes, suspensions, etc.) |

**Kebab Menu (...) Options**

| #   | Option               | When Visible                     |
| --- | -------------------- | -------------------------------- |
| 1   | Change Role          | User is Active                   |
| 2   | Suspend Account      | User is Active                   |
| 3   | Reactivate Account   | User is Suspended or Deactivated |
| 4   | Deactivate Account   | User is Active or Suspended      |
| 5   | Reset Password       | User is Active or Suspended      |
| 6   | Reset 2FA            | User has 2FA enabled             |
| 7   | Resend Welcome Email | User is Pending Activation       |
| 8   | Sign Out All Devices | User is Active                   |

### 6.3 Page: My Account (User Self-Service)

**Layout** -- Same as Admin View Profile but with:

- No kebab menu (users cannot change their own status or role)
- "Edit" button opens inline editing on the Profile tab
- Security tab shows own active sessions and 2FA management
- Notifications tab shows own preferences with toggles
- Email Signature tab (staff roles only) for configuring outgoing email signatures

**Mobile**: Tabs become a vertical accordion. Each section expands/collapses on tap.

#### 6.3.1 Email Signature (Staff Only)

**Visible to**: Property Manager, Front Desk, Security, Property Admin

**Description**: Staff members can compose a rich text email signature that is automatically appended to outgoing communications sent through the platform (announcements, maintenance request updates, violation notices, and custom emails).

**Email Signature Fields**

| #   | Field             | Type             | Required | Max Length | Validation                                                                                                                     | Error Message                             |
| --- | ----------------- | ---------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| 1   | Signature Content | Rich text editor | No       | 2000 chars | Supports: bold, italic, underline, links, line breaks, and plain text. No images or embedded media. HTML is sanitized on save. | "Signature cannot exceed 2000 characters" |
| 2   | Signature Enabled | Toggle           | No       | --         | Boolean. When off, no signature is appended to outgoing emails. Default: Off.                                                  | --                                        |

**Rich text editor toolbar**: Bold, Italic, Underline, Link, Ordered List, Unordered List, Clear Formatting.

**Preview**: Below the editor, a "Preview" section shows how the signature will appear in an outgoing email, rendered within the platform's email template.

**Save Signature Button**

| State       | Behavior                                                                         |
| ----------- | -------------------------------------------------------------------------------- |
| **Default** | Label: "Save Signature". Blue filled button. Disabled until content is modified. |
| **Loading** | Spinner + "Saving..."                                                            |
| **Success** | Toast: "Email signature saved."                                                  |
| **Failure** | Toast (red): "Failed to save signature. Please try again."                       |

**Applied to**: The signature is appended to all outgoing emails sent by the staff member through the following modules: Announcements (see 11), Maintenance Requests (see 05), Violation Notices (see 03), and any manual email sent via the platform's compose feature. It is not appended to system-generated automated emails (welcome emails, password resets, notification digests).

### 6.4 Component: Notification Preference Grid

```
+------------------------------------------------------------------+
| PACKAGES                                                          |
| +----------------------------------------------+-----+-----+----+|
| | Notification                                 | Email| SMS |Push||
| |----------------------------------------------|------|-----|----||
| | Package received at front desk               |  [x] | [ ] |[x]||
| | Package unclaimed reminder                   |  [x] | [ ] |[ ]||
| +----------------------------------------------+-----+-----+----+|
|                                                                   |
| MAINTENANCE                                                       |
| +----------------------------------------------+-----+-----+----+|
| | Request status update                        |  [x] | [ ] |[x]||
| | Request assigned (staff only)                |  [x] | [ ] |[x]||
| +----------------------------------------------+-----+-----+----+|
|                                                                   |
| (additional modules...)                                           |
+------------------------------------------------------------------+
```

**Tooltip** (on SMS column header): "SMS notifications are sent to your registered phone number. Standard messaging rates may apply."

### 6.5 Progressive Disclosure

| Feature                            | Default State                       | Expanded State                                           |
| ---------------------------------- | ----------------------------------- | -------------------------------------------------------- |
| Advanced filters on User Directory | Hidden behind "More Filters" button | Reveals: Created Date, Last Login, 2FA, Building         |
| Password history settings          | Shows current policy summary        | "Customize" link reveals all configurable fields         |
| Audit Log (admin)                  | Shows last 25 entries               | "Load More" button or date range filter for full history |
| CSV import preview                 | Shows first 10 rows + summary       | "View All Rows" expands to full scrollable table         |

---

## 7. AI Integration

Three AI capabilities are relevant to User Management. All are defined in the AI Framework (19-ai-framework.md) and referenced here with module-specific detail.

### 7.1 Suspicious Login Detection

| Aspect                   | Detail                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Capability ID**     | New (extends anomaly detection patterns from Security Console)                                                                                                                      |
| **What it does**         | Analyzes login patterns and flags unusual activity: new device, new country, unusual time, rapid geographic change (impossible travel), multiple failed attempts from different IPs |
| **Default model**        | Haiku                                                                                                                                                                               |
| **Estimated cost**       | $0.001 per evaluation                                                                                                                                                               |
| **Trigger**              | On every successful login                                                                                                                                                           |
| **Input**                | Current login (IP, device, time) + user's last 30 logins                                                                                                                            |
| **Output**               | Risk score (0-100). If > 70, alert is generated for Property Admin.                                                                                                                 |
| **Graceful degradation** | No AI alerts. Fixed rules only (e.g., 5 failed attempts = lockout).                                                                                                                 |
| **Default**              | Enabled                                                                                                                                                                             |

**Alert UI**: Yellow banner on the admin dashboard: "Unusual login detected for [User Name] -- [reason]. [View Details] [Dismiss]."

### 7.2 Contact Validation

| Aspect                   | Detail                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Capability ID**     | Extension of Missing Data Detection (#93)                                                                                                                         |
| **What it does**         | Validates email format correctness, detects likely typos (e.g., "gmal.com" instead of "gmail.com"), and checks phone number format against the property's country |
| **Default model**        | Haiku                                                                                                                                                             |
| **Estimated cost**       | $0.001 per validation                                                                                                                                             |
| **Trigger**              | On account creation and profile edit (on field blur)                                                                                                              |
| **Input**                | Email address or phone number + property country                                                                                                                  |
| **Output**               | Validation result: pass, warning (with suggestion), or fail (with reason)                                                                                         |
| **Graceful degradation** | Standard regex validation only. No typo suggestions.                                                                                                              |
| **Default**              | Enabled                                                                                                                                                           |

**UI**: Inline suggestion below the email field: "Did you mean jane@gmail.com?" with "Yes, fix it" link.

### 7.3 Profile Auto-Complete

| Aspect                   | Detail                                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Capability ID**     | Extension of Resident Onboarding Checklist (#92)                                                                                                                                        |
| **What it does**         | During bulk CSV import, suggests corrections for incomplete or malformed data. During single account creation, suggests unit assignment based on name matching against move-in records. |
| **Default model**        | Haiku                                                                                                                                                                                   |
| **Estimated cost**       | $0.002 per batch evaluation                                                                                                                                                             |
| **Trigger**              | On CSV upload validation step                                                                                                                                                           |
| **Input**                | CSV rows + existing user directory + unit directory                                                                                                                                     |
| **Output**               | Suggested corrections with confidence scores                                                                                                                                            |
| **Graceful degradation** | Standard CSV validation only. No suggestions.                                                                                                                                           |
| **Default**              | Enabled                                                                                                                                                                                 |

**UI**: During CSV preview, correctable rows show a yellow "Suggestion" badge. Clicking it shows the AI suggestion (e.g., "Did you mean unit 1205 instead of 12-5?") with "Accept" and "Ignore" buttons.

---

## 8. Analytics

### 8.1 Operational Metrics

| Metric                     | Description                                                                                      | Visible To                  |
| -------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------- |
| Total users                | Count by status (active, pending, suspended, deactivated)                                        | Property Admin, Super Admin |
| Users by role              | Breakdown of users per role                                                                      | Property Admin, Super Admin |
| Activation rate            | % of pending accounts that complete onboarding within 7 days                                     | Property Admin, Super Admin |
| Login frequency            | Average logins per user per week                                                                 | Property Admin, Super Admin |
| Failed login rate          | % of login attempts that fail                                                                    | Property Admin, Super Admin |
| 2FA adoption               | % of active users with 2FA enabled, broken down by role                                          | Property Admin, Super Admin |
| Password age distribution  | How many users have passwords older than 30/60/90 days                                           | Property Admin, Super Admin |
| Missing data score         | % of profiles with incomplete information (no phone, no emergency contact, etc.)                 | Property Admin, Super Admin |
| Missing email count        | Count of users with no email address on file, broken down by role category (staff vs. residents) | Property Admin, Super Admin |
| Missing phone count        | Count of users with no phone number on file                                                      | Property Admin, Super Admin |
| Missing emergency contacts | Count of residents with zero emergency contacts                                                  | Property Admin, Super Admin |

### 8.2 Performance Metrics

| Metric                         | Description                                                | Target     |
| ------------------------------ | ---------------------------------------------------------- | ---------- |
| Onboarding completion time     | Median time from account creation to first dashboard login | < 48 hours |
| Welcome email delivery rate    | % of welcome emails delivered (not bounced)                | > 98%      |
| Password reset resolution time | Median time from reset request to successful login         | < 1 hour   |
| Account action response time   | API response time for create/edit/status-change actions    | < 500ms    |

### 8.3 AI Insight Metrics

| Metric                                  | Description                                      |
| --------------------------------------- | ------------------------------------------------ |
| Suspicious login alerts generated       | Count per week with false positive rate          |
| Contact validation suggestions accepted | Acceptance rate for email/phone typo corrections |
| CSV auto-correction acceptance rate     | % of AI suggestions accepted during bulk import  |

---

## 9. Notifications

### 9.1 Notification Triggers

| #   | Event                          | Channel           | Recipient      | Template                                                                                             |
| --- | ------------------------------ | ----------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Account created                | Email             | New user       | Welcome email (configurable template)                                                                |
| 2   | Password changed               | Email + SMS       | User           | "Your password was changed at [time]. If this wasn't you, contact your property admin immediately."  |
| 3   | Password reset requested       | Email             | User           | "Click the link to reset your password. This link expires in 1 hour."                                |
| 4   | Account suspended              | Email             | User           | "Your account at [Property] has been suspended. Contact your property administrator."                |
| 5   | Account reactivated            | Email             | User           | "Your account at [Property] has been reactivated. You may now log in."                               |
| 6   | Login from new device          | Email + SMS       | User           | "New sign-in to your account from [Device] in [Location]. If this wasn't you, change your password." |
| 7   | 2FA enabled/disabled           | Email             | User           | "Two-factor authentication has been [enabled/disabled] on your account."                             |
| 8   | Failed login threshold reached | Email + Push      | Property Admin | "[User Name] has had [N] failed login attempts. Account locked for [duration]."                      |
| 9   | Suspicious login detected (AI) | Email + Push      | Property Admin | "Unusual login activity for [User Name] from [Location]. [View Details]"                             |
| 10  | Email address changed          | Email (old + new) | User           | "Your email was changed from [old] to [new]. If this wasn't you, contact support."                   |
| 11  | Welcome email resent           | Email             | User           | Same as #1                                                                                           |
| 12  | Role changed                   | Email             | User           | "Your role at [Property] has been changed from [old role] to [new role]."                            |
| 13  | Account deactivated            | Email             | User           | "Your account at [Property] has been deactivated."                                                   |
| 14  | Password expiring soon         | Email             | User (staff)   | "Your password will expire in [N] days. Change it now to avoid interruption."                        |

### 9.2 Unsubscribable vs. Mandatory

| Type                          | Unsubscribable | Rationale                       |
| ----------------------------- | :------------: | ------------------------------- |
| Welcome email                 |       No       | Required for account activation |
| Password changed              |       No       | Security notification           |
| Password reset                |       No       | User-initiated action           |
| Account suspended/deactivated |       No       | Must inform user of access loss |
| Login from new device         |      Yes       | User preference                 |
| Failed login alert (admin)    |       No       | Security responsibility         |
| Suspicious login (AI)         |       No       | Security responsibility         |
| Email address changed         |       No       | Security notification           |
| Role changed                  |       No       | Access change notification      |
| Password expiring             |      Yes       | Convenience notification        |

---

## 10. API

### 10.1 Endpoints

| #   | Method | Path                                  | Description                                           | Auth                                                   |
| --- | ------ | ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| 1   | POST   | `/api/v1/users`                       | Create a new user account                             | Property Admin+                                        |
| 2   | GET    | `/api/v1/users`                       | List users with filters (paginated)                   | Property Admin+ (full), Staff (limited)                |
| 3   | GET    | `/api/v1/users/:id`                   | Get user profile                                      | Property Admin+ (any user), User (own profile)         |
| 4   | PATCH  | `/api/v1/users/:id`                   | Update user profile                                   | Property Admin+ (any user), User (own editable fields) |
| 5   | POST   | `/api/v1/users/:id/status`            | Change account status (activate, suspend, deactivate) | Property Admin+                                        |
| 6   | POST   | `/api/v1/users/:id/role`              | Change user role at a property                        | Property Admin+                                        |
| 7   | POST   | `/api/v1/users/:id/welcome-email`     | Send or resend welcome email                          | Property Admin+                                        |
| 8   | POST   | `/api/v1/users/:id/password-reset`    | Trigger password reset email                          | Property Admin+                                        |
| 9   | POST   | `/api/v1/users/:id/2fa-reset`         | Reset user's 2FA configuration                        | Property Admin+                                        |
| 10  | DELETE | `/api/v1/users/:id/sessions`          | Sign out all sessions for a user                      | Property Admin+ (any), User (own)                      |
| 11  | GET    | `/api/v1/users/:id/login-audit`       | Get login audit trail                                 | Property Admin+ (any user), User (own, last 20)        |
| 12  | GET    | `/api/v1/users/:id/sessions`          | List active sessions                                  | Property Admin+ (any user), User (own)                 |
| 13  | DELETE | `/api/v1/users/:id/sessions/:sid`     | Sign out a specific session                           | User (own sessions only)                               |
| 14  | GET    | `/api/v1/users/:id/audit-log`         | Get account audit log (admin actions)                 | Property Admin+                                        |
| 15  | GET    | `/api/v1/users/:id/preferences`       | Get notification preferences                          | User (own)                                             |
| 16  | PATCH  | `/api/v1/users/:id/preferences`       | Update notification preferences                       | User (own)                                             |
| 17  | POST   | `/api/v1/users/import`                | Bulk import users from CSV                            | Property Admin+                                        |
| 18  | GET    | `/api/v1/users/import/:job_id`        | Check import job status                               | Property Admin+                                        |
| 19  | GET    | `/api/v1/users/export`                | Export user directory (CSV/Excel/PDF)                 | Property Admin+                                        |
| 20  | POST   | `/api/v1/auth/login`                  | Authenticate (email + password)                       | Public                                                 |
| 21  | POST   | `/api/v1/auth/2fa/verify`             | Verify 2FA TOTP code                                  | Authenticated (pre-2FA)                                |
| 22  | POST   | `/api/v1/auth/2fa/setup`              | Begin 2FA enrollment (returns QR + secret)            | Authenticated                                          |
| 23  | POST   | `/api/v1/auth/2fa/confirm`            | Confirm 2FA enrollment with verification code         | Authenticated                                          |
| 24  | POST   | `/api/v1/auth/password/change`        | Change own password                                   | Authenticated                                          |
| 25  | POST   | `/api/v1/auth/password/reset-request` | Request password reset (by email)                     | Public                                                 |
| 26  | POST   | `/api/v1/auth/password/reset-confirm` | Set new password with reset token                     | Public (with valid token)                              |
| 27  | POST   | `/api/v1/auth/logout`                 | End current session                                   | Authenticated                                          |
| 28  | GET    | `/api/v1/users/me`                    | Get current authenticated user profile                | Authenticated                                          |

### 10.2 Sample Payloads

**POST `/api/v1/users` -- Create User**

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@email.com",
  "phone": "+14165550100",
  "property_id": "uuid-property",
  "role_id": "uuid-role-owner",
  "unit_id": "uuid-unit-1205",
  "date_of_birth": "1985-06-15",
  "language": "en",
  "send_welcome_email": true,
  "front_desk_instructions": "Has a service dog. Do not ring buzzer -- knock only.",
  "require_assistance": false
}
```

**Response: 201 Created**

```json
{
  "id": "uuid-user",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@email.com",
  "status": "pending_activation",
  "role": { "id": "uuid-role-owner", "name": "Resident (Owner)" },
  "unit": { "id": "uuid-unit-1205", "number": "1205" },
  "property": { "id": "uuid-property", "name": "The Bond Condos" },
  "created_at": "2026-03-14T14:30:00Z",
  "welcome_email_queued": true
}
```

**POST `/api/v1/auth/login` -- Login**

```json
{
  "email": "jane.smith@email.com",
  "password": "SecurePass123!",
  "remember_me": true
}
```

**Response: 200 OK (2FA not required)**

```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid-user",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "Resident (Owner)",
    "property": "The Bond Condos"
  },
  "expires_at": "2026-04-13T14:30:00Z"
}
```

**Response: 200 OK (2FA required)**

```json
{
  "requires_2fa": true,
  "session_token": "temporary-pre-2fa-token",
  "expires_in": 300
}
```

### 10.3 Rate Limits

| Endpoint                            | Limit        | Window              |
| ----------------------------------- | ------------ | ------------------- |
| POST `/auth/login`                  | 10 requests  | per minute per IP   |
| POST `/auth/password/reset-request` | 3 requests   | per hour per email  |
| POST `/users/import`                | 5 requests   | per hour per admin  |
| GET `/users`                        | 60 requests  | per minute per user |
| All other endpoints                 | 120 requests | per minute per user |

### 10.4 Error Responses

| Status Code | When                             | Response Body                                                                                              |
| ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 400         | Validation error                 | `{ "error": "validation_error", "fields": { "email": "This email is already in use" } }`                   |
| 401         | Unauthenticated                  | `{ "error": "unauthenticated", "message": "Invalid or expired session" }`                                  |
| 403         | Unauthorized                     | `{ "error": "forbidden", "message": "You do not have permission to perform this action" }`                 |
| 404         | User not found                   | `{ "error": "not_found", "message": "User not found" }`                                                    |
| 409         | Conflict (e.g., duplicate email) | `{ "error": "conflict", "message": "A user with this email already exists at this property" }`             |
| 423         | Account locked                   | `{ "error": "account_locked", "message": "Account locked. Try again in 12 minutes.", "retry_after": 720 }` |
| 429         | Rate limited                     | `{ "error": "rate_limited", "message": "Too many requests. Try again later.", "retry_after": 30 }`         |

---

## 11. Completeness Checklist

| #   | Requirement                                                                                    | Section                    | Status |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------- | :----: |
| 1   | Account creation (single) with all fields specified                                            | 3.1.1                      |  Done  |
| 2   | Account status lifecycle (pending, active, suspended, deactivated)                             | 3.1.2                      |  Done  |
| 3   | Welcome email with configurable template                                                       | 3.1.3                      |  Done  |
| 4   | Onboarding flow (5 steps)                                                                      | 3.1.3                      |  Done  |
| 5   | Password policy with configurable rules                                                        | 3.1.4                      |  Done  |
| 6   | Real-time password strength indicator                                                          | 3.1.4                      |  Done  |
| 7   | Two-factor authentication (TOTP) with backup codes                                             | 3.1.5                      |  Done  |
| 8   | Admin-enforced 2FA per role                                                                    | 3.1.5                      |  Done  |
| 9   | Login audit trail (device, IP, location, status)                                               | 3.1.6                      |  Done  |
| 10  | Profile self-editing with email verification flow                                              | 3.1.7                      |  Done  |
| 11  | Notification preferences per module per channel                                                | 3.1.8                      |  Done  |
| 12  | Session management with multi-device support                                                   | 3.1.9                      |  Done  |
| 13  | User search with 7 filter types                                                                | 3.1.10                     |  Done  |
| 14  | User directory with export (CSV, Excel, PDF)                                                   | 3.1.10                     |  Done  |
| 15  | Bulk user import via CSV (v2)                                                                  | 3.2.1                      |  Done  |
| 16  | Temporary roles with expiry (v2)                                                               | 3.2.3                      |  Done  |
| 17  | Account merge for multi-property users (v2)                                                    | 3.2.4                      |  Done  |
| 18  | Data model for all 8 entities with field specs                                                 | 4                          |  Done  |
| 19  | 5 user flows covering primary workflows                                                        | 5                          |  Done  |
| 20  | Desktop, tablet, and mobile layouts                                                            | 6.1                        |  Done  |
| 21  | Empty state with guidance                                                                      | 6.1                        |  Done  |
| 22  | Loading state (skeleton rows)                                                                  | 6.1                        |  Done  |
| 23  | Error state with retry                                                                         | 6.1                        |  Done  |
| 24  | Progressive disclosure for advanced features                                                   | 6.5                        |  Done  |
| 25  | AI: Suspicious Login Detection                                                                 | 7.1                        |  Done  |
| 26  | AI: Contact Validation                                                                         | 7.2                        |  Done  |
| 27  | AI: Profile Auto-Complete                                                                      | 7.3                        |  Done  |
| 28  | 8 operational metrics                                                                          | 8.1                        |  Done  |
| 29  | 4 performance metrics with targets                                                             | 8.2                        |  Done  |
| 30  | 14 notification triggers with channels and templates                                           | 9.1                        |  Done  |
| 31  | Mandatory vs. unsubscribable notification classification                                       | 9.2                        |  Done  |
| 32  | 28 API endpoints with auth requirements                                                        | 10.1                       |  Done  |
| 33  | Sample request/response payloads                                                               | 10.2                       |  Done  |
| 34  | Rate limits per endpoint                                                                       | 10.3                       |  Done  |
| 35  | Error response format with status codes                                                        | 10.4                       |  Done  |
| 36  | No competitor names used anywhere in document                                                  | All                        |  Done  |
| 37  | Every field has: data type, max length, required/optional, default, validation, error messages | 3.1.1, 3.1.4, 3.1.5        |  Done  |
| 38  | Every button has: default, loading, success, failure states                                    | 3.1.1, 3.1.2, 3.1.4, 3.1.5 |  Done  |
| 39  | Tooltips for complex features                                                                  | 3.1.1, 3.1.8, 6.4          |  Done  |
| 40  | Role-aware visibility rules                                                                    | 3.1.8, 6.2                 |  Done  |

---

## Enhanced Authentication Details

### 2FA Implementation Detail

#### Primary Method: TOTP via Authenticator App

| Aspect                   | Detail                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| **Protocol**             | Time-based One-Time Password (TOTP) per RFC 6238                                                   |
| **Compatible apps**      | Google Authenticator, Authy, 1Password, Microsoft Authenticator, any TOTP-compliant app            |
| **Secret key**           | 160-bit secret, stored encrypted (AES-256-GCM) in the database. Never exposed after initial setup. |
| **Code format**          | 6-digit numeric code, 30-second rotation window                                                    |
| **Clock skew tolerance** | Accept codes from the previous and next 30-second window (90-second effective window)              |

#### Setup Flow

1. User navigates to My Account > Security > Two-Factor Authentication and clicks "Enable 2FA."
2. System generates a TOTP secret and displays it as a QR code (otpauth:// URI) and a manual entry key (base32-encoded, grouped in 4-character blocks for readability).
3. User scans the QR code with their authenticator app.
4. User enters the current 6-digit code from their app into the verification field.
5. System validates the code. If correct, 2FA is activated.
6. System generates 10 single-use recovery codes and displays them in a modal. Format: `XXXXX-XXXXX` (alphanumeric, uppercase, hyphen-separated).
7. User is prompted to save or download the recovery codes. A "Download as .txt" button is provided.
8. User must type one of the 10 recovery codes into a confirmation field to prove they saved them. This step cannot be skipped.
9. Setup complete. A confirmation toast appears: "Two-factor authentication is now enabled."

#### Recovery Codes

| Aspect           | Detail                                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Count**        | 10 codes generated per 2FA setup                                                                                                          |
| **Format**       | `XXXXX-XXXXX` (10 alphanumeric uppercase characters, hyphen-separated)                                                                    |
| **Storage**      | Stored as Argon2id hashes in the database. The plaintext is shown exactly once during setup and never again.                              |
| **Usage**        | Each code is single-use. Once used, it is marked as consumed with a timestamp.                                                            |
| **Regeneration** | User can regenerate all 10 codes from My Account > Security. This invalidates all previous codes. Requires current password confirmation. |
| **Display**      | Remaining unused code count shown on the Security tab: "You have X of 10 recovery codes remaining."                                       |

#### SMS Fallback (v2)

| Aspect                      | Detail                                                                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Availability**            | v2 release. Optional secondary 2FA method.                                                                                                                                             |
| **Prerequisite**            | User must have a verified phone number on file.                                                                                                                                        |
| **Behavior**                | On the 2FA prompt screen, a "Send code via SMS" link appears below the TOTP input. Clicking it sends a 6-digit code via Twilio (see PRD 18). Code is valid for 10 minutes, single-use. |
| **Rate limit**              | Maximum 3 SMS codes per hour per user.                                                                                                                                                 |
| **Not a standalone method** | SMS cannot be the only 2FA method. TOTP must be set up first. SMS is a fallback only.                                                                                                  |

#### Hardware Keys (v3)

| Aspect                | Detail                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| **Availability**      | v3 release.                                                                                         |
| **Protocol**          | WebAuthn / FIDO2                                                                                    |
| **Supported devices** | YubiKey, Google Titan, platform authenticators (Touch ID, Windows Hello)                            |
| **Registration**      | User registers a hardware key via My Account > Security. Multiple keys can be registered (up to 5). |
| **Fallback**          | Hardware key users must also have TOTP configured as a fallback.                                    |

#### Enforcement

| Aspect                      | Detail                                                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Per-role enforcement**    | Super Admin or Property Admin can enforce 2FA for specific roles via Settings > Role & Permission Management.                                                                                                 |
| **Enforcement behavior**    | When 2FA is enforced for a role, users with that role who have not yet set up 2FA are redirected to the 2FA setup screen on every login. They cannot access any other page until 2FA is configured.           |
| **Recommended enforcement** | All staff roles (Property Manager, Security Supervisor, Security Guard, Front Desk / Concierge, Maintenance Staff) should have 2FA enforced. Resident roles are optional (configurable per property).         |
| **Grace period**            | When enforcement is newly enabled, existing users get a 7-day grace period with a dismissible banner: "Your admin requires two-factor authentication. Set it up now." After 7 days, the redirect is enforced. |

#### Recovery: Lost Device and All Recovery Codes

| Aspect            | Detail                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**      | User has lost their authenticator device AND exhausted all recovery codes.                                                                                                                                                                                                                                                          |
| **Resolution**    | The user contacts their Property Admin. The Property Admin navigates to User Management > [User] > Security and clicks "Reset 2FA." This disables 2FA on the user's account and sends an email notification: "Two-factor authentication has been reset on your account by [Admin Name]. Please set it up again on your next login." |
| **Audit**         | The 2FA reset action is logged in the audit trail: admin who performed it, user affected, timestamp, IP address.                                                                                                                                                                                                                    |
| **Re-enrollment** | On next login, the user completes the normal login flow (no 2FA prompt). If 2FA is enforced for their role, they are immediately redirected to the 2FA setup screen.                                                                                                                                                                |

### Session Management Detail

#### Concurrent Sessions

| Aspect                           | Detail                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default limit**                | 5 active sessions per user                                                                                                                                                                  |
| **Configurable**                 | Property Admin can adjust the limit per property (range: 1-10) via Settings > Property Setup.                                                                                               |
| **Behavior when limit exceeded** | The oldest session is automatically revoked when a new login creates a 6th session. The user on the revoked session sees: "Your session has ended because you signed in on another device." |
| **Exception**                    | Super Admin accounts have no session limit.                                                                                                                                                 |

#### Device Fingerprinting

| Aspect         | Detail                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Components** | User agent string, screen resolution, timezone, browser language, platform (OS)                                                 |
| **Storage**    | Components are combined and hashed (SHA-256). The hash is stored with the session record. Individual components are not stored. |
| **Purpose**    | Used for "Active Sessions" display (human-readable device name derived from user agent) and impossible travel detection.        |
| **Privacy**    | No tracking cookies, no cross-site fingerprinting. Fingerprint is used solely for session identification within the platform.   |

#### Impossible Travel Detection

| Aspect             | Detail                                                                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Logic**          | On each login, the system compares the IP-derived geolocation with the previous login's geolocation and the time delta between them. If the distance between the two locations is physically impossible to travel in the time elapsed (e.g., Toronto to Vancouver in 30 minutes), the login is flagged. |
| **Threshold**      | Default: 500 km/hour (accounts for flights). Configurable by Super Admin.                                                                                                                                                                                                                               |
| **Action on flag** | The login succeeds but an alert is generated for the Property Admin: "Impossible travel detected for [User Name]: [City A] at [Time A] and [City B] at [Time B]." The user also receives an email notification about the new sign-in from an unusual location.                                          |
| **IP geolocation** | Resolved via a lightweight IP geolocation database (e.g., MaxMind GeoLite2), updated monthly. No external API call per login.                                                                                                                                                                           |

#### Step-Up Authentication

Sensitive operations require the user to re-confirm their identity even within an active session:

| Operation                                 | Re-authentication Method                                             |
| ----------------------------------------- | -------------------------------------------------------------------- |
| Change password                           | Enter current password                                               |
| Change email address                      | Enter current password + email verification code sent to new address |
| Export data (CSV, Excel, PDF of reports)  | Enter current password                                               |
| Delete account (self-service, if enabled) | Enter current password + 2FA code (if enabled)                       |
| Reset another user's 2FA (admin)          | Enter admin's current password                                       |
| View/regenerate recovery codes            | Enter current password                                               |

**UX**: A modal overlay appears: "For your security, please confirm your password to continue." with a password field and "Confirm" / "Cancel" buttons. The modal auto-closes after 5 minutes of inactivity.

#### Active Sessions List

| Aspect           | Detail                                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Location**     | My Account > Security > Active Sessions                                                                                                                                          |
| **Columns**      | Device (derived from user agent, e.g., "Chrome on macOS"), Location (city, country from IP), Last Active (relative timestamp), Status (Current Session badge for the active one) |
| **Actions**      | "Revoke" button on each session except the current one. "Revoke All Other Sessions" button at the top.                                                                           |
| **Confirmation** | Revoking a session shows a confirmation: "This will sign out the device in [Location]. Continue?"                                                                                |
| **Audit**        | Session revocations are logged in the audit trail.                                                                                                                               |

### Password Reset Flow Detail

#### Flow Steps

1. User clicks "Forgot Password" on the login page.
2. User enters their email address and clicks "Send Reset Link."
3. System validates the email exists in the database. **Regardless of whether the email exists**, the same confirmation message is shown: "If an account with that email exists, you will receive a reset link shortly." This prevents email enumeration attacks.
4. If the email exists, the system generates a signed JWT containing: `user_id`, `purpose: password_reset`, `issued_at`, `expires_at` (1 hour from now). The JWT is signed with a server-side secret.
5. The reset link is sent via email: `concierge.com/auth/reset-password?token=[JWT]`. The link is valid for 1 hour.
6. User clicks the link. The system validates the JWT: signature valid, not expired, not already used (single-use flag checked against a `used_reset_tokens` table).
7. User enters a new password. The password must pass the full password policy: minimum 12 characters, at least one uppercase letter, one lowercase letter, one number, one special character. The password must not match any of the user's last 5 passwords (checked against password history hashes).
8. On successful reset: the password is updated, the reset token is marked as used, and **all active sessions for the user are revoked** (force re-login on every device).
9. A confirmation email is sent: "Your password has been successfully reset. If you did not do this, contact your property administrator immediately."

#### Rate Limiting

| Aspect             | Detail                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Per email**      | Maximum 3 reset requests per email address per hour. After 3 requests, subsequent attempts show: "Too many reset requests. Please try again later." |
| **Per IP**         | Maximum 10 reset requests per IP address per hour (prevents brute-force enumeration).                                                               |
| **Token validity** | 1 hour from generation. Expired tokens return: "This reset link has expired. Please request a new one."                                             |

#### Breach Check (v2)

| Aspect                   | Detail                                                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Availability**         | v2 release                                                                                                                                                                                                                                                    |
| **Provider**             | Have I Been Pwned (HIBP) Pwned Passwords API                                                                                                                                                                                                                  |
| **Method**               | k-Anonymity model: the first 5 characters of the SHA-1 hash of the password are sent to the API. The API returns all matching hashes. The client checks locally if the full hash matches any returned result. The plaintext password never leaves the server. |
| **Trigger**              | On password set (initial), password change, and password reset                                                                                                                                                                                                |
| **Behavior if breached** | Warning message (not a hard block): "This password has appeared in a known data breach. We strongly recommend choosing a different password." with "Choose a Different Password" (primary) and "Use Anyway" (secondary, text link) buttons.                   |
| **Graceful degradation** | If the HIBP API is unreachable, the check is skipped silently. Password creation proceeds normally.                                                                                                                                                           |

---

_End of document._
