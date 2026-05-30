import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { colors, radius, spacing, touchTarget, typography } from '@/design/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  /** Show a spinner and disable the press handler. */
  loading?: boolean;
  /** Stretch the button to fill its container. */
  fullWidth?: boolean;
  /** Optional leading icon — keep it small (~18px). */
  iconLeft?: React.ReactNode;
  /** Optional trailing icon — same constraint. */
  iconRight?: React.ReactNode;
}

/**
 * The single source of truth for button styling in the mobile app.
 *
 * Variants:
 *   - primary: dark ink fill, white text. The page's hero CTA.
 *   - secondary: white fill, neutral border, ink text. Supporting actions.
 *   - ghost: transparent, ink text. Tertiary actions and rows.
 *   - destructive: red fill. Used sparingly — confirmation only.
 *
 * Sizing: every variant respects the 44pt minimum touch target.
 * The sm variant is 44pt tall even though its label is small;
 * padding does the work.
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  disabled,
  ...rest
}: ButtonProps) {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      {...rest}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant].container,
        fullWidth && styles.fullWidth,
        pressed && isInteractive && variantStyles[variant].pressed,
        !isInteractive && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].labelColor} />
      ) : (
        <View style={styles.content}>
          {iconLeft && <View style={styles.iconWrap}>{iconLeft}</View>}
          <Text
            style={[
              styles.label,
              { color: variantStyles[variant].labelColor },
              sizeStyles[(size + 'Label') as `${Size}Label`],
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {iconRight && <View style={styles.iconWrap}>{iconRight}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: touchTarget.min,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.button,
  },
  disabled: {
    opacity: 0.4,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  smLabel: {
    fontSize: 14,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: touchTarget.comfortable,
  },
  mdLabel: {},
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    minHeight: 52,
  },
  lgLabel: {
    fontSize: 17,
  },
});

const variantStyles: Record<
  Variant,
  { container: ViewStyle; pressed: ViewStyle; labelColor: string }
> = {
  primary: {
    container: {
      backgroundColor: colors.ink,
    },
    pressed: {
      backgroundColor: colors.inkSoft,
    },
    labelColor: colors.white,
  },
  secondary: {
    container: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.neutral200,
    },
    pressed: {
      backgroundColor: colors.neutral50,
    },
    labelColor: colors.neutral900,
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    pressed: {
      backgroundColor: colors.neutral100,
    },
    labelColor: colors.neutral900,
  },
  destructive: {
    container: {
      backgroundColor: colors.error,
    },
    pressed: {
      backgroundColor: '#DC2626',
    },
    labelColor: colors.white,
  },
};
