# User Management

The User Management page provides tools for managing building users, sending welcome emails, and onboarding new residents.

**URL**: `/manage-users`

**Title**: "User Management Menu"

**Top Nav**: Accessible via "Create User" tab in the top navigation bar

---

## Page Structure

### Building Selection

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Choose building to manage users for (e.g., "Bond") |

### Welcome Email Notice

When welcome emails have already been sent for the selected building, a notice appears:

> "Welcome emails have already been sent for this building. If you want to send welcome emails to new residents please go to resident profile and choose the 'Send Welcome Email' option there"

### Send Welcome Email Button

- **"Send Welcome Email"** button (outlined/bordered style, right-aligned)
- Sends the configured welcome email template (from Settings > Login Instructions tab) to new/selected users
- The email subject and body are configured in the building's Login Instructions settings

---

## Related Features

### Create User (Top Navigation)

The "Create User" link in the top navigation bar leads to the user creation workflow:
- Building selection
- User details entry
- Role/group assignment
- Unit association

### User Profile Management

Individual user management is done via the User Profile page (`/view-user/{username}`):
- Edit user details
- Manage emergency contacts
- Set notification preferences
- Register vehicles and parking
- Register pets
- Upload documents (POA, lease, insurance)
- Send welcome email to individual users

---

## Features Summary

- Building-scoped user management
- Bulk welcome email sending for new building onboarding
- Individual welcome email resend from user profiles
- Integration with Login Instructions settings for email template customization
- Multi-building support
