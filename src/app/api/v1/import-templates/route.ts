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
      'Sample,Resident 1,resident1@example.com,+10000000001,101,Owner,2025-06-15',
      'Sample,Resident 2,resident2@example.com,,102,Tenant,2025-09-01',
      'Sample,Resident 3,resident3@example.com,+10000000002,PH-A,Owner,2024-01-10',
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="concierge-resident-import-template.csv"',
      },
    });
  }

  if (type === 'properties') {
    const csv = [
      'Property Name,Address,City,Province,Country,Postal Code,Unit Count,Timezone,Property Code',
      'Sample Property A,123 Main Street,Toronto,ON,CA,M5J 1E3,171,America/Toronto,SMP-A',
      'Sample Property B,456 Oak Avenue,Toronto,ON,CA,M5V 3K9,320,America/Toronto,SMP-B',
      'Sample Property C,789 Elm Road,Ottawa,ON,CA,K1S 1A2,95,America/Toronto,SMP-C',
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="concierge-property-import-template.csv"',
      },
    });
  }

  if (type === 'amenities') {
    const csv = [
      'Amenity Name,Group,Description,Capacity,Operating Hours,Booking Fee,Booking Style',
      'Party Room,Social,Large event space with kitchen,50,9:00 AM - 11:00 PM,75.00,approval_required',
      'Gym,Fitness,24/7 fitness center,20,24 Hours,0,open',
      'Pool,Recreation,Outdoor pool with deck,30,7:00 AM - 9:00 PM,0,open',
      'Guest Suite,Accommodation,One-bedroom guest suite,2,Check-in 3:00 PM,50.00,approval_required',
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="concierge-amenity-import-template.csv"',
      },
    });
  }

  if (type === 'fobs') {
    const csv = [
      'Serial Number,Unit Number,FOB Type,Status,Issued Date,Issued To,Notes',
      'FOB-001,101,Main Entrance,Active,2025-01-15,Sample Resident 1,',
      'FOB-002,102,Main Entrance,Active,2025-03-01,Sample Resident 2,',
      'FOB-003,PH-A,All Access,Active,2024-01-10,Sample Resident 3,Penthouse access',
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="concierge-fob-import-template.csv"',
      },
    });
  }

  if (type === 'buzzer_codes') {
    const csv = [
      'Unit Number,Buzzer Code,Comments',
      '101,1011,',
      '102,1021,Ring twice for deaf resident',
      'PH-A,2001,Penthouse buzzer',
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="concierge-buzzer-code-import-template.csv"',
      },
    });
  }

  if (type === 'parking_permits') {
    const csv = [
      'Unit Number,License Plate,Vehicle Make,Vehicle Model,Vehicle Color,Spot Number',
      '101,ABCD 123,Toyota,Camry,Silver,P-101',
      '102,XYZ 789,Honda,Civic,Black,P-102',
      'PH-A,PNTHS 1,BMW,X5,White,P-PH1',
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition':
          'attachment; filename="concierge-parking-permit-import-template.csv"',
      },
    });
  }

  if (type === 'staff') {
    const csv = [
      'First Name,Last Name,Email,Phone,Role',
      'Staff,Member 1,staff1@example.com,+10000000001,Concierge',
      'Staff,Member 2,staff2@example.com,+10000000002,Security',
      'Staff,Member 3,staff3@example.com,+10000000003,Maintenance',
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="concierge-staff-import-template.csv"',
      },
    });
  }

  // For unsupported types, return a generic CSV with a single "Data" column
  // rather than an error, so the download link doesn't break
  return NextResponse.json(
    {
      error: 'INVALID_TYPE',
      message: `Template not available for type "${type}". Supported types: units, residents, properties, amenities, fobs, buzzer_codes, parking_permits, staff`,
    },
    { status: 400 },
  );
}
