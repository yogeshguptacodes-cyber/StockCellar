import { memo, type PropsWithChildren } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface AppCardProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Surface molecule: padded, rounded, elevated. Pressable when `onPress` given. */
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
    borderWidth: theme.mode === 'dark' ? 1 : 0,
    borderColor: theme.colors.border,
    ...theme.elevation.level1,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [surfaceStyle, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[surfaceStyle, style]}>{children}</View>;
});
