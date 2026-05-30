import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listMyExpectedVisitors, preAuthorizeVisitor, Visitor } from '@/api/resident';
import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/design/tokens';

/**
 * Resident pre-authorization screen.
 *
 * Lists upcoming pre-authorized visitors and lets the resident add a
 * new one. Calls POST /api/v1/my/visitors which resolves the resident's
 * own unitId server-side — the screen never has to know it.
 */
export function VisitorsScreen() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listMyExpectedVisitors();
      setVisitors(data);
    } catch (err) {
      console.warn('[visitors] load failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="h1">Visitors</Text>
          <Text variant="bodySmall" color="neutral500" style={styles.headerCaption}>
            {visitors.length === 0
              ? 'No upcoming visitors.'
              : `${visitors.length} on the list for the front desk.`}
          </Text>
        </View>
        <Button label="Add" onPress={() => setShowCreate(true)} size="sm" />
      </View>

      {showCreate && (
        <PreAuthForm
          onCancel={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      <FlatList
        data={visitors}
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
        renderItem={({ item }) => <VisitorRow item={item} />}
        ListEmptyComponent={
          loading || showCreate ? null : (
            <EmptyState
              title="No visitors expected"
              description="Tell the front desk who's coming. They'll wave your guest through without ringing your unit."
              tone="primary"
              action={
                <Button label="Pre-authorize a visitor" onPress={() => setShowCreate(true)} />
              }
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </SafeAreaView>
  );
}

function VisitorRow({ item }: { item: Visitor }) {
  const arrival = new Date(item.arrivalAt);
  return (
    <Card>
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          <Text variant="label" color="neutral500">
            {visitorTypeLabel(item.visitorType)}
          </Text>
          <Text variant="bodyEmphasis" style={styles.name}>
            {item.visitorName}
          </Text>
        </View>
        <Text variant="bodySmall" color="neutral500">
          {arrival.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}
        </Text>
      </View>
      {item.comments && (
        <Text variant="bodySmall" color="neutral600" style={styles.comments}>
          {item.comments}
        </Text>
      )}
    </Card>
  );
}

function PreAuthForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [dateInput, setDateInput] = useState(defaultIsoLocal());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Who's coming?");
      return;
    }
    let iso: string;
    try {
      iso = new Date(dateInput).toISOString();
    } catch {
      setError('Pick a valid arrival date and time.');
      return;
    }
    setSubmitting(true);
    try {
      await preAuthorizeVisitor({
        visitorName: name,
        expectedArrivalAt: iso,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Added to the list', `${name} is on the front desk's list.`);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not pre-authorize this visitor.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={styles.form}>
      <Text variant="h3">Pre-authorize a visitor</Text>
      <Input
        label="Visitor name"
        value={name}
        onChangeText={setName}
        placeholder="Sarah Kim"
        containerStyle={styles.field}
      />
      <Input
        label="Expected arrival"
        value={dateInput}
        onChangeText={setDateInput}
        placeholder="YYYY-MM-DDTHH:MM"
        helperText="Use local time, e.g. 2026-07-04T19:00"
        containerStyle={styles.field}
      />
      <Input
        label="Note (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Bringing the kids"
        multiline
        numberOfLines={2}
        containerStyle={styles.field}
      />
      {error && (
        <Text variant="bodySmall" color="error" style={styles.formError}>
          {error}
        </Text>
      )}
      <View style={styles.formActions}>
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
        <Button label="Add to list" onPress={submit} loading={submitting} />
      </View>
    </Card>
  );
}

function defaultIsoLocal(): string {
  // Default to "tomorrow 7pm" in local time, formatted as YYYY-MM-DDTHH:MM
  // so it's a valid input for new Date(string) and the user can edit a
  // sensible value rather than starting from scratch.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
}

function visitorTypeLabel(type: Visitor['visitorType']): string {
  switch (type) {
    case 'delivery_person':
      return 'Delivery';
    case 'contractor':
      return 'Contractor';
    case 'real_estate_agent':
      return 'Real estate agent';
    case 'other':
      return 'Other';
    default:
      return 'Visitor';
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
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
  name: {
    marginTop: spacing.xs,
  },
  comments: {
    marginTop: spacing.sm,
  },
  form: {
    margin: spacing.lg,
    gap: spacing.md,
  },
  field: {
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
