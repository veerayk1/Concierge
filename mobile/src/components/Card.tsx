import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@/design/tokens';

interface CardProps {
  children: ReactNode;
  /** Press anywhere on the card to trigger an action — used for list rows. */
  onPress?: () => void;
  /** Tone shifts the card from neutral to a soft semantic wash. */
  tone?: 'default' | 'success' | 'warning' | 'error';
  /** Tighter padding for stat cards; default for content cards. */
  density?: 'compact' | 'comfortable';
  /** Drop the shadow for cards inside lists where stacked shadows look noisy. */
  flat?: boolean;
  style?: ViewStyle;
}

/**
 * Card — the wrapper for any boxed content. Mirrors the web design
 * system's "rounded-2xl border bg-white" pattern but renders the
 * cross-platform shadow correctly (iOS shadow props + Android
 * elevation) and respects the 4px grid for padding.
 */
export function Card({
  children,
  onPress,
  tone = 'default',
  density = 'comfortable',
  flat = false,
  style,
}: CardProps) {
  const containerStyle = [
    styles.base,
    density === 'compact' ? styles.compact : styles.comfortable,
    toneStyles[tone],
    !flat && shadows.sm,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius.xl,
  },
  compact: {
    padding: spacing.md,
  },
  comfortable: {
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.neutral50,
  },
});

const toneStyles = StyleSheet.create({
  default: {},
  success: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  warning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  error: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
});
