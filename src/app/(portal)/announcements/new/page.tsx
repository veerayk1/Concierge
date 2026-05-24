import { redirect } from 'next/navigation';

// The "create announcement" UX is a dialog launched from the list page,
// not a dedicated route. A few older links and bookmarks point here, so
// we permanent-redirect to the list with ?create=1 — the list page reads
// that flag and opens the dialog on mount.
export default function AnnouncementsNewRedirect() {
  redirect('/announcements?create=1');
}
