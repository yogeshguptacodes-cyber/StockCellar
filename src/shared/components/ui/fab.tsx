import type { LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AppText } from './app-text';

import { useTheme } from '@/theme';

export interface FabProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  loading?: boolean;
}

const HEIGHT = 52;
const ICON_SIZE = 20;

/**
 * Extended floating action button — the screen's single dominant action.
 * Parent positions it (usually absolute, bottom-right, clear of the tab bar).
 */
export const Fab = memo(function Fab({ icon: Icon, label, onPress, loading = false }: FabProps) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.duration(theme.motion.duration.normal)}
      exiting={FadeOutDown.duration(theme.motion.duration.fast)}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy: loading }}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: pressed ? theme.colors.primaryPressed : theme.colors.primary,
            borderRadius: theme.radius.full,
            paddingHorizontal: theme.spacing.xl,
            gap: theme.spacing.sm,
            transform: [{ scale: pressed ? 0.97 : 1 }],
            ...theme.elevation.level3,
          },
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.onPrimary} />
        ) : (
          <Icon size={ICON_SIZE} color={theme.colors.onPrimary} strokeWidth={2.25} />
        )}
        <AppText variant="bodyStrong" style={{ color: theme.colors.onPrimary }}>
          {label}
        </AppText>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  base: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
