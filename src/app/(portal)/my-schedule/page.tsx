import { PageShell } from '@/components/layout/page-shell';

export default function PlaceholderPage() {
  return (
    <PageShell title="Coming Soon" description="This feature is under development.">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[14px] text-neutral-500">
          This page will be available in a future update.
        </p>
      </div>
    </PageShell>
  );
}
