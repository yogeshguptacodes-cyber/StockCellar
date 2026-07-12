import { Ionicons } from '@expo/vector-icons';
import { memo, type ComponentProps } from 'react';
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
export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
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
const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 22 };
const DISABLED_OPACITY = 0.45;

export const AppButton = memo(function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityHint,
}: AppButtonProps) {
  const theme = useTheme();
  const colors = variantColors(theme, variant);
  const inactive = disabled || loading;

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
          {icon ? <Ionicons name={icon} size={ICON_SIZE[size]} color={colors.content} /> : null}
          <AppText variant={size === 'lg' ? 'bodyStrong' : 'label'} style={{ color: colors.content }}>
            {label}
          </AppText>
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
