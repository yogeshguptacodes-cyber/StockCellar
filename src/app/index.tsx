import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, useTheme } from '@/theme';

/**
 * Temporary landing route. Replaced by the Home feature screen once the app
 * shell (tab navigation) lands. Uses raw RN primitives deliberately — the
 * design-system `Text`/`Screen` components arrive in the Design System step.
 */
export default function HomeScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[theme.typography.display, { color: theme.colors.primary }]}>
          StockCellar
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Wine & Liquor Inventory Management
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
          Foundation layer ready — feature modules arrive in upcoming steps.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
