import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listMyPackages, Package } from '@/api/resident';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/Text';
import { colors, spacing, typography } from '@/design/tokens';

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function MyPackagesScreen() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listMyPackages();
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load packages.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const unreleased = packages.filter((p) => p.status === 'unreleased');
  const released = packages.filter((p) => p.status === 'released');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="h1">My Packages</Text>
        <Text variant="bodySmall" color="neutral500" style={styles.headerCaption}>
          {unreleased.length === 0
            ? 'All caught up.'
            : `${unreleased.length} waiting at the front desk.`}
        </Text>
      </View>

      <FlatList
        data={packages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => <PackageRow item={item} />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title="No packages yet"
              description="Deliveries logged by the front desk for your unit will show up here. We'll send a push notification the moment something arrives."
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

function PackageRow({ item }: { item: Package }) {
  const isUnreleased = item.status === 'unreleased';
  return (
    <Card density="comfortable" tone={item.isPerishable && isUnreleased ? 'warning' : 'default'}>
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          <Text variant="label" color="neutral500">
            {item.courier?.name ?? 'Delivered'}
          </Text>
          <Text variant="bodyEmphasis" style={styles.refNumber}>
            {item.referenceNumber}
          </Text>
        </View>
        <StatusPill status={item.status} />
      </View>
      {item.description && (
        <Text variant="body" color="neutral700" style={styles.desc}>
          {item.description}
        </Text>
      )}
      <View style={styles.rowBottom}>
        <Text variant="caption" color="neutral400">
          {formatRelative(item.createdAt)}
        </Text>
        {item.isPerishable && isUnreleased && (
          <Text variant="caption" color="warning" bold>
            Perishable — pick up today
          </Text>
        )}
      </View>
    </Card>
  );
}

function StatusPill({ status }: { status: Package['status'] }) {
  const config = {
    unreleased: { label: 'Awaiting pickup', bg: '#FEF3C7', fg: '#92400E' },
    released: { label: 'Picked up', bg: '#D1FAE5', fg: '#065F46' },
    discarded: { label: 'Discarded', bg: '#E5E5E5', fg: '#525252' },
  }[status];
  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <Text style={[typography.caption, { color: config.fg, fontWeight: '600' }]}>
        {config.label}
      </Text>
    </View>
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
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  refNumber: {
    marginTop: spacing.xs,
  },
  desc: {
    marginTop: spacing.md,
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
});
