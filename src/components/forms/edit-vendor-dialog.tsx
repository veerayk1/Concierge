'use client';

/**
 * Edit Vendor Dialog
 *
 * Allows admin to edit vendor company name, contact info, services,
 * insurance status, and notes.
 */

import { useState, useCallback, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VendorData {
  id: string;
  name: string;
  category: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  licenseNumber: string;
  notes: string;
  insuranceStatus: string;
}

interface EditVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: VendorData;
  onSuccess?: () => void;
}

const INSURANCE_STATUSES = [
  { value: 'compliant', label: 'Compliant' },
  { value: 'non_compliant', label: 'Non-Compliant' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'not_tracking', label: 'Not Tracking' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditVendorDialog({ open, onOpenChange, vendor, onSuccess }: EditVendorDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insuranceStatus, setInsuranceStatus] = useState('not_tracking');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (open && vendor) {
      setName(vendor.name || '');
      setCategory(vendor.category || '');
      setContactName(vendor.contactName || '');
      setEmail(vendor.email || '');
      setPhone(vendor.phone || '');
      setAddress(vendor.address || '');
      setWebsite(vendor.website || '');
      setLicenseNumber(vendor.licenseNumber || '');
      setInsuranceStatus(vendor.insuranceStatus || 'not_tracking');
      setNotes(vendor.notes || '');
      setFeedback(null);
    }
  }, [open, vendor]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!vendor?.id) return;

      setSaving(true);
      setFeedback(null);

      try {
        const resp = await apiRequest(`/api/v1/vendors/${vendor.id}`, {
          method: 'PATCH',
          body: {
            name,
            category,
            contactName: contactName || null,
            email: email || null,
            phone: phone || null,
            address: address || null,
            website: website || null,
            licenseNumber: licenseNumber || null,
            insuranceStatus,
            notes: notes || null,
          },
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: (err as { message?: string }).message || 'Failed to update vendor.',
          });
          setSaving(false);
          return;
        }

        setFeedback({ type: 'success', message: 'Vendor updated successfully.' });
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
    [
      vendor,
      name,
      category,
      contactName,
      email,
      phone,
      address,
      website,
      licenseNumber,
      insuranceStatus,
      notes,
      onOpenChange,
      onSuccess,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Building2 className="text-primary-500 h-5 w-5" />
          Edit Vendor
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Update vendor details, contact information, and compliance status.
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
          {/* Company Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={saving}
              placeholder="e.g. Plumbing"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              disabled={saving}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
            />
            <Input
              label="License Number"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              disabled={saving}
            />
          </div>

          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={saving}
          />

          <Input
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={saving}
            placeholder="https://"
          />

          {/* Insurance Status */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Insurance Status</label>
            <select
              value={insuranceStatus}
              onChange={(e) => setInsuranceStatus(e.target.value)}
              disabled={saving}
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
            >
              {INSURANCE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              placeholder="Any additional notes about this vendor..."
              rows={3}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
            />
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
