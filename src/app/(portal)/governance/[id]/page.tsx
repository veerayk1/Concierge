'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileText,
  MapPin,
  Upload,
  Users,
  X as XIcon,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MeetingType = 'regular' | 'special' | 'agm' | 'emergency';
type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
type AgendaItemStatus = 'discussed' | 'pending' | 'tabled';
type ResolutionStatus = 'passed' | 'failed' | 'tabled';

interface AgendaItem {
  id: string;
  order: number;
  title: string;
  presenter: string;
  duration: string;
  status: AgendaItemStatus;
}

interface MeetingResolution {
  id: string;
  number: string;
  title: string;
  status: ResolutionStatus;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
}

interface MeetingDocument {
  id: string;
  name: string;
  type: string;
  size: string;
}

interface BoardMeeting {
  id: string;
  title: string;
  type: MeetingType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: MeetingStatus;
  minutes: string | null;
  totalInvited: number;
  present: number;
  absent: number;
  quorumMet: boolean;
  agendaItems: AgendaItem[];
  resolutions: MeetingResolution[];
  documents: MeetingDocument[];
  nextMeetingDate: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_MEETING: BoardMeeting = {
  id: '1',
  title: 'Q1 2026 Board Meeting',
  type: 'regular',
  date: '2026-01-22',
  startTime: '7:00 PM',
  endTime: '9:15 PM',
  location: 'Party Room A, Ground Floor',
  status: 'completed',
  minutes:
    "The meeting was called to order at 7:02 PM by the Board President, Janet Wu. A quorum was confirmed with 5 of 7 board members present. The agenda was approved unanimously.\n\nThe Property Manager presented the Q4 2025 financial report, noting that the operating budget was 3.2% under target. Reserve fund contributions are on track. The board discussed the upcoming lobby renovation project and approved the contractor selection committee's recommendation to proceed with Apex Design Group. The landscape maintenance contract renewal was tabled pending additional quotes.\n\nResident concerns regarding parking enforcement were discussed. The board directed management to increase signage and begin issuing warnings for repeat violators. The meeting was adjourned at 9:12 PM.",
  totalInvited: 7,
  present: 5,
  absent: 2,
  quorumMet: true,
  agendaItems: [
    {
      id: 'ai-1',
      order: 1,
      title: 'Approval of Previous Meeting Minutes',
      presenter: 'Janet Wu',
      duration: '5 min',
      status: 'discussed',
    },
    {
      id: 'ai-2',
      order: 2,
      title: 'Q4 2025 Financial Report Review',
      presenter: 'Michael Torres',
      duration: '20 min',
      status: 'discussed',
    },
    {
      id: 'ai-3',
      order: 3,
      title: 'Lobby Renovation Project Update',
      presenter: 'Sarah Kim',
      duration: '25 min',
      status: 'discussed',
    },
    {
      id: 'ai-4',
      order: 4,
      title: 'Landscape Maintenance Contract Renewal',
      presenter: 'David Okonkwo',
      duration: '15 min',
      status: 'tabled',
    },
    {
      id: 'ai-5',
      order: 5,
      title: 'Resident Parking Concerns',
      presenter: 'Janet Wu',
      duration: '15 min',
      status: 'discussed',
    },
  ],
  resolutions: [
    {
      id: 'res-1',
      number: 'RES-2026-003',
      title: 'Approve Apex Design Group for Lobby Renovation',
      status: 'passed',
      votesFor: 4,
      votesAgainst: 1,
      abstentions: 0,
    },
    {
      id: 'res-2',
      number: 'RES-2026-004',
      title: 'Landscape Maintenance Contract Renewal',
      status: 'tabled',
      votesFor: 0,
      votesAgainst: 0,
      abstentions: 0,
    },
  ],
  documents: [
    { id: 'doc-1', name: 'Meeting Agenda - Q1 2026', type: 'PDF', size: '142 KB' },
    { id: 'doc-2', name: 'Q4 2025 Financial Report', type: 'PDF', size: '1.8 MB' },
    { id: 'doc-3', name: 'Lobby Renovation Proposal - Apex Design', type: 'PDF', size: '4.2 MB' },
    { id: 'doc-4', name: 'Landscape Contractor Quotes Comparison', type: 'XLSX', size: '87 KB' },
  ],
  nextMeetingDate: '2026-04-16',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MEETING_TYPE_CONFIG: Record<
  MeetingType,
  { variant: 'default' | 'info' | 'warning' | 'error'; label: string }
> = {
  regular: { variant: 'default', label: 'Regular' },
  special: { variant: 'info', label: 'Special' },
  agm: { variant: 'warning', label: 'AGM' },
  emergency: { variant: 'error', label: 'Emergency' },
};

const MEETING_STATUS_CONFIG: Record<
  MeetingStatus,
  { variant: 'success' | 'info' | 'default' | 'error'; label: string }
> = {
  scheduled: { variant: 'info', label: 'Scheduled' },
  in_progress: { variant: 'warning' as 'info', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
};

const AGENDA_STATUS_CONFIG: Record<
  AgendaItemStatus,
  { variant: 'success' | 'default' | 'warning'; label: string }
> = {
  discussed: { variant: 'success', label: 'Discussed' },
  pending: { variant: 'default', label: 'Pending' },
  tabled: { variant: 'warning', label: 'Tabled' },
};

const RESOLUTION_STATUS_CONFIG: Record<
  ResolutionStatus,
  { variant: 'success' | 'error' | 'warning'; label: string }
> = {
  passed: { variant: 'success', label: 'Passed' },
  failed: { variant: 'error', label: 'Failed' },
  tabled: { variant: 'warning', label: 'Tabled' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GovernanceMeetingDetailPage() {
  const { id } = useParams<{ id: string }>();

  // In production this would come from an API call using id
  const meeting = MOCK_MEETING;
  const typeCfg = MEETING_TYPE_CONFIG[meeting.type];
  const statusCfg = MEETING_STATUS_CONFIG[meeting.status];

  const resolutionColumns: Column<MeetingResolution>[] = [
    {
      id: 'number',
      header: 'Number',
      accessorKey: 'number',
      sortable: true,
      cell: (row) => (
        <span className="text-primary-600 text-[13px] font-semibold">{row.number}</span>
      ),
    },
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      cell: (row) => <span className="text-[13px] text-neutral-700">{row.title}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const cfg = RESOLUTION_STATUS_CONFIG[row.status];
        return (
          <Badge variant={cfg.variant} size="sm" dot>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'votes',
      header: 'Votes',
      accessorKey: 'votesFor',
      cell: (row) =>
        row.status === 'tabled' ? (
          <span className="text-[12px] text-neutral-300">--</span>
        ) : (
          <span className="text-[13px] text-neutral-700">
            {row.votesFor} for / {row.votesAgainst} against / {row.abstentions} abstain
          </span>
        ),
    },
  ];

  return (
    <PageShell
      title={meeting.title}
      description="Board Meeting"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit Meeting
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href={'/governance' as never}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to governance
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Meeting Details */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow label="Title" value={meeting.title} />
                </div>
                <InfoRow
                  label="Type"
                  value={
                    <Badge variant={typeCfg.variant} size="lg">
                      {typeCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Status"
                  value={
                    <Badge variant={statusCfg.variant} size="lg" dot>
                      {statusCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Date"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(meeting.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  }
                />
                <InfoRow
                  label="Time"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {meeting.startTime} &ndash; {meeting.endTime}
                    </span>
                  }
                />
                <InfoRow
                  label="Location"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                      {meeting.location}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card>
            <CardHeader>
              <CardTitle>Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {meeting.agendaItems.map((item) => {
                  const agendaCfg = AGENDA_STATUS_CONFIG[item.status];
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-200/60 text-[13px] font-bold text-neutral-600">
                        {item.order}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[14px] font-semibold text-neutral-900">{item.title}</p>
                          <Badge variant={agendaCfg.variant} size="sm" dot>
                            {agendaCfg.label}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-[12px] text-neutral-500">
                          <span>Presenter: {item.presenter}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Minutes */}
          <Card>
            <CardHeader>
              <CardTitle>Minutes</CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.minutes ? (
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-5">
                  <p className="text-[14px] leading-relaxed whitespace-pre-line text-neutral-700">
                    {meeting.minutes}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-neutral-200 py-10 text-center">
                  <FileText className="h-8 w-8 text-neutral-300" />
                  <p className="text-[14px] text-neutral-500">Minutes not yet available</p>
                  <Button variant="secondary" size="sm">
                    <Upload className="h-3.5 w-3.5" />
                    Upload Minutes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolutions */}
          <Card>
            <CardHeader>
              <CardTitle>Resolutions Discussed</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={resolutionColumns}
                data={meeting.resolutions}
                emptyMessage="No resolutions discussed in this meeting."
                emptyIcon={<FileText className="h-6 w-6" />}
                compact
              />
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button fullWidth>
                  <Edit2 className="h-4 w-4" />
                  Edit Meeting
                </Button>
                <Button variant="secondary" fullWidth>
                  <Upload className="h-4 w-4" />
                  Upload Minutes
                </Button>
                <Button variant="secondary" fullWidth>
                  <Users className="h-4 w-4" />
                  Record Attendance
                </Button>
                <Button variant="danger" fullWidth>
                  <XIcon className="h-4 w-4" />
                  Cancel Meeting
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: 'Total Invited',
                    count: meeting.totalInvited,
                    color: 'text-neutral-900',
                  },
                  { label: 'Present', count: meeting.present, color: 'text-success-600' },
                  { label: 'Absent', count: meeting.absent, color: 'text-error-600' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[13px] text-neutral-600">{item.label}</span>
                    <span className={`text-[15px] font-bold ${item.color}`}>{item.count}</span>
                  </div>
                ))}
                <div className="mt-1 border-t border-neutral-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-neutral-700">Quorum</span>
                    <Badge variant={meeting.quorumMet ? 'success' : 'error'} size="lg" dot>
                      {meeting.quorumMet ? 'Met' : 'Not Met'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {meeting.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-lg">
                        <FileText className="text-primary-600 h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-neutral-900">{doc.name}</p>
                        <p className="text-[11px] text-neutral-400">
                          {doc.type} &middot; {doc.size}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-neutral-400 transition-colors hover:text-neutral-600"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Meeting */}
          <Card>
            <CardHeader>
              <CardTitle>Next Meeting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="bg-info-50 flex h-14 w-14 items-center justify-center rounded-2xl">
                  <Calendar className="text-info-600 h-7 w-7" />
                </div>
                <p className="text-[15px] font-semibold text-neutral-900">
                  {new Date(meeting.nextMeetingDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-[13px] text-neutral-500">Next scheduled board meeting</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
