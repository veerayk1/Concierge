'use client';

/**
 * Category Card — Review Dashboard Entity Card
 *
 * Shows one detected entity category with source files,
 * confidence, row count, validation summary, and import status.
 */

import {
  Building2,
  Users,
  CalendarDays,
  Key,
  Phone,
  Car,
  UserCog,
  Package,
  Wrench,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EntityType } from '@/lib/import/column-mapper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryCardProps {
  entityType: EntityType;
  sourceFiles: string[];
  confidence: number;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  status: 'ready' | 'needs_review' | 'errors' | 'imported';
  onReview: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENTITY_CONFIG: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  units: { label: 'Units', icon: Building2, color: 'text-blue-600 bg-blue-50' },
  residents: { label: 'Residents', icon: Users, color: 'text-violet-600 bg-violet-50' },
  properties: { label: 'Properties', icon: Building2, color: 'text-neutral-600 bg-neutral-50' },
  amenities: { label: 'Amenities', icon: CalendarDays, color: 'text-emerald-600 bg-emerald-50' },
  fobs: { label: 'FOBs / Keys', icon: Key, color: 'text-amber-600 bg-amber-50' },
  buzzer_codes: { label: 'Buzzer Codes', icon: Phone, color: 'text-cyan-600 bg-cyan-50' },
  parking_permits: { label: 'Parking Permits', icon: Car, color: 'text-orange-600 bg-orange-50' },
  staff: { label: 'Staff', icon: UserCog, color: 'text-indigo-600 bg-indigo-50' },
  packages: { label: 'Packages', icon: Package, color: 'text-rose-600 bg-rose-50' },
  maintenance_requests: { label: 'Maintenance', icon: Wrench, color: 'text-teal-600 bg-teal-50' },
  events: { label: 'Events', icon: Shield, color: 'text-purple-600 bg-purple-50' },
};

function getStatusBadge(status: CategoryCardProps['status']) {
  switch (status) {
    case 'ready':
      return (
        <Badge variant="success" size="sm">
          Ready to Import
        </Badge>
      );
    case 'needs_review':
      return (
        <Badge variant="warning" size="sm">
          Needs Review
        </Badge>
      );
    case 'errors':
      return (
        <Badge variant="error" size="sm">
          Errors Found
        </Badge>
      );
    case 'imported':
      return (
        <Badge variant="success" size="sm">
          Imported
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryCard({
  entityType,
  sourceFiles,
  confidence,
  totalRows,
  validRows,
  warningRows,
  errorRows,
  status,
  onReview,
}: CategoryCardProps) {
  const config = ENTITY_CONFIG[entityType] ?? {
    label: entityType,
    icon: Building2,
    color: 'text-neutral-600 bg-neutral-50',
  };
  const Icon = config.icon;
  const isImported = status === 'imported';

  return (
    <div
      className={`rounded-2xl border bg-white p-5 transition-all ${
        isImported
          ? 'border-green-200'
          : 'border-neutral-200/80 hover:border-neutral-300 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">{config.label}</h3>
            <p className="text-[12px] text-neutral-400">From: {sourceFiles.join(', ')}</p>
          </div>
        </div>
        {getStatusBadge(status)}
      </div>

      {/* Stats */}
      <div className="mb-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Badge variant="info" size="sm">
            {confidence}% match
          </Badge>
        </div>
        <span className="text-[13px] font-medium text-neutral-700">
          {totalRows.toLocaleString()} records found
        </span>
      </div>

      {/* Validation summary */}
      <div className="mb-4 flex items-center gap-3 text-[13px]">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-neutral-600">{validRows} valid</span>
        </span>
        {warningRows > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-neutral-600">{warningRows} warnings</span>
          </span>
        )}
        {errorRows > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-neutral-600">{errorRows} errors</span>
          </span>
        )}
      </div>

      {/* Action */}
      {isImported ? (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-[13px] font-medium text-green-700">Successfully imported</span>
        </div>
      ) : (
        <Button
          onClick={onReview}
          fullWidth
          variant={status === 'errors' ? 'secondary' : 'primary'}
        >
          Review & Import
        </Button>
      )}
    </div>
  );
}
