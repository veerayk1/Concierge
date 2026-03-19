'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Clock,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Power,
  Trash2,
  User,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntryCategory = 'management' | 'emergency' | 'amenity' | 'commercial' | 'utility' | 'service';
type EntryStatus = 'active' | 'inactive';

interface RelatedEntry {
  id: string;
  name: string;
  category: EntryCategory;
}

interface DirectoryEntry {
  id: string;
  name: string;
  category: EntryCategory;
  status: EntryStatus;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  hoursOfOperation: string;
  notes: string;
  relatedEntries: RelatedEntry[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ENTRY: DirectoryEntry = {
  id: '1',
  name: 'Property Management Office',
  category: 'management',
  status: 'active',
  contactPerson: 'Janet Wu',
  phone: '(416) 555-0100',
  email: 'management@mapleheights.ca',
  location: 'Ground Floor, Suite 101',
  hoursOfOperation: 'Monday - Friday, 9:00 AM - 5:00 PM',
  notes:
    'Main office for all property management inquiries including maintenance requests, parking permits, key replacements, and resident account changes. After-hours emergencies should be directed to the concierge desk at ext. 100.',
  relatedEntries: [
    { id: '2', name: 'Concierge Desk', category: 'management' },
    { id: '3', name: 'Maintenance Office', category: 'service' },
    { id: '4', name: 'Board of Directors', category: 'management' },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  EntryCategory,
  { variant: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }
> = {
  management: { variant: 'primary', label: 'Management' },
  emergency: { variant: 'error', label: 'Emergency' },
  amenity: { variant: 'info', label: 'Amenity' },
  commercial: { variant: 'warning', label: 'Commercial' },
  utility: { variant: 'default', label: 'Utility' },
  service: { variant: 'success', label: 'Service' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BuildingDirectoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  // In production this would come from an API call using id
  const entry = MOCK_ENTRY;
  const categoryCfg = CATEGORY_CONFIG[entry.category];

  return (
    <PageShell
      title={entry.name}
      description="Building Directory"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit Entry
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/building-directory"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to building directory
        </Link>
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-6">
          {/* Entry Details */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Name"
                    value={<span className="text-[16px] font-semibold">{entry.name}</span>}
                  />
                </div>
                <InfoRow
                  label="Category"
                  value={
                    <Badge variant={categoryCfg.variant} size="lg">
                      {categoryCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Status"
                  value={
                    <Badge
                      variant={entry.status === 'active' ? 'success' : 'default'}
                      size="lg"
                      dot
                    >
                      {entry.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Contact Person"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-neutral-400" />
                      {entry.contactPerson}
                    </span>
                  }
                />
                <InfoRow
                  label="Phone"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-neutral-400" />
                      {entry.phone}
                    </span>
                  }
                />
                <InfoRow
                  label="Email"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-neutral-400" />
                      {entry.email}
                    </span>
                  }
                />
                <InfoRow
                  label="Location"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                      {entry.location}
                    </span>
                  }
                />
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Hours of Operation"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        {entry.hoursOfOperation}
                      </span>
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Notes"
                    value={<p className="leading-relaxed text-neutral-700">{entry.notes}</p>}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50">
                <MapPin className="h-8 w-8 text-neutral-300" />
                <p className="mt-2 text-[14px] font-medium text-neutral-500">{entry.location}</p>
                <p className="mt-1 text-[12px] text-neutral-400">Map view coming soon</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary">
                  <Edit2 className="h-4 w-4" />
                  Edit Entry
                </Button>
                <Button variant="secondary">
                  <Power className="h-4 w-4" />
                  Deactivate
                </Button>
                <Button variant="danger">
                  <Trash2 className="h-4 w-4" />
                  Delete Entry
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Related Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Related Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {entry.relatedEntries.map((related) => {
                  const relCfg = CATEGORY_CONFIG[related.category];
                  return (
                    <Link
                      key={related.id}
                      href={`/building-directory/${related.id}`}
                      className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 transition-colors hover:bg-neutral-100/50"
                    >
                      <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-lg">
                        <Building2 className="text-primary-600 h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-neutral-900">{related.name}</p>
                      </div>
                      <Badge variant={relCfg.variant} size="sm">
                        {relCfg.label}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
