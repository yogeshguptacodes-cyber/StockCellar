import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export interface ScreenProps {
  /** Scrollable content (default) vs fixed layouts that manage their own lists. */
  scroll?: boolean;
  /** Disable horizontal padding when content manages its own gutters. */
  padded?: boolean;
}

/**
 * Screen template: themed background, safe area, max content width, and an
 * optional scroll container. Every feature screen renders inside this.
 */
export function Screen({ scroll = true, padded = true, children }: PropsWithChildren<ScreenProps>) {
  const theme = useTheme();

  const inner = (
    <View
      style={[
        styles.inner,
        {
          maxWidth: theme.layout.maxContentWidth,
          paddingHorizontal: padded ? theme.layout.screenPaddingHorizontal : 0,
        },
      ]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: theme.spacing.xxl }]}
          keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
