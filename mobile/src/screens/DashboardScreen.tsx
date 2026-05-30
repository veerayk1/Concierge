import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/design/tokens';
import { useAuth } from '@/auth/AuthContext';
import { listMyBookings, listMyPackages, listMyRequests } from '@/api/resident';

interface Summary {
  unreleasedPackages: number;
  openRequests: number;
  upcomingBookings: number;
}

export function DashboardScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const fetchSummary = useCallback(async () => {
    setError(null);
    try {
      const [packages, requests, bookings] = await Promise.all([
        listMyPackages('unreleased'),
        listMyRequests(),
        listMyBookings(),
      ]);
      const todayIso = new Date().toISOString().slice(0, 10);
      setSummary({
        unreleasedPackages: packages.length,
        openRequests: requests.filter((r) => r.status === 'open' || r.status === 'in_progress')
          .length,
        upcomingBookings: bookings.filter(
          (b) => b.startDate >= todayIso && b.status !== 'cancelled' && b.status !== 'declined',
        ).length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your dashboard.');
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  }, [fetchSummary]);

  return (
    <Screen
      title={`${greeting}, ${user?.firstName ?? 'there'}.`}
      description="Here's what's waiting for you today."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.stats}>
        <StatCard
          label="Packages"
          value={summary?.unreleasedPackages ?? '—'}
          caption="awaiting pickup"
          tone={summary && summary.unreleasedPackages > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Service requests"
          value={summary?.openRequests ?? '—'}
          caption="open or in progress"
        />
        <StatCard label="Bookings" value={summary?.upcomingBookings ?? '—'} caption="upcoming" />
      </View>

      {error && (
        <Card tone="error">
          <Text variant="bodySmall" color="error">
            {error}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

function StatCard({
  label,
  value,
  caption,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  caption: string;
  tone?: 'default' | 'warning';
}) {
  return (
    <Card density="compact" tone={tone === 'warning' ? 'warning' : 'default'} flat>
      <Text variant="label" color="neutral500">
        {label}
      </Text>
      <Text variant="h1" style={styles.statValue}>
        {value}
      </Text>
      <Text variant="bodySmall" color="neutral500">
        {caption}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  stats: {
    gap: spacing.md,
  },
  statValue: {
    marginTop: spacing.xs,
    color: colors.neutral900,
  },
});
