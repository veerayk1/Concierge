/**
 * Notification Templates API — per PRD 09 + 16
 * Manage email/SMS/push notification templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';

const createTemplateSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['email', 'sms', 'push']),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(5000),
  module: z.string().max(50).optional(),
  isDefault: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const propertyId = new URL(request.url).searchParams.get('propertyId');
    const type = new URL(request.url).searchParams.get('type');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Return default templates since we don't have a dedicated table yet
    const templates = [
      {
        id: 't-1',
        name: 'Package Received',
        type: 'email',
        module: 'packages',
        subject: 'You have a package at the front desk',
        body: 'Hi {resident_name},\n\nA package from {courier_name} has arrived for you at {property_name}.\n\nReference: {reference_number}\nStorage: {storage_location}\n\nPlease pick it up at the front desk at your earliest convenience.\n\nThank you,\n{property_name}',
        isDefault: true,
      },
      {
        id: 't-2',
        name: 'Package Reminder',
        type: 'email',
        module: 'packages',
        subject: 'Reminder: Package waiting for you',
        body: 'Hi {resident_name},\n\nThis is a reminder that you have an unclaimed package ({reference_number}) at the front desk.\n\nIt has been waiting for {days_waiting} days.\n\nPlease pick it up soon.\n\nThank you,\n{property_name}',
        isDefault: true,
      },
      {
        id: 't-3',
        name: 'Maintenance Update',
        type: 'email',
        module: 'maintenance',
        subject: 'Maintenance Request Update - {reference_number}',
        body: 'Hi {resident_name},\n\nYour maintenance request ({reference_number}) has been updated.\n\nNew Status: {status}\n{update_details}\n\nThank you,\n{property_name}',
        isDefault: true,
      },
      {
        id: 't-4',
        name: 'Booking Confirmed',
        type: 'email',
        module: 'amenities',
        subject: 'Booking Confirmed: {amenity_name}',
        body: 'Hi {resident_name},\n\nYour booking for {amenity_name} has been confirmed.\n\nDate: {date}\nTime: {start_time} - {end_time}\nGuests: {guest_count}\n\nThank you,\n{property_name}',
        isDefault: true,
      },
      {
        id: 't-5',
        name: 'Welcome Email',
        type: 'email',
        module: 'account',
        subject: 'Welcome to {property_name}',
        body: 'Hi {first_name},\n\nWelcome to {property_name}! Your account has been created.\n\nPlease set up your password by clicking the link below:\n{setup_link}\n\nThis link will expire in 72 hours.\n\nIf you have any questions, contact the front desk.\n\nThank you,\n{property_name}',
        isDefault: true,
      },
      {
        id: 't-6',
        name: 'Package Received',
        type: 'push',
        module: 'packages',
        body: 'A {courier_name} package has arrived for you. Ref: {reference_number}',
        isDefault: true,
      },
      {
        id: 't-7',
        name: 'Visitor Arrived',
        type: 'push',
        module: 'security',
        body: '{visitor_name} has arrived to visit you in Unit {unit_number}.',
        isDefault: true,
      },
      {
        id: 't-8',
        name: 'Announcement',
        type: 'push',
        module: 'announcements',
        body: 'New announcement: {title}',
        isDefault: true,
      },
    ];

    const filtered = type ? templates.filter((t) => t.type === type) : templates;

    return NextResponse.json({ data: filtered });
  } catch (error) {
    console.error('GET /api/v1/notifications/templates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch templates' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // TODO: Store in database
    return NextResponse.json(
      { data: { id: crypto.randomUUID(), ...parsed.data }, message: 'Template created.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/notifications/templates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create template' },
      { status: 500 },
    );
  }
}
