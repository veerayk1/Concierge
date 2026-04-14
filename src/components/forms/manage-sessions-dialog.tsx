'use client';

/**
 * Manage Sessions Dialog — view and revoke active sessions.
 * Shows device, IP, last active time for each session.
 */

import { useState, useCallback } from 'react';
import { Globe, Monitor, Smartphone, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApi, apiRequest } from '@/lib/hooks/use-api';

interface SessionData {
  id: string;
  device: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
}

interface ManageSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

function getDeviceIcon(device: string) {
  const lower = device.toLowerCase();
  if (lower.includes('iphone') || lower.includes('android') || lower.includes('mobile')) {
    return <Smartphone className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
}

function timeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function ManageSessionsDialog({ open, onOpenChange, userId }: ManageSessionsDialogProps) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const {
    data: sessionsData,
    loading,
    error,
    refetch,
  } = useApi<{ data: SessionData[] }>(open ? `/api/v1/users/${userId}/sessions` : null);

  const sessions: SessionData[] =
    sessionsData?.data ??
    (Array.isArray(sessionsData) ? (sessionsData as unknown as SessionData[]) : []);

  const handleRevoke = useCallback(
    async (sessionId: string) => {
      setRevoking(sessionId);
      setFeedback(null);
      try {
        const resp = await apiRequest(`/api/v1/users/${userId}/sessions?sessionId=${sessionId}`, {
          method: 'DELETE',
        });
        if (resp.ok) {
          setFeedback({ type: 'success', message: 'Session revoked.' });
          refetch();
        } else {
          setFeedback({ type: 'error', message: 'Failed to revoke session.' });
        }
      } catch {
        setFeedback({ type: 'error', message: 'An error occurred.' });
      } finally {
        setRevoking(null);
      }
    },
    [userId, refetch],
  );

  const handleRevokeAll = useCallback(async () => {
    setRevokingAll(true);
    setFeedback(null);
    try {
      const resp = await apiRequest(`/api/v1/users/${userId}/sessions`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        setFeedback({ type: 'success', message: 'All sessions revoked. You will be logged out.' });
        refetch();
        // Log out after brief delay
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }, 2000);
      } else {
        setFeedback({ type: 'error', message: 'Failed to revoke sessions.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An error occurred.' });
    } finally {
      setRevokingAll(false);
    }
  }, [userId, refetch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Globe className="text-primary-500 h-5 w-5" />
          Active Sessions
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          These devices are currently signed in to your account. Revoke any session you don't
          recognize.
        </DialogDescription>

        {feedback && (
          <div
            className={`mt-3 rounded-lg px-4 py-3 text-[14px] font-medium ${
              feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
            role="alert"
          >
            {feedback.message}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-primary-500 h-6 w-6 animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertTriangle className="h-5 w-5 text-neutral-400" />
              <p className="text-[14px] text-neutral-500">Failed to load sessions.</p>
              <Button variant="secondary" size="sm" onClick={refetch}>
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <p className="py-6 text-center text-[14px] text-neutral-500">
              No active sessions found.
            </p>
          )}

          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                  {getDeviceIcon(session.device)}
                </div>
                <div>
                  <p className="text-[14px] font-medium text-neutral-900">{session.device}</p>
                  <div className="flex items-center gap-2 text-[12px] text-neutral-400">
                    <span>{session.ipAddress}</span>
                    <span>Last active {timeAgo(session.lastActive)}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevoke(session.id)}
                disabled={revoking === session.id || revokingAll}
                className="text-neutral-400 hover:text-red-600"
              >
                {revoking === session.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>

        {sessions.length > 1 && (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <Button
              variant="danger"
              size="sm"
              onClick={handleRevokeAll}
              disabled={revokingAll}
              fullWidth
            >
              {revokingAll ? 'Revoking all...' : 'Revoke All Sessions'}
            </Button>
            <p className="mt-2 text-center text-[12px] text-neutral-400">
              This will sign you out of all devices, including this one.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
