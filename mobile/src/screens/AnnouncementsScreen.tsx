import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiCall } from '@/api/client';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/Text';
import { colors, spacing, typography } from '@/design/tokens';
import { useAuth } from '@/auth/AuthContext';

interface Announcement {
  id: string;
  title: string;
  contentPlaintext: string | null;
  content?: string;
  priority: 'normal' | 'important' | 'urgent';
  publishedAt: string;
  category?: { id: string; name: string } | null;
  isPinned?: boolean;
}

const PRIORITY: Record<Announcement['priority'], { bg: string; fg: string; label: string }> = {
  normal: { bg: '#F1F5F9', fg: '#475569', label: 'Update' },
  important: { bg: '#FEF3C7', fg: '#92400E', label: 'Important' },
  urgent: { bg: '#FEE2E2', fg: '#991B1B', label: 'Urgent' },
};

export function AnnouncementsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.propertyId) {
      setError('No property associated with your account.');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const res = await apiCall<{ data: Announcement[] } | Announcement[]>(
        `/api/v1/announcements?propertyId=${user.propertyId}&status=published&pageSize=50`,
      );
      setItems(Array.isArray(res) ? res : res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load announcements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="h1">Announcements</Text>
        <Text variant="bodySmall" color="neutral500" style={styles.headerCaption}>
          From your property's management team.
        </Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        renderItem={({ item }) => <AnnouncementRow item={item} />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title="Nothing to share right now"
              description={
                error ?? 'When your property manager posts an announcement, it shows up here first.'
              }
              tone="primary"
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </SafeAreaView>
  );
}

function AnnouncementRow({ item }: { item: Announcement }) {
  const priority = PRIORITY[item.priority] ?? PRIORITY.normal;
  const published = new Date(item.publishedAt);
  const preview = item.contentPlaintext ?? stripHtml(item.content ?? '');
  return (
    <Card density="comfortable">
      <View style={styles.rowTop}>
        <View style={[styles.pill, { backgroundColor: priority.bg }]}>
          <Text style={[typography.caption, { color: priority.fg, fontWeight: '600' }]}>
            {priority.label}
          </Text>
        </View>
        {item.isPinned && (
          <Text variant="caption" color="neutral500" style={styles.pinned}>
            📌 pinned
          </Text>
        )}
        <Text variant="caption" color="neutral400" style={styles.timestamp}>
          {published.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
        </Text>
      </View>
      <Text variant="h3" style={styles.title}>
        {item.title}
      </Text>
      {preview && (
        <Text variant="body" color="neutral600" style={styles.preview} numberOfLines={3}>
          {preview}
        </Text>
      )}
      {item.category?.name && (
        <Text variant="caption" color="neutral400" style={styles.category}>
          {item.category.name}
        </Text>
      )}
    </Card>
  );
}

function stripHtml(html: string): string {
  // Native doesn't ship a parser. Strip tags and entities so the
  // preview reads cleanly. The detail view (future) will render
  // full HTML via react-native-render-html.
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerCaption: {
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pinned: {
    marginLeft: spacing.xs,
  },
  timestamp: {
    marginLeft: 'auto',
  },
  title: {
    marginTop: spacing.md,
  },
  preview: {
    marginTop: spacing.sm,
  },
  category: {
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
