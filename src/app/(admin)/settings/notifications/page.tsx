'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

interface EventNotificationPref {
  id: string;
  eventType: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}

const INITIAL_PREFS: EventNotificationPref[] = [
  { id: '1', eventType: 'Package Arrival', email: true, sms: false, push: true },
  { id: '2', eventType: 'Visitor Entry', email: true, sms: false, push: true },
  { id: '3', eventType: 'Incident Report', email: true, sms: true, push: true },
  { id: '4', eventType: 'Key / FOB Activity', email: true, sms: false, push: false },
  { id: '5', eventType: 'Maintenance Update', email: true, sms: false, push: true },
  { id: '6', eventType: 'Amenity Booking', email: true, sms: false, push: false },
  { id: '7', eventType: 'Announcement', email: true, sms: true, push: true },
  { id: '8', eventType: 'Emergency Broadcast', email: true, sms: true, push: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState(INITIAL_PREFS);

  function togglePref(id: string, channel: 'email' | 'sms' | 'push') {
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p)));
  }

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
          Notification Settings
        </h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Configure notification channels, templates, and delivery preferences.
        </p>
      </div>

      {/* Email Provider */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Email Provider
        </h2>
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-primary-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Mail className="text-primary-600 h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-neutral-900">Resend</h3>
                <p className="text-[13px] text-neutral-500">Transactional email delivery service</p>
              </div>
              <Badge variant="success" size="md" dot>
                Connected
              </Badge>
            </div>
            <div className="space-y-4">
              <Input
                label="API Key"
                type="password"
                defaultValue="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                helperText="Your Resend API key. Keep this secret."
              />
              <Input
                label="From Address"
                type="email"
                defaultValue="notifications@harbourfront.concierge.app"
                helperText="Email address that notifications are sent from."
              />
              <Input
                label="Reply-To Address"
                type="email"
                defaultValue="support@harbourfront.concierge.app"
                helperText="Address residents can reply to."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMS Configuration */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          SMS Configuration
        </h2>
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-success-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <MessageSquare className="text-success-600 h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-neutral-900">Twilio</h3>
                <p className="text-[13px] text-neutral-500">SMS and voice notification delivery</p>
              </div>
              <Badge variant="success" size="md" dot>
                Connected
              </Badge>
            </div>
            <div className="space-y-4">
              <Input
                label="Account SID"
                defaultValue="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                helperText="Your Twilio Account SID."
              />
              <Input
                label="Auth Token"
                type="password"
                defaultValue="••••••••••••••••••••••••••••••••"
                helperText="Your Twilio Auth Token. Keep this secret."
              />
              <Input
                label="From Number"
                defaultValue="+14165551234"
                helperText="Twilio phone number used to send SMS."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Push Notifications */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Push Notifications
        </h2>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="bg-warning-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Smartphone className="text-warning-600 h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-neutral-900">Web Push (FCM)</h3>
                <p className="text-[13px] text-neutral-500">
                  Firebase Cloud Messaging for browser and mobile push notifications.
                </p>
              </div>
              <Badge variant="warning" size="md" dot>
                Not Configured
              </Badge>
            </div>
            <div className="mt-4">
              <Input
                label="Firebase Project ID"
                placeholder="my-concierge-project"
                helperText="Your Firebase project identifier."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Default Notification Preferences */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Default Notification Preferences
        </h2>
        <p className="mb-4 text-[13px] text-neutral-500">
          Set the default notification channels for each event type. Residents can override these in
          their profile.
        </p>
        <Card padding="none">
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/80">
                    <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                      Event Type
                    </th>
                    <th className="px-5 py-3 text-center text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                      Email
                    </th>
                    <th className="px-5 py-3 text-center text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                      SMS
                    </th>
                    <th className="px-5 py-3 text-center text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                      Push
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {prefs.map((pref) => (
                    <tr key={pref.id}>
                      <td className="px-5 py-3.5 text-[14px] font-medium text-neutral-900">
                        {pref.eventType}
                      </td>
                      {(['email', 'sms', 'push'] as const).map((channel) => (
                        <td key={channel} className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={pref[channel]}
                            onClick={() => togglePref(pref.id, channel)}
                            className={`focus:ring-primary-100 relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-4 focus:outline-none ${
                              pref[channel] ? 'bg-primary-500' : 'bg-neutral-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                pref[channel] ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
