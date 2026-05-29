'use client';

import { useState, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/hooks/use-api';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateRoleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setName('');
    setDescription('');
    setError(null);
    setSaving(false);
  }, []);

  const handleClose = useCallback(
    (next: boolean) => {
      if (!next && !saving) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset, saving],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmed = name.trim();
      if (trimmed.length < 2) {
        setError('Role name must be at least 2 characters.');
        return;
      }

      setSaving(true);
      try {
        const response = await apiRequest('/api/v1/roles', {
          method: 'POST',
          body: {
            propertyId,
            name: trimmed,
            description: description.trim() || undefined,
          },
        });
        if (!response.ok) {
          let message = 'Failed to create role.';
          try {
            const payload = await response.json();
            message = payload?.message || payload?.error?.message || message;
          } catch {
            // ignore parse error, keep default message
          }
          setError(message);
          setSaving(false);
          return;
        }
        reset();
        onOpenChange(false);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create role.');
        setSaving(false);
      }
    },
    [name, description, propertyId, onOpenChange, onSuccess, reset],
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <div className="flex items-start gap-3">
          <div className="bg-primary-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Shield className="text-primary-600 h-5 w-5" />
          </div>
          <div className="flex-1">
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Roles let you group permissions for staff and residents. You can refine permissions
              after the role is created.
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Role Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Building Engineer"
            maxLength={100}
            disabled={saving}
            autoFocus
          />
          <div className="flex flex-col gap-2">
            <label
              htmlFor="role-description"
              className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
            >
              Description
            </label>
            <textarea
              id="role-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this role is responsible for."
              rows={3}
              maxLength={500}
              disabled={saving}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 ease-out placeholder:text-neutral-400 focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-50"
            />
          </div>

          {error ? (
            <p className="text-error-600 text-[13px] font-medium" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleClose(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
