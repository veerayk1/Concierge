'use client';

import { use, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
  ImageIcon,
  Link2,
  Loader2,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Printer,
  Save,
  Send,
  Settings,
  ShieldAlert,
  User,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MaintenanceDetail {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  permissionToEnter: boolean | string;
  entryInstructions: string | null;
  createdAt: string;
  updatedAt: string;
  residentId: string | null;
  assignedEmployeeId: string | null;
  assignedVendorId: string | null;
  completedDate: string | null;
  unit: { id: string; number: string } | null;
  category: { id: string; name: string } | null;
}

interface MaintenanceComment {
  id: string;
  requestId: string;
  authorId: string;
  body: string;
  visibleToResident: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Timeline icon helper
// ---------------------------------------------------------------------------

function getTimelineIcon(action: string) {
  switch (action) {
    case 'created':
      return <Wrench className="text-primary-600 h-3.5 w-3.5" />;
    case 'notification':
      return <Bell className="text-info-600 h-3.5 w-3.5" />;
    case 'assigned':
      return <User className="text-warning-600 h-3.5 w-3.5" />;
    case 'comment':
      return <MessageSquare className="h-3.5 w-3.5 text-neutral-500" />;
    case 'resolved':
      return <CheckCircle2 className="text-success-600 h-3.5 w-3.5" />;
    case 'closed':
      return <XCircle className="h-3.5 w-3.5 text-neutral-400" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-neutral-400" />;
  }
}

// ---------------------------------------------------------------------------
// SLA helpers
// ---------------------------------------------------------------------------

function getSlaVariant(status: string): 'success' | 'warning' | 'error' {
  switch (status) {
    case 'on_track':
      return 'success';
    case 'at_risk':
      return 'warning';
    case 'breached':
      return 'error';
    default:
      return 'success';
  }
}

function getSlaLabel(status: string): string {
  switch (status) {
    case 'on_track':
      return 'On Track';
    case 'at_risk':
      return 'At Risk';
    case 'breached':
      return 'Breached';
    default:
      return status;
  }
}

// ---------------------------------------------------------------------------
// SLA calculation (client-side)
// ---------------------------------------------------------------------------

function computeSla(createdAt: string, priority: string) {
  const targetHours =
    priority === 'urgent' ? 4 : priority === 'high' ? 24 : priority === 'medium' ? 48 : 72;
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
  const remainingHours = Math.max(0, targetHours - elapsedHours);
  const pct = Math.min(100, (elapsedHours / targetHours) * 100);
  let status: 'on_track' | 'at_risk' | 'breached' = 'on_track';
  if (remainingHours <= 0) status = 'breached';
  else if (pct >= 75) status = 'at_risk';
  return { targetHours, elapsedHours, remainingHours, pct, status };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MaintenanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MaintenanceDetailPage({ params }: MaintenanceDetailPageProps) {
  const { id } = use(params);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [closingRequest, setClosingRequest] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch maintenance request detail
  const {
    data: req,
    loading,
    error,
    refetch,
  } = useApi<MaintenanceDetail>(`/api/v1/maintenance/${id}`);

  // Fetch comments
  const {
    data: commentsData,
    loading: commentsLoading,
    refetch: refetchComments,
  } = useApi<MaintenanceComment[]>(`/api/v1/maintenance/${id}/comments`);

  const comments = useMemo(() => {
    if (!commentsData) return [];
    return Array.isArray(commentsData) ? commentsData : [];
  }, [commentsData]);

  // -----------------------------------------------------------------------
  // Status update handler
  // -----------------------------------------------------------------------
  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!req || newStatus === req.status) return;
      setUpdatingStatus(true);
      setStatusError(null);
      setStatusSuccess(null);
      try {
        // Build payload — some transitions require extra fields
        const payload: Record<string, unknown> = { status: newStatus };
        if (newStatus === 'on_hold') {
          const reason = window.prompt('Enter a reason for putting this request on hold:');
          if (!reason) {
            setUpdatingStatus(false);
            return;
          }
          payload.holdReason = reason;
        }
        if (newStatus === 'completed') {
          const notes = window.prompt('Enter resolution notes:');
          if (!notes) {
            setUpdatingStatus(false);
            return;
          }
          payload.resolutionNotes = notes;
        }
        const response = await apiRequest(`/api/v1/maintenance/${id}`, {
          method: 'PATCH',
          body: payload,
        });
        if (response.ok) {
          setStatusSuccess(`Status updated to ${newStatus.replace('_', ' ')}`);
          refetch();
          setTimeout(() => setStatusSuccess(null), 3000);
        } else {
          const result = await response.json().catch(() => ({}));
          setStatusError(result.message || `Failed to update status to ${newStatus}`);
        }
      } catch {
        setStatusError('Network error. Please try again.');
      } finally {
        setUpdatingStatus(false);
      }
    },
    [req, id, refetch],
  );

  // -----------------------------------------------------------------------
  // Close request handler (convenience button)
  // -----------------------------------------------------------------------
  const handleCloseRequest = useCallback(async () => {
    if (!req) return;
    const confirmed = window.confirm('Are you sure you want to close this request?');
    if (!confirmed) return;
    setClosingRequest(true);
    setStatusError(null);
    try {
      const response = await apiRequest(`/api/v1/maintenance/${id}`, {
        method: 'PATCH',
        body: { status: 'closed' },
      });
      if (response.ok) {
        refetch();
      } else {
        const result = await response.json().catch(() => ({}));
        setStatusError(result.message || 'Failed to close request');
      }
    } catch {
      setStatusError('Network error. Please try again.');
    } finally {
      setClosingRequest(false);
    }
  }, [req, id, refetch]);

  // -----------------------------------------------------------------------
  // File upload handler (photo or attachment)
  // -----------------------------------------------------------------------
  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      try {
        // Step 1: Get presigned URL
        const presignRes = await apiRequest('/api/v1/upload', {
          method: 'POST',
          body: {
            module: 'maintenance',
            fileName: file.name,
            contentType: file.type,
          },
        });

        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({}));
          setUploadError(err.message || 'Failed to initiate upload');
          return;
        }

        const presignData = await presignRes.json();
        const { url, key, fields } = presignData.data || {};

        if (!url || !key) {
          setUploadError('Upload service not configured. File not uploaded.');
          return;
        }

        // Step 2: Upload file to presigned URL (S3)
        if (fields && Object.keys(fields).length > 0) {
          // Multipart form upload (S3 POST)
          const formData = new FormData();
          Object.entries(fields).forEach(([k, v]) => formData.append(k, v as string));
          formData.append('file', file);
          const uploadRes = await fetch(url, { method: 'POST', body: formData });
          if (!uploadRes.ok) {
            setUploadError('Failed to upload file to storage');
            return;
          }
        } else {
          // Direct PUT upload
          const uploadRes = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });
          if (!uploadRes.ok) {
            setUploadError('Failed to upload file to storage');
            return;
          }
        }

        // Step 3: Attach the uploaded file to the maintenance request
        const attachRes = await apiRequest(`/api/v1/maintenance/${id}`, {
          method: 'PATCH',
          body: {
            attachments: [
              {
                key,
                fileName: file.name,
                contentType: file.type,
                fileSizeBytes: file.size,
              },
            ],
          },
        });

        if (attachRes.ok) {
          refetch();
        } else {
          const err = await attachRes.json().catch(() => ({}));
          setUploadError(err.message || 'File uploaded but failed to attach to request');
        }
      } catch {
        setUploadError('Network error during upload. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [id, refetch],
  );

  const handlePhotoInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = '';
    },
    [handleFileUpload],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = '';
    },
    [handleFileUpload],
  );

  // -----------------------------------------------------------------------
  // Edit mode handlers
  // -----------------------------------------------------------------------
  const startEditing = useCallback(() => {
    if (!req) return;
    setEditing(true);
    setEditDescription(req.description || '');
    setEditPriority(req.priority || 'medium');
    setEditError(null);
  }, [req]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    setEditError(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!req) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (editDescription.trim() !== req.description) {
        if (editDescription.trim().length < 10) {
          setEditError('Description must be at least 10 characters');
          setSavingEdit(false);
          return;
        }
        payload.description = editDescription.trim();
      }
      if (editPriority !== req.priority) {
        payload.priority = editPriority;
      }
      if (Object.keys(payload).length === 0) {
        setEditing(false);
        setSavingEdit(false);
        return;
      }
      const response = await apiRequest(`/api/v1/maintenance/${id}`, {
        method: 'PATCH',
        body: payload,
      });
      if (response.ok) {
        setEditing(false);
        refetch();
      } else {
        const result = await response.json().catch(() => ({}));
        setEditError(result.message || 'Failed to save changes');
      }
    } catch {
      setEditError('Network error. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  }, [req, id, editDescription, editPriority, refetch]);

  // Submit a new comment
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const response = await apiRequest(`/api/v1/maintenance/${id}/comments`, {
        method: 'POST',
        body: { body: commentText.trim(), visibleToResident: true },
      });
      if (response.ok) {
        setCommentText('');
        refetchComments();
      }
    } catch {
      // error silently handled; user can retry
    } finally {
      setSubmittingComment(false);
    }
  };

  const statusMap = {
    open: { variant: 'warning' as const, label: 'Open' },
    assigned: { variant: 'info' as const, label: 'Assigned' },
    in_progress: { variant: 'primary' as const, label: 'In Progress' },
    on_hold: { variant: 'default' as const, label: 'On Hold' },
    resolved: { variant: 'success' as const, label: 'Resolved' },
    closed: { variant: 'default' as const, label: 'Closed' },
  };
  const priorityMap = {
    low: { variant: 'default' as const, label: 'Low' },
    medium: { variant: 'warning' as const, label: 'Medium' },
    high: { variant: 'error' as const, label: 'High' },
    urgent: { variant: 'error' as const, label: 'Urgent' },
  };

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
        <p className="mt-3 text-[14px] text-neutral-500">Loading request details...</p>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------
  if (error || !req) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="mt-3 text-[14px] font-medium text-red-700">{error || 'Request not found'}</p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/maintenance"
            className="text-primary-600 hover:text-primary-700 text-[14px] font-medium"
          >
            Back to requests
          </Link>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------
  const status = statusMap[req.status] || statusMap.open;
  const priority = priorityMap[req.priority] || priorityMap.medium;
  const reportedDate = new Date(req.createdAt);
  const sla = computeSla(req.createdAt, req.priority);
  const permissionToEnter = req.permissionToEnter === true || req.permissionToEnter === 'yes';
  const unitNumber = req.unit?.number || '';
  const categoryName = req.category?.name || 'General';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/maintenance"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to requests
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
              Request {req.referenceNumber}
            </h1>
            <Badge variant={status.variant} size="lg" dot>
              {status.label}
            </Badge>
            <Badge variant={priority.variant} size="lg" dot>
              {priority.label} Priority
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="secondary" size="sm" onClick={cancelEditing} disabled={savingEdit}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={startEditing}>
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print Work Order
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column: Details */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Request Details */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Request Details</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Reference Number
                  </p>
                  <p className="mt-1 font-mono text-[15px] font-medium text-neutral-900">
                    {req.referenceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Category
                  </p>
                  <p className="mt-1">
                    <Badge variant="default" size="md">
                      {categoryName}
                    </Badge>
                  </p>
                </div>
                {req.title && (
                  <div className="col-span-2">
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Title
                    </p>
                    <p className="mt-1 text-[15px] font-medium text-neutral-900">{req.title}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Description
                  </p>
                  {editing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                      {req.description}
                    </p>
                  )}
                </div>
                {editError && (
                  <div className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
                    {editError}
                  </div>
                )}
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Unit
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {unitNumber ? `Unit ${unitNumber}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Reported By
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">{req.residentId || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Date Reported
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {reportedDate.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Permission to Enter
                  </p>
                  <p className="mt-1">
                    <Badge variant={permissionToEnter ? 'success' : 'error'} size="md" dot>
                      {permissionToEnter ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                </div>
                {req.entryInstructions && (
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Entry Instructions
                    </p>
                    <p className="mt-1 text-[15px] text-neutral-700">{req.entryInstructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photos / Attachments */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Photos / Attachments</h2>
            </div>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-neutral-400" />
                  )}
                </div>
                <p className="mt-3 text-[13px] font-medium text-neutral-500">
                  {uploading ? 'Uploading file...' : 'No photos or attachments yet'}
                </p>
                {uploadError && <p className="mt-2 text-[12px] text-red-600">{uploadError}</p>}
                <div className="mt-3 flex gap-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/heic"
                    className="hidden"
                    onChange={handlePhotoInputChange}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={uploading}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    Upload Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                    Attach File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Thread */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Comments ({comments.length})
              </h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-4">
                {commentsLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                    <span className="ml-2 text-[13px] text-neutral-500">Loading comments...</span>
                  </div>
                )}

                {!commentsLoading && comments.length === 0 && (
                  <div className="flex flex-col items-center py-6">
                    <MessageSquare className="h-6 w-6 text-neutral-300" />
                    <p className="mt-2 text-[13px] text-neutral-400">No comments yet</p>
                  </div>
                )}

                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary-100 text-primary-700 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="text-[13px] font-semibold text-neutral-900">
                            {comment.authorId}
                          </span>
                        </div>
                      </div>
                      <span className="text-[12px] text-neutral-400">
                        {new Date(comment.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">
                      {comment.body}
                    </p>
                  </div>
                ))}

                {/* Add Comment */}
                <div className="mt-2 border-t border-neutral-200 pt-4">
                  <Textarea
                    label="Add a comment"
                    placeholder="Type your comment here..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      disabled={!commentText.trim() || submittingComment}
                      onClick={handleSubmitComment}
                    >
                      {submittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {submittingComment ? 'Submitting...' : 'Submit Comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions, Assignment, SLA, Related, Timeline */}
        <div className="flex flex-col gap-6">
          {/* Actions */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
            <CardContent>
              <div className="flex flex-col gap-3">
                {/* Update Status */}
                <div>
                  <p className="mb-1.5 text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Update Status
                  </p>
                  <select
                    value={req.status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="focus:ring-primary-500 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-700 focus:ring-2 focus:outline-none disabled:opacity-50"
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  {updatingStatus && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-neutral-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Updating status...
                    </div>
                  )}
                  {statusSuccess && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-green-600">
                      <Check className="h-3 w-3" />
                      {statusSuccess}
                    </div>
                  )}
                  {statusError && (
                    <div className="mt-1.5 text-[12px] text-red-600">{statusError}</div>
                  )}
                </div>

                {/* Assign Staff */}
                <div>
                  <p className="mb-1.5 text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Assign Staff
                  </p>
                  <select className="focus:ring-primary-500 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-700 focus:ring-2 focus:outline-none">
                    <option value="">Select staff member...</option>
                  </select>
                </div>

                {/* Assign Vendor */}
                <div>
                  <p className="mb-1.5 text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Assign Vendor
                  </p>
                  <select className="focus:ring-primary-500 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-700 focus:ring-2 focus:outline-none">
                    <option value="">Select vendor...</option>
                  </select>
                </div>

                {/* Schedule Date */}
                <div>
                  <p className="mb-1.5 text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Schedule Date
                  </p>
                  <input
                    type="date"
                    className="focus:ring-primary-500 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-700 focus:ring-2 focus:outline-none"
                  />
                </div>

                <div className="mt-1 flex flex-col gap-2">
                  <Button variant="secondary" fullWidth onClick={() => window.print()}>
                    <Printer className="h-4 w-4" />
                    Print Work Order
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    disabled={closingRequest || req.status === 'closed'}
                    onClick={handleCloseRequest}
                  >
                    {closingRequest ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {closingRequest ? 'Closing...' : 'Close Request'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Card */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Currently Assigned</h2>
            </div>
            <CardContent>
              {req.assignedEmployeeId ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 text-primary-700 flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-neutral-900">
                        {req.assignedEmployeeId}
                      </p>
                      <p className="text-[12px] text-neutral-500">Assigned Staff</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <User className="h-8 w-8 text-neutral-300" />
                  <p className="mt-2 text-[13px] text-neutral-400">Not yet assigned</p>
                </div>
              )}
              {req.assignedVendorId && (
                <div className="mt-3 border-t border-neutral-200 pt-3">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Vendor
                  </p>
                  <p className="mt-1 text-[14px] font-medium text-neutral-900">
                    {req.assignedVendorId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA Tracking */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">SLA Tracking</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Status
                  </span>
                  <Badge variant={getSlaVariant(sla.status)} size="lg" dot>
                    {getSlaLabel(sla.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Reported
                  </span>
                  <span className="text-[13px] text-neutral-700">
                    {reportedDate.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Target Resolution
                  </span>
                  <span className="text-[13px] text-neutral-700">{sla.targetHours}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Time Elapsed
                  </span>
                  <span className="text-[13px] font-semibold text-neutral-900">
                    {sla.elapsedHours}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Remaining
                  </span>
                  <span
                    className={`text-[13px] font-semibold ${
                      sla.remainingHours <= 0
                        ? 'text-error-600'
                        : sla.remainingHours <= 12
                          ? 'text-warning-600'
                          : 'text-success-600'
                    }`}
                  >
                    {sla.remainingHours}h
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-1">
                  <div className="h-2 w-full rounded-full bg-neutral-100">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        sla.status === 'breached'
                          ? 'bg-error-500'
                          : sla.status === 'at_risk'
                            ? 'bg-warning-500'
                            : 'bg-success-500'
                      }`}
                      style={{ width: `${sla.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
