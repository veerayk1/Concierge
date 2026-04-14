'use client';

/**
 * Edit Role Dialog
 *
 * Allows admin to edit role name, description, and permissions
 * organized by permission categories.
 */

import { useState, useCallback, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RoleData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: Record<string, string[]> | null;
  memberCount: number;
}

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleData;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Permission categories and available actions
// ---------------------------------------------------------------------------

const PERMISSION_CATEGORIES = [
  'Events',
  'Packages',
  'Maintenance',
  'Security',
  'Amenities',
  'Users',
  'Settings',
  'Reports',
  'Community',
  'Finance',
] as const;

const AVAILABLE_ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'approve'] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditRoleDialog({ open, onOpenChange, role, onSuccess }: EditRoleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Populate form when dialog opens or role changes
  useEffect(() => {
    if (open && role) {
      setName(role.name || '');
      setDescription(role.description || '');
      // Build permissions map from role data
      const perms: Record<string, string[]> = {};
      for (const cat of PERMISSION_CATEGORIES) {
        const key = cat.toLowerCase();
        const existing = role.permissions?.[key] ?? role.permissions?.[cat] ?? [];
        perms[key] = Array.isArray(existing) ? [...existing] : [];
      }
      setPermissions(perms);
      setFeedback(null);
    }
  }, [open, role]);

  const togglePermission = useCallback((category: string, action: string) => {
    setPermissions((prev) => {
      const key = category.toLowerCase();
      const current = prev[key] ?? [];
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [key]: next };
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!role?.id) return;

      setSaving(true);
      setFeedback(null);

      try {
        const resp = await apiRequest(`/api/v1/roles/${role.id}`, {
          method: 'PATCH',
          body: {
            name,
            description: description || null,
            permissions,
          },
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: (err as { message?: string }).message || 'Failed to update role.',
          });
          setSaving(false);
          return;
        }

        setFeedback({ type: 'success', message: 'Role updated successfully.' });
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1000);
      } catch {
        setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
      } finally {
        setSaving(false);
      }
    },
    [role, name, description, permissions, onOpenChange, onSuccess],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Shield className="text-primary-500 h-5 w-5" />
          Edit Role
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Update role details and configure permissions.
        </DialogDescription>

        {feedback && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-[14px] font-medium ${
              feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
            role="alert"
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
          {/* Name + Description */}
          <Input
            label="Role Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            placeholder="e.g. Front Desk Staff"
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              placeholder="Describe this role's responsibilities..."
              rows={2}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Permissions */}
          <div>
            <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Permissions
            </p>
            <div className="space-y-3">
              {PERMISSION_CATEGORIES.map((cat) => {
                const key = cat.toLowerCase();
                const currentActions = permissions[key] ?? [];
                return (
                  <div
                    key={cat}
                    className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-4 py-3"
                  >
                    <p className="mb-2 text-[14px] font-medium text-neutral-900">{cat}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                      {AVAILABLE_ACTIONS.map((action) => (
                        <Checkbox
                          key={action}
                          checked={currentActions.includes(action)}
                          onCheckedChange={() => togglePermission(cat, action)}
                          label={action.charAt(0).toUpperCase() + action.slice(1)}
                          id={`perm-${key}-${action}`}
                          disabled={saving}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 flex justify-end gap-3 border-t border-neutral-100 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
