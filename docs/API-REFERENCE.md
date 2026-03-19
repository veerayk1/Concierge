# Concierge API Reference

> **Base URL**: `https://{property}.concierge.app/api`
> **API Version**: v1
> **Authentication**: Bearer token (JWT) via `Authorization` header
> **Content-Type**: `application/json` (unless otherwise noted)

This document is auto-generated from route file scanning. Every endpoint listed below corresponds to an actual `route.ts` file in the codebase.

**Total route files**: 185+
**Total endpoints**: 350+
**Auth-protected**: 95%+ of v1 routes

---

## Table of Contents

1. [Authentication](#authentication)
2. [Infrastructure](#infrastructure)
3. [Dashboard](#dashboard)
4. [Events & Security Console](#events--security-console)
5. [Packages](#packages)
6. [Maintenance](#maintenance)
7. [Amenity Booking](#amenity-booking)
8. [Announcements](#announcements)
9. [Units & Buildings](#units--buildings)
10. [Residents](#residents)
11. [Resident Portal (Self-Service)](#resident-portal-self-service)
12. [User Management](#user-management)
13. [Visitors & Incidents](#visitors--incidents)
14. [Keys & FOB Management](#keys--fob-management)
15. [Parking](#parking)
16. [Shift Log](#shift-log)
17. [Vendor Management](#vendor-management)
18. [Training & LMS](#training--lms)
19. [Community](#community)
20. [Classified Ads](#classified-ads)
21. [Idea Board](#idea-board)
22. [Discussion Forum](#discussion-forum)
23. [Emergency Broadcast](#emergency-broadcast)
24. [Equipment](#equipment)
25. [Inspections](#inspections)
26. [Recurring Tasks](#recurring-tasks)
27. [Alteration Projects](#alteration-projects)
28. [Notifications](#notifications)
29. [Billing & Subscription](#billing--subscription)
30. [Onboarding](#onboarding)
31. [Property Management](#property-management)
32. [Board Governance](#board-governance)
33. [Document Library](#document-library)
34. [Surveys](#surveys)
35. [Reports & Analytics](#reports--analytics)
36. [Search](#search)
37. [File Upload](#file-upload)
38. [Feature Flags](#feature-flags)
39. [Settings](#settings)
40. [Custom Fields](#custom-fields)
41. [Compliance](#compliance)
42. [Privacy & Compliance](#privacy--compliance)
43. [Help Center](#help-center)
44. [Developer Portal & API](#developer-portal--api)
45. [Data Migration](#data-migration)
46. [Demo Environment](#demo-environment)
47. [AI & Analytics](#ai--analytics)
48. [Asset Management](#asset-management)
49. [Audit Log](#audit-log)
50. [Building Directory](#building-directory)
51. [Resident Cards](#resident-cards)
52. [Photo Albums](#photo-albums)
53. [Digital Signage](#digital-signage)
54. [Purchase Orders](#purchase-orders)

---

## Authentication

Auth routes are **public** (no Bearer token required).

### POST /api/auth/login

- **Auth required**: No
- **Description**: Authenticate user with email and password. Returns JWT access token and refresh token.

### POST /api/auth/logout

- **Auth required**: No
- **Description**: End the current user session and invalidate tokens.

### POST /api/auth/refresh

- **Auth required**: No
- **Description**: Exchange a valid refresh token for a new access token.

### POST /api/auth/forgot-password

- **Auth required**: No
- **Description**: Request a password reset email for the given email address.

### POST /api/auth/reset-password

- **Auth required**: No
- **Description**: Reset the user's password using a reset token from the email.

### POST /api/auth/verify-2fa

- **Auth required**: No
- **Description**: Verify a two-factor authentication code during login.

### GET /api/auth/sessions

- **Auth required**: No
- **Description**: List active sessions for the authenticated user (login audit trail).

---

## Infrastructure

### GET /api/health

- **Auth required**: No
- **Description**: Basic health check. Returns 200 if the application is running.

### GET /api/health/detailed

- **Auth required**: No
- **Description**: Detailed health check with database, cache, and external service dependency status.

### POST /api/csp-report

- **Auth required**: No
- **Description**: Receive Content-Security-Policy violation reports from browsers.

---

## Dashboard

### GET /api/v1/dashboard

- **Auth required**: Yes
- **Description**: Retrieve role-aware dashboard data including widgets, statistics, and recent activity.

---

## Events & Security Console

Unified event model with configurable event types. Covers security logs, package events, cleaning logs, incidents, and more.

### GET /api/v1/events

- **Auth required**: Yes
- **Description**: List events with filtering by type, date range, unit, and status. Supports pagination.

### POST /api/v1/events

- **Auth required**: Yes
- **Description**: Create a new event. Event type determines fields, notification behavior, and display settings.

### GET /api/v1/events/:id

- **Auth required**: Yes
- **Description**: Get details of a specific event by ID.

### PATCH /api/v1/events/:id

- **Auth required**: Yes
- **Description**: Update an event (e.g., close it, add comments, update status).

### GET /api/v1/event-types

- **Auth required**: Yes
- **Description**: List all configured event types for the property.

### POST /api/v1/event-types

- **Auth required**: Yes
- **Description**: Create a new event type with icon, color, notification template, and display settings.

### PATCH /api/v1/event-types/:id

- **Auth required**: Yes
- **Description**: Update an event type configuration.

### DELETE /api/v1/event-types/:id

- **Auth required**: Yes
- **Description**: Delete an event type (soft delete if events exist).

### GET /api/v1/event-types/email-config

- **Auth required**: Yes
- **Description**: Get email configuration for event type notifications.

### POST /api/v1/event-types/email-config

- **Auth required**: Yes
- **Description**: Create email notification configuration for an event type.

### PUT /api/v1/event-types/email-config

- **Auth required**: Yes
- **Description**: Update email notification configuration for an event type.

---

## Packages

Courier-specific package tracking with lifecycle management (intake, storage, notification, release).

### GET /api/v1/packages

- **Auth required**: Yes
- **Description**: List packages with filtering by status, courier, unit, and date range. Supports pagination.

### POST /api/v1/packages

- **Auth required**: Yes
- **Description**: Log a new package intake. Auto-generates reference number and triggers resident notification.

### GET /api/v1/packages/:id

- **Auth required**: Yes
- **Description**: Get details of a specific package including courier, storage location, and release info.

### PATCH /api/v1/packages/:id

- **Auth required**: Yes
- **Description**: Update a package (e.g., mark as released, update storage spot).

### DELETE /api/v1/packages/:id

- **Auth required**: Yes
- **Description**: Delete a package record.

### POST /api/v1/packages/:id/remind

- **Auth required**: Yes
- **Description**: Send a pickup reminder notification to the resident for an uncollected package.

### POST /api/v1/packages/batch

- **Auth required**: Yes
- **Description**: Batch create multiple packages at once (4-row form with per-row notification control).

### POST /api/v1/packages/batch-release

- **Auth required**: Yes
- **Description**: Release multiple packages at once for a resident picking up.

### GET /api/v1/couriers

- **Auth required**: Yes
- **Description**: List configured couriers (Amazon, FedEx, UPS, etc.) with icons.

### GET /api/v1/storage-spots

- **Auth required**: Yes
- **Description**: List available storage spots for package placement.

### POST /api/v1/storage-spots

- **Auth required**: Yes
- **Description**: Create a new storage spot.

---

## Maintenance

Rich maintenance request system with photo/document uploads, vendor assignment, and SLA tracking.

### GET /api/v1/maintenance

- **Auth required**: Yes
- **Description**: List maintenance requests with filtering by status, category, priority, and assignment.

### POST /api/v1/maintenance

- **Auth required**: Yes
- **Description**: Create a new maintenance request with photos, documents, and entry instructions.

### GET /api/v1/maintenance/:id

- **Auth required**: Yes
- **Description**: Get details of a specific maintenance request including comments and attachments.

### PATCH /api/v1/maintenance/:id

- **Auth required**: Yes
- **Description**: Update a maintenance request (status, assignment, priority).

### DELETE /api/v1/maintenance/:id

- **Auth required**: Yes
- **Description**: Delete a maintenance request.

### GET /api/v1/maintenance/:id/comments

- **Auth required**: Yes
- **Description**: List comments and updates on a maintenance request.

### POST /api/v1/maintenance/:id/comments

- **Auth required**: Yes
- **Description**: Add a comment or update to a maintenance request.

### GET /api/v1/maintenance/categories

- **Auth required**: Yes
- **Description**: List configurable maintenance categories for the property.

### POST /api/v1/maintenance/categories

- **Auth required**: Yes
- **Description**: Create a new maintenance category.

---

## Amenity Booking

Calendar, list, and grid views with approval workflows and payment integration.

### GET /api/v1/amenities

- **Auth required**: Yes
- **Description**: List all bookable amenities for the property.

### GET /api/v1/amenities/:id

- **Auth required**: Yes
- **Description**: Get details of a specific amenity including availability rules and pricing.

### POST /api/v1/amenities/:id

- **Auth required**: Yes
- **Description**: Update amenity configuration.

### GET /api/v1/amenities/groups

- **Auth required**: Yes
- **Description**: List amenity groups (e.g., Indoor, Outdoor, Common Areas).

### POST /api/v1/amenities/groups

- **Auth required**: Yes
- **Description**: Create a new amenity group.

### GET /api/v1/bookings

- **Auth required**: Yes
- **Description**: List bookings with filtering by amenity, date, status, and unit.

### POST /api/v1/bookings

- **Auth required**: Yes
- **Description**: Create a new amenity booking with approval workflow if required.

### GET /api/v1/bookings/:id

- **Auth required**: Yes
- **Description**: Get details of a specific booking.

### PATCH /api/v1/bookings/:id

- **Auth required**: Yes
- **Description**: Update a booking (approve, reject, cancel, reschedule).

### DELETE /api/v1/bookings/:id

- **Auth required**: Yes
- **Description**: Cancel and delete a booking.

---

## Announcements

Multi-channel distribution (web portal, mobile push, email) with delivery tracking.

### GET /api/v1/announcements

- **Auth required**: Yes
- **Description**: List announcements with filtering by status and date.

### POST /api/v1/announcements

- **Auth required**: Yes
- **Description**: Create and distribute a new announcement across configured channels.

### GET /api/v1/announcements/:id

- **Auth required**: Yes
- **Description**: Get details of a specific announcement.

### PATCH /api/v1/announcements/:id

- **Auth required**: Yes
- **Description**: Update an announcement.

### DELETE /api/v1/announcements/:id

- **Auth required**: Yes
- **Description**: Delete an announcement.

### GET /api/v1/announcements/:id/deliveries

- **Auth required**: Yes
- **Description**: Get delivery status for an announcement (which channels, read receipts).

### POST /api/v1/announcements/:id/deliveries/retry

- **Auth required**: Yes
- **Description**: Retry failed deliveries for an announcement.

---

## Units & Buildings

Modular unit overview with custom fields, per-unit instructions, and resident linkage.

### GET /api/v1/units

- **Auth required**: Yes
- **Description**: List units with filtering by floor, building, and occupancy status.

### GET /api/v1/units/:id

- **Auth required**: Yes
- **Description**: Get the full unit file including occupants, instructions, events, and custom fields.

### PATCH /api/v1/units/:id

- **Auth required**: Yes
- **Description**: Update unit details and custom fields.

### GET /api/v1/units/:id/residents

- **Auth required**: Yes
- **Description**: List residents linked to a specific unit.

### GET /api/v1/units/:id/instructions

- **Auth required**: Yes
- **Description**: Get front desk instructions for a unit (e.g., "Unit 815 has a dog that bites").

### POST /api/v1/units/:id/instructions

- **Auth required**: Yes
- **Description**: Add a new front desk instruction for a unit.

### GET /api/v1/buildings

- **Auth required**: Yes
- **Description**: List buildings in the property.

### POST /api/v1/buildings

- **Auth required**: Yes
- **Description**: Create a new building.

---

## Residents

Resident management with emergency contacts, pets, vehicles, and authorized delegates.

### GET /api/v1/residents

- **Auth required**: Yes
- **Description**: List residents with search and filtering.

### GET /api/v1/residents/vacations

- **Auth required**: Yes
- **Description**: List resident vacation/away notices.

### POST /api/v1/residents/vacations

- **Auth required**: Yes
- **Description**: Create a vacation notice for a resident.

### GET /api/v1/emergency-contacts

- **Auth required**: Yes
- **Description**: List emergency contacts across all residents or for a specific unit.

### POST /api/v1/emergency-contacts

- **Auth required**: Yes
- **Description**: Add an emergency contact for a resident.

### GET /api/v1/authorized-delegates

- **Auth required**: Yes
- **Description**: List authorized delegates (people allowed to pick up packages, etc.).

### POST /api/v1/authorized-delegates

- **Auth required**: Yes
- **Description**: Add an authorized delegate for a resident.

### GET /api/v1/pets

- **Auth required**: Yes
- **Description**: List registered pets.

### POST /api/v1/pets

- **Auth required**: Yes
- **Description**: Register a new pet for a unit.

### GET /api/v1/vehicles

- **Auth required**: Yes
- **Description**: List registered vehicles.

### POST /api/v1/vehicles

- **Auth required**: Yes
- **Description**: Register a new vehicle for a unit.

---

## Resident Portal (Self-Service)

Endpoints for resident-facing features. All require auth with a resident role.

### GET /api/v1/resident/packages

- **Auth required**: Yes
- **Description**: List packages for the authenticated resident's unit.

### GET /api/v1/resident/maintenance

- **Auth required**: Yes
- **Description**: List maintenance requests submitted by or affecting the resident.

### POST /api/v1/resident/maintenance

- **Auth required**: Yes
- **Description**: Submit a new maintenance request as a resident.

### GET /api/v1/resident/bookings

- **Auth required**: Yes
- **Description**: List the resident's amenity bookings.

### POST /api/v1/resident/bookings

- **Auth required**: Yes
- **Description**: Create a new amenity booking as a resident.

### DELETE /api/v1/resident/bookings

- **Auth required**: Yes
- **Description**: Cancel a resident's booking.

### GET /api/v1/resident/announcements

- **Auth required**: Yes
- **Description**: List announcements visible to the resident.

### GET /api/v1/resident/notifications

- **Auth required**: Yes
- **Description**: List the resident's notifications.

### PATCH /api/v1/resident/notifications

- **Auth required**: Yes
- **Description**: Mark notifications as read.

### GET /api/v1/resident/profile

- **Auth required**: Yes
- **Description**: Get the resident's profile information.

### PATCH /api/v1/resident/profile

- **Auth required**: Yes
- **Description**: Update the resident's profile information.

---

## User Management

Admin-controlled user accounts with role assignment and bulk operations.

### GET /api/v1/users

- **Auth required**: Yes
- **Description**: List users with filtering by role, status, and search.

### POST /api/v1/users

- **Auth required**: Yes
- **Description**: Create a new user account (admin creates accounts, no SSO).

### GET /api/v1/users/:id

- **Auth required**: Yes
- **Description**: Get details of a specific user.

### PATCH /api/v1/users/:id

- **Auth required**: Yes
- **Description**: Update a user's details, role, or status.

### DELETE /api/v1/users/:id

- **Auth required**: Yes
- **Description**: Deactivate or delete a user account.

### GET /api/v1/users/me

- **Auth required**: Yes
- **Description**: Get the authenticated user's own profile.

### PATCH /api/v1/users/me

- **Auth required**: Yes
- **Description**: Update the authenticated user's own profile.

### GET /api/v1/users/:id/sessions

- **Auth required**: Yes
- **Description**: List login sessions for a user (audit trail with device, IP, status).

### DELETE /api/v1/users/:id/sessions

- **Auth required**: Yes
- **Description**: Revoke active sessions for a user.

### POST /api/v1/users/:id/welcome-email

- **Auth required**: Yes
- **Description**: Send or resend the welcome email to a user.

### POST /api/v1/users/bulk-import

- **Auth required**: Yes
- **Description**: Bulk import users from CSV file.

### GET /api/v1/roles

- **Auth required**: Yes
- **Description**: List available roles (Super Admin, Admin, Front Desk, Security, Resident, Board Member, etc.).

---

## Visitors & Incidents

Visitor management and incident reporting for the security console.

### GET /api/v1/visitors

- **Auth required**: Yes
- **Description**: List visitor records with filtering by status, date, and unit.

### POST /api/v1/visitors

- **Auth required**: Yes
- **Description**: Log a new visitor sign-in.

### GET /api/v1/visitors/:id

- **Auth required**: Yes
- **Description**: Get details of a specific visitor record.

### PATCH /api/v1/visitors/:id

- **Auth required**: Yes
- **Description**: Update a visitor record (e.g., sign out).

### POST /api/v1/visitors/batch-signout

- **Auth required**: Yes
- **Description**: Batch sign out multiple visitors at end of day or shift.

### GET /api/v1/incidents/:id/updates

- **Auth required**: Yes
- **Description**: List updates and timeline entries for a security incident.

### POST /api/v1/incidents/:id/updates

- **Auth required**: Yes
- **Description**: Add an update to a security incident.

### POST /api/v1/incidents/:id/escalate

- **Auth required**: Yes
- **Description**: Escalate a security incident to a higher authority or external services.

---

## Keys & FOB Management

Physical access management: FOBs, keys, buzzer codes, garage clickers.

### GET /api/v1/keys

- **Auth required**: Yes
- **Description**: List all keys and FOBs with serial numbers and assignment status.

### POST /api/v1/keys

- **Auth required**: Yes
- **Description**: Register a new key or FOB in the system.

### GET /api/v1/keys/:id

- **Auth required**: Yes
- **Description**: Get details of a specific key or FOB.

### PATCH /api/v1/keys/:id

- **Auth required**: Yes
- **Description**: Update key/FOB details or status.

### GET /api/v1/keys/checkouts

- **Auth required**: Yes
- **Description**: List key checkout records (who has which keys).

### POST /api/v1/keys/checkouts

- **Auth required**: Yes
- **Description**: Check out a key to a person.

### PATCH /api/v1/keys/checkouts/:id

- **Auth required**: Yes
- **Description**: Return a checked-out key.

---

## Parking

Parking permits, areas, violations, and limits management.

### GET /api/v1/parking

- **Auth required**: Yes
- **Description**: List parking permits with filtering.

### POST /api/v1/parking

- **Auth required**: Yes
- **Description**: Issue a new parking permit.

### PATCH /api/v1/parking

- **Auth required**: Yes
- **Description**: Update a parking permit.

### GET /api/v1/parking/areas

- **Auth required**: Yes
- **Description**: List parking areas configured for the property.

### POST /api/v1/parking/areas

- **Auth required**: Yes
- **Description**: Create a new parking area.

### GET /api/v1/parking/limits

- **Auth required**: Yes
- **Description**: Get parking limits configuration.

### POST /api/v1/parking/limits

- **Auth required**: Yes
- **Description**: Set parking limits.

### POST /api/v1/parking/violations

- **Auth required**: Yes
- **Description**: Create a parking violation record.

### PATCH /api/v1/parking/violations/:id

- **Auth required**: Yes
- **Description**: Update a parking violation (resolve, add notes).

---

## Shift Log

Staff handoff notes with pinning, read tracking, and shift handoff workflow.

### GET /api/v1/shift-log

- **Auth required**: Yes
- **Description**: List shift log entries with filtering by date and read status.

### POST /api/v1/shift-log

- **Auth required**: Yes
- **Description**: Create a new shift log entry.

### GET /api/v1/shift-log/:id

- **Auth required**: Yes
- **Description**: Get details of a specific shift log entry.

### PATCH /api/v1/shift-log/:id

- **Auth required**: Yes
- **Description**: Update a shift log entry.

### DELETE /api/v1/shift-log/:id

- **Auth required**: Yes
- **Description**: Delete a shift log entry.

### POST /api/v1/shift-log/:id/pin

- **Auth required**: Yes
- **Description**: Pin or unpin a shift log entry for visibility.

### GET /api/v1/shift-log/handoff

- **Auth required**: Yes
- **Description**: Get the current shift handoff summary.

### POST /api/v1/shift-log/mark-read

- **Auth required**: Yes
- **Description**: Mark shift log entries as read by the current user.

### GET /api/v1/shift-log/unread-count

- **Auth required**: Yes
- **Description**: Get count of unread shift log entries for the current user.

---

## Vendor Management

Vendor directory with insurance compliance tracking and document management.

### GET /api/v1/vendors

- **Auth required**: Yes
- **Description**: List vendors with filtering by compliance status.

### POST /api/v1/vendors

- **Auth required**: Yes
- **Description**: Add a new vendor to the directory.

### GET /api/v1/vendors/:id

- **Auth required**: Yes
- **Description**: Get details of a specific vendor including compliance status.

### PATCH /api/v1/vendors/:id

- **Auth required**: Yes
- **Description**: Update vendor details.

### GET /api/v1/vendors/:id/documents

- **Auth required**: Yes
- **Description**: List documents (insurance certificates, licenses) for a vendor.

### POST /api/v1/vendors/:id/documents

- **Auth required**: Yes
- **Description**: Upload a document for a vendor.

---

## Training & LMS

Staff training with courses, modules, quizzes, and pass/fail tracking.

### GET /api/v1/training

- **Auth required**: Yes
- **Description**: List training courses available for the property.

### POST /api/v1/training

- **Auth required**: Yes
- **Description**: Create a new training course.

### GET /api/v1/training/:id

- **Auth required**: Yes
- **Description**: Get details of a specific training course including modules and progress.

### POST /api/v1/training/:id/enroll

- **Auth required**: Yes
- **Description**: Enroll a staff member in a training course.

### POST /api/v1/training/:id/quiz

- **Auth required**: Yes
- **Description**: Submit quiz answers for a training course.

### POST /api/v1/training/:id/modules/:moduleId/complete

- **Auth required**: Yes
- **Description**: Mark a training module as completed.

### GET /api/v1/training/know-your-residents

- **Auth required**: Yes
- **Description**: Get the "Know Your Residents" gamified training quiz.

### POST /api/v1/training/know-your-residents

- **Auth required**: Yes
- **Description**: Submit answers for the "Know Your Residents" quiz.

### GET /api/v1/training/know-your-residents/leaderboard

- **Auth required**: Yes
- **Description**: Get the leaderboard for "Know Your Residents" quiz scores.

---

## Community

Community events and posts with moderation and expiry.

### GET /api/v1/community

- **Auth required**: Yes
- **Description**: List community posts.

### POST /api/v1/community

- **Auth required**: Yes
- **Description**: Create a new community post.

### GET /api/v1/community/:id

- **Auth required**: Yes
- **Description**: Get details of a specific community post.

### PATCH /api/v1/community/:id

- **Auth required**: Yes
- **Description**: Update a community post.

### DELETE /api/v1/community/:id

- **Auth required**: Yes
- **Description**: Delete a community post.

### POST /api/v1/community/:id/flag

- **Auth required**: Yes
- **Description**: Flag a community post for moderation.

### GET /api/v1/community/events

- **Auth required**: Yes
- **Description**: List community events.

### POST /api/v1/community/events

- **Auth required**: Yes
- **Description**: Create a new community event.

### POST /api/v1/community/expire

- **Auth required**: Yes
- **Description**: Expire old community posts (scheduled cleanup).

---

## Classified Ads

Resident marketplace for community engagement.

### GET /api/v1/classifieds

- **Auth required**: Yes
- **Description**: List classified ads.

### POST /api/v1/classifieds

- **Auth required**: Yes
- **Description**: Post a new classified ad.

### GET /api/v1/classifieds/:id

- **Auth required**: Yes
- **Description**: Get details of a specific classified ad.

### PATCH /api/v1/classifieds/:id

- **Auth required**: Yes
- **Description**: Update a classified ad.

### DELETE /api/v1/classifieds/:id

- **Auth required**: Yes
- **Description**: Delete a classified ad.

---

## Idea Board

Crowdsourced feature requests and suggestions from residents with voting.

### GET /api/v1/ideas

- **Auth required**: Yes
- **Description**: List ideas with vote counts and status.

### POST /api/v1/ideas

- **Auth required**: Yes
- **Description**: Submit a new idea.

### GET /api/v1/ideas/:id

- **Auth required**: Yes
- **Description**: Get details of a specific idea.

### PATCH /api/v1/ideas/:id

- **Auth required**: Yes
- **Description**: Update an idea (status, response from management).

### POST /api/v1/ideas/:id/vote

- **Auth required**: Yes
- **Description**: Upvote an idea.

### DELETE /api/v1/ideas/:id/vote

- **Auth required**: Yes
- **Description**: Remove vote from an idea.

### GET /api/v1/ideas/:id/comments

- **Auth required**: Yes
- **Description**: List comments on an idea.

### POST /api/v1/ideas/:id/comments

- **Auth required**: Yes
- **Description**: Add a comment to an idea.

---

## Discussion Forum

Threaded resident discussions.

### GET /api/v1/forum

- **Auth required**: Yes
- **Description**: List forum threads.

### POST /api/v1/forum

- **Auth required**: Yes
- **Description**: Create a new forum thread.

### GET /api/v1/forum/:id

- **Auth required**: Yes
- **Description**: Get a specific forum thread with preview of replies.

### PATCH /api/v1/forum/:id

- **Auth required**: Yes
- **Description**: Update a forum thread.

### DELETE /api/v1/forum/:id

- **Auth required**: Yes
- **Description**: Delete a forum thread.

### GET /api/v1/forum/:id/replies

- **Auth required**: Yes
- **Description**: List replies in a forum thread.

### POST /api/v1/forum/:id/replies

- **Auth required**: Yes
- **Description**: Post a reply to a forum thread.

---

## Emergency Broadcast

Push + SMS + voice call cascade for building emergencies.

### GET /api/v1/emergency/broadcast

- **Auth required**: Yes
- **Description**: List emergency broadcasts.

### POST /api/v1/emergency/broadcast

- **Auth required**: Yes
- **Description**: Initiate a new emergency broadcast across all channels.

### GET /api/v1/emergency/broadcast/:id

- **Auth required**: Yes
- **Description**: Get details and status of a specific emergency broadcast.

### PATCH /api/v1/emergency/broadcast/:id

- **Auth required**: Yes
- **Description**: Update an emergency broadcast.

### POST /api/v1/emergency/broadcast/:id

- **Auth required**: Yes
- **Description**: Trigger additional actions on a broadcast.

### POST /api/v1/emergency/broadcast/:id/acknowledge

- **Auth required**: Yes
- **Description**: Acknowledge receipt of an emergency broadcast.

### POST /api/v1/emergency/broadcast/:id/all-clear

- **Auth required**: Yes
- **Description**: Send all-clear signal for an emergency broadcast.

### POST /api/v1/emergency/broadcast/:id/cancel

- **Auth required**: Yes
- **Description**: Cancel an active emergency broadcast.

---

## Equipment

Equipment lifecycle management with categories, history, and replacement tracking.

### GET /api/v1/equipment

- **Auth required**: Yes
- **Description**: List equipment with filtering by category and status.

### POST /api/v1/equipment

- **Auth required**: Yes
- **Description**: Register new equipment.

### GET /api/v1/equipment/:id

- **Auth required**: Yes
- **Description**: Get details of a specific piece of equipment.

### PATCH /api/v1/equipment/:id

- **Auth required**: Yes
- **Description**: Update equipment details or status.

### GET /api/v1/equipment/:id/history

- **Auth required**: Yes
- **Description**: Get maintenance and service history for a piece of equipment.

---

## Inspections

Mobile-first inspection system with checklists, templates, and item tracking.

### GET /api/v1/inspections

- **Auth required**: Yes
- **Description**: List inspections with filtering by status and type.

### POST /api/v1/inspections

- **Auth required**: Yes
- **Description**: Create a new inspection from a template.

### GET /api/v1/inspections/:id

- **Auth required**: Yes
- **Description**: Get details of a specific inspection including items and results.

### PATCH /api/v1/inspections/:id

- **Auth required**: Yes
- **Description**: Update an inspection (complete, add notes).

### GET /api/v1/inspections/:id/items

- **Auth required**: Yes
- **Description**: List checklist items for an inspection.

### POST /api/v1/inspections/:id/items

- **Auth required**: Yes
- **Description**: Add or update checklist items for an inspection.

### GET /api/v1/inspections/templates

- **Auth required**: Yes
- **Description**: List inspection templates.

### POST /api/v1/inspections/templates

- **Auth required**: Yes
- **Description**: Create a new inspection template.

---

## Recurring Tasks

Preventive maintenance scheduler with forecasting.

### GET /api/v1/recurring-tasks

- **Auth required**: Yes
- **Description**: List recurring tasks and schedules.

### POST /api/v1/recurring-tasks

- **Auth required**: Yes
- **Description**: Create a new recurring task schedule.

### GET /api/v1/recurring-tasks/:id

- **Auth required**: Yes
- **Description**: Get details of a specific recurring task.

### PATCH /api/v1/recurring-tasks/:id

- **Auth required**: Yes
- **Description**: Update a recurring task schedule.

### POST /api/v1/recurring-tasks/:id

- **Auth required**: Yes
- **Description**: Trigger or manage a recurring task instance.

### DELETE /api/v1/recurring-tasks/:id

- **Auth required**: Yes
- **Description**: Delete a recurring task schedule.

### GET /api/v1/recurring-tasks/upcoming

- **Auth required**: Yes
- **Description**: List upcoming recurring task instances with forecasting.

---

## Alteration Projects

Renovation tracking with permit and insurance compliance.

### GET /api/v1/alterations

- **Auth required**: Yes
- **Description**: List alteration projects with momentum indicators (OK/Slow/Stalled/Stopped).

### POST /api/v1/alterations

- **Auth required**: Yes
- **Description**: Create a new alteration project.

### GET /api/v1/alterations/:id

- **Auth required**: Yes
- **Description**: Get details of a specific alteration project.

### PATCH /api/v1/alterations/:id

- **Auth required**: Yes
- **Description**: Update an alteration project status or details.

### GET /api/v1/alterations/:id/documents

- **Auth required**: Yes
- **Description**: List documents (permits, insurance, contracts) for an alteration project.

### POST /api/v1/alterations/:id/documents

- **Auth required**: Yes
- **Description**: Upload a document for an alteration project.

---

## Notifications

Multi-channel notification system (email, SMS, push) with templates and per-resident preferences.

### GET /api/v1/notifications/preferences

- **Auth required**: Yes
- **Description**: Get notification preferences for the current user (organized by module).

### PUT /api/v1/notifications/preferences

- **Auth required**: Yes
- **Description**: Update notification preferences for the current user.

### GET /api/v1/notifications/templates

- **Auth required**: Yes
- **Description**: List notification templates.

### POST /api/v1/notifications/templates

- **Auth required**: Yes
- **Description**: Create or update a notification template.

---

## Billing & Subscription

Stripe integration with subscription tiers, invoicing, and dunning.

### GET /api/v1/billing

- **Auth required**: Yes
- **Description**: Get current billing information and subscription status.

### POST /api/v1/billing

- **Auth required**: Yes
- **Description**: Create or update billing configuration.

### PATCH /api/v1/billing

- **Auth required**: Yes
- **Description**: Update billing details.

### POST /api/v1/billing/checkout

- **Auth required**: Yes
- **Description**: Create a Stripe checkout session for subscription or upgrade.

### GET /api/v1/billing/invoices

- **Auth required**: Yes
- **Description**: List billing invoices.

### POST /api/v1/billing/webhook

- **Auth required**: No
- **Description**: Stripe webhook endpoint for payment events (signature-verified, no auth token).

---

## Onboarding

8-step guided property setup wizard.

### GET /api/v1/onboarding

- **Auth required**: Yes
- **Description**: Get current onboarding progress and step status.

### POST /api/v1/onboarding

- **Auth required**: Yes
- **Description**: Start or advance the onboarding wizard.

### PATCH /api/v1/onboarding

- **Auth required**: Yes
- **Description**: Update onboarding step data.

---

## Property Management

Multi-property management with settings, staff assignment, and dashboard.

### GET /api/v1/properties

- **Auth required**: Yes
- **Description**: List properties accessible to the current user.

### POST /api/v1/properties

- **Auth required**: Yes
- **Description**: Create a new property.

### GET /api/v1/properties/:id

- **Auth required**: Yes
- **Description**: Get details of a specific property.

### PATCH /api/v1/properties/:id

- **Auth required**: Yes
- **Description**: Update property details.

### GET /api/v1/properties/:id/settings

- **Auth required**: Yes
- **Description**: Get property-level settings.

### PATCH /api/v1/properties/:id/settings

- **Auth required**: Yes
- **Description**: Update property-level settings.

### GET /api/v1/properties/:id/staff

- **Auth required**: Yes
- **Description**: List staff assigned to a property.

### POST /api/v1/properties/:id/staff

- **Auth required**: Yes
- **Description**: Assign staff to a property.

### POST /api/v1/properties/:id/switch

- **Auth required**: Yes
- **Description**: Switch the active property context for the current user.

### POST /api/v1/properties/:id/deactivate

- **Auth required**: Yes
- **Description**: Deactivate a property.

### POST /api/v1/properties/:id/reactivate

- **Auth required**: Yes
- **Description**: Reactivate a previously deactivated property.

### GET /api/v1/properties/dashboard

- **Auth required**: Yes
- **Description**: Get multi-property dashboard overview.

### GET /api/v1/properties/billing

- **Auth required**: Yes
- **Description**: Get billing summary across properties.

### GET /api/v1/properties/compare

- **Auth required**: Yes
- **Description**: Compare metrics across multiple properties.

### GET /api/v1/properties/search

- **Auth required**: Yes
- **Description**: Search properties by name, address, or other attributes.

### GET /api/v1/properties/staff-properties

- **Auth required**: Yes
- **Description**: List properties where the current user is assigned as staff.

---

## Board Governance

Board member portal with meetings, resolutions, financials, and document management.

### GET /api/v1/governance

- **Auth required**: Yes
- **Description**: Get governance overview and summary.

### POST /api/v1/governance

- **Auth required**: Yes
- **Description**: Create a governance item.

### GET /api/v1/governance/:id

- **Auth required**: Yes
- **Description**: Get details of a specific governance item.

### PATCH /api/v1/governance/:id

- **Auth required**: Yes
- **Description**: Update a governance item.

### GET /api/v1/governance/meetings

- **Auth required**: Yes
- **Description**: List board meetings.

### POST /api/v1/governance/meetings

- **Auth required**: Yes
- **Description**: Schedule a new board meeting.

### POST /api/v1/governance/meetings/minutes

- **Auth required**: Yes
- **Description**: Upload or create meeting minutes.

### GET /api/v1/governance/meetings/votes

- **Auth required**: Yes
- **Description**: List votes from board meetings.

### POST /api/v1/governance/meetings/votes

- **Auth required**: Yes
- **Description**: Record a vote in a board meeting.

### GET /api/v1/governance/resolutions

- **Auth required**: Yes
- **Description**: List board resolutions.

### POST /api/v1/governance/resolutions

- **Auth required**: Yes
- **Description**: Create a new board resolution.

### GET /api/v1/governance/documents

- **Auth required**: Yes
- **Description**: List governance documents (bylaws, policies, etc.).

### POST /api/v1/governance/documents

- **Auth required**: Yes
- **Description**: Upload a governance document.

### GET /api/v1/governance/financials

- **Auth required**: Yes
- **Description**: Get financial reports for the board.

### GET /api/v1/governance/members

- **Auth required**: Yes
- **Description**: List board members.

### POST /api/v1/governance/members

- **Auth required**: Yes
- **Description**: Add a board member.

---

## Document Library

File library with categories for building documents, forms, and policies.

### GET /api/v1/library

- **Auth required**: Yes
- **Description**: List library documents with category filtering.

### POST /api/v1/library

- **Auth required**: Yes
- **Description**: Upload a new document to the library.

### GET /api/v1/library/:id

- **Auth required**: Yes
- **Description**: Get details of a specific library document.

### PATCH /api/v1/library/:id

- **Auth required**: Yes
- **Description**: Update a library document's metadata.

### DELETE /api/v1/library/:id

- **Auth required**: Yes
- **Description**: Delete a library document.

---

## Surveys

Survey builder and response collection.

### GET /api/v1/surveys

- **Auth required**: Yes
- **Description**: List surveys.

### POST /api/v1/surveys

- **Auth required**: Yes
- **Description**: Create a new survey.

### GET /api/v1/surveys/:id

- **Auth required**: Yes
- **Description**: Get a specific survey with questions and response summary.

### PATCH /api/v1/surveys/:id

- **Auth required**: Yes
- **Description**: Update a survey.

### POST /api/v1/surveys/:id

- **Auth required**: Yes
- **Description**: Submit a survey response.

---

## Reports & Analytics

Exportable reports with Excel/PDF generation across all modules.

### GET /api/v1/reports

- **Auth required**: Yes
- **Description**: Generate and retrieve reports with date filtering and module selection.

### GET /api/v1/export

- **Auth required**: Yes
- **Description**: Export data in CSV, Excel, or PDF format.

---

## Search

Global search across all modules.

### GET /api/v1/search

- **Auth required**: Yes
- **Description**: Global search across events, packages, residents, units, maintenance, and more.

### DELETE /api/v1/search

- **Auth required**: Yes
- **Description**: Clear search history or cached search results.

---

## File Upload

### POST /api/v1/upload

- **Auth required**: Yes
- **Description**: Upload files (photos, documents) with S3 storage. Supports JPG, PNG, GIF, HEIC, PDF, DOC, XLSX (4MB limit).

---

## Feature Flags

Per-property feature flag system for progressive rollout.

### GET /api/v1/feature-flags

- **Auth required**: Yes
- **Description**: List feature flags and their status for the current property.

### PATCH /api/v1/feature-flags

- **Auth required**: Yes
- **Description**: Update feature flag status.

---

## Settings

Property-level settings configuration.

### GET /api/v1/settings

- **Auth required**: Yes
- **Description**: Get property settings across all categories.

### PATCH /api/v1/settings

- **Auth required**: Yes
- **Description**: Update property settings.

---

## Custom Fields

JSONB-based custom field definitions per property.

### GET /api/v1/custom-fields

- **Auth required**: Yes
- **Description**: List custom field definitions for the property.

### POST /api/v1/custom-fields

- **Auth required**: Yes
- **Description**: Create a new custom field definition.

### GET /api/v1/custom-fields/:id

- **Auth required**: Yes
- **Description**: Get details of a specific custom field.

### PATCH /api/v1/custom-fields/:id

- **Auth required**: Yes
- **Description**: Update a custom field definition.

### DELETE /api/v1/custom-fields/:id

- **Auth required**: Yes
- **Description**: Delete a custom field definition.

---

## Compliance

Compliance monitoring, reports, and audit automation across 8 frameworks.

### GET /api/v1/compliance

- **Auth required**: Yes
- **Description**: List compliance items and status.

### POST /api/v1/compliance

- **Auth required**: Yes
- **Description**: Create a new compliance item.

### GET /api/v1/compliance/:id

- **Auth required**: Yes
- **Description**: Get details of a specific compliance item.

### PATCH /api/v1/compliance/:id

- **Auth required**: Yes
- **Description**: Update a compliance item.

### POST /api/v1/compliance/:id

- **Auth required**: Yes
- **Description**: Trigger compliance actions (audit, review).

### GET /api/v1/compliance/dashboard

- **Auth required**: Yes
- **Description**: Get compliance dashboard with status across all frameworks.

### GET /api/v1/compliance/reports

- **Auth required**: Yes
- **Description**: List compliance reports.

### POST /api/v1/compliance/reports

- **Auth required**: Yes
- **Description**: Generate a new compliance report.

### GET /api/v1/compliance/reports/:id

- **Auth required**: Yes
- **Description**: Get a specific compliance report.

---

## Privacy & Compliance

DSAR and privacy management.

### GET /api/v1/privacy

- **Auth required**: Yes
- **Description**: Get privacy settings and data subject access request status.

### POST /api/v1/privacy

- **Auth required**: Yes
- **Description**: Submit a data subject access request (DSAR) or update privacy settings.

---

## Help Center

In-app contextual help, knowledge base, and support tickets.

### GET /api/v1/help/articles

- **Auth required**: Yes
- **Description**: List help articles in the knowledge base.

### POST /api/v1/help/articles

- **Auth required**: Yes
- **Description**: Create a new help article.

### GET /api/v1/help/articles/:id

- **Auth required**: Yes
- **Description**: Get a specific help article.

### PATCH /api/v1/help/articles/:id

- **Auth required**: Yes
- **Description**: Update a help article.

### GET /api/v1/help/contextual

- **Auth required**: Yes
- **Description**: Get contextual help for the current page or feature.

### GET /api/v1/help/tickets

- **Auth required**: Yes
- **Description**: List support tickets.

### POST /api/v1/help/tickets

- **Auth required**: Yes
- **Description**: Create a new support ticket.

### GET /api/v1/help/tickets/:id

- **Auth required**: Yes
- **Description**: Get details of a specific support ticket.

### PATCH /api/v1/help/tickets/:id

- **Auth required**: Yes
- **Description**: Update a support ticket (status, assignment, response).

### GET /api/v1/help/tickets/:id/comments

- **Auth required**: Yes
- **Description**: List comments on a support ticket.

### POST /api/v1/help/tickets/:id/comments

- **Auth required**: Yes
- **Description**: Add a comment to a support ticket.

---

## Developer Portal & API

REST API management with API keys, webhooks, and delivery tracking.

### GET /api/v1/developer/api-keys

- **Auth required**: Yes
- **Description**: List API keys for the property.

### POST /api/v1/developer/api-keys

- **Auth required**: Yes
- **Description**: Generate a new API key.

### DELETE /api/v1/developer/api-keys/:id

- **Auth required**: Yes
- **Description**: Revoke an API key.

### GET /api/v1/developer/keys

- **Auth required**: Yes
- **Description**: List developer keys (alternate endpoint).

### POST /api/v1/developer/keys

- **Auth required**: Yes
- **Description**: Create a developer key.

### DELETE /api/v1/developer/keys

- **Auth required**: Yes
- **Description**: Delete developer keys.

### GET /api/v1/developer/webhooks

- **Auth required**: Yes
- **Description**: List configured webhooks.

### POST /api/v1/developer/webhooks

- **Auth required**: Yes
- **Description**: Create a new webhook subscription.

### PATCH /api/v1/developer/webhooks

- **Auth required**: Yes
- **Description**: Update webhook configuration.

### DELETE /api/v1/developer/webhooks

- **Auth required**: Yes
- **Description**: Delete a webhook subscription.

### GET /api/v1/developer/webhooks/:id

- **Auth required**: Yes
- **Description**: Get details of a specific webhook.

### PATCH /api/v1/developer/webhooks/:id

- **Auth required**: Yes
- **Description**: Update a specific webhook.

### DELETE /api/v1/developer/webhooks/:id

- **Auth required**: Yes
- **Description**: Delete a specific webhook.

### GET /api/v1/developer/webhooks/:id/deliveries

- **Auth required**: Yes
- **Description**: List delivery attempts for a webhook (for debugging).

---

## Data Migration

Import/export, CSV mapping, DSAR compliance, and competitor migration.

### GET /api/v1/data-migration

- **Auth required**: Yes
- **Description**: Get data migration status and history.

### POST /api/v1/data-migration

- **Auth required**: Yes
- **Description**: Start a new data migration job.

### POST /api/v1/data-migration/export

- **Auth required**: Yes
- **Description**: Export property data for migration or backup.

### POST /api/v1/data-migration/import

- **Auth required**: Yes
- **Description**: Import data from CSV or competitor export.

### GET /api/v1/data-migration/import/:id/status

- **Auth required**: Yes
- **Description**: Check status of a running import job.

---

## Demo Environment

Sales demo with mock data and training sandbox.

### GET /api/v1/demo

- **Auth required**: Yes
- **Description**: List demo environments.

### POST /api/v1/demo

- **Auth required**: Yes
- **Description**: Create a new demo environment with mock data.

### GET /api/v1/demo/:id

- **Auth required**: Yes
- **Description**: Get details of a specific demo environment.

### DELETE /api/v1/demo/:id

- **Auth required**: Yes
- **Description**: Delete a demo environment.

### POST /api/v1/demo/:id/reset

- **Auth required**: Yes
- **Description**: Reset a demo environment to its initial state.

### GET /api/v1/demo/templates

- **Auth required**: Yes
- **Description**: List available demo templates.

---

## AI & Analytics

AI-powered briefing, suggestions, and analytics.

### GET /api/v1/ai/analytics

- **Auth required**: Yes
- **Description**: Get AI-generated analytics and insights.

### GET /api/v1/ai/briefing

- **Auth required**: Yes
- **Description**: Get the AI-generated daily briefing for the current shift.

### POST /api/v1/ai/briefing

- **Auth required**: Yes
- **Description**: Generate or refresh the AI briefing.

### GET /api/v1/ai/suggestions

- **Auth required**: Yes
- **Description**: Get AI-powered suggestions based on current context.

---

## Asset Management

Asset lifecycle tracking with QR codes and audit trails.

### GET /api/v1/assets

- **Auth required**: Yes
- **Description**: List assets.

### POST /api/v1/assets

- **Auth required**: Yes
- **Description**: Register a new asset.

### GET /api/v1/assets/:id

- **Auth required**: Yes
- **Description**: Get details of a specific asset.

### PATCH /api/v1/assets/:id

- **Auth required**: Yes
- **Description**: Update asset details.

### GET /api/v1/assets/:id/qr-code

- **Auth required**: Yes
- **Description**: Generate a QR code for an asset.

### GET /api/v1/assets/audit

- **Auth required**: Yes
- **Description**: List asset audit entries.

### POST /api/v1/assets/audit

- **Auth required**: Yes
- **Description**: Create an asset audit entry.

---

## Audit Log

System-wide audit trail.

### GET /api/v1/audit-log

- **Auth required**: Yes
- **Description**: List audit log entries with filtering by action, user, and date range.

---

## Building Directory

Building-wide directory with emergency contacts.

### GET /api/v1/building-directory

- **Auth required**: Yes
- **Description**: List building directory entries.

### POST /api/v1/building-directory

- **Auth required**: Yes
- **Description**: Add a directory entry.

### GET /api/v1/building-directory/:id

- **Auth required**: Yes
- **Description**: Get a specific directory entry.

### PATCH /api/v1/building-directory/:id

- **Auth required**: Yes
- **Description**: Update a directory entry.

### DELETE /api/v1/building-directory/:id

- **Auth required**: Yes
- **Description**: Delete a directory entry.

### GET /api/v1/building-directory/emergency-contacts

- **Auth required**: Yes
- **Description**: List building-level emergency contacts (fire, police, utilities).

### POST /api/v1/building-directory/emergency-contacts

- **Auth required**: Yes
- **Description**: Add a building-level emergency contact.

---

## Resident Cards

Resident passports and ID cards with QR verification.

### GET /api/v1/resident-cards

- **Auth required**: Yes
- **Description**: List resident cards.

### POST /api/v1/resident-cards

- **Auth required**: Yes
- **Description**: Issue a new resident card.

### GET /api/v1/resident-cards/:id

- **Auth required**: Yes
- **Description**: Get details of a specific resident card.

### PATCH /api/v1/resident-cards/:id

- **Auth required**: Yes
- **Description**: Update a resident card.

### DELETE /api/v1/resident-cards/:id

- **Auth required**: Yes
- **Description**: Revoke a resident card.

### POST /api/v1/resident-cards/:id/verify

- **Auth required**: Yes
- **Description**: Verify a resident card by scanning QR code.

---

## Photo Albums

Building photo albums.

### GET /api/v1/photo-albums

- **Auth required**: Yes
- **Description**: List photo albums.

### POST /api/v1/photo-albums

- **Auth required**: Yes
- **Description**: Create a new photo album.

### PATCH /api/v1/photo-albums

- **Auth required**: Yes
- **Description**: Update photo album list or ordering.

### DELETE /api/v1/photo-albums

- **Auth required**: Yes
- **Description**: Delete photo albums.

### GET /api/v1/photo-albums/:id

- **Auth required**: Yes
- **Description**: Get a specific photo album with photos.

### POST /api/v1/photo-albums/:id

- **Auth required**: Yes
- **Description**: Add photos to an album.

### PATCH /api/v1/photo-albums/:id

- **Auth required**: Yes
- **Description**: Update a photo album.

### DELETE /api/v1/photo-albums/:id

- **Auth required**: Yes
- **Description**: Delete a photo album.

---

## Digital Signage

Public display and lobby screen content management.

### GET /api/v1/digital-signage

- **Auth required**: Yes
- **Description**: List digital signage displays and content.

### POST /api/v1/digital-signage

- **Auth required**: Yes
- **Description**: Create digital signage content.

### PATCH /api/v1/digital-signage

- **Auth required**: Yes
- **Description**: Update signage configuration.

### GET /api/v1/digital-signage/:id

- **Auth required**: Yes
- **Description**: Get a specific signage display.

### PATCH /api/v1/digital-signage/:id

- **Auth required**: Yes
- **Description**: Update a specific signage display.

### DELETE /api/v1/digital-signage/:id

- **Auth required**: Yes
- **Description**: Delete a signage display.

---

## Purchase Orders

Purchase order management for building supplies and services.

### GET /api/v1/purchase-orders

- **Auth required**: Yes
- **Description**: List purchase orders.

### POST /api/v1/purchase-orders

- **Auth required**: Yes
- **Description**: Create a new purchase order.

### GET /api/v1/purchase-orders/:id

- **Auth required**: Yes
- **Description**: Get details of a specific purchase order.

### PATCH /api/v1/purchase-orders/:id

- **Auth required**: Yes
- **Description**: Update a purchase order.

---

## Endpoint Summary by Category

| Category                  | Endpoints | Auth Required |
| ------------------------- | --------- | ------------- |
| Authentication            | 7         | No            |
| Infrastructure            | 3         | No            |
| Dashboard                 | 1         | Yes           |
| Events & Security Console | 11        | Yes           |
| Packages                  | 11        | Yes           |
| Maintenance               | 9         | Yes           |
| Amenity Booking           | 10        | Yes           |
| Announcements             | 7         | Yes           |
| Units & Buildings         | 8         | Yes           |
| Residents                 | 11        | Yes           |
| Resident Portal           | 11        | Yes           |
| User Management           | 12        | Yes           |
| Visitors & Incidents      | 8         | Yes           |
| Keys & FOB Management     | 7         | Yes           |
| Parking                   | 9         | Yes           |
| Shift Log                 | 9         | Yes           |
| Vendor Management         | 6         | Yes           |
| Training & LMS            | 9         | Yes           |
| Community                 | 9         | Yes           |
| Classified Ads            | 5         | Yes           |
| Idea Board                | 8         | Yes           |
| Discussion Forum          | 7         | Yes           |
| Emergency Broadcast       | 8         | Yes           |
| Equipment                 | 5         | Yes           |
| Inspections               | 8         | Yes           |
| Recurring Tasks           | 7         | Yes           |
| Alteration Projects       | 6         | Yes           |
| Notifications             | 4         | Yes           |
| Billing & Subscription    | 6         | Mixed         |
| Onboarding                | 3         | Yes           |
| Property Management       | 15        | Yes           |
| Board Governance          | 16        | Yes           |
| Document Library          | 5         | Yes           |
| Surveys                   | 5         | Yes           |
| Reports & Analytics       | 2         | Yes           |
| Search                    | 2         | Yes           |
| File Upload               | 1         | Yes           |
| Feature Flags             | 2         | Yes           |
| Settings                  | 2         | Yes           |
| Custom Fields             | 5         | Yes           |
| Compliance                | 9         | Yes           |
| Privacy & Compliance      | 2         | Yes           |
| Help Center               | 11        | Yes           |
| Developer Portal & API    | 14        | Yes           |
| Data Migration            | 5         | Yes           |
| Demo Environment          | 6         | Yes           |
| AI & Analytics            | 4         | Yes           |
| Asset Management          | 7         | Yes           |
| Audit Log                 | 1         | Yes           |
| Building Directory        | 7         | Yes           |
| Resident Cards            | 6         | Yes           |
| Photo Albums              | 8         | Yes           |
| Digital Signage           | 6         | Yes           |
| Purchase Orders           | 4         | Yes           |

---

_Generated from route file scanning across `src/app/api/`_
_Total route files: 185+ | Total endpoints: 350+ | Categories: 53_
_Last updated: 2026-03-19_
