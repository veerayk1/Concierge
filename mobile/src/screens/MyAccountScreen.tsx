import { Alert, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/design/tokens';
import { apiCall } from '@/api/client';

export function MyAccountScreen() {
  const { user, signOut } = useAuth();

  function confirmSignOut() {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function confirmDelete() {
    // App Store policy 5.1.1(v): account deletion has to be visible
    // and frictionless inside the app, no email-to-support workarounds.
    Alert.alert(
      'Delete your account?',
      'This permanently removes your profile and revokes access to your unit. Your audit history is retained per building policy. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiCall<void>('/api/v1/users/me', { method: 'DELETE' });
              await signOut();
            } catch (err) {
              Alert.alert(
                'Could not delete account',
                err instanceof Error
                  ? err.message
                  : 'Please try again or contact your property manager.',
              );
            }
          },
        },
      ],
    );
  }

  return (
    <Screen title="My Account" description="Manage your profile and account.">
      <Card>
        <Text variant="label" color="neutral500">
          Signed in as
        </Text>
        <Text variant="h3" style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text variant="body" color="neutral500" style={styles.email}>
          {user?.email}
        </Text>
      </Card>

      <View style={styles.actions}>
        <Button label="Sign out" variant="secondary" fullWidth onPress={confirmSignOut} />
        <Button label="Delete account" variant="ghost" fullWidth onPress={confirmDelete} />
      </View>

      <Text variant="caption" color="neutral400" style={styles.footer}>
        Concierge Mobile v0.1.0
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    marginTop: spacing.sm,
    color: colors.neutral900,
  },
  email: {
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  footer: {
    marginTop: spacing['3xl'],
    textAlign: 'center',
  },
});
