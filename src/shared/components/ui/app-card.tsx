import { memo, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface AppCardProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const PRESSED_SCALE = 0.98;

/**
 * Surface molecule: padded, rounded, hairline-bordered, softly elevated.
 * Pressable (with scale feedback) when `onPress` is given.
 */
export const AppCard = memo(function AppCard({
  onPress,
  style,
  accessibilityLabel,
  children,
}: PropsWithChildren<AppCardProps>) {
  const theme = useTheme();
  const surfaceStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    ...theme.elevation.level1,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          surfaceStyle,
          pressed && { transform: [{ scale: PRESSED_SCALE }], opacity: 0.92 },
          style,
        ]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[surfaceStyle, style]}>{children}</View>;
});
