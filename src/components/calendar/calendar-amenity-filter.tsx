'use client';

/**
 * Calendar Amenity Filter Sidebar — checkbox list grouped by amenity group
 * Each amenity row shows: color dot + icon + name
 */

import { getAmenityIcon } from './amenity-icon-map';
import type { CalendarAmenity } from './calendar-types';

interface CalendarAmenityFilterProps {
  amenities: CalendarAmenity[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onDeselectAll: () => void;
}

export function CalendarAmenityFilter({
  amenities,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: CalendarAmenityFilterProps) {
  // Group amenities by group name
  const groups = new Map<string, CalendarAmenity[]>();
  for (const a of amenities) {
    const group = a.groupName || 'Other';
    const existing = groups.get(group) ?? [];
    existing.push(a);
    groups.set(group, existing);
  }

  const allIds = amenities.map((a) => a.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const noneSelected = allIds.length > 0 && allIds.every((id) => !selectedIds.has(id));

  return (
    <div className="w-[240px] shrink-0 border-r border-neutral-200 pr-5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Filter by Amenity
        </h3>
      </div>

      {/* Quick actions */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onSelectAll(allIds)}
          disabled={allSelected}
          className="text-[12px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-40"
        >
          Select All
        </button>
        <span className="text-[12px] text-neutral-300">|</span>
        <button
          type="button"
          onClick={onDeselectAll}
          disabled={noneSelected}
          className="text-[12px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-40"
        >
          Deselect All
        </button>
      </div>

      {/* Grouped amenity checkboxes */}
      <div className="flex flex-col gap-5">
        {Array.from(groups.entries()).map(([groupName, groupAmenities]) => (
          <div key={groupName}>
            <p className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-neutral-400 uppercase">
              {groupName}
            </p>
            <div className="flex flex-col gap-1">
              {groupAmenities.map((amenity) => (
                <label
                  key={amenity.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(amenity.id)}
                    onChange={() => onToggle(amenity.id)}
                    className="text-primary-500 focus:ring-primary-100 h-3.5 w-3.5 rounded border-neutral-300 transition-colors"
                  />
                  {/* Color dot */}
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: amenity.color }}
                  />
                  {/* Icon */}
                  <span className="shrink-0 text-neutral-400">
                    {getAmenityIcon(amenity.name, 'h-3.5 w-3.5')}
                  </span>
                  {/* Name */}
                  <span className="truncate text-[13px] font-medium text-neutral-700">
                    {amenity.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
