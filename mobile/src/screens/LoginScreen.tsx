import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/design/tokens';

export function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    try {
      const user = await signIn(email, password);
      if (user === null) {
        // MFA — TODO: navigate to verify code screen
        Alert.alert(
          'Two-step verification',
          'Multi-factor auth is enabled on this account. The mobile MFA screen is not in this build yet — for now please sign in via the web portal.',
        );
        return;
      }
      // Success — the navigator will switch stacks automatically because
      // useAuth().user is now non-null.
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not sign in. Check your connection and try again.');
      }
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <Text variant="h1" style={styles.title}>
              Welcome back
            </Text>
            <Text variant="body" color="neutral500">
              Sign in to manage packages, requests, and bookings for your unit.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              returnKeyType="next"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              placeholder="••••••••"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              containerStyle={styles.passwordField}
            />
            {error && (
              <Text variant="bodySmall" color="error" style={styles.error}>
                {error}
              </Text>
            )}
            <Button label="Sign in" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: { flex: 1 },
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  hero: {
    marginBottom: spacing['3xl'],
  },
  title: {
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  passwordField: {
    marginTop: -spacing.xs, // tighten inter-field rhythm; design token, not magic
  },
  error: {
    marginTop: -spacing.sm,
  },
});
