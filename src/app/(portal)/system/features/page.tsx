'use client';

/**
 * Feature Intelligence — Super Admin QA Checklist Dashboard
 *
 * Interactive testing flow covering all 11 phases of the platform.
 * Tracks completion per step with localStorage persistence.
 * Each step links directly to the relevant page.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Circle,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Step {
  id: string;
  label: string;
  description?: string;
  href?: string;
}

interface Phase {
  id: string;
  title: string;
  role: string;
  roleColor: string;
  steps: Step[];
}

// ---------------------------------------------------------------------------
// Phase Data — All 11 Phases
// ---------------------------------------------------------------------------

const PHASES: Phase[] = [
  // =========================================================================
  // PHASE 1: Super Admin — Platform Setup
  // =========================================================================
  {
    id: 'phase-1',
    title: 'Phase 1: Super Admin — Platform Setup',
    role: 'Super Admin',
    roleColor: 'bg-red-100 text-red-700',
    steps: [
      { id: '1.1', label: 'Login as Super Admin', href: '/login' },
      { id: '1.2', label: 'Verify Super Admin dashboard KPIs', href: '/dashboard' },
      {
        id: '1.3',
        label: 'Create a new Property',
        description: 'Fill: Name, Address, City, Province, Postal Code, Units, Type, Timezone',
        href: '/system/properties',
      },
      {
        id: '1.4',
        label: 'Verify property appears in list with ACTIVE status',
        href: '/system/properties',
      },
      {
        id: '1.5',
        label: 'Settings → General: verify property name, address, logo',
        href: '/settings',
      },
      { id: '1.6', label: 'Settings → Modules: enable/disable modules', href: '/settings/modules' },
      {
        id: '1.7',
        label: 'Settings → Event Types: configure event types',
        href: '/settings/event-types',
      },
      {
        id: '1.8',
        label: 'Settings → Roles & Permissions: review roles matrix',
        href: '/settings/roles',
      },
      {
        id: '1.9',
        label: 'Settings → Notifications: configure channels (email, SMS, push)',
        href: '/settings/notifications',
      },
      {
        id: '1.10',
        label: 'Settings → Email Templates: verify template list',
        href: '/settings/email',
      },
      {
        id: '1.11',
        label: 'Settings → Email Configuration: set SMTP and sender addresses',
        href: '/settings/email-config',
      },
      {
        id: '1.12',
        label: 'Create a Property Admin user',
        description: 'Fill name, email, role → get temp password',
        href: '/users',
      },
      {
        id: '1.13',
        label: 'Platform Health: verify API, DB, Redis status',
        href: '/system/health',
      },
      { id: '1.14', label: 'AI Dashboard: verify health score and analytics', href: '/system/ai' },
      {
        id: '1.15',
        label: 'Billing: verify subscription status and plan tier',
        href: '/system/billing',
      },
      { id: '1.16', label: 'Demo Account: verify demo sandbox works', href: '/system/demo' },
      { id: '1.17', label: 'Reports: verify 6 report types available', href: '/reports' },
      { id: '1.18', label: 'Logs: verify activity log entries', href: '/logs' },
      { id: '1.19', label: 'Building Directory: verify management', href: '/building-directory' },
      { id: '1.20', label: 'Compliance: verify tracking dashboard', href: '/compliance' },
      {
        id: '1.21',
        label: 'System Debug: verify debug page loads with diagnostics',
        href: '/system/debug',
      },
      {
        id: '1.22',
        label: 'Data Migration: verify import/export page',
        href: '/system/data-migration',
      },
      {
        id: '1.23',
        label: 'Developer Portal: verify API keys and webhook config',
        href: '/system/developer-portal',
      },
      {
        id: '1.24',
        label: 'Import Property: verify property import wizard',
        href: '/system/import-property',
      },
      {
        id: '1.25',
        label: 'Onboarding Wizard: verify 8-step setup flow',
        href: '/onboarding',
      },
      {
        id: '1.26',
        label: 'Feature Intelligence: verify this page loads (meta-test)',
        href: '/system/features',
      },
      {
        id: '1.27',
        label: 'Users → verify user list loads with role badges',
        href: '/users',
      },
      {
        id: '1.28',
        label: 'Users → verify user detail page (click into user)',
        href: '/users',
      },
      {
        id: '1.29',
        label: 'System Properties → edit existing property details',
        href: '/system/properties',
      },
      {
        id: '1.30',
        label: 'System Properties → deactivate a property',
        href: '/system/properties',
      },
      {
        id: '1.31',
        label: 'Verify Super Admin can switch between properties',
        href: '/dashboard',
      },
      {
        id: '1.32',
        label: 'Settings → Notifications: fill From Name/Email, click Save, verify "Changes saved"',
        href: '/settings/notifications',
      },
      {
        id: '1.33',
        label:
          'Seed Demo: run POST /api/v1/system/seed-demo to populate property with realistic data',
        href: '/system/features',
      },
      {
        id: '1.34',
        label: 'Verify seed created: 10 residents, 20 packages, 10 requests, 5 incidents, 10 keys',
        href: '/settings/notifications',
      },
    ],
  },

  // =========================================================================
  // PHASE 2: Property Admin — Building Setup
  // =========================================================================
  {
    id: 'phase-2',
    title: 'Phase 2: Property Admin — Building Setup',
    role: 'Property Admin',
    roleColor: 'bg-purple-100 text-purple-700',
    steps: [
      { id: '2.1', label: 'Login as Property Admin', href: '/login' },
      { id: '2.2', label: 'Create units manually (single unit form)', href: '/units' },
      { id: '2.3', label: 'Bulk import units via CSV upload', href: '/units' },
      {
        id: '2.4',
        label: 'Auto-generate units via dialog',
        description: 'Set floor range, units per floor, prefix pattern',
        href: '/units',
      },
      { id: '2.5', label: 'Verify all generated units appear in list', href: '/units' },
      { id: '2.6', label: 'Create Property Manager user', href: '/users' },
      { id: '2.7', label: 'Create Front Desk Staff user', href: '/users' },
      { id: '2.8', label: 'Create Security Guard user', href: '/users' },
      { id: '2.9', label: 'Create Security Supervisor user', href: '/users' },
      { id: '2.10', label: 'Create Maintenance Staff user', href: '/users' },
      { id: '2.11', label: 'Create Superintendent user', href: '/users' },
      { id: '2.12', label: 'Add Resident Owner to unit', href: '/residents' },
      { id: '2.13', label: 'Add Resident Tenant to unit', href: '/residents' },
      { id: '2.14', label: 'Add Board Member to unit', href: '/residents' },
      {
        id: '2.15',
        label: 'Bulk import residents via ImportWizard',
        description: 'Upload CSV, map columns, review, confirm',
        href: '/residents',
      },
      {
        id: '2.16',
        label: 'Create amenities with capacity and fees',
        description:
          'Party Room (cap: 30, $50/hr), Gym (cap: 20, free), Pool (cap: 40, free), Guest Suite (cap: 2, $75/night)',
        href: '/amenities',
      },
      {
        id: '2.17',
        label: 'Configure amenity booking rules',
        description: 'Max duration, advance booking window, cancellation policy',
        href: '/amenities',
      },
      { id: '2.18', label: 'Create welcome announcement', href: '/announcements' },
      { id: '2.19', label: 'Add building vendors (plumber, electrician, HVAC)', href: '/vendors' },
      {
        id: '2.20',
        label: 'Upload documents to Library',
        description: 'Building rules, fire safety plan, move-in guide',
        href: '/library',
      },
      {
        id: '2.21',
        label: 'Add emergency contacts to Building Directory',
        href: '/building-directory',
      },
      {
        id: '2.22',
        label: 'Configure parking areas and permit types',
        description: 'Underground P1, Visitor Lot, EV Charging spots',
        href: '/parking',
      },
      {
        id: '2.23',
        label: 'Settings → Modules: enable/disable each module toggle',
        href: '/settings/modules',
      },
      {
        id: '2.24',
        label: 'Settings → Custom Fields: create text, number, date, dropdown fields',
        href: '/settings',
      },
      {
        id: '2.25',
        label: 'Create event types for property',
        description: 'Package, Visitor, Incident, Cleaning, Note',
        href: '/settings/event-types',
      },
      {
        id: '2.26',
        label: 'Create survey for residents',
        description: 'Satisfaction survey with multiple question types',
        href: '/surveys',
      },
      {
        id: '2.27',
        label: 'Create community event',
        description: 'BBQ, holiday party, or building meeting',
        href: '/events',
      },
      {
        id: '2.28',
        label: 'Configure security company info',
        href: '/settings',
      },
      {
        id: '2.29',
        label: 'Verify user list shows all created users with correct roles',
        href: '/users',
      },
      {
        id: '2.30',
        label: 'Test deactivating and reactivating a user account',
        href: '/users',
      },
      {
        id: '2.31',
        label: 'Verify welcome email auto-sends when creating a user (requires Resend API key)',
        href: '/users',
      },
    ],
  },

  // =========================================================================
  // PHASE 3: Property Manager — Operations
  // =========================================================================
  {
    id: 'phase-3',
    title: 'Phase 3: Property Manager — Operations',
    role: 'Property Manager',
    roleColor: 'bg-blue-100 text-blue-700',
    steps: [
      { id: '3.1', label: 'Verify dashboard: "Operations Command Center"', href: '/dashboard' },
      {
        id: '3.2',
        label: 'Verify KPIs: Open Requests, Packages, Visitors, Bookings',
        href: '/dashboard',
      },
      {
        id: '3.3',
        label: 'Verify correct sidebar items for Property Manager role',
        href: '/dashboard',
      },
      { id: '3.4', label: 'Units → verify all units appear in list', href: '/units' },
      {
        id: '3.5',
        label: 'Units → click into unit detail page',
        description: 'Verify occupants tab, events tab, packages tab, instructions tab',
        href: '/units',
      },
      { id: '3.6', label: 'Units → add per-unit front desk instruction', href: '/units' },
      { id: '3.7', label: 'Units → verify instruction appears on unit detail', href: '/units' },
      { id: '3.8', label: 'Service Requests → verify empty state message', href: '/maintenance' },
      {
        id: '3.9',
        label: 'Service Requests → create maintenance request',
        description: 'Category: Plumbing, Priority: High, Unit: 1208',
        href: '/maintenance',
      },
      { id: '3.10', label: 'Service Requests → assign to maintenance staff', href: '/maintenance' },
      {
        id: '3.11',
        label: 'Service Requests → click into request detail page',
        description: 'Verify description, status, assignee, comments section',
        href: '/maintenance',
      },
      {
        id: '3.12',
        label: 'Service Requests → add comment on detail page',
        href: '/maintenance',
      },
      {
        id: '3.13',
        label: 'Service Requests → change status from detail page',
        href: '/maintenance',
      },
      {
        id: '3.14',
        label: 'Service Requests → test Open filter tab',
        href: '/maintenance',
      },
      {
        id: '3.15',
        label: 'Service Requests → test Assigned filter tab',
        href: '/maintenance',
      },
      {
        id: '3.16',
        label: 'Service Requests → test In Progress filter tab',
        href: '/maintenance',
      },
      {
        id: '3.17',
        label: 'Service Requests → test On Hold filter tab',
        href: '/maintenance',
      },
      {
        id: '3.18',
        label: 'Service Requests → test Resolved filter tab',
        href: '/maintenance',
      },
      {
        id: '3.19',
        label: 'Announcements → create draft announcement',
        description: '"Building Notice: Fire Drill Tomorrow"',
        href: '/announcements',
      },
      {
        id: '3.20',
        label: 'Announcements → schedule announcement for future date',
        href: '/announcements',
      },
      {
        id: '3.21',
        label: 'Announcements → publish announcement immediately',
        href: '/announcements',
      },
      {
        id: '3.22',
        label: 'Announcements → verify delivery channels (Email + Push)',
        href: '/announcements',
      },
      {
        id: '3.22b',
        label:
          'Announcements → verify email sent to all residents on publish (requires Resend API key)',
        href: '/announcements',
      },
      {
        id: '3.23',
        label: 'Vendors → verify vendor list with contact info',
        href: '/vendors',
      },
      {
        id: '3.24',
        label: 'Vendors → click into vendor detail page',
        description: 'Verify contact info, documents, compliance status',
        href: '/vendors',
      },
      {
        id: '3.25',
        label: 'Equipment → add building equipment',
        description: 'Elevator, HVAC unit, fire pump — with lifecycle tracking fields',
        href: '/equipment',
      },
      {
        id: '3.26',
        label: 'Equipment → set lifecycle dates (install, warranty, replacement)',
        href: '/equipment',
      },
      { id: '3.27', label: 'Inspections → create inspection with checklist', href: '/inspections' },
      {
        id: '3.28',
        label: 'Recurring Tasks → create weekly task with schedule',
        description: 'E.g., "Lobby floor cleaning" every Monday at 8am',
        href: '/recurring-tasks',
      },
      {
        id: '3.29',
        label: 'Alterations → create alteration request with document upload',
        description: 'Unit renovation with permit and insurance docs',
        href: '/alterations',
      },
      { id: '3.30', label: 'Reports → generate Package Activity Report (CSV)', href: '/reports' },
      { id: '3.31', label: 'Reports → generate Maintenance Summary (Excel)', href: '/reports' },
      { id: '3.32', label: 'Reports → generate Shift Log Summary (PDF)', href: '/reports' },
      { id: '3.33', label: 'Reports → generate Visitor Log Report', href: '/reports' },
      { id: '3.34', label: 'Reports → generate Amenity Booking Report', href: '/reports' },
      { id: '3.35', label: 'Reports → generate Security Incident Report', href: '/reports' },
      {
        id: '3.36',
        label: 'Reports → export each report and verify file downloads',
        href: '/reports',
      },
      {
        id: '3.37',
        label: 'Parking → verify parking areas list',
        href: '/parking',
      },
      {
        id: '3.38',
        label: 'Parking → issue parking permit to resident',
        href: '/parking',
      },
      {
        id: '3.39',
        label: 'Parking → review parking violations list',
        href: '/parking',
      },
      {
        id: '3.40',
        label: 'Visitors → verify visitor log with filters',
        href: '/visitors',
      },
      {
        id: '3.41',
        label: 'Keys → view all keys/FOBs inventory',
        href: '/keys',
      },
      {
        id: '3.42',
        label: 'Events → create community event with RSVP',
        href: '/events',
      },
      {
        id: '3.43',
        label: 'Surveys → create and publish survey',
        href: '/surveys',
      },
      {
        id: '3.44',
        label: 'Surveys → view survey responses summary',
        href: '/surveys',
      },
      {
        id: '3.45',
        label: 'Library → upload and categorize document',
        href: '/library',
      },
      {
        id: '3.46',
        label: 'Residents → view all residents with unit assignments',
        href: '/residents',
      },
      {
        id: '3.47',
        label: 'Residents → click into resident detail page',
        href: '/residents',
      },
      {
        id: '3.48',
        label: 'Maintenance → verify SLA Tracking widget on detail page',
        href: '/maintenance',
      },
      {
        id: '3.49',
        label: 'Maintenance → edit description via Edit button and Save Changes',
        href: '/maintenance',
      },
      {
        id: '3.50',
        label: 'Security Console → log Fire Event via Fire Log quick action',
        href: '/security',
      },
      {
        id: '3.51',
        label: 'Security Console → log Noise Complaint via quick action',
        href: '/security',
      },
      {
        id: '3.52',
        label: 'Global Search → verify Cmd+K finds maintenance requests',
        href: '/dashboard',
      },
      { id: '3.53', label: 'Global Search → verify Cmd+K finds users by name', href: '/dashboard' },
      {
        id: '3.54',
        label: 'AI Daily Briefing → verify shows real data (open requests, packages)',
        href: '/dashboard',
      },
      {
        id: '3.55',
        label: 'Dashboard → verify greeting shows real user name from DB',
        href: '/dashboard',
      },
      {
        id: '3.56',
        label: 'Keys & FOBs → create key, checkout to resident, return key',
        href: '/keys',
      },
      {
        id: '3.57',
        label: 'Parking → issue permit with vehicle details (auto-create vehicle)',
        href: '/parking',
      },
      {
        id: '3.58',
        label:
          'Amenities → verify 5 amenity cards render (Party Room, Fitness, Guest Suite, Meeting, BBQ)',
        href: '/amenities',
      },
      {
        id: '3.59',
        label: 'Amenities → click into Party Room detail, verify fee, description, Quick Info',
        href: '/amenities',
      },
      {
        id: '3.60',
        label: 'Amenities → create booking via New Booking dialog (date, time, unit, guests)',
        href: '/amenities',
      },
      {
        id: '3.61',
        label: 'Amenities → verify booking shows as CONFIRMED in Upcoming Bookings',
        href: '/amenities',
      },
      {
        id: '3.62',
        label: 'Dashboard → verify Bookings KPI increments after booking creation',
        href: '/dashboard',
      },
      {
        id: '3.63',
        label: 'Dashboard → verify AI briefing mentions booking pending review',
        href: '/dashboard',
      },
      {
        id: '3.64',
        label:
          'Service Requests → assign staff via dropdown (verify list populates with real users)',
        href: '/maintenance',
      },
      {
        id: '3.65',
        label:
          'Service Requests → assign vendor via dropdown (verify list populates with real vendors)',
        href: '/maintenance',
      },
      {
        id: '3.66',
        label:
          'Service Requests → change assignment and verify PATCH saves (Currently Assigned updates)',
        href: '/maintenance',
      },
      {
        id: '3.67',
        label: 'Reports → generate Package Activity report and download CSV',
        href: '/reports',
      },
      {
        id: '3.68',
        label: 'Reports → generate Maintenance Summary report and download CSV',
        href: '/reports',
      },
      {
        id: '3.69',
        label: 'Reports → generate Visitor Log report and verify data',
        href: '/reports',
      },
      {
        id: '3.70',
        label: 'Equipment → click Export button and verify CSV downloads',
        href: '/equipment',
      },
    ],
  },

  // =========================================================================
  // PHASE 4: Front Desk — Daily Operations
  // =========================================================================
  {
    id: 'phase-4',
    title: 'Phase 4: Front Desk — Daily Operations',
    role: 'Front Desk / Concierge',
    roleColor: 'bg-teal-100 text-teal-700',
    steps: [
      { id: '4.1', label: 'Verify dashboard: "Front Desk Hub"', href: '/dashboard' },
      {
        id: '4.2',
        label: 'Verify sidebar: Security Console, Packages, Visitors, Keys, Shift Log',
        href: '/dashboard',
      },
      {
        id: '4.3',
        label: 'Packages → log new package',
        description: 'Unit 1208, Amazon, Mailroom Shelf B',
        href: '/packages',
      },
      {
        id: '4.4',
        label: 'Packages → verify package in list with reference number',
        href: '/packages',
      },
      {
        id: '4.5',
        label: 'Packages → click into package detail page',
        description: 'Verify unit, courier, storage location, status, timestamps',
        href: '/packages',
      },
      {
        id: '4.6',
        label: 'Packages → log perishable package',
        description: 'Unit 502, FedEx, Staff Fridge',
        href: '/packages',
      },
      { id: '4.7', label: 'Packages → release single package to resident', href: '/packages' },
      { id: '4.8', label: 'Packages → verify KPI "Unreleased" decrements', href: '/packages' },
      { id: '4.9', label: 'Packages → batch intake 3 packages at once', href: '/packages' },
      {
        id: '4.10',
        label: 'Packages → batch release multiple packages',
        href: '/packages',
      },
      {
        id: '4.11',
        label: 'Packages → test filter: All Packages tab',
        href: '/packages',
      },
      {
        id: '4.12',
        label: 'Packages → test filter: Incoming tab',
        href: '/packages',
      },
      {
        id: '4.13',
        label: 'Packages → test filter: Outgoing tab',
        href: '/packages',
      },
      {
        id: '4.14',
        label: 'Packages → test filter by status (Received, Released, Returned)',
        href: '/packages',
      },
      {
        id: '4.15',
        label: 'Packages → test filter by courier (Amazon, FedEx, UPS, Canada Post)',
        href: '/packages',
      },
      {
        id: '4.16',
        label: 'Visitors → check in visitor',
        description: 'Visitor for Unit 1208, Personal, 2 hours',
        href: '/visitors',
      },
      { id: '4.17', label: 'Visitors → verify in active visitors list', href: '/visitors' },
      { id: '4.18', label: 'Visitors → check out visitor', href: '/visitors' },
      { id: '4.19', label: 'Shift Log → create new entry', href: '/shift-log' },
      { id: '4.20', label: 'Shift Log → pin important entry', href: '/shift-log' },
      { id: '4.21', label: 'Shift Log → unpin entry', href: '/shift-log' },
      { id: '4.22', label: 'Shift Log → mark entry as read', href: '/shift-log' },
      { id: '4.23', label: 'Shift Log → create handoff entry for next shift', href: '/shift-log' },
      {
        id: '4.24',
        label: 'Announcements → verify read-only view (cannot create)',
        href: '/announcements',
      },
      {
        id: '4.25',
        label: 'Security Console → verify Visitors tab',
        href: '/security',
      },
      {
        id: '4.26',
        label: 'Security Console → verify Incidents tab',
        href: '/security',
      },
      {
        id: '4.27',
        label: 'Security Console → verify Keys tab',
        href: '/security',
      },
      {
        id: '4.28',
        label: 'Security Console → verify Pass-On Log tab',
        href: '/security',
      },
      {
        id: '4.29',
        label: 'Security Console → verify Parcels tab',
        href: '/security',
      },
      {
        id: '4.30',
        label: 'Security Console → verify Cleaning tab',
        href: '/security',
      },
      { id: '4.31', label: 'Security Console → log pass-on note', href: '/security' },
      {
        id: '4.32',
        label: 'Verify email notification sent when package logged (requires Resend API key)',
        href: '/packages',
      },
      {
        id: '4.33',
        label: 'Verify visitor check-in email sent to resident (requires Resend API key)',
        href: '/visitors',
      },
    ],
  },

  // =========================================================================
  // PHASE 5: Security Guard — Security Operations
  // =========================================================================
  {
    id: 'phase-5',
    title: 'Phase 5: Security Guard — Security Operations',
    role: 'Security Guard',
    roleColor: 'bg-amber-100 text-amber-700',
    steps: [
      { id: '5.1', label: 'Verify dashboard: "Security Dashboard"', href: '/dashboard' },
      {
        id: '5.2',
        label: 'Verify sidebar: Security Console, Packages, Parking, Visitors, Keys, Shift Log',
        href: '/dashboard',
      },
      {
        id: '5.3',
        label: 'Security Console → report incident',
        description: 'Noise Complaint, Unit 815, Medium priority',
        href: '/security',
      },
      { id: '5.4', label: 'Security Console → verify incident in list', href: '/security' },
      {
        id: '5.5',
        label: 'Security Console → test Visitors filter tab',
        href: '/security',
      },
      {
        id: '5.6',
        label: 'Security Console → test Incidents filter tab',
        href: '/security',
      },
      {
        id: '5.7',
        label: 'Security Console → test Keys filter tab',
        href: '/security',
      },
      {
        id: '5.8',
        label: 'Security Console → test Pass-On filter tab',
        href: '/security',
      },
      {
        id: '5.9',
        label: 'Security Console → test Parcels filter tab',
        href: '/security',
      },
      {
        id: '5.10',
        label: 'Security Console → test Authorized Entry dialog',
        description: 'Pre-authorized visitor or delivery entry',
        href: '/security',
      },
      { id: '5.11', label: 'Fire Log → log fire drill', href: '/security' },
      { id: '5.12', label: 'Noise Complaint → log complaint with details', href: '/security' },
      {
        id: '5.13',
        label: 'Parking → log parking violation with photo',
        description: 'Attach photo evidence of violation',
        href: '/parking',
      },
      { id: '5.14', label: 'Parking → verify violation appears in list', href: '/parking' },
      {
        id: '5.14b',
        label:
          'Parking → Report Violation via dialog (license plate, type, location, notify owner)',
        href: '/parking',
      },
      {
        id: '5.15',
        label: 'Visitors → pre-register expected visitor',
        description: 'Set name, unit, expected arrival time',
        href: '/visitors',
      },
      { id: '5.16', label: 'Visitors → check in delivery driver', href: '/visitors' },
      { id: '5.17', label: 'Visitors → check out delivery driver', href: '/visitors' },
      { id: '5.18', label: 'Packages → accept after-hours delivery', href: '/packages' },
      {
        id: '5.19',
        label: 'Shift Log → create security patrol entry',
        href: '/shift-log',
      },
      {
        id: '5.20',
        label: 'Shift Log → create end-of-shift handoff',
        href: '/shift-log',
      },
      {
        id: '5.21',
        label: 'Verify Security Guard CANNOT access Settings',
        href: '/settings',
      },
      {
        id: '5.22',
        label: 'Verify Security Guard CANNOT access User Management',
        href: '/users',
      },
      {
        id: '5.23',
        label:
          'Fire Log → verify comprehensive form (elevator checkboxes, FD timeline, device resets)',
        href: '/security',
      },
    ],
  },

  // =========================================================================
  // PHASE 6: Security Supervisor — Management
  // =========================================================================
  {
    id: 'phase-6',
    title: 'Phase 6: Security Supervisor — Management',
    role: 'Security Supervisor',
    roleColor: 'bg-orange-100 text-orange-700',
    steps: [
      { id: '6.1', label: 'Verify dashboard with security-focused KPIs', href: '/dashboard' },
      {
        id: '6.2',
        label: 'Keys & FOBs → add Master Key',
        description: 'Type: Master, serial number, assigned location',
        href: '/keys',
      },
      {
        id: '6.3',
        label: 'Keys & FOBs → add Unit Key',
        href: '/keys',
      },
      {
        id: '6.4',
        label: 'Keys & FOBs → add Lobby FOB',
        href: '/keys',
      },
      {
        id: '6.5',
        label: 'Keys & FOBs → add Garage Clicker',
        href: '/keys',
      },
      {
        id: '6.6',
        label: 'Keys & FOBs → add Buzzer Code',
        href: '/keys',
      },
      { id: '6.7', label: 'Keys & FOBs → checkout key to guard', href: '/keys' },
      { id: '6.8', label: 'Keys & FOBs → verify audit trail shows checkout', href: '/keys' },
      { id: '6.9', label: 'Keys & FOBs → return key from guard', href: '/keys' },
      {
        id: '6.10',
        label: 'Keys & FOBs → test Available status filter',
        href: '/keys',
      },
      {
        id: '6.11',
        label: 'Keys & FOBs → test Checked Out status filter',
        href: '/keys',
      },
      {
        id: '6.12',
        label: 'Keys & FOBs → test Lost status filter',
        href: '/keys',
      },
      {
        id: '6.13',
        label: 'Keys & FOBs → bulk import keys via CSV',
        href: '/keys',
      },
      { id: '6.14', label: "Review guard's incident report", href: '/security' },
      { id: '6.15', label: 'Add investigation notes to incident', href: '/security' },
      { id: '6.16', label: 'Close incident with resolution summary', href: '/security' },
      {
        id: '6.17',
        label: 'Keys → verify Return button works (PATCH API, status back to AVAILABLE)',
        href: '/keys',
      },
    ],
  },

  // =========================================================================
  // PHASE 7: Maintenance Staff — Work Orders
  // =========================================================================
  {
    id: 'phase-7',
    title: 'Phase 7: Maintenance Staff — Work Orders',
    role: 'Maintenance Staff',
    roleColor: 'bg-green-100 text-green-700',
    steps: [
      { id: '7.1', label: 'Verify dashboard: "Work Queue"', href: '/dashboard' },
      {
        id: '7.2',
        label: 'Verify sidebar: Service Requests, Inspections, Equipment, Recurring Tasks',
        href: '/dashboard',
      },
      {
        id: '7.3',
        label: 'Service Requests → view assigned request in list',
        href: '/maintenance',
      },
      { id: '7.4', label: 'Service Requests → update status to In Progress', href: '/maintenance' },
      {
        id: '7.5',
        label: 'Service Requests → add comment with progress update',
        href: '/maintenance',
      },
      {
        id: '7.6',
        label: 'Service Requests → mark as Resolved with resolution note',
        href: '/maintenance',
      },
      { id: '7.7', label: 'Equipment → view assigned equipment list', href: '/equipment' },
      {
        id: '7.8',
        label: 'Equipment → click into equipment detail page',
        description: 'Verify specs, lifecycle dates, maintenance history',
        href: '/equipment',
      },
      {
        id: '7.9',
        label: 'Equipment → log maintenance history entry on item',
        href: '/equipment',
      },
      {
        id: '7.10',
        label: 'Inspections → click into inspection detail page',
        description: 'Verify checklist items, location, due date',
        href: '/inspections',
      },
      {
        id: '7.11',
        label: 'Inspections → complete each checklist item individually',
        href: '/inspections',
      },
      { id: '7.12', label: 'Inspections → add photos to inspection', href: '/inspections' },
      { id: '7.13', label: 'Inspections → submit completed inspection', href: '/inspections' },
      { id: '7.14', label: 'Recurring Tasks → view pending tasks list', href: '/recurring-tasks' },
      {
        id: '7.15',
        label: 'Recurring Tasks → mark daily task complete',
        description: 'Verify next occurrence auto-schedules',
        href: '/recurring-tasks',
      },
    ],
  },

  // =========================================================================
  // PHASE 8: Superintendent — Building Operations
  // =========================================================================
  {
    id: 'phase-8',
    title: 'Phase 8: Superintendent — Building Operations',
    role: 'Superintendent',
    roleColor: 'bg-cyan-100 text-cyan-700',
    steps: [
      { id: '8.1', label: 'Verify dashboard: "Building Operations"', href: '/dashboard' },
      {
        id: '8.2',
        label: 'Verify sidebar includes: Building Systems, Parts & Supplies, Purchase Orders',
        href: '/dashboard',
      },
      {
        id: '8.3',
        label: 'Building Systems → verify page renders with system list',
        href: '/building-systems',
      },
      {
        id: '8.4',
        label: 'Parts & Supplies → add first inventory item',
        description: 'Light Bulbs, Qty: 50, Reorder at: 10',
        href: '/parts-supplies',
      },
      {
        id: '8.5',
        label: 'Parts & Supplies → add second inventory item',
        description: 'Air Filters, Qty: 20, Reorder at: 5',
        href: '/parts-supplies',
      },
      {
        id: '8.6',
        label: 'Parts & Supplies → add third inventory item',
        description: 'Cleaning Supplies, Qty: 100, Reorder at: 25',
        href: '/parts-supplies',
      },
      {
        id: '8.7',
        label: 'Parts & Supplies → verify low-stock alert triggers',
        description: 'Reduce quantity below reorder point and check alert',
        href: '/parts-supplies',
      },
      {
        id: '8.8',
        label: 'Purchase Orders → create PO (Draft status)',
        href: '/purchase-orders',
      },
      {
        id: '8.9',
        label: 'Purchase Orders → submit PO for approval',
        href: '/purchase-orders',
      },
      {
        id: '8.10',
        label: 'Purchase Orders → approve PO',
        href: '/purchase-orders',
      },
      {
        id: '8.11',
        label: 'Purchase Orders → mark PO as Ordered',
        href: '/purchase-orders',
      },
      {
        id: '8.12',
        label: 'Purchase Orders → mark PO as Received',
        href: '/purchase-orders',
      },
      { id: '8.13', label: 'Purchase Orders → link PO to vendor', href: '/purchase-orders' },
      { id: '8.14', label: 'Vendors → schedule vendor maintenance visit', href: '/vendors' },
      {
        id: '8.15',
        label: 'Equipment → view all building equipment',
        href: '/equipment',
      },
      {
        id: '8.16',
        label: 'Equipment → log preventive maintenance on equipment',
        href: '/equipment',
      },
      {
        id: '8.17',
        label: 'Inspections → review completed inspections',
        href: '/inspections',
      },
      {
        id: '8.18',
        label: 'Recurring Tasks → review all scheduled tasks',
        href: '/recurring-tasks',
      },
      {
        id: '8.19',
        label: 'Service Requests → view all maintenance requests',
        href: '/maintenance',
      },
      {
        id: '8.20',
        label: 'Service Requests → escalate overdue request',
        href: '/maintenance',
      },
    ],
  },

  // =========================================================================
  // PHASE 9: Resident (Owner) — Self-Service
  // =========================================================================
  {
    id: 'phase-9',
    title: 'Phase 9: Resident (Owner) — Self-Service',
    role: 'Resident (Owner)',
    roleColor: 'bg-indigo-100 text-indigo-700',
    steps: [
      { id: '9.1', label: 'Verify dashboard: "My Dashboard"', href: '/dashboard' },
      {
        id: '9.2',
        label: 'Verify sidebar: My Packages, My Requests, Amenity Booking, Announcements, etc.',
        href: '/dashboard',
      },
      {
        id: '9.3',
        label: 'My Packages → view packages logged by front desk',
        href: '/my-packages',
      },
      {
        id: '9.4',
        label: 'My Requests → create maintenance request',
        description: 'Electrical: Kitchen light flickering',
        href: '/my-requests',
      },
      { id: '9.5', label: 'My Requests → verify reference number generated', href: '/my-requests' },
      {
        id: '9.6',
        label: 'Amenity Booking → view calendar view of availability',
        href: '/amenity-booking',
      },
      {
        id: '9.7',
        label: 'Amenity Booking → select date and time slot',
        href: '/amenity-booking',
      },
      {
        id: '9.8',
        label: 'Amenity Booking → confirm booking for Party Room',
        href: '/amenity-booking',
      },
      {
        id: '9.9',
        label: 'Amenity Booking → verify confirmation details',
        href: '/amenity-booking',
      },
      {
        id: '9.10',
        label: 'Amenity Booking → cancel existing booking',
        href: '/amenity-booking',
      },
      { id: '9.11', label: 'Announcements → read building announcements', href: '/announcements' },
      { id: '9.12', label: 'Events → view upcoming community events', href: '/events' },
      {
        id: '9.13',
        label: 'Marketplace → create classified ad',
        description: 'Title, description, price, photo',
        href: '/marketplace',
      },
      {
        id: '9.14',
        label: 'Marketplace → view ad detail page',
        href: '/marketplace',
      },
      {
        id: '9.15',
        label: 'Marketplace → mark ad as sold',
        href: '/marketplace',
      },
      { id: '9.16', label: 'Library → browse documents by category', href: '/library' },
      { id: '9.17', label: 'Library → download a document', href: '/library' },
      {
        id: '9.18',
        label: 'Forum → create new discussion thread',
        href: '/forum',
      },
      {
        id: '9.19',
        label: 'Forum → add reply to existing thread',
        href: '/forum',
      },
      {
        id: '9.20',
        label: 'Forum → view thread detail page with replies',
        href: '/forum',
      },
      {
        id: '9.21',
        label: 'Idea Board → submit new idea',
        href: '/ideas',
      },
      {
        id: '9.22',
        label: 'Idea Board → vote on existing idea',
        href: '/ideas',
      },
      {
        id: '9.23',
        label: 'Photo Albums → create new album',
        href: '/photo-albums',
      },
      {
        id: '9.24',
        label: 'Photo Albums → upload photos to album',
        href: '/photo-albums',
      },
      { id: '9.25', label: 'My Vacations → log vacation period', href: '/residents/vacations' },
      { id: '9.26', label: 'My Account → update profile info', href: '/my-account' },
      {
        id: '9.27',
        label: 'My Account → change password',
        href: '/my-account',
      },
      {
        id: '9.28',
        label: 'My Account → update notification preferences',
        description: 'Toggle email, SMS, push per notification type',
        href: '/my-account',
      },
      {
        id: '9.29',
        label: 'Surveys → respond to active survey',
        href: '/surveys',
      },
      {
        id: '9.30',
        label: 'My Requests → verify simplified form (no unit selector, no category)',
        href: '/my-requests',
      },
      {
        id: '9.31',
        label:
          'My Requests → verify Permission to Enter reveals Entry Instructions (progressive disclosure)',
        href: '/my-requests',
      },
      {
        id: '9.32',
        label: 'Amenity Booking → browse amenities, view detail, create booking for Party Room',
        href: '/amenities',
      },
      {
        id: '9.33',
        label: 'Amenity Booking → verify booking in My Bookings with Cancel option',
        href: '/amenity-booking',
      },
    ],
  },

  // =========================================================================
  // PHASE 10: Board Member — Governance
  // =========================================================================
  {
    id: 'phase-10',
    title: 'Phase 10: Board Member — Governance',
    role: 'Board Member',
    roleColor: 'bg-slate-100 text-slate-700',
    steps: [
      { id: '10.1', label: 'Verify governance-focused dashboard', href: '/dashboard' },
      { id: '10.2', label: 'Reports → view operations reports', href: '/reports' },
      { id: '10.3', label: 'Reports → view financial reports', href: '/reports' },
      { id: '10.4', label: 'Building Analytics → view performance metrics', href: '/analytics' },
      {
        id: '10.5',
        label: 'Governance → view Meetings tab',
        href: '/governance',
      },
      {
        id: '10.6',
        label: 'Governance → view Resolutions tab',
        href: '/governance',
      },
      {
        id: '10.7',
        label: 'Governance → view Documents tab',
        href: '/governance',
      },
      { id: '10.8', label: 'Governance → review meeting minutes', href: '/governance' },
      { id: '10.9', label: 'Announcements → read building announcements', href: '/announcements' },
      { id: '10.10', label: 'Events → view community events', href: '/events' },
      {
        id: '10.11',
        label: 'Surveys → respond to board survey',
        href: '/surveys',
      },
    ],
  },

  // =========================================================================
  // PHASE 11: Cross-Role Verification
  // =========================================================================
  {
    id: 'phase-11',
    title: 'Phase 11: Cross-Role Verification',
    role: 'All Roles',
    roleColor: 'bg-neutral-100 text-neutral-700',
    steps: [
      { id: '11.1', label: 'Package logged by Front Desk → visible to Resident in My Packages' },
      { id: '11.2', label: 'Maintenance request by Resident → visible to Property Manager' },
      { id: '11.3', label: 'Maintenance request by Resident → visible to Maintenance Staff' },
      { id: '11.4', label: 'Incident by Security Guard → visible to Supervisor' },
      { id: '11.5', label: 'Announcement by Property Manager → visible to Residents' },
      { id: '11.6', label: 'Shift log by Front Desk → visible to next shift' },
      { id: '11.7', label: 'Key checkout by Supervisor → visible in audit trail' },
      { id: '11.8', label: 'Amenity booking by Resident → visible to Property Manager' },
      { id: '11.9', label: 'Vendor added by Admin → visible to Property Manager' },
      { id: '11.10', label: 'Equipment added by Manager → visible to Maintenance Staff' },
      { id: '11.11', label: 'Parking violation by Guard → visible to Supervisor' },
      { id: '11.12', label: 'Resident CANNOT see: Security Console, User Management, Settings' },
      { id: '11.13', label: 'Security Guard CANNOT see: Maintenance, Equipment, Settings' },
      { id: '11.14', label: 'Front Desk CANNOT see: Parking, Maintenance, Vendors' },
      { id: '11.15', label: 'Board Member CANNOT see: packages, visitors, security ops' },
      { id: '11.16', label: 'Maintenance Staff CANNOT see: Billing, Users, Security Console' },
      { id: '11.17', label: 'Superintendent CANNOT see: Security Console, Residents, Billing' },
      {
        id: '11.18',
        label: 'Shift log by Front Desk → appears in Security Console as Pass-On event',
      },
      { id: '11.19', label: 'Resident CANNOT access /api/v1/vendors (403 Forbidden)' },
      { id: '11.20', label: 'Resident CANNOT access /api/v1/users (403 Forbidden)' },
      { id: '11.21', label: 'Resident CANNOT access /api/v1/equipment (403 Forbidden)' },
      { id: '11.22', label: 'Maintenance requests filtered by resident unit (PIPEDA compliance)' },
    ],
  },

  // =========================================================================
  // PHASE 12: Settings Deep Dive
  // =========================================================================
  {
    id: 'phase-12',
    title: 'Phase 12: Settings Deep Dive',
    role: 'Super Admin',
    roleColor: 'bg-red-100 text-red-700',
    steps: [
      {
        id: '12.1',
        label: 'General Settings → verify property name editable',
        href: '/settings',
      },
      {
        id: '12.2',
        label: 'General Settings → verify address fields editable',
        href: '/settings',
      },
      {
        id: '12.3',
        label: 'General Settings → upload/change property logo',
        href: '/settings',
      },
      {
        id: '12.4',
        label: 'General Settings → set timezone and locale',
        href: '/settings',
      },
      {
        id: '12.5',
        label: 'Module Toggles → enable Packages module',
        href: '/settings/modules',
      },
      {
        id: '12.6',
        label: 'Module Toggles → disable Packages module and verify nav hides',
        href: '/settings/modules',
      },
      {
        id: '12.7',
        label: 'Module Toggles → re-enable Packages module',
        href: '/settings/modules',
      },
      {
        id: '12.8',
        label: 'Module Toggles → toggle Marketplace module',
        href: '/settings/modules',
      },
      {
        id: '12.9',
        label: 'Module Toggles → toggle Forum module',
        href: '/settings/modules',
      },
      {
        id: '12.10',
        label: 'Module Toggles → toggle Training module',
        href: '/settings/modules',
      },
      {
        id: '12.11',
        label: 'Event Types → add new custom event type',
        description: 'Name, icon, color, notification template',
        href: '/settings/event-types',
      },
      {
        id: '12.12',
        label: 'Event Types → edit existing event type',
        href: '/settings/event-types',
      },
      {
        id: '12.13',
        label: 'Event Types → delete unused event type',
        href: '/settings/event-types',
      },
      {
        id: '12.14',
        label: 'Roles → verify role permissions matrix renders',
        href: '/settings/roles',
      },
      {
        id: '12.15',
        label: 'Roles → toggle individual permission for a role',
        href: '/settings/roles',
      },
      {
        id: '12.16',
        label: 'Notifications → configure email channel per module',
        href: '/settings/notifications',
      },
      {
        id: '12.17',
        label: 'Notifications → configure SMS channel per module',
        href: '/settings/notifications',
      },
      {
        id: '12.18',
        label: 'Notifications → configure push channel per module',
        href: '/settings/notifications',
      },
      {
        id: '12.19',
        label: 'Email Config → set SMTP host and port',
        href: '/settings/email-config',
      },
      {
        id: '12.20',
        label: 'Email Config → set sender "From" address',
        href: '/settings/email-config',
      },
      {
        id: '12.21',
        label: 'Email Config → test email delivery',
        href: '/settings/email-config',
      },
      {
        id: '12.22',
        label: 'Custom Fields → create Text custom field',
        href: '/settings',
      },
      {
        id: '12.23',
        label: 'Custom Fields → create Number custom field',
        href: '/settings',
      },
      {
        id: '12.24',
        label: 'Custom Fields → create Date custom field',
        href: '/settings',
      },
      {
        id: '12.25',
        label: 'Custom Fields → create Dropdown custom field with options',
        href: '/settings',
      },
      {
        id: '12.26',
        label: 'Parking Config → configure parking areas',
        description: 'Underground P1, Visitor Lot, EV Charging',
        href: '/settings',
      },
      {
        id: '12.27',
        label: 'Parking Config → configure permit types and limits',
        href: '/settings',
      },
      {
        id: '12.28',
        label: 'Security Company Settings → set company name and contact',
        href: '/settings',
      },
      {
        id: '12.29',
        label: 'Billing Settings → view current plan and usage',
        href: '/system/billing',
      },
      {
        id: '12.30',
        label: 'Billing Settings → export invoice',
        href: '/system/billing',
      },
      {
        id: '12.31',
        label: 'Integrations → verify Slack integration config',
        href: '/settings',
      },
      {
        id: '12.32',
        label: 'Integrations → verify S3 storage config',
        href: '/settings',
      },
      {
        id: '12.33',
        label: 'Integrations → verify calendar sync config',
        href: '/settings',
      },
      {
        id: '12.34',
        label: 'Notifications → verify Save Changes shows success message',
        href: '/settings/notifications',
      },
      {
        id: '12.35',
        label: 'Notifications → verify 11-module x 4-channel matrix renders correctly',
        href: '/settings/notifications',
      },
      {
        id: '12.36',
        label: 'Notifications → verify Quiet Hours and Digest Settings sections',
        href: '/settings/notifications',
      },
    ],
  },

  // =========================================================================
  // PHASE 13: Edge Cases & Error Handling
  // =========================================================================
  {
    id: 'phase-13',
    title: 'Phase 13: Edge Cases & Error Handling',
    role: 'All Roles',
    roleColor: 'bg-neutral-100 text-neutral-700',
    steps: [
      {
        id: '13.1',
        label: 'Submit empty package form → verify validation errors shown',
        href: '/packages',
      },
      {
        id: '13.2',
        label: 'Submit empty maintenance form → verify validation errors shown',
        href: '/maintenance',
      },
      {
        id: '13.3',
        label: 'Submit empty visitor form → verify validation errors shown',
        href: '/visitors',
      },
      {
        id: '13.4',
        label: 'Submit empty unit form → verify validation errors shown',
        href: '/units',
      },
      {
        id: '13.5',
        label: 'Submit empty user creation form → verify validation errors shown',
        href: '/users',
      },
      {
        id: '13.6',
        label: 'Search with no results → verify empty state message',
        href: '/packages',
      },
      {
        id: '13.7',
        label: 'Search units with no match → verify empty state',
        href: '/units',
      },
      {
        id: '13.8',
        label: 'Navigate to non-existent route → verify 404 page',
        href: '/this-page-does-not-exist',
      },
      {
        id: '13.9',
        label: 'Navigate to non-existent unit detail → verify 404',
        href: '/units/non-existent-id',
      },
      {
        id: '13.10',
        label: 'Test page loading states (skeleton/spinner) on slow network',
      },
      {
        id: '13.11',
        label: 'Test responsive sidebar collapse on narrow viewport',
      },
      {
        id: '13.12',
        label: 'Test global search (Cmd+K or Ctrl+K)',
        description: 'Search for a unit, user, package — verify results link correctly',
      },
      {
        id: '13.13',
        label: 'Test notification bell → verify notification dropdown',
        href: '/dashboard',
      },
      {
        id: '13.14',
        label: 'Test user avatar dropdown → verify profile, settings, logout links',
        href: '/dashboard',
      },
      {
        id: '13.15',
        label: 'Test double-submit prevention on create forms',
        description: 'Click submit rapidly twice — verify only one record created',
      },
      {
        id: '13.16',
        label: 'Test long text input in description fields',
        description: 'Paste 4000+ characters — verify truncation or acceptance',
        href: '/maintenance',
      },
      {
        id: '13.17',
        label: 'Test special characters in search input',
        description: 'Search with <script>, SQL injection, unicode',
      },
      {
        id: '13.18',
        label: 'Test browser back/forward navigation between pages',
      },
      {
        id: '13.19',
        label: 'Test session expiry → verify redirect to login',
        href: '/login',
      },
      {
        id: '13.20',
        label: 'Test concurrent edits — two tabs editing same record',
        description: 'Verify no silent data loss',
      },
      {
        id: '13.21',
        label: 'Test file upload with oversized file (>4MB)',
        description: 'Verify file size validation error message',
      },
      {
        id: '13.22',
        label: 'Test file upload with unsupported file type',
        description: 'Verify file type validation error message',
      },
      {
        id: '13.23',
        label: 'Test pagination on large lists (50+ items)',
        href: '/packages',
      },
      {
        id: '13.24',
        label: 'Test sort columns on list pages (click column headers)',
        href: '/units',
      },
      {
        id: '13.25',
        label: 'Test date range filter on reports',
        href: '/reports',
      },
      {
        id: '13.26',
        label: 'Test toast notifications appear on create/update/delete',
      },
      {
        id: '13.27',
        label: 'Test modal dialog close via ESC key and backdrop click',
      },
      {
        id: '13.28',
        label: 'Test breadcrumb navigation on detail pages',
        href: '/units',
      },
      {
        id: '13.29',
        label: 'Test keyboard tab navigation through forms (accessibility)',
        href: '/packages',
      },
      {
        id: '13.30',
        label: 'Test print view on reports page',
        href: '/reports',
      },
      { id: '13.31', label: 'Duplicate unit number → verify 409 DUPLICATE_UNIT error' },
      { id: '13.32', label: 'Duplicate email address → verify 409 EMAIL_EXISTS error' },
      { id: '13.33', label: 'Long text (500+ chars) in description → verify no layout break' },
      { id: '13.34', label: 'Browser refresh on detail page → verify data persists from DB' },
      { id: '13.35', label: 'Empty maintenance form → verify field-specific error messages' },
      { id: '13.36', label: 'Maintenance filter tabs → verify each tab shows correct subset' },
      {
        id: '13.37',
        label: 'Parking permit → create with vehicle details (API auto-creates vehicle record)',
        href: '/parking',
      },
      {
        id: '13.38',
        label: 'Equipment → create via UI form with HVAC category (correct casing)',
        href: '/equipment',
      },
      {
        id: '13.39',
        label: 'Recurring Tasks → create with date-only startDate (auto-converted to ISO)',
        href: '/recurring-tasks',
      },
      {
        id: '13.40',
        label: 'Alteration → verify start/end dates marked as required with asterisk',
        href: '/alterations',
      },
      {
        id: '13.41',
        label:
          'Dialog buttons → verify all "New" buttons open dialog on FIRST click (not double-click)',
        href: '/inspections',
      },
    ],
  },

  // =========================================================================
  // PHASE 14: Training & Onboarding
  // =========================================================================
  {
    id: 'phase-14',
    title: 'Phase 14: Training & Onboarding',
    role: 'Property Admin',
    roleColor: 'bg-purple-100 text-purple-700',
    steps: [
      {
        id: '14.1',
        label: 'Training → verify training module page loads',
        href: '/training',
      },
      {
        id: '14.2',
        label: 'Training → create training course',
        description: 'Course title, description, content sections',
        href: '/training',
      },
      {
        id: '14.3',
        label: 'Training → add quiz to course',
        description: 'Multiple choice questions with pass/fail threshold',
        href: '/training',
      },
      {
        id: '14.4',
        label: 'Training → assign course to staff role',
        href: '/training',
      },
      {
        id: '14.5',
        label: 'Training → verify course appears in staff dashboard',
        href: '/training',
      },
      {
        id: '14.6',
        label: 'Training → complete course as staff user',
        href: '/training',
      },
      {
        id: '14.7',
        label: 'Training → take quiz and verify pass/fail result',
        href: '/training',
      },
      {
        id: '14.8',
        label: 'Training → verify completion tracking in admin view',
        href: '/training',
      },
      {
        id: '14.9',
        label: 'Onboarding → verify 8-step wizard flow',
        description: 'Property info, units, users, amenities, settings',
        href: '/onboarding',
      },
      {
        id: '14.10',
        label: 'Onboarding → complete each wizard step in order',
        href: '/onboarding',
      },
      {
        id: '14.11',
        label: 'Onboarding → verify skip and back navigation',
        href: '/onboarding',
      },
      {
        id: '14.12',
        label: 'Onboarding → verify completion summary page',
        href: '/onboarding',
      },
      {
        id: '14.13',
        label: 'Demo Environment → verify demo data seeded',
        href: '/system/demo',
      },
      {
        id: '14.14',
        label: 'Demo Environment → navigate demo as each role',
        href: '/system/demo',
      },
      {
        id: '14.15',
        label: 'Demo Environment → verify demo reset functionality',
        href: '/system/demo',
      },
    ],
  },
];

const TOTAL_STEPS = PHASES.reduce((sum, p) => sum + p.steps.length, 0);
const STORAGE_KEY = 'feature_intelligence_completed';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeatureIntelligencePage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCompleted(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
    }
  }, [completed, mounted]);

  const toggleStep = useCallback((stepId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const togglePhase = useCallback((phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    if (window.confirm('Reset all progress? This cannot be undone.')) {
      setCompleted(new Set());
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const completedCount = completed.size;
  const progressPercent = TOTAL_STEPS > 0 ? Math.round((completedCount / TOTAL_STEPS) * 100) : 0;

  if (!mounted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-[3px] border-neutral-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
              <Sparkles className="text-primary-600 h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
                Feature Intelligence
              </h1>
              <p className="text-[14px] text-neutral-500">
                End-to-end testing flow across all {PHASES.length} phases and {TOTAL_STEPS} steps
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Progress
        </button>
      </div>

      {/* Overall Progress */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[14px] font-semibold text-neutral-700">Overall Progress</span>
          <span className="text-primary-600 text-[14px] font-bold">
            {completedCount}/{TOTAL_STEPS} steps ({progressPercent}%)
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="bg-primary-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-3 flex gap-4 text-[12px] text-neutral-400">
          <span>{PHASES.length} phases</span>
          <span>\u2022</span>
          <span>10+ roles</span>
          <span>\u2022</span>
          <span>40+ modules</span>
          <span>\u2022</span>
          <span>Progress saved locally</span>
        </div>
      </div>

      {/* Phase Cards */}
      <div className="space-y-3">
        {PHASES.map((phase) => {
          const isExpanded = expandedPhases.has(phase.id);
          const phaseCompleted = phase.steps.filter((s) => completed.has(s.id)).length;
          const phaseTotal = phase.steps.length;
          const phasePercent = Math.round((phaseCompleted / phaseTotal) * 100);
          const isPhaseComplete = phaseCompleted === phaseTotal;

          return (
            <div
              key={phase.id}
              className={`overflow-hidden rounded-xl border transition-colors ${
                isPhaseComplete
                  ? 'border-success-200 bg-success-50/30'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              {/* Phase Header */}
              <button
                onClick={() => togglePhase(phase.id)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-neutral-50/50"
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-neutral-400" />
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-semibold text-neutral-900">
                      {phase.title}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${phase.roleColor}`}
                    >
                      {phase.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[13px] font-medium ${
                      isPhaseComplete ? 'text-success-600' : 'text-neutral-500'
                    }`}
                  >
                    {phaseCompleted}/{phaseTotal}
                  </span>
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPhaseComplete ? 'bg-success-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${phasePercent}%` }}
                    />
                  </div>
                </div>
              </button>

              {/* Phase Steps */}
              {isExpanded && (
                <div className="border-t border-neutral-100 px-4 pb-4">
                  <div className="divide-y divide-neutral-50">
                    {phase.steps.map((step) => {
                      const isDone = completed.has(step.id);
                      return (
                        <div
                          key={step.id}
                          className={`flex items-start gap-3 py-3 ${isDone ? 'opacity-60' : ''}`}
                        >
                          <button
                            onClick={() => toggleStep(step.id)}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {isDone ? (
                              <CheckCircle2 className="text-success-500 h-5 w-5" />
                            ) : (
                              <Circle className="hover:text-primary-400 h-5 w-5 text-neutral-300" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-[13px] ${
                                isDone ? 'text-neutral-400 line-through' : 'text-neutral-800'
                              }`}
                            >
                              <span className="mr-2 font-mono text-[11px] text-neutral-400">
                                {step.id}
                              </span>
                              {step.label}
                            </span>
                            {step.description && (
                              <p className="mt-0.5 text-[12px] text-neutral-400">
                                {step.description}
                              </p>
                            )}
                          </div>

                          {step.href && (
                            <a
                              href={step.href}
                              className="hover:bg-primary-50 hover:text-primary-500 flex-shrink-0 rounded-md p-1 text-neutral-300 transition-colors"
                              title={`Go to ${step.href}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
