import type { LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

export interface IconButtonProps {
  icon: LucideIcon;
  /** Accessibility label — required; icon-only controls must speak. */
  label: string;
  onPress: () => void;
  variant?: 'ghost' | 'tonal';
  disabled?: boolean;
}

const SIZE = 40;
const ICON_SIZE = 18;
const DISABLED_OPACITY = 0.4;

/** Square icon-only button with a full-size touch target. */
export const IconButton = memo(function IconButton({
  icon: Icon,
  label,
  onPress,
  variant = 'ghost',
  disabled = false,
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={theme.spacing.xxs}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor:
            variant === 'tonal' || pressed ? theme.colors.surfaceMuted : 'transparent',
          borderRadius: theme.radius.md,
          opacity: disabled ? DISABLED_OPACITY : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}>
      <Icon size={ICON_SIZE} color={theme.colors.textSecondary} strokeWidth={2} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
