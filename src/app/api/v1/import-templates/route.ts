/**
 * Import Templates API — Download CSV templates for units/residents
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'units') {
    const csv = [
      'Unit Number,Floor,Building,Unit Type,Square Footage,Buzzer Code,Parking Spot,Locker,Key Tag,Notes',
      '101,1,Main Tower,Residential,650,1011,P-101,L-101,FOB-001,Corner unit',
      '102,1,Main Tower,Residential,580,1021,,,FOB-002,',
      'PH-A,20,Main Tower,Penthouse,2200,2001,P-PH1,,,Penthouse suite',
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="concierge-unit-import-template.csv"',
      },
    });
  }

  if (type === 'residents') {
    const csv = [
      'First Name,Last Name,Email,Phone,Unit Number,Resident Type,Move-in Date',
      'Maria,Santos,maria.santos@email.com,+14165551234,101,Owner,2025-06-15',
      'James,Chen,james.chen@email.com,,102,Tenant,2025-09-01',
      'Sarah,Williams,sarah.w@email.com,+14165559876,PH-A,Owner,2024-01-10',
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="concierge-resident-import-template.csv"',
      },
    });
  }

  return NextResponse.json(
    { error: 'INVALID_TYPE', message: 'Type must be "units" or "residents"' },
    { status: 400 },
  );
}
