'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Mail,
  Megaphone,
  Package,
  ShieldCheck,
  Calendar,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailModuleConfig {
  id: string;
  module: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  fromAddress: string;
  fromName: string;
  replyToAddress: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_MODULES: EmailModuleConfig[] = [
  {
    id: '1',
    module: 'General',
    icon: Mail,
    iconColor: 'text-neutral-600',
    iconBg: 'bg-neutral-100',
    fromAddress: 'info@harbourfront.concierge.app',
    fromName: 'The Residence at Harbourfront',
    replyToAddress: 'support@harbourfront.concierge.app',
  },
  {
    id: '2',
    module: 'Security',
    icon: ShieldCheck,
    iconColor: 'text-error-600',
    iconBg: 'bg-error-50',
    fromAddress: 'security@harbourfront.concierge.app',
    fromName: 'Harbourfront Security',
    replyToAddress: 'security@harbourfront.concierge.app',
  },
  {
    id: '3',
    module: 'Maintenance',
    icon: Wrench,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
    fromAddress: 'maintenance@harbourfront.concierge.app',
    fromName: 'Harbourfront Maintenance',
    replyToAddress: 'maintenance@harbourfront.concierge.app',
  },
  {
    id: '4',
    module: 'Packages',
    icon: Package,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
    fromAddress: 'packages@harbourfront.concierge.app',
    fromName: 'Harbourfront Packages',
    replyToAddress: 'concierge@harbourfront.concierge.app',
  },
  {
    id: '5',
    module: 'Amenities',
    icon: Calendar,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
    fromAddress: 'amenities@harbourfront.concierge.app',
    fromName: 'Harbourfront Amenities',
    replyToAddress: 'amenities@harbourfront.concierge.app',
  },
  {
    id: '6',
    module: 'Announcements',
    icon: Megaphone,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
    fromAddress: 'announcements@harbourfront.concierge.app',
    fromName: 'Harbourfront Announcements',
    replyToAddress: 'noreply@harbourfront.concierge.app',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailConfigurationPage() {
  const [modules] = useState(INITIAL_MODULES);
  const [globalCc, setGlobalCc] = useState('');
  const [emailSignature, setEmailSignature] = useState(
    'The Residence at Harbourfront\n225 Queens Quay West, Toronto, ON M5J 1B5\nPhone: (416) 555-0100\nwww.harbourfront-residence.ca',
  );
  const [deliveryFailureTracking, setDeliveryFailureTracking] = useState(true);

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
          Email Configuration
        </h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Configure per-module email addresses, signatures, and delivery settings.
        </p>
      </div>

      {/* Module Email Addresses */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Module Email Addresses
        </h2>
        <div className="flex flex-col gap-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card key={mod.id}>
                <CardContent>
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${mod.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-semibold text-neutral-900">{mod.module}</h3>
                      <p className="text-[13px] text-neutral-500">
                        Emails sent from the {mod.module.toLowerCase()} module
                      </p>
                    </div>
                    <Badge variant="success" size="md" dot>
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="From Address" type="email" defaultValue={mod.fromAddress} />
                      <Input label="From Name" defaultValue={mod.fromName} />
                    </div>
                    <Input
                      label="Reply-To Address"
                      type="email"
                      defaultValue={mod.replyToAddress}
                      helperText="Address recipients will reply to."
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Global CC */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Global CC Settings
        </h2>
        <Card>
          <CardContent>
            <Input
              label="Global CC Address"
              type="email"
              value={globalCc}
              onChange={(e) => setGlobalCc(e.target.value)}
              placeholder="management@example.com"
              helperText="If set, this address will be CC'd on all outgoing emails from every module."
            />
          </CardContent>
        </Card>
      </div>

      {/* Email Signature */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Email Signature
        </h2>
        <Card>
          <CardContent>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email-signature"
                className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
              >
                Signature Text
              </label>
              <textarea
                id="email-signature"
                rows={5}
                value={emailSignature}
                onChange={(e) => setEmailSignature(e.target.value)}
                className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 ease-out hover:border-neutral-300 focus:ring-4 focus:outline-none"
              />
              <p className="text-[13px] text-neutral-500">
                This signature is appended to all outgoing emails. Supports plain text only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Failure Tracking */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Delivery Settings
        </h2>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-warning-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Bell className="text-warning-600 h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-neutral-900">
                    Delivery Failure Tracking
                  </h3>
                  <p className="text-[13px] text-neutral-500">
                    Track bounced emails and failed deliveries. Get notified when emails cannot be
                    delivered.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={deliveryFailureTracking}
                onClick={() => setDeliveryFailureTracking(!deliveryFailureTracking)}
                className={`focus:ring-primary-100 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-4 focus:outline-none ${
                  deliveryFailureTracking ? 'bg-primary-500' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    deliveryFailureTracking ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="lg">Save Changes</Button>
      </div>
    </div>
  );
}
