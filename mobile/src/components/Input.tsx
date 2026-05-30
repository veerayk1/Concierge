import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { colors, radius, spacing, typography, touchTarget } from '@/design/tokens';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  /** Inline error message displayed under the input. */
  error?: string;
  /** Helper text under the input when there's no error. */
  helperText?: string;
  containerStyle?: ViewStyle;
}

/**
 * Input — the single text input component. Wraps RN TextInput with
 * a label, error message, and our design tokens. No styling drift
 * between login, my-account, and request-create forms.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helperText, containerStyle, style, ...rest },
  ref,
) {
  return (
    <View style={containerStyle}>
      {label && (
        <Text variant="bodySmall" color="neutral700" style={styles.label} bold>
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        {...rest}
        placeholderTextColor={colors.neutral400}
        style={[
          styles.input,
          error ? styles.inputError : null,
          rest.editable === false && styles.inputDisabled,
          style,
        ]}
      />
      {error ? (
        <Text variant="caption" color="error" style={styles.helper}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color="neutral500" style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: touchTarget.comfortable,
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.neutral900,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.neutral50,
    color: colors.neutral500,
  },
  helper: {
    marginTop: spacing.xs,
  },
});
