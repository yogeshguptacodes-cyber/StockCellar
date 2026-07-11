import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './app-text';

import { useUiStore } from '@/shared/store/ui-store';
import { useTheme } from '@/theme';

/** Vertical clearance above the tab bar. */
const TAB_BAR_CLEARANCE = 56;

/**
 * Global snackbar renderer. Mounted once in the root layout; driven entirely
 * by `useUiStore` so any layer can trigger feedback without prop drilling.
 */
export function SnackbarHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const snackbar = useUiStore((state) => state.snackbar);
  const dismiss = useUiStore((state) => state.dismissSnackbar);

  if (!snackbar) {
    return null;
  }

  const handleAction = () => {
    snackbar.onAction?.();
    dismiss();
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}>
      <Animated.View
        entering={FadeInDown.duration(theme.motion.duration.normal)}
        exiting={FadeOutDown.duration(theme.motion.duration.fast)}
        style={[
          styles.snackbar,
          {
            backgroundColor: theme.mode === 'dark' ? theme.colors.surfaceElevated : theme.colors.textPrimary,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            gap: theme.spacing.lg,
            maxWidth: theme.layout.maxContentWidth - theme.spacing.xxl,
            ...theme.elevation.level3,
          },
        ]}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert">
        <AppText
          variant="label"
          style={[styles.message, { color: theme.mode === 'dark' ? theme.colors.textPrimary : theme.colors.textInverse }]}
          numberOfLines={2}>
          {snackbar.message}
        </AppText>
        {snackbar.actionLabel ? (
          <Pressable onPress={handleAction} accessibilityRole="button" hitSlop={theme.spacing.sm}>
            <AppText variant="bodyStrong" style={{ color: theme.colors.accent }}>
              {snackbar.actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  message: {
    flexShrink: 1,
  },
});
