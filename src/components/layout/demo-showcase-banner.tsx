'use client';

import { useEffect, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { ROLE_DISPLAY_NAMES } from '@/lib/navigation';
import type { Role } from '@/types';
import { DEFAULT_DEMO_PROPERTY_ID, DEMO_PROPERTY_NAME } from '@/lib/demo-config';

const SWITCHABLE_ROLES: Role[] = [
  'property_manager',
  'front_desk',
  'security_guard',
  'maintenance_staff',
  'resident_owner',
  'board_member',
  'property_admin',
  'security_supervisor',
  'superintendent',
  'resident_tenant',
];

export function DemoShowcaseBanner() {
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('demo_role') as Role | null;
    setCurrentRole(role);
  }, []);

  if (!currentRole) return null;

  function exitDemo() {
    localStorage.setItem('demo_role', 'super_admin');
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('demo_return_role');
    window.location.href = '/system/demo';
  }

  function switchRole(role: Role) {
    localStorage.setItem('demo_role', role);
    localStorage.setItem('demo_propertyId', DEFAULT_DEMO_PROPERTY_ID);
    setCurrentRole(role);
    setDropdownOpen(false);
    window.location.href = '/dashboard';
  }

  return (
    <div className="relative z-50 flex h-10 items-center justify-between border-b border-amber-300 bg-amber-50 px-4">
      <div className="flex items-center gap-3">
        <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-800 uppercase">
          Demo
        </span>
        <span className="text-[13px] text-amber-800">
          Viewing as <strong>{ROLE_DISPLAY_NAMES[currentRole] ?? currentRole}</strong>
          {' at '}
          {DEMO_PROPERTY_NAME}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Persona switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[12px] font-medium text-amber-800 transition-colors hover:bg-amber-100"
          >
            Switch Persona
            <ChevronDown className="h-3 w-3" />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute top-full right-0 z-50 mt-1 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                {SWITCHABLE_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => switchRole(role)}
                    className={`flex w-full items-center px-3 py-2 text-left text-[12px] transition-colors hover:bg-neutral-50 ${
                      role === currentRole
                        ? 'bg-amber-50 font-semibold text-amber-700'
                        : 'text-neutral-700'
                    }`}
                  >
                    {ROLE_DISPLAY_NAMES[role]}
                    {role === currentRole && (
                      <span className="ml-auto text-[10px] text-amber-500">current</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Exit Demo */}
        <button
          type="button"
          onClick={exitDemo}
          className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-200 px-2.5 py-1 text-[12px] font-semibold text-amber-900 transition-colors hover:bg-amber-300"
        >
          <X className="h-3 w-3" />
          Exit Demo
        </button>
      </div>
    </div>
  );
}
