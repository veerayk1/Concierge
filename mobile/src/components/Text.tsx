import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

import { colors, typography } from '@/design/tokens';

type Variant = keyof typeof typography;
type ColorKey =
  | 'neutral900'
  | 'neutral700'
  | 'neutral600'
  | 'neutral500'
  | 'neutral400'
  | 'ink'
  | 'white'
  | 'error'
  | 'success'
  | 'warning';

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: ColorKey;
  /** Convenience: bold weight without bumping size. */
  bold?: boolean;
}

/**
 * Text — typed wrapper around RN Text that enforces design tokens.
 *
 * Anywhere a screen would otherwise inline a fontSize, use <Text
 * variant="body" />. Anywhere a screen would inline a color, use the
 * `color` prop. This makes design-system changes a single-file diff.
 */
export function Text({ variant = 'body', color = 'neutral900', bold, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[styles[variant], { color: colors[color] }, bold && { fontWeight: '700' }, style]}
    />
  );
}

const styles = StyleSheet.create(typography);
