import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listMyRequests, MaintenanceRequest } from '@/api/resident';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/Text';
import { colors, spacing, typography } from '@/design/tokens';

const PRIORITY_COLORS: Record<MaintenanceRequest['priority'], { bg: string; fg: string }> = {
  low: { bg: '#E5E5E5', fg: '#525252' },
  normal: { bg: '#DBEAFE', fg: '#1E40AF' },
  high: { bg: '#FEF3C7', fg: '#92400E' },
  urgent: { bg: '#FEE2E2', fg: '#991B1B' },
};

const STATUS_COLORS: Record<
  MaintenanceRequest['status'],
  { bg: string; fg: string; label: string }
> = {
  open: { bg: '#FEF3C7', fg: '#92400E', label: 'Open' },
  in_progress: { bg: '#DBEAFE', fg: '#1E40AF', label: 'In progress' },
  on_hold: { bg: '#E5E5E5', fg: '#525252', label: 'On hold' },
  closed: { bg: '#D1FAE5', fg: '#065F46', label: 'Closed' },
  resolved: { bg: '#D1FAE5', fg: '#065F46', label: 'Resolved' },
};

export function MyRequestsScreen() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listMyRequests();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = requests.filter((r) => r.status === 'open' || r.status === 'in_progress');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="h1">My Requests</Text>
        <Text variant="bodySmall" color="neutral500" style={styles.headerCaption}>
          {open.length === 0
            ? 'No open requests.'
            : `${open.length} open · waiting on the property team.`}
        </Text>
      </View>

      <FlatList
        data={requests}
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
        renderItem={({ item }) => <RequestRow item={item} />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title="No requests yet"
              description="Maintenance issues you report show up here. Tap the + tab to submit one."
              tone="primary"
            />
          )
        }
        ListFooterComponent={
          error ? (
            <Card tone="error">
              <Text variant="bodySmall" color="error">
                {error}
              </Text>
            </Card>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </SafeAreaView>
  );
}

function RequestRow({ item }: { item: MaintenanceRequest }) {
  const status = STATUS_COLORS[item.status];
  const priority = PRIORITY_COLORS[item.priority];
  return (
    <Card density="comfortable">
      <View style={styles.rowTop}>
        <Text variant="label" color="neutral500">
          {item.referenceNumber}
        </Text>
        <View style={[styles.pill, { backgroundColor: status.bg }]}>
          <Text style={[typography.caption, { color: status.fg, fontWeight: '600' }]}>
            {status.label}
          </Text>
        </View>
      </View>
      <Text variant="bodyEmphasis" style={styles.title} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.rowBottom}>
        <View style={[styles.priorityChip, { backgroundColor: priority.bg }]}>
          <Text
            style={[
              typography.caption,
              { color: priority.fg, fontWeight: '600', textTransform: 'capitalize' },
            ]}
          >
            {item.priority}
          </Text>
        </View>
        <Text variant="caption" color="neutral400">
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
    </Card>
  );
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    marginTop: spacing.sm,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priorityChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
