import type { LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from './app-text';

import { useTheme, type AppTheme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  /** Render the icon after the label instead of before. */
  iconAfter?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

interface VariantColors {
  background: string;
  backgroundPressed: string;
  content: string;
  borderColor: string | null;
}

function variantColors(theme: AppTheme, variant: ButtonVariant): VariantColors {
  const { colors } = theme;
  switch (variant) {
    case 'primary':
      return {
        background: colors.primary,
        backgroundPressed: colors.primaryPressed,
        content: colors.onPrimary,
        borderColor: null,
      };
    case 'secondary':
      return {
        background: colors.surface,
        backgroundPressed: colors.surfaceMuted,
        content: colors.primary,
        borderColor: colors.borderStrong,
      };
    case 'ghost':
      return {
        background: 'transparent',
        backgroundPressed: colors.surfaceMuted,
        content: colors.primary,
        borderColor: null,
      };
    case 'danger':
      return {
        background: colors.danger,
        backgroundPressed: colors.dangerPressed,
        content: colors.textInverse,
        borderColor: null,
      };
  }
}

const SIZE_HEIGHT: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 52 };
const ICON_SIZE: Record<ButtonSize, number> = { sm: 15, md: 17, lg: 20 };
const DISABLED_OPACITY = 0.45;

export const AppButton = memo(function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconAfter = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityHint,
}: AppButtonProps) {
  const theme = useTheme();
  const colors = variantColors(theme, variant);
  const inactive = disabled || loading;

  const iconElement = Icon ? (
    <Icon size={ICON_SIZE[size]} color={colors.content} strokeWidth={2.25} />
  ) : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: SIZE_HEIGHT[size],
          backgroundColor: pressed ? colors.backgroundPressed : colors.background,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.sm,
          opacity: inactive ? DISABLED_OPACITY : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          ...(colors.borderColor
            ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderColor }
            : {}),
        },
        fullWidth && styles.fullWidth,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.content} />
      ) : (
        <View style={[styles.content, { gap: theme.spacing.sm }]}>
          {!iconAfter && iconElement}
          <AppText variant={size === 'lg' ? 'bodyStrong' : 'label'} style={{ color: colors.content }}>
            {label}
          </AppText>
          {iconAfter && iconElement}
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});
