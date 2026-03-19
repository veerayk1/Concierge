'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileText,
  Loader2,
  Package,
  Printer,
  ShoppingCart,
  Truck,
  User,
  X as XIcon,
} from 'lucide-react';
import { useApi } from '@/lib/hooks/use-api';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type POStatus = 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'received' | 'rejected';
type POPriority = 'low' | 'normal' | 'high' | 'urgent';

interface ApiPurchaseOrderDetail {
  id: string;
  referenceNumber: string;
  status: string;
  budgetCategory: string;
  priority: string;
  totalAmount: number;
  notes: string | null;
  expectedDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  approvalNotes: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  invoiceAmount: number | null;
  vendor: { id: string; companyName: string } | null;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSizeBytes: number;
    storageUrl: string;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { variant: 'default' | 'warning' | 'success' | 'info' | 'error' | 'primary'; label: string }
> = {
  draft: { variant: 'default', label: 'Draft' },
  submitted: { variant: 'warning', label: 'Submitted' },
  pending_approval: { variant: 'warning', label: 'Pending Approval' },
  approved: { variant: 'success', label: 'Approved' },
  ordered: { variant: 'info', label: 'Ordered' },
  received: { variant: 'primary', label: 'Received' },
  closed: { variant: 'default', label: 'Closed' },
  rejected: { variant: 'error', label: 'Rejected' },
  cancelled: { variant: 'error', label: 'Cancelled' },
};

const PRIORITY_CONFIG: Record<
  string,
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: po,
    loading,
    error,
    refetch,
  } = useApi<ApiPurchaseOrderDetail>(`/api/v1/purchase-orders/${id}`);

  // Loading
  if (loading) {
    return (
      <PageShell title="Purchase Order" description="Loading...">
        <div className="-mt-4 mb-4">
          <Link
            href="/purchase-orders"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to purchase orders
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading purchase order...</p>
        </div>
      </PageShell>
    );
  }

  // Error
  if (error || !po) {
    return (
      <PageShell title="Purchase Order" description="Error">
        <div className="-mt-4 mb-4">
          <Link
            href="/purchase-orders"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to purchase orders
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
          <AlertTriangle className="text-error-500 h-8 w-8" />
          <p className="mt-3 text-[14px] font-medium text-neutral-900">
            Failed to load purchase order
          </p>
          <p className="mt-1 text-[13px] text-neutral-500">{error ?? 'Purchase order not found'}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </PageShell>
    );
  }

  const statusCfg = STATUS_CONFIG[po.status] || STATUS_CONFIG.draft!;
  const priorityCfg = PRIORITY_CONFIG[po.priority] || PRIORITY_CONFIG.normal!;
  const subtotal = po.items.reduce((sum, item) => sum + item.total, 0);
  const tax = po.totalAmount - subtotal;

  return (
    <PageShell
      title={po.referenceNumber}
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
                  value={
                    <span className="font-mono text-[16px] font-semibold">
                      {po.referenceNumber}
                    </span>
                  }
                />
                <InfoRow
                  label="Vendor"
                  value={<span className="font-semibold">{po.vendor?.companyName ?? 'N/A'}</span>}
                />
                {po.notes && (
                  <div className="sm:col-span-2">
                    <InfoRow
                      label="Notes"
                      value={<p className="leading-relaxed text-neutral-700">{po.notes}</p>}
                    />
                  </div>
                )}
                <InfoRow
                  label="Category"
                  value={
                    <Badge variant="default" size="lg">
                      {po.budgetCategory}
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
                  label="Date"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {formatDate(po.createdAt)}
                    </span>
                  }
                />
                {po.expectedDelivery && (
                  <InfoRow
                    label="Expected Delivery"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5 text-neutral-400" />
                        {formatDate(po.expectedDelivery)}
                      </span>
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          {po.items.length > 0 && (
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
                      {po.items.map((item) => (
                        <tr key={item.id} className="border-b border-neutral-50 last:border-0">
                          <td className="py-3 text-[13px] font-medium text-neutral-900">
                            {item.description}
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
          )}

          {/* Total */}
          <Card>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-neutral-600">Subtotal</span>
                  <span className="text-[14px] text-neutral-900">{formatCurrency(subtotal)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-neutral-600">Tax</span>
                    <span className="text-[14px] text-neutral-900">{formatCurrency(tax)}</span>
                  </div>
                )}
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
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                    statusCfg.variant === 'warning'
                      ? 'bg-warning-50'
                      : statusCfg.variant === 'success'
                        ? 'bg-success-50'
                        : statusCfg.variant === 'error'
                          ? 'bg-error-50'
                          : 'bg-neutral-100'
                  }`}
                >
                  <Clock
                    className={`h-7 w-7 ${
                      statusCfg.variant === 'warning'
                        ? 'text-warning-600'
                        : statusCfg.variant === 'success'
                          ? 'text-success-600'
                          : statusCfg.variant === 'error'
                            ? 'text-error-600'
                            : 'text-neutral-400'
                    }`}
                  />
                </div>
                <Badge variant={statusCfg.variant} size="lg" dot>
                  {statusCfg.label}
                </Badge>
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
          {po.vendor && (
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
                    <dd className="mt-1 text-[14px] font-semibold text-neutral-900">
                      {po.vendor.companyName}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {po.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {po.attachments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-lg">
                          <FileText className="text-primary-600 h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-neutral-900">{doc.fileName}</p>
                          <p className="text-[11px] text-neutral-400">
                            {doc.fileType} &middot; {formatFileSize(doc.fileSizeBytes)}
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
          )}
        </div>
      </div>
    </PageShell>
  );
}
