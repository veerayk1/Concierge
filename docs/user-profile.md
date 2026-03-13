# User Profile

The User Profile page displays comprehensive information about a user/resident across 6 tabbed sections.

**URL**: `/view-user/{username}` (e.g., `/view-user/RAY_007`)

---

## Page Header

- **User Name Display**: Full name in large text (e.g., "RAY KODAVALI") with user icon
- **Edit Button**: Dark blue "Edit" button (top-right) to modify profile

---

## Tab Navigation

6 tabs:
1. **User** — Personal details, contacts, parcel waivers
2. **Emergency Contacts** — Emergency contact information
3. **Notification Preferences** — Links to `/preferences` page
4. **Vehicles And Parking** — Vehicle registrations and parking info
5. **Pets** — Pet registration details
6. **Documents** — Legal documents (POA, lease, insurance)

---

## Tab 1: User

### USER DETAILS Section

| Field | Description |
|-------|-------------|
| Username | System username (e.g., "Ray_007") |
| Firstname | First name |
| Lastname | Last name |
| Front desk Instructions | Special instructions for front desk staff |
| User Group | Role assignment (e.g., "staff - (property manager)") |
| Offsite Address | Address if offsite owner |
| Email Address | Primary email |
| User Status | Active/Inactive status |
| Assistance Required | Whether user needs emergency assistance (Yes/No) |
| Last Logged In | Last login timestamp |
| Account Created on | Account creation date |
| Account Updated on | Last profile update date |
| About you | Free-text bio/description |

### CONTACTS Section

| Field | Description |
|-------|-------------|
| Email | Contact email address |
| Phone Number | Primary phone |
| Home Phone | Home phone number |
| Work Phone | Work phone number |

### PARCEL WAIVERS Section

| Field | Description |
|-------|-------------|
| Signed At | Date/time the waiver was signed |
| Attachment | Uploaded waiver document (file size shown) |
| Notes | Additional notes about the waiver |

---

## Tab 2: Emergency Contacts

- Displays emergency contact entries
- Shows "No Emergency contacts have been specified" when empty
- Fields (when populated): Contact Name, Relationship, Phone Number, Email

---

## Tab 3: Notification Preferences

- Links directly to the `/preferences` page (Notification Settings)
- Same content as the standalone Email Preferences page
- See [preferences.md](preferences.md) for full details

---

## Tab 4: Vehicles And Parking

### Vehicles Section

Supports up to 3 vehicles per user:

| Field | Description |
|-------|-------------|
| Vehicle 1 Plate Number | License plate for vehicle 1 |
| Vehicle 1 Color | Color of vehicle 1 |
| Vehicle 1 Model | Make/model of vehicle 1 |
| Vehicle 2 Plate Number | License plate for vehicle 2 |
| Vehicle 2 Color | Color of vehicle 2 |
| Vehicle 2 Model | Make/model of vehicle 2 |
| Vehicle 3 Plate Number | License plate for vehicle 3 |
| Vehicle 3 Color | Color of vehicle 3 |
| Vehicle 3 Model | Make/model of vehicle 3 |

### Parking Section

| Field | Description |
|-------|-------------|
| Renting a parking spot? | Yes/No toggle |
| Which Unit Are You Renting From? | Unit number if renting a spot from another unit |

---

## Tab 5: Pets

- Displays registered pet information
- Shows "No pet related details have been provided" when empty
- Fields (when populated): Pet type, breed, name, registration details

---

## Tab 6: Documents

Tracks key legal/administrative documents:

| Document Type | Description |
|---------------|-------------|
| Power of Attorney for Owner? | Whether POA document is on file |
| Lease Agreement? | Whether lease agreement is uploaded |
| Insurance Certificate? | Whether insurance certificate is provided |

---

## Features Summary

- Comprehensive resident/user profile with 6 data categories
- Editable profile via Edit button
- Vehicle registration (up to 3 vehicles)
- Parking spot rental tracking
- Emergency contact management
- Legal document tracking (POA, lease, insurance)
- Pet registration system
- Parcel waiver management
- Notification preference integration
- User group/role display
- Login tracking and account audit dates
