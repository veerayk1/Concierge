import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiCall, ApiError } from '@/api/client';
import { Booking, createBooking, listMyBookings } from '@/api/resident';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { colors, spacing, typography } from '@/design/tokens';
import { useAuth } from '@/auth/AuthContext';

interface Amenity {
  id: string;
  name: string;
  description: string | null;
  requiresApproval: boolean;
}

export function AmenityBookingScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composing, setComposing] = useState<Amenity | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.propertyId) {
      setError('No property associated with your account.');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [bookingsRes, amenitiesRes] = await Promise.all([
        listMyBookings(),
        apiCall<{ data: Amenity[] } | Amenity[]>(`/api/v1/amenities?propertyId=${user.propertyId}`),
      ]);
      setBookings(bookingsRes);
      setAmenities(Array.isArray(amenitiesRes) ? amenitiesRes : amenitiesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load amenities.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    return bookings.filter(
      (b) => b.startDate >= todayIso && b.status !== 'cancelled' && b.status !== 'declined',
    );
  }, [bookings]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="h1">Amenity Booking</Text>
        <Text variant="bodySmall" color="neutral500" style={styles.headerCaption}>
          {upcoming.length === 0
            ? 'No upcoming reservations.'
            : `${upcoming.length} upcoming · pull to refresh`}
        </Text>
      </View>

      {composing && (
        <BookingForm
          amenity={composing}
          onCancel={() => setComposing(null)}
          onCreated={() => {
            setComposing(null);
            load();
          }}
        />
      )}

      <FlatList
        data={amenities}
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
        ListHeaderComponent={
          upcoming.length > 0 ? (
            <View style={styles.upcomingBlock}>
              <Text variant="label" color="neutral500">
                Upcoming
              </Text>
              {upcoming.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
              <View style={{ height: spacing.lg }} />
              <Text variant="label" color="neutral500">
                Book new
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <AmenityRow item={item} onBook={() => setComposing(item)} />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title="No amenities to book yet"
              description={
                error ??
                'Your property hasn’t set up bookable amenities. Ask the front desk to add gym, party room, or guest suite.'
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

function AmenityRow({ item, onBook }: { item: Amenity; onBook: () => void }) {
  return (
    <Card density="comfortable">
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyEmphasis">{item.name}</Text>
          {item.description && (
            <Text variant="bodySmall" color="neutral500" style={styles.desc}>
              {item.description}
            </Text>
          )}
          {item.requiresApproval && (
            <Text variant="caption" color="warning" style={styles.approvalNote} bold>
              Manager approval required
            </Text>
          )}
        </View>
        <Button label="Book" size="sm" onPress={onBook} />
      </View>
    </Card>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const date = new Date(booking.startDate);
  return (
    <Card density="compact" flat style={styles.bookingRow}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyEmphasis">{booking.amenityName ?? 'Amenity'}</Text>
        <Text variant="bodySmall" color="neutral500">
          {date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
          {formatTime(booking.startTime)}–{formatTime(booking.endTime)}
        </Text>
      </View>
      <StatusPill status={booking.status} />
    </Card>
  );
}

function StatusPill({ status }: { status: Booking['status'] }) {
  const config = {
    pending: { bg: '#FEF3C7', fg: '#92400E', label: 'Pending' },
    approved: { bg: '#D1FAE5', fg: '#065F46', label: 'Approved' },
    declined: { bg: '#FEE2E2', fg: '#991B1B', label: 'Declined' },
    cancelled: { bg: '#E5E5E5', fg: '#525252', label: 'Cancelled' },
    completed: { bg: '#E5E5E5', fg: '#525252', label: 'Completed' },
  }[status];
  if (!config) return null;
  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <Text style={[typography.caption, { color: config.fg, fontWeight: '600' }]}>
        {config.label}
      </Text>
    </View>
  );
}

function BookingForm({
  amenity,
  onCancel,
  onCreated,
}: {
  amenity: Amenity;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [date, setDate] = useState(defaultDate());
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [guestCount, setGuestCount] = useState('2');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    const guests = parseInt(guestCount, 10);
    if (Number.isNaN(guests) || guests < 1) {
      setError('Guest count must be at least 1.');
      return;
    }
    setSubmitting(true);
    try {
      await createBooking({
        amenityId: amenity.id,
        startDate: date,
        startTime,
        endDate: date,
        endTime,
        guestCount: guests,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not book this slot.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={styles.form}>
      <Text variant="h3">Book {amenity.name}</Text>
      <Input
        label="Date"
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        containerStyle={styles.field}
      />
      <View style={styles.timeRow}>
        <Input
          label="Start"
          value={startTime}
          onChangeText={setStartTime}
          placeholder="HH:MM"
          containerStyle={{ flex: 1 }}
        />
        <Input
          label="End"
          value={endTime}
          onChangeText={setEndTime}
          placeholder="HH:MM"
          containerStyle={{ flex: 1 }}
        />
      </View>
      <Input
        label="Guests"
        value={guestCount}
        onChangeText={setGuestCount}
        keyboardType="number-pad"
        containerStyle={styles.field}
      />
      {amenity.requiresApproval && (
        <Text variant="caption" color="warning" style={styles.approvalNote}>
          This amenity requires management approval. You'll get a push notification once it's
          decided.
        </Text>
      )}
      {error && (
        <Text variant="bodySmall" color="error" style={styles.formError}>
          {error}
        </Text>
      )}
      <View style={styles.formActions}>
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
        <Button label="Request booking" onPress={submit} loading={submitting} />
      </View>
    </Card>
  );
}

function defaultDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function formatTime(t: string): string {
  // The server returns time-only strings like "14:00:00" or full
  // timestamps starting with 1970-01-01T. Slice to "14:00" either way.
  const m = t.match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : t;
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
  upcomingBlock: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  desc: {
    marginTop: spacing.xs,
  },
  approvalNote: {
    marginTop: spacing.sm,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutral50,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  form: {
    margin: spacing.lg,
    gap: spacing.md,
  },
  field: {
    marginTop: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  formError: {
    marginTop: spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
