'use client';

/**
 * Category Card — Review Dashboard Entity Card
 *
 * Clean, professional card showing detected entity category with
 * source files, confidence, row count, validation summary, and actions.
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
  ArrowRight,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const ENTITY_CONFIG: Record<
  string,
  { label: string; icon: typeof Building2; bgColor: string; iconColor: string }
> = {
  units: { label: 'Units', icon: Building2, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
  residents: {
    label: 'Residents',
    icon: Users,
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  properties: {
    label: 'Properties',
    icon: Building2,
    bgColor: 'bg-neutral-50',
    iconColor: 'text-neutral-600',
  },
  amenities: {
    label: 'Amenities',
    icon: CalendarDays,
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  fobs: { label: 'FOBs / Keys', icon: Key, bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
  buzzer_codes: {
    label: 'Buzzer Codes',
    icon: Phone,
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
  },
  parking_permits: {
    label: 'Parking',
    icon: Car,
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  staff: { label: 'Staff', icon: UserCog, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  packages: { label: 'Packages', icon: Package, bgColor: 'bg-rose-50', iconColor: 'text-rose-600' },
  maintenance_requests: {
    label: 'Maintenance',
    icon: Wrench,
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  events: { label: 'Events', icon: Shield, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
};

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
    bgColor: 'bg-neutral-50',
    iconColor: 'text-neutral-600',
  };
  const Icon = config.icon;
  const isImported = status === 'imported';
  const cappedConfidence = Math.min(confidence, 100);

  return (
    <div
      className={`group rounded-2xl border bg-white transition-all ${
        isImported
          ? 'border-green-200 bg-green-50/30'
          : status === 'errors'
            ? 'border-red-200 hover:border-red-300 hover:shadow-md'
            : 'border-neutral-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      {/* Top section */}
      <div className="p-5 pb-0">
        {/* Icon + Title + Confidence */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.bgColor}`}
            >
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">{config.label}</h3>
              <p className="text-2xl font-bold text-neutral-900">
                {totalRows.toLocaleString()}
                <span className="ml-1 text-sm font-normal text-neutral-400">records</span>
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              cappedConfidence >= 90
                ? 'bg-green-100 text-green-700'
                : cappedConfidence >= 70
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {cappedConfidence}%
          </span>
        </div>

        {/* Source files */}
        <div className="mt-3 flex items-start gap-1.5">
          <FileText className="mt-0.5 h-3 w-3 flex-shrink-0 text-neutral-300" />
          <p className="text-xs leading-relaxed text-neutral-400">
            {sourceFiles.length === 1 ? sourceFiles[0] : `${sourceFiles.length} files`}
          </p>
        </div>
      </div>

      {/* Validation bar */}
      <div className="px-5 py-3">
        {/* Visual bar */}
        <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-neutral-100">
          {validRows > 0 && (
            <div className="bg-green-500" style={{ width: `${(validRows / totalRows) * 100}%` }} />
          )}
          {warningRows > 0 && (
            <div
              className="bg-amber-400"
              style={{ width: `${(warningRows / totalRows) * 100}%` }}
            />
          )}
          {errorRows > 0 && (
            <div className="bg-red-400" style={{ width: `${(errorRows / totalRows) * 100}%` }} />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {validRows} valid
          </span>
          {warningRows > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {warningRows} warnings
            </span>
          )}
          {errorRows > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              {errorRows} errors
            </span>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="border-t border-neutral-100 px-5 py-3">
        {isImported ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-700">Imported successfully</span>
          </div>
        ) : (
          <Button
            type="button"
            onClick={onReview}
            variant={status === 'errors' ? 'secondary' : 'primary'}
            size="sm"
            className="w-full"
          >
            Review & Import
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
