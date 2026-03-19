'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileText,
  Package,
  Printer,
  ShoppingCart,
  Truck,
  User,
  X as XIcon,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type POStatus = 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'received' | 'rejected';
type POPriority = 'low' | 'normal' | 'high' | 'urgent';

interface LineItem {
  id: string;
  item: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ApprovalEvent {
  id: string;
  action: string;
  user: string;
  date: string;
  note: string | null;
}

interface PODocument {
  id: string;
  name: string;
  type: string;
  size: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  vendorContact: string;
  vendorPhone: string;
  vendorEmail: string;
  description: string;
  category: string;
  status: POStatus;
  priority: POPriority;
  requestedBy: string;
  date: string;
  expectedDelivery: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  approvalHistory: ApprovalEvent[];
  documents: PODocument[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_PO: PurchaseOrder = {
  id: '1',
  poNumber: 'PO-002471',
  vendor: 'CleanPro Industrial Supplies',
  vendorContact: 'Sandra Mitchell',
  vendorPhone: '(416) 555-0192',
  vendorEmail: 'orders@cleanpro.ca',
  description: 'Q2 2026 cleaning supplies restock for common areas and maintenance closets',
  category: 'Cleaning & Janitorial',
  status: 'pending_approval',
  priority: 'normal',
  requestedBy: 'Michael Torres',
  date: '2026-03-15',
  expectedDelivery: '2026-03-28',
  lineItems: [
    {
      id: 'li-1',
      item: 'Commercial Floor Cleaner (5L)',
      quantity: 12,
      unitPrice: 45,
      total: 540,
    },
    {
      id: 'li-2',
      item: 'Microfibre Mop Heads (Pack of 6)',
      quantity: 8,
      unitPrice: 85,
      total: 680,
    },
    {
      id: 'li-3',
      item: 'Stainless Steel Polish & Protectant (Case)',
      quantity: 10,
      unitPrice: 123,
      total: 1230,
    },
  ],
  subtotal: 2450,
  tax: 318.5,
  totalAmount: 2768.5,
  approvalHistory: [
    {
      id: 'ah-1',
      action: 'Created',
      user: 'Michael Torres',
      date: '2026-03-15T09:30:00',
      note: null,
    },
    {
      id: 'ah-2',
      action: 'Submitted for Approval',
      user: 'Michael Torres',
      date: '2026-03-15T10:15:00',
      note: 'Urgent restock needed before April. Current supplies running low.',
    },
    {
      id: 'ah-3',
      action: 'Under Review',
      user: 'Janet Wu',
      date: '2026-03-16T08:45:00',
      note: 'Reviewing vendor pricing against last quarter.',
    },
  ],
  documents: [
    { id: 'doc-1', name: 'CleanPro Quote Q2-2026', type: 'PDF', size: '245 KB' },
    { id: 'doc-2', name: 'Previous PO Comparison', type: 'XLSX', size: '78 KB' },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  POStatus,
  { variant: 'default' | 'warning' | 'success' | 'info' | 'error' | 'primary'; label: string }
> = {
  draft: { variant: 'default', label: 'Draft' },
  pending_approval: { variant: 'warning', label: 'Pending Approval' },
  approved: { variant: 'success', label: 'Approved' },
  ordered: { variant: 'info', label: 'Ordered' },
  received: { variant: 'primary', label: 'Received' },
  rejected: { variant: 'error', label: 'Rejected' },
};

const PRIORITY_CONFIG: Record<
  POPriority,
  { variant: 'default' | 'info' | 'warning' | 'error'; label: string }
> = {
  low: { variant: 'default', label: 'Low' },
  normal: { variant: 'info', label: 'Normal' },
  high: { variant: 'warning', label: 'High' },
  urgent: { variant: 'error', label: 'Urgent' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  // In production this would come from an API call using id
  const po = MOCK_PO;
  const statusCfg = STATUS_CONFIG[po.status];
  const priorityCfg = PRIORITY_CONFIG[po.priority];

  return (
    <PageShell
      title={po.poNumber}
      description="Purchase Order"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Printer className="h-4 w-4" />
            Print PO
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/purchase-orders"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to purchase orders
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* PO Details */}
          <Card>
            <CardHeader>
              <CardTitle>PO Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  label="PO Number"
                  value={<span className="font-mono text-[16px] font-semibold">{po.poNumber}</span>}
                />
                <InfoRow
                  label="Vendor"
                  value={<span className="font-semibold">{po.vendor}</span>}
                />
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Description"
                    value={<p className="leading-relaxed text-neutral-700">{po.description}</p>}
                  />
                </div>
                <InfoRow
                  label="Category"
                  value={
                    <Badge variant="default" size="lg">
                      {po.category}
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
                  label="Priority"
                  value={
                    <Badge variant={priorityCfg.variant} size="lg" dot>
                      {priorityCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Requested By"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-neutral-400" />
                      {po.requestedBy}
                    </span>
                  }
                />
                <InfoRow
                  label="Date"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {formatDate(po.date)}
                    </span>
                  }
                />
                <InfoRow
                  label="Expected Delivery"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5 text-neutral-400" />
                      {formatDate(po.expectedDelivery)}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="pb-3 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Item
                      </th>
                      <th className="pb-3 text-right text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Quantity
                      </th>
                      <th className="pb-3 text-right text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Unit Price
                      </th>
                      <th className="pb-3 text-right text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-neutral-50 last:border-0">
                        <td className="py-3 text-[13px] font-medium text-neutral-900">
                          {item.item}
                        </td>
                        <td className="py-3 text-right text-[13px] text-neutral-700">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right text-[13px] text-neutral-700">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3 text-right text-[13px] font-medium text-neutral-900">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-neutral-600">Subtotal</span>
                  <span className="text-[14px] text-neutral-900">
                    {formatCurrency(po.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-neutral-600">Tax (HST 13%)</span>
                  <span className="text-[14px] text-neutral-900">{formatCurrency(po.tax)}</span>
                </div>
                <div className="mt-1 border-t border-neutral-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-neutral-900">Total Amount</span>
                    <span className="text-[22px] font-bold text-neutral-900">
                      {formatCurrency(po.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval History */}
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative flex flex-col gap-0">
                {po.approvalHistory.map((event, idx) => (
                  <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Timeline line */}
                    {idx < po.approvalHistory.length - 1 && (
                      <div className="absolute top-8 left-[15px] h-full w-px bg-neutral-200" />
                    )}
                    {/* Timeline dot */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                      <Clock className="h-3.5 w-3.5 text-neutral-500" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-neutral-900">
                          {event.action}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-neutral-500">
                        {event.user} &middot; {formatDateTime(event.date)}
                      </p>
                      {event.note && (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="bg-warning-50 flex h-14 w-14 items-center justify-center rounded-2xl">
                  <Clock className="text-warning-600 h-7 w-7" />
                </div>
                <Badge variant={statusCfg.variant} size="lg" dot>
                  {statusCfg.label}
                </Badge>
                <p className="text-[13px] text-neutral-500">Awaiting manager approval</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button fullWidth>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button variant="danger" fullWidth>
                  <XIcon className="h-4 w-4" />
                  Reject
                </Button>
                <Button variant="secondary" fullWidth>
                  <ShoppingCart className="h-4 w-4" />
                  Mark Ordered
                </Button>
                <Button variant="secondary" fullWidth>
                  <Package className="h-4 w-4" />
                  Mark Received
                </Button>
                <Button variant="secondary" fullWidth>
                  <Printer className="h-4 w-4" />
                  Print PO
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Card */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3">
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Company
                  </dt>
                  <dd className="mt-1 text-[14px] font-semibold text-neutral-900">{po.vendor}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Contact
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">{po.vendorContact}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Phone
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">{po.vendorPhone}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Email
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">{po.vendorEmail}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {po.documents.map((doc) => (
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
        </div>
      </div>
    </PageShell>
  );
}
