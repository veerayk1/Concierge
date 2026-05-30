import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/design/tokens';
import { Text } from './Text';

interface EmptyStateProps {
  /** Optional icon — pass a 32px-ish vector. */
  icon?: ReactNode;
  title: string;
  description: string;
  /** Optional primary action — usually a <Button label="..." />. */
  action?: ReactNode;
  /** Subtle background wash for emphasis. */
  tone?: 'neutral' | 'primary';
}

/**
 * EmptyState — the one place we render "no data" copy. Mirrors the
 * web EmptyState pattern so the language and visual treatment match
 * across platforms.
 *
 * Every list screen MUST render EmptyState when the array is empty.
 * No silent blank screens.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
}: EmptyStateProps) {
  return (
    <View style={[styles.container, tone === 'primary' && styles.primaryTone]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text variant="h3" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" color="neutral500" style={styles.description}>
        {description}
      </Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  primaryTone: {
    backgroundColor: colors.neutral50,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.xl,
  },
});
