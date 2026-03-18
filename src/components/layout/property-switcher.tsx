'use client';

/**
 * Concierge — Property Switcher
 *
 * Dropdown showing the current property name with a list of all properties
 * the user has access to. Switching updates context and refreshes data.
 *
 * Per PRD 02 Section "Multi-Property Role Model": users with multiple
 * property assignments see this switcher. Switching changes the active
 * property context, reloads the sidebar for the new role, and redirects
 * to the appropriate dashboard.
 *
 * @module components/layout/property-switcher
 */

import { Building2, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PropertyInfo {
  id: string;
  name: string;
  address: string;
}

export interface PropertySwitcherProps {
  /** Currently active property */
  currentProperty: PropertyInfo;
  /** All properties the user has access to */
  properties: PropertyInfo[];
  /** Callback when user switches to a different property */
  onSwitch: (propertyId: string) => void;
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PropertySwitcher({
  currentProperty,
  properties,
  onSwitch,
  collapsed = false,
  className,
}: PropertySwitcherProps) {
  // Only show if user has access to 2+ properties
  if (properties.length < 2) {
    // Still show the current property name (non-interactive)
    return (
      <div
        className={cn(
          'flex items-center gap-2 border-b border-neutral-200 px-4 py-3',
          collapsed && 'justify-center px-2',
          className,
        )}
      >
        <Building2 className="h-4 w-4 shrink-0 text-neutral-400" />
        {!collapsed && (
          <span className="truncate text-sm font-medium text-neutral-700">
            {currentProperty.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('border-b border-neutral-200 px-3 py-2', collapsed && 'px-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-50',
              collapsed && 'justify-center px-0',
            )}
            aria-label={`Current property: ${currentProperty.name}. Switch property.`}
          >
            <Building2 className="h-4 w-4 shrink-0 text-neutral-400" />
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-700">
                    {currentProperty.name}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side={collapsed ? 'right' : 'bottom'} className="w-64">
          <DropdownMenuLabel>Switch Property</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {properties.map((property) => {
            const isCurrent = property.id === currentProperty.id;
            return (
              <DropdownMenuItem
                key={property.id}
                onSelect={() => {
                  if (!isCurrent) {
                    onSwitch(property.id);
                  }
                }}
                className="flex items-center gap-3"
              >
                <Building2 className="h-4 w-4 shrink-0 text-neutral-400" />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm',
                      isCurrent ? 'text-primary-600 font-semibold' : 'text-neutral-700',
                    )}
                  >
                    {property.name}
                  </p>
                  <p className="truncate text-xs text-neutral-400">{property.address}</p>
                </div>
                {isCurrent && <Check className="text-primary-600 h-4 w-4 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
