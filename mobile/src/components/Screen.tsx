import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, RefreshControlProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/design/tokens';
import { Text } from './Text';

interface ScreenProps {
  /** Page title rendered as the h1. Matches PageShell on web. */
  title?: string;
  /** One-line description under the title. Optional. */
  description?: string;
  /** Right-aligned actions in the header — usually a single Button. */
  headerActions?: ReactNode;
  /** Children render inside the scroll view. */
  children: ReactNode;
  /** Tighten the horizontal padding for full-bleed list rows. */
  noPadding?: boolean;
  /** Disable scroll for screens with their own scrollable content (e.g. FlatList). */
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: ViewStyle;
}

/**
 * Screen — the mobile analog of the web PageShell.
 *
 * Every screen in the app should use this so the title size, the
 * description style, the safe-area handling, and the horizontal
 * gutters stay identical between screens. Drift kills polish.
 */
export function Screen({
  title,
  description,
  headerActions,
  children,
  noPadding = false,
  scroll = true,
  refreshControl,
  contentStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const header =
    title || headerActions ? (
      <View style={styles.header}>
        <View style={styles.headerText}>
          {title && (
            <Text variant="h1" style={styles.title}>
              {title}
            </Text>
          )}
          {description && (
            <Text variant="bodySmall" color="neutral500" style={styles.description}>
              {description}
            </Text>
          )}
        </View>
        {headerActions && <View style={styles.headerActions}>{headerActions}</View>}
      </View>
    ) : null;

  const padding = noPadding ? {} : { paddingHorizontal: spacing.lg };
  const content = (
    <View style={[padding, contentStyle]}>
      {header}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{content}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexShrink: 0,
  },
  title: {
    ...typography.h1,
    color: colors.neutral900,
  },
  description: {
    marginTop: spacing.xs,
  },
});
